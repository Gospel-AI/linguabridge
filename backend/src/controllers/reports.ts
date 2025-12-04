import { Request, Response } from 'express';
import { supabase, useLocalDb } from '../lib/supabase.js';
import { NotFoundError, ForbiddenError, BadRequestError, InternalError } from '../utils/errors.js';

/**
 * Create a report for a problematic task
 */
export async function createReport(req: Request, res: Response): Promise<void> {
  const { task_id, reason, description, evidence } = req.body;
  const userId = (req as any).user.id;

  // Validate required fields
  if (!task_id || !reason || !description) {
    throw new BadRequestError('task_id, reason, and description are required');
  }

  // Validate reason
  const validReasons = ['illegal', 'scam', 'inappropriate', 'spam', 'other'];
  if (!validReasons.includes(reason)) {
    throw new BadRequestError(`Reason must be one of: ${validReasons.join(', ')}`);
  }

  // Check if task exists
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, creator_id')
    .eq('id', task_id)
    .single();

  if (taskError || !task) {
    throw new NotFoundError('Task not found');
  }

  // Check if user already reported this task
  const { data: existingReport } = await supabase
    .from('task_reports')
    .select('id')
    .eq('task_id', task_id)
    .eq('reported_by', userId)
    .maybeSingle();

  if (existingReport) {
    throw new BadRequestError('You have already reported this task');
  }

  // Create report
  const { data: report, error: reportError } = await supabase
    .from('task_reports')
    .insert({
      task_id,
      reported_by: userId,
      reason,
      description,
      evidence: evidence || null,
      status: 'pending'
    })
    .select()
    .single();

  if (reportError) {
    console.error('Failed to create report:', reportError);
    throw new InternalError('Failed to create report');
  }

  // Immediate action for critical reports
  if (reason === 'illegal') {
    await supabase
      .from('tasks')
      .update({
        status: 'suspended',
        moderation_status: 'under_investigation'
      })
      .eq('id', task_id);

    // TODO: Send critical alert to admin
    console.log(`CRITICAL REPORT: Task ${task_id} reported as illegal by user ${userId}`);
  }

  res.status(201).json({
    message: 'Report submitted successfully',
    report: {
      id: report.id,
      task_id: report.task_id,
      reason: report.reason,
      status: report.status,
      created_at: report.created_at
    }
  });
}

/**
 * List reports submitted by the current user
 */
export async function listUserReports(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.id;
  const { status, limit = 50, offset = 0 } = req.query;

  let query = supabase
    .from('task_reports')
    .select(`
      id,
      task_id,
      reason,
      description,
      status,
      created_at,
      resolved_at,
      tasks (
        id,
        title,
        status
      )
    `, { count: 'exact' })
    .eq('reported_by', userId)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: reports, error, count } = await query;

  if (error) {
    console.error('Failed to list reports:', error);
    throw new InternalError('Failed to retrieve reports');
  }

  res.json({
    reports: reports || [],
    total: count || 0,
    limit: Number(limit),
    offset: Number(offset)
  });
}

/**
 * Get details of a specific report
 */
export async function getReport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const { data: report, error } = await supabase
    .from('task_reports')
    .select(`
      *,
      tasks (
        id,
        title,
        description,
        status,
        creator_id
      ),
      reported_by_user:users!reported_by (
        id,
        email,
        full_name
      )
    `)
    .eq('id', id)
    .single();

  if (error || !report) {
    throw new NotFoundError('Report not found');
  }

  // Check permissions: user can view their own reports, admins can view all
  if (report.reported_by !== userId && userRole !== 'admin') {
    throw new ForbiddenError('You do not have permission to view this report');
  }

  res.json({ report });
}

/**
 * List all reports (Admin only)
 */
export async function listAllReports(req: Request, res: Response): Promise<void> {
  const { status, reason, limit = 100, offset = 0 } = req.query;

  let query = supabase
    .from('reports_dashboard')
    .select('*', { count: 'exact' })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (status) {
    query = query.eq('report_status', status);
  }

  if (reason) {
    query = query.eq('reason', reason);
  }

  const { data: reports, error, count } = await query;

  if (error) {
    console.error('Failed to list all reports:', error);
    throw new InternalError('Failed to retrieve reports');
  }

  res.json({
    reports: reports || [],
    total: count || 0,
    limit: Number(limit),
    offset: Number(offset)
  });
}

/**
 * Review a report and take action (Admin only)
 */
export async function reviewReport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { action, notes } = req.body;
  const adminId = (req as any).user.id;

  // Validate action
  const validActions = ['suspend_task', 'ban_user', 'dismiss', 'no_action'];
  if (!validActions.includes(action)) {
    throw new BadRequestError(`Action must be one of: ${validActions.join(', ')}`);
  }

  // Get report details
  const { data: report, error: reportError } = await supabase
    .from('task_reports')
    .select(`
      *,
      tasks (
        id,
        creator_id
      )
    `)
    .eq('id', id)
    .single();

  if (reportError || !report) {
    throw new NotFoundError('Report not found');
  }

  // Take action based on decision
  if (action === 'suspend_task') {
    await supabase
      .from('tasks')
      .update({
        status: 'cancelled',
        moderation_status: 'rejected'
      })
      .eq('id', report.task_id);
  }

  if (action === 'ban_user') {
    // TODO: Implement user banning system
    // For now, just mark account as suspended
    await supabase
      .from('users')
      .update({
        account_status: 'suspended'
      })
      .eq('id', report.tasks.creator_id);
  }

  // Update report status
  const { data: updatedReport, error: updateError } = await supabase
    .from('task_reports')
    .update({
      status: action === 'dismiss' ? 'dismissed' : 'resolved',
      investigated_by: adminId,
      investigation_notes: notes,
      action_taken: action,
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update report:', updateError);
    throw new InternalError('Failed to update report');
  }

  res.json({
    message: 'Report reviewed successfully',
    report: updatedReport,
    action_taken: action
  });
}
