# CERT Framework v4.0 - Deployment Guide

Complete guide for deploying CERT Framework in production environments.

---

## Prerequisites

### System Requirements

**Hamiltonian Monitor:**
- CPU: 4+ cores
- RAM: 8GB minimum (16GB recommended)
- GPU: NVIDIA GPU with 12GB+ VRAM (optional, CPU fallback available)
- Storage: 20GB for model cache

**Coordination Monitor:**
- CPU: 2+ cores
- RAM: 4GB minimum
- GPU: Not required
- Anthropic API key required

### Software Dependencies

- Docker 20.10+
- Kubernetes 1.20+ (for K8s deployment)
- kubectl configured
- Prometheus (for monitoring)
- Grafana (for dashboards)

---

## Quick Start: Docker Compose

### 1. Set Environment Variables

```bash
# Create .env file
cat > .env <<EOF
ANTHROPIC_API_KEY=your_api_key_here
MODEL_NAME=gpt2  # Use small model for testing
DEVICE=cpu
LOG_LEVEL=INFO
EOF
```

### 2. Start Services

```bash
cd deployments/docker
docker-compose up -d
```

### 3. Verify Services

```bash
# Check Hamiltonian monitor
curl http://localhost:8000/health

# Check Coordination monitor
curl http://localhost:8001/health

# Check Prometheus
curl http://localhost:9092/-/healthy

# Check Grafana
open http://localhost:3000
# Login: admin / cert_admin
```

### 4. Test API

```bash
# Test Hamiltonian monitor
curl -X POST http://localhost:8000/api/v1/trajectory/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain AI"}'

# Test Coordination monitor
curl -X POST http://localhost:8001/api/v1/coordination/measure \
  -H "Content-Type: application/json" \
  -d '{"task": "Explain quantum computing", "num_agents": 2, "strategy": "parallel"}'
```

---

## Production Deployment: Kubernetes

### 1. Build Docker Images

```bash
# Build Hamiltonian image
docker build -t cert-framework/hamiltonian:4.0.0 \
  -f deployments/docker/Dockerfile.hamiltonian .

# Build Coordination image
docker build -t cert-framework/coordination:4.0.0 \
  -f deployments/docker/Dockerfile.coordination .

# Push to registry
docker push cert-framework/hamiltonian:4.0.0
docker push cert-framework/coordination:4.0.0
```

### 2. Create Kubernetes Secret

```bash
# Create Anthropic API key secret
kubectl create secret generic anthropic-secret \
  --from-literal=api-key=your_anthropic_api_key_here
```

### 3. Deploy Services

```bash
# Deploy Hamiltonian monitor
kubectl apply -f deployments/kubernetes/hamiltonian/deployment.yaml

# Deploy Coordination monitor
kubectl apply -f deployments/kubernetes/coordination/deployment.yaml

# Verify deployments
kubectl get pods -l app=hamiltonian-monitor
kubectl get pods -l app=coordination-monitor
```

### 4. Check Service Status

```bash
# Get service endpoints
kubectl get services

# Check logs
kubectl logs -f deployment/hamiltonian-monitor
kubectl logs -f deployment/coordination-monitor

# Check health
kubectl get pods -l app=hamiltonian-monitor -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}'
```

### 5. Scale Services

```bash
# Scale Hamiltonian monitor
kubectl scale deployment hamiltonian-monitor --replicas=5

# Scale Coordination monitor
kubectl scale deployment coordination-monitor --replicas=3
```

---

## Monitoring Setup

### Prometheus

```bash
# Deploy Prometheus
kubectl create configmap prometheus-config \
  --from-file=deployments/prometheus/prometheus.yml

# Access Prometheus UI
kubectl port-forward svc/prometheus 9090:9090
open http://localhost:9090
```

### Grafana

```bash
# Deploy Grafana
kubectl apply -f deployments/grafana/deployment.yaml

# Access Grafana UI
kubectl port-forward svc/grafana 3000:3000
open http://localhost:3000
```

**Import Dashboards:**
1. Login to Grafana (admin / cert_admin)
2. Go to Dashboards → Import
3. Upload JSON from `deployments/grafana/dashboards/`

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRELOAD_MODELS` | `true` | Preload models on startup |
| `MODEL_NAME` | `Qwen/Qwen2.5-7B` | Model to load |
| `DEVICE` | `auto` | Device (`auto`, `cuda`, `cpu`) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FORMAT` | `json` | Log format (`json`, `human`) |
| `METRICS_ENABLED` | `true` | Enable Prometheus metrics |
| `METRICS_PORT` | `9090` | Metrics port |
| `MAX_COST_PER_HOUR` | `10.0` | API cost limit (USD) |

### Resource Limits

**Hamiltonian Monitor (Kubernetes):**
```yaml
resources:
  requests:
    memory: "4Gi"
    cpu: "2"
    nvidia.com/gpu: "1"
  limits:
    memory: "8Gi"
    cpu: "4"
    nvidia.com/gpu: "1"
```

**Coordination Monitor (Kubernetes):**
```yaml
resources:
  requests:
    memory: "2Gi"
    cpu: "1"
  limits:
    memory: "4Gi"
    cpu: "2"
```

---

## Health Checks

### Endpoints

- **Liveness**: `GET /health` - Service is alive
- **Readiness**: `GET /health` - Service is ready for traffic
- **Metrics**: `GET /metrics` - Prometheus metrics

### Health Check Response

```json
{
  "status": "healthy",
  "message": "All systems operational",
  "checks": {
    "model": true,
    "inference": true
  },
  "timestamp": "2025-10-26T21:30:00Z"
}
```

---

## Troubleshooting

### Common Issues

#### 1. Model Not Loading

**Symptoms**: Service starts but requests fail

**Solutions**:
```bash
# Check logs
kubectl logs deployment/hamiltonian-monitor

# Verify GPU availability
kubectl describe nodes | grep nvidia.com/gpu

# Try CPU fallback
kubectl set env deployment/hamiltonian-monitor DEVICE=cpu
```

#### 2. Out of Memory

**Symptoms**: Pods getting OOMKilled

**Solutions**:
```bash
# Increase memory limit
kubectl patch deployment hamiltonian-monitor -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"hamiltonian","resources":{"limits":{"memory":"16Gi"}}}]}}}}'

# Use 8-bit quantization
# (already enabled by default in Dockerfile)
```

#### 3. High API Costs

**Symptoms**: Cost alerts firing

**Solutions**:
```bash
# Reduce cost limit
kubectl set env deployment/coordination-monitor MAX_COST_PER_HOUR=5.0

# Check current cost
kubectl exec deployment/coordination-monitor -- curl localhost:8000/cost
```

#### 4. Circuit Breaker Open

**Symptoms**: Requests failing fast

**Solutions**:
```bash
# Check circuit breaker status
kubectl exec deployment/coordination-monitor -- \
  curl localhost:8000/circuit-breaker/status

# Reset circuit breaker
kubectl exec deployment/coordination-monitor -- \
  curl -X POST localhost:8000/circuit-breaker/reset
```

---

## Backup and Recovery

### Backup Baseline Cache

```bash
# Backup from pod
kubectl cp coordination-monitor-xxx:/.cert_baseline_cache.json \
  ./baseline_cache_backup.json

# Restore to pod
kubectl cp ./baseline_cache_backup.json \
  coordination-monitor-xxx:/.cert_baseline_cache.json
```

### Backup Model Cache

```bash
# Model cache is stored in PersistentVolume
# Backup using volume snapshot
kubectl get pvc model-cache-pvc
# Create snapshot using cloud provider tools
```

---

## Security

### API Authentication

**Add authentication middleware** (recommended for production):

```python
# In server code
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/api/v1/trajectory/analyze")
async def analyze(request: AnalyzeRequest, token: str = Security(security)):
    if not verify_token(token):
        raise HTTPException(status_code=401)
    # Process request...
```

### Network Policies

```bash
# Apply network policies
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cert-network-policy
spec:
  podSelector:
    matchLabels:
      app: hamiltonian-monitor
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: coordination-monitor
    ports:
    - protocol: TCP
      port: 8000
EOF
```

---

## Performance Tuning

### Optimize Throughput

```bash
# Increase replicas
kubectl scale deployment hamiltonian-monitor --replicas=10

# Increase cache size (in deployment)
kubectl set env deployment/hamiltonian-monitor CACHE_SIZE=5000
```

### Reduce Latency

```bash
# Enable model preloading
kubectl set env deployment/hamiltonian-monitor PRELOAD_MODELS=true

# Use faster model
kubectl set env deployment/hamiltonian-monitor MODEL_NAME=gpt2
```

### Reduce Costs

```bash
# Increase baseline cache TTL
kubectl set env deployment/coordination-monitor BASELINE_CACHE_TTL=86400

# Use cheaper model
kubectl set env deployment/coordination-monitor MODEL_NAME=claude-3-haiku-20240307
```

---

## Maintenance

### Rolling Updates

```bash
# Update image
kubectl set image deployment/hamiltonian-monitor \
  hamiltonian=cert-framework/hamiltonian:4.0.1

# Check rollout status
kubectl rollout status deployment/hamiltonian-monitor

# Rollback if needed
kubectl rollout undo deployment/hamiltonian-monitor
```

### Database Cleanup

```bash
# Clear baseline cache
kubectl exec deployment/coordination-monitor -- \
  curl -X POST localhost:8000/cache/clear

# Clear trajectory cache
kubectl exec deployment/hamiltonian-monitor -- \
  curl -X POST localhost:8000/cache/clear
```

---

## Support

For issues and questions:
- **GitHub Issues**: https://github.com/Javihaus/cert-framework/issues
- **Documentation**: See `PRODUCTION_README.md`
- **Email**: support@cert-framework.com

---

**Version**: 4.0.0
**Last Updated**: 2025-10-26
