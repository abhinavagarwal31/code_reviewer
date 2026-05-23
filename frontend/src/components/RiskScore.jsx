export default function RiskScore({ score }) {
  if (score == null) return <span className="text-slate-500 text-sm">—</span>
  const level = score <= 3 ? 'low' : score <= 6 ? 'med' : 'high'
  const styles = {
    low:  { bar: 'bg-green-500',  text: 'text-green-400',  label: 'Low Risk' },
    med:  { bar: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium Risk' },
    high: { bar: 'bg-red-500',    text: 'text-red-400',    label: 'High Risk' },
  }
  const s = styles[level]
  return (
    <div className="flex flex-col items-center gap-1 min-w-[64px]">
      <span className={`text-2xl font-bold ${s.text}`}>{score}<span className="text-sm text-slate-500">/10</span></span>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div className={`${s.bar} h-1.5 rounded-full`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className={`text-xs ${s.text}`}>{s.label}</span>
    </div>
  )
}
