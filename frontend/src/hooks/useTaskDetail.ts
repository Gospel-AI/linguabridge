import { useState, useEffect } from 'react'
import { tasksApi, TaskWithCreator } from '../services'

export function useTaskDetail(taskId: string | undefined) {
  const [task, setTask] = useState<TaskWithCreator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (taskId) {
      fetchTaskDetail()
    }
  }, [taskId])

  const fetchTaskDetail = async () => {
    if (!taskId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch task via API
      const data = await tasksApi.get(taskId)
      setTask(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  return {
    task,
    loading,
    error,
    refreshTask: fetchTaskDetail
  }
}
