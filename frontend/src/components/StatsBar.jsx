export default function StatsBar({ reviews }) {
  let critical = 0, warning = 0, suggestion = 0
  reviews.forEach(r => {
    critical   += r.severity_counts?.critical   ?? 0
    warning    += r.severity_counts?.warning    ?? 0
    suggestion += r.severity_counts?.suggestion ?? 0
  })

  const stats = [
    { label: 'PRs Reviewed',    value: reviews.length, color: 'text-white' },
    { label: 'Critical Issues', value: critical,        color: 'text-red-400' },
    { label: 'Warnings',        value: warning,         color: 'text-yellow-400' },
    { label: 'Suggestions',     value: suggestion,      color: 'text-blue-400' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {stats.map(s => (
        <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center">
          <div className={`text-4xl font-bold ${s.color}`}>{s.value}</div>
          <div className="text-slate-400 text-sm mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
