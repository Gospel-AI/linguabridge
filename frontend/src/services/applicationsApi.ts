import { apiClient } from './apiClient'

/**
 * 応募関連の型定義
 */
export interface Application {
  id: string
  task_id: string
  worker_id: string
  status: 'pending' | 'accepted' | 'rejected'
  cover_letter: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationWithTask extends Application {
  task: {
    id: string
    title: string
    description: string
    category: string
    amount: number
    currency: string
    status: string
    deadline: string | null
  }
}

export interface ApplicationFormData {
  task_id: string
  cover_letter?: string
}

/**
 * 応募関連API
 */
export const applicationsApi = {
  /**
   * タスクに応募
   */
  async create(data: ApplicationFormData): Promise<Application> {
    return apiClient.post('/api/applications', data)
  },

  /**
   * 自分の応募一覧を取得
   */
  async listMy(): Promise<{ applications: ApplicationWithTask[] }> {
    // Backend response structure: { success: boolean, data: ApplicationWithTask[] }
    const response = await apiClient.get<{ success: boolean; data: ApplicationWithTask[] }>('/api/applications')
    
    return {
      applications: response.data || []
    }
  },

  /**
   * 応募詳細を取得
   */
  async get(applicationId: string): Promise<ApplicationWithTask> {
    return apiClient.get(`/api/applications/${applicationId}`)
  },

  /**
   * 応募ステータスを更新
   */
  async updateStatus(
    applicationId: string,
    status: 'accepted' | 'rejected'
  ): Promise<Application> {
    return apiClient.put(`/api/applications/${applicationId}/status`, { status })
  },
}
