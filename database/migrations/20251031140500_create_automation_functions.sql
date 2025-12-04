-- TaskBridge v2.0 Migration
-- Phase 5: Create Automation Functions
-- Created: 2025-10-31

-- ========================================
-- FUNCTION: update_worker_ratings
-- ========================================
-- Recalculate worker ratings after each task completion

CREATE OR REPLACE FUNCTION update_worker_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_worker_id UUID;
  v_new_avg DECIMAL(3,2);
  v_total_completed INTEGER;
BEGIN
  -- Get worker_id from the submission
  v_worker_id := NEW.worker_id;

  -- Calculate new average rating from all approved submissions
  SELECT
    COALESCE(AVG(client_rating), 0),
    COUNT(*)
  INTO v_new_avg, v_total_completed
  FROM task_submissions
  WHERE worker_id = v_worker_id
    AND status = 'approved'
    AND client_rating IS NOT NULL;

  -- Update worker profile
  UPDATE workers
  SET
    average_rating = v_new_avg,
    total_completed_tasks = v_total_completed,
    updated_at = NOW()
  WHERE id = v_worker_id;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS update_ratings_on_approval ON task_submissions;

CREATE TRIGGER update_ratings_on_approval
  AFTER UPDATE OF status, client_rating ON task_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND NEW.client_rating IS NOT NULL)
  EXECUTE FUNCTION update_worker_ratings();

COMMENT ON FUNCTION update_worker_ratings() IS 'Recalculate worker average rating after task approval';

-- ========================================
-- FUNCTION: update_monthly_ratings
-- ========================================
-- Update last_month_rating and prev_month_rating (run monthly)

CREATE OR REPLACE FUNCTION update_monthly_ratings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Shift ratings: last_month → prev_month
  UPDATE workers
  SET
    prev_month_rating = last_month_rating,
    updated_at = NOW();

  -- Calculate new last_month_rating from submissions in past 30 days
  UPDATE workers w
  SET
    last_month_rating = (
      SELECT COALESCE(AVG(ts.client_rating), 0)
      FROM task_submissions ts
      WHERE ts.worker_id = w.id
        AND ts.status = 'approved'
        AND ts.client_rating IS NOT NULL
        AND ts.reviewed_at >= NOW() - INTERVAL '30 days'
    ),
    updated_at = NOW();

  RAISE NOTICE 'Monthly ratings updated for all workers';
END;
$$;

COMMENT ON FUNCTION update_monthly_ratings() IS 'Update monthly rating metrics for all workers (run on 1st of month)';

-- ========================================
-- FUNCTION: auto_promote_workers
-- ========================================
-- Automatically promote Tier 1 workers to Tier 2

CREATE OR REPLACE FUNCTION auto_promote_workers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promoted_count INTEGER := 0;
  v_worker RECORD;
BEGIN
  -- Find eligible workers for promotion
  FOR v_worker IN
    SELECT
      id,
      total_completed_tasks,
      average_rating,
      tier
    FROM workers
    WHERE tier = 1
      AND total_completed_tasks >= 20
      AND average_rating >= 4.2
  LOOP
    -- Update worker tier
    UPDATE workers
    SET
      tier = 2,
      tier_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_worker.id;

    -- Log tier change
    INSERT INTO tier_changes (
      worker_id,
      old_tier,
      new_tier,
      reason,
      trigger_conditions,
      total_completed_tasks,
      average_rating,
      changed_at
    ) VALUES (
      v_worker.id,
      1,
      2,
      'auto_promotion',
      jsonb_build_object(
        'completed_tasks', v_worker.total_completed_tasks,
        'average_rating', v_worker.average_rating,
        'threshold_tasks', 20,
        'threshold_rating', 4.2
      ),
      v_worker.total_completed_tasks,
      v_worker.average_rating,
      NOW()
    );

    v_promoted_count := v_promoted_count + 1;
  END LOOP;

  RAISE NOTICE 'Auto-promoted % workers from Tier 1 to Tier 2', v_promoted_count;
END;
$$;

COMMENT ON FUNCTION auto_promote_workers() IS 'Promote Tier 1 workers to Tier 2 based on performance (≥20 tasks, ≥4.2 rating)';

-- ========================================
-- FUNCTION: auto_demote_workers
-- ========================================
-- Automatically demote Tier 2 workers to Tier 1

CREATE OR REPLACE FUNCTION auto_demote_workers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demoted_count INTEGER := 0;
  v_worker RECORD;
BEGIN
  -- Find eligible workers for demotion
  -- Criteria: Tier 2 workers with rating < 4.0 for 2 consecutive months
  FOR v_worker IN
    SELECT
      id,
      total_completed_tasks,
      average_rating,
      last_month_rating,
      prev_month_rating,
      tier
    FROM workers
    WHERE tier = 2
      AND last_month_rating IS NOT NULL
      AND prev_month_rating IS NOT NULL
      AND last_month_rating < 4.0
      AND prev_month_rating < 4.0
  LOOP
    -- Update worker tier
    UPDATE workers
    SET
      tier = 1,
      tier_updated_at = NOW(),
      updated_at = NOW()
    WHERE id = v_worker.id;

    -- Log tier change
    INSERT INTO tier_changes (
      worker_id,
      old_tier,
      new_tier,
      reason,
      trigger_conditions,
      total_completed_tasks,
      average_rating,
      last_month_rating,
      prev_month_rating,
      changed_at
    ) VALUES (
      v_worker.id,
      2,
      1,
      'auto_demotion',
      jsonb_build_object(
        'last_month_rating', v_worker.last_month_rating,
        'prev_month_rating', v_worker.prev_month_rating,
        'threshold', 4.0,
        'consecutive_months', 2
      ),
      v_worker.total_completed_tasks,
      v_worker.average_rating,
      v_worker.last_month_rating,
      v_worker.prev_month_rating,
      NOW()
    );

    v_demoted_count := v_demoted_count + 1;
  END LOOP;

  RAISE NOTICE 'Auto-demoted % workers from Tier 2 to Tier 1', v_demoted_count;
END;
$$;

COMMENT ON FUNCTION auto_demote_workers() IS 'Demote Tier 2 workers to Tier 1 if rating < 4.0 for 2 consecutive months';

-- ========================================
-- FUNCTION: calculate_tier_bonus
-- ========================================
-- Calculate tier bonus for Tier 2 workers (20% of base amount)

CREATE OR REPLACE FUNCTION calculate_tier_bonus(
  p_worker_id UUID,
  p_base_amount DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_worker_tier INTEGER;
  v_bonus DECIMAL(10, 2);
BEGIN
  -- Get worker tier
  SELECT tier INTO v_worker_tier
  FROM workers
  WHERE id = p_worker_id;

  -- Calculate bonus: 20% for Tier 2, 0% for Tier 1
  IF v_worker_tier = 2 THEN
    v_bonus := p_base_amount * 0.20;
  ELSE
    v_bonus := 0;
  END IF;

  RETURN v_bonus;
END;
$$;

COMMENT ON FUNCTION calculate_tier_bonus IS 'Calculate tier bonus amount (20% for Tier 2, 0% for Tier 1)';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- List all custom functions
SELECT
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_functiondef(oid) AS definition_preview
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_worker_ratings',
    'update_monthly_ratings',
    'auto_promote_workers',
    'auto_demote_workers',
    'calculate_tier_bonus'
  )
ORDER BY proname;

-- Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'update_ratings_on_approval';
