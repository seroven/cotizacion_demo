import { useCallback, useState } from 'react'
import Editor from './components/Editor.jsx'
import Home from './components/Home.jsx'
import { Toaster } from './components/ui.jsx'
import { ensureSeed } from './lib/storage.js'
import { useTheme } from './lib/theme.js'

ensureSeed()

export default function App() {
  const [view, setView] = useState({ screen: 'home' })
  const { mode, toggle } = useTheme()
  const goHome = useCallback(() => setView({ screen: 'home' }), [])
  const theme = { mode, onToggleTheme: toggle }

  return (
    <>
      <div key={view.screen === 'home' ? 'home' : view.id} className="view-in h-full">
        {view.screen === 'home' ? (
          <Home {...theme} onOpen={(kind, id) => setView({ screen: 'editor', kind, id })} />
        ) : (
          <Editor {...theme} kind={view.kind} id={view.id} onExit={goHome} />
        )}
      </div>
      <Toaster />
    </>
  )
}
