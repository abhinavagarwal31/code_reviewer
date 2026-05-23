import { useCallback } from 'react'
import { useReviews } from '../hooks/useReviews'
import { useStream } from '../hooks/useStream'
import StatsBar from '../components/StatsBar'
import PRTable from '../components/PRTable'

export default function Dashboard() {
  const { reviews, loading, reload } = useReviews()
  const onNew = useCallback(() => reload(), [reload])
  useStream(onNew)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Pull Requests</h1>
      <StatsBar reviews={reviews} />
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 font-semibold text-slate-200">
          Pull Requests Reviewed
        </div>
        {loading
          ? <div className="text-center py-16 text-slate-500">Loading...</div>
          : <PRTable reviews={reviews} />}
      </div>
    </div>
  )
}
