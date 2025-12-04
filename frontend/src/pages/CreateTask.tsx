import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateTask } from '../hooks/useCreateTask'

// Strategic categories aligned with backend schema
const categories = [
  { value: 'translation', label: '🌍 Translation/Localization Validation' },
  { value: 'ai_verification', label: '🤖 AI Verification & Improvement' },
  { value: 'physical_data', label: '📍 Data Collection & Verification (Physical)' },
  { value: 'app_testing', label: '📱 Mobile App & Game Testing' },
  { value: 'general', label: '📝 General Task (Other)' }
]

export function CreateTask() {
  const navigate = useNavigate()
  const { createTask, loading, error } = useCreateTask()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    amount: '',
    deadline: ''
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.trim().length < 10) {
      errors.title = 'Title must be at least 10 characters'
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.trim().length < 50) {
      errors.description = 'Description must be at least 50 characters'
    }

    if (!formData.category) {
      errors.category = 'Please select a category'
    }

    const amount = parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount)) {
      errors.amount = 'Amount is required'
    } else if (amount < 5) {
      errors.amount = 'Minimum amount is $5'
    } else if (amount > 10000) {
      errors.amount = 'Maximum amount is $10,000'
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (deadlineDate < today) {
        errors.deadline = 'Deadline must be in the future'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Convert deadline date to ISO datetime string if provided
    let deadlineDateTime: string | undefined = undefined
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline)
      deadlineDate.setHours(23, 59, 59, 999) // Set to end of day
      deadlineDateTime = deadlineDate.toISOString()
    }

    const result = await createTask({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      deadline: deadlineDateTime
    })

    if (result.success && result.data) {
      navigate(`/tasks/${result.data.id}`)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="mr-2">←</span>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post a New Task
          </h1>
          <p className="text-gray-600">
            Create a micro task and get help from workers around the world
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                validationErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Data Entry - 100 Product Records"
              maxLength={200}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                validationErrors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={8}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the task in detail. What needs to be done? What are the requirements? What deliverables do you expect?"
              maxLength={2000}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/2000 characters (minimum 50)
            </p>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount (USD) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  validationErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
                min="5"
                max="10000"
              />
            </div>
            {validationErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum: $5 | Maximum: $10,000 | Platform fee: 18%
            </p>
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (Optional)
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                validationErrors.deadline ? 'border-red-500' : 'border-gray-300'
              }`}
              min={new Date().toISOString().split('T')[0]}
            />
            {validationErrors.deadline && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.deadline}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              When do you need this task completed?
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Task...' : 'Post Task'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for posting a great task:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be specific and clear about what needs to be done</li>
            <li>• Include any necessary requirements or qualifications</li>
            <li>• Set a fair price based on the complexity and time required</li>
            <li>• Provide examples or references if applicable</li>
            <li>• Respond promptly to worker applications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
