import { useEffect, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Copy, GripVertical, Trash2 } from 'lucide-react'
import { BLOCK_TYPES, TONES, blockSummary } from '../lib/blocks.js'
import { BlockEditor } from './editors.jsx'
import { Collapse } from './ui.jsx'

export function BlockChip({ type, className = '' }) {
  const def = BLOCK_TYPES[type]
  const Icon = def.icon
  return (
    <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${TONES[def.tone].chip} ${className}`}>
      <Icon className="size-4" />
    </div>
  )
}

export default function BlockCard({
  block,
  number,
  collapsed,
  selected,
  removing,
  onToggle,
  onSelect,
  onDuplicate,
  onDelete,
  onChange,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: 'block' },
  })
  const [confirming, setConfirming] = useState(false)
  const def = BLOCK_TYPES[block.type]

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 2500)
    return () => clearTimeout(t)
  }, [confirming])

  const isSection = block.type === 'section'

  return (
    <div
      id={`blk-${block.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onMouseDownCapture={() => onSelect(block.id)}
      onFocusCapture={() => onSelect(block.id)}
      className={`card pop ${removing ? 'leaving' : ''} ${isDragging ? 'z-10 opacity-40' : ''} ${
        selected ? 'border-indigo-300 ring-2 ring-indigo-300/60' : ''
      } ${isSection ? 'border-l-4 !border-l-sky-400' : ''}`}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          className="icon-btn cursor-grab touch-none active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
          title="Arrastrar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <BlockChip type={block.type} />

        <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => onToggle(block.id)}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">{isSection ? 'Subsección' : def.label}</span>
            {number?.label && (
              <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-bold text-sky-600">
                {number.label}
              </span>
            )}
          </div>
          <div className="truncate text-xs text-slate-400">{blockSummary(block)}</div>
        </button>

        <button className="icon-btn" title="Duplicar" onClick={() => onDuplicate(block.id)}>
          <Copy className="size-4" />
        </button>
        <button
          className={
            confirming ? 'btn btn-sm bg-rose-600 text-white hover:bg-rose-500' : 'icon-btn icon-btn-danger'
          }
          title="Eliminar"
          onClick={() => (confirming ? onDelete(block.id) : setConfirming(true))}
        >
          <Trash2 className="size-4" /> {confirming && '¿Seguro?'}
        </button>
        <button className="icon-btn" onClick={() => onToggle(block.id)} aria-label="Plegar o desplegar">
          <ChevronDown className={`size-4 transition-transform duration-300 ${collapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>

      <Collapse open={!collapsed}>
        <div className="border-t border-slate-100 p-4">
          <BlockEditor block={block} number={number} onChange={(patch) => onChange(block.id, patch)} />
        </div>
      </Collapse>
    </div>
  )
}
