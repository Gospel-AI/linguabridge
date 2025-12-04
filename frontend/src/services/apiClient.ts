import { supabase, useLocalMode } from '../lib/supabase'

/**
 * APIクライアント基底クラス
 * すべてのAPI呼び出しに認証トークンを自動的に追加
 */
class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  }

  /**
   * 現在のセッションからアクセストークンを取得
   */
  private async getAccessToken(): Promise<string | null> {
    // ローカルモードの場合はlocalStorageからユーザーIDを取得
    if (useLocalMode) {
      const localUserId = localStorage.getItem('linguabridge_local_user')
      if (localUserId) {
        // ローカルモード用の特別なトークン形式
        return `local_${localUserId}`
      }
      return null
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  }

  /**
   * 汎用HTTPリクエストメソッド
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // 認証トークンがあれば追加
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // レスポンスボディを取得
      const data = await response.json()

      // エラーレスポンスの処理
      if (!response.ok) {
        // 詳細なエラー情報を含めたエラーオブジェクトを作成
        const error: any = new Error(data.message || data.error || `HTTP Error: ${response.status}`)
        error.details = data.details
        error.statusCode = response.status
        throw error
      }

      return data as T
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  /**
   * GETリクエスト
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * POSTリクエスト
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUTリクエスト
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETEリクエスト
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// シングルトンインスタンスをエクスポート
export const apiClient = new ApiClient()
