import { useState, memo } from 'react'
import type { EvaluationConfig, EvaluationAnnotation } from '../../types/database'

interface EvaluationAnnotatorProps {
  data: {
    text: string
    [key: string]: unknown
  }
  config: EvaluationConfig
  onSubmit: (annotation: EvaluationAnnotation, timeSpent: number) => void
  onSkip?: () => void
}

export const EvaluationAnnotator = memo(function EvaluationAnnotator({
  data,
  config,
  onSubmit,
  onSkip
}: EvaluationAnnotatorProps) {
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [startTime] = useState(() => Date.now())

  const handleSubmit = () => {
    if (score === null) return

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const annotation: EvaluationAnnotation = {
      score,
      comment: comment.trim() || undefined
    }

    onSubmit(annotation, timeSpent)
    setScore(null)
    setComment('')
  }

  const scaleRange = Array.from(
    { length: config.scale_max - config.scale_min + 1 },
    (_, i) => config.scale_min + i
  )

  const getScoreLabel = (value: number) => {
    const percentage = (value - config.scale_min) / (config.scale_max - config.scale_min)
    if (percentage <= 0.2) return 'Poor'
    if (percentage <= 0.4) return 'Fair'
    if (percentage <= 0.6) return 'Good'
    if (percentage <= 0.8) return 'Very Good'
    return 'Excellent'
  }

  const getScoreColor = (value: number) => {
    const percentage = (value - config.scale_min) / (config.scale_max - config.scale_min)
    if (percentage <= 0.2) return 'bg-red-500'
    if (percentage <= 0.4) return 'bg-orange-500'
    if (percentage <= 0.6) return 'bg-yellow-500'
    if (percentage <= 0.8) return 'bg-lime-500'
    return 'bg-green-500'
  }

  const canSubmit = score !== null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Instructions */}
      {config.instructions && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Instructions</h3>
          <p className="text-sm text-blue-700">{config.instructions}</p>
        </div>
      )}

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

      {/* Text to Evaluate */}
      <div className="px-6 py-6">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Text to Evaluate</h4>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
            {data.text}
          </p>
        </div>
      </div>

      {/* Score Selection */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-3">
          Rate the quality ({config.scale_min} = worst, {config.scale_max} = best)
        </h4>
        
        <div className="flex items-center justify-center gap-2">
          {scaleRange.map((value) => (
            <button
              key={value}
              onClick={() => setScore(value)}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                transition-all
                ${score === value
                  ? `${getScoreColor(value)} text-white ring-2 ring-offset-2 ring-gray-400`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {value}
            </button>
          ))}
        </div>

        {score !== null && (
          <div className="text-center mt-3">
            <span className={`
              inline-block px-3 py-1 rounded-full text-sm font-medium text-white
              ${getScoreColor(score)}
            `}>
              {getScoreLabel(score)}
            </span>
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Comment (optional)
        </h4>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any additional feedback or observations..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {score !== null && (
            <span>Score: {score}/{config.scale_max}</span>
          )}
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
