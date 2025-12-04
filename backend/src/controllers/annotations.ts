import { Request, Response } from 'express'
import { supabase, useLocalDb } from '../lib/supabase.js'
import { query } from '../lib/database.js'
import { NotFoundError, BadRequestError, InternalError } from '../utils/errors.js'

/**
 * List annotation projects
 */
export async function listProjects(req: Request, res: Response): Promise<void> {
  const { status, limit = 50, offset = 0 } = req.query

  if (useLocalDb) {
    // Local DB mode
    let sql = `
      SELECT * FROM annotation_projects
      ${status ? 'WHERE status = $1' : ''}
      ORDER BY created_at DESC
      LIMIT $${status ? '2' : '1'} OFFSET $${status ? '3' : '2'}
    `
    const params = status
      ? [status, Number(limit), Number(offset)]
      : [Number(limit), Number(offset)]

    const projects = await query<any>(sql, params)

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM annotation_projects ${status ? 'WHERE status = $1' : ''}`
    const countResult = await query<{ count: string }>(countSql, status ? [status] : [])
    const total = parseInt(countResult[0]?.count || '0', 10)

    res.json({ projects, total, limit: Number(limit), offset: Number(offset) })
    return
  }

  // Supabase mode
  let queryBuilder = supabase
    .from('annotation_projects')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (status) {
    queryBuilder = queryBuilder.eq('status', status)
  }

  const { data: projects, error, count } = await queryBuilder

  if (error) {
    console.error('Failed to list projects:', error)
    throw new InternalError('Failed to retrieve projects')
  }

  res.json({
    projects: projects || [],
    total: count || 0,
    limit: Number(limit),
    offset: Number(offset)
  })
}

/**
 * Get single annotation project
 */
export async function getProject(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  if (useLocalDb) {
    const sql = 'SELECT * FROM annotation_projects WHERE id = $1'
    const projects = await query<any>(sql, [id])

    if (projects.length === 0) {
      throw new NotFoundError('Project not found')
    }

    res.json({ project: projects[0] })
    return
  }

  const { data: project, error } = await supabase
    .from('annotation_projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) {
    throw new NotFoundError('Project not found')
  }

  res.json({ project })
}

/**
 * Get project stats (completed/total tasks)
 */
export async function getProjectStats(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  if (useLocalDb) {
    const totalSql = 'SELECT COUNT(*) as count FROM annotation_tasks WHERE project_id = $1'
    const completedSql = "SELECT COUNT(*) as count FROM annotation_tasks WHERE project_id = $1 AND status = 'completed'"

    const [totalResult, completedResult] = await Promise.all([
      query<{ count: string }>(totalSql, [id]),
      query<{ count: string }>(completedSql, [id])
    ])

    res.json({
      total: parseInt(totalResult[0]?.count || '0', 10),
      completed: parseInt(completedResult[0]?.count || '0', 10)
    })
    return
  }

  const [totalResult, completedResult] = await Promise.all([
    supabase
      .from('annotation_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id),
    supabase
      .from('annotation_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'completed')
  ])

  res.json({
    total: totalResult.count || 0,
    completed: completedResult.count || 0
  })
}

/**
 * Get next available task for annotation
 */
export async function getNextTask(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params

  if (useLocalDb) {
    const sql = `
      SELECT * FROM annotation_tasks
      WHERE project_id = $1 AND status = 'pending'
      ORDER BY sequence_number ASC
      LIMIT 1
    `
    const tasks = await query<any>(sql, [projectId])

    res.json({ task: tasks[0] || null })
    return
  }

  const { data: task, error } = await supabase
    .from('annotation_tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'pending')
    .order('sequence_number', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Failed to get next task:', error)
    throw new InternalError('Failed to retrieve task')
  }

  res.json({ task })
}

/**
 * Submit annotation
 */
export async function submitAnnotation(req: Request, res: Response): Promise<void> {
  const { taskId } = req.params
  const { annotation, time_spent_seconds } = req.body
  const userId = (req as any).user?.id

  if (!annotation) {
    throw new BadRequestError('Annotation is required')
  }

  if (useLocalDb) {
    // Insert annotation
    const insertSql = `
      INSERT INTO annotations (task_id, annotator_id, annotation, time_spent_seconds, status)
      VALUES ($1, $2, $3, $4, 'submitted')
      RETURNING *
    `
    const result = await query<any>(insertSql, [
      taskId,
      userId,
      JSON.stringify(annotation),
      time_spent_seconds || 0
    ])

    // Update task status
    const updateSql = "UPDATE annotation_tasks SET status = 'completed' WHERE id = $1"
    await query(updateSql, [taskId])

    res.status(201).json({
      message: 'Annotation submitted successfully',
      annotation: result[0]
    })
    return
  }

  // Insert annotation
  const { data: newAnnotation, error: annotationError } = await supabase
    .from('annotations')
    .insert({
      task_id: taskId,
      annotator_id: userId,
      annotation,
      time_spent_seconds: time_spent_seconds || 0,
      status: 'submitted'
    })
    .select()
    .single()

  if (annotationError) {
    console.error('Failed to submit annotation:', annotationError)
    throw new InternalError('Failed to submit annotation')
  }

  // Update task status
  await supabase
    .from('annotation_tasks')
    .update({ status: 'completed' })
    .eq('id', taskId)

  res.status(201).json({
    message: 'Annotation submitted successfully',
    annotation: newAnnotation
  })
}
