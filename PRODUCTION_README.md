# CERT Framework v4.0 - Production Monitoring Infrastructure

**Enterprise-grade monitoring platform for EU AI Act compliance**

Transform your CERT Framework deployment from library-style code to production infrastructure that organizations can bet their compliance on.

---

## What's New in v4.0

### 🏗️ Production Infrastructure (Phase 1 ✅)

**Resource Management**
- Context managers for explicit lifecycle control
- Thread-safe model loading/unloading
- GPU memory tracking and optimization
- Automatic cleanup on errors

**Error Handling**
- Structured exception hierarchy
- Retry decorators with exponential backoff
- Circuit breakers for external services
- Graceful degradation (GPU → CPU fallback)

**Observability**
- Structured JSON logging with correlation IDs
- Prometheus metrics export
- Request tracing
- Health check framework

### 🎯 Hamiltonian Monitor (Phase 2 ✅)

**Production API**
- Synchronous and asynchronous interfaces
- Batch processing support
- LRU caching (1000 entries)
- Comprehensive error handling
- Health checks

**Key Features**
- Model preloading (30s startup → <1s requests)
- GPU OOM detection with CPU fallback
- Input validation (prevent DoS)
- Timeout handling
- Per-token perplexity/entropy tracking

---

## Quick Start

### Installation

bash
# Install with production features
pip install -r requirements.txt

# Or for all features
pip install cert-framework[all]


### Basic Usage

#### Option 1: Simple API (Recommended)

python
from cert.trajectory import HamiltonianMonitor

# Initialize monitor (preloads model for fast requests)
monitor = HamiltonianMonitor(
    model_name="Qwen/Qwen2.5-7B-Instruct",
    preload=True,
    use_8bit=True,
)

# Analyze text generation
result = monitor.analyze("Explain quantum computing")

if result.passed_quality_check:
    print("✅ Quality check PASSED")
    print(f"Average perplexity: {result.avg_perplexity:.2f}")
    print(f"Average entropy: {result.avg_entropy:.2f}")
else:
    print("❌ Quality check FAILED")
    print(f"Generated text: {result.generated_text}")


#### Option 2: Context Manager (Auto-cleanup)

python
from cert.trajectory import HamiltonianMonitor

with HamiltonianMonitor(model_name="Qwen/Qwen2.5-7B") as monitor:
    result = monitor.analyze("Explain AI")
    print(f"Quality: {result.passed_quality_check}")
# Model automatically unloaded


#### Option 3: Async API (High Throughput)

python
import asyncio
from cert.trajectory import HamiltonianMonitor

async def analyze_many():
    monitor = HamiltonianMonitor(preload=True)

    prompts = [
        "Explain AI",
        "What is machine learning?",
        "Define neural networks"
    ]

    # Concurrent analysis
    tasks = [monitor.analyze_async(prompt) for prompt in prompts]
    results = await asyncio.gather(*tasks)

    for result in results:
        print(f"Quality: {result.passed_quality_check}")

asyncio.run(analyze_many())


#### Option 4: Batch Processing

python
from cert.trajectory import HamiltonianMonitor

monitor = HamiltonianMonitor(preload=True)

prompts = ["Explain AI", "What is ML?", "Define NLP"]
results = monitor.analyze_batch(prompts, timeout=60.0)

for i, result in enumerate(results):
    print(f"Prompt {i+1}: {'PASSED' if result.passed_quality_check else 'FAILED'}")


---

## Configuration

### Environment Variables

bash
# Logging
export LOG_LEVEL=INFO
export LOG_FORMAT=json  # or "human"
export LOG_OUTPUT=both  # "stdout", "file", or "both"
export LOG_FILE=/var/log/cert.log

# Metrics
export METRICS_ENABLED=true
export METRICS_PORT=9090

# Resources
export PRELOAD_MODELS=true
export DEVICE=auto  # "auto", "cuda", or "cpu"
export MAX_MEMORY_GB=8


### Programmatic Configuration

python
from cert.core.config import CERTConfig
from cert.observability import configure_logging

# Load from environment
config = CERTConfig.from_env()
config.apply()

# Or configure manually
configure_logging(
    level="INFO",
    format="json",
    output="both",
    log_file="/var/log/cert.log"
)


---

## Monitoring & Observability

### Prometheus Metrics

The framework exposes metrics on `http://localhost:9090/metrics`:

python
from cert.observability import MetricsCollector, start_metrics_server

# Initialize metrics
metrics = MetricsCollector(namespace="cert")

# Start metrics server (runs in background thread)
start_metrics_server(host="0.0.0.0", port=9090)


**Key Metrics:**
- `cert_requests_total{service, status}` - Request counter
- `cert_request_duration_seconds{service, operation}` - Latency histogram
- `cert_hamiltonian_perplexity` - Perplexity distribution
- `cert_hamiltonian_quality_checks_total{result}` - Pass/fail counts
- `cert_cache_hits_total{cache_type}` - Cache performance

### Structured Logging

python
from cert.observability import correlation_id_context
import logging

logger = logging.getLogger("cert")

# Use correlation IDs for request tracing
with correlation_id_context("req-123"):
    logger.info(
        "Processing request",
        extra={
            "prompt_length": 100,
            "model": "Qwen/Qwen2.5-7B"
        }
    )


**JSON Output:**
json
{
  "timestamp": "2025-10-26T10:30:45.123Z",
  "level": "INFO",
  "logger": "cert.trajectory.api",
  "message": "Processing request",
  "correlation_id": "req-123",
  "prompt_length": 100,
  "model": "Qwen/Qwen2.5-7B"
}


### Health Checks

python
from cert.trajectory import HamiltonianMonitor

monitor = HamiltonianMonitor(preload=True)

# Check health
health = monitor.health_check()

print(f"Status: {health.status.value}")
print(f"Model loaded: {health.checks['model']}")
print(f"Inference working: {health.checks['inference']}")

# Status can be: "healthy", "degraded", "unhealthy"


---

## Error Handling

### Structured Errors

python
from cert.trajectory import HamiltonianMonitor
from cert.core.errors import AnalysisError

monitor = HamiltonianMonitor(preload=True)

result = monitor.analyze("Very long prompt..." * 1000)

if isinstance(result, AnalysisError):
    print(f"Error type: {result.error_type}")
    print(f"Message: {result.message}")
    print(f"Recoverable: {result.recoverable}")

    if result.recoverable and result.retry_after:
        print(f"Retry after {result.retry_after}s")


**Error Types:**
- `InvalidInput` - Bad input (non-recoverable)
- `PromptTooLong` - Prompt exceeds max length (non-recoverable)
- `ModelNotLoaded` - Model not ready (recoverable, retry after 5s)
- `GenerationTimeout` - Generation timeout (recoverable)
- `GPUOutOfMemoryError` - GPU OOM (automatic CPU fallback)
- `CPUFallbackFailed` - Both GPU and CPU failed (non-recoverable)

### Retry Logic

python
from cert.core.retry import retry
from cert.core.errors import EmbeddingTimeoutError

@retry(max_retries=3, backoff_base=2.0, exceptions=(EmbeddingTimeoutError,))
def compute_with_retry(prompt):
    return monitor.analyze(prompt, timeout=10.0)

# Will retry up to 3 times with exponential backoff


### Circuit Breakers

python
from cert.core.circuit_breaker import CircuitBreaker

# Protect external API calls
breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)

def call_external_api():
    return breaker.call(external_service.fetch_data)

# Fails fast when circuit is open


---

## Performance Tuning

### Memory Optimization

python
# Use 8-bit quantization for large models (reduces memory by ~50%)
monitor = HamiltonianMonitor(
    model_name="Qwen/Qwen2.5-7B",
    use_8bit=True,  # Recommended for 7B+ models
    device="cuda"
)


### Caching

python
# Increase cache size for better hit rate
from cert.trajectory import HamiltonianEngine, HamiltonianModelResource

resource = HamiltonianModelResource("Qwen/Qwen2.5-7B", preload=True)
engine = HamiltonianEngine(
    model_resource=resource,
    cache_size=5000  # Default: 1000
)

# Clear cache if needed
engine.clear_cache()


### Preloading

python
# Preload model on startup (30s delay, but fast requests)
monitor = HamiltonianMonitor(
    model_name="Qwen/Qwen2.5-7B",
    preload=True  # Recommended for production
)

# Without preload: first request takes ~30s (lazy loading)
# With preload: all requests take <1s


---

## Production Deployment

### Docker (Coming in Phase 4)

bash
# Build image
docker build -t cert-hamiltonian:4.0.0 -f deployments/docker/Dockerfile.hamiltonian .

# Run container
docker run -p 8000:8000 -p 9090:9090 \
  --gpus all \
  -e PRELOAD_MODELS=true \
  cert-hamiltonian:4.0.0


### Kubernetes (Coming in Phase 4)

bash
# Deploy to Kubernetes
kubectl apply -f deployments/kubernetes/hamiltonian/

# Scale replicas
kubectl scale deployment hamiltonian-monitor --replicas=5


---

## Migration from v3.x

### Old API (v3.x)

python
from cert.trajectory import ReasoningTrajectoryMonitor, load_model_for_monitoring

model, tokenizer = load_model_for_monitoring("Qwen/Qwen2.5-7B")
monitor = ReasoningTrajectoryMonitor(model, tokenizer)
result = monitor.monitor_generation("Explain AI")


### New API (v4.0)

python
from cert.trajectory import HamiltonianMonitor

with HamiltonianMonitor(model_name="Qwen/Qwen2.5-7B") as monitor:
    result = monitor.analyze("Explain AI")


**Benefits:**
- ✅ Automatic resource cleanup
- ✅ Structured error handling
- ✅ Caching built-in
- ✅ Metrics and logging
- ✅ Health checks
- ✅ Async support

---

## Architecture

### Component Overview

text
cert-framework/
├── cert/core/              # Core infrastructure (Phase 1 ✅)
│   ├── resources.py        # Resource lifecycle management
│   ├── errors.py           # Exception hierarchy
│   ├── retry.py            # Retry decorators
│   ├── circuit_breaker.py  # Circuit breaker pattern
│   ├── health.py           # Health checks
│   └── config.py           # Configuration
│
├── cert/observability/     # Observability (Phase 1 ✅)
│   ├── logging.py          # Structured logging
│   └── metrics.py          # Prometheus metrics
│
├── cert/trajectory/        # Hamiltonian Monitor (Phase 2 ✅)
│   ├── api.py              # Production API
│   ├── engine.py           # Analysis engine
│   ├── resources.py        # Model resources
│   └── types.py            # Data structures
│
├── cert/coordination/      # Coordination Monitor (Phase 3 🔄)
│   ├── client.py           # Anthropic API client
│   ├── orchestrator.py     # Multi-agent coordination
│   ├── evaluator.py        # Quality evaluation
│   └── baseline.py         # Baseline measurement
│
└── deployments/            # Deployment (Phase 4 ⏳)
    ├── docker/             # Docker images
    ├── kubernetes/         # K8s manifests
    └── prometheus/         # Monitoring config


---

## Troubleshooting

### Model Not Loading

bash
# Check GPU availability
python3 -c "import torch; print(torch.cuda.is_available())"

# Try CPU fallback
monitor = HamiltonianMonitor(model_name="gpt2", device="cpu")


### Out of Memory

python
# Use 8-bit quantization
monitor = HamiltonianMonitor(
    model_name="Qwen/Qwen2.5-7B",
    use_8bit=True  # Reduces memory by ~50%
)

# Or use smaller model
monitor = HamiltonianMonitor(model_name="gpt2")  # 124M params


### High Latency

bash
# Enable preloading
export PRELOAD_MODELS=true

# Increase cache size
# Set in code: cache_size=5000


### Check Health

python
from cert.trajectory import HamiltonianMonitor

monitor = HamiltonianMonitor(preload=True)

health = monitor.health_check()
print(f"Status: {health.status.value}")
print(f"Checks: {health.checks}")


---

## Roadmap

### ✅ Phase 1: Core Infrastructure (Complete)
- Resource management
- Error handling
- Observability

### ✅ Phase 2: Hamiltonian Monitor (Complete)
- Production API
- Caching
- Error handling

### 🔄 Phase 3: Coordination Monitor (In Progress)
- Anthropic API client
- Multi-agent orchestration
- Quality evaluation

### ⏳ Phase 4: Deployment (Pending)
- Docker/Kubernetes
- Operations guides
- Grafana dashboards

---

## Support

- **Documentation**: See `PRODUCTION_TRANSFORMATION_PLAN.md`
- **Implementation Status**: See `IMPLEMENTATION_STATUS.md`
- **Issues**: https://github.com/Javihaus/cert-framework/issues
- **Contact**: Javier Marín

---

## License

MIT License - See LICENSE file for details

---

**Version**: 4.0.0-alpha
**Status**: Phase 1-2 Complete (60%)
**Updated**: 2025-10-26
