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
  NotFoundError,
  ForbiddenError,
  InternalError,
} from '../utils/errors'

// バリデーションスキーマ
const createTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(1).max(100), // Free text category
  domain_type: z.enum(['translation', 'ai_verification', 'physical_data', 'app_testing']).optional().nullable(),
  amount: z.number().positive().max(10000),
  currency: z.string().default('USD'),
  deadline: z.string().datetime().optional(),
  requirements: z.object({}).passthrough().optional(),
  domain_specific_data: z.object({}).passthrough().optional(),
  custom_fields: z.object({}).passthrough().optional(),
})

const updateTaskSchema = createTaskSchema.partial()

/**
 * タスク一覧取得
 * GET /api/tasks?status=published&category=translation&limit=20&offset=0
 */
export async function listTasks(req: Request, res: Response): Promise<void> {
  const {
    status = 'published',
    category,
    limit = '20',
    offset = '0',
  } = req.query

  const limitNum = parseInt(limit as string)
  const offsetNum = parseInt(offset as string)

  if (useLocalDb) {
    // ローカルDBモード
    try {
      // まずテーブルが存在するか確認
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks')`
      )

      if (!tableCheck.rows[0].exists) {
        // tasksテーブルが存在しない場合は空の配列を返す
        console.log('Note: tasks table does not exist. Returning empty array.')
        paginatedResponse(res, [], 0, limitNum, offsetNum)
        return
      }

      let whereClause = 'WHERE 1=1'
      const params: any[] = []
      let paramIndex = 1

      if (status) {
        whereClause += ` AND t.status = $${paramIndex++}`
        params.push(status)
      }
      if (category) {
        whereClause += ` AND t.category = $${paramIndex++}`
        params.push(category)
      }

      // カウント取得
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM tasks t ${whereClause}`,
        params
      )
      const count = parseInt(countResult.rows[0].count)

      // タスク取得（creator情報を結合）
      const result = await pool.query(
        `SELECT t.*,
                json_build_object('id', u.id, 'email', u.email, 'full_name', u.full_name) as creator
         FROM tasks t
         LEFT JOIN users u ON t.creator_id = u.id
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limitNum, offsetNum]
      )

      paginatedResponse(res, result.rows, count, limitNum, offsetNum)
      return
    } catch (err) {
      console.error('Local DB error:', err)
      throw new InternalError('Failed to fetch tasks')
    }
  }

  // Supabaseモード
  let query = supabase
    .from('tasks')
    .select('*, creator:users!tasks_creator_id_fkey(id, email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offsetNum, offsetNum + limitNum - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data: tasks, error, count } = await query

  if (error) {
    throw new InternalError('Failed to fetch tasks')
  }

  paginatedResponse(
    res,
    tasks || [],
    count || 0,
    limitNum,
    offsetNum,
  )
}

/**
 * タスク詳細取得
 * GET /api/tasks/:id
 */
export async function getTask(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  if (useLocalDb) {
    try {
      const result = await pool.query(
        `SELECT t.*,
                json_build_object('id', u.id, 'email', u.email, 'full_name', u.full_name) as creator
         FROM tasks t
         LEFT JOIN users u ON t.creator_id = u.id
         WHERE t.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError('Task not found')
      }

      // applications取得
      const appsResult = await pool.query(
        `SELECT a.id, a.status, a.created_at,
                json_build_object('id', u.id, 'email', u.email, 'full_name', u.full_name) as worker
         FROM applications a
         LEFT JOIN users u ON a.worker_id = u.id
         WHERE a.task_id = $1`,
        [id]
      )

      const task = {
        ...result.rows[0],
        applications: appsResult.rows
      }

      successResponse(res, task)
      return
    } catch (err) {
      if (err instanceof NotFoundError) throw err
      console.error('Local DB error:', err)
      throw new InternalError('Failed to fetch task')
    }
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:users!tasks_creator_id_fkey(id, email, full_name),
      applications(
        id,
        status,
        created_at,
        worker:users!applications_worker_id_fkey(id, email, full_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Task not found')
    }
    throw new InternalError('Failed to fetch task')
  }

  successResponse(res, task)
}

/**
 * タスク作成
 * POST /api/tasks
 */
export async function createTask(req: Request, res: Response): Promise<void> {
  // バリデーション
  const validatedData = createTaskSchema.parse(req.body)

  // モデレーション結果を含むデータ準備
  const taskData: any = {
    ...validatedData,
    creator_id: req.user!.id,
    status: req.body.status || 'published', // モデレーションで設定されたstatusを優先
  }

  // モデレーション関連フィールドを追加
  if (req.body.moderation_status) {
    taskData.moderation_status = req.body.moderation_status
  }
  if (req.body.moderation_flags) {
    taskData.moderation_flags = req.body.moderation_flags
  }
  if (req.body.moderation_warnings) {
    taskData.moderation_warnings = req.body.moderation_warnings
  }

  // タスク作成
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) {
    throw new InternalError('Failed to create task')
  }

  // タスクIDをres.localsに保存（logModerationミドルウェア用）
  res.locals.taskId = task.id

  // モデレーションメッセージがあれば追加
  const moderationMessage = (req as any).moderationMessage
  if (moderationMessage) {
    successResponse(res, { ...task, message: moderationMessage }, HttpStatus.CREATED)
  } else {
    successResponse(res, task, HttpStatus.CREATED)
  }
}

/**
 * タスク更新
 * PUT /api/tasks/:id
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  // 権限チェック：自分が作成したタスクのみ更新可能
  const { data: existingTask, error: fetchError } = await supabase
    .from('tasks')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new NotFoundError('Task not found')
    }
    throw new InternalError('Failed to fetch task')
  }

  if (existingTask.creator_id !== req.user!.id) {
    throw new ForbiddenError('You can only update your own tasks')
  }

  // バリデーション
  const validatedData = updateTaskSchema.parse(req.body)

  // タスク更新
  const { data: task, error } = await supabase
    .from('tasks')
    .update(validatedData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new InternalError('Failed to update task')
  }

  successResponse(res, task)
}

/**
 * タスク削除
 * DELETE /api/tasks/:id
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  // 権限チェック：自分が作成したタスクのみ削除可能
  const { data: existingTask, error: fetchError } = await supabase
    .from('tasks')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new NotFoundError('Task not found')
    }
    throw new InternalError('Failed to fetch task')
  }

  if (existingTask.creator_id !== req.user!.id) {
    throw new ForbiddenError('You can only delete your own tasks')
  }

  // タスク削除
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    throw new InternalError('Failed to delete task')
  }

  res.status(HttpStatus.NO_CONTENT).send()
}
