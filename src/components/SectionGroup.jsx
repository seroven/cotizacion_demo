import { useEffect, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Copy, CornerDownRight, GripVertical, Trash2 } from 'lucide-react'
import { PRE } from '../lib/groups.js'
import { Collapse } from './ui.jsx'

/** Línea que marca dónde caerá el bloque que se está arrastrando desde la paleta. */
export function DropLine() {
  return <div className="drop-line" aria-hidden />
}

function EmptyZone({ gid, dragging }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${gid}`, data: { type: 'zone', gid } })
  return (
    <div
      ref={setNodeRef}
      className={`grid place-items-center rounded-xl border-2 border-dashed px-4 text-center text-xs font-medium transition-all duration-200 ${
        isOver
          ? 'h-20 border-indigo-400 bg-indigo-50 text-indigo-600'
          : dragging
            ? 'h-16 border-indigo-300 text-indigo-500'
            : 'h-14 border-slate-200 text-slate-400'
      }`}
    >
      {dragging ? 'Suelta aquí para añadirlo a esta sección' : 'Sección vacía: arrastra un bloque desde la paleta'}
    </div>
  )
}

/** Contenedor de una sección de primer nivel (o del grupo previo a la primera sección). */
export default function SectionGroup({
  group,
  number,
  folded,
  selected,
  removing,
  dragging,
  dropHint,
  onFold,
  onSelect,
  onChangeHead,
  onDuplicate,
  onDelete,
  children,
}) {
  const isPre = group.id === PRE
  const head = group.head
  const [confirming, setConfirming] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    data: { type: 'group' },
    disabled: isPre,
  })
  // la cabecera también es zona de suelta: sección plegada → al final; desplegada → al principio
  const { setNodeRef: setHeadRef } = useDroppable({
    id: `fold:${group.id}`,
    data: { type: 'foldzone', gid: group.id },
    disabled: isPre,
  })

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 2800)
    return () => clearTimeout(t)
  }, [confirming])

  const n = group.children.length

  const body = (
    <div className={isPre ? 'space-y-2.5' : 'space-y-2.5 border-t border-slate-100 bg-slate-50/60 p-3 pl-4'}>
      {n === 0 ? <EmptyZone gid={group.id} dragging={dragging} /> : children}
    </div>
  )

  if (isPre) {
    return (
      <section className="rise space-y-2.5">
        <p className="kicker pt-1 pl-1">Portada y datos generales · antes de la primera sección</p>
        {body}
      </section>
    )
  }

  return (
    <section
      id={`blk-${head.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card pop overflow-hidden border-l-4 !border-l-indigo-500 ${removing ? 'leaving' : ''} ${
        isDragging ? 'z-10 opacity-40' : ''
      } ${selected ? 'ring-2 ring-indigo-300/60' : ''} ${dropHint ? '!border-indigo-400 ring-4 ring-indigo-300/50' : ''}`}
    >
      <div
        ref={setHeadRef}
        className={`flex items-center gap-2 px-2 py-2.5 transition-colors duration-200 ${dropHint ? 'bg-indigo-50' : ''}`}
        onMouseDownCapture={() => onSelect(head.id)}
      >
        <button
          className="icon-btn cursor-grab touch-none active:cursor-grabbing"
          aria-label="Arrastrar la sección completa"
          title="Arrastrar la sección completa"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <span className="grid h-8 min-w-8 shrink-0 place-items-center rounded-lg bg-indigo-600 px-2 text-sm font-extrabold text-white shadow-sm shadow-indigo-600/30">
          {number?.label}
        </span>

        <input
          value={head.data.title}
          onChange={(e) => onChangeHead({ title: e.target.value })}
          placeholder="Título de la sección"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[15px] font-bold tracking-tight text-slate-900 uppercase outline-none transition duration-200 placeholder:font-normal placeholder:normal-case hover:border-slate-200 focus:border-indigo-400 focus:bg-surface"
        />

        {dropHint && (
          <span className="shrink-0 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">
            {folded ? 'Soltar: al final de la sección' : 'Soltar: al inicio de la sección'}
          </span>
        )}

        <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline">
          {n} {n === 1 ? 'bloque' : 'bloques'}
        </span>

        <button
          className="icon-btn"
          title="Convertir en subsección (se une a la sección anterior)"
          onClick={() => onChangeHead({ level: 2 })}
        >
          <CornerDownRight className="size-4" />
        </button>
        <button className="icon-btn" title="Duplicar sección con su contenido" onClick={onDuplicate}>
          <Copy className="size-4" />
        </button>
        <button
          className={confirming ? 'btn btn-sm bg-rose-600 text-white hover:bg-rose-500' : 'icon-btn icon-btn-danger'}
          title="Eliminar sección y su contenido"
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
        >
          <Trash2 className="size-4" />
          {confirming && (n ? `¿Borrar con ${n}?` : '¿Seguro?')}
        </button>
        <button className="icon-btn" onClick={onFold} aria-label="Plegar o desplegar sección">
          <ChevronDown className={`size-4 transition-transform duration-300 ${folded ? '-rotate-90' : ''}`} />
        </button>
      </div>

      <Collapse open={!folded}>{body}</Collapse>
    </section>
  )
}
