-- TaskBridge v2.0 Migration
-- Phase 4: Update Existing Tables with v2.0 Fields
-- Created: 2025-10-31

-- ========================================
-- UPDATE TASKS TABLE
-- ========================================
-- Add domain-specific fields for focus domains

-- Add domain type column
ALTER TABLE tasks
ADD COLUMN domain_type TEXT
  CHECK (domain_type IN ('translation', 'ai_verification', 'physical_data'));

-- Add required tier column
ALTER TABLE tasks
ADD COLUMN required_tier INTEGER DEFAULT 1
  CHECK (required_tier IN (1, 2));

-- ========================================
-- TRANSLATION/LOCALIZATION FIELDS
-- ========================================

ALTER TABLE tasks
ADD COLUMN translation_source_lang TEXT,
ADD COLUMN translation_target_lang TEXT,
ADD COLUMN translation_content_type TEXT,
ADD COLUMN translation_evaluation_criteria JSONB;

-- ========================================
-- AI VERIFICATION FIELDS
-- ========================================

ALTER TABLE tasks
ADD COLUMN ai_content_type TEXT
  CHECK (ai_content_type IN ('text', 'image', 'audio', 'video', 'code')),
ADD COLUMN ai_check_hallucinations BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_check_bias BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_check_cultural BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_sample_content TEXT,
ADD COLUMN ai_context_info TEXT;

-- ========================================
-- PHYSICAL DATA COLLECTION FIELDS
-- ========================================

ALTER TABLE tasks
ADD COLUMN physical_location GEOGRAPHY(POINT, 4326),
ADD COLUMN physical_location_name TEXT,
ADD COLUMN physical_required_photos TEXT[],
ADD COLUMN physical_verification_radius INTEGER DEFAULT 100,
ADD COLUMN physical_data_points TEXT[];

-- Create spatial index for physical location
CREATE INDEX idx_tasks_physical_location ON tasks USING GIST(physical_location);

-- Create indexes for domain queries
CREATE INDEX idx_tasks_domain_type ON tasks(domain_type);
CREATE INDEX idx_tasks_required_tier ON tasks(required_tier);
CREATE INDEX idx_tasks_translation_langs ON tasks(translation_source_lang, translation_target_lang);
CREATE INDEX idx_tasks_ai_content_type ON tasks(ai_content_type);

-- Comments
COMMENT ON COLUMN tasks.domain_type IS 'Focus domain: translation, ai_verification, physical_data, or NULL for generic';
COMMENT ON COLUMN tasks.required_tier IS 'Minimum worker tier required: 1=Standard, 2=Pro';
COMMENT ON COLUMN tasks.translation_source_lang IS 'Source language code (e.g., en, ja, fr)';
COMMENT ON COLUMN tasks.translation_target_lang IS 'Target language code';
COMMENT ON COLUMN tasks.translation_evaluation_criteria IS 'JSON: {accuracy, naturalness, cultural_appropriateness}';
COMMENT ON COLUMN tasks.ai_content_type IS 'Type of AI content to verify';
COMMENT ON COLUMN tasks.physical_location IS 'GPS coordinates where task must be completed';
COMMENT ON COLUMN tasks.physical_verification_radius IS 'Acceptable radius in meters (default 100m)';

-- ========================================
-- UPDATE TRANSACTIONS TABLE
-- ========================================
-- Add tier bonus tracking

ALTER TABLE transactions
ADD COLUMN worker_tier INTEGER CHECK (worker_tier IN (1, 2)),
ADD COLUMN tier_bonus DECIMAL(10, 2) DEFAULT 0 CHECK (tier_bonus >= 0),
ADD COLUMN base_amount DECIMAL(10, 2);

-- Update existing constraint to account for tier bonus
-- Note: worker_payout = base_amount + tier_bonus - platform_fee

-- Create index for tier-based queries
CREATE INDEX idx_transactions_worker_tier ON transactions(worker_tier);

-- Comments
COMMENT ON COLUMN transactions.worker_tier IS 'Worker tier at time of transaction: 1=Standard, 2=Pro';
COMMENT ON COLUMN transactions.tier_bonus IS 'Additional amount paid for Tier 2 workers (20% of base)';
COMMENT ON COLUMN transactions.base_amount IS 'Original task amount before tier bonus';

-- ========================================
-- DATA MIGRATION FOR EXISTING RECORDS
-- ========================================

-- Set base_amount for existing transactions
UPDATE transactions
SET base_amount = amount
WHERE base_amount IS NULL;

-- Set worker_tier to 1 for existing transactions (default)
UPDATE transactions
SET worker_tier = 1
WHERE worker_tier IS NULL;

-- Set required_tier to 1 for existing tasks
UPDATE tasks
SET required_tier = 1
WHERE required_tier IS NULL;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify new columns in tasks table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND column_name IN (
    'domain_type',
    'required_tier',
    'translation_source_lang',
    'translation_target_lang',
    'ai_content_type',
    'physical_location',
    'physical_verification_radius'
  )
ORDER BY column_name;

-- Verify new columns in transactions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
  AND column_name IN ('worker_tier', 'tier_bonus', 'base_amount')
ORDER BY column_name;

-- Verify spatial index
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'tasks'
  AND indexname = 'idx_tasks_physical_location';
