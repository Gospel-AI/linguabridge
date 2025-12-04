-- TaskBridge v2.0 Migration
-- Phase 3: Create Audit & Reporting Tables
-- Created: 2025-10-31

-- ========================================
-- TIER_CHANGES TABLE
-- ========================================
-- Audit log for worker tier promotions and demotions

CREATE TABLE tier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

  -- Tier Change Details
  old_tier INTEGER NOT NULL CHECK (old_tier IN (1, 2)),
  new_tier INTEGER NOT NULL CHECK (new_tier IN (1, 2)),
  reason TEXT NOT NULL CHECK (reason IN ('auto_promotion', 'auto_demotion', 'manual_adjustment', 'performance_review')),

  -- Trigger Conditions
  trigger_conditions JSONB NOT NULL,
  total_completed_tasks INTEGER,
  average_rating DECIMAL(3,2),
  last_month_rating DECIMAL(3,2),
  prev_month_rating DECIMAL(3,2),

  -- Manual Override (if applicable)
  admin_id UUID REFERENCES users(id),
  admin_notes TEXT,

  -- Timestamps
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effective_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tier_changes_worker ON tier_changes(worker_id);
CREATE INDEX idx_tier_changes_reason ON tier_changes(reason);
CREATE INDEX idx_tier_changes_changed_at ON tier_changes(changed_at DESC);
CREATE INDEX idx_tier_changes_new_tier ON tier_changes(new_tier);

-- Comments
COMMENT ON TABLE tier_changes IS 'Audit log of all worker tier changes with triggering conditions';
COMMENT ON COLUMN tier_changes.reason IS 'Why tier changed: auto_promotion, auto_demotion, manual, review';
COMMENT ON COLUMN tier_changes.trigger_conditions IS 'JSON of conditions that triggered the change';
COMMENT ON COLUMN tier_changes.admin_id IS 'Admin user ID if manual adjustment, NULL for automatic';

-- ========================================
-- PROBLEM_REPORTS TABLE
-- ========================================
-- Quality problems and fraud reports

CREATE TABLE problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

  -- Problem Type
  problem_type TEXT NOT NULL CHECK (problem_type IN (
    'quality_issue',
    'fraud_suspected',
    'gps_spoofing',
    'photo_theft',
    'plagiarism',
    'inappropriate_content',
    'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Problem Details
  description TEXT NOT NULL,
  evidence JSONB,
  attachments TEXT[],

  -- Investigation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_investigation',
    'confirmed',
    'dismissed',
    'resolved'
  )),
  investigated_by UUID REFERENCES users(id),
  investigation_notes TEXT,

  -- Resolution
  resolution TEXT CHECK (resolution IN (
    'no_action',
    'warning_issued',
    'tier_downgrade',
    'account_suspended',
    'account_terminated',
    'refund_issued'
  )),
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_problem_reports_submission ON problem_reports(submission_id);
CREATE INDEX idx_problem_reports_reporter ON problem_reports(reported_by);
CREATE INDEX idx_problem_reports_worker ON problem_reports(worker_id);
CREATE INDEX idx_problem_reports_type ON problem_reports(problem_type);
CREATE INDEX idx_problem_reports_severity ON problem_reports(severity);
CREATE INDEX idx_problem_reports_status ON problem_reports(status);
CREATE INDEX idx_problem_reports_reported_at ON problem_reports(reported_at DESC);

-- Comments
COMMENT ON TABLE problem_reports IS 'Quality issues, fraud reports, and investigation tracking';
COMMENT ON COLUMN problem_reports.problem_type IS 'Type of problem: quality, fraud, gps_spoofing, etc.';
COMMENT ON COLUMN problem_reports.severity IS 'Impact severity: low, medium, high, critical';
COMMENT ON COLUMN problem_reports.evidence IS 'JSON of evidence: screenshots, GPS logs, comparisons, etc.';
COMMENT ON COLUMN problem_reports.resolution IS 'Action taken to resolve the problem';

-- ========================================
-- UPDATE TRIGGERS
-- ========================================

CREATE TRIGGER update_problem_reports_updated_at
  BEFORE UPDATE ON problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tier_changes', 'problem_reports')
ORDER BY tablename;

SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('tier_changes', 'problem_reports')
ORDER BY tablename, indexname;
