-- LinguaBridge Annotation Schema
-- Version: 1.0
-- Description: Database schema for LLM annotation platform

-- ========================================
-- 1. ANNOTATION PROJECTS TABLE
-- ========================================

CREATE TABLE annotation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Annotation configuration
  annotation_type TEXT NOT NULL CHECK (annotation_type IN (
    'classification',      -- Text classification (single/multi label)
    'ner',                 -- Named Entity Recognition
    'ranking',             -- RLHF comparison ranking
    'evaluation',          -- Text quality evaluation (1-5 scale)
    'translation_validation' -- Translation quality check
  )),

  -- Project-specific configuration (labels, instructions, etc.)
  config JSONB NOT NULL DEFAULT '{}',
  -- Example config for classification:
  -- {
  --   "labels": ["positive", "negative", "neutral"],
  --   "multi_select": false,
  --   "instructions": "Classify the sentiment of the text"
  -- }

  -- Example config for NER:
  -- {
  --   "entity_types": ["PERSON", "LOCATION", "ORGANIZATION", "DATE"],
  --   "instructions": "Tag all named entities in the text"
  -- }

  -- Target languages
  source_language TEXT DEFAULT 'en',
  target_languages TEXT[] DEFAULT ARRAY['en'],

  -- Quality settings
  annotations_per_task INTEGER DEFAULT 1,  -- How many annotators per task
  gold_standard_ratio DECIMAL(3,2) DEFAULT 0.05,  -- 5% gold standard tasks

  -- Pricing
  price_per_task DECIMAL(10, 4) NOT NULL CHECK (price_per_task >= 0.01),
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',       -- Not yet published
    'active',      -- Accepting annotations
    'paused',      -- Temporarily paused
    'completed',   -- All tasks annotated
    'archived'     -- Archived
  )),

  -- Stats (updated by triggers)
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_annotation_projects_client ON annotation_projects(client_id);
CREATE INDEX idx_annotation_projects_status ON annotation_projects(status);
CREATE INDEX idx_annotation_projects_type ON annotation_projects(annotation_type);

-- RLS
ALTER TABLE annotation_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own projects" ON annotation_projects
  FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Active projects viewable by authenticated users" ON annotation_projects
  FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- ========================================
-- 2. ANNOTATION TASKS TABLE
-- ========================================

CREATE TABLE annotation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES annotation_projects(id) ON DELETE CASCADE,

  -- Task data (the content to be annotated)
  data JSONB NOT NULL,
  -- Example for classification:
  -- { "text": "I love this product!" }

  -- Example for NER:
  -- { "text": "John Smith visited New York on January 5th." }

  -- Example for ranking:
  -- { "prompt": "What is AI?", "responses": ["AI is...", "Artificial intelligence..."] }

  -- Gold standard (for quality control)
  is_gold BOOLEAN DEFAULT FALSE,
  gold_answer JSONB,  -- Expected answer for gold standard tasks

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Not yet assigned
    'assigned',    -- Assigned to annotator(s)
    'completed',   -- All required annotations done
    'reviewed'     -- Quality reviewed
  )),

  -- Assignment tracking
  assigned_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,

  -- Ordering/batching
  batch_id TEXT,  -- For grouping tasks
  sequence_number INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_annotation_tasks_project ON annotation_tasks(project_id);
CREATE INDEX idx_annotation_tasks_status ON annotation_tasks(status);
CREATE INDEX idx_annotation_tasks_batch ON annotation_tasks(batch_id);
CREATE INDEX idx_annotation_tasks_pending ON annotation_tasks(project_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE annotation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can manage tasks" ON annotation_tasks
  FOR ALL USING (
    project_id IN (
      SELECT id FROM annotation_projects WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Annotators can view assigned tasks" ON annotation_tasks
  FOR SELECT USING (
    id IN (
      SELECT task_id FROM annotations WHERE annotator_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT id FROM annotation_projects WHERE status = 'active'
    )
  );

-- ========================================
-- 3. ANNOTATIONS TABLE
-- ========================================

CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES annotation_tasks(id) ON DELETE CASCADE,
  annotator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- The annotation result
  annotation JSONB NOT NULL,
  -- Example for classification:
  -- { "label": "positive" }
  -- { "labels": ["positive", "informative"] }  -- multi-select

  -- Example for NER:
  -- { "entities": [
  --     {"text": "John Smith", "start": 0, "end": 10, "type": "PERSON"},
  --     {"text": "New York", "start": 19, "end": 27, "type": "LOCATION"}
  --   ]
  -- }

  -- Example for ranking:
  -- { "ranking": [1, 0], "preferred": 0 }

  -- Example for evaluation:
  -- { "score": 4, "comment": "Good but slightly verbose" }

  -- Quality metrics
  time_spent_seconds INTEGER,  -- How long the annotator took

  -- Gold standard comparison (auto-calculated for gold tasks)
  is_correct BOOLEAN,  -- NULL for non-gold tasks

  -- Status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted',   -- Annotator submitted
    'accepted',    -- Quality check passed
    'rejected',    -- Quality check failed
    'revised'      -- Annotator revised after rejection
  )),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- One annotation per annotator per task
  UNIQUE(task_id, annotator_id)
);

-- Indexes
CREATE INDEX idx_annotations_task ON annotations(task_id);
CREATE INDEX idx_annotations_annotator ON annotations(annotator_id);
CREATE INDEX idx_annotations_created ON annotations(created_at DESC);

-- RLS
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Annotators can manage own annotations" ON annotations
  FOR ALL USING (auth.uid() = annotator_id);

CREATE POLICY "Project owners can view annotations" ON annotations
  FOR SELECT USING (
    task_id IN (
      SELECT at.id FROM annotation_tasks at
      JOIN annotation_projects ap ON at.project_id = ap.id
      WHERE ap.client_id = auth.uid()
    )
  );

-- ========================================
-- 4. ANNOTATOR PROFILES TABLE
-- ========================================

CREATE TABLE annotator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Language skills
  native_languages TEXT[] DEFAULT ARRAY[]::TEXT[],  -- ISO codes: ['en', 'ha', 'yo']
  fluent_languages TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Certifications (which annotation types they're certified for)
  certified_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- e.g., ['classification', 'ner']

  -- Performance metrics
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'pro')),
  total_annotations INTEGER DEFAULT 0,
  accepted_annotations INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5, 4),  -- 0.0000 to 1.0000
  average_time_seconds INTEGER,

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  max_daily_tasks INTEGER DEFAULT 100,

  -- Training/onboarding
  training_completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_annotator_profiles_user ON annotator_profiles(user_id);
CREATE INDEX idx_annotator_profiles_tier ON annotator_profiles(tier);
CREATE INDEX idx_annotator_profiles_languages ON annotator_profiles USING GIN(native_languages);
CREATE INDEX idx_annotator_profiles_available ON annotator_profiles(is_available) WHERE is_available = TRUE;

-- RLS
ALTER TABLE annotator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON annotator_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Profiles viewable by project owners" ON annotator_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ========================================
-- 5. SUPPORTED LANGUAGES TABLE
-- ========================================

CREATE TABLE supported_languages (
  code TEXT PRIMARY KEY,  -- ISO 639-1/3 code
  name TEXT NOT NULL,
  native_name TEXT,
  region TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial languages
INSERT INTO supported_languages (code, name, native_name, region) VALUES
  ('en', 'English', 'English', 'Global'),
  ('ak', 'Akan (Twi/Fante)', 'Akan', 'Ghana'),
  ('ha', 'Hausa', 'Hausa', 'Nigeria'),
  ('yo', 'Yoruba', 'Yorùbá', 'Nigeria'),
  ('ig', 'Igbo', 'Igbo', 'Nigeria'),
  ('pcm', 'Nigerian Pidgin', 'Naija', 'Nigeria'),
  ('tr', 'Turkish', 'Türkçe', 'North Cyprus');

-- ========================================
-- 6. TRIGGERS
-- ========================================

-- Update project stats when tasks change
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE annotation_projects
  SET
    total_tasks = (SELECT COUNT(*) FROM annotation_tasks WHERE project_id = NEW.project_id),
    completed_tasks = (SELECT COUNT(*) FROM annotation_tasks WHERE project_id = NEW.project_id AND status = 'completed'),
    updated_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON annotation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();

-- Update annotator stats when annotations change
CREATE OR REPLACE FUNCTION update_annotator_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE annotator_profiles
  SET
    total_annotations = (SELECT COUNT(*) FROM annotations WHERE annotator_id = NEW.annotator_id),
    accepted_annotations = (SELECT COUNT(*) FROM annotations WHERE annotator_id = NEW.annotator_id AND status = 'accepted'),
    accuracy_score = (
      SELECT COALESCE(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END), 0)
      FROM annotations
      WHERE annotator_id = NEW.annotator_id AND is_correct IS NOT NULL
    ),
    updated_at = NOW()
  WHERE user_id = NEW.annotator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_annotator_stats_trigger
  AFTER INSERT OR UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_annotator_stats();

-- Auto-promote to Pro tier
CREATE OR REPLACE FUNCTION check_tier_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Promote to Pro if: 20+ accepted annotations AND accuracy >= 0.85
  IF NEW.accepted_annotations >= 20 AND NEW.accuracy_score >= 0.85 AND NEW.tier = 'standard' THEN
    NEW.tier := 'pro';
  END IF;

  -- Demote from Pro if accuracy drops below 0.75
  IF NEW.tier = 'pro' AND NEW.accuracy_score < 0.75 THEN
    NEW.tier := 'standard';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_tier_promotion_trigger
  BEFORE UPDATE ON annotator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_tier_promotion();

-- Update task status when annotations are completed
CREATE OR REPLACE FUNCTION update_task_status()
RETURNS TRIGGER AS $$
DECLARE
  required_count INTEGER;
  current_count INTEGER;
BEGIN
  -- Get required annotations per task from project
  SELECT annotations_per_task INTO required_count
  FROM annotation_projects
  WHERE id = (SELECT project_id FROM annotation_tasks WHERE id = NEW.task_id);

  -- Count completed annotations for this task
  SELECT COUNT(*) INTO current_count
  FROM annotations
  WHERE task_id = NEW.task_id AND status IN ('submitted', 'accepted');

  -- Update task status
  UPDATE annotation_tasks
  SET
    completed_count = current_count,
    status = CASE
      WHEN current_count >= required_count THEN 'completed'
      WHEN current_count > 0 THEN 'assigned'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.task_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_status_trigger
  AFTER INSERT OR UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status();

-- Apply updated_at triggers
CREATE TRIGGER update_annotation_projects_updated_at
  BEFORE UPDATE ON annotation_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotation_tasks_updated_at
  BEFORE UPDATE ON annotation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotator_profiles_updated_at
  BEFORE UPDATE ON annotator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
