-- CERT Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  api_key TEXT UNIQUE DEFAULT ('cert_' || replace(uuid_generate_v4()::text, '-', '')),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0'
);

-- Traces table (for LLM observability)
CREATE TABLE IF NOT EXISTS traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  trace_id TEXT,
  span_id TEXT,
  parent_span_id TEXT,
  name TEXT NOT NULL,
  kind TEXT DEFAULT 'llm',
  vendor TEXT,
  model TEXT,
  input_text TEXT,
  output_text TEXT,
  context TEXT[],
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'error', 'unset')),
  error_message TEXT,
  evaluation_score DECIMAL(5,4),
  evaluation_status TEXT CHECK (evaluation_status IN ('pass', 'fail', 'review')),
  evaluation_criteria JSONB,
  evaluated_at TIMESTAMPTZ,
  evaluated_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'manual' CHECK (source IN ('otlp', 'sdk', 'manual'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_user_id ON traces(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_project_id ON traces(project_id);
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_evaluation_status ON traces(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API)
CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to sessions" ON sessions
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to projects" ON projects
  FOR ALL USING (true);

CREATE POLICY "Service role has full access to traces" ON traces
  FOR ALL USING (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
