import { uid } from './blocks.js'
import { getHtml, htmlToText } from './richtext.js'
import { buildSeedTemplate } from './seed.js'

const KEYS = {
  templates: 'cotizador.templates.v1',
  docs: 'cotizador.docs.v1',
  seeded: 'cotizador.seeded.v2',
  introMerged: 'cotizador.migration.intro-merged.v1',
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr))
    return true
  } catch (e) {
    console.error('localStorage lleno o bloqueado', e)
    return false
  }
}

const byDate = (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)

function makeCollection(key) {
  return {
    list: () => read(key).sort(byDate),
    get: (id) => read(key).find((x) => x.id === id) || null,
    /** Inserta o reemplaza por id. Devuelve false si el almacenamiento falló. */
    save(item) {
      const all = read(key)
      const next = { ...item, updatedAt: Date.now() }
      const i = all.findIndex((x) => x.id === item.id)
      if (i >= 0) all[i] = next
      else all.push(next)
      return write(key, all)
    },
    remove(id) {
      return write(
        key,
        read(key).filter((x) => x.id !== id),
      )
    },
  }
}

export const templates = makeCollection(KEYS.templates)
export const docs = makeCollection(KEYS.docs)

/** Copia profunda de bloques con ids nuevos (para partir de una plantilla). */
export function cloneBlocks(blocks) {
  const copy = structuredClone(blocks)
  const reid = (v) => {
    if (Array.isArray(v)) v.forEach(reid)
    else if (v && typeof v === 'object') {
      if (typeof v.id === 'string') v.id = uid()
      Object.values(v).forEach(reid)
    }
  }
  reid(copy)
  return copy
}

/** Guarda la plantilla de ejemplo, reemplazando cualquier copia anterior con el mismo nombre. */
function installSeed() {
  const seed = buildSeedTemplate()
  templates
    .list()
    .filter((t) => t.name === seed.name)
    .forEach((t) => templates.remove(t.id))
  templates.save(seed)
  return seed
}

/**
 * Une en un solo bloque los textos consecutivos de la introducción ("De nuestra
 * consideración…") que las cotizaciones antiguas tenían separados línea por línea.
 * Devuelve null si no hay nada que unir.
 */
function mergeIntro(blocks) {
  const i = blocks.findIndex(
    (b) => b.type === 'text' && htmlToText(getHtml(b.data)).startsWith('De nuestra consideración'),
  )
  if (i < 0) return null
  let j = i + 1
  while (j < blocks.length && blocks[j].type === 'text') j++
  if (j === i + 1) return null
  const html = blocks
    .slice(i, j)
    .map((b) => getHtml(b.data))
    .join('')
  return [...blocks.slice(0, i), { id: blocks[i].id, type: 'text', data: { html } }, ...blocks.slice(j)]
}

/** Migración única sobre las cotizaciones ya guardadas. */
function migrateDocs() {
  if (localStorage.getItem(KEYS.introMerged)) return
  const all = docs.list()
  let changed = 0
  for (const d of all) {
    const merged = mergeIntro(d.blocks)
    if (!merged) continue
    // se guarda con save() para conservar la estructura; se restaura la fecha original
    const updatedAt = d.updatedAt
    docs.save({ ...d, blocks: merged })
    const fresh = docs.get(d.id)
    if (fresh) {
      const arr = read(KEYS.docs).map((x) => (x.id === d.id ? { ...x, updatedAt } : x))
      write(KEYS.docs, arr)
    }
    changed++
  }
  localStorage.setItem(KEYS.introMerged, String(changed))
}

export function ensureSeed() {
  try {
    if (!localStorage.getItem(KEYS.seeded)) {
      installSeed()
      localStorage.setItem(KEYS.seeded, '1')
    }
    migrateDocs()
  } catch {
    /* sin storage: la app sigue funcionando sin persistencia */
  }
}

export const restoreSeed = installSeed

/* ---------- import / export JSON ---------- */

export function exportTemplateFile(tpl) {
  const payload = JSON.stringify(
    { app: 'cotizador', version: 1, name: tpl.name, description: tpl.description || '', blocks: tpl.blocks },
    null,
    2,
  )
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tpl.name.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, '').trim() || 'plantilla'}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function importTemplateFile(file) {
  const data = JSON.parse(await file.text())
  if (!data || !Array.isArray(data.blocks)) throw new Error('El archivo no es una plantilla válida')
  const tpl = {
    id: uid(),
    name: data.name || file.name.replace(/\.json$/i, ''),
    description: data.description || '',
    blocks: cloneBlocks(data.blocks),
  }
  if (!templates.save(tpl)) throw new Error('No hay espacio en el almacenamiento del navegador')
  return tpl
}
