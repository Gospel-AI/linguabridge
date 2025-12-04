import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useDashboard } from '../hooks/useDashboard'
import { tasksApi, applicationsApi } from '../services'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { postedTasks, appliedTasks, stats, loading, error, refreshDashboard } = useDashboard()
  const [activeTab, setActiveTab] = useState<'posted' | 'applied'>('posted')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [processingApplications, setProcessingApplications] = useState<Set<string>>(new Set())

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    setProcessingApplications(prev => new Set(prev).add(applicationId))

    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected'

      // Update application status via API
      await applicationsApi.updateStatus(applicationId, newStatus)

      // Refresh dashboard data
      await refreshDashboard()

      alert(`Application ${action}ed successfully!`)
    } catch (err) {
      console.error('Error updating application:', err)
      alert(`Failed to ${action} application. Please try again.`)
    } finally {
      setProcessingApplications(prev => {
        const newSet = new Set(prev)
        newSet.delete(applicationId)
        return newSet
      })
    }
  }

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete task via API
      await tasksApi.delete(taskId)

      // Refresh dashboard data
      await refreshDashboard()

      alert('Task deleted successfully!')
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Failed to delete task. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
      case 'draft':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  const isClient = profile?.role === 'client' || profile?.role === 'both'
  const isWorker = profile?.role === 'worker' || profile?.role === 'both'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {profile?.full_name || user?.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isClient && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Posted Tasks</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.postedTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isWorker && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Applied Tasks</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.appliedTasks}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.acceptedApplications}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        {profile?.role === 'both' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('posted')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'posted'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Posted Tasks ({postedTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab('applied')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'applied'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Applications ({appliedTasks.length})
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Posted Tasks Section */}
        {(isClient && (profile?.role !== 'both' || activeTab === 'posted')) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Posted Tasks</h2>
              <Link
                to="/tasks/new"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
              >
                + Post New Task
              </Link>
            </div>

            {postedTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't posted any tasks yet</p>
                <Link
                  to="/tasks/new"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Post Your First Task
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {postedTasks.map(task => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Link to={`/tasks/${task.id}`} className="hover:text-primary-600">
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      </div>
                      <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(task.status)}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span className="font-medium text-primary-600">${task.amount.toFixed(2)}</span>
                        <span>{task.category}</span>
                        <span>Posted {formatDate(task.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">
                          {task.applications?.length || 0} applications
                        </span>
                        {task.applications && task.applications.length > 0 && (
                          <>
                            <span className="text-green-600 font-medium">
                              ({task.applications?.filter(a => a.status === 'pending').length || 0} pending)
                            </span>
                            <button
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                              {expandedTasks.has(task.id) ? '▼ Hide' : '► View'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit and Delete Buttons */}
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/tasks/${task.id}/edit`)}
                        className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                      >
                        Edit Task
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="px-4 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Applications List */}
                    {expandedTasks.has(task.id) && task.applications && task.applications.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <h4 className="font-semibold text-gray-900 mb-3">Applications:</h4>
                        {task.applications.map(application => (
                          <div key={application.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {application.worker.full_name || application.worker.email}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Applied on {formatDate(application.created_at)}
                                </p>
                                {application.cover_letter && (
                                  <div className="mt-2 bg-white rounded p-3 border border-gray-200">
                                    <p className="text-xs font-medium text-gray-600 mb-1">Cover Letter:</p>
                                    <p className="text-sm text-gray-700">{application.cover_letter}</p>
                                  </div>
                                )}
                              </div>
                              <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            {application.status === 'pending' && (
                              <div className="flex space-x-2 mt-3">
                                <button
                                  onClick={() => handleApplicationAction(application.id, 'accept')}
                                  disabled={processingApplications.has(application.id)}
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                  {processingApplications.has(application.id) ? 'Processing...' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => handleApplicationAction(application.id, 'reject')}
                                  disabled={processingApplications.has(application.id)}
                                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                  {processingApplications.has(application.id) ? 'Processing...' : 'Reject'}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applied Tasks Section */}
        {(isWorker && (profile?.role !== 'both' || activeTab === 'applied')) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
              <Link
                to="/tasks"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
              >
                Browse Tasks
              </Link>
            </div>

            {appliedTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't applied to any tasks yet</p>
                <Link
                  to="/tasks"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Browse Available Tasks
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appliedTasks.map(application => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Link to={`/tasks/${application.task.id}`} className="hover:text-primary-600">
                          <h3 className="text-lg font-semibold text-gray-900">{application.task.title}</h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{application.task.description}</p>
                      </div>
                      <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span className="font-medium text-primary-600">${application.task.amount.toFixed(2)}</span>
                        <span>{application.task.category}</span>
                        <span>Applied {formatDate(application.created_at)}</span>
                      </div>
                    </div>

                    {application.cover_letter && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Your cover letter:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{application.cover_letter}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
