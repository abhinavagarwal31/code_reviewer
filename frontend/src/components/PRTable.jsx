import { useNavigate } from 'react-router-dom'
import SeverityBadge from './SeverityBadge'
import RiskScore from './RiskScore'

const recColors = {
  approve:          'bg-green-950 text-green-400',
  request_changes:  'bg-red-950 text-red-400',
  needs_discussion: 'bg-yellow-950 text-yellow-400',
}

const providerColors = {
  openai: 'bg-emerald-950 text-emerald-400',
  claude: 'bg-orange-950 text-orange-400',
}

const providerLabels = {
  openai: 'GPT-4o',
  claude: 'Claude',
}

function StatusCell({ status }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        pending
      </span>
    )
  }
  const cls = status === 'completed'
    ? 'bg-green-950 text-green-400'
    : 'bg-red-950 text-red-400'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>
  )
}

export default function PRTable({ reviews }) {
  const navigate = useNavigate()

  if (!reviews.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        No reviews yet — open a Pull Request to trigger one.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['Repo', 'PR Title', 'Author', '🔴 Critical', '🟡 Warnings', '🔵 Suggestions', 'Risk', 'Recommendation', 'AI', 'Status', 'Date'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reviews.map(r => (
            <tr
              key={r.id}
              onClick={() => navigate(`/reviews/${r.id}`)}
              className="border-b border-slate-800 hover:bg-slate-700/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">{r.repo_name}</td>
              <td className="px-4 py-3 text-slate-200 max-w-[200px] truncate">{r.pr_title ?? `PR #${r.pr_number}`}</td>
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.author ?? '—'}</td>
              <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-950 text-red-400 font-bold text-xs">{r.severity_counts?.critical ?? 0}</span></td>
              <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-950 text-yellow-400 font-bold text-xs">{r.severity_counts?.warning ?? 0}</span></td>
              <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-950 text-blue-400 font-bold text-xs">{r.severity_counts?.suggestion ?? 0}</span></td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.risk_score != null
                  ? <span className={`font-bold text-sm ${r.risk_score >= 7 ? 'text-red-400' : r.risk_score >= 4 ? 'text-yellow-400' : 'text-green-400'}`}>{r.risk_score}/10</span>
                  : <span className="text-slate-500">—</span>}
              </td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${recColors[r.recommendation] ?? 'bg-slate-700 text-slate-400'}`}>{(r.recommendation ?? '—').replace('_', ' ')}</span></td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.ai_provider
                  ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${providerColors[r.ai_provider] ?? 'bg-slate-700 text-slate-400'}`}>{providerLabels[r.ai_provider] ?? r.ai_provider}</span>
                  : <span className="text-slate-500">—</span>}
              </td>
              <td className="px-4 py-3"><StatusCell status={r.status} /></td>
              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
