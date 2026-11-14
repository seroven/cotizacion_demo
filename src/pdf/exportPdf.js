import { createElement } from 'react'

/** Genera el PDF (carga perezosa: react-pdf pesa bastante). */
export async function buildPdfBlob(name, blocks) {
  const [{ pdf }, { default: QuoteDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./QuoteDocument.jsx'),
  ])
  return pdf(createElement(QuoteDocument, { name, blocks })).toBlob()
}

export const slug = (s) =>
  (s || 'cotizacion')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'cotizacion'

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
