import { Request, Response } from 'express'
import { supabase, useLocalDb } from '../lib/supabase.js'
import { pool } from '../lib/database.js'
import { z } from 'zod'
import {
  successResponse,
  paginatedResponse,
  HttpStatus,
} from '../utils/response'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  InternalError,
} from '../utils/errors'

// バリデーションスキーマ
const createApplicationSchema = z.object({
  task_id: z.string().uuid(),
  submission_text: z.string().min(50).max(1000).optional(), // カバーレターとして使用
  metadata: z.record(z.any()).optional(), // 追加情報
})

const updateStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  client_feedback: z.string().max(1000).optional(),
})

/**
 * タスクに応募
 * POST /api/applications
 */
export async function createApplication(req: Request, res: Response): Promise<void> {
  const validated = createApplicationSchema.parse(req.body)

  // タスクが存在し、公開されているか確認
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, creator_id, status')
    .eq('id', validated.task_id)
    .single()

  if (taskError || !task) {
    throw new NotFoundError('Task not found')
  }

  if (task.status !== 'published') {
    throw new BadRequestError('Task is not available for applications')
  }

  // 自分のタスクには応募できない
  if (task.creator_id === req.user!.id) {
    throw new BadRequestError('Cannot apply to your own task')
  }

  // worker_idを取得（usersテーブルからworkersテーブルへ）
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user!.id)
    .single()

  if (!worker) {
    throw new BadRequestError('Worker profile not found. Please complete your profile first.')
  }

  // 既に応募済みか確認
  const { data: existing } = await supabase
    .from('task_submissions')
    .select('id')
    .eq('task_id', validated.task_id)
    .eq('worker_id', worker.id)
    .single()

  if (existing) {
    throw new BadRequestError('You have already applied to this task')
  }

  // 応募を作成
  const { data: application, error: createError } = await supabase
    .from('task_submissions')
    .insert({
      task_id: validated.task_id,
      worker_id: worker.id,
      submission_text: validated.submission_text,
      metadata: validated.metadata || {},
      status: 'submitted', // 応募済み
    })
    .select(`
      *,
      task:tasks(id, title, description, amount),
      worker:workers(
        id,
        user:users!workers_user_id_fkey(id, email, full_name, avatar_url)
      )
    `)
    .single()

  if (createError) {
    throw new InternalError('Failed to create application')
  }

  successResponse(res, application, HttpStatus.CREATED)
}

/**
 * 自分の応募一覧取得
 * GET /api/applications?status=submitted&limit=20&offset=0
 */
export async function listMyApplications(req: Request, res: Response): Promise<void> {
  const {
    status,
    limit = '20',
    offset = '0',
  } = req.query

  const limitNum = parseInt(limit as string)
  const offsetNum = parseInt(offset as string)

  if (useLocalDb) {
    // ローカルDBモード - テーブルが存在しない場合は空を返す
    try {
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications')`
      )

      if (!tableCheck.rows[0].exists) {
        console.log('Note: applications table does not exist. Returning empty array.')
        paginatedResponse(res, [], 0, limitNum, offsetNum)
        return
      }

      // テーブルがある場合のみ処理を続行
      paginatedResponse(res, [], 0, limitNum, offsetNum)
      return
    } catch (err) {
      console.error('Local DB error:', err)
      throw new InternalError('Failed to fetch applications')
    }
  }

  // Supabaseモード
  // worker_idを取得
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user!.id)
    .single()

  if (!worker) {
    return paginatedResponse(res, [], 0, limitNum, offsetNum)
  }

  let query = supabase
    .from('task_submissions')
    .select(`
      *,
      task:tasks(id, title, description, amount, status)
    `, { count: 'exact' })
    .eq('worker_id', worker.id)
    .order('created_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: applications, error, count } = await query

  if (error) {
    throw new InternalError('Failed to fetch applications')
  }

  paginatedResponse(
    res,
    applications || [],
    count || 0,
    limitNum,
    offsetNum,
  )
}

/**
 * 応募詳細取得
 * GET /api/applications/:id
 */
export async function getApplication(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const { data: application, error } = await supabase
    .from('task_submissions')
    .select(`
      *,
      task:tasks(id, title, description, amount, status, creator_id),
      worker:workers(
        id,
        user:users!workers_user_id_fkey(id, email, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !application) {
    throw new NotFoundError('Application not found')
  }

  // worker_idを取得
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('user_id', req.user!.id)
    .single()

  // 権限確認：応募者本人またはタスク作成者のみ
  if (worker && application.worker_id !== worker.id && application.task.creator_id !== req.user!.id) {
    throw new ForbiddenError('Access denied')
  }

  successResponse(res, application)
}

/**
 * 応募ステータス更新
 * PUT /api/applications/:id/status
 */
export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const validated = updateStatusSchema.parse(req.body)

  // 応募を取得
  const { data: application, error: fetchError } = await supabase
    .from('task_submissions')
    .select(`
      *,
      task:tasks(id, creator_id),
      worker:workers(id, user_id)
    `)
    .eq('id', id)
    .single()

  if (fetchError || !application) {
    throw new NotFoundError('Application not found')
  }

  // 権限確認
  if (validated.status === 'under_review' || validated.status === 'approved' || validated.status === 'rejected') {
    // クライアントのみが審査・承認・拒否可能
    if (application.task.creator_id !== req.user!.id) {
      throw new ForbiddenError('Only task creator can update application status')
    }
  }

  // ステータス更新
  const updateData: {
    status: string
    updated_at: string
    client_feedback?: string
    reviewed_at?: string
    client_reviewed_at?: string
  } = {
    status: validated.status,
    updated_at: new Date().toISOString(),
  }

  if (validated.client_feedback) {
    updateData.client_feedback = validated.client_feedback
  }

  if (validated.status === 'approved' || validated.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString()
    updateData.client_reviewed_at = new Date().toISOString()
  }

  const { data: updated, error: updateError } = await supabase
    .from('task_submissions')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      task:tasks(id, title, description, amount),
      worker:workers(
        id,
        user:users!workers_user_id_fkey(id, email, full_name, avatar_url)
      )
    `)
    .single()

  if (updateError) {
    throw new InternalError('Failed to update application status')
  }

  successResponse(res, updated)
}

/**
 * タスクの応募一覧取得（タスク作成者のみ）
 * GET /api/tasks/:taskId/applications
 */
export async function listTaskApplications(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params
  const { status, limit = '50', offset = '0' } = req.query

  // タスクの作成者確認
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, creator_id')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    throw new NotFoundError('Task not found')
  }

  if (task.creator_id !== req.user!.id) {
    throw new ForbiddenError('Only task creator can view applications')
  }

  // 応募一覧取得
  let query = supabase
    .from('task_submissions')
    .select(`
      *,
      worker:workers(
        id,
        tier,
        average_rating,
        total_completed_tasks,
        user:users!workers_user_id_fkey(id, email, full_name, avatar_url)
      )
    `, { count: 'exact' })
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: applications, error, count } = await query

  if (error) {
    throw new InternalError('Failed to fetch task applications')
  }

  paginatedResponse(
    res,
    applications || [],
    count || 0,
    parseInt(limit as string),
    parseInt(offset as string),
  )
}

/**
 * 複数タスクのアプリケーション一覧取得（バッチ処理）
 * GET /api/tasks/batch-applications?taskIds=1,2,3
 */
export async function batchGetTaskApplications(req: Request, res: Response): Promise<void> {
  const { taskIds } = req.query

  if (!taskIds || typeof taskIds !== 'string') {
    throw new BadRequestError('taskIds query parameter is required')
  }

  // カンマ区切りのIDを配列に変換
  const taskIdArray = taskIds.split(',').map(id => id.trim()).filter(id => id)

  if (taskIdArray.length === 0) {
    throw new BadRequestError('At least one task ID is required')
  }

  // 最大100件までに制限（パフォーマンス対策）
  if (taskIdArray.length > 100) {
    throw new BadRequestError('Maximum 100 task IDs allowed per request')
  }

  // 全タスクを一度に取得して、作成者確認
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, creator_id')
    .in('id', taskIdArray)

  if (tasksError) {
    throw new InternalError('Failed to fetch tasks')
  }

  // 自分が作成したタスクのみフィルタリング
  const myTaskIds = tasks
    ?.filter(task => task.creator_id === req.user!.id)
    .map(task => task.id) || []

  if (myTaskIds.length === 0) {
    return successResponse(res, { applications: {} })
  }

  // 全アプリケーションを一度に取得（N+1問題解決）
  const { data: allApplications, error: appsError } = await supabase
    .from('task_submissions')
    .select(`
      *,
      worker:workers(
        id,
        tier,
        average_rating,
        total_completed_tasks,
        user:users!workers_user_id_fkey(id, email, full_name, avatar_url)
      )
    `)
    .in('task_id', myTaskIds)
    .order('created_at', { ascending: false })

  if (appsError) {
    throw new InternalError('Failed to fetch task applications')
  }

  // タスクIDごとにアプリケーションをグループ化
  const applicationsByTask: Record<string, unknown[]> = {}

  myTaskIds.forEach(taskId => {
    applicationsByTask[taskId] = []
  })

  allApplications?.forEach(app => {
    if (applicationsByTask[app.task_id]) {
      applicationsByTask[app.task_id].push(app)
    }
  })

  successResponse(res, { applications: applicationsByTask })
}
