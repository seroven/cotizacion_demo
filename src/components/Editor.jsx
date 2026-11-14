import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ArrowLeft,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  CloudOff,
  Download,
  Eye,
  GripVertical,
  LayoutTemplate,
  LoaderCircle,
} from 'lucide-react'
import { BLOCK_TYPES, PALETTE_ORDER, TONES, computeNumbers, createBlock, uid } from '../lib/blocks.js'
import { deriveGroups, endOfGroup, groupIdOf, groupRange } from '../lib/groups.js'
import { cloneBlocks, docs, templates } from '../lib/storage.js'
import { toast } from '../lib/toast.js'
import { buildPdfBlob, downloadBlob, slug } from '../pdf/exportPdf.js'
import { ThemeToggle } from './AppHeader.jsx'
import BlockCard, { BlockChip } from './BlockCard.jsx'
import SectionGroup, { DropLine } from './SectionGroup.jsx'
import { Field, Modal, TextInput } from './ui.jsx'

/** Entradas de la paleta: "Subsección" es una sección de nivel 2. */
const PALETTE = PALETTE_ORDER.flatMap((type) =>
  type === 'section'
    ? [
        { key: 'section', type: 'section', label: 'Sección', desc: 'Abre una sección numerada (1, 2, 3…)' },
        {
          key: 'subsection',
          type: 'section',
          level: 2,
          label: 'Subsección',
          desc: 'Título secundario dentro de una sección (2.1, 2.2…)',
        },
      ]
    : [{ key: type, type, label: BLOCK_TYPES[type].label, desc: BLOCK_TYPES[type].desc }],
)

const makeBlock = (type, level) => {
  const nb = createBlock(type)
  if (level) nb.data.level = level
  return nb
}

function PaletteItem({ entry }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${entry.key}`,
    data: { type: 'palette', blockType: entry.type, level: entry.level, label: entry.label },
  })
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title="Arrastra al documento y suéltalo donde quieras"
      className={`group flex w-full cursor-grab touch-none items-center gap-3 rounded-xl border border-transparent bg-surface px-2.5 py-2 text-left shadow-sm ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-px hover:shadow-md hover:ring-indigo-300 active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <BlockChip type={entry.type} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">{entry.label}</span>
        <span className="block truncate text-[11px] text-slate-400">{entry.desc}</span>
      </span>
      <GripVertical className="size-4 text-slate-300 transition duration-200 group-hover:text-indigo-500" />
    </button>
  )
}

export default function Editor({ kind, id, onExit, mode, onToggleTheme }) {
  const col = kind === 'template' ? templates : docs
  const [initial] = useState(() => col.get(id))

  useEffect(() => {
    if (!initial) onExit()
  }, [initial, onExit])

  if (!initial) return null
  return <EditorInner kind={kind} col={col} initial={initial} onExit={onExit} mode={mode} onToggleTheme={onToggleTheme} />
}

/** Qué contenedores pueden recibir cada tipo de arrastre. */
const collision = (args) => {
  const type = args.active.data.current?.type
  const only = (types) => args.droppableContainers.filter((c) => types.includes(c.data.current?.type))

  if (type === 'group') return closestCenter({ ...args, droppableContainers: only(['group']) })

  if (type === 'palette') {
    // el puntero manda: bloque bajo el cursor, cabecera de sección o zona vacía
    const cs = only(['block', 'zone', 'foldzone'])
    const within = pointerWithin({ ...args, droppableContainers: cs })
    return within.length ? within : closestCenter({ ...args, droppableContainers: cs })
  }

  return closestCenter({ ...args, droppableContainers: only(['block', 'zone']) })
}

/**
 * Si el bloque activo está sobre otra sección, lo reubica allí en la lista plana.
 * Devuelve la misma lista si no hay cambio de sección.
 */
function relocate(prev, a, over) {
  const from = prev.findIndex((b) => b.id === a.id)
  if (from < 0) return prev
  const fromG = groupIdOf(prev, a.id)
  let toG
  let at
  if (over.data.current?.type === 'zone') {
    toG = over.data.current.gid
    at = endOfGroup(prev, toG)
  } else {
    toG = groupIdOf(prev, over.id)
    const overIdx = prev.findIndex((b) => b.id === over.id)
    const translated = a.rect.current.translated
    const below = translated && translated.top > over.rect.top + over.rect.height / 2
    at = overIdx + (below ? 1 : 0)
  }
  if (!toG || toG === fromG) return prev
  const next = [...prev]
  const [item] = next.splice(from, 1)
  if (from < at) at -= 1
  next.splice(at, 0, item)
  return next
}

/** Dónde caería un bloque nuevo soltado sobre `over` (índice en la lista plana + cómo mostrarlo). */
function dropTarget(prev, over, a, folded) {
  const d = over.data.current
  if (d?.type === 'zone') return { kind: 'zone', gid: d.gid, index: endOfGroup(prev, d.gid) }
  if (d?.type === 'foldzone') {
    return folded.has(d.gid)
      ? { kind: 'fold', gid: d.gid, index: endOfGroup(prev, d.gid) }
      : { kind: 'start', gid: d.gid, index: groupRange(prev, d.gid)[0] + 1 }
  }
  const idx = prev.findIndex((b) => b.id === over.id)
  if (idx < 0) return null
  const t = a.rect.current.translated
  const below = t && t.top + t.height / 2 > over.rect.top + over.rect.height / 2
  return { kind: below ? 'after' : 'before', id: over.id, index: idx + (below ? 1 : 0) }
}

function EditorInner({ kind, col, initial, onExit, mode, onToggleTheme }) {
  const [name, setName] = useState(initial.name)
  const [blocks, setBlocks] = useState(initial.blocks)
  const [selectedId, setSelectedId] = useState(null)
  // cuerpos de bloque plegados (editor interno)
  const [collapsed, setCollapsed] = useState(
    () => new Set(initial.blocks.length > 8 ? initial.blocks.map((b) => b.id) : []),
  )
  // secciones plegadas (ocultan todo su contenido)
  const [folded, setFolded] = useState(() => new Set())
  const [status, setStatus] = useState('saved')
  const [active, setActive] = useState(null)
  const [indicator, setIndicator] = useState(null)
  const [preview, setPreview] = useState({ open: false, url: null, loading: false })
  const [exporting, setExporting] = useState(false)
  const [tplModal, setTplModal] = useState(false)
  const [removing, setRemoving] = useState(() => new Set())
  const pending = useRef(null)

  const numbers = useMemo(() => computeNumbers(blocks), [blocks])
  const groups = useMemo(() => deriveGroups(blocks), [blocks])
  const groupIds = useMemo(() => groups.filter((g) => g.head).map((g) => g.id), [groups])

  /* ----- autoguardado ----- */
  const latest = useRef({ name, blocks })
  latest.current = { name, blocks }
  const base = useRef({ id: initial.id, description: initial.description, templateName: initial.templateName })
  const dirty = useRef(false)

  const persist = useCallback(() => {
    const ok = col.save({ ...base.current, ...latest.current })
    setStatus(ok ? 'saved' : 'error')
    if (!ok) toast('No se pudo guardar: el almacenamiento del navegador está lleno', 'error')
    dirty.current = false
  }, [col])

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    dirty.current = true
    setStatus('saving')
    const t = setTimeout(persist, 500)
    return () => clearTimeout(t)
  }, [name, blocks, persist])

  const exit = () => {
    if (dirty.current) persist()
    onExit()
  }

  /* Tras añadir un bloque: abrir su sección si estaba plegada y llevarlo a la vista. */
  useEffect(() => {
    const id = pending.current
    if (!id) return
    const gid = groupIdOf(blocks, id)
    if (!gid) return
    pending.current = null
    setFolded((f) => {
      if (!f.has(gid)) return f
      const n = new Set(f)
      n.delete(gid)
      return n
    })
    let tries = 0
    const tick = () => {
      const el = document.getElementById(`blk-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else if (tries++ < 25) setTimeout(tick, 60)
    }
    setTimeout(tick, 120)
  }, [blocks])

  /* ----- operaciones sobre bloques ----- */
  const updateBlock = useCallback((bid, patch) => {
    setBlocks((prev) => prev.map((b) => (b.id === bid ? { ...b, data: { ...b.data, ...patch } } : b)))
  }, [])

  const insertAt = (index, nb) => {
    pending.current = nb.id
    setBlocks((prev) => {
      const next = [...prev]
      next.splice(Math.min(index, prev.length), 0, nb)
      return next
    })
    setSelectedId(nb.id)
    setCollapsed((c) => {
      const n = new Set(c)
      n.delete(nb.id)
      return n
    })
  }

  // respaldo táctil: en pantallas sin paleta lateral, añade al final del documento
  const appendBlock = (type) => insertAt(blocks.length, makeBlock(type))

  const duplicateBlock = (bid) => {
    const copyId = { v: null }
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === bid)
      if (i < 0) return prev
      const [copy] = cloneBlocks([prev[i]])
      copyId.v = copy.id
      const next = [...prev]
      next.splice(i + 1, 0, copy)
      return next
    })
    setTimeout(() => copyId.v && setSelectedId(copyId.v), 0)
  }

  const duplicateGroup = (gid) => {
    setBlocks((prev) => {
      const [s, e] = groupRange(prev, gid)
      const copy = cloneBlocks(prev.slice(s, e))
      const next = [...prev]
      next.splice(e, 0, ...copy)
      return next
    })
    toast('Sección duplicada con su contenido', 'success')
  }

  const removeIds = (idsToRemove) => {
    setRemoving((r) => new Set([...r, ...idsToRemove]))
    setTimeout(() => {
      const gone = new Set(idsToRemove)
      setBlocks((prev) => prev.filter((b) => !gone.has(b.id)))
      setRemoving((r) => {
        const n = new Set(r)
        idsToRemove.forEach((i) => n.delete(i))
        return n
      })
    }, 240)
  }

  const deleteBlock = (bid) => {
    if (selectedId === bid) setSelectedId(null)
    removeIds([bid])
  }

  const deleteGroup = (gid) => {
    const g = groups.find((x) => x.id === gid)
    if (!g) return
    setSelectedId(null)
    removeIds([gid, ...g.children.map((c) => c.id)])
  }

  const toggleBody = (bid) =>
    setCollapsed((c) => {
      const n = new Set(c)
      n.has(bid) ? n.delete(bid) : n.add(bid)
      return n
    })

  const toggleFold = (gid) =>
    setFolded((f) => {
      const n = new Set(f)
      n.has(gid) ? n.delete(gid) : n.add(gid)
      return n
    })

  const allFolded = groupIds.length > 0 && groupIds.every((g) => folded.has(g))

  /* ----- drag & drop: paleta → documento, bloques entre secciones y secciones completas ----- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = ({ active: a }) => {
    const d = a.data.current || {}
    setActive({ id: a.id, type: d.type, blockType: d.blockType, level: d.level, label: d.label })
    setIndicator(null)
  }

  const onDragOver = ({ active: a, over }) => {
    const type = a.data.current?.type
    if (type === 'palette') {
      setIndicator(over ? dropTarget(blocks, over, a, folded) : null)
      return
    }
    if (!over || type !== 'block') return
    // un bloque existente se mueve en la lista plana al cruzar a otra sección
    setBlocks((prev) => relocate(prev, a, over))
  }

  const endDrag = () => {
    setActive(null)
    setIndicator(null)
  }

  const onDragEnd = ({ active: a, over }) => {
    endDrag()
    const type = a.data.current?.type

    if (type === 'palette') {
      if (!over) return
      const target = dropTarget(blocks, over, a, folded)
      if (!target) return
      insertAt(target.index, makeBlock(a.data.current.blockType, a.data.current.level))
      return
    }

    if (!over || a.id === over.id) return

    if (type === 'group') {
      setBlocks((prev) => {
        const [pre, ...real] = deriveGroups(prev)
        const from = real.findIndex((g) => g.id === a.id)
        const to = real.findIndex((g) => g.id === over.id)
        if (from < 0 || to < 0) return prev
        return [...pre.children, ...arrayMove(real, from, to).flatMap((g) => [g.head, ...g.children])]
      })
      return
    }

    setBlocks((prev) => {
      // cruce de sección (si onDragOver no llegó a aplicarlo)
      const moved = relocate(prev, a, over)
      if (moved !== prev) return moved
      if (over.data.current?.type !== 'block') return prev
      const from = prev.findIndex((b) => b.id === a.id)
      const to = prev.findIndex((b) => b.id === over.id)
      if (from < 0 || to < 0) return prev
      return arrayMove(prev, from, to)
    })
  }

  /* ----- PDF ----- */
  const openPreview = async () => {
    setPreview({ open: true, url: null, loading: true })
    try {
      const blob = await buildPdfBlob(name, blocks)
      setPreview({ open: true, url: URL.createObjectURL(blob), loading: false })
    } catch (e) {
      console.error(e)
      toast('No se pudo generar la vista previa', 'error')
      setPreview({ open: false, url: null, loading: false })
    }
  }

  const closePreview = () => {
    if (preview.url) URL.revokeObjectURL(preview.url)
    setPreview({ open: false, url: null, loading: false })
  }

  const exportPdf = async () => {
    setExporting(true)
    try {
      downloadBlob(await buildPdfBlob(name, blocks), `${slug(name)}.pdf`)
      toast('PDF generado', 'success')
    } catch (e) {
      console.error(e)
      toast('No se pudo generar el PDF', 'error')
    } finally {
      setExporting(false)
    }
  }

  /* ----- guardar como plantilla ----- */
  const saveAsTemplate = (tplName) => {
    const existing = templates.list().find((t) => t.name.toLowerCase() === tplName.toLowerCase())
    const tpl = {
      id: existing?.id ?? uid(),
      name: tplName,
      description: existing?.description || '',
      blocks: cloneBlocks(blocks),
    }
    if (templates.save(tpl)) {
      toast(existing ? `Plantilla "${tplName}" actualizada` : `Plantilla "${tplName}" guardada`, 'success')
      setTplModal(false)
    } else toast('No se pudo guardar: almacenamiento lleno', 'error')
  }

  const activeBlock = active?.type === 'block' ? blocks.find((b) => b.id === active.id) : null
  const activeGroup = active?.type === 'group' ? groups.find((g) => g.id === active.id) : null
  const dragging = !!active && active.type !== 'group'

  const renderBlock = (b) => (
    <Fragment key={b.id}>
      {indicator?.kind === 'before' && indicator.id === b.id && <DropLine />}
      <BlockCard
        block={b}
        number={numbers[b.id]}
        collapsed={collapsed.has(b.id)}
        selected={selectedId === b.id}
        removing={removing.has(b.id)}
        onToggle={toggleBody}
        onSelect={setSelectedId}
        onDuplicate={duplicateBlock}
        onDelete={deleteBlock}
        onChange={updateBlock}
      />
      {indicator?.kind === 'after' && indicator.id === b.id && <DropLine />}
    </Fragment>
  )

  return (
    <div className="flex h-full flex-col">
      {/* barra superior */}
      <header className="z-30 border-b border-white/10 bg-ink text-white">
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
          <button className="btn btn-dark btn-sm" onClick={exit}>
            <ArrowLeft className="size-4" /> Inicio
          </button>
          <span
            className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wider uppercase ${
              kind === 'template'
                ? 'border-violet-400/30 bg-violet-400/10 text-violet-300'
                : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
            }`}
          >
            {kind === 'template' ? 'Editando plantilla' : 'Cotización'}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-48 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-bold text-white outline-none transition duration-200 hover:border-white/15 focus:border-indigo-400 focus:bg-white/5"
            aria-label="Nombre del documento"
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/55">
            {status === 'saving' && (
              <>
                <LoaderCircle className="size-3.5 animate-spin" /> Guardando…
              </>
            )}
            {status === 'saved' && (
              <>
                <Check className="size-3.5 text-emerald-400" /> Guardado
              </>
            )}
            {status === 'error' && (
              <>
                <CloudOff className="size-3.5 text-rose-400" /> Sin guardar
              </>
            )}
          </span>
          <button className="btn btn-dark btn-sm" onClick={() => setTplModal(true)}>
            <LayoutTemplate className="size-4" /> Guardar como plantilla
          </button>
          <button className="btn btn-dark btn-sm" onClick={openPreview}>
            <Eye className="size-4" /> Vista previa
          </button>
          <button className="btn btn-green btn-sm" onClick={exportPdf} disabled={exporting}>
            {exporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
            Exportar PDF
          </button>
          <ThemeToggle mode={mode} onToggle={onToggleTheme} />
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={endDrag}
      >
        <div className="flex min-h-0 flex-1">
          {/* paleta */}
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-surface/60 p-4 backdrop-blur md:block">
            <h2 className="kicker">Bloques</h2>
            <p className="mt-1 mb-3 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-500">Arrastra</span> un bloque al documento y suéltalo donde
              quieras: una línea te muestra dónde caerá. Si lo sueltas sobre una sección plegada, se abre sola.
            </p>
            <div className="space-y-1.5">
              {PALETTE.map((entry) => (
                <PaletteItem key={entry.key} entry={entry} />
              ))}
            </div>
          </aside>

          {/* lienzo */}
          <main
            className="min-w-0 flex-1 overflow-y-auto"
            onMouseDown={(e) => e.target === e.currentTarget && setSelectedId(null)}
          >
            <div className="mx-auto max-w-[1180px] space-y-3 px-5 py-6">
              <div className="flex items-center justify-between pb-1">
                <p className="text-sm font-medium text-slate-500">
                  {groupIds.length} {groupIds.length === 1 ? 'sección' : 'secciones'} · {blocks.length}{' '}
                  {blocks.length === 1 ? 'bloque' : 'bloques'}
                </p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFolded(allFolded ? new Set() : new Set(groupIds))}
                >
                  {allFolded ? <ChevronsUpDown className="size-4" /> : <ChevronsDownUp className="size-4" />}
                  {allFolded ? 'Desplegar secciones' : 'Plegar secciones'}
                </button>
              </div>

              {blocks.length === 0 && (
                <div className="rise rounded-2xl border-2 border-dashed border-slate-300 bg-surface/60 p-12 text-center">
                  <p className="text-lg font-bold text-slate-700">Lienzo vacío</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Arrastra un bloque desde la paleta de la izquierda para empezar.
                  </p>
                </div>
              )}

              <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
                {groups.map((g) => {
                  // el grupo previo a la primera sección solo se muestra si tiene contenido o mientras se arrastra
                  if (!g.head && g.children.length === 0 && !dragging) return null
                  return (
                    <SectionGroup
                      key={g.id}
                      group={g}
                      number={g.head ? numbers[g.head.id] : null}
                      folded={folded.has(g.id)}
                      selected={g.head && selectedId === g.head.id}
                      removing={g.head && removing.has(g.head.id)}
                      dragging={dragging}
                      dropHint={
                        !!g.head &&
                        (indicator?.kind === 'fold' || indicator?.kind === 'start') &&
                        indicator.gid === g.id
                      }
                      onFold={() => toggleFold(g.id)}
                      onSelect={setSelectedId}
                      onChangeHead={(patch) => g.head && updateBlock(g.head.id, patch)}
                      onDuplicate={() => duplicateGroup(g.id)}
                      onDelete={() => deleteGroup(g.id)}
                    >
                      {indicator?.kind === 'start' && indicator.gid === g.id && <DropLine />}
                      <SortableContext items={g.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                        {g.children.map(renderBlock)}
                      </SortableContext>
                    </SectionGroup>
                  )
                })}
              </SortableContext>

              {/* respaldo táctil / pantallas pequeñas */}
              <div className="flex flex-wrap gap-1.5 pt-3 md:hidden">
                {PALETTE_ORDER.map((type) => (
                  <button key={type} className="btn btn-soft btn-sm" onClick={() => appendBlock(type)}>
                    <span className={`size-2 rounded-full ${TONES[BLOCK_TYPES[type].tone].dot}`} />
                    {BLOCK_TYPES[type].label}
                  </button>
                ))}
              </div>
              <div className="h-24" />
            </div>
          </main>
        </div>

        <DragOverlay dropAnimation={{ duration: 200 }}>
          {active?.type === 'palette' && (
            <div className="card flex items-center gap-3 px-3 py-2.5 shadow-2xl ring-2 ring-indigo-400">
              <BlockChip type={active.blockType} />
              <span className="text-sm font-bold text-slate-800">{active.label}</span>
            </div>
          )}
          {activeBlock && (
            <div className="card flex items-center gap-3 px-3 py-2.5 shadow-2xl ring-2 ring-indigo-400">
              <BlockChip type={activeBlock.type} />
              <span className="text-sm font-bold text-slate-800">{BLOCK_TYPES[activeBlock.type].label}</span>
            </div>
          )}
          {activeGroup?.head && (
            <div className="card flex items-center gap-3 border-l-4 !border-l-indigo-500 px-3 py-3 shadow-2xl ring-2 ring-indigo-400">
              <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-indigo-600 px-2 text-sm font-extrabold text-white">
                {numbers[activeGroup.head.id]?.label}
              </span>
              <span className="text-sm font-bold text-slate-800 uppercase">{activeGroup.head.data.title}</span>
              <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                {activeGroup.children.length} bloques
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TemplateModal
        open={tplModal}
        onClose={() => setTplModal(false)}
        defaultName={kind === 'template' ? name : `Plantilla de ${name}`}
        onSave={saveAsTemplate}
      />

      <Modal
        open={preview.open}
        onClose={closePreview}
        title="Vista previa del PDF"
        width="max-w-5xl"
        footer={
          <>
            <button className="btn btn-soft" onClick={closePreview}>
              Cerrar
            </button>
            <button className="btn btn-primary" onClick={exportPdf} disabled={exporting}>
              <Download className="size-4" /> Descargar PDF
            </button>
          </>
        }
      >
        <div className="h-[72vh] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {preview.loading || !preview.url ? (
            <div className="grid h-full place-items-center text-sm font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" /> Generando PDF…
              </span>
            </div>
          ) : (
            <iframe title="Vista previa" src={preview.url} className="size-full" />
          )}
        </div>
      </Modal>
    </div>
  )
}

function TemplateModal({ open, onClose, defaultName, onSave }) {
  const [value, setValue] = useState(defaultName)
  useEffect(() => {
    if (open) setValue(defaultName)
  }, [open, defaultName])
  const exists = open && templates.list().some((t) => t.name.toLowerCase() === value.trim().toLowerCase())

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guardar como plantilla"
      footer={
        <>
          <button className="btn btn-soft" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!value.trim()} onClick={() => onSave(value.trim())}>
            {exists ? 'Reemplazar plantilla' : 'Guardar plantilla'}
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-500">
        Se guarda la estructura completa tal como está ahora (secciones, bloques, textos y valores). Al crear una
        cotización nueva podrás partir de ella.
      </p>
      <Field label="Nombre de la plantilla">
        <TextInput
          autoFocus
          value={value}
          onChange={setValue}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSave(value.trim())}
        />
      </Field>
      {exists && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Ya existe una plantilla con ese nombre; se reemplazará.
        </p>
      )}
    </Modal>
  )
}
