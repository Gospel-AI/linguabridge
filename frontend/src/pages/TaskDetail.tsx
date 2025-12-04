import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTaskDetail } from '../hooks/useTaskDetail'
import { useTaskApplication } from '../hooks/useTaskApplication'
import { useAuth } from '../contexts/AuthContext'
import { tasksApi } from '../services'

export function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { task, loading, error } = useTaskDetail(id)
  const {
    application,
    loading: applicationLoading,
    submitting,
    applyForTask,
    withdrawApplication
  } = useTaskApplication(id)

  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline'
    const date = new Date(deadline)
    const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleApply = async () => {
    const result = await applyForTask(coverLetter)
    if (result.success) {
      setSuccessMessage('Application submitted successfully!')
      setShowApplicationModal(false)
      setCoverLetter('')
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  }

  const handleWithdraw = async () => {
    if (window.confirm('Are you sure you want to withdraw your application?')) {
      const result = await withdrawApplication()
      if (result.success) {
        setSuccessMessage('Application withdrawn successfully')
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    }
  }

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`)) {
      return
    }

    if (!id) return

    try {
      // Delete task via API
      await tasksApi.delete(id)

      alert('Task deleted successfully!')
      navigate('/dashboard')
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Task not found'}</p>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    )
  }

  const isOwnTask = user?.id === task.creator_id
  const deadlineStatus = task.deadline ? formatDeadline(task.deadline) : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/tasks')}
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="mr-2">←</span>
          Back to Tasks
        </button>

        {/* Task Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {task.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-800 font-medium">
                    {task.category}
                  </span>
                  <span>Posted on {formatDate(task.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">
                  ${task.amount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">{task.currency}</div>
              </div>
            </div>

            {/* Deadline Badge */}
            {deadlineStatus && (
              <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                deadlineStatus.includes('Expired') || deadlineStatus.includes('today')
                  ? 'bg-red-100 text-red-800'
                  : deadlineStatus.includes('tomorrow')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {deadlineStatus}
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Task Description
            </h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Creator Section */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Posted By
            </h2>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                {task.creator.full_name?.[0] || task.creator.email[0].toUpperCase()}
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900">
                  {task.creator.full_name || 'Anonymous'}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {task.creator.role}
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-green-600">✓</span>
                <p className="ml-3 text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="p-6">
            {isOwnTask ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This is your task. You can manage it from your dashboard.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Edit Task
                  </button>
                  <button
                    onClick={handleDeleteTask}
                    className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete Task
                  </button>
                </div>
              </div>
            ) : task.status !== 'published' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  This task is not currently available for applications.
                </p>
              </div>
            ) : !user ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Please sign in to apply for this task
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700"
                >
                  Sign In
                </button>
              </div>
            ) : applicationLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : application ? (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${
                  application.status === 'accepted'
                    ? 'bg-green-50 border-green-200'
                    : application.status === 'rejected'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Application Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      application.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : application.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                  {application.cover_letter && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Your Cover Letter:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{application.cover_letter}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    Applied on {formatDate(application.created_at)}
                  </p>
                </div>
                {application.status === 'pending' && (
                  <button
                    onClick={handleWithdraw}
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {submitting ? 'Withdrawing...' : 'Withdraw Application'}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowApplicationModal(true)}
                className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Apply for This Task
              </button>
            )}
          </div>

          {/* Task Details Section */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Task Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 text-gray-900 capitalize">{task.status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-900">{task.category}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Payment:</span>
                <span className="ml-2 text-gray-900">${task.amount.toFixed(2)} {task.currency}</span>
              </div>
              {task.deadline && (
                <div>
                  <span className="font-medium text-gray-700">Deadline:</span>
                  <span className="ml-2 text-gray-900">{formatDate(task.deadline)}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Posted:</span>
                <span className="ml-2 text-gray-900">{formatDate(task.created_at)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(task.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        {showApplicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Apply for Task
              </h2>
              <p className="text-gray-600 mb-4">
                You're applying for: <span className="font-semibold">{task.title}</span>
              </p>

              <div className="mb-6">
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  id="coverLetter"
                  rows={6}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell the client why you're the best fit for this task..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Introduce yourself and explain your relevant experience
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleApply}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  onClick={() => {
                    setShowApplicationModal(false)
                    setCoverLetter('')
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
