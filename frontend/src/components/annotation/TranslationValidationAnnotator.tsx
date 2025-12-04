import { useState, useCallback, memo, useRef } from 'react'
import type { TranslationValidationConfig, TranslationValidationAnnotation } from '../../types/database'

interface TranslationError {
  type: string
  start: number
  end: number
  comment?: string
}

interface TranslationValidationAnnotatorProps {
  data: {
    source_text: string
    target_text: string
    source_language?: string
    target_language?: string
    [key: string]: unknown
  }
  config: TranslationValidationConfig
  onSubmit: (annotation: TranslationValidationAnnotation, timeSpent: number) => void
  onSkip?: () => void
}

const ERROR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  accuracy: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  fluency: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  terminology: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  style: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  grammar: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  spelling: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  omission: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  addition: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
}

const getErrorColor = (type: string) => {
  return ERROR_COLORS[type.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
}

export const TranslationValidationAnnotator = memo(function TranslationValidationAnnotator({
  data,
  config,
  onSubmit,
  onSkip
}: TranslationValidationAnnotatorProps) {
  const [qualityScore, setQualityScore] = useState<number | null>(null)
  const [errors, setErrors] = useState<TranslationError[]>([])
  const [selectedErrorType, setSelectedErrorType] = useState<string>(config.error_types[0] || '')
  const [comment, setComment] = useState('')
  const [startTime] = useState(() => Date.now())
  const targetTextRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !targetTextRef.current) return

    const range = selection.getRangeAt(0)
    const textContent = targetTextRef.current.textContent || ''

    const preSelectionRange = document.createRange()
    preSelectionRange.selectNodeContents(targetTextRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    const end = start + selection.toString().length

    const selectedText = textContent.substring(start, end).trim()
    if (selectedText.length === 0) return

    const newError: TranslationError = {
      type: selectedErrorType,
      start,
      end
    }

    setErrors(prev => [...prev, newError].sort((a, b) => a.start - b.start))
    selection.removeAllRanges()
  }, [selectedErrorType])

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (qualityScore === null) return

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const annotation: TranslationValidationAnnotation = {
      quality_score: qualityScore,
      errors: errors.length > 0 ? errors : undefined,
      comment: comment.trim() || undefined
    }

    onSubmit(annotation, timeSpent)
    setQualityScore(null)
    setErrors([])
    setComment('')
  }

  const renderAnnotatedText = () => {
    const text = data.target_text
    if (errors.length === 0) return text

    const parts: JSX.Element[] = []
    let lastEnd = 0

    errors.forEach((error, index) => {
      if (error.start > lastEnd) {
        parts.push(
          <span key={`text-${lastEnd}`}>
            {text.substring(lastEnd, error.start)}
          </span>
        )
      }

      const colors = getErrorColor(error.type)
      parts.push(
        <span
          key={`error-${index}`}
          className={`${colors.bg} ${colors.text} px-0.5 border-b-2 ${colors.border} relative group cursor-pointer`}
          onClick={() => removeError(index)}
        >
          {text.substring(error.start, error.end)}
          <span className={`absolute -top-6 left-0 text-xs ${colors.bg} ${colors.text} px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10`}>
            {error.type} (click to remove)
          </span>
        </span>
      )

      lastEnd = error.end
    })

    if (lastEnd < text.length) {
      parts.push(
        <span key={`text-${lastEnd}`}>
          {text.substring(lastEnd)}
        </span>
      )
    }

    return parts
  }

  const canSubmit = qualityScore !== null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Instructions */}
      {config.instructions && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Instructions</h3>
          <p className="text-sm text-blue-700">{config.instructions}</p>
        </div>
      )}

      {/* Scoring Rubric */}
      {config.scoring_rubric && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Scoring Rubric</h4>
          <p className="text-sm text-yellow-700 whitespace-pre-wrap">{config.scoring_rubric}</p>
        </div>
      )}

      {/* Source and Target Texts */}
      <div className="grid grid-cols-2 gap-4 p-6">
        {/* Source Text */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            Source Text
            {data.source_language && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {data.source_language}
              </span>
            )}
          </h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 h-48 overflow-y-auto">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {data.source_text}
            </p>
          </div>
        </div>

        {/* Target Text */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            Translation
            {data.target_language && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {data.target_language}
              </span>
            )}
            <span className="text-xs text-gray-400">(highlight errors)</span>
          </h4>
          <div
            ref={targetTextRef}
            onMouseUp={handleMouseUp}
            className="p-4 bg-white rounded-lg border-2 border-gray-200 h-48 overflow-y-auto cursor-text select-text"
          >
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {renderAnnotatedText()}
            </p>
          </div>
        </div>
      </div>

      {/* Error Type Selector */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Error Type (select before highlighting)</h4>
        <div className="flex flex-wrap gap-2">
          {config.error_types.map((type) => {
            const colors = getErrorColor(type)
            return (
              <button
                key={type}
                onClick={() => setSelectedErrorType(type)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all border
                  ${selectedErrorType === type
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-gray-300`
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Errors List */}
      {errors.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Marked Errors ({errors.length})</h4>
          <div className="flex flex-wrap gap-2">
            {errors.map((error, index) => {
              const colors = getErrorColor(error.type)
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${colors.bg} ${colors.text}`}
                >
                  <span className="font-medium">{error.type}:</span>
                  <span>"{data.target_text.substring(error.start, error.end)}"</span>
                  <button
                    onClick={() => removeError(index)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Quality Score */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-3">
          Overall Quality Score (1 = poor, 5 = excellent)
        </h4>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setQualityScore(value)}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                transition-all
                ${qualityScore === value
                  ? 'bg-primary-600 text-white ring-2 ring-offset-2 ring-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Additional Comments (optional)
        </h4>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Any additional feedback about the translation quality..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {errors.length} errors marked
          {qualityScore !== null && ` • Score: ${qualityScore}/5`}
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
