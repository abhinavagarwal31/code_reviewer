import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faFileCode } from '@fortawesome/free-solid-svg-icons'
import { fetchReview } from '../services/api'
import SummaryCard from '../components/SummaryCard'
import SeverityBadge from '../components/SeverityBadge'
import CategoryTag from '../components/CategoryTag'

function parsePatch(patch) {
  if (!patch) return { oldCode: '', newCode: '' }
  const lines = patch.split('\n')
  const oldLines = []
  const newLines = []
  for (const line of lines) {
    if (line.startsWith('@@')) {
      oldLines.push('')
      newLines.push('')
    } else if (line.startsWith('-')) {
      oldLines.push(line.slice(1))
    } else if (line.startsWith('+')) {
      newLines.push(line.slice(1))
    } else {
      oldLines.push(line.slice(1) || line)
      newLines.push(line.slice(1) || line)
    }
  }
  return { oldCode: oldLines.join('\n'), newCode: newLines.join('\n') }
}

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
  if (!review)  return <div className="text-center py-24 text-red-400">Review not found or failed to load.</div>

  const { critical = 0, warning = 0, suggestion = 0 } = review.severity_counts ?? {}

  const diffFiles = review.diff_json ? JSON.parse(review.diff_json) : []
  const commentsByFile = {}
  for (const c of (review.comments ?? [])) {
    if (!commentsByFile[c.file_name]) commentsByFile[c.file_name] = []
    commentsByFile[c.file_name].push(c)
  }

  const allFileNames = [...new Set([
    ...diffFiles.map(f => f.filename),
    ...Object.keys(commentsByFile),
  ])]

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />Back
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

      {allFileNames.length === 0 && (
        <div className="text-slate-500 text-sm">No files found for this review.</div>
      )}

      {allFileNames.map(filename => {
        const fileData = diffFiles.find(f => f.filename === filename)
        const fileComments = commentsByFile[filename] ?? []
        const { oldCode, newCode } = parsePatch(fileData?.patch)

        return (
          <div key={filename} className="mb-8 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700 font-mono text-sm text-slate-300 bg-slate-900">
              <FontAwesomeIcon icon={faFileCode} className="mr-2 text-slate-500" />{filename}
            </div>

            {fileData?.patch && (
              <div className="text-xs overflow-x-auto">
                <ReactDiffViewer
                  oldValue={oldCode}
                  newValue={newCode}
                  splitView={false}
                  compareMethod={DiffMethod.LINES}
                  useDarkTheme={true}
                  hideLineNumbers={false}
                  styles={{
                    variables: {
                      dark: {
                        diffViewerBackground: '#0f172a',
                        addedBackground: '#052e16',
                        addedColor: '#4ade80',
                        removedBackground: '#450a0a',
                        removedColor: '#f87171',
                        wordAddedBackground: '#166534',
                        wordRemovedBackground: '#7f1d1d',
                        codeFoldBackground: '#1e293b',
                        emptyLineBackground: '#1e293b',
                        gutterBackground: '#1e293b',
                        gutterColor: '#475569',
                      }
                    }
                  }}
                />
              </div>
            )}

            {fileComments.length > 0 && (
              <div className="p-4 space-y-3 border-t border-slate-700">
                {fileComments.map(c => (
                  <div key={c.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <SeverityBadge severity={c.severity} />
                      <CategoryTag category={c.category} />
                      {c.line_number && (
                        <span className="text-slate-500 font-mono text-xs">line {c.line_number}</span>
                      )}
                      {c.confidence != null && (
                        <span className="ml-auto text-slate-500 text-xs">Confidence: {Math.round(c.confidence * 100)}%</span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-2">{c.description}</p>
                    {c.suggested_fix && (
                      <div className="bg-slate-800 border-l-4 border-indigo-500 px-4 py-3 rounded-r-lg">
                        <p className="text-indigo-300 font-mono text-xs whitespace-pre-wrap">{c.suggested_fix}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
