-- Migration: Add app_testing domain and custom_fields
-- Created: 2025-10-31
-- Updated: 2025-11-01 (Fixed based on actual database structure)
-- Description: Add support for 4th focus domain (Mobile App & Game Testing) and flexible custom fields

-- Step 1: Add custom_fields column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Step 2: Create GIN index for custom_fields (fast JSONB queries)
CREATE INDEX IF NOT EXISTS idx_tasks_custom_fields ON tasks USING GIN(custom_fields);

-- Step 3: Update training_modules constraint to include app_testing
-- Current constraint: CHECK (domain_type IN ('translation', 'ai_verification', 'physical_data'))
-- New constraint: CHECK (domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing'))
ALTER TABLE training_modules
DROP CONSTRAINT IF EXISTS training_modules_domain_type_check;

ALTER TABLE training_modules
ADD CONSTRAINT training_modules_domain_type_check
CHECK (domain_type = ANY (ARRAY['translation'::text, 'ai_verification'::text, 'physical_data'::text, 'app_testing'::text]));

-- Step 4: Insert app_testing training module (sample data)
INSERT INTO training_modules (domain_type, title, description, video_url, video_duration_seconds, quiz_questions, passing_score)
VALUES (
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
)
ON CONFLICT (domain_type) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  video_duration_seconds = EXCLUDED.video_duration_seconds,
  quiz_questions = EXCLUDED.quiz_questions,
  passing_score = EXCLUDED.passing_score,
  updated_at = NOW();

-- Migration complete
