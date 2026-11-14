/**
 * Los bloques se guardan en una lista plana. Una "sección" de nivel 1 abre un
 * grupo que contiene todos los bloques siguientes hasta la próxima sección de
 * nivel 1. Los bloques previos a la primera sección forman el grupo "__pre__".
 * Así el PDF y la numeración no cambian, pero el editor muestra la anidación.
 */

export const PRE = '__pre__'

export const isGroupHead = (b) => b.type === 'section' && b.data.level !== 2

export function deriveGroups(blocks) {
  const groups = [{ id: PRE, head: null, children: [] }]
  for (const b of blocks) {
    if (isGroupHead(b)) groups.push({ id: b.id, head: b, children: [] })
    else groups.at(-1).children.push(b)
  }
  return groups
}

/** Índice (exclusivo) donde termina el grupo: posición para añadir al final. */
export function endOfGroup(blocks, groupId) {
  let i = groupId === PRE ? 0 : blocks.findIndex((b) => b.id === groupId) + 1
  if (i === 0 && groupId !== PRE) return blocks.length
  while (i < blocks.length && !isGroupHead(blocks[i])) i++
  return i
}

/** Rango [inicio, fin) de un grupo (con su cabecera). */
export function groupRange(blocks, groupId) {
  const start = groupId === PRE ? 0 : blocks.findIndex((b) => b.id === groupId)
  return [start, endOfGroup(blocks, groupId)]
}

/** Id del grupo al que pertenece un bloque (o el propio id si es cabecera). */
export function groupIdOf(blocks, blockId) {
  for (const g of deriveGroups(blocks)) {
    if (g.id === blockId || g.children.some((c) => c.id === blockId)) return g.id
  }
  return null
}
