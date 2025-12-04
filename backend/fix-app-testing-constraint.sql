-- Fix domain_type check constraint to include app_testing

-- Drop existing constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_domain_type_check;

-- Add updated constraint with app_testing
ALTER TABLE tasks ADD CONSTRAINT tasks_domain_type_check
  CHECK (domain_type IS NULL OR domain_type IN ('translation', 'ai_verification', 'physical_data', 'app_testing'));

-- Verify constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'tasks'::regclass
AND conname = 'tasks_domain_type_check';
