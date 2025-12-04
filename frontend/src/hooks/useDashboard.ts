import { useState, useEffect, useCallback } from 'react'
import { tasksApi, applicationsApi, TaskWithCreator, ApplicationWithTask } from '../services'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
  postedTasks: number
  activeTasks: number
  appliedTasks: number
  acceptedApplications: number
}

// TaskWithCreator型にアプリケーション情報を追加
export interface TaskWithApplications extends TaskWithCreator {
  applications: Array<{
    id: string
    task_id: string
    worker_id: string
    status: string
    cover_letter: string | null
    created_at: string
    worker: {
      id: string
      full_name: string | null
      email: string
    }
  }>
}

export function useDashboard() {
  const { user } = useAuth()
  const [postedTasks, setPostedTasks] = useState<TaskWithApplications[]>([])
  const [appliedTasks, setAppliedTasks] = useState<ApplicationWithTask[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    postedTasks: 0,
    activeTasks: 0,
    appliedTasks: 0,
    acceptedApplications: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Phase 1: Fetch core data immediately (fastest)
      const [tasksResponse, applicationsResponse] = await Promise.all([
        tasksApi.list(),
        applicationsApi.listMy()
      ])

      // DEBUG: Log API responses
      console.log('🔍 Dashboard Debug - Tasks Response:', tasksResponse)
      console.log('🔍 Dashboard Debug - Applications Response:', applicationsResponse)
      console.log('🔍 Dashboard Debug - Current User ID:', user.id)

      // Filter tasks created by current user (with safe fallbacks)
      const myTasks = (tasksResponse?.tasks || []).filter(t => t.creator_id === user.id)
      const myApplications = applicationsResponse?.applications || []

      // DEBUG: Log filtered data
      console.log('🔍 Dashboard Debug - My Tasks:', myTasks)
      console.log('🔍 Dashboard Debug - My Applications:', myApplications)

      // Calculate and display stats immediately (no applications needed)
      const activeTasks = myTasks.filter(t => t.status === 'published').length
      const acceptedApps = myApplications.filter(a => a.status === 'accepted').length

      setStats({
        postedTasks: myTasks.length,
        activeTasks,
        appliedTasks: myApplications.length,
        acceptedApplications: acceptedApps
      })

      // Display tasks without applications first (fast initial render)
      const tasksWithoutApps: TaskWithApplications[] = myTasks.map(task => ({
        ...task,
        applications: []
      }))
      setPostedTasks(tasksWithoutApps)
      setAppliedTasks(myApplications)
      
      // Loading complete for initial view
      setLoading(false)

      // Phase 2: Fetch applications using BATCH API (single request)
      if (myTasks.length > 0) {
        const taskIds = myTasks.map(task => task.id)
        
        try {
          // Single batch request instead of N requests!
          const batchResponse = await tasksApi.batchGetApplications(taskIds)

          // Merge applications into tasks
          const tasksWithApplications: TaskWithApplications[] = myTasks.map(task => ({
            ...task,
            applications: batchResponse.applications[task.id] || []
          }))

          setPostedTasks(tasksWithApplications)
        } catch (batchError) {
          // Batch API failed, but core dashboard is still functional
          console.error('Failed to load applications:', batchError)
          // Don't show error to user, they can still see their tasks
        }
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, fetchDashboardData])

  return {
    postedTasks,
    appliedTasks,
    stats,
    loading,
    error,
    refreshDashboard: fetchDashboardData
  }
}
