import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ mode, onToggle }) {
  const dark = mode === 'dark'
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className="btn-dark relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-xl transition duration-200 active:scale-90"
    >
      <Sun
        className={`absolute size-4 text-amber-300 transition-all duration-500 ${
          dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
        }`}
      />
      <Moon
        className={`absolute size-4 text-indigo-200 transition-all duration-500 ${
          dark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
      />
    </button>
  )
}

/** Cabecera oscura compartida (misma en claro y oscuro, como en el CRM). */
export default function AppHeader({ mode, onToggleTheme, children, onBrandClick }) {
  return (
    <header className="z-30 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-2.5">
        <button onClick={onBrandClick} className="flex cursor-pointer items-center gap-3 text-left">
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight">Cotizador</span>
            <span className="block text-[11px] text-white/55">Constructor de propuestas</span>
          </span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          {children}
          <ThemeToggle mode={mode} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
