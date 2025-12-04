import { apiClient } from './apiClient'

/**
 * ワーカー関連の型定義
 */
export interface WorkerProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  bio: string | null
  language_pairs: Array<{ source: string; target: string }> | null
  specialized_domains: string[] | null
  certifications: string[] | null
  tier: number
  average_rating: number | null
  total_tasks_completed: number
  created_at: string
  updated_at: string
}

export interface WorkerProfileUpdate {
  full_name?: string | null
  bio?: string | null
  language_pairs?: Array<{ source: string; target: string }> | null
  specialized_domains?: string[] | null
  certifications?: string[] | null
}

export interface WorkerListParams {
  language_pair?: string
  domain?: string
  tier?: number
  limit?: number
  offset?: number
}

/**
 * ワーカー関連API
 */
export const workersApi = {
  /**
   * ワーカー一覧を取得（検索用）
   */
  async list(params?: WorkerListParams): Promise<{ workers: WorkerProfile[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.language_pair) queryParams.append('language_pair', params.language_pair)
    if (params?.domain) queryParams.append('domain', params.domain)
    if (params?.tier) queryParams.append('tier', params.tier.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiClient.get(`/api/workers${query}`)
  },

  /**
   * 自分のプロフィールを取得
   */
  async getMyProfile(): Promise<WorkerProfile> {
    // Backend response structure: { success: boolean, data: WorkerProfile }
    const response = await apiClient.get<{ success: boolean; data: any }>('/api/workers/me')
    
    // Transform backend data structure to frontend WorkerProfile
    const backendData = response.data
    
    return {
      id: backendData.id,
      email: backendData.email,
      full_name: backendData.full_name,
      role: backendData.role,
      bio: backendData.bio,
      language_pairs: backendData.worker?.language_pairs || null,
      specialized_domains: backendData.worker?.specialized_domains || null,
      certifications: backendData.worker?.certifications || null,
      tier: backendData.worker?.tier || 1,
      average_rating: backendData.worker?.average_rating || null,
      total_tasks_completed: backendData.worker?.total_completed_tasks || 0,
      created_at: backendData.created_at,
      updated_at: backendData.updated_at
    }
  },

  /**
   * 自分のプロフィールを更新
   */
  async updateMyProfile(data: WorkerProfileUpdate): Promise<WorkerProfile> {
    return apiClient.put('/api/workers/me', data)
  },

  /**
   * 他のワーカーのプロフィールを取得（公開情報のみ）
   */
  async get(workerId: string): Promise<WorkerProfile> {
    return apiClient.get(`/api/workers/${workerId}`)
  },
}
