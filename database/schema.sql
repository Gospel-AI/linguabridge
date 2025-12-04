-- TaskBridge Database Schema
-- Version: 1.0
-- Description: Complete database schema for TaskBridge micro-task marketplace

-- ========================================
-- 1. USERS TABLE
-- ========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'worker', 'both')),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  stripe_account_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ========================================
-- 2. TASKS TABLE
-- ========================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 1.00),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'approved', 'cancelled')),
  deadline TIMESTAMP WITH TIME ZONE,
  requirements JSONB,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_tasks_creator ON tasks(creator_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Published tasks viewable by all
CREATE POLICY "Published tasks are viewable by all" ON tasks
  FOR SELECT USING (status != 'draft');

-- Creators can view and edit their own tasks
CREATE POLICY "Creators can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = creator_id);

-- ========================================
-- 3. APPLICATIONS TABLE
-- ========================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  cover_letter TEXT,
  proposed_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, worker_id)
);

-- Indexes
CREATE INDEX idx_applications_task ON applications(task_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Workers can manage their own applications
CREATE POLICY "Workers can manage own applications" ON applications
  FOR ALL USING (auth.uid() = worker_id);

-- Task creators can view applications
CREATE POLICY "Task creators can view applications" ON applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

CREATE POLICY "Task creators can update applications" ON applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM tasks WHERE id = task_id
    )
  );

-- ========================================
-- 4. TRANSACTIONS TABLE
-- ========================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  worker_payout DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'authorized', 'captured', 'transferred', 'refunded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captured_at TIMESTAMP WITH TIME ZONE,
  transferred_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_transactions_task ON transactions(task_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_worker ON transactions(worker_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Clients and workers can view related transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = worker_id
  );

-- ========================================
-- 5. FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
