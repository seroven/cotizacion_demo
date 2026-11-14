import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ImageIcon, Upload, X, Check, TriangleAlert, Info } from 'lucide-react'
import { fileToDataURL } from '../lib/image.js'
import { subscribeToasts, toast } from '../lib/toast.js'

export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
    </div>
  )
}

export function TextInput({ value, onChange, className = '', ...props }) {
  return (
    <input
      className={`input ${className}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  )
}

export function TextArea({ value, onChange, minRows = 2, className = '', ...props }) {
  const ref = useRef(null)
  const fit = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }
  useLayoutEffect(fit, [value])
  return (
    <textarea
      ref={ref}
      rows={minRows}
      className={`input ${className}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  )
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      className={`input cursor-pointer pr-8 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-[#fff] shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
      {label}
    </label>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded-[10px] px-3 py-1.5 text-xs font-semibold transition ${
            value === o.value ? 'bg-surface text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ImagePicker({ value, onChange, label = 'Imagen', compact = false }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      onChange(await fileToDataURL(file))
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pick(e.dataTransfer.files?.[0])
        }}
        className={`flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-2.5 ${compact ? '' : 'min-h-24'}`}
      >
        <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-[#fff]">
          {value ? (
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageIcon className="size-6 text-slate-300" />
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <button type="button" className="btn btn-soft btn-sm" onClick={() => inputRef.current?.click()}>
            <Upload className="size-3.5" /> {busy ? 'Cargando…' : value ? 'Cambiar' : 'Subir imagen'}
          </button>
          {value && (
            <button type="button" className="text-xs font-medium text-rose-500 hover:underline" onClick={() => onChange('')}>
              Quitar
            </button>
          )}
          {!value && <span className="text-xs text-slate-400">o arrástrala aquí</span>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className={`pop card w-full ${width} p-0 shadow-2xl shadow-slate-900/20`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Toaster() {
  const [items, setItems] = useState([])
  useEffect(
    () =>
      subscribeToasts((t) => {
        setItems((prev) => [...prev, t])
        setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3500)
      }),
    [],
  )
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-white/10"
        >
          {t.tone === 'error' ? (
            <TriangleAlert className="size-4 text-rose-400" />
          ) : t.tone === 'success' ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Info className="size-4 text-sky-400" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  )
}

/** Contenedor que se pliega/despliega animando la altura (monta el contenido solo mientras hace falta). */
export function Collapse({ open, children, className = '' }) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(open)
  const [settled, setSettled] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      let t
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setShown(true)
          t = setTimeout(() => setSettled(true), 330)
        }),
      )
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(t)
      }
    }
    setSettled(false)
    setShown(false)
    const t = setTimeout(() => setMounted(false), 330)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        shown ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      } ${className}`}
    >
      <div className={`min-h-0 ${settled ? '' : 'overflow-hidden'}`}>{children}</div>
    </div>
  )
}
