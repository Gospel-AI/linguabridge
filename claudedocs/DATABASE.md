# Database Design

**Version**: 2.0
**Last Updated**: 2025-10-31
**Database**: PostgreSQL 15.x (Supabase)
**Extensions**: PostGIS 3.4.x for geospatial features

---

## Overview

TaskBridge uses **Supabase PostgreSQL** with the following key features:
- **Row Level Security (RLS)**: All tables protected by user-specific policies
- **PostGIS Extension**: Geospatial support for physical data collection tasks
- **pg_cron Extension**: Automated tier management and rating updates
- **Supabase Functions**: Server-side automation for worker tier system
- **Real-time Subscriptions**: Live updates for tasks and tier changes

---

## Schema Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │──────<│    tasks    │>──────│ applications│
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │                      │
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   workers   │       │task_submiss.│       │transactions │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌─────────────┐       ┌─────────────┐
│worker_train│       │ai_verific.  │
│_progress    │       │_results     │
└─────────────┘       └─────────────┘
       │
       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│training_mod.│       │tier_changes │       │quality_chks │
└─────────────┘       └─────────────┘       └─────────────┘

┌─────────────┐
│problem_repts│
└─────────────┘
```

---

## Extensions

### Enable PostGIS
```sql
-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
SELECT PostGIS_Version();
```

### Enable pg_cron
```sql
-- Enable pg_cron for scheduled jobs (Supabase manages this)
-- Already available in Supabase, just use cron.schedule()
```

---

## Core Tables

### users

User accounts for both clients and workers.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'worker', 'both')),
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### workers

Extended worker profile with tier system, certifications, and location tracking.

```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2)),
  tier_updated_at TIMESTAMP WITH TIME ZONE,
  total_completed_tasks INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  last_month_rating DECIMAL(3,2),
  prev_month_rating DECIMAL(3,2),
  language_pairs JSONB DEFAULT '[]'::jsonb,
  specialized_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_location GEOGRAPHY(POINT, 4326),
  location_updated_at TIMESTAMP WITH TIME ZONE,
  stripe_account_id TEXT UNIQUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_tier ON workers(tier);
CREATE INDEX idx_workers_certifications ON workers USING GIN(certifications);
CREATE INDEX idx_workers_location ON workers USING GIST(current_location);
CREATE INDEX idx_workers_avg_rating ON workers(average_rating);

-- Auto-update updated_at
CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own profile"
  ON workers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Workers can update own profile"
  ON workers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert own profile"
  ON workers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can view worker profiles for their tasks"
  ON workers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN tasks t ON a.task_id = t.id
      WHERE a.worker_id = workers.user_id
        AND t.creator_id = auth.uid()
    )
  );
```

---

### tasks

Task listings with domain-specific fields for focus areas.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  domain_type TEXT CHECK (domain_type IS NULL OR domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  required_tier INTEGER DEFAULT 1 CHECK (required_tier IN (1, 2)),

  -- Translation/Localization fields
  translation_source_lang TEXT,
  translation_target_lang TEXT,
  translation_content_type TEXT,
  translation_evaluation_criteria JSONB,

  -- AI Verification fields
  ai_content_type TEXT,
  ai_check_hallucinations BOOLEAN,
  ai_check_bias BOOLEAN,
  ai_check_cultural BOOLEAN,
  ai_sample_content TEXT,
  ai_context_info TEXT,

  -- Physical Data Collection fields
  physical_location GEOGRAPHY(POINT, 4326),
  physical_location_name TEXT,
  physical_required_photos TEXT[],
  physical_verification_radius INTEGER,
  physical_data_points TEXT[],

  -- Flexible custom fields for any task type
  custom_fields JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_domain_type ON tasks(domain_type);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_required_tier ON tasks(required_tier);
CREATE INDEX idx_tasks_physical_location ON tasks USING GIST(physical_location);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_custom_fields ON tasks USING GIN(custom_fields);

-- Auto-update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tasks"
  ON tasks FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid());

CREATE POLICY "Clients can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Clients can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Clients can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = creator_id);
```

---

### training_modules

Training content for focus domain certifications.

```sql
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_type TEXT UNIQUE NOT NULL CHECK (domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER NOT NULL,
  quiz_questions JSONB NOT NULL,
  pass_threshold INTEGER DEFAULT 70 CHECK (pass_threshold >= 0 AND pass_threshold <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_training_modules_domain ON training_modules(domain_type);

-- Auto-update updated_at
CREATE TRIGGER update_training_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view training modules"
  ON training_modules FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify (handled via service role)
```

---

### worker_training_progress

Tracks worker progress through training modules.

```sql
CREATE TABLE worker_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  video_completed BOOLEAN DEFAULT FALSE,
  video_watch_percentage INTEGER DEFAULT 0 CHECK (video_watch_percentage >= 0 AND video_watch_percentage <= 100),
  quiz_attempts INTEGER DEFAULT 0,
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  passed BOOLEAN DEFAULT FALSE,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  certified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(worker_id, training_module_id)
);

-- Indexes
CREATE INDEX idx_wtp_worker ON worker_training_progress(worker_id);
CREATE INDEX idx_wtp_module ON worker_training_progress(training_module_id);
CREATE INDEX idx_wtp_passed ON worker_training_progress(passed);

-- Auto-update updated_at
CREATE TRIGGER update_wtp_updated_at
  BEFORE UPDATE ON worker_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE worker_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own training progress"
  ON worker_training_progress FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "Workers can insert own training progress"
  ON worker_training_progress FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can update own training progress"
  ON worker_training_progress FOR UPDATE
  USING (auth.uid() = worker_id);
```

---

### applications

Worker applications to tasks.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  cover_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(task_id, worker_id)
);

-- Indexes
CREATE INDEX idx_applications_task ON applications(task_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Auto-update updated_at
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "Clients can view applications for own tasks"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = applications.task_id
        AND tasks.creator_id = auth.uid()
    )
  );

CREATE POLICY "Workers can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can delete own applications"
  ON applications FOR DELETE
  USING (auth.uid() = worker_id);

CREATE POLICY "Clients can update applications for own tasks"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = applications.task_id
        AND tasks.creator_id = auth.uid()
    )
  );
```

---

### task_submissions

Worker submissions for all task types.

```sql
CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_type TEXT NOT NULL CHECK (domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing')),

  -- Translation submission
  translation_evaluation JSONB,

  -- AI verification submission
  ai_verification_result_id UUID REFERENCES ai_verification_results(id),

  -- Physical data submission
  submission_location GEOGRAPHY(POINT, 4326),
  collected_data JSONB,
  photo_urls TEXT[],
  gps_verified BOOLEAN,

  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'revision_requested')),
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_submissions_task ON task_submissions(task_id);
CREATE INDEX idx_submissions_worker ON task_submissions(worker_id);
CREATE INDEX idx_submissions_domain ON task_submissions(domain_type);
CREATE INDEX idx_submissions_status ON task_submissions(status);
CREATE INDEX idx_submissions_location ON task_submissions USING GIST(submission_location);

-- RLS Policies
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own submissions"
  ON task_submissions FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "Clients can view submissions for own tasks"
  ON task_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_submissions.task_id
        AND tasks.creator_id = auth.uid()
    )
  );

CREATE POLICY "Workers can create submissions"
  ON task_submissions FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Clients can update submissions for own tasks"
  ON task_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_submissions.task_id
        AND tasks.creator_id = auth.uid()
    )
  );
```

---

### ai_verification_results

Detailed AI verification results.

```sql
CREATE TABLE ai_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID UNIQUE REFERENCES task_submissions(id) ON DELETE CASCADE,
  hallucination_detected BOOLEAN,
  hallucination_details TEXT,
  bias_detected BOOLEAN,
  bias_details TEXT,
  cultural_issues_detected BOOLEAN,
  cultural_issues_details TEXT,
  overall_quality_score INTEGER CHECK (overall_quality_score >= 1 AND overall_quality_score <= 5),
  recommended_action TEXT CHECK (recommended_action IN ('approve', 'revise', 'reject')),
  suggested_improvements TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_ver_submission ON ai_verification_results(submission_id);
CREATE INDEX idx_ai_ver_hallucination ON ai_verification_results(hallucination_detected);
CREATE INDEX idx_ai_ver_bias ON ai_verification_results(bias_detected);

-- RLS Policies
ALTER TABLE ai_verification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own AI verification results"
  ON ai_verification_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_submissions
      WHERE task_submissions.id = ai_verification_results.submission_id
        AND task_submissions.worker_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view AI verification results for own tasks"
  ON ai_verification_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_submissions ts
      JOIN tasks t ON ts.task_id = t.id
      WHERE ts.id = ai_verification_results.submission_id
        AND t.creator_id = auth.uid()
    )
  );
```

---

### transactions

Payment transactions with tier bonus tracking.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  worker_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  worker_tier_at_completion INTEGER CHECK (worker_tier_at_completion IN (1, 2)),
  tier_bonus_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_task ON transactions(task_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_worker ON transactions(worker_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Workers can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = worker_id);
```

---

### tier_changes

Audit log of worker tier changes.

```sql
CREATE TABLE tier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_tier INTEGER NOT NULL CHECK (old_tier IN (1, 2)),
  new_tier INTEGER NOT NULL CHECK (new_tier IN (1, 2)),
  reason TEXT NOT NULL CHECK (reason IN ('auto_promotion', 'auto_demotion', 'manual_adjustment')),
  trigger_conditions JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tier_changes_worker ON tier_changes(worker_id);
CREATE INDEX idx_tier_changes_reason ON tier_changes(reason);
CREATE INDEX idx_tier_changes_date ON tier_changes(changed_at DESC);

-- RLS Policies
ALTER TABLE tier_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own tier changes"
  ON tier_changes FOR SELECT
  USING (auth.uid() = worker_id);
```

---

### quality_checks

Automated quality check results for submissions.

```sql
CREATE TABLE quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('gps_spoofing', 'photo_quality', 'rating_bias')),
  passed BOOLEAN NOT NULL,
  details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quality_checks_submission ON quality_checks(submission_id);
CREATE INDEX idx_quality_checks_type ON quality_checks(check_type);
CREATE INDEX idx_quality_checks_passed ON quality_checks(passed);

-- RLS Policies
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view quality checks for own submissions"
  ON quality_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_submissions
      WHERE task_submissions.id = quality_checks.submission_id
        AND task_submissions.worker_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view quality checks for own tasks"
  ON quality_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_submissions ts
      JOIN tasks t ON ts.task_id = t.id
      WHERE ts.id = quality_checks.submission_id
        AND t.creator_id = auth.uid()
    )
  );
```

---

### problem_reports

Quality problem reports from clients.

```sql
CREATE TABLE problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES task_submissions(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('low_quality', 'gps_spoofing', 'photo_fake', 'inappropriate', 'other')),
  description TEXT NOT NULL,
  evidence JSONB,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'investigating', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_problem_reports_task ON problem_reports(task_id);
CREATE INDEX idx_problem_reports_worker ON problem_reports(worker_id);
CREATE INDEX idx_problem_reports_reporter ON problem_reports(reported_by);
CREATE INDEX idx_problem_reports_status ON problem_reports(status);
CREATE INDEX idx_problem_reports_created ON problem_reports(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER update_problem_reports_updated_at
  BEFORE UPDATE ON problem_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE problem_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create reports for own tasks"
  ON problem_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reported_by
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = problem_reports.task_id
        AND tasks.creator_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view own reports"
  ON problem_reports FOR SELECT
  USING (auth.uid() = reported_by);

-- Admin policies handled via service role
```

---

## Supabase Functions

### Auto-Promote Workers

Automatically promotes Tier 1 workers to Tier 2 when they meet criteria.

```sql
CREATE OR REPLACE FUNCTION auto_promote_workers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- Find eligible workers
  WITH eligible_workers AS (
    SELECT id, total_completed_tasks, average_rating, tier
    FROM workers w
    WHERE w.tier = 1
      AND w.total_completed_tasks >= 20
      AND w.average_rating >= 4.2
  )
  -- Update tier
  UPDATE workers
  SET tier = 2, tier_updated_at = NOW()
  WHERE id IN (SELECT id FROM eligible_workers);

  -- Log tier changes
  INSERT INTO tier_changes (worker_id, old_tier, new_tier, reason, trigger_conditions, changed_at)
  SELECT
    id,
    1 AS old_tier,
    2 AS new_tier,
    'auto_promotion' AS reason,
    jsonb_build_object(
      'total_completed_tasks', total_completed_tasks,
      'average_rating', average_rating
    ) AS trigger_conditions,
    NOW() AS changed_at
  FROM eligible_workers;
END;
$;

-- Schedule to run daily at midnight
SELECT cron.schedule(
  'auto-promote-workers',
  '0 0 * * *',
  $$ SELECT auto_promote_workers(); $$
);
```

---

### Auto-Demote Workers

Automatically demotes Tier 2 workers to Tier 1 if performance drops.

```sql
CREATE OR REPLACE FUNCTION auto_demote_workers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- Find workers eligible for demotion
  WITH eligible_workers AS (
    SELECT id, last_month_rating, prev_month_rating, tier
    FROM workers w
    WHERE w.tier = 2
      AND w.last_month_rating < 4.0
      AND w.prev_month_rating < 4.0
  )
  -- Update tier
  UPDATE workers
  SET tier = 1, tier_updated_at = NOW()
  WHERE id IN (SELECT id FROM eligible_workers);

  -- Log tier changes
  INSERT INTO tier_changes (worker_id, old_tier, new_tier, reason, trigger_conditions, changed_at)
  SELECT
    id,
    2 AS old_tier,
    1 AS new_tier,
    'auto_demotion' AS reason,
    jsonb_build_object(
      'last_month_rating', last_month_rating,
      'prev_month_rating', prev_month_rating,
      'consecutive_months_below_threshold', 2
    ) AS trigger_conditions,
    NOW() AS changed_at
  FROM eligible_workers;
END;
$;

-- Schedule to run on 1st of each month at midnight
SELECT cron.schedule(
  'auto-demote-workers',
  '0 0 1 * *',
  $$ SELECT auto_demote_workers(); $$
);
```

---

### Update Worker Ratings

Recalculates worker ratings based on recent submissions.

```sql
CREATE OR REPLACE FUNCTION update_worker_ratings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- Update average ratings
  WITH rating_stats AS (
    SELECT
      ts.worker_id,
      AVG(ts.client_rating) AS avg_rating,
      AVG(CASE
        WHEN ts.submitted_at >= NOW() - INTERVAL '30 days'
        THEN ts.client_rating
      END) AS last_month_avg,
      AVG(CASE
        WHEN ts.submitted_at >= NOW() - INTERVAL '60 days'
          AND ts.submitted_at < NOW() - INTERVAL '30 days'
        THEN ts.client_rating
      END) AS prev_month_avg,
      COUNT(*) FILTER (WHERE ts.status = 'approved') AS completed_count
    FROM task_submissions ts
    WHERE ts.client_rating IS NOT NULL
    GROUP BY ts.worker_id
  )
  UPDATE workers w
  SET
    average_rating = COALESCE(rs.avg_rating, 0),
    last_month_rating = rs.last_month_avg,
    prev_month_rating = rs.prev_month_avg,
    total_completed_tasks = COALESCE(rs.completed_count, 0)
  FROM rating_stats rs
  WHERE w.user_id = rs.worker_id;
END;
$;

-- Schedule to run daily at midnight
SELECT cron.schedule(
  'update-worker-ratings',
  '0 0 * * *',
  $$ SELECT update_worker_ratings(); $$
);
```

---

## PostGIS Geospatial Functions

### Find Tasks Within Radius

```sql
CREATE OR REPLACE FUNCTION tasks_within_radius(
  target_lng FLOAT,
  target_lat FLOAT,
  radius_meters INT
)
RETURNS SETOF tasks
LANGUAGE sql
STABLE
AS $
  SELECT *
  FROM tasks
  WHERE domain_type = 'physical_data'
    AND physical_location IS NOT NULL
    AND ST_DWithin(
      physical_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_meters
    )
  ORDER BY physical_location <-> ST_MakePoint(target_lng, target_lat)::geometry;
$;
```

### Find Nearby Workers

```sql
CREATE OR REPLACE FUNCTION workers_within_radius(
  target_lng FLOAT,
  target_lat FLOAT,
  radius_km FLOAT
)
RETURNS SETOF workers
LANGUAGE sql
STABLE
AS $
  SELECT *
  FROM workers
  WHERE current_location IS NOT NULL
    AND ST_DWithin(
      current_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_km * 1000
    )
  ORDER BY current_location <-> ST_MakePoint(target_lng, target_lat)::geometry;
$;
```

### Calculate Distance Between Points

```sql
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lng1 FLOAT,
  lat1 FLOAT,
  lng2 FLOAT,
  lat2 FLOAT
)
RETURNS FLOAT
LANGUAGE sql
IMMUTABLE
AS $
  SELECT ST_Distance(
    ST_MakePoint(lng1, lat1)::geography,
    ST_MakePoint(lng2, lat2)::geography
  );
$;
```

---

## Sample Data (for Development)

### Insert Sample Training Modules

```sql
INSERT INTO training_modules (domain_type, title, description, video_url, video_duration_seconds, quiz_questions, pass_threshold)
VALUES
  (
    'translation',
    'Translation/Localization Validation Training',
    'Learn how to evaluate translation quality for accuracy, naturalness, and cultural appropriateness.',
    'https://loom.com/share/translation-training',
    600,
    '[
      {
        "id": "q1",
        "question": "What are the three key evaluation criteria for translations?",
        "options": [
          "Accuracy, Naturalness, Cultural Appropriateness",
          "Speed, Cost, Quality",
          "Grammar, Spelling, Punctuation",
          "None of the above"
        ],
        "correctAnswer": "Accuracy, Naturalness, Cultural Appropriateness"
      },
      {
        "id": "q2",
        "question": "Why is cultural appropriateness important in localization?",
        "options": [
          "To ensure the translation fits the target culture",
          "To reduce translation costs",
          "To speed up the process",
          "It is not important"
        ],
        "correctAnswer": "To ensure the translation fits the target culture"
      }
    ]'::jsonb,
    70
  ),
  (
    'ai_verification',
    'AI Content Verification Training',
    'Learn to identify AI hallucinations, bias, and cultural issues in AI-generated content.',
    'https://loom.com/share/ai-verification-training',
    600,
    '[
      {
        "id": "q1",
        "question": "What is an AI hallucination?",
        "options": [
          "When AI generates false or unverifiable information",
          "When AI makes grammatical errors",
          "When AI is too slow",
          "When AI crashes"
        ],
        "correctAnswer": "When AI generates false or unverifiable information"
      }
    ]'::jsonb,
    70
  ),
  (
    'physical_data',
    'Physical Data Collection Training',
    'Learn safety protocols, photo quality standards, and GPS verification for on-site data collection.',
    'https://loom.com/share/physical-data-training',
    450,
    '[
      {
        "id": "q1",
        "question": "What is the minimum photo resolution required?",
        "options": [
          "800x600",
          "640x480",
          "1920x1080",
          "No minimum"
        ],
        "correctAnswer": "800x600"
      }
    ]'::jsonb,
    70
  ),
  (
    'app_testing',
    'Mobile App & Game Testing Training',
    'Learn how to test mobile apps and games, provide useful feedback, and capture quality screenshots.',
    'https://loom.com/share/app-testing-training',
    300,
    '[
      {
        "id": "q1",
        "question": "What makes good feedback for app testing?",
        "options": [
          "Just saying good or bad",
          "Specific, detailed, and actionable feedback",
          "Long essays",
          "Technical jargon"
        ],
        "correctAnswer": "Specific, detailed, and actionable feedback"
      },
      {
        "id": "q2",
        "question": "What should you do if you find a bug?",
        "options": [
          "Ignore it",
          "Take a screenshot and describe what happened",
          "Try to fix it yourself",
          "Uninstall the app"
        ],
        "correctAnswer": "Take a screenshot and describe what happened"
      },
      {
        "id": "q3",
        "question": "When testing an app, what is most important?",
        "options": [
          "Testing as fast as possible",
          "Following instructions and providing honest feedback",
          "Finding as many bugs as possible",
          "Giving 5-star ratings"
        ],
        "correctAnswer": "Following instructions and providing honest feedback"
      }
    ]'::jsonb,
    70
  );
```

---

## Backup and Maintenance

### Automatic Backups

Supabase provides automatic daily backups for all Pro plan projects. Free tier has limited backup retention.

### Manual Backup

```bash
# Export entire database
pg_dump -h db.YOUR_PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_$(date +%Y%m%d).sql

# Export specific table
pg_dump -h db.YOUR_PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  -t tasks \
  -f tasks_backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
psql -h db.YOUR_PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_20251031.sql
```

---

## Performance Optimization

### Index Recommendations

- **tasks**: Index on `status`, `domain_type`, `created_at`, `physical_location`
- **workers**: Index on `tier`, `certifications`, `average_rating`, `current_location`
- **task_submissions**: Index on `task_id`, `worker_id`, `status`, `submission_location`
- **applications**: Composite index on `(task_id, status)` for faster lookups

### Query Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE status = 'published'
  AND domain_type = 'translation'
ORDER BY created_at DESC
LIMIT 20;

-- Update table statistics
ANALYZE tasks;
ANALYZE workers;
ANALYZE task_submissions;
```

---

## Security Best Practices

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Clients can only see workers who applied to their tasks
- Workers can only see tasks they're eligible for

### Service Role Usage

Service role key should ONLY be used for:
- Supabase Functions (auto-promotion, auto-demotion)
- Admin operations
- Scheduled jobs (pg_cron)

Never expose service role key to frontend!

### Data Validation

```sql
-- Example: Ensure ratings are within valid range
ALTER TABLE task_submissions
ADD CONSTRAINT valid_rating
CHECK (client_rating IS NULL OR (client_rating >= 1 AND client_rating <= 5));

-- Example: Ensure tier is valid
ALTER TABLE workers
ADD CONSTRAINT valid_tier
CHECK (tier IN (1, 2));
```

---

## Migration Strategy

### Version 1.0 → 2.0 Migration

```sql
-- Step 1: Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Create new tables
-- (Execute all CREATE TABLE statements for new tables)

-- Step 3: Add new columns to existing tables
ALTER TABLE tasks
  ADD COLUMN domain_type TEXT CHECK (domain_type IS NULL OR domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing')),
  ADD COLUMN required_tier INTEGER DEFAULT 1 CHECK (required_tier IN (1, 2)),
  ADD COLUMN translation_source_lang TEXT,
  ADD COLUMN translation_target_lang TEXT,
  ADD COLUMN translation_content_type TEXT,
  ADD COLUMN translation_evaluation_criteria JSONB,
  ADD COLUMN ai_content_type TEXT,
  ADD COLUMN ai_check_hallucinations BOOLEAN,
  ADD COLUMN ai_check_bias BOOLEAN,
  ADD COLUMN ai_check_cultural BOOLEAN,
  ADD COLUMN ai_sample_content TEXT,
  ADD COLUMN ai_context_info TEXT,
  ADD COLUMN physical_location GEOGRAPHY(POINT, 4326),
  ADD COLUMN physical_location_name TEXT,
  ADD COLUMN physical_required_photos TEXT[],
  ADD COLUMN physical_verification_radius INTEGER,
  ADD COLUMN physical_data_points TEXT[],
  ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;

-- Step 4: Create indexes for new columns
CREATE INDEX idx_tasks_domain_type ON tasks(domain_type);
CREATE INDEX idx_tasks_required_tier ON tasks(required_tier);
CREATE INDEX idx_tasks_physical_location ON tasks USING GIST(physical_location);
CREATE INDEX idx_tasks_custom_fields ON tasks USING GIN(custom_fields);

-- Step 5: Add new columns to transactions
ALTER TABLE transactions
  ADD COLUMN worker_tier_at_completion INTEGER CHECK (worker_tier_at_completion IN (1, 2)),
  ADD COLUMN tier_bonus_amount DECIMAL(10,2) DEFAULT 0;

-- Step 6: Create Supabase Functions
-- (Execute all CREATE FUNCTION statements)

-- Step 7: Schedule cron jobs
-- (Execute all cron.schedule statements)

-- Step 8: Insert training modules
-- (Execute INSERT INTO training_modules)
```

---

## Monitoring and Analytics

### Performance Monitoring Queries

```sql
-- Top 10 slowest queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Business Analytics Queries

```sql
-- Worker tier distribution
SELECT tier, COUNT(*) AS worker_count
FROM workers
GROUP BY tier;

-- Tasks by domain type
SELECT
  COALESCE(domain_type, 'generic') AS domain,
  COUNT(*) AS task_count,
  SUM(amount) AS total_value
FROM tasks
WHERE status = 'published'
GROUP BY domain_type;

-- Average worker ratings by tier
SELECT
  tier,
  AVG(average_rating) AS avg_rating,
  COUNT(*) AS worker_count
FROM workers
GROUP BY tier;

-- Monthly revenue
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(platform_fee) AS revenue,
  COUNT(*) AS transaction_count
FROM transactions
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC;
```

---

## Troubleshooting

### Common Issues

#### Issue: PostGIS functions not working
```sql
-- Check if PostGIS is installed
SELECT PostGIS_Version();

-- If not installed
CREATE EXTENSION postgis;
```

#### Issue: RLS blocking queries
```sql
-- Temporarily disable RLS for debugging (NEVER in production!)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

#### Issue: Slow geospatial queries
```sql
-- Ensure GIST indexes exist
CREATE INDEX IF NOT EXISTS idx_tasks_physical_location
  ON tasks USING GIST(physical_location);

CREATE INDEX IF NOT EXISTS idx_workers_location
  ON workers USING GIST(current_location);

-- Vacuum and analyze
VACUUM ANALYZE tasks;
VACUUM ANALYZE workers;
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-10-31 | Added 8 new tables (workers, training_modules, worker_training_progress, task_submissions, ai_verification_results, quality_checks, tier_changes, problem_reports), PostGIS integration, Supabase Functions for automation, updated tasks and transactions tables with domain-specific fields |
| 1.0 | 2025-10-30 | Initial schema with users, tasks, applications, transactions |

---

## Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)
