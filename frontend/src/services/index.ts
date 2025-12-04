/**
 * APIサービスの統一エクスポート
 */
export { apiClient } from './apiClient'
export { tasksApi } from './tasksApi'
export { applicationsApi } from './applicationsApi'
export { workersApi } from './workersApi'
export { annotationsApi } from './annotationsApi'

// 型定義もエクスポート
export type {
  Task,
  TaskWithCreator,
  TaskFormData,
  TaskListParams,
} from './tasksApi'

export type {
  Application,
  ApplicationWithTask,
  ApplicationFormData,
} from './applicationsApi'

export type {
  WorkerProfile,
  WorkerProfileUpdate,
  WorkerListParams,
} from './workersApi'

export type {
  ProjectListParams,
  ProjectStats,
} from './annotationsApi'
