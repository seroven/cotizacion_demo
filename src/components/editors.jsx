import {
  ArrowDown,
  ArrowUp,
  ChevronsRight,
  Percent,
  Plus,
  Tag,
  Trash2,
  Layers,
} from 'lucide-react'
import {
  CURRENCIES,
  calcTable,
  fmtMoney,
  nextCode,
  uid,
} from '../lib/blocks.js'
import RichText from './RichText.jsx'
import { getHtml } from '../lib/richtext.js'
import { Field, ImagePicker, Segmented, Select, TextArea, TextInput, Toggle } from './ui.jsx'

const move = (arr, i, dir) => {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

const patchAt = (arr, id, patch) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x))

function RowTools({ index, total, onMove, onRemove, extra }) {
  return (
    <div className="flex shrink-0 items-center">
      {extra}
      <button className="icon-btn !size-7" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">
        <ArrowUp className="size-3.5" />
      </button>
      <button className="icon-btn !size-7" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Bajar">
        <ArrowDown className="size-3.5" />
      </button>
      <button className="icon-btn icon-btn-danger !size-7" onClick={onRemove} aria-label="Eliminar">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function HeaderEditor({ data, onChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <ImagePicker label="Logo" value={data.logo} onChange={(v) => onChange({ logo: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Empresa" className="sm:col-span-2">
          <TextInput value={data.company} onChange={(v) => onChange({ company: v })} />
        </Field>
        <Field label="RUC / ID fiscal">
          <TextInput value={data.ruc} onChange={(v) => onChange({ ruc: v })} />
        </Field>
        <Field label="Correo de contacto">
          <TextInput value={data.email} onChange={(v) => onChange({ email: v })} />
        </Field>
        <Field label="Giro / descripción" className="sm:col-span-2">
          <TextInput value={data.tagline} onChange={(v) => onChange({ tagline: v })} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Toggle
          checked={data.showMeta}
          onChange={(v) => onChange({ showMeta: v })}
          label="Mostrar cuadro de formato (código, fecha, revisión)"
        />
        {data.showMeta && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Código de formato">
              <TextInput value={data.formato} onChange={(v) => onChange({ formato: v })} />
            </Field>
            <Field label="Fecha">
              <TextInput type="date" value={data.fecha} onChange={(v) => onChange({ fecha: v })} />
            </Field>
            <Field label="Revisión">
              <TextInput value={data.rev} onChange={(v) => onChange({ rev: v })} />
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}

function TitleEditor({ data, onChange }) {
  return (
    <div className="grid gap-3">
      <Field label="Título">
        <TextInput value={data.title} onChange={(v) => onChange({ title: v })} className="!text-base !font-bold" />
      </Field>
      <Field label="Subtítulo / código de documento">
        <TextInput value={data.subtitle} onChange={(v) => onChange({ subtitle: v })} />
      </Field>
    </div>
  )
}

const FIELD_KINDS = [
  { value: 'text', label: 'Texto' },
  { value: 'long', label: 'Texto largo' },
  { value: 'date', label: 'Fecha' },
]

function FieldsEditor({ data, onChange }) {
  const set = (fields) => onChange({ fields })
  return (
    <div className="space-y-2">
      {data.fields.map((f, i) => (
        <div key={f.id} className="enter-row flex items-start gap-2 rounded-xl bg-slate-50/80 p-2">
          <TextInput
            className="!w-36 shrink-0 !font-semibold"
            placeholder="Etiqueta"
            value={f.label}
            onChange={(v) => set(patchAt(data.fields, f.id, { label: v }))}
          />
          <div className="min-w-0 flex-1">
            {f.kind === 'date' ? (
              <div className="flex items-center gap-3">
                <TextInput
                  type="date"
                  disabled={f.auto}
                  value={f.value}
                  onChange={(v) => set(patchAt(data.fields, f.id, { value: v }))}
                  className="!w-44 disabled:opacity-40"
                />
                <Toggle
                  checked={!!f.auto}
                  onChange={(v) => set(patchAt(data.fields, f.id, { auto: v }))}
                  label="Fecha de hoy automática"
                />
              </div>
            ) : f.kind === 'long' ? (
              <TextArea
                minRows={1}
                placeholder="Valor"
                value={f.value}
                onChange={(v) => set(patchAt(data.fields, f.id, { value: v }))}
              />
            ) : (
              <TextInput
                placeholder="Valor"
                value={f.value}
                onChange={(v) => set(patchAt(data.fields, f.id, { value: v }))}
              />
            )}
          </div>
          <Select
            className="!w-32 shrink-0"
            value={f.kind}
            options={FIELD_KINDS}
            onChange={(v) => set(patchAt(data.fields, f.id, { kind: v }))}
          />
          <RowTools
            index={i}
            total={data.fields.length}
            onMove={(d) => set(move(data.fields, i, d))}
            onRemove={() => set(data.fields.filter((x) => x.id !== f.id))}
          />
        </div>
      ))}
      <button
        className="btn btn-soft btn-sm"
        onClick={() => set([...data.fields, { id: uid(), label: 'Nuevo campo', value: '', kind: 'text' }])}
      >
        <Plus className="size-3.5" /> Añadir campo
      </button>
    </div>
  )
}

function SectionEditor({ data, onChange, number }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="Título" className="min-w-64 flex-1">
        <TextInput value={data.title} onChange={(v) => onChange({ title: v })} className="!font-semibold" />
      </Field>
      <Field label="Nivel">
        <Segmented
          value={String(data.level)}
          onChange={(v) => onChange({ level: Number(v) })}
          options={[
            { value: '1', label: 'Sección' },
            { value: '2', label: 'Subsección' },
          ]}
        />
      </Field>
      <div className="mb-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
        Numeración automática: {number?.label ?? '—'}
      </div>
    </div>
  )
}

function TextEditor({ data, onChange }) {
  return <RichText html={getHtml(data)} onChange={(html) => onChange({ html })} />
}

const LIST_STYLES = [
  { value: 'dash', label: 'Guiones  –' },
  { value: 'bullet', label: 'Viñetas  •' },
  { value: 'number', label: 'Números  1.' },
  { value: 'letter', label: 'Letras  a.' },
  { value: 'sectionnum', label: 'Sección  2.1' },
]

function ListEditor({ data, onChange }) {
  const set = (items) => onChange({ items })
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="label !mb-0">Estilo</span>
        <Select className="!w-44" value={data.style} options={LIST_STYLES} onChange={(v) => onChange({ style: v })} />
      </div>
      {data.items.map((it, i) => (
        <div
          key={it.id}
          className="enter-row flex items-start gap-2 rounded-xl bg-slate-50/80 p-2"
          style={{ marginLeft: it.level * 28 }}
        >
          <div className="min-w-0 flex-1">
            <TextArea
              minRows={1}
              placeholder="Texto del ítem"
              value={it.text}
              onChange={(v) => set(patchAt(data.items, it.id, { text: v }))}
            />
          </div>
          <RowTools
            index={i}
            total={data.items.length}
            onMove={(d) => set(move(data.items, i, d))}
            onRemove={() => set(data.items.filter((x) => x.id !== it.id))}
            extra={
              <button
                className={`icon-btn !size-7 ${it.level ? '!bg-indigo-50 !text-indigo-600' : ''}`}
                title="Sangría (sub-ítem)"
                onClick={() => set(patchAt(data.items, it.id, { level: it.level ? 0 : 1 }))}
              >
                <ChevronsRight className="size-3.5" />
              </button>
            }
          />
        </div>
      ))}
      <button
        className="btn btn-soft btn-sm"
        onClick={() => set([...data.items, { id: uid(), text: '', level: data.items.at(-1)?.level ?? 0 }])}
      >
        <Plus className="size-3.5" /> Añadir ítem
      </button>
    </div>
  )
}

/* ---------------------------- tabla ---------------------------- */

const COLS = 'grid grid-cols-[84px_minmax(220px,1fr)_64px_84px_96px_116px_88px] items-start gap-1.5'

function TableEditor({ data, onChange }) {
  const calc = calcTable(data)
  const calcById = Object.fromEntries(calc.rows.map((r) => [r.id, r]))
  const setRows = (rows) => onChange({ rows })
  const setAdjs = (adjustments) => onChange({ adjustments })

  const addRow = (kind) => {
    const prev = data.rows.at(-1)
    const row =
      kind === 'group'
        ? { id: uid(), kind, code: nextCode(prev, 'group'), desc: 'NUEVA CATEGORÍA' }
        : { id: uid(), kind, code: nextCode(prev, 'item'), desc: '', unit: prev?.unit || 'und', qty: '', price: '' }
    setRows([...data.rows, row])
  }

  const money = (n) => fmtMoney(n, data.currency)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Moneda">
          <Select
            value={data.currency}
            onChange={(v) => onChange({ currency: v })}
            options={Object.entries(CURRENCIES).map(([value, c]) => ({ value, label: c.label }))}
          />
        </Field>
        <Field label="Etiqueta del subtotal" className="sm:col-span-2">
          <TextInput value={data.subtotalLabel} onChange={(v) => onChange({ subtotalLabel: v })} />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[760px]">
          <div className={`${COLS} bg-ink px-2 py-2 text-[10px] font-bold tracking-wider text-white uppercase`}>
            <span>Código</span>
            <span>Descripción</span>
            <span>U.M.</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">Costo unit.</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {data.rows.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Aún no hay partidas.</p>
          )}

          {data.rows.map((r, i) => {
            const tools = (
              <RowTools
                index={i}
                total={data.rows.length}
                onMove={(d) => setRows(move(data.rows, i, d))}
                onRemove={() => setRows(data.rows.filter((x) => x.id !== r.id))}
              />
            )
            if (r.kind === 'group') {
              return (
                <div key={r.id} className={`enter-row ${COLS} border-t border-slate-200 bg-indigo-50/70 px-2 py-1.5`}>
                  <TextInput
                    className="!font-bold"
                    value={r.code}
                    onChange={(v) => setRows(patchAt(data.rows, r.id, { code: v }))}
                  />
                  <TextInput
                    className="!font-bold"
                    value={r.desc}
                    onChange={(v) => setRows(patchAt(data.rows, r.id, { desc: v }))}
                  />
                  <span className="col-span-3 flex items-center justify-end gap-1 pt-2 text-[11px] font-semibold text-indigo-500 uppercase">
                    <Layers className="size-3" /> Categoría
                  </span>
                  <span className="pt-2 text-right text-sm font-bold text-indigo-700 tabular-nums">
                    {data.showGroupTotals ? money(calcById[r.id].total) : ''}
                  </span>
                  {tools}
                </div>
              )
            }
            return (
              <div key={r.id} className={`enter-row ${COLS} border-t border-slate-100 px-2 py-1.5`}>
                <TextInput value={r.code} onChange={(v) => setRows(patchAt(data.rows, r.id, { code: v }))} />
                <TextArea
                  minRows={1}
                  value={r.desc}
                  placeholder="Descripción de la partida"
                  onChange={(v) => setRows(patchAt(data.rows, r.id, { desc: v }))}
                />
                <TextInput value={r.unit} onChange={(v) => setRows(patchAt(data.rows, r.id, { unit: v }))} />
                <TextInput
                  className="text-right tabular-nums"
                  inputMode="decimal"
                  placeholder="0"
                  value={r.qty}
                  onChange={(v) => setRows(patchAt(data.rows, r.id, { qty: v }))}
                />
                <TextInput
                  className="text-right tabular-nums"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={r.price}
                  onChange={(v) => setRows(patchAt(data.rows, r.id, { price: v }))}
                />
                <span className="pt-2 text-right text-sm font-semibold text-slate-700 tabular-nums">
                  {money(calcById[r.id].amount)}
                </span>
                {tools}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-soft btn-sm" onClick={() => addRow('item')}>
          <Plus className="size-3.5" /> Partida
        </button>
        <button className="btn btn-soft btn-sm" onClick={() => addRow('group')}>
          <Layers className="size-3.5" /> Categoría
        </button>
        <div className="ml-auto">
          <Toggle
            checked={data.showGroupTotals}
            onChange={(v) => onChange({ showGroupTotals: v })}
            label="Subtotal por categoría"
          />
        </div>
      </div>

      {/* ajustes: descuentos, IGV, etc. */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-700">Descuentos, impuestos y otros ajustes</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              className="btn btn-soft btn-sm"
              onClick={() => setAdjs([...data.adjustments, { id: uid(), label: 'IGV 18%', kind: 'percent', op: 'add', value: '18' }])}
            >
              <Percent className="size-3.5" /> IGV 18%
            </button>
            <button
              className="btn btn-soft btn-sm"
              onClick={() => setAdjs([...data.adjustments, { id: uid(), label: 'Descuento', kind: 'percent', op: 'sub', value: '5' }])}
            >
              <Tag className="size-3.5" /> Descuento
            </button>
            <button
              className="btn btn-soft btn-sm"
              onClick={() => setAdjs([...data.adjustments, { id: uid(), label: 'Otro cargo', kind: 'fixed', op: 'add', value: '0' }])}
            >
              <Plus className="size-3.5" /> Otro
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {data.adjustments.map((a, i) => (
            <div key={a.id} className="enter-row flex flex-wrap items-center gap-1.5">
              <TextInput
                className="!w-48 min-w-32 flex-1"
                value={a.label}
                onChange={(v) => setAdjs(patchAt(data.adjustments, a.id, { label: v }))}
              />
              <Select
                className="!w-24"
                value={a.op}
                options={[
                  { value: 'add', label: '+ Suma' },
                  { value: 'sub', label: '− Resta' },
                ]}
                onChange={(v) => setAdjs(patchAt(data.adjustments, a.id, { op: v }))}
              />
              <Select
                className="!w-28"
                value={a.kind}
                options={[
                  { value: 'percent', label: '% del subt.' },
                  { value: 'fixed', label: 'Monto fijo' },
                ]}
                onChange={(v) => setAdjs(patchAt(data.adjustments, a.id, { kind: v }))}
              />
              <TextInput
                className="!w-24 text-right tabular-nums"
                inputMode="decimal"
                value={a.value}
                onChange={(v) => setAdjs(patchAt(data.adjustments, a.id, { value: v }))}
              />
              <span className="w-28 text-right text-sm font-semibold text-slate-700 tabular-nums">
                {money(calc.adjs[i].amount)}
              </span>
              <button
                className="icon-btn icon-btn-danger !size-7"
                onClick={() => setAdjs(data.adjustments.filter((x) => x.id !== a.id))}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {data.adjustments.length === 0 && (
            <p className="text-xs text-slate-400">Sin ajustes. Agrega IGV, descuentos u otros cargos para calcular el total final.</p>
          )}
        </div>

        {data.adjustments.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
            <span className="label !mb-0">Etiqueta del total final</span>
            <TextInput className="!w-56" value={data.totalLabel} onChange={(v) => onChange({ totalLabel: v })} />
          </div>
        )}
      </div>

      {/* resumen */}
      <div className="ml-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 text-sm">
        <div className="flex justify-between bg-slate-50 px-4 py-2">
          <span className="font-medium text-slate-500">Subtotal</span>
          <span className="font-semibold tabular-nums">{money(calc.subtotal)}</span>
        </div>
        {calc.adjs.map((a) => (
          <div key={a.id} className="flex justify-between border-t border-slate-100 px-4 py-2">
            <span className="text-slate-500">{a.label}</span>
            <span className="tabular-nums">{money(a.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between bg-linear-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-white">
          <span className="font-semibold">{data.adjustments.length ? data.totalLabel : data.subtotalLabel.slice(0, 22)}</span>
          <span className="font-bold tabular-nums">{money(calc.total)}</span>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- */

function ImageEditor({ data, onChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ImagePicker value={data.src} onChange={(v) => onChange({ src: v })} />
      <div className="space-y-3">
        <Field label={`Ancho: ${data.width}% de la página`}>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={data.width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className="w-full cursor-pointer accent-indigo-600"
          />
        </Field>
        <Field label="Alineación">
          <Segmented
            value={data.align}
            onChange={(v) => onChange({ align: v })}
            options={[
              { value: 'left', label: 'Izquierda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ]}
          />
        </Field>
        <Field label="Pie de imagen (opcional)">
          <TextInput value={data.caption} onChange={(v) => onChange({ caption: v })} />
        </Field>
      </div>
    </div>
  )
}

function CalloutEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Field label="Título">
          <TextInput value={data.title} onChange={(v) => onChange({ title: v })} className="!font-semibold" />
        </Field>
        <Field label="Tono">
          <Select
            value={data.tone}
            onChange={(v) => onChange({ tone: v })}
            options={[
              { value: 'warning', label: 'Aviso (ámbar)' },
              { value: 'info', label: 'Información (azul)' },
              { value: 'success', label: 'Confirmación (verde)' },
            ]}
          />
        </Field>
      </div>
      <TextArea minRows={3} value={data.text} onChange={(v) => onChange({ text: v })} placeholder="Contenido de la nota" />
    </div>
  )
}

function SignatureEditor({ data, onChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <Field label="Frase de cierre">
          <TextInput value={data.closing} onChange={(v) => onChange({ closing: v })} />
        </Field>
        <Field label="Nombre">
          <TextInput value={data.name} onChange={(v) => onChange({ name: v })} />
        </Field>
        <Field label="Cargo">
          <TextInput value={data.role} onChange={(v) => onChange({ role: v })} />
        </Field>
      </div>
      <ImagePicker label="Imagen de firma (opcional)" value={data.image} onChange={(v) => onChange({ image: v })} />
    </div>
  )
}

function SpacerEditor({ data, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Segmented
        value={data.kind}
        onChange={(v) => onChange({ kind: v })}
        options={[
          { value: 'pagebreak', label: 'Salto de página' },
          { value: 'space', label: 'Espacio en blanco' },
        ]}
      />
      {data.kind === 'space' && (
        <Field label={`Altura: ${data.height}pt`} className="w-56">
          <input
            type="range"
            min="8"
            max="200"
            step="4"
            value={data.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className="w-full cursor-pointer accent-indigo-600"
          />
        </Field>
      )}
    </div>
  )
}

const EDITORS = {
  header: HeaderEditor,
  title: TitleEditor,
  fields: FieldsEditor,
  section: SectionEditor,
  text: TextEditor,
  list: ListEditor,
  table: TableEditor,
  image: ImageEditor,
  callout: CalloutEditor,
  signature: SignatureEditor,
  spacer: SpacerEditor,
}

export function BlockEditor({ block, onChange, number }) {
  const Cmp = EDITORS[block.type]
  return Cmp ? <Cmp data={block.data} onChange={onChange} number={number} /> : null
}
