-- Content Moderation System - Database Schema
-- Phase 1: Automated validation and reporting system

-- Add moderation fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderation_flags JSONB,
ADD COLUMN IF NOT EXISTS moderation_warnings JSONB,
ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderation_reviewed_by UUID REFERENCES users(id);

-- Create moderation_queue table for human review
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  flagged_at TIMESTAMP DEFAULT NOW(),
  flags JSONB NOT NULL,
  ai_confidence DECIMAL(3,2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  action_taken VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create moderation_logs table for audit trail
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- ALLOW, WARN, HOLD_FOR_REVIEW, BLOCK
  flags JSONB,
  confidence DECIMAL(3,2),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create task_reports table for community reporting
CREATE TABLE IF NOT EXISTS task_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL, -- illegal, scam, inappropriate, spam, other
  description TEXT NOT NULL,
  evidence JSONB, -- URLs, screenshots, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, investigating, resolved, dismissed
  investigated_by UUID REFERENCES users(id),
  investigation_notes TEXT,
  action_taken VARCHAR(50),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_moderation_status ON tasks(moderation_status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_task_id ON moderation_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_flagged_at ON moderation_queue(flagged_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_reports_status ON task_reports(status);
CREATE INDEX IF NOT EXISTS idx_task_reports_task_id ON task_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reports_reason ON task_reports(reason);
CREATE INDEX IF NOT EXISTS idx_task_reports_created_at ON task_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_task_id ON moderation_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);

-- Add RLS policies for moderation_queue (admin only)
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all moderation queue"
  ON moderation_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can update moderation queue"
  ON moderation_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert into moderation queue"
  ON moderation_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add RLS policies for task_reports
ALTER TABLE task_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON task_reports FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

CREATE POLICY "Admin can view all reports"
  ON task_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON task_reports FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admin can update reports"
  ON task_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add RLS policies for moderation_logs (admin only)
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all moderation logs"
  ON moderation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert into moderation logs"
  ON moderation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_moderation_queue_updated_at
  BEFORE UPDATE ON moderation_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_reports_updated_at
  BEFORE UPDATE ON task_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for moderation dashboard
CREATE OR REPLACE VIEW moderation_dashboard AS
SELECT
  mq.id,
  mq.task_id,
  t.title AS task_title,
  t.description AS task_description,
  t.budget,
  t.category,
  c.email AS company_email,
  c.full_name AS company_name,
  mq.flags,
  mq.flagged_at,
  mq.status AS review_status,
  mq.reviewed_by,
  r.email AS reviewer_email,
  mq.reviewed_at,
  mq.review_notes
FROM moderation_queue mq
JOIN tasks t ON mq.task_id = t.id
JOIN users c ON t.creator_id = c.id
LEFT JOIN users r ON mq.reviewed_by = r.id
ORDER BY mq.flagged_at DESC;

-- Create view for reports dashboard
CREATE OR REPLACE VIEW reports_dashboard AS
SELECT
  tr.id,
  tr.task_id,
  t.title AS task_title,
  t.status AS task_status,
  tr.reason,
  tr.description,
  tr.reported_by,
  reporter.email AS reporter_email,
  reporter.full_name AS reporter_name,
  tr.created_at AS reported_at,
  tr.status AS report_status,
  tr.investigated_by,
  investigator.email AS investigator_email,
  tr.resolved_at,
  tr.action_taken
FROM task_reports tr
JOIN tasks t ON tr.task_id = t.id
LEFT JOIN users reporter ON tr.reported_by = reporter.id
LEFT JOIN users investigator ON tr.investigated_by = investigator.id
ORDER BY tr.created_at DESC;

-- Grant access to views for admin users
GRANT SELECT ON moderation_dashboard TO authenticated;
GRANT SELECT ON reports_dashboard TO authenticated;

COMMENT ON TABLE moderation_queue IS 'Queue for tasks requiring manual moderation review';
COMMENT ON TABLE task_reports IS 'User-submitted reports of problematic tasks';
COMMENT ON TABLE moderation_logs IS 'Audit trail of all moderation actions';
COMMENT ON VIEW moderation_dashboard IS 'Admin dashboard view for moderation queue';
COMMENT ON VIEW reports_dashboard IS 'Admin dashboard view for task reports';
