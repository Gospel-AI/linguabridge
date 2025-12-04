import { useState, memo } from 'react'
import type { RankingConfig, RankingAnnotation } from '../../types/database'

interface RankingAnnotatorProps {
  data: {
    prompt: string
    responses: string[]
    [key: string]: unknown
  }
  config: RankingConfig
  onSubmit: (annotation: RankingAnnotation, timeSpent: number) => void
  onSkip?: () => void
}

export const RankingAnnotator = memo(function RankingAnnotator({
  data,
  config,
  onSubmit,
  onSkip
}: RankingAnnotatorProps) {
  const [ranking, setRanking] = useState<number[]>([])
  const [preferred, setPreferred] = useState<number | null>(null)
  const [startTime] = useState(() => Date.now())

  const handleRankClick = (responseIndex: number) => {
    setRanking(prev => {
      // If already in ranking, remove it
      if (prev.includes(responseIndex)) {
        return prev.filter(i => i !== responseIndex)
      }
      // Add to ranking
      return [...prev, responseIndex]
    })
  }

  const handlePreferredClick = (responseIndex: number) => {
    setPreferred(prev => prev === responseIndex ? null : responseIndex)
  }

  const getRankPosition = (responseIndex: number) => {
    const position = ranking.indexOf(responseIndex)
    return position === -1 ? null : position + 1
  }

  const handleSubmit = () => {
    if (ranking.length !== data.responses.length) return

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const annotation: RankingAnnotation = {
      ranking,
      preferred: preferred ?? undefined
    }

    onSubmit(annotation, timeSpent)
    setRanking([])
    setPreferred(null)
  }

  const canSubmit = ranking.length === data.responses.length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Instructions */}
      {config.instructions && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Instructions</h3>
          <p className="text-sm text-blue-700">{config.instructions}</p>
        </div>
      )}

      {/* Prompt */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Prompt</h4>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-900 whitespace-pre-wrap">{data.prompt}</p>
        </div>
      </div>

      {/* Criteria */}
      {config.criteria && config.criteria.length > 0 && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Evaluation Criteria</h4>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {config.criteria.map((criterion, i) => (
              <li key={i}>{criterion}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Responses */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">
          Click responses in order of preference (1 = best)
        </h4>
        <div className="space-y-4">
          {data.responses.map((response, index) => {
            const rankPosition = getRankPosition(index)
            const isPreferred = preferred === index
            
            return (
              <div
                key={index}
                className={`
                  relative p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${rankPosition !== null
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleRankClick(index)}
              >
                {/* Rank Badge */}
                {rankPosition !== null && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
                    {rankPosition}
                  </div>
                )}

                {/* Response Label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Response {String.fromCharCode(65 + index)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreferredClick(index)
                    }}
                    className={`
                      text-xs px-2 py-1 rounded transition-colors
                      ${isPreferred
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }
                    `}
                  >
                    {isPreferred ? '★ Preferred' : '☆ Mark as preferred'}
                  </button>
                </div>

                {/* Response Text */}
                <p className="text-gray-900 whitespace-pre-wrap">{response}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Ranking Summary */}
      {ranking.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Current Ranking</h4>
          <div className="flex items-center gap-2 text-sm">
            {ranking.map((responseIndex, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="font-medium text-primary-600">{i + 1}.</span>
                <span className="text-gray-700">Response {String.fromCharCode(65 + responseIndex)}</span>
                {i < ranking.length - 1 && <span className="text-gray-400 mx-1">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {ranking.length} of {data.responses.length} ranked
        </div>
        <div className="flex gap-3">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              px-6 py-2 rounded-md text-sm font-medium transition-colors
              ${canSubmit
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
})
