import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import PRDetail from './pages/PRDetail'
import { getProvider, setProvider } from './services/api'

function Navbar() {
  const [provider, setProviderState] = useState(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    getProvider().then(setProviderState).catch(() => {})
  }, [])

  async function toggleProvider() {
    if (!provider || switching) return
    const next = provider === 'openai' ? 'claude' : 'openai'
    setSwitching(true)
    try {
      const updated = await setProvider(next)
      setProviderState(updated)
    } finally {
      setSwitching(false)
    }
  }

  const isOpenAI = provider === 'openai'
  const isClaude = provider === 'claude'

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-8 py-4 flex items-center gap-3 sticky top-0 z-10">
      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
      <Link to="/" className="text-white font-bold text-lg tracking-tight hover:text-slate-200">
        CodeReview AI
      </Link>
      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">Dashboard</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-slate-500 text-xs">Analyzing with:</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold transition-colors ${isOpenAI ? 'text-emerald-400' : 'text-slate-500'}`}>
            GPT-4o
          </span>
          <button
            onClick={toggleProvider}
            disabled={switching || !provider}
            aria-label="Toggle AI provider"
            className={`relative w-10 h-5 rounded-full transition-colors duration-300 disabled:opacity-50 cursor-pointer focus:outline-none
              ${isClaude ? 'bg-orange-500' : 'bg-emerald-500'}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300
                ${isClaude ? 'left-5' : 'left-0.5'}`}
            />
          </button>
          <span className={`text-xs font-semibold transition-colors ${isClaude ? 'text-orange-400' : 'text-slate-500'}`}>
            Claude Sonnet
          </span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reviews/:id" element={<PRDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
