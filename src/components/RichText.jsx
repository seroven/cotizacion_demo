import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import { Collapse, Select } from './ui.jsx'

const COLORS = [
  { value: '#0f172a', label: 'Negro' },
  { value: '#64748b', label: 'Gris' },
  { value: '#dc2626', label: 'Rojo' },
  { value: '#ea580c', label: 'Naranja' },
  { value: '#16a34a', label: 'Verde' },
  { value: '#2563eb', label: 'Azul' },
  { value: '#7c3aed', label: 'Violeta' },
]

function Btn({ active, onClick, label, children, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={!!active}
      disabled={disabled}
      // evita que el botón robe el foco/selección del editor
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg transition duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-30 ${
        active ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />

function ColorMenu({ editor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = editor.getAttributes('textStyle').color

  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Btn label="Color de texto" active={open || !!current} onClick={() => setOpen((o) => !o)}>
        <span className="flex flex-col items-center leading-none">
          <Baseline className="size-4" />
          <span className="-mt-0.5 h-[3px] w-4 rounded-full" style={{ background: current || 'currentColor' }} />
        </span>
      </Btn>
      <div className="absolute top-full left-0 z-30 mt-1">
        <Collapse open={open}>
          <div className="pop card flex items-center gap-1.5 p-2 shadow-xl">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                aria-label={c.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setColor(c.value).run()
                  setOpen(false)
                }}
                className={`size-6 cursor-pointer rounded-full border-2 transition duration-150 hover:scale-110 ${
                  current === c.value ? 'border-indigo-500' : 'border-white/70 dark:border-slate-600'
                }`}
                style={{ background: c.value }}
              />
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetColor().run()
                setOpen(false)
              }}
              className="ml-1 cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
            >
              Quitar
            </button>
          </div>
        </Collapse>
      </div>
    </div>
  )
}

function headingValue(editor) {
  for (const l of [1, 2, 3]) if (editor.isActive('heading', { level: l })) return String(l)
  return '0'
}

function Toolbar({ editor }) {
  const ch = () => editor.chain().focus()
  const align = (v) => editor.isActive({ textAlign: v })

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/70 px-1.5 py-1">
      <Btn label="Deshacer (Ctrl+Z)" onClick={() => ch().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 className="size-4" />
      </Btn>
      <Btn label="Rehacer (Ctrl+Y)" onClick={() => ch().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 className="size-4" />
      </Btn>
      <Sep />

      <Select
        variant="ghost"
        aria-label="Estilo de párrafo"
        value={headingValue(editor)}
        onChange={(v) => {
          const l = Number(v)
          l ? ch().setHeading({ level: l }).run() : ch().setParagraph().run()
        }}
        options={[
          { value: '0', label: 'Texto normal' },
          { value: '1', label: 'Título 1', hint: 'Grande' },
          { value: '2', label: 'Título 2', hint: 'Mediano' },
          { value: '3', label: 'Título 3', hint: 'Pequeño' },
        ]}
      />
      <Sep />

      <Btn label="Negrita (Ctrl+B)" active={editor.isActive('bold')} onClick={() => ch().toggleBold().run()}>
        <Bold className="size-4" />
      </Btn>
      <Btn label="Cursiva (Ctrl+I)" active={editor.isActive('italic')} onClick={() => ch().toggleItalic().run()}>
        <Italic className="size-4" />
      </Btn>
      <Btn label="Subrayado (Ctrl+U)" active={editor.isActive('underline')} onClick={() => ch().toggleUnderline().run()}>
        <Underline className="size-4" />
      </Btn>
      <Btn label="Tachado" active={editor.isActive('strike')} onClick={() => ch().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </Btn>
      <ColorMenu editor={editor} />
      <Sep />

      <Btn label="Alinear a la izquierda" active={align('left')} onClick={() => ch().setTextAlign('left').run()}>
        <AlignLeft className="size-4" />
      </Btn>
      <Btn label="Centrar" active={align('center')} onClick={() => ch().setTextAlign('center').run()}>
        <AlignCenter className="size-4" />
      </Btn>
      <Btn label="Alinear a la derecha" active={align('right')} onClick={() => ch().setTextAlign('right').run()}>
        <AlignRight className="size-4" />
      </Btn>
      <Btn label="Justificar" active={align('justify')} onClick={() => ch().setTextAlign('justify').run()}>
        <AlignJustify className="size-4" />
      </Btn>
      <Sep />

      <Btn label="Lista con viñetas" active={editor.isActive('bulletList')} onClick={() => ch().toggleBulletList().run()}>
        <List className="size-4" />
      </Btn>
      <Btn label="Lista numerada" active={editor.isActive('orderedList')} onClick={() => ch().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </Btn>
      <Sep />

      <Btn
        label="Quitar formato"
        onClick={() => ch().unsetAllMarks().clearNodes().unsetTextAlign().run()}
      >
        <RemoveFormatting className="size-4" />
      </Btn>
    </div>
  )
}

export default function RichText({ html, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'left' }),
      TextStyle,
      Color,
    ],
    content: html,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: 'rt-content', spellcheck: 'true' } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  })

  if (!editor) return null
  return (
    <div className="rt overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm transition duration-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
