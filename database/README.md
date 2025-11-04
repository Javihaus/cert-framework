# Database Setup Guide

This directory contains the database schema and setup instructions for CERT Framework.

## Quick Setup (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign in with GitHub
3. Click "New project"
4. Fill in:
   - **Name:** cert-framework-prod
   - **Database Password:** Generate and save in password manager
   - **Region:** Choose closest to your users
5. Click "Create new project" (takes ~2 minutes)

### 2. Run Schema Migration

1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Copy contents of `database/schema.sql`
4. Paste into editor
5. Click "Run" ▶️
6. Verify success: Go to "Table Editor" - you should see 4 tables

### 3. Get Credentials

1. In Supabase dashboard, click "Settings" → "API"
2. Copy these values:
   - **Project URL:** `https://xxx.supabase.co`
   - **anon/public key:** Long string starting with `eyJ...`

### 4. Configure Environment Variables

```bash
# Add to your .env file or environment
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_KEY="eyJ..."
```

### 5. Test Connection

```python
from cert.database.client import DatabaseClient

# Initialize client (uses env vars)
db = DatabaseClient()

# Test connection
trace_id = db.insert_trace(
    function_name="test",
    duration_ms=123.4,
    status="success",
    input_text="test input",
    output_text="test output"
)

print(f"✓ Database connected! Trace ID: {trace_id}")
```

## Schema Overview

### Tables

1. **traces** - Every LLM call
   - Stores input, output, timing, errors
   - Indexed by date, status, project

2. **measurements** - Accuracy scores
   - Links to traces (1:1 relationship)
   - Stores confidence, semantic, grounding scores

3. **compliance_checks** - Periodic compliance reports
   - Historical compliance status
   - Article 15 & Annex IV results

4. **projects** - AI systems being monitored
   - Groups traces together
   - Stores system metadata

### Views

- **traces_with_measurements** - Traces joined with their measurements for easy querying

## Common Queries

### Get failed traces

```python
from cert.database.client import DatabaseClient

db = DatabaseClient()
failed = db.get_failed_traces(limit=10)

for trace in failed:
    print(f"Function: {trace['function_name']}")
    print(f"  Error: {trace['error_message']}")
    print(f"  Confidence: {trace['measurements'][0]['confidence']:.2f}")
```

### Query by date range

```python
from datetime import datetime, timedelta

week_ago = datetime.utcnow() - timedelta(days=7)
recent_traces = db.get_traces(start_date=week_ago, limit=100)
```

### Get compliance history

```python
# Direct SQL query via Supabase client
response = db.client.table("compliance_checks") \\
    .select("*") \\
    .eq("project_id", project_id) \\
    .order("created_at", desc=True) \\
    .limit(10) \\
    .execute()

checks = response.data
```

## Migration from JSONL Files

If you have existing JSONL trace files:

```python
import json
from cert.database.client import DatabaseClient

db = DatabaseClient()

# Read JSONL file
with open("traces.jsonl") as f:
    for line in f:
        trace = json.loads(line)

        # Insert to database
        db.insert_trace(
            function_name=trace["function"],
            duration_ms=trace["duration_ms"],
            status=trace["status"],
            input_text=trace.get("input"),
            output_text=trace.get("output"),
        )

print("✓ Migration complete")
```

## Troubleshooting

### Connection Error

```
ValueError: Supabase credentials required
```

**Fix:** Set `SUPABASE_URL` and `SUPABASE_KEY` environment variables.

### Table Not Found

```
relation "traces" does not exist
```

**Fix:** Run `database/schema.sql` in Supabase SQL Editor.

### Permission Denied

```
permission denied for table traces
```

**Fix:** Ensure you're using the `service_role` key (not `anon` key) for server-side operations.

## Security Notes

1. **Never commit** `SUPABASE_KEY` to git
2. Use `.env` files (add to `.gitignore`)
3. For production, use **service_role key** server-side only
4. For client-side (browser), use **anon key** + Row Level Security

## Next Steps

Once database is set up:

1. Update tracer to write to database (see `cert/core/tracer.py`)
2. Update dashboard to read from database (see `dashboard/app/api/`)
3. Set up automated compliance checks (cron job)
