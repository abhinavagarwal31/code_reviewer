import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchReview } from '../services/api'
import SummaryCard from '../components/SummaryCard'
import SeverityBadge from '../components/SeverityBadge'
import CategoryTag from '../components/CategoryTag'

export default function PRDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReview(id)
      .then(data => setReview(data))
      .catch(() => setReview(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-24 text-slate-500">Loading review...</div>
  if (!review)  return <div className="text-center py-24 text-slate-500">Review not found.</div>

  const { critical = 0, warning = 0, suggestion = 0 } = review.severity_counts ?? {}

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-white truncate">{review.pr_title ?? `PR #${review.pr_number}`}</h1>
      </div>

      <SummaryCard review={review} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-slate-400 text-sm font-medium">Issues:</span>
        <span className="px-3 py-1 bg-red-950 text-red-400 rounded-full text-xs font-semibold">{critical} critical</span>
        <span className="px-3 py-1 bg-yellow-950 text-yellow-400 rounded-full text-xs font-semibold">{warning} warnings</span>
        <span className="px-3 py-1 bg-blue-950 text-blue-400 rounded-full text-xs font-semibold">{suggestion} suggestions</span>
      </div>

      <div className="space-y-4">
        {(review.comments ?? []).length === 0 && (
          <div className="text-slate-500 text-sm">No comments found.</div>
        )}
        {(review.comments ?? []).map(c => (
          <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <SeverityBadge severity={c.severity} />
              <CategoryTag category={c.category} />
              <span className="text-slate-500 font-mono text-xs">{c.file_name}{c.line_number ? `:${c.line_number}` : ''}</span>
              {c.confidence != null && (
                <span className="ml-auto text-slate-500 text-xs">Confidence: {Math.round(c.confidence * 100)}%</span>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">{c.description}</p>
            {c.suggested_fix && (
              <div className="bg-slate-900 border-l-4 border-indigo-500 px-4 py-3 rounded-r-lg">
                <p className="text-indigo-300 font-mono text-xs whitespace-pre-wrap">{c.suggested_fix}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
