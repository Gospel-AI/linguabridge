-- TaskBridge v2.0 Migration
-- Phase 8: Setup pg_cron Scheduled Jobs
-- Created: 2025-10-31

-- Note: pg_cron extension must be enabled first (20251031140000_enable_extensions.sql)

-- ========================================
-- CRON JOB: Auto-Promote Workers
-- ========================================
-- Run daily at midnight UTC to check for eligible promotions

SELECT cron.schedule(
  'auto-promote-workers',           -- job name
  '0 0 * * *',                      -- cron expression: daily at 00:00 UTC
  $$ SELECT auto_promote_workers(); $$
);

COMMENT ON SCHEMA cron IS 'pg_cron automated job scheduler';

-- ========================================
-- CRON JOB: Auto-Demote Workers
-- ========================================
-- Run daily at 00:30 UTC to check for eligible demotions

SELECT cron.schedule(
  'auto-demote-workers',
  '30 0 * * *',                     -- daily at 00:30 UTC (after promotions)
  $$ SELECT auto_demote_workers(); $$
);

-- ========================================
-- CRON JOB: Update Monthly Ratings
-- ========================================
-- Run on the 1st of each month at 01:00 UTC

SELECT cron.schedule(
  'update-monthly-ratings',
  '0 1 1 * *',                      -- 1st day of month at 01:00 UTC
  $$ SELECT update_monthly_ratings(); $$
);

-- ========================================
-- CRON JOB: Cleanup Old Quality Checks
-- ========================================
-- Run weekly on Sunday at 02:00 UTC to cleanup old automated quality checks
-- Keep only checks from past 90 days

SELECT cron.schedule(
  'cleanup-old-quality-checks',
  '0 2 * * 0',                      -- Sunday at 02:00 UTC
  $$
    DELETE FROM quality_checks
    WHERE auto_generated = TRUE
      AND checked_at < NOW() - INTERVAL '90 days';
  $$
);

-- ========================================
-- CRON JOB: Archive Resolved Problem Reports
-- ========================================
-- Run monthly on the 15th at 03:00 UTC to archive old resolved reports
-- Delete resolved reports older than 1 year

SELECT cron.schedule(
  'archive-resolved-reports',
  '0 3 15 * *',                     -- 15th of month at 03:00 UTC
  $$
    DELETE FROM problem_reports
    WHERE status = 'resolved'
      AND resolved_at < NOW() - INTERVAL '1 year';
  $$
);

-- ========================================
-- VERIFICATION & MANAGEMENT QUERIES
-- ========================================

-- View all scheduled jobs
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- View job run history (recent runs)
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- ========================================
-- HELPER QUERIES FOR MANUAL TESTING
-- ========================================

-- Manually trigger auto-promotion (for testing)
-- SELECT auto_promote_workers();

-- Manually trigger auto-demotion (for testing)
-- SELECT auto_demote_workers();

-- Manually trigger monthly ratings update (for testing)
-- SELECT update_monthly_ratings();

-- View upcoming job schedules
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE active = TRUE
ORDER BY jobname;

-- Disable a specific job (if needed)
-- SELECT cron.unschedule('job-name-here');

-- Re-enable a job (if needed)
-- SELECT cron.schedule('job-name', 'cron-expression', 'command');

-- ========================================
-- MONITORING QUERIES
-- ========================================

-- Check last successful run for each job
SELECT
  j.jobname,
  j.schedule,
  MAX(jrd.end_time) as last_successful_run,
  COUNT(CASE WHEN jrd.status = 'failed' THEN 1 END) as recent_failures
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE jrd.start_time > NOW() - INTERVAL '7 days'
GROUP BY j.jobid, j.jobname, j.schedule
ORDER BY j.jobname;

-- View failed job runs (last 7 days)
SELECT
  j.jobname,
  jrd.start_time,
  jrd.status,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE jrd.status = 'failed'
  AND jrd.start_time > NOW() - INTERVAL '7 days'
ORDER BY jrd.start_time DESC;
