import {
  Building2,
  Heading1,
  UserRound,
  Type,
  ListChecks,
  Image as ImageIcon,
  Table2,
  PenLine,
  TriangleAlert,
  SeparatorHorizontal,
  Hash,
} from 'lucide-react'

import { getHtml, htmlToText } from './richtext.js'

export const uid = () => crypto.randomUUID()
export const todayISO = () => new Date().toISOString().slice(0, 10)

/* ---------- numéricos y formato ---------- */

export const num = (v) => {
  const x = parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(x) ? x : 0
}

export const CURRENCIES = {
  USD: { symbol: '$', label: 'Dólares (USD)' },
  PEN: { symbol: 'S/', label: 'Soles (PEN)' },
  EUR: { symbol: '€', label: 'Euros (EUR)' },
}

export const fmtNumber = (n) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtMoney = (n, currency = 'USD') =>
  `${CURRENCIES[currency]?.symbol ?? '$'} ${fmtNumber(n)}`

export const fmtDateLong = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d)) return iso
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const fmtDateShort = (iso) => {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d)) return iso
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ---------- tabla de partidas ---------- */

export function calcTable(d) {
  let group = null
  let subtotal = 0
  const rows = []
  for (const r of d.rows) {
    if (r.kind === 'group') {
      group = { ...r, total: 0 }
      rows.push(group)
    } else {
      const amount = num(r.qty) * num(r.price)
      subtotal += amount
      if (group) group.total += amount
      rows.push({ ...r, amount })
    }
  }
  let running = subtotal
  const adjs = (d.adjustments || []).map((a) => {
    const base = a.kind === 'percent' ? (subtotal * num(a.value)) / 100 : num(a.value)
    const amount = a.op === 'sub' ? -base : base
    running += amount
    return { ...a, amount }
  })
  return { rows, subtotal, adjs, total: running }
}

/** Sugiere el siguiente código a partir de la fila previa (3.01 → 3.02, 3.01.03 → 3.01.04). */
export function nextCode(prev, kind) {
  if (!prev) return kind === 'group' ? '01' : '01.01'
  const code = String(prev.code || '')
  if (kind === 'group') {
    if (prev.kind === 'group') return bump(code)
    // viene de un ítem: subir un nivel
    const parts = code.split('.')
    if (parts.length > 1) return bump(parts.slice(0, -1).join('.'))
    return bump(code)
  }
  if (prev.kind === 'group') return `${code}.01`
  return bump(code)
}

function bump(code) {
  const m = code.match(/^(.*?)(\d+)$/)
  if (!m) return code
  const next = String(parseInt(m[2], 10) + 1).padStart(m[2].length, '0')
  return m[1] + next
}

/* ---------- numeración automática de secciones ---------- */

export function computeNumbers(blocks) {
  const out = {}
  let top = 0
  let sub = 0
  for (const b of blocks) {
    if (b.type === 'section') {
      if (b.data.level === 2) {
        sub += 1
        out[b.id] = { label: `${top}.${sub}`, top }
      } else {
        top += 1
        sub = 0
        out[b.id] = { label: String(top), top }
      }
    } else {
      out[b.id] = { top }
    }
  }
  return out
}

/* ---------- definición de bloques ---------- */

export const TONES = {
  sky: { chip: 'bg-sky-100 text-sky-600', dot: 'bg-sky-500' },
  indigo: { chip: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-500' },
  violet: { chip: 'bg-violet-100 text-violet-600', dot: 'bg-violet-500' },
  emerald: { chip: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
  amber: { chip: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  rose: { chip: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
  teal: { chip: 'bg-teal-100 text-teal-600', dot: 'bg-teal-500' },
  slate: { chip: 'bg-slate-200 text-slate-600', dot: 'bg-slate-500' },
  fuchsia: { chip: 'bg-fuchsia-100 text-fuchsia-600', dot: 'bg-fuchsia-500' },
}

export const BLOCK_TYPES = {
  header: {
    label: 'Encabezado',
    desc: 'Logo, empresa y datos del formato',
    icon: Building2,
    tone: 'sky',
    create: () => ({
      logo: '',
      company: 'Mi Empresa S.A.C.',
      ruc: '',
      tagline: '',
      email: '',
      showMeta: true,
      formato: '',
      fecha: todayISO(),
      rev: '0',
    }),
  },
  title: {
    label: 'Título',
    desc: 'Título grande del documento',
    icon: Heading1,
    tone: 'fuchsia',
    create: () => ({ title: 'PROPUESTA ECONÓMICA', subtitle: '' }),
  },
  fields: {
    label: 'Datos',
    desc: 'Pares etiqueta / valor (cliente, asunto…)',
    icon: UserRound,
    tone: 'violet',
    create: () => ({
      fields: [
        { id: uid(), label: 'Fecha', value: '', kind: 'date', auto: true },
        { id: uid(), label: 'Señores', value: '', kind: 'text' },
        { id: uid(), label: 'Atención', value: '', kind: 'text' },
      ],
    }),
  },
  section: {
    label: 'Sección',
    desc: 'Encabezado numerado automáticamente',
    icon: Hash,
    tone: 'indigo',
    create: () => ({ title: 'Nueva sección', level: 1 }),
  },
  text: {
    label: 'Texto',
    desc: 'Uno o varios párrafos',
    icon: Type,
    tone: 'emerald',
    create: () => ({ html: '<p></p>' }),
  },
  list: {
    label: 'Lista',
    desc: 'Viñetas, números o letras, con sangría',
    icon: ListChecks,
    tone: 'teal',
    create: () => ({ style: 'dash', items: [{ id: uid(), text: '', level: 0 }] }),
  },
  table: {
    label: 'Tabla de partidas',
    desc: 'Ítems, categorías, subtotales, descuentos e IGV',
    icon: Table2,
    tone: 'amber',
    create: () => ({
      currency: 'USD',
      subtotalLabel: 'SUBTOTAL',
      totalLabel: 'TOTAL',
      showGroupTotals: false,
      rows: [
        { id: uid(), kind: 'group', code: '01', desc: 'CATEGORÍA' },
        { id: uid(), kind: 'item', code: '01.01', desc: '', unit: 'UND', qty: '', price: '' },
      ],
      adjustments: [],
    }),
  },
  image: {
    label: 'Imagen',
    desc: 'Foto, plano, logo o tabla escaneada',
    icon: ImageIcon,
    tone: 'rose',
    create: () => ({ src: '', width: 60, align: 'left', caption: '' }),
  },
  callout: {
    label: 'Nota destacada',
    desc: 'Recuadro de aviso o aclaración',
    icon: TriangleAlert,
    tone: 'amber',
    create: () => ({ title: 'NOTA IMPORTANTE', text: '', tone: 'warning' }),
  },
  signature: {
    label: 'Firma',
    desc: 'Cierre con nombre y cargo',
    icon: PenLine,
    tone: 'slate',
    create: () => ({ closing: 'Atentamente', name: '', role: '', image: '' }),
  },
  spacer: {
    label: 'Espacio / salto',
    desc: 'Separación o salto de página',
    icon: SeparatorHorizontal,
    tone: 'slate',
    create: () => ({ kind: 'pagebreak', height: 24 }),
  },
}

export const PALETTE_ORDER = [
  'header',
  'title',
  'fields',
  'section',
  'text',
  'list',
  'table',
  'image',
  'callout',
  'signature',
  'spacer',
]

export const createBlock = (type) => ({ id: uid(), type, data: BLOCK_TYPES[type].create() })

export function blockSummary(block, numbers) {
  const d = block.data
  const clip = (s, n = 70) => {
    const t = String(s || '').replace(/\s+/g, ' ').trim()
    return t.length > n ? `${t.slice(0, n)}…` : t
  }
  switch (block.type) {
    case 'header':
      return clip(d.company)
    case 'title':
      return clip(d.title)
    case 'fields':
      return `${d.fields.length} campo${d.fields.length === 1 ? '' : 's'}`
    case 'section':
      return clip(d.title)
    case 'text':
      return clip(htmlToText(getHtml(d))) || 'Sin texto'
    case 'list': {
      const n = d.items.length
      return `${n} ítem${n === 1 ? '' : 's'}`
    }
    case 'table': {
      const n = d.rows.filter((r) => r.kind === 'item').length
      return `${n} partida${n === 1 ? '' : 's'} · ${fmtMoney(calcTable(d).total, d.currency)}`
    }
    case 'image':
      return d.caption || (d.src ? 'Imagen cargada' : 'Sin imagen')
    case 'callout':
      return clip(d.title)
    case 'signature':
      return clip(d.name) || 'Sin nombre'
    case 'spacer':
      return d.kind === 'pagebreak' ? 'Salto de página' : `Espacio de ${d.height}pt`
    default:
      return numbers ? '' : ''
  }
}

/* ---------- unidades de medida (lista fija para las tablas) ---------- */

export const UNITS = [
  { value: 'Ton', hint: 'Tonelada' },
  { value: 'UND', hint: 'Unidad' },
  { value: 'kg', hint: 'Kilogramo' },
  { value: 'm', hint: 'Metro lineal' },
  { value: 'm2', hint: 'Metro cuadrado' },
  { value: 'm3', hint: 'Metro cúbico' },
  { value: 'GLB', hint: 'Global' },
  { value: 'Pza', hint: 'Pieza' },
  { value: 'Jgo', hint: 'Juego' },
  { value: 'Hr', hint: 'Hora' },
  { value: 'Día', hint: 'Día' },
  { value: 'Mes', hint: 'Mes' },
  { value: 'Lt', hint: 'Litro' },
  { value: 'Gal', hint: 'Galón' },
  { value: '%', hint: 'Porcentaje' },
].map((u) => ({ ...u, label: u.value }))

const UNIT_ALIASES = {
  und: 'UND', unid: 'UND', unidad: 'UND', unidades: 'UND', u: 'UND',
  tn: 'Ton', ton: 'Ton', tons: 'Ton', tonelada: 'Ton', toneladas: 'Ton',
  kgs: 'kg', kilo: 'kg', kilos: 'kg',
  ml: 'm', mt: 'm', mts: 'm', metro: 'm', metros: 'm',
  'm²': 'm2', mt2: 'm2', 'm³': 'm3', mt3: 'm3',
  glob: 'GLB', global: 'GLB', gl: 'GLB', glb: 'GLB',
  pz: 'Pza', pieza: 'Pza', piezas: 'Pza', jgo: 'Jgo', juego: 'Jgo',
  h: 'Hr', hr: 'Hr', hrs: 'Hr', hora: 'Hr', horas: 'Hr',
  dia: 'Día', días: 'Día', dias: 'Día', día: 'Día', mes: 'Mes', meses: 'Mes',
  lt: 'Lt', litro: 'Lt', litros: 'Lt', gal: 'Gal', galon: 'Gal', galón: 'Gal',
}

/** Lleva lo escrito a la unidad canónica ("und" → "UND"); si no la reconoce, lo deja tal cual. */
export function normUnit(v) {
  const raw = String(v ?? '').trim()
  if (!raw) return ''
  const low = raw.toLowerCase()
  const exact = UNITS.find((u) => u.value.toLowerCase() === low)
  if (exact) return exact.value
  return UNIT_ALIASES[low] ?? raw
}

/** Opciones del desplegable; si la fila trae una unidad fuera de la lista se muestra aparte para no perderla. */
export function unitOptions(current) {
  const n = normUnit(current)
  if (n && !UNITS.some((u) => u.value === n)) {
    return [{ value: n, label: n, hint: 'Valor anterior (fuera de la lista)' }, ...UNITS]
  }
  return UNITS
}
