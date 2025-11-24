# CERT Backend Infrastructure Implementation Plan

## Executive Summary

This document outlines the production-grade backend infrastructure implementation for CERT Dashboard, transitioning from MVP process-spawning architecture to a scalable, async, production-ready system.

## Current State Analysis

### ✅ Existing Infrastructure

1. **FastAPI Server** (`cert/api/server.py`)
   - Metrics endpoints (cost, health, quality)
   - Optimization recommendations
   - Connector status
   - Traces API
   - Runs on port 8000

2. **Database**
   - Supabase PostgreSQL
   - Schema: traces, measurements, compliance_checks, projects
   - Client library: `cert/database/client.py`

3. **Document Generation** (MVP)
   - Next.js route: `/api/generate-documents`
   - Python script: `scripts/populate_templates.py`
   - Uses `python-docx` for Word docs
   - Current approach: Synchronous process spawning

4. **Audit/Testing** (MVP)
   - Next.js route: `/api/run-audit`
   - CLI: `cert.cli.main audit`
   - Current approach: Synchronous process spawning

### ❌ Missing for Production

1. **Task Queue** - No Celery + Redis for background jobs
2. **File Storage** - No MinIO/S3 for generated documents
3. **Async Processing** - Document generation blocks requests
4. **Scalability** - Cannot handle concurrent document generation
5. **Job Status** - No way to track long-running tasks
6. **File Management** - Files stored in /tmp, not cleaned up

## Architecture Design

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│                  (dashboard/ directory)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Server (Enhanced)                  │
│                  (cert/api/server.py)                        │
│                                                              │
│  Endpoints:                                                  │
│  • POST /api/documents/generate → Celery task              │
│  • GET  /api/documents/status/:job_id                       │
│  • GET  /api/documents/download/:file_id                    │
│  • POST /api/audit/run → Celery task                       │
│  • GET  /api/audit/status/:job_id                          │
│  • [Existing metrics endpoints...]                          │
└────────────┬──────────────────┬──────────────┬─────────────┘
             │                  │              │
             │                  │              │
             ▼                  ▼              ▼
┌──────────────────┐  ┌──────────────┐  ┌────────────────┐
│   Celery Worker  │  │    Redis     │  │    MinIO       │
│                  │  │              │  │                │
│  Tasks:          │  │  • Job Queue │  │  • S3-compat   │
│  • generate_docs │◄─┤  • Results   │  │  • File Store  │
│  • run_audit     │  │  • Cache     │  │  • Public URLs │
│  • generate_pdf  │  │              │  │                │
└────────┬─────────┘  └──────────────┘  └────────────────┘
         │
         │
         ▼
┌────────────────────────────────────────────────────┐
│              Supabase PostgreSQL                    │
│                                                     │
│  Tables:                                            │
│  • traces                                          │
│  • measurements                                    │
│  • compliance_checks                               │
│  • projects                                        │
│  • document_jobs (NEW)                             │
└────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| API Server | FastAPI | Async HTTP endpoints |
| Task Queue | Celery | Background job processing |
| Message Broker | Redis | Celery backend + caching |
| File Storage | MinIO | S3-compatible object storage |
| Database | PostgreSQL (Supabase) | Persistent data |
| Document Gen | python-docx | Word document creation |
| PDF Gen | WeasyPrint | HTML → PDF conversion |
| Orchestration | Docker Compose | Local development |

## Implementation Phases

### Phase 1: Infrastructure Setup (Priority 1)

**Goal:** Set up Redis, MinIO, and Docker Compose orchestration

**Tasks:**
1. Create `docker-compose.yml` with services:
   - Redis (port 6379)
   - MinIO (port 9000 API, 9001 console)
   - PostgreSQL (optional, using Supabase)

2. Configure MinIO:
   - Default credentials
   - Create `cert-documents` bucket
   - Set public read policy for downloads

3. Test connectivity from FastAPI

**Deliverables:**
- `docker-compose.yml`
- `backend/config.py` with environment variables
- Connection test scripts

### Phase 2: Celery Integration (Priority 1)

**Goal:** Implement task queue for background processing

**Tasks:**
1. Install dependencies:
   - celery>=5.3.0
   - redis>=5.0.0
   - celery[redis]

2. Create Celery app:
   - `backend/celery_app.py`
   - Configure Redis broker
   - Configure result backend

3. Create worker tasks:
   - `backend/tasks/document_generation.py`
   - `backend/tasks/audit_runner.py`
   - `backend/tasks/pdf_generation.py`

4. Start Celery worker:
   ```bash
   celery -A backend.celery_app worker --loglevel=info
   ```

**Deliverables:**
- `backend/celery_app.py`
- `backend/tasks/` directory
- Worker startup script

### Phase 3: Document Generation Service (Priority 1)

**Goal:** Async document generation with MinIO storage

**Tasks:**
1. Create `backend/services/document_generator.py`:
   - Load templates from `templates/`
   - Populate with data (existing logic from `populate_templates.py`)
   - Upload to MinIO
   - Return file URL

2. Create Celery task `generate_compliance_documents`:
   - Input: risk_data, compliance_data
   - Process: Generate docs, create ZIP
   - Output: MinIO URL, job status

3. Database schema extension:
   - Add `document_jobs` table:
     ```sql
     CREATE TABLE document_jobs (
       id UUID PRIMARY KEY,
       status TEXT, -- 'pending', 'processing', 'completed', 'failed'
       created_at TIMESTAMP,
       completed_at TIMESTAMP,
       file_url TEXT,
       error_message TEXT,
       metadata JSONB
     );
     ```

4. FastAPI endpoints:
   - `POST /api/documents/generate` → Start job, return job_id
   - `GET /api/documents/status/:job_id` → Check status
   - `GET /api/documents/download/:file_id` → MinIO redirect

**Deliverables:**
- `backend/services/document_generator.py`
- `backend/tasks/document_generation.py`
- Database migration for `document_jobs`
- Updated FastAPI endpoints

### Phase 4: MinIO Integration (Priority 1)

**Goal:** Reliable file storage and retrieval

**Tasks:**
1. Install MinIO client:
   - `pip install minio`

2. Create `backend/storage/minio_client.py`:
   - Initialize MinIO client
   - Upload file → Return public URL
   - Delete file (cleanup)
   - Generate presigned URLs (optional)

3. Configure bucket:
   - Bucket name: `cert-documents`
   - Policy: Public read for generated documents
   - Lifecycle: Auto-delete after 7 days (optional)

**Deliverables:**
- `backend/storage/minio_client.py`
- MinIO bucket setup script
- Test suite for storage operations

### Phase 5: Enhanced FastAPI Server (Priority 1)

**Goal:** Production-ready async endpoints

**Tasks:**
1. Update `cert/api/server.py`:
   - Add async document generation endpoints
   - Add job status tracking endpoints
   - Add file download proxying

2. Implement endpoints:
   ```python
   @app.post("/api/documents/generate")
   async def generate_documents(request: DocumentRequest):
       job = generate_compliance_documents.delay(request.dict())
       return {"job_id": job.id, "status": "pending"}

   @app.get("/api/documents/status/{job_id}")
   async def get_document_status(job_id: str):
       result = AsyncResult(job_id)
       return {
           "status": result.state,
           "result": result.result if result.ready() else None
       }

   @app.get("/api/documents/download/{file_id}")
   async def download_document(file_id: str):
       # Get file URL from MinIO
       url = minio_client.get_file_url(file_id)
       return RedirectResponse(url)
   ```

3. Error handling and validation

**Deliverables:**
- Updated `cert/api/server.py`
- API documentation (OpenAPI/Swagger)
- Integration tests

### Phase 6: PDF Generation Service (Priority 2)

**Goal:** Generate PDFs from HTML templates

**Tasks:**
1. Install WeasyPrint:
   - `pip install weasyprint`
   - System dependencies: `apt-get install libpango-1.0-0 libpangoft2-1.0-0`

2. Create `backend/services/pdf_generator.py`:
   - HTML templates for reports
   - CSS styling
   - WeasyPrint rendering

3. Celery task `generate_pdf_report`:
   - Input: report_data, template_name
   - Process: Render HTML, convert to PDF
   - Output: MinIO URL

**Deliverables:**
- `backend/services/pdf_generator.py`
- PDF templates in `templates/pdf/`
- Celery task for PDF generation

### Phase 7: Next.js Integration (Priority 2)

**Goal:** Replace process spawning with FastAPI calls

**Tasks:**
1. Update `/dashboard/app/api/generate-documents/route.ts`:
   ```typescript
   // Before: spawn Python process
   const pythonProcess = spawn('python3', [...]);

   // After: Call FastAPI
   const response = await fetch('http://localhost:8000/api/documents/generate', {
     method: 'POST',
     body: JSON.stringify({ riskData, complianceData })
   });
   const { job_id } = await response.json();

   // Poll for status
   while (true) {
     const status = await fetch(`http://localhost:8000/api/documents/status/${job_id}`);
     if (status.state === 'SUCCESS') break;
     await sleep(1000);
   }
   ```

2. Update `/dashboard/app/api/run-audit/route.ts` similarly

3. Add loading states in frontend:
   - Show progress indicator
   - Display job status
   - Handle errors gracefully

**Deliverables:**
- Updated Next.js API routes
- Frontend polling logic
- Loading UI components

### Phase 8: Testing & Deployment (Priority 3)

**Goal:** Ensure reliability and production readiness

**Tasks:**
1. Integration tests:
   - Test full document generation pipeline
   - Test audit execution
   - Test MinIO file operations

2. Load testing:
   - Concurrent document generation
   - Redis connection pooling
   - Worker scaling

3. Deployment documentation:
   - Environment variables
   - Docker Compose production config
   - Health checks and monitoring

**Deliverables:**
- Test suite in `tests/backend/`
- Load test results
- Deployment guide

## Environment Variables

```bash
# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=cert-documents
MINIO_SECURE=false

# Supabase (existing)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-key-here

# FastAPI
API_HOST=0.0.0.0
API_PORT=8000

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

## File Structure

```
cert-framework/
├── backend/
│   ├── __init__.py
│   ├── celery_app.py          # Celery configuration
│   ├── config.py               # Environment config
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_generator.py
│   │   └── pdf_generator.py
│   ├── storage/
│   │   ├── __init__.py
│   │   └── minio_client.py
│   └── tasks/
│       ├── __init__.py
│       ├── document_generation.py
│       ├── audit_runner.py
│       └── pdf_generation.py
├── cert/
│   └── api/
│       └── server.py           # Enhanced FastAPI server
├── docker-compose.yml          # Infrastructure orchestration
├── requirements-backend.txt    # Backend-specific deps
└── database/
    └── migrations/
        └── 003_document_jobs.sql
```

## Dependencies to Add

```txt
# requirements-backend.txt
celery>=5.3.0
redis>=5.0.0
celery[redis]
minio>=7.2.0
weasyprint>=60.0
python-docx>=1.1.0  # Already exists
pillow>=10.0.0      # For image processing
```

## Success Metrics

1. **Performance:**
   - Document generation completes in < 30 seconds
   - Supports 10+ concurrent generation jobs
   - No memory leaks in long-running workers

2. **Reliability:**
   - 99.9% task completion rate
   - Failed jobs auto-retry (3 attempts)
   - All files stored persistently in MinIO

3. **Scalability:**
   - Celery workers can scale horizontally
   - Redis handles 100+ jobs/minute
   - MinIO serves files with < 100ms latency

## Timeline Estimate

- **Phase 1-2 (Infrastructure + Celery):** 4 hours
- **Phase 3-4 (Document Gen + MinIO):** 6 hours
- **Phase 5 (FastAPI Enhancement):** 3 hours
- **Phase 6 (PDF Generation):** 3 hours
- **Phase 7 (Next.js Integration):** 2 hours
- **Phase 8 (Testing):** 2 hours

**Total: ~20 hours**

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MinIO not compatible with deployment environment | High | Use AWS S3 as fallback, abstraction layer |
| Celery worker crashes | Medium | Implement auto-restart, health checks |
| Document generation memory spike | Medium | Set memory limits, use streaming |
| Redis connection exhaustion | Low | Connection pooling, max workers limit |

## Next Steps

1. Start with Phase 1: Set up Docker Compose
2. Verify connectivity to all services
3. Implement Celery task queue
4. Migrate document generation to async tasks
5. Test end-to-end pipeline
