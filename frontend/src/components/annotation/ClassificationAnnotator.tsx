import { useState, memo } from 'react'
import type { ClassificationConfig, ClassificationAnnotation } from '../../types/database'

interface ClassificationAnnotatorProps {
  data: {
    text: string
    [key: string]: unknown
  }
  config: ClassificationConfig
  onSubmit: (annotation: ClassificationAnnotation, timeSpent: number) => void
  onSkip?: () => void
}

export const ClassificationAnnotator = memo(function ClassificationAnnotator({
  data,
  config,
  onSubmit,
  onSkip
}: ClassificationAnnotatorProps) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [startTime] = useState(() => Date.now())

  const handleLabelClick = (label: string) => {
    if (config.multi_select) {
      setSelectedLabels(prev =>
        prev.includes(label)
          ? prev.filter(l => l !== label)
          : [...prev, label]
      )
    } else {
      setSelectedLabels([label])
    }
  }

  const handleSubmit = () => {
    if (selectedLabels.length === 0) return

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const annotation: ClassificationAnnotation = config.multi_select
      ? { labels: selectedLabels }
      : { label: selectedLabels[0] }

    onSubmit(annotation, timeSpent)
    setSelectedLabels([])
  }

  const isSelected = (label: string) => selectedLabels.includes(label)
  const canSubmit = selectedLabels.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Instructions */}
      {config.instructions && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Instructions</h3>
          <p className="text-sm text-blue-700">{config.instructions}</p>
        </div>
      )}

      {/* Text to Annotate */}
      <div className="px-6 py-6">
        <h4 className="text-sm font-medium text-gray-500 mb-2">Text</h4>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
            {data.text}
          </p>
        </div>
      </div>

      {/* Labels */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-500 mb-3">
          {config.multi_select ? 'Select all that apply' : 'Select one label'}
        </h4>
        <div className="flex flex-wrap gap-2">
          {config.labels.map((label) => (
            <button
              key={label}
              onClick={() => handleLabelClick(label)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isSelected(label)
                  ? 'bg-primary-600 text-white ring-2 ring-primary-600 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedLabels.length > 0 && (
            <span>Selected: {selectedLabels.join(', ')}</span>
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
