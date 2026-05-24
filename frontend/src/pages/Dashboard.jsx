import { useCallback, useState } from 'react'
import { useReviews } from '../hooks/useReviews'
import { useStream } from '../hooks/useStream'
import StatsBar from '../components/StatsBar'
import PRTable from '../components/PRTable'
import { clearDb } from '../services/api'

export default function Dashboard() {
  const { reviews, loading, error, reload } = useReviews()
  const onNew = useCallback(() => reload(), [reload])
  const [clearing, setClearing] = useState(false)
  useStream(onNew)

  async function handleClear() {
    if (!window.confirm('Clear all reviews from the database?')) return
    setClearing(true)
    try {
      await clearDb()
      await reload()
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Pull Requests</h1>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="px-4 py-2 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-300 text-sm rounded-lg transition-colors"
        >
          {clearing ? 'Clearing...' : '🗑 Clear DB'}
        </button>
      </div>
      <StatsBar reviews={reviews} />
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 font-semibold text-slate-200">
          Pull Requests Reviewed
        </div>
        {loading
          ? <div className="text-center py-16 text-slate-500">Loading...</div>
          : error
          ? <div className="text-center py-16 text-red-400">{error}</div>
          : <PRTable reviews={reviews} />}
      </div>
    </div>
  )
}
