import { apiClient } from './apiClient'
import type { AnnotationProject, AnnotationTask, AnnotationResult } from '../types/database'

/**
 * アノテーション関連の型定義
 */
export interface ProjectListParams {
  status?: string
  limit?: number
  offset?: number
}

export interface ProjectStats {
  total: number
  completed: number
}

/**
 * アノテーション関連API
 */
export const annotationsApi = {
  /**
   * プロジェクト一覧を取得
   */
  async listProjects(params?: ProjectListParams): Promise<{ projects: AnnotationProject[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''

    const response = await apiClient.get<{
      projects: AnnotationProject[]
      total: number
    }>(`/api/annotations/projects${query}`)

    return {
      projects: response.projects || [],
      total: response.total || 0
    }
  },

  /**
   * プロジェクト詳細を取得
   */
  async getProject(projectId: string): Promise<AnnotationProject> {
    const response = await apiClient.get<{ project: AnnotationProject }>(`/api/annotations/projects/${projectId}`)
    return response.project
  },

  /**
   * プロジェクト統計を取得
   */
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const response = await apiClient.get<ProjectStats>(`/api/annotations/projects/${projectId}/stats`)
    return response
  },

  /**
   * 次のタスクを取得
   */
  async getNextTask(projectId: string): Promise<AnnotationTask | null> {
    const response = await apiClient.get<{ task: AnnotationTask | null }>(`/api/annotations/projects/${projectId}/next-task`)
    return response.task
  },

  /**
   * アノテーションを送信
   */
  async submitAnnotation(
    taskId: string,
    annotation: AnnotationResult,
    timeSpentSeconds: number
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/api/annotations/tasks/${taskId}/submit`, {
      annotation,
      time_spent_seconds: timeSpentSeconds
    })
    return response
  }
}
