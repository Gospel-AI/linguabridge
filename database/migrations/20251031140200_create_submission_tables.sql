-- TaskBridge v2.0 Migration
-- Phase 2: Create Submission & Quality Control Tables
-- Created: 2025-10-31

-- ========================================
-- TASK_SUBMISSIONS TABLE
-- ========================================
-- Worker submissions for all task types

CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

  -- Submission Content
  submission_text TEXT,
  attachments TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Domain-Specific Fields

  -- Translation/Localization
  translation_evaluation JSONB,
  translation_notes TEXT,

  -- AI Verification
  ai_quality_score INTEGER CHECK (ai_quality_score >= 0 AND ai_quality_score <= 100),
  ai_issues_found JSONB,
  ai_recommendations TEXT,

  -- Physical Data Collection
  physical_location GEOGRAPHY(POINT, 4326),
  physical_photos TEXT[],
  physical_data JSONB,
  gps_verified BOOLEAN DEFAULT FALSE,
  gps_verification_details JSONB,

  -- Evaluation
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  client_reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'revision_requested')),

  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(task_id, worker_id)
);

-- Indexes
CREATE INDEX idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX idx_task_submissions_worker ON task_submissions(worker_id);
CREATE INDEX idx_task_submissions_status ON task_submissions(status);
CREATE INDEX idx_task_submissions_rating ON task_submissions(client_rating);
CREATE INDEX idx_task_submissions_location ON task_submissions USING GIST(physical_location);
CREATE INDEX idx_task_submissions_submitted_at ON task_submissions(submitted_at DESC);

-- Comments
COMMENT ON TABLE task_submissions IS 'Worker submissions for all task types with domain-specific fields';
COMMENT ON COLUMN task_submissions.translation_evaluation IS 'Structured evaluation: accuracy, naturalness, cultural appropriateness';
COMMENT ON COLUMN task_submissions.ai_issues_found IS 'Detected issues: hallucinations, bias, cultural problems';
COMMENT ON COLUMN task_submissions.physical_location IS 'GPS coordinates where task was completed';
COMMENT ON COLUMN task_submissions.gps_verified IS 'TRUE if location verified against task requirements';

-- ========================================
-- AI_VERIFICATION_RESULTS TABLE
-- ========================================
-- Detailed results from AI verification tasks

CREATE TABLE ai_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

  -- AI Content Being Verified
  ai_content_type TEXT NOT NULL CHECK (ai_content_type IN ('text', 'image', 'audio', 'video', 'code')),
  ai_provider TEXT,
  ai_model TEXT,

  -- Verification Checks
  hallucination_detected BOOLEAN DEFAULT FALSE,
  hallucination_details JSONB,
  hallucination_severity TEXT CHECK (hallucination_severity IN ('none', 'minor', 'moderate', 'severe')),

  bias_detected BOOLEAN DEFAULT FALSE,
  bias_types TEXT[],
  bias_details JSONB,
  bias_severity TEXT CHECK (bias_severity IN ('none', 'minor', 'moderate', 'severe')),

  cultural_issues_detected BOOLEAN DEFAULT FALSE,
  cultural_issues JSONB,
  cultural_severity TEXT CHECK (cultural_severity IN ('none', 'minor', 'moderate', 'severe')),

  factual_accuracy_score INTEGER CHECK (factual_accuracy_score >= 0 AND factual_accuracy_score <= 100),
  context_appropriateness_score INTEGER CHECK (context_appropriateness_score >= 0 AND context_appropriateness_score <= 100),

  -- Overall Assessment
  overall_quality_rating INTEGER CHECK (overall_quality_rating >= 1 AND overall_quality_rating <= 5),
  recommended_action TEXT CHECK (recommended_action IN ('approve', 'revise', 'reject', 'escalate')),
  detailed_feedback TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_verification_submission ON ai_verification_results(submission_id);
CREATE INDEX idx_ai_verification_worker ON ai_verification_results(worker_id);
CREATE INDEX idx_ai_verification_content_type ON ai_verification_results(ai_content_type);
CREATE INDEX idx_ai_verification_hallucination ON ai_verification_results(hallucination_detected);
CREATE INDEX idx_ai_verification_bias ON ai_verification_results(bias_detected);
CREATE INDEX idx_ai_verification_cultural ON ai_verification_results(cultural_issues_detected);
CREATE INDEX idx_ai_verification_rating ON ai_verification_results(overall_quality_rating);

-- Comments
COMMENT ON TABLE ai_verification_results IS 'Detailed verification results for AI-generated content';
COMMENT ON COLUMN ai_verification_results.hallucination_severity IS 'Severity of detected hallucinations';
COMMENT ON COLUMN ai_verification_results.bias_types IS 'Types of bias detected: gender, racial, cultural, etc.';

-- ========================================
-- QUALITY_CHECKS TABLE
-- ========================================
-- Automated quality check results

CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,

  -- Check Results
  passed BOOLEAN NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  details JSONB NOT NULL,
  auto_generated BOOLEAN DEFAULT TRUE,

  -- Specific Check Types
  -- Photo Quality (for physical tasks)
  photo_resolution_check BOOLEAN,
  photo_clarity_check BOOLEAN,
  photo_metadata_check BOOLEAN,

  -- GPS Verification (for physical tasks)
  gps_distance_meters DECIMAL(10, 2),
  gps_within_radius BOOLEAN,
  gps_spoofing_detected BOOLEAN,

  -- Rating Bias Detection
  rating_pattern_suspicious BOOLEAN,
  rating_variance DECIMAL(4, 2),

  -- Timestamps
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quality_checks_submission ON quality_checks(submission_id);
CREATE INDEX idx_quality_checks_type ON quality_checks(check_type);
CREATE INDEX idx_quality_checks_passed ON quality_checks(passed);
CREATE INDEX idx_quality_checks_auto ON quality_checks(auto_generated);
CREATE INDEX idx_quality_checks_checked_at ON quality_checks(checked_at DESC);

-- Comments
COMMENT ON TABLE quality_checks IS 'Automated quality control checks for submissions';
COMMENT ON COLUMN quality_checks.check_type IS 'Type of check: photo_quality, gps_verification, rating_bias, etc.';
COMMENT ON COLUMN quality_checks.auto_generated IS 'TRUE if check was run automatically, FALSE if manual';
COMMENT ON COLUMN quality_checks.gps_spoofing_detected IS 'TRUE if GPS location appears to be spoofed';

-- ========================================
-- UPDATE TRIGGERS
-- ========================================

CREATE TRIGGER update_task_submissions_updated_at
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_verification_results_updated_at
  BEFORE UPDATE ON ai_verification_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('task_submissions', 'ai_verification_results', 'quality_checks')
ORDER BY tablename;

SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('task_submissions', 'ai_verification_results', 'quality_checks')
ORDER BY tablename, indexname;
