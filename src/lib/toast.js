const listeners = new Set()

export function toast(message, tone = 'info') {
  listeners.forEach((fn) => fn({ id: Math.random().toString(36).slice(2), message, tone }))
}

export function subscribeToasts(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
