import { Request, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { z } from 'zod'
import {
  successResponse,
  paginatedResponse,
} from '../utils/response'
import {
  InternalError,
  NotFoundError,
} from '../utils/errors'

// バリデーションスキーマ
const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

const updateWorkerSchema = z.object({
  language_pairs: z.array(z.object({
    source: z.string(),
    target: z.string(),
  })).optional(),
  specialized_domains: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
})

/**
 * 自分のプロフィール取得
 * GET /api/workers/me
 */
export async function getMyProfile(req: Request, res: Response): Promise<void> {
  // usersテーブルから基本情報
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user!.id)
    .single()

  if (userError) {
    throw new InternalError('Failed to fetch user profile')
  }

  // workersテーブルから詳細情報
  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('*')
    .eq('user_id', req.user!.id)
    .single()

  // workerレコードがない場合は作成
  let workerData = worker
  if (workerError && workerError.code === 'PGRST116') {
    const { data: newWorker, error: createError } = await supabase
      .from('workers')
      .insert({
        user_id: req.user!.id,
        language_pairs: [],
        specialized_domains: [],
        certifications: [],
        tier: 1,
        average_rating: 0,
        total_completed_tasks: 0,
      })
      .select()
      .single()

    if (createError) {
      throw new InternalError('Failed to create worker profile')
    }
    workerData = newWorker
  } else if (workerError) {
    throw new InternalError('Failed to fetch worker profile')
  }

  successResponse(res, {
    ...user,
    worker: workerData,
  })
}

/**
 * 自分のプロフィール更新
 * PUT /api/workers/me
 */
export async function updateMyProfile(req: Request, res: Response): Promise<void> {
  const { profile, worker } = req.body

  // usersテーブル更新
  if (profile) {
    const validatedProfile = updateProfileSchema.parse(profile)

    const { error: userError } = await supabase
      .from('users')
      .update(validatedProfile)
      .eq('id', req.user!.id)

    if (userError) {
      throw new InternalError('Failed to update user profile')
    }
  }

  // workersテーブル更新
  if (worker) {
    const validatedWorker = updateWorkerSchema.parse(worker)

    // workerレコードが存在するか確認
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('id')
      .eq('user_id', req.user!.id)
      .single()

    if (existingWorker) {
      // 更新
      const { error: workerError } = await supabase
        .from('workers')
        .update(validatedWorker)
        .eq('user_id', req.user!.id)

      if (workerError) {
        throw new InternalError('Failed to update worker profile')
      }
    } else {
      // 作成
      const { error: workerError } = await supabase
        .from('workers')
        .insert({
          user_id: req.user!.id,
          ...validatedWorker,
          tier: 1,
          average_rating: 0,
          total_completed_tasks: 0,
        })

      if (workerError) {
        throw new InternalError('Failed to create worker profile')
      }
    }
  }

  // 更新後のプロフィール取得
  const { data: updatedUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user!.id)
    .single()

  const { data: updatedWorker } = await supabase
    .from('workers')
    .select('*')
    .eq('user_id', req.user!.id)
    .single()

  successResponse(res, {
    ...updatedUser,
    worker: updatedWorker,
  })
}

/**
 * ワーカープロフィール取得（公開情報のみ）
 * GET /api/workers/:id
 */
export async function getWorkerProfile(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  // usersテーブルから公開情報のみ
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, created_at')
    .eq('id', id)
    .eq('role', 'worker')  // workerのみ
    .single()

  if (userError) {
    if (userError.code === 'PGRST116') {
      throw new NotFoundError('Worker not found')
    }
    throw new InternalError('Failed to fetch worker profile')
  }

  // workersテーブルから公開情報
  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('tier, average_rating, total_completed_tasks, language_pairs, specialized_domains, certifications')
    .eq('user_id', id)
    .single()

  if (workerError && workerError.code !== 'PGRST116') {
    throw new InternalError('Failed to fetch worker profile')
  }

  successResponse(res, {
    ...user,
    worker: worker || null,
  })
}

/**
 * ワーカー一覧取得（検索用）
 * GET /api/workers?domain=translation&tier=2&limit=20&offset=0
 */
export async function listWorkers(req: Request, res: Response): Promise<void> {
  const {
    domain,
    tier,
    minRating,
    limit = '20',
    offset = '0',
  } = req.query

  let query = supabase
    .from('workers')
    .select(`
      *,
      user:users!workers_user_id_fkey(id, email, full_name, avatar_url)
    `, { count: 'exact' })
    .order('average_rating', { ascending: false })
    .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

  if (tier) {
    query = query.eq('tier', parseInt(tier as string))
  }

  if (minRating) {
    query = query.gte('average_rating', parseFloat(minRating as string))
  }

  // 専門ドメインフィルタ（配列に含まれるか）
  if (domain) {
    query = query.contains('specialized_domains', [domain])
  }

  const { data: workers, error, count } = await query

  if (error) {
    throw new InternalError('Failed to fetch workers')
  }

  paginatedResponse(
    res,
    workers || [],
    count || 0,
    parseInt(limit as string),
    parseInt(offset as string),
  )
}
