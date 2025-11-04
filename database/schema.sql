-- CERT Framework Database Schema
-- For use with Supabase PostgreSQL
--
-- Setup Instructions:
-- 1. Create a Supabase project at https://supabase.com
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Copy and paste this entire file
-- 4. Click "Run" to create all tables
-- 5. Set SUPABASE_URL and SUPABASE_KEY environment variables in your application

-- Traces table: stores every LLM call
CREATE TABLE IF NOT EXISTS traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Core trace data
    function_name TEXT NOT NULL,
    input_text TEXT,
    output_text TEXT,
    context TEXT,  -- For RAG systems

    -- Timing
    duration_ms FLOAT NOT NULL,

    -- Status
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- User/project identification
    user_id UUID,
    project_id UUID,

    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_ms >= 0)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_status ON traces(status);
CREATE INDEX IF NOT EXISTS idx_traces_user_id ON traces(user_id);
CREATE INDEX IF NOT EXISTS idx_traces_project_id ON traces(project_id);
CREATE INDEX IF NOT EXISTS idx_traces_function_name ON traces(function_name);

-- Measurements table: stores accuracy measurements
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

CREATE INDEX IF NOT EXISTS idx_measurements_confidence ON measurements(confidence);
CREATE INDEX IF NOT EXISTS idx_measurements_passed ON measurements(passed);
CREATE INDEX IF NOT EXISTS idx_measurements_trace_id ON measurements(trace_id);

-- Compliance checks table: stores periodic compliance analysis
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Project identification
    project_id UUID NOT NULL,

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

-- Projects table: metadata about each AI system being monitored
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Project info
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    provider_name TEXT NOT NULL,

    -- System metadata (for Annex IV)
    intended_purpose TEXT,
    architecture JSONB DEFAULT '{}',
    data_governance JSONB DEFAULT '{}',

    -- Owner
    user_id UUID NOT NULL,

    CONSTRAINT unique_project_name_per_user UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Optional: Create a view for easy querying of traces with measurements
CREATE OR REPLACE VIEW traces_with_measurements AS
SELECT
    t.*,
    m.confidence,
    m.semantic_score,
    m.grounding_score,
    m.passed
FROM traces t
LEFT JOIN measurements m ON t.id = m.trace_id;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CERT Framework database schema created successfully!';
    RAISE NOTICE 'Tables created: traces, measurements, compliance_checks, projects';
    RAISE NOTICE 'View created: traces_with_measurements';
END $$;
