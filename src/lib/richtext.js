/**
 * Texto enriquecido: se guarda como HTML (el que genera TipTap) y se convierte a
 * un modelo simple de bloques + tramos para pintarlo en el PDF.
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Convierte el formato antiguo (texto plano + negrita + alineación) a HTML. */
export function legacyToHtml(data) {
  const lines = String(data.text || '').split('\n')
  const align = data.align && data.align !== 'left' ? ` style="text-align: ${data.align}"` : ''
  const out = lines.map((l) => {
    if (!l.trim()) return `<p${align}></p>`
    const inner = data.bold ? `<strong>${esc(l)}</strong>` : esc(l)
    return `<p${align}>${inner}</p>`
  })
  return out.join('') || '<p></p>'
}

/** HTML de un bloque de texto, sea nuevo o antiguo. */
export const getHtml = (data) => (typeof data.html === 'string' ? data.html : legacyToHtml(data))

/** Texto plano del HTML (para resúmenes). */
export function htmlToText(html) {
  if (typeof document === 'undefined') return String(html).replace(/<[^>]+>/g, ' ')
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}

/* ------------------------ HTML → modelo para el PDF ------------------------ */

const HEADINGS = { H1: 1, H2: 2, H3: 3, H4: 3, H5: 3, H6: 3 }

function parseColor(value) {
  if (!value) return null
  const v = value.trim()
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v
  const m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (!m) return null
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`
}

function styleOf(el, prop) {
  return el.style?.[prop] || ''
}

/**
 * Devuelve una lista de bloques:
 *  { kind: 'p'|'h', level, align, runs, list?: { ordered, index, depth } }
 *  runs: [{ text, bold, italic, underline, strike, color }]
 */
export function parseRichText(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const out = []

  const inlineRuns = (node, fmt, runs) => {
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) {
        if (c.textContent) runs.push({ text: c.textContent, ...fmt })
        return
      }
      if (c.nodeType !== 1) return
      const tag = c.tagName
      if (tag === 'BR') {
        runs.push({ text: '\n', ...fmt })
        return
      }
      if (tag === 'UL' || tag === 'OL' || HEADINGS[tag] || tag === 'P') return // bloques anidados: se tratan aparte
      const next = { ...fmt }
      if (tag === 'STRONG' || tag === 'B') next.bold = true
      if (tag === 'EM' || tag === 'I') next.italic = true
      if (tag === 'U') next.underline = true
      if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') next.strike = true
      if (tag === 'A') next.underline = true
      const color = parseColor(styleOf(c, 'color'))
      if (color) next.color = color
      if (styleOf(c, 'fontWeight') === 'bold' || Number(styleOf(c, 'fontWeight')) >= 600) next.bold = true
      inlineRuns(c, next, runs)
    })
  }

  const blockOf = (el, extra = {}) => {
    const runs = []
    inlineRuns(el, {}, runs)
    return {
      kind: HEADINGS[el.tagName] ? 'h' : 'p',
      level: HEADINGS[el.tagName] || 0,
      align: styleOf(el, 'textAlign') || 'left',
      runs,
      ...extra,
    }
  }

  const walkList = (listEl, depth) => {
    const ordered = listEl.tagName === 'OL'
    let index = 0
    listEl.childNodes.forEach((li) => {
      if (li.nodeType !== 1 || li.tagName !== 'LI') return
      index += 1
      // contenido propio del <li> (normalmente un <p>) + listas anidadas
      const runs = []
      let align = 'left'
      li.childNodes.forEach((c) => {
        if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) return
        if (c.nodeType === 1 && c.tagName === 'P') {
          if (runs.length) runs.push({ text: '\n' })
          inlineRuns(c, {}, runs)
          align = styleOf(c, 'textAlign') || align
        } else if (c.nodeType === 3) {
          if (c.textContent) runs.push({ text: c.textContent })
        } else if (c.nodeType === 1) {
          inlineRuns({ childNodes: [c] }, {}, runs)
        }
      })
      out.push({ kind: 'p', level: 0, align, runs, list: { ordered, index, depth } })
      li.childNodes.forEach((c) => {
        if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) walkList(c, depth + 1)
      })
    })
  }

  const walk = (parent) => {
    parent.childNodes.forEach((el) => {
      if (el.nodeType === 3) {
        if (el.textContent.trim()) out.push({ kind: 'p', level: 0, align: 'left', runs: [{ text: el.textContent }] })
        return
      }
      if (el.nodeType !== 1) return
      if (el.tagName === 'UL' || el.tagName === 'OL') walkList(el, 0)
      else if (el.tagName === 'BLOCKQUOTE') {
        el.childNodes.forEach((c) => c.nodeType === 1 && out.push(blockOf(c, { quote: true })))
      } else if (el.tagName === 'DIV') walk(el)
      else out.push(blockOf(el))
    })
  }

  walk(doc.body)
  return out
}
