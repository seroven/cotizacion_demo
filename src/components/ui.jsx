import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageIcon, Upload, X, Check, ChevronDown, Search, TriangleAlert, Info } from 'lucide-react'
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

const MENU_H = 44
const LIST_MAX = 208 // alto máximo de la lista (≈ 5 filas); si hay más, scroll interno
const SEARCH_H = 52

const fold = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Desplegable propio (en lugar del <select> nativo): menú en portal con alto máximo,
 * animado, con teclado (↑ ↓ Enter Esc), tema claro/oscuro, texto de ayuda y
 * buscador opcional (`searchable`).
 * options: [{ value, label, hint? }]
 */
export function Select({
  value,
  onChange,
  options,
  className = '',
  variant = 'field',
  compact = false,
  searchable = false,
  ...rest
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState(null)
  const [hi, setHi] = useState(0)
  const [query, setQuery] = useState('')
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const itemRefs = useRef([])
  const current = options.find((o) => o.value === value)
  const ghost = variant === 'ghost'

  const q = fold(query.trim())
  const shown = searchable && q ? options.filter((o) => fold(`${o.label} ${o.hint || ''}`).includes(q)) : options

  const close = () => {
    setOpen(false)
    setTimeout(() => setMounted(false), 140)
  }

  const openMenu = () => {
    const r = btnRef.current.getBoundingClientRect()
    const extra = searchable ? SEARCH_H : 0
    const need = Math.min(LIST_MAX, options.length * MENU_H + 8) + extra + 10
    const below = window.innerHeight - r.bottom
    const up = below < need + 12 && r.top > below
    const width = Math.max(r.width, 200)
    const avail = (up ? r.top : below) - 20
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
      minWidth: width,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
      listMax: Math.max(120, Math.min(LIST_MAX, avail - extra)),
      origin: up ? 'bottom' : 'top',
    })
    setQuery('')
    const idx = options.findIndex((o) => o.value === value)
    setHi(idx >= 0 ? idx : 0)
    setMounted(true)
    setOpen(true)
  }

  const choose = (o) => {
    onChange(o.value)
    close()
    if (!ghost) btnRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) close()
    }
    const onScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) close()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // el buscador toma el foco al abrir
  useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open, searchable])

  useEffect(() => {
    if (open) itemRefs.current[hi]?.scrollIntoView({ block: 'nearest' })
  }, [hi, open])

  const onKey = (e) => {
    const inInput = e.target.tagName === 'INPUT'
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openMenu()
      }
      return
    }
    const last = shown.length - 1
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      btnRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(last, h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(0, h - 1))
    } else if (!inInput && e.key === 'Home') {
      e.preventDefault()
      setHi(0)
    } else if (!inInput && e.key === 'End') {
      e.preventDefault()
      setHi(last)
    } else if (e.key === 'Enter' || (!inInput && e.key === ' ')) {
      e.preventDefault()
      if (shown[hi]) choose(shown[hi])
    } else if (e.key === 'Tab') close()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKey}
        // en la barra del editor de texto no se debe robar el foco/selección
        onMouseDown={ghost ? (e) => e.preventDefault() : undefined}
        className={
          ghost
            ? `flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 transition duration-150 hover:bg-slate-100 ${open ? 'bg-slate-100' : ''} ${className}`
            : `input flex cursor-pointer items-center justify-between gap-1.5 text-left ${compact ? '!px-2' : '!pr-2.5'} ${
                open ? '!border-indigo-400 !ring-4 !ring-indigo-100' : ''
              } ${className}`
        }
        {...rest}
      >
        <span className="min-w-0 flex-1 truncate">{current?.label ?? (value || '')}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              minWidth: pos.minWidth,
              transformOrigin: `${pos.origin} left`,
            }}
            className={`${open ? 'menu-in' : 'menu-out'} fixed z-[80] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface p-1 shadow-2xl shadow-slate-900/20`}
          >
            {searchable && (
              <div className="relative shrink-0 p-1 pb-1.5">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-[55%] text-slate-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setHi(0)
                  }}
                  onKeyDown={onKey}
                  placeholder="Buscar…"
                  aria-label="Buscar"
                  className="input !rounded-lg !py-1.5 !pl-8 !text-xs"
                />
              </div>
            )}
            <div role="listbox" className="min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: pos.listMax }}>
              {shown.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-slate-400">Sin resultados para “{query}”</p>
              )}
              {shown.map((o, i) => (
                <div
                  key={o.value}
                  ref={(el) => (itemRefs.current[i] = el)}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => choose(o)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors duration-100 ${
                    i === hi ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                  } ${o.value === value ? 'font-semibold' : ''}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-[11px] font-normal text-slate-400">{o.hint}</span>}
                  </span>
                  {o.value === value && <Check className="size-4 shrink-0 text-indigo-600" />}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
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
