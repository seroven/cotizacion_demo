import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import {
  calcTable,
  computeNumbers,
  fmtDateLong,
  fmtDateShort,
  fmtMoney,
  fmtNumber,
  num,
  todayISO,
} from '../lib/blocks.js'
import { getHtml, parseRichText } from '../lib/richtext.js'

const C = {
  navy: '#1b2f57',
  blue: '#2f5fb3',
  soft: '#eaf0fa',
  line: '#d5dce8',
  text: '#1f2937',
  muted: '#64748b',
  zebra: '#f7f9fc',
}

const BOLD = 'Helvetica-Bold'

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 58,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.45,
    color: C.text,
  },
  footer: {
    position: 'absolute',
    left: 44,
    right: 44,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.75,
    borderTopColor: C.line,
    paddingTop: 6,
    fontSize: 8,
    color: C.muted,
  },
})

/* ---------------------------- bloques ---------------------------- */

function Header({ d }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: C.navy,
        paddingBottom: 10,
        marginBottom: 16,
      }}
    >
      {d.logo ? <Image src={d.logo} style={{ width: 92, marginRight: 14 }} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: BOLD, fontSize: 14.5, color: C.navy }}>{d.company}</Text>
        {d.ruc ? <Text style={{ marginTop: 2 }}>RUC: {d.ruc}</Text> : null}
        {d.tagline ? <Text style={{ color: C.muted }}>{d.tagline}</Text> : null}
        {d.email ? <Text style={{ color: C.blue }}>{d.email}</Text> : null}
      </View>
      {d.showMeta ? (
        <View style={{ width: 128, borderWidth: 0.75, borderColor: C.line, fontSize: 8.5 }}>
          {[
            ['Formato', d.formato],
            ['Fecha', fmtDateShort(d.fecha)],
            ['Rev.', d.rev],
          ].map(([k, v], i) => (
            <View
              key={k}
              style={{
                flexDirection: 'row',
                borderTopWidth: i ? 0.75 : 0,
                borderTopColor: C.line,
              }}
            >
              <Text style={{ width: 46, padding: 3.5, fontFamily: BOLD, backgroundColor: C.soft, color: C.navy }}>
                {k}:
              </Text>
              <Text style={{ flex: 1, padding: 3.5 }}>{v}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function Title({ d }) {
  return (
    <View
      wrap={false}
      style={{
        alignItems: 'center',
        backgroundColor: C.soft,
        borderLeftWidth: 4,
        borderLeftColor: C.navy,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontFamily: BOLD, fontSize: 15, color: C.navy, letterSpacing: 0.8, textAlign: 'center' }}>
        {d.title}
      </Text>
      {d.subtitle ? <Text style={{ marginTop: 3, color: C.muted, fontSize: 10 }}>{d.subtitle}</Text> : null}
    </View>
  )
}

function Fields({ d }) {
  return (
    <View style={{ marginBottom: 10 }}>
      {d.fields
        .map((f) => ({
          ...f,
          shown: f.kind === 'date' ? fmtDateLong(f.auto ? todayISO() : f.value) : f.value,
        }))
        .filter((f) => String(f.shown || '').trim())
        .map((f) => (
          <View key={f.id} style={{ flexDirection: 'row', marginBottom: 4 }} wrap={false}>
            <Text style={{ width: 74, fontFamily: BOLD, color: C.navy }}>{f.label}:</Text>
            <Text style={{ flex: 1 }}>{f.shown}</Text>
          </View>
        ))}
    </View>
  )
}

function Section({ d, number }) {
  if (d.level === 2) {
    return (
      <Text
        minPresenceAhead={50}
        style={{ fontFamily: BOLD, fontSize: 10.5, color: C.navy, marginTop: 8, marginBottom: 5 }}
      >
        {number?.label}  {d.title}
      </Text>
    )
  }
  return (
    <View
      minPresenceAhead={60}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: C.line,
      }}
    >
      <View
        style={{
          minWidth: 20,
          height: 20,
          paddingHorizontal: 5,
          borderRadius: 4,
          backgroundColor: C.navy,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8,
        }}
      >
        <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: 10 }}>{number?.label}</Text>
      </View>
      <Text style={{ fontFamily: BOLD, fontSize: 11.5, color: C.navy, textTransform: 'uppercase' }}>{d.title}</Text>
    </View>
  )
}

const fontFor = (bold, italic) =>
  bold ? (italic ? 'Helvetica-BoldOblique' : BOLD) : italic ? 'Helvetica-Oblique' : 'Helvetica'

const HEAD = {
  1: { fontSize: 15, marginTop: 8, marginBottom: 5 },
  2: { fontSize: 12.5, marginTop: 7, marginBottom: 4 },
  3: { fontSize: 11, marginTop: 6, marginBottom: 3 },
}

function Runs({ runs, heading }) {
  if (!runs.length || runs.every((r) => !r.text)) return ' '
  return runs.map((r, i) => (
    <Text
      key={i}
      style={{
        fontFamily: fontFor(r.bold || heading, r.italic),
        color: r.color || (heading ? C.navy : undefined),
        textDecoration: [r.underline && 'underline', r.strike && 'line-through'].filter(Boolean).join(' ') || 'none',
      }}
    >
      {r.text}
    </Text>
  ))
}

function Paragraphs({ d }) {
  const blocks = parseRichText(getHtml(d))
  if (!blocks.some((b) => b.runs.some((r) => r.text.trim()))) return null
  return (
    <View style={{ marginBottom: 5 }}>
      {blocks.map((b, i) => {
        const align = b.align === 'justify' ? 'justify' : b.align
        if (b.list) {
          const { ordered, index, depth } = b.list
          const marker = ordered ? `${index}.` : depth ? '–' : '•'
          return (
            <View key={i} wrap={false} style={{ flexDirection: 'row', marginBottom: 2.5, paddingLeft: 6 + depth * 16 }}>
              <Text style={{ width: ordered ? 18 : 12, color: C.blue }}>{marker}</Text>
              <Text style={{ flex: 1, textAlign: align }}>
                <Runs runs={b.runs} />
              </Text>
            </View>
          )
        }
        const head = b.kind === 'h' ? HEAD[b.level] : null
        return (
          <Text
            key={i}
            minPresenceAhead={head ? 40 : undefined}
            style={{
              textAlign: align,
              marginBottom: head ? head.marginBottom : 3,
              marginTop: head?.marginTop,
              fontSize: head?.fontSize,
              ...(b.quote ? { borderLeftWidth: 2, borderLeftColor: C.line, paddingLeft: 8, color: C.muted } : {}),
            }}
          >
            <Runs runs={b.runs} heading={!!head} />
          </Text>
        )
      })}
    </View>
  )
}

const letters = 'abcdefghijklmnopqrstuvwxyz'

function List({ d, number }) {
  let n = 0
  return (
    <View style={{ marginBottom: 6 }}>
      {d.items
        .filter((it) => it.text.trim())
        .map((it) => {
          let marker
          let width
          if (it.level) {
            marker = '•'
            width = 10
          } else {
            const i = n++
            switch (d.style) {
              case 'number':
                marker = `${i + 1}.`
                width = 18
                break
              case 'letter':
                marker = `${letters[i % 26]}.`
                width = 16
                break
              case 'sectionnum':
                marker = `${number?.top ?? 0}.${i + 1}`
                width = 26
                break
              case 'bullet':
                marker = '•'
                width = 12
                break
              default:
                marker = '–'
                width = 12
            }
          }
          const bold = !it.level && (d.style === 'number' || d.style === 'letter' || d.style === 'sectionnum')
          return (
            <View
              key={it.id}
              wrap={false}
              style={{ flexDirection: 'row', marginBottom: 2.5, paddingLeft: it.level ? 22 : 6 }}
            >
              <Text style={{ width, color: C.blue, fontFamily: bold ? BOLD : 'Helvetica' }}>{marker}</Text>
              <Text style={{ flex: 1, textAlign: 'justify' }}>{it.text}</Text>
            </View>
          )
        })}
    </View>
  )
}

function Picture({ d }) {
  if (!d.src) return null
  const align = d.align === 'center' ? 'center' : d.align === 'right' ? 'flex-end' : 'flex-start'
  return (
    <View wrap={false} style={{ alignItems: align, marginVertical: 6 }}>
      <Image src={d.src} style={{ width: `${d.width}%` }} />
      {d.caption ? <Text style={{ marginTop: 3, fontSize: 8, color: C.muted }}>{d.caption}</Text> : null}
    </View>
  )
}

const W = { code: 50, um: 32, qty: 52, price: 64, total: 82 }

const th = {
  fontFamily: BOLD,
  fontSize: 8,
  color: '#fff',
  paddingVertical: 5,
  paddingHorizontal: 4,
  textAlign: 'center',
}

function Table({ d }) {
  const calc = calcTable(d)
  const cell = { paddingVertical: 4, paddingHorizontal: 4, fontSize: 8.5 }
  const money = (n) => fmtMoney(n, d.currency)
  let itemIndex = 0

  const totalRow = (label, value, style = {}, textStyle = {}) => (
    <View wrap={false} style={{ flexDirection: 'row', ...style }}>
      <Text style={{ flex: 1, textAlign: 'right', paddingVertical: 5, paddingRight: 8, fontFamily: BOLD, fontSize: 8.5, ...textStyle }}>
        {label}
      </Text>
      <Text
        style={{
          width: W.total,
          textAlign: 'right',
          paddingVertical: 5,
          paddingHorizontal: 4,
          fontFamily: BOLD,
          fontSize: 9,
          ...textStyle,
        }}
      >
        {value}
      </Text>
    </View>
  )

  return (
    <View style={{ marginVertical: 8, borderWidth: 0.75, borderColor: C.line }}>
      <View wrap={false} style={{ flexDirection: 'row', backgroundColor: C.navy }}>
        <Text style={{ ...th, width: W.code }}>ÍTEM</Text>
        <Text style={{ ...th, flex: 1 }}>DESCRIPCIÓN</Text>
        <Text style={{ ...th, width: W.um }}>U.M.</Text>
        <Text style={{ ...th, width: W.qty }}>CANT.</Text>
        <Text style={{ ...th, width: W.price }}>COSTO UNIT.</Text>
        <Text style={{ ...th, width: W.total }}>TOTAL</Text>
      </View>

      {calc.rows.map((r) => {
        if (r.kind === 'group') {
          itemIndex = 0
          return (
            <View
              key={r.id}
              wrap={false}
              minPresenceAhead={40}
              style={{ flexDirection: 'row', backgroundColor: C.soft, borderTopWidth: 0.75, borderTopColor: C.line }}
            >
              <Text style={{ ...cell, width: W.code, fontFamily: BOLD, color: C.navy, textAlign: 'center' }}>{r.code}</Text>
              <Text style={{ ...cell, flex: 1, fontFamily: BOLD, color: C.navy }}>{r.desc}</Text>
              {d.showGroupTotals ? (
                <Text style={{ ...cell, fontFamily: BOLD, color: C.navy, textAlign: 'right' }}>{money(r.total)}</Text>
              ) : null}
            </View>
          )
        }
        const zebra = itemIndex++ % 2 === 1 ? C.zebra : '#fff'
        const filled = String(r.qty).trim() || String(r.price).trim()
        return (
          <View
            key={r.id}
            wrap={false}
            style={{ flexDirection: 'row', backgroundColor: zebra, borderTopWidth: 0.75, borderTopColor: C.line }}
          >
            <Text style={{ ...cell, width: W.code, textAlign: 'center', color: C.muted }}>{r.code}</Text>
            <Text style={{ ...cell, flex: 1 }}>{r.desc}</Text>
            <Text style={{ ...cell, width: W.um, textAlign: 'center' }}>{r.unit}</Text>
            <Text style={{ ...cell, width: W.qty, textAlign: 'right' }}>{String(r.qty).trim() ? fmtNumber(num(r.qty)) : ''}</Text>
            <Text style={{ ...cell, width: W.price, textAlign: 'right' }}>{String(r.price).trim() ? money(num(r.price)) : ''}</Text>
            <Text style={{ ...cell, width: W.total, textAlign: 'right', fontFamily: BOLD }}>
              {filled ? money(r.amount) : ''}
            </Text>
          </View>
        )
      })}

      {totalRow(d.subtotalLabel, money(calc.subtotal), {
        backgroundColor: C.soft,
        borderTopWidth: 0.75,
        borderTopColor: C.line,
      }, { color: C.navy })}
      {calc.adjs.map((a) => (
        <View key={a.id} wrap={false} style={{ flexDirection: 'row', borderTopWidth: 0.75, borderTopColor: C.line }}>
          <Text style={{ flex: 1, textAlign: 'right', paddingVertical: 4, paddingRight: 8, fontSize: 8.5 }}>
            {a.label}
            {a.kind === 'percent' ? ` (${a.op === 'sub' ? '−' : '+'}${num(a.value)}%)` : ''}
          </Text>
          <Text style={{ width: W.total, textAlign: 'right', paddingVertical: 4, paddingHorizontal: 4, fontSize: 8.5 }}>
            {money(a.amount)}
          </Text>
        </View>
      ))}
      {calc.adjs.length > 0 &&
        totalRow(d.totalLabel, money(calc.total), { backgroundColor: C.navy }, { color: '#fff', fontSize: 9.5 })}
    </View>
  )
}

const TONES = {
  warning: { bg: '#fff7e6', bar: '#f59e0b', title: '#92400e' },
  info: { bg: '#eaf2ff', bar: '#3b82f6', title: '#1e40af' },
  success: { bg: '#eafaf1', bar: '#10b981', title: '#065f46' },
}

function Callout({ d }) {
  const t = TONES[d.tone] || TONES.warning
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderLeftWidth: 3,
        borderLeftColor: t.bar,
        padding: 9,
        marginVertical: 8,
      }}
    >
      {d.title ? <Text style={{ fontFamily: BOLD, color: t.title, marginBottom: 3, fontSize: 9 }}>{d.title}</Text> : null}
      {String(d.text || '')
        .split('\n')
        .map((p, i) => (
          <Text key={i} style={{ textAlign: 'justify', marginBottom: p.trim() ? 2 : 3 }}>
            {p.trim() ? p : ' '}
          </Text>
        ))}
    </View>
  )
}

function Signature({ d }) {
  return (
    <View wrap={false} style={{ marginTop: 18, marginBottom: 6 }}>
      {d.closing ? <Text>{d.closing}</Text> : null}
      <View style={{ height: 56, justifyContent: 'flex-end' }}>
        {d.image ? <Image src={d.image} style={{ height: 52, width: 130, objectFit: 'contain' }} /> : null}
      </View>
      <View style={{ width: 190, borderTopWidth: 0.75, borderTopColor: C.text, paddingTop: 4 }}>
        {d.name ? <Text style={{ fontFamily: BOLD, color: C.navy }}>{d.name}</Text> : null}
        {d.role ? <Text style={{ color: C.muted }}>{d.role}</Text> : null}
      </View>
    </View>
  )
}

function Spacer({ d }) {
  return d.kind === 'pagebreak' ? <View break /> : <View style={{ height: d.height }} />
}

function renderBlock(b, numbers) {
  const number = numbers[b.id]
  switch (b.type) {
    case 'header':
      return <Header key={b.id} d={b.data} />
    case 'title':
      return <Title key={b.id} d={b.data} />
    case 'fields':
      return <Fields key={b.id} d={b.data} />
    case 'section':
      return <Section key={b.id} d={b.data} number={number} />
    case 'text':
      return <Paragraphs key={b.id} d={b.data} />
    case 'list':
      return <List key={b.id} d={b.data} number={number} />
    case 'table':
      return <Table key={b.id} d={b.data} />
    case 'image':
      return <Picture key={b.id} d={b.data} />
    case 'callout':
      return <Callout key={b.id} d={b.data} />
    case 'signature':
      return <Signature key={b.id} d={b.data} />
    case 'spacer':
      return <Spacer key={b.id} d={b.data} />
    default:
      return null
  }
}

export default function QuoteDocument({ name, blocks }) {
  const numbers = computeNumbers(blocks)
  const company = blocks.find((b) => b.type === 'header')?.data.company || ''
  const code = blocks.find((b) => b.type === 'title')?.data.subtitle || name

  return (
    <Document title={name} author={company} creator="Cotizador">
      <Page size="A4" style={s.page}>
        {blocks.map((b) => renderBlock(b, numbers))}
        <View style={s.footer} fixed>
          <Text>{[company, code].filter(Boolean).join('  ·  ')}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
