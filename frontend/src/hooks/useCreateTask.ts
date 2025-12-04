import { useState } from 'react'
import { tasksApi, TaskFormData } from '../services'

export function useCreateTask() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTask = async (taskData: TaskFormData) => {
    try {
      setLoading(true)
      setError(null)

      // Validation
      if (!taskData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!taskData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!taskData.category) {
        throw new Error('Category is required')
      }
      if (taskData.amount <= 0) {
        throw new Error('Amount must be greater than 0')
      }

      // Create task via API
      const data = await tasksApi.create(taskData)

      return { success: true, data }
    } catch (err) {
      let errorMessage = 'Failed to create task'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // 詳細なバリデーションエラーがある場合、それを表示
        const details = (err as any).details
        if (details && Array.isArray(details)) {
          const detailMessages = details.map((detail: any) => {
            const field = detail.path?.join('.') || 'field'
            return `${field}: ${detail.message}`
          }).join(', ')
          errorMessage = `${errorMessage} - ${detailMessages}`
        }
      }
      
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    createTask,
    loading,
    error,
    clearError: () => setError(null)
  }
}
