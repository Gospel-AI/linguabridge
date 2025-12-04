import { useState, useCallback, memo, useRef } from 'react'
import type { NERConfig, NERAnnotation, NEREntity } from '../../types/database'

interface NERAnnotatorProps {
  data: {
    text: string
    [key: string]: unknown
  }
  config: NERConfig
  onSubmit: (annotation: NERAnnotation, timeSpent: number) => void
  onSkip?: () => void
}

const ENTITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PERSON: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  LOCATION: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  ORGANIZATION: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  DATE: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  TIME: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  MONEY: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  PRODUCT: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  EVENT: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
}

const getEntityColor = (type: string) => {
  return ENTITY_COLORS[type] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
}

export const NERAnnotator = memo(function NERAnnotator({
  data,
  config,
  onSubmit,
  onSkip
}: NERAnnotatorProps) {
  const [entities, setEntities] = useState<NEREntity[]>([])
  const [selectedType, setSelectedType] = useState<string>(config.entity_types[0] || '')
  const [startTime] = useState(() => Date.now())
  const textRef = useRef<HTMLDivElement>(null)

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !textRef.current) return

    const range = selection.getRangeAt(0)
    const textContent = textRef.current.textContent || ''
    
    // Calculate start and end positions
    const preSelectionRange = document.createRange()
    preSelectionRange.selectNodeContents(textRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    const end = start + selection.toString().length

    // Check for overlapping entities
    if (!config.allow_overlapping) {
      const hasOverlap = entities.some(
        e => (start < e.end && end > e.start)
      )
      if (hasOverlap) {
        selection.removeAllRanges()
        return
      }
    }

    const selectedText = textContent.substring(start, end).trim()
    if (selectedText.length === 0) return

    const newEntity: NEREntity = {
      text: selectedText,
      start,
      end,
      type: selectedType
    }

    setEntities(prev => [...prev, newEntity].sort((a, b) => a.start - b.start))
    selection.removeAllRanges()
  }, [entities, selectedType, config.allow_overlapping])

  const removeEntity = (index: number) => {
    setEntities(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    onSubmit({ entities }, timeSpent)
    setEntities([])
  }

  // Render text with entity highlights
  const renderAnnotatedText = () => {
    const text = data.text
    if (entities.length === 0) return text

    const parts: JSX.Element[] = []
    let lastEnd = 0

    entities.forEach((entity, index) => {
      // Add text before entity
      if (entity.start > lastEnd) {
        parts.push(
          <span key={`text-${lastEnd}`}>
            {text.substring(lastEnd, entity.start)}
          </span>
        )
      }

      // Add entity
      const colors = getEntityColor(entity.type)
      parts.push(
        <span
          key={`entity-${index}`}
          className={`${colors.bg} ${colors.text} px-1 rounded border ${colors.border} relative group cursor-pointer`}
          onClick={() => removeEntity(index)}
        >
          {entity.text}
          <span className={`absolute -top-5 left-0 text-xs ${colors.bg} ${colors.text} px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity`}>
            {entity.type} (click to remove)
          </span>
        </span>
      )

      lastEnd = entity.end
    })

    // Add remaining text
    if (lastEnd < text.length) {
      parts.push(
        <span key={`text-${lastEnd}`}>
          {text.substring(lastEnd)}
        </span>
      )
    }

    return parts
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Instructions */}
      {config.instructions && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Instructions</h3>
          <p className="text-sm text-blue-700">{config.instructions}</p>
        </div>
      )}

      {/* Entity Type Selector */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Select entity type, then highlight text</h4>
        <div className="flex flex-wrap gap-2">
          {config.entity_types.map((type) => {
            const colors = getEntityColor(type)
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all border
                  ${selectedType === type
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

      {/* Text to Annotate */}
      <div className="px-6 py-6">
        <h4 className="text-sm font-medium text-gray-500 mb-2">
          Highlight text to tag entities
        </h4>
        <div
          ref={textRef}
          onMouseUp={handleMouseUp}
          className="p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-text select-text"
        >
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
            {renderAnnotatedText()}
          </p>
        </div>
      </div>

      {/* Tagged Entities List */}
      {entities.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Tagged Entities ({entities.length})</h4>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => {
              const colors = getEntityColor(entity.type)
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${colors.bg} ${colors.text}`}
                >
                  <span className="font-medium">{entity.type}:</span>
                  <span>"{entity.text}"</span>
                  <button
                    onClick={() => removeEntity(index)}
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

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {entities.length} entities tagged
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
            className="px-6 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
})
