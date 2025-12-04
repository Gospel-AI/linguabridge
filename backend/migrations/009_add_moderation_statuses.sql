-- Migration: Add moderation-specific statuses to tasks table
-- Purpose: Allow tasks to be in 'pending_review' and 'suspended' states for content moderation

-- Drop existing status check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Recreate with moderation statuses included
ALTER TABLE tasks
ADD CONSTRAINT tasks_status_check
CHECK (
  status = ANY (ARRAY[
    'draft'::text,
    'published'::text,
    'in_progress'::text,
    'completed'::text,
    'approved'::text,
    'cancelled'::text,
    'pending_review'::text,  -- NEW: Awaiting moderation review
    'suspended'::text         -- NEW: Under investigation
  ])
);

-- Update existing tasks if needed (set any invalid statuses to 'pending_review')
-- This is a safety measure in case there are any invalid statuses
-- In practice, this should not affect any rows since the constraint was strict before
