-- LinguaBridge Base Schema
-- Version: 1.0
-- Description: Base tables for local development

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- AUTH SCHEMA (Supabase compatibility)
-- ========================================

CREATE SCHEMA IF NOT EXISTS auth;

-- Simple auth.uid() function for local development
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- USERS TABLE
-- ========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'annotator' CHECK (role IN ('admin', 'client', 'annotator')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Sample users for testing
INSERT INTO users (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@linguabridge.com', 'Admin User', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'client@example.com', 'Test Client', 'client'),
  ('33333333-3333-3333-3333-333333333333', 'annotator1@example.com', 'John Annotator', 'annotator'),
  ('44444444-4444-4444-4444-444444444444', 'annotator2@example.com', 'Jane Annotator', 'annotator');

-- Base schema created successfully
