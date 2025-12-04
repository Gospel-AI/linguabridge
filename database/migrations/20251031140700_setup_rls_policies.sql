-- TaskBridge v2.0 Migration
-- Phase 7: Setup Row Level Security (RLS) Policies
-- Created: 2025-10-31

-- ========================================
-- WORKERS TABLE RLS
-- ========================================

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

-- Workers can view their own profile
CREATE POLICY "Workers can view own profile" ON workers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Workers can update their own profile (limited fields)
CREATE POLICY "Workers can update own profile" ON workers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Public can view basic worker info for task matching
CREATE POLICY "Public can view worker profiles for matching" ON workers
  FOR SELECT
  USING (onboarding_completed = TRUE);

-- ========================================
-- TRAINING_MODULES TABLE RLS
-- ========================================

ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active training modules
CREATE POLICY "Authenticated users can view active training modules" ON training_modules
  FOR SELECT
  USING (is_active = TRUE AND auth.role() = 'authenticated');

-- Only admins can manage training modules (insert, update, delete)
-- Note: Admin role would be managed through custom claims or separate admin table

-- ========================================
-- WORKER_TRAINING_PROGRESS TABLE RLS
-- ========================================

ALTER TABLE worker_training_progress ENABLE ROW LEVEL SECURITY;

-- Workers can view and manage their own training progress
CREATE POLICY "Workers can view own training progress" ON worker_training_progress
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

CREATE POLICY "Workers can insert own training progress" ON worker_training_progress
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

CREATE POLICY "Workers can update own training progress" ON worker_training_progress
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

-- ========================================
-- TASK_SUBMISSIONS TABLE RLS
-- ========================================

ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- Workers can view and manage their own submissions
CREATE POLICY "Workers can view own submissions" ON task_submissions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

CREATE POLICY "Workers can insert own submissions" ON task_submissions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

CREATE POLICY "Workers can update own submissions" ON task_submissions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

-- Task creators (clients) can view submissions for their tasks
CREATE POLICY "Task creators can view submissions" ON task_submissions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- Task creators can update submissions (for rating/review)
CREATE POLICY "Task creators can review submissions" ON task_submissions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- ========================================
-- AI_VERIFICATION_RESULTS TABLE RLS
-- ========================================

ALTER TABLE ai_verification_results ENABLE ROW LEVEL SECURITY;

-- Workers can view their own AI verification results
CREATE POLICY "Workers can view own AI verification results" ON ai_verification_results
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

CREATE POLICY "Workers can insert own AI verification results" ON ai_verification_results
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

-- Task creators can view AI verification results for their tasks
CREATE POLICY "Task creators can view AI verification results" ON ai_verification_results
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT t.creator_id
      FROM tasks t
      JOIN task_submissions ts ON ts.task_id = t.id
      WHERE ts.id = submission_id
    )
  );

-- ========================================
-- QUALITY_CHECKS TABLE RLS
-- ========================================

ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

-- Workers can view quality checks for their submissions
CREATE POLICY "Workers can view own quality checks" ON quality_checks
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT w.user_id
      FROM workers w
      JOIN task_submissions ts ON ts.worker_id = w.id
      WHERE ts.id = submission_id
    )
  );

-- Task creators can view quality checks for their tasks
CREATE POLICY "Task creators can view quality checks" ON quality_checks
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT t.creator_id
      FROM tasks t
      JOIN task_submissions ts ON ts.task_id = t.id
      WHERE ts.id = submission_id
    )
  );

-- System can insert quality checks (auto-generated)
CREATE POLICY "System can insert quality checks" ON quality_checks
  FOR INSERT
  WITH CHECK (TRUE);

-- ========================================
-- TIER_CHANGES TABLE RLS
-- ========================================

ALTER TABLE tier_changes ENABLE ROW LEVEL SECURITY;

-- Workers can view their own tier change history
CREATE POLICY "Workers can view own tier changes" ON tier_changes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

-- System can insert tier changes (automated functions)
CREATE POLICY "System can insert tier changes" ON tier_changes
  FOR INSERT
  WITH CHECK (TRUE);

-- ========================================
-- PROBLEM_REPORTS TABLE RLS
-- ========================================

ALTER TABLE problem_reports ENABLE ROW LEVEL SECURITY;

-- Users can view problem reports they created
CREATE POLICY "Users can view own reports" ON problem_reports
  FOR SELECT
  USING (auth.uid() = reported_by);

-- Users can insert problem reports
CREATE POLICY "Users can create problem reports" ON problem_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Workers can view problem reports about their submissions
CREATE POLICY "Workers can view reports about own submissions" ON problem_reports
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workers WHERE id = worker_id
    )
  );

-- Task creators can view problem reports for their tasks
CREATE POLICY "Task creators can view problem reports" ON problem_reports
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT t.creator_id
      FROM tasks t
      JOIN task_submissions ts ON ts.task_id = t.id
      WHERE ts.id = submission_id
    )
  );

-- Admins/investigators can update problem reports
-- Note: This would require custom claims or admin table implementation

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'workers',
    'training_modules',
    'worker_training_progress',
    'task_submissions',
    'ai_verification_results',
    'quality_checks',
    'tier_changes',
    'problem_reports'
  )
ORDER BY tablename;

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'workers',
    'training_modules',
    'worker_training_progress',
    'task_submissions',
    'ai_verification_results',
    'quality_checks',
    'tier_changes',
    'problem_reports'
  )
ORDER BY tablename, policyname;
