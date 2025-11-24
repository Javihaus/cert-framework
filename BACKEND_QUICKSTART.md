# CERT Backend Infrastructure - Quick Start Guide

This guide will help you start the production-grade backend infrastructure for CERT Dashboard.

## Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for local development)
- Node.js 18+ (for Next.js dashboard)
- Supabase account (optional, for database)

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Next.js   │────▶│   FastAPI    │────▶│   Celery   │
│  Dashboard  │     │    Server    │     │   Worker   │
└─────────────┘     └──────────────┘     └────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌────────────┐
                    │    Redis     │     │   MinIO    │
                    │ (Job Queue)  │     │  (Storage) │
                    └──────────────┘     └────────────┘
```

## Quick Start (Docker)

### Step 1: Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in your values
# At minimum, set SUPABASE_URL and SUPABASE_KEY if using Supabase
nano .env
```

### Step 2: Start Backend Services

```bash
# Start all backend services
docker-compose -f docker-compose.backend.yml up

# Or start in detached mode
docker-compose -f docker-compose.backend.yml up -d
```

This starts:
- **Redis** (port 6379) - Message broker
- **MinIO** (ports 9000, 9001) - File storage
- **FastAPI** (port 8000) - API server
- **Celery Worker** - Background task processor
- **Flower** (port 5555) - Celery monitoring UI (optional)
- **Next.js Dashboard** (port 3000) - Web interface

### Step 3: Verify Services

```bash
# Check all services are running
docker-compose -f docker-compose.backend.yml ps

# Check API health
curl http://localhost:8000/health

# Check MinIO console
open http://localhost:9001
# Login: minioadmin / minioadmin123

# Check Celery monitoring
open http://localhost:5555

# Check Dashboard
open http://localhost:3000
```

### Step 4: Test Document Generation

```bash
# Create test data file
cat > test_traces.jsonl << 'EOF'
{"input_query":"What is AI?","answer":"Artificial Intelligence","context":"AI basics","expected":"AI is intelligence by machines","status":"success","duration_ms":123,"timestamp":"2025-01-01T00:00:00Z"}
{"input_query":"What is ML?","answer":"Machine Learning","context":"ML basics","expected":"ML is learning from data","status":"success","duration_ms":145,"timestamp":"2025-01-01T00:01:00Z"}
EOF

# Test via API
curl -X POST http://localhost:8000/api/v2/documents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "riskData": {
      "metadata": {
        "system_name": "Test System",
        "system_version": "v1.0",
        "provider_name": "Test Corp"
      },
      "classification": {
        "risk_level": "high",
        "title": "High-Risk AI System"
      }
    },
    "complianceData": {
      "metadata": {
        "system_name": "Test System",
        "generated_at": "2025-01-01T00:00:00Z"
      }
    }
  }'

# Response will include job_id:
# {"job_id":"abc-123-def-456","status":"pending"}

# Check job status
curl http://localhost:8000/api/v2/documents/status/abc-123-def-456
```

## Manual Start (For Development)

If you prefer to run services manually without Docker:

### Step 1: Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-backend.txt

# Install Node.js dependencies
cd dashboard
npm install
cd ..
```

### Step 2: Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using Homebrew (Mac)
brew install redis
redis-server
```

### Step 3: Start MinIO

```bash
# Using Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"

# Create buckets
docker run -it --network host minio/mc \
  alias set myminio http://localhost:9000 minioadmin minioadmin123

docker run -it --network host minio/mc \
  mb myminio/cert-documents

docker run -it --network host minio/mc \
  anonymous set download myminio/cert-documents
```

### Step 4: Start Celery Worker

```bash
# Terminal 1: Start Celery worker
export REDIS_URL=redis://localhost:6379/0
export CELERY_BROKER_URL=redis://localhost:6379/0
export CELERY_RESULT_BACKEND=redis://localhost:6379/1
export MINIO_ENDPOINT=localhost:9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin123

celery -A backend.celery_app worker --loglevel=info --concurrency=4
```

### Step 5: Start FastAPI Server

```bash
# Terminal 2: Start API server
export REDIS_URL=redis://localhost:6379/0
export MINIO_ENDPOINT=localhost:9000

python -m uvicorn cert.api.server:app --host 0.0.0.0 --port 8000 --reload
```

### Step 6: Start Next.js Dashboard

```bash
# Terminal 3: Start dashboard
cd dashboard
export NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

## Testing the Full Pipeline

### Test 1: Document Generation

```bash
# Run test script
python3 << 'EOF'
import requests
import time
import json

# Start document generation
response = requests.post('http://localhost:8000/api/v2/documents/generate', json={
    "riskData": {
        "metadata": {"system_name": "Test System", "system_version": "v1.0", "provider_name": "Test Corp"},
        "classification": {"risk_level": "high", "title": "High-Risk AI System"}
    },
    "complianceData": {
        "metadata": {"system_name": "Test System", "generated_at": "2025-01-01T00:00:00Z"}
    }
})

job_data = response.json()
job_id = job_data['job_id']
print(f"Job started: {job_id}")

# Poll for completion
while True:
    status_response = requests.get(f'http://localhost:8000/api/v2/documents/status/{job_id}')
    status = status_response.json()

    print(f"Status: {status['status']}")

    if status['status'] == 'SUCCESS':
        print(f"Download URL: {status['result']['file_url']}")
        break
    elif status['status'] == 'FAILURE':
        print(f"Error: {status['error']}")
        break

    time.sleep(2)
EOF
```

### Test 2: Accuracy Audit

```bash
# Create test traces
cat > /tmp/test_traces.jsonl << 'EOF'
{"input_query":"What is AI?","answer":"Artificial Intelligence","expected":"AI is intelligence by machines","status":"success","duration_ms":123,"timestamp":"2025-01-01T00:00:00Z"}
{"input_query":"What is ML?","answer":"Machine Learning","expected":"ML is learning from data","status":"success","duration_ms":145,"timestamp":"2025-01-01T00:01:00Z"}
EOF

# Run audit
python3 << 'EOF'
import requests
import time

# Read traces
with open('/tmp/test_traces.jsonl') as f:
    traces_data = f.read()

# Start audit
response = requests.post('http://localhost:8000/api/v2/audit/run', json={
    "traces": traces_data,
    "threshold": 0.7,
    "evaluator": "semantic"
})

job_data = response.json()
job_id = job_data['job_id']
print(f"Audit started: {job_id}")

# Poll for completion
while True:
    status_response = requests.get(f'http://localhost:8000/api/v2/audit/status/{job_id}')
    status = status_response.json()

    print(f"Status: {status['status']}")

    if status['status'] == 'SUCCESS':
        result = status['result']
        print(f"Pass rate: {result['pass_rate']:.2%}")
        print(f"Passed: {result['passed_traces']}/{result['total_traces']}")
        break
    elif status['status'] == 'FAILURE':
        print(f"Error: {status['error']}")
        break

    time.sleep(1)
EOF
```

## Monitoring

### View Celery Tasks (Flower UI)

```bash
# Open Flower monitoring UI
open http://localhost:5555

# View:
# - Active tasks
# - Completed tasks
# - Failed tasks
# - Worker status
```

### View Generated Files (MinIO)

```bash
# Open MinIO console
open http://localhost:9001

# Login: minioadmin / minioadmin123
# Browse to cert-documents bucket
# Download generated files
```

### View Logs

```bash
# View all services logs
docker-compose -f docker-compose.backend.yml logs -f

# View specific service logs
docker-compose -f docker-compose.backend.yml logs -f celery-worker
docker-compose -f docker-compose.backend.yml logs -f api

# View real-time Celery worker output
docker-compose -f docker-compose.backend.yml logs -f celery-worker | grep "Task"
```

## Troubleshooting

### Issue: Celery worker not connecting

```bash
# Check Redis is running
docker-compose -f docker-compose.backend.yml ps redis

# Test Redis connection
docker run -it --network cert-backend redis:7-alpine redis-cli -h redis ping
# Should return: PONG

# Check Celery worker logs
docker-compose -f docker-compose.backend.yml logs celery-worker
```

### Issue: Document generation fails

```bash
# Check templates directory exists
ls -la templates/

# Check Celery worker logs for errors
docker-compose -f docker-compose.backend.yml logs -f celery-worker

# Verify MinIO is accessible
curl http://localhost:9000/minio/health/live
```

### Issue: MinIO connection errors

```bash
# Check MinIO is running
docker-compose -f docker-compose.backend.yml ps minio

# Verify buckets exist
docker run -it --network cert-backend minio/mc \
  alias set myminio http://minio:9000 minioadmin minioadmin123

docker run -it --network cert-backend minio/mc \
  ls myminio

# Should show: cert-documents, cert-reports
```

### Issue: API returns 503 (Service Unavailable)

This means Celery workers are not available.

```bash
# Check worker is running
docker-compose -f docker-compose.backend.yml ps celery-worker

# Restart worker
docker-compose -f docker-compose.backend.yml restart celery-worker

# Check worker health
docker-compose -f docker-compose.backend.yml exec celery-worker \
  celery -A backend.celery_app inspect ping
```

## Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.backend.yml down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose -f docker-compose.backend.yml down -v
```

## Production Deployment

For production deployment:

1. **Update Environment Variables**
   - Set strong passwords for MinIO
   - Use production Supabase instance
   - Set proper API URLs

2. **Scale Workers**
   ```bash
   docker-compose -f docker-compose.backend.yml up -d --scale celery-worker=4
   ```

3. **Configure Reverse Proxy**
   - Use Nginx/Caddy for HTTPS
   - Set proper CORS headers
   - Rate limiting

4. **Enable Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Error tracking (Sentry)

5. **Backup Strategy**
   - Redis persistence
   - MinIO backup
   - Database backups

## Next Steps

- Review [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md) for architecture details
- Implement P2 features (Readiness Assessment, Cost Optimizer)
- Set up production monitoring
- Configure CI/CD pipeline

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.backend.yml logs`
- Review [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md)
- Open GitHub issue
