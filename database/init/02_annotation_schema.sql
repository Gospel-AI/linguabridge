-- LinguaBridge Annotation Schema
-- Version: 1.0
-- Description: Annotation tables for local development

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
    'classification',
    'ner',
    'ranking',
    'evaluation',
    'translation_validation'
  )),

  config JSONB NOT NULL DEFAULT '{}',

  -- Target languages
  source_language TEXT DEFAULT 'en',
  target_languages TEXT[] DEFAULT ARRAY['en'],

  -- Quality settings
  annotations_per_task INTEGER DEFAULT 1,
  gold_standard_ratio DECIMAL(3,2) DEFAULT 0.05,

  -- Pricing
  price_per_task DECIMAL(10, 4) NOT NULL DEFAULT 0.05 CHECK (price_per_task >= 0.01),
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'paused', 'completed', 'archived'
  )),

  -- Stats
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_annotation_projects_client ON annotation_projects(client_id);
CREATE INDEX idx_annotation_projects_status ON annotation_projects(status);

-- ========================================
-- 2. ANNOTATION TASKS TABLE
-- ========================================

CREATE TABLE annotation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES annotation_projects(id) ON DELETE CASCADE,

  data JSONB NOT NULL,

  is_gold BOOLEAN DEFAULT FALSE,
  gold_answer JSONB,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'assigned', 'completed', 'reviewed'
  )),

  assigned_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,

  batch_id TEXT,
  sequence_number INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_annotation_tasks_project ON annotation_tasks(project_id);
CREATE INDEX idx_annotation_tasks_status ON annotation_tasks(status);

-- ========================================
-- 3. ANNOTATIONS TABLE
-- ========================================

CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES annotation_tasks(id) ON DELETE CASCADE,
  annotator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  annotation JSONB NOT NULL,

  time_spent_seconds INTEGER,
  is_correct BOOLEAN,

  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'accepted', 'rejected', 'revised'
  )),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(task_id, annotator_id)
);

CREATE INDEX idx_annotations_task ON annotations(task_id);
CREATE INDEX idx_annotations_annotator ON annotations(annotator_id);

-- ========================================
-- 4. ANNOTATOR PROFILES TABLE
-- ========================================

CREATE TABLE annotator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  native_languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  fluent_languages TEXT[] DEFAULT ARRAY[]::TEXT[],

  certified_types TEXT[] DEFAULT ARRAY[]::TEXT[],

  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'pro')),
  total_annotations INTEGER DEFAULT 0,
  accepted_annotations INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5, 4),
  average_time_seconds INTEGER,

  is_available BOOLEAN DEFAULT TRUE,
  max_daily_tasks INTEGER DEFAULT 100,

  training_completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_annotator_profiles_user ON annotator_profiles(user_id);

-- ========================================
-- 5. SUPPORTED LANGUAGES TABLE
-- ========================================

CREATE TABLE supported_languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT,
  region TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Update project stats
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE annotation_projects
  SET
    total_tasks = (SELECT COUNT(*) FROM annotation_tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)),
    completed_tasks = (SELECT COUNT(*) FROM annotation_tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) AND status = 'completed'),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON annotation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();

-- Update annotator stats
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

-- Updated at triggers
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

-- ========================================
-- 7. SAMPLE DATA
-- ========================================

-- Create annotator profiles for sample users
INSERT INTO annotator_profiles (user_id, native_languages, fluent_languages, certified_types) VALUES
  ('33333333-3333-3333-3333-333333333333', ARRAY['en', 'ha'], ARRAY['yo'], ARRAY['classification', 'ner']),
  ('44444444-4444-4444-4444-444444444444', ARRAY['en', 'yo'], ARRAY['ig'], ARRAY['classification', 'evaluation']);

-- Sample project
INSERT INTO annotation_projects (id, client_id, name, description, annotation_type, config, price_per_task, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222',
   'Sentiment Classification Demo',
   'Classify the sentiment of customer reviews',
   'classification',
   '{"labels": ["positive", "negative", "neutral"], "multi_select": false, "instructions": "Classify the sentiment of the text"}',
   0.05,
   'active');

-- Sample tasks
INSERT INTO annotation_tasks (project_id, data) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"text": "This product is amazing! I love it."}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"text": "Terrible experience. Would not recommend."}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"text": "It works as expected. Nothing special."}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"text": "Best purchase I have ever made!"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"text": "Not worth the money. Very disappointed."}');

-- Annotation schema created successfully
