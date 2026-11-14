import { useCallback, useEffect, useState } from 'react'

const KEY = 'cotizador.theme'

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches

function stored() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

export function applyTheme(mode, animate = false) {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-anim')
    clearTimeout(applyTheme.t)
    applyTheme.t = setTimeout(() => root.classList.remove('theme-anim'), 450)
  }
  root.classList.toggle('dark', mode === 'dark')
}

export function useTheme() {
  const [mode, setMode] = useState(() => stored() ?? (systemDark() ? 'dark' : 'light'))

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark'
      applyTheme(next, true)
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* sin storage */
      }
      return next
    })
  }, [])

  return { mode, toggle }
}
