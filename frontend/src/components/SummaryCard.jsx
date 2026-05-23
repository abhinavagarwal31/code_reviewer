import RiskScore from './RiskScore'

const recConfig = {
  approve:          { label: '✅ Approved',        cls: 'bg-green-950 text-green-400 border-green-800' },
  request_changes:  { label: '❌ Request Changes',  cls: 'bg-red-950 text-red-400 border-red-800' },
  needs_discussion: { label: '💬 Needs Discussion', cls: 'bg-yellow-950 text-yellow-400 border-yellow-800' },
}

export default function SummaryCard({ review }) {
  const rec = recConfig[review.recommendation] ?? { label: review.recommendation ?? '—', cls: 'bg-slate-800 text-slate-400 border-slate-600' }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white truncate">{review.pr_title ?? `PR #${review.pr_number}`}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {review.repo_name} · by <span className="text-slate-300">{review.author ?? '—'}</span> · {new Date(review.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${rec.cls}`}>{rec.label}</span>
          <RiskScore score={review.risk_score} />
        </div>
      </div>
      {review.summary && (
        <p className="text-slate-300 text-sm leading-relaxed mt-4 border-t border-slate-700 pt-4">{review.summary}</p>
      )}
    </div>
  )
}
