import { apiClient } from './apiClient'

/**
 * タスク関連の型定義
 */
export interface Task {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  amount: number
  currency: string
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
}

export interface TaskWithCreator extends Task {
  creator: {
    id: string
    email: string
    full_name: string | null
    role: string
  }
}

export interface TaskFormData {
  title: string
  description: string
  category: string
  amount: number
  deadline?: string // Optional datetime string (ISO 8601)
}

export interface TaskListParams {
  status?: string
  category?: string
  limit?: number
  offset?: number
}

/**
 * タスク関連API
 */
export const tasksApi = {
  /**
   * タスク一覧を取得
   */
  async list(params?: TaskListParams): Promise<{ tasks: TaskWithCreator[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    
    // Backend response structure: { success: boolean, data: TaskWithCreator[], meta: { total, limit, offset, hasMore } }
    const response = await apiClient.get<{
      success: boolean
      data: TaskWithCreator[]
      meta: { total: number; limit: number; offset: number; hasMore: boolean }
    }>(`/api/tasks${query}`)
    
    return {
      tasks: response.data || [],
      total: response.meta?.total || 0
    }
  },

  /**
   * タスク詳細を取得
   */
  async get(taskId: string): Promise<TaskWithCreator> {
    const response = await apiClient.get<{ success: boolean; data: TaskWithCreator }>(`/api/tasks/${taskId}`)
    return response.data
  },

  /**
   * タスクを作成
   */
  async create(data: TaskFormData): Promise<Task> {
    const response = await apiClient.post<{ success: boolean; data: Task }>('/api/tasks', data)
    return response.data
  },

  /**
   * タスクを更新
   */
  async update(taskId: string, data: Partial<TaskFormData>): Promise<Task> {
    const response = await apiClient.put<{ success: boolean; data: Task }>(`/api/tasks/${taskId}`, data)
    return response.data
  },

  /**
   * タスクを削除
   */
  async delete(taskId: string): Promise<{ message: string }> {
    await apiClient.delete(`/api/tasks/${taskId}`)
    return { message: 'Task deleted successfully' }
  },

  /**
   * タスクの応募一覧を取得
   */
  async getApplications(taskId: string): Promise<{
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
  }> {
    const response = await apiClient.get<{
      success: boolean
      data: Array<{
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
    }>(`/api/tasks/${taskId}/applications`)
    return { applications: response.data || [] }
  },


  // Batch get applications for multiple tasks (solves N+1 problem)
  async batchGetApplications(taskIds: string[]): Promise<{
    applications: Record<string, Array<{
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
    }>>
  }> {
    if (taskIds.length === 0) {
      return { applications: {} }
    }
    
    // Backend response structure: { success: boolean, data: { applications: {...} } }
    const response = await apiClient.get<{
      success: boolean
      data: {
        applications: Record<string, Array<{
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
        }>>
      }
    }>(`/api/tasks/batch-applications?taskIds=${taskIds.join(',')}`)
    
    return {
      applications: response.data?.applications || {}
    }
  },
}
