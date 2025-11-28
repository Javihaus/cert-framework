-- CERT Dashboard Database Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Users profile table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  is_active BOOLEAN DEFAULT true,
  api_key TEXT UNIQUE DEFAULT ('cert_' || replace(gen_random_uuid()::text, '-', '')),
  settings JSONB DEFAULT '{}'::jsonb
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0'
);

-- Traces table (for LLM observability)
CREATE TABLE IF NOT EXISTS public.traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_user_id ON public.traces(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_project_id ON public.traces(project_id);
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON public.traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_evaluation_status ON public.traces(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users(api_key);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for traces table
CREATE POLICY "Users can view own traces" ON public.traces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own traces" ON public.traces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traces" ON public.traces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own traces" ON public.traces
  FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'company'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Trigger to auto-create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
