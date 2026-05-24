import { useState } from 'react'
import { useReviews } from '../hooks/useReviews'
import { clearDb } from '../services/api'

export default function Admin() {
  const { reload } = useReviews()
  const [clearing, setClearing] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClear() {
    if (!window.confirm('This will permanently delete all reviews and comments. Continue?')) return
    setClearing(true)
    setDone(false)
    try {
      await clearDb()
      await reload()
      setDone(true)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-2">Admin</h1>
      <p className="text-slate-400 text-sm mb-8">Danger zone — these actions are irreversible.</p>

      <div className="bg-slate-800 border border-red-900/50 rounded-xl p-6 flex items-center justify-between gap-6">
        <div>
          <p className="text-slate-200 font-semibold text-sm">Clear Database</p>
          <p className="text-slate-500 text-xs mt-1">Delete all reviews and comments from the local DB.</p>
          {done && <p className="text-green-400 text-xs mt-2">Database cleared.</p>}
        </div>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="shrink-0 px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-300 text-sm rounded-lg transition-colors"
        >
          {clearing ? 'Clearing...' : '🗑 Clear DB'}
        </button>
      </div>
    </div>
  )
}
