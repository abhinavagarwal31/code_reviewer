import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation, faTriangleExclamation, faLightbulb } from '@fortawesome/free-solid-svg-icons'

const config = {
  critical:   { bg: 'bg-red-950',    text: 'text-red-400',    icon: faCircleExclamation },
  warning:    { bg: 'bg-yellow-950', text: 'text-yellow-400', icon: faTriangleExclamation },
  suggestion: { bg: 'bg-blue-950',   text: 'text-blue-400',   icon: faLightbulb },
}

export default function SeverityBadge({ severity }) {
  const c = config[severity] ?? config.suggestion
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <FontAwesomeIcon icon={c.icon} className="text-[10px]" />
      {severity}
    </span>
  )
}
