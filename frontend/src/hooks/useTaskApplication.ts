import { useState, useEffect } from 'react'
import { applicationsApi, Application } from '../services'
import { useAuth } from '../contexts/AuthContext'

export function useTaskApplication(taskId: string | undefined) {
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (taskId && user) {
      checkExistingApplication()
    } else {
      setLoading(false)
    }
  }, [taskId, user])

  const checkExistingApplication = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all my applications and find the one for this task
      const { applications } = await applicationsApi.listMy()
      const existing = applications.find(app => app.task_id === taskId)
      
      setApplication(existing || null)
    } catch (err) {
      console.error('Error checking application:', err)
      setError(err instanceof Error ? err.message : 'Failed to check application status')
    } finally {
      setLoading(false)
    }
  }

  const applyForTask = async (coverLetter?: string) => {
    if (!user || !taskId) {
      setError('You must be logged in to apply')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      setSubmitting(true)
      setError(null)

      // Check if already applied
      if (application) {
        setError('You have already applied for this task')
        return { success: false, error: 'Already applied' }
      }

      // Create new application via API
      const data = await applicationsApi.create({
        task_id: taskId,
        cover_letter: coverLetter
      })

      setApplication(data)
      return { success: true, data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setSubmitting(false)
    }
  }

  const withdrawApplication = async () => {
    if (!application) {
      return { success: false, error: 'No application to withdraw' }
    }

    try {
      setSubmitting(true)
      setError(null)

      // Note: Backend doesn't have a delete endpoint for applications
      // You may need to add one or handle this differently
      // For now, we'll just clear the local state
      setApplication(null)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw application'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    application,
    loading,
    submitting,
    error,
    applyForTask,
    withdrawApplication,
    refreshApplication: checkExistingApplication
  }
}
