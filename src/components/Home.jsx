import { useRef, useState } from 'react'
import {
  Copy,
  FileJson,
  FilePlus2,
  FileText,
  Layers,
  LayoutTemplate,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { uid } from '../lib/blocks.js'
import {
  cloneBlocks,
  docs,
  exportTemplateFile,
  importTemplateFile,
  restoreSeed,
  templates,
} from '../lib/storage.js'
import { toast } from '../lib/toast.js'
import AppHeader from './AppHeader.jsx'
import { Modal } from './ui.jsx'

const fmtWhen = (ts) =>
  ts
    ? new Date(ts).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''

export default function Home({ onOpen, mode, onToggleTheme }) {
  const [tpls, setTpls] = useState(() => templates.list())
  const [list, setList] = useState(() => docs.list())
  const [confirm, setConfirm] = useState(null)
  const fileRef = useRef(null)

  const refresh = () => {
    setTpls(templates.list())
    setList(docs.list())
  }

  const newDoc = (tpl) => {
    const doc = {
      id: uid(),
      name: tpl ? `${tpl.name}` : 'Cotización sin título',
      templateName: tpl?.name || null,
      blocks: tpl ? cloneBlocks(tpl.blocks) : [],
    }
    if (!docs.save(doc)) return toast('No se pudo crear: almacenamiento lleno', 'error')
    onOpen('doc', doc.id)
  }

  const newTemplate = () => {
    const t = { id: uid(), name: 'Plantilla nueva', description: '', blocks: [] }
    templates.save(t)
    onOpen('template', t.id)
  }

  const duplicateTemplate = (t) => {
    templates.save({ ...t, id: uid(), name: `${t.name} (copia)`, blocks: cloneBlocks(t.blocks) })
    refresh()
    toast('Plantilla duplicada', 'success')
  }

  const duplicateDoc = (d) => {
    docs.save({ ...d, id: uid(), name: `${d.name} (copia)`, blocks: cloneBlocks(d.blocks) })
    refresh()
  }

  const askDelete = (label, fn) =>
    setConfirm({
      label,
      run: () => {
        fn()
        setConfirm(null)
        refresh()
      },
    })

  const onImport = async (file) => {
    if (!file) return
    try {
      const t = await importTemplateFile(file)
      refresh()
      toast(`Plantilla "${t.name}" importada`, 'success')
    } catch (e) {
      toast(e.message || 'No se pudo importar', 'error')
    }
  }

  const hasSeed = tpls.some((t) => t.name.startsWith('Propuesta técnico-económica'))

  const totalBlocks = tpls.reduce((n, t) => n + t.blocks.length, 0)
  const stats = [
    { label: 'Plantillas', value: tpls.length, hint: 'estructuras reutilizables', tone: 'text-slate-900', Icon: LayoutTemplate, chip: 'bg-indigo-50 text-indigo-600' },
    { label: 'Cotizaciones guardadas', value: list.length, hint: 'en este navegador', tone: 'text-indigo-600', Icon: FileText, chip: 'bg-sky-100 text-sky-600' },
    { label: 'Bloques en plantillas', value: totalBlocks, hint: 'texto, tablas, imágenes…', tone: 'text-emerald-600', Icon: Layers, chip: 'bg-emerald-100 text-emerald-600' },
  ]

  return (
    <div className="flex h-full flex-col">
      <AppHeader mode={mode} onToggleTheme={onToggleTheme}>
        <button className="btn btn-primary btn-sm !px-3.5 !py-2" onClick={() => newDoc(null)}>
          <FilePlus2 className="size-4" /> Nueva cotización
        </button>
      </AppHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-16">
        {/* hero */}
        <section className="rise relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-ink via-ink-2 to-ink-3 p-6 text-white shadow-xl shadow-indigo-950/20 md:p-8">
          <div className="pointer-events-none absolute -top-24 -right-10 size-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 size-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-6">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-400/10 text-indigo-300">
              <Sparkles className="size-6" />
            </div>
            <div className="min-w-64 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                  Constructor de propuestas
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Arma, guarda y exporta tus cotizaciones</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/75">
                Combina bloques —texto, tablas de partidas, imágenes, descuentos—, reordénalos arrastrando, guarda la
                estructura como plantilla y exporta una proforma profesional en PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button className="btn btn-green" onClick={() => newDoc(null)}>
                <FilePlus2 className="size-4" /> Cotización en blanco
              </button>
              <button className="btn btn-dark" onClick={newTemplate}>
                <LayoutTemplate className="size-4" /> Crear plantilla
              </button>
            </div>
          </div>
        </section>

        {/* métricas */}
        <section className="mt-4 grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, hint, tone, Icon, chip }, i) => (
            <div key={label} className="card rise p-5" style={{ animationDelay: `${80 + i * 70}ms` }}>
              <div className="flex items-start justify-between">
                <span className="kicker">{label}</span>
                <span className={`grid size-8 place-items-center rounded-lg ${chip}`}>
                  <Icon className="size-4" />
                </span>
              </div>
              <p className={`mt-3 text-3xl font-extrabold tracking-tight tabular-nums ${tone}`}>{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          ))}
        </section>

        {/* plantillas */}
        <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Plantillas</h2>
            <p className="text-sm text-slate-500">Elige una para crear una cotización nueva partiendo de su estructura.</p>
          </div>
          <div className="flex gap-2">
            {!hasSeed && (
              <button
                className="btn btn-soft btn-sm"
                onClick={() => {
                  restoreSeed()
                  refresh()
                  toast('Plantilla de ejemplo restaurada', 'success')
                }}
              >
                <RotateCcw className="size-3.5" /> Restaurar ejemplo
              </button>
            )}
            <button className="btn btn-soft btn-sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" /> Importar JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                onImport(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {tpls.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-surface/60 p-10 text-center text-sm text-slate-500">
            No tienes plantillas todavía. Crea una o guarda cualquier cotización como plantilla desde el editor.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tpls.map((t, i) => (
              <article
                key={t.id}
                className="card rise group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-20 items-end bg-linear-to-br from-ink via-ink-2 to-ink-3 p-4">
                  <div className="grid size-10 place-items-center rounded-xl bg-indigo-400/15 ring-1 ring-indigo-300/40">
                    <LayoutTemplate className="size-5 text-indigo-300" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 leading-snug font-bold text-slate-900">{t.name}</h3>
                  {t.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>}
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Layers className="size-3.5" /> {t.blocks.length} bloques · {fmtWhen(t.updatedAt)}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5">
                    <button className="btn btn-primary btn-sm flex-1" onClick={() => newDoc(t)}>
                      Usar plantilla
                    </button>
                    <button className="icon-btn" title="Editar plantilla" onClick={() => onOpen('template', t.id)}>
                      <Pencil className="size-4" />
                    </button>
                    <button className="icon-btn" title="Duplicar" onClick={() => duplicateTemplate(t)}>
                      <Copy className="size-4" />
                    </button>
                    <button className="icon-btn" title="Exportar JSON" onClick={() => exportTemplateFile(t)}>
                      <FileJson className="size-4" />
                    </button>
                    <button
                      className="icon-btn icon-btn-danger"
                      title="Eliminar"
                      onClick={() => askDelete(`la plantilla "${t.name}"`, () => templates.remove(t.id))}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* cotizaciones */}
        <div className="mt-12 mb-4">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Cotizaciones recientes</h2>
          <p className="text-sm text-slate-500">Se guardan solas en este navegador mientras trabajas.</p>
        </div>
        {list.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-surface/60 p-8 text-center text-sm text-slate-500">
            Aún no hay cotizaciones. Pulsa “Usar plantilla” para crear la primera.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {list.map((d) => (
              <div key={d.id} className="enter-row flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="size-5" />
                </div>
                <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => onOpen('doc', d.id)}>
                  <p className="truncate font-semibold text-slate-900">{d.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {d.blocks.length} bloques · {fmtWhen(d.updatedAt)}
                    {d.templateName ? ` · desde “${d.templateName}”` : ''}
                  </p>
                </button>
                <button className="btn btn-soft btn-sm" onClick={() => onOpen('doc', d.id)}>
                  Abrir
                </button>
                <button className="icon-btn" title="Duplicar" onClick={() => duplicateDoc(d)}>
                  <Copy className="size-4" />
                </button>
                <button
                  className="icon-btn icon-btn-danger"
                  title="Eliminar"
                  onClick={() => askDelete(`la cotización "${d.name}"`, () => docs.remove(d.id))}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Confirmar eliminación"
        footer={
          <>
            <button className="btn btn-soft" onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <button className="btn bg-rose-600 text-white hover:bg-rose-700" onClick={confirm?.run}>
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Se eliminará {confirm?.label}. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
