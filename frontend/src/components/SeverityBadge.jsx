const config = {
  critical:   { bg: 'bg-red-950',    text: 'text-red-400',    emoji: '🔴' },
  warning:    { bg: 'bg-yellow-950', text: 'text-yellow-400', emoji: '🟡' },
  suggestion: { bg: 'bg-blue-950',   text: 'text-blue-400',   emoji: '🔵' },
}

export default function SeverityBadge({ severity }) {
  const c = config[severity] ?? config.suggestion
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.emoji} {severity}
    </span>
  )
}
