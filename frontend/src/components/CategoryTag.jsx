import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBug, faLock, faBolt, faPaintbrush } from '@fortawesome/free-solid-svg-icons'

const config = {
  bug:         { icon: faBug,        text: 'text-orange-400' },
  security:    { icon: faLock,       text: 'text-red-400' },
  performance: { icon: faBolt,       text: 'text-purple-400' },
  style:       { icon: faPaintbrush, text: 'text-slate-400' },
}

export default function CategoryTag({ category }) {
  const c = config[category] ?? config.style
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
      <FontAwesomeIcon icon={c.icon} className="text-[10px]" />
      {category}
    </span>
  )
}
