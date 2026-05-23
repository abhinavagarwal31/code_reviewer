const config = {
  bug:         { emoji: '🐛', text: 'text-orange-400' },
  security:    { emoji: '🔒', text: 'text-red-400' },
  performance: { emoji: '⚡', text: 'text-purple-400' },
  style:       { emoji: '✨', text: 'text-slate-400' },
}

export default function CategoryTag({ category }) {
  const c = config[category] ?? config.style
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.text}`}>
      {c.emoji} {category}
    </span>
  )
}
