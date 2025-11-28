-- CERT Framework Database Schema
-- For use with Supabase PostgreSQL
--
-- Setup Instructions:
-- 1. Create a Supabase project at https://supabase.com
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Copy and paste this entire file
-- 4. Click "Run" to create all tables
-- 5. Set SUPABASE_URL and SUPABASE_KEY environment variables in your application

-- ============================================================
-- 1. USERS TABLE (must be created first)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- User info
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    company TEXT,
    password_hash TEXT NOT NULL,

    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,

    -- API access (for notebook/SDK authentication)
    api_key UUID DEFAULT gen_random_uuid(),

    -- Settings stored as JSON
    settings JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- ============================================================
-- 2. PROJECTS TABLE (references users)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Owner (required)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Project info
    name TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0.0',

    -- System metadata (for Annex IV)
    intended_purpose TEXT,
    architecture JSONB DEFAULT '{}',
    data_governance JSONB DEFAULT '{}',

    CONSTRAINT unique_project_name_per_user UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- ============================================================
-- 3. TRACES TABLE (references users and projects)
-- ============================================================
CREATE TABLE IF NOT EXISTS traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- User/project identification
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Core trace data
    trace_id TEXT,
    span_id TEXT,
    parent_span_id TEXT,
    name TEXT NOT NULL,
    kind TEXT DEFAULT 'CLIENT',

    -- LLM-specific data
    vendor TEXT,
    model TEXT,
    input_text TEXT,
    output_text TEXT,
    context JSONB,  -- For RAG systems - array of source chunks

    -- Token usage
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Timing
    duration_ms FLOAT NOT NULL DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,

    -- Status
    status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error', 'unset')),
    error_message TEXT,

    -- Evaluation results (stored directly on trace for simplicity)
    evaluation_score FLOAT,
    evaluation_status TEXT CHECK (evaluation_status IN ('pass', 'fail', 'review')),
    evaluation_criteria JSONB,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    evaluated_by TEXT,  -- judge model name or 'human'

    -- Metadata
    metadata JSONB DEFAULT '{}',
    source TEXT DEFAULT 'sdk' CHECK (source IN ('otlp', 'sdk', 'manual')),

    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_ms >= 0)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_user_id ON traces(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_project_id ON traces(project_id);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_traces_vendor ON traces(vendor);
CREATE INDEX IF NOT EXISTS idx_traces_model ON traces(model);
CREATE INDEX IF NOT EXISTS idx_traces_evaluation_status ON traces(evaluation_status);

-- ============================================================
-- 4. MEASUREMENTS TABLE (legacy - for detailed evaluation breakdown)
-- ============================================================
CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Measurement results
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    semantic_score FLOAT NOT NULL CHECK (semantic_score >= 0 AND semantic_score <= 1),
    grounding_score FLOAT NOT NULL CHECK (grounding_score >= 0 AND grounding_score <= 1),

    -- Threshold used
    threshold FLOAT NOT NULL DEFAULT 0.5,

    -- Pass/fail
    passed BOOLEAN NOT NULL,

    CONSTRAINT unique_measurement_per_trace UNIQUE(trace_id)
);

CREATE INDEX IF NOT EXISTS idx_measurements_trace_id ON measurements(trace_id);
CREATE INDEX IF NOT EXISTS idx_measurements_passed ON measurements(passed);

-- ============================================================
-- 5. COMPLIANCE CHECKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Project identification
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Time period analyzed
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Article 15 results
    article_15_compliant BOOLEAN NOT NULL,
    article_15_issues JSONB DEFAULT '[]',
    error_rate FLOAT,
    avg_response_time_ms FLOAT,
    accuracy_score FLOAT,

    -- Annex IV results
    annex_iv_complete BOOLEAN NOT NULL,
    annex_iv_missing JSONB DEFAULT '[]',

    -- Overall
    overall_compliant BOOLEAN NOT NULL,
    risk_score FLOAT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),

    -- Full report data
    report_data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_project_id ON compliance_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_created_at ON compliance_checks(created_at DESC);

-- ============================================================
-- 6. SESSIONS TABLE (for authentication)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Session token (stored in cookie)
    token TEXT NOT NULL UNIQUE,

    -- Device/browser info
    user_agent TEXT,
    ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- VIEWS
-- ============================================================

-- View for traces with user info
CREATE OR REPLACE VIEW traces_with_user AS
SELECT
    t.*,
    u.email as user_email,
    u.name as user_name,
    p.name as project_name
FROM traces t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN projects p ON t.project_id = p.id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CERT Framework database schema created successfully!';
    RAISE NOTICE 'Tables created: users, projects, traces, measurements, compliance_checks, sessions';
    RAISE NOTICE 'Views created: traces_with_user';
END $$;
