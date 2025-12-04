-- TaskBridge v2.0 Migration
-- Phase 1: Create Worker-Related Tables
-- Created: 2025-10-31

-- ========================================
-- WORKERS TABLE
-- ========================================
-- Extended worker profiles with tier system and certifications

CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tier System (2-tier: Standard=1, Pro=2)
  tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2)),
  tier_updated_at TIMESTAMP WITH TIME ZONE,

  -- Performance Metrics
  total_completed_tasks INTEGER DEFAULT 0 CHECK (total_completed_tasks >= 0),
  average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  last_month_rating DECIMAL(3,2) CHECK (last_month_rating >= 0 AND last_month_rating <= 5),
  prev_month_rating DECIMAL(3,2) CHECK (prev_month_rating >= 0 AND prev_month_rating <= 5),

  -- Skills & Certifications
  language_pairs JSONB DEFAULT '[]'::jsonb,
  specialized_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Location (for physical data collection tasks)
  current_location GEOGRAPHY(POINT, 4326),
  location_updated_at TIMESTAMP WITH TIME ZONE,

  -- Stripe Integration
  stripe_account_id TEXT UNIQUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_tier ON workers(tier);
CREATE INDEX idx_workers_certifications ON workers USING GIN(certifications);
CREATE INDEX idx_workers_location ON workers USING GIST(current_location);
CREATE INDEX idx_workers_avg_rating ON workers(average_rating DESC);
CREATE INDEX idx_workers_completed_tasks ON workers(total_completed_tasks DESC);
CREATE INDEX idx_workers_specialized_domains ON workers USING GIN(specialized_domains);

-- Comments
COMMENT ON TABLE workers IS 'Extended worker profiles with tier system and performance tracking';
COMMENT ON COLUMN workers.tier IS 'Worker tier: 1=Standard, 2=Pro (+20% bonus)';
COMMENT ON COLUMN workers.average_rating IS 'Overall average rating across all completed tasks';
COMMENT ON COLUMN workers.last_month_rating IS 'Average rating for current month';
COMMENT ON COLUMN workers.prev_month_rating IS 'Average rating for previous month';
COMMENT ON COLUMN workers.current_location IS 'Current GPS location for physical task matching';

-- ========================================
-- TRAINING_MODULES TABLE
-- ========================================
-- Training content for worker certifications

CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Module Info
  domain_type TEXT NOT NULL CHECK (domain_type IN ('translation', 'ai_verification', 'physical_data')),
  title TEXT NOT NULL,
  description TEXT,

  -- Content
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER CHECK (video_duration_seconds > 0),
  reading_materials JSONB DEFAULT '[]'::jsonb,

  -- Quiz Configuration
  quiz_questions JSONB NOT NULL,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts INTEGER DEFAULT 3 CHECK (max_attempts > 0),
  retry_cooldown_hours INTEGER DEFAULT 24 CHECK (retry_cooldown_hours >= 0),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_training_modules_domain ON training_modules(domain_type);
CREATE INDEX idx_training_modules_active ON training_modules(is_active);
CREATE UNIQUE INDEX idx_training_modules_domain_version ON training_modules(domain_type, version) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE training_modules IS 'Training content and certification requirements for each domain';
COMMENT ON COLUMN training_modules.quiz_questions IS 'JSON array of questions with answers and explanations';
COMMENT ON COLUMN training_modules.passing_score IS 'Minimum score (percentage) required to pass certification';

-- ========================================
-- WORKER_TRAINING_PROGRESS TABLE
-- ========================================
-- Track worker training progress and certification status

CREATE TABLE worker_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,

  -- Progress Tracking
  video_completed BOOLEAN DEFAULT FALSE,
  video_watched_seconds INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,

  -- Quiz Results
  latest_score INTEGER CHECK (latest_score >= 0 AND latest_score <= 100),
  best_score INTEGER CHECK (best_score >= 0 AND best_score <= 100),
  quiz_answers JSONB,

  -- Certification Status
  certified BOOLEAN DEFAULT FALSE,
  certified_at TIMESTAMP WITH TIME ZONE,
  certificate_expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(worker_id, training_module_id)
);

-- Indexes
CREATE INDEX idx_worker_training_worker ON worker_training_progress(worker_id);
CREATE INDEX idx_worker_training_module ON worker_training_progress(training_module_id);
CREATE INDEX idx_worker_training_certified ON worker_training_progress(certified);
CREATE INDEX idx_worker_training_expires ON worker_training_progress(certificate_expires_at) WHERE certified = TRUE;

-- Comments
COMMENT ON TABLE worker_training_progress IS 'Individual worker progress through training modules';
COMMENT ON COLUMN worker_training_progress.quiz_attempts IS 'Number of times worker has attempted the quiz';
COMMENT ON COLUMN worker_training_progress.latest_score IS 'Score from most recent quiz attempt';
COMMENT ON COLUMN worker_training_progress.best_score IS 'Highest score achieved across all attempts';

-- ========================================
-- UPDATE TRIGGERS
-- ========================================

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_training_progress_updated_at
  BEFORE UPDATE ON worker_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check table creation
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('workers', 'training_modules', 'worker_training_progress')
ORDER BY tablename;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('workers', 'training_modules', 'worker_training_progress')
ORDER BY tablename, indexname;
