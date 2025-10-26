# CERT Framework: Production Transformation Plan

## Executive Summary

Transform CERT Framework from a well-designed library (3.2/5 production-readiness) into enterprise-grade monitoring infrastructure (5/5) that organizations can bet their compliance on.

**Timeline**: 4 weeks (4 phases)
**Current Version**: 3.1.0
**Target Version**: 4.0.0 (production-grade release)

---

## Current State Assessment

### Strengths ✅
- Clean public API with semantic versioning
- Comprehensive documentation (15+ docs)
- Type hints throughout (~95% coverage)
- Modular architecture (measure, monitor, trajectory)
- JSONL audit trail (immutable, compliance-ready)
- Basic CI/CD pipeline
- Industry presets for EU AI Act compliance

### Critical Gaps ❌
- **Resource Management**: Manual singleton patterns, no context managers, no lifecycle management
- **Error Handling**: Basic try/except, no retries, no circuit breakers, no graceful degradation
- **Observability**: Python logging only, no structured logs, no metrics export, no tracing
- **Resilience**: No rate limiting, no circuit breakers, no backoff strategies
- **Deployment**: No Docker, no Kubernetes, no health checks
- **Testing**: Limited coverage, no load tests, no fault injection
- **Coordination**: Empty placeholder (needs full implementation)

---

## Transformation Architecture

```
cert-framework/
├── packages/python/cert/
│   ├── core/                          # NEW: Core infrastructure
│   │   ├── resources.py               # Resource lifecycle management
│   │   ├── errors.py                  # Exception hierarchy
│   │   ├── retry.py                   # Retry decorators & backoff
│   │   ├── circuit_breaker.py         # Circuit breaker pattern
│   │   ├── health.py                  # Health check framework
│   │   └── config.py                  # Configuration management
│   │
│   ├── observability/                 # NEW: Observability layer
│   │   ├── logging.py                 # Structured logging
│   │   ├── metrics.py                 # Prometheus metrics
│   │   ├── tracing.py                 # OpenTelemetry tracing
│   │   └── profiling.py               # Performance profiling
│   │
│   ├── measure/                       # EXISTING: Enhance
│   │   ├── engine.py                  # NEW: EmbeddingService with lifecycle
│   │   └── ... (existing files)
│   │
│   ├── trajectory/                    # EXISTING: Transform to production
│   │   ├── resources.py               # NEW: Model lifecycle management
│   │   ├── engine.py                  # NEW: HamiltonianEngine (extracted algorithms)
│   │   ├── api.py                     # NEW: Production API (sync/async)
│   │   ├── cache.py                   # NEW: Embedding cache with LRU
│   │   └── ... (existing files)
│   │
│   ├── coordination/                  # EXISTING PLACEHOLDER: Full implementation
│   │   ├── client.py                  # AnthropicClientWithResilience
│   │   ├── orchestrator.py            # Multi-agent coordination
│   │   ├── evaluator.py               # Quality evaluation
│   │   ├── baseline.py                # Baseline measurement with caching
│   │   ├── resources.py               # API client pool management
│   │   └── types.py                   # CoordinationMetrics, etc.
│   │
│   └── ... (other existing modules)
│
├── deployments/                       # NEW: Deployment artifacts
│   ├── docker/
│   │   ├── Dockerfile.hamiltonian     # Hamiltonian monitor image
│   │   ├── Dockerfile.coordination    # Coordination monitor image
│   │   └── docker-compose.yml         # Local development
│   ├── kubernetes/
│   │   ├── hamiltonian/               # K8s manifests
│   │   ├── coordination/              # K8s manifests
│   │   └── helm/                      # Helm charts
│   └── prometheus/
│       └── alerts.yml                 # Alert definitions
│
├── tests/                             # EXISTING: Expand significantly
│   ├── unit/                          # NEW: Organized unit tests
│   ├── integration/                   # NEW: Integration tests
│   ├── load/                          # NEW: Load tests (locust)
│   ├── fault_injection/               # NEW: Chaos engineering
│   └── ... (existing test files)
│
└── docs/
    ├── operations/                    # NEW: Operations guides
    │   ├── DEPLOYMENT.md
    │   ├── MONITORING.md
    │   ├── TROUBLESHOOTING.md
    │   └── RUNBOOKS.md
    └── api/                           # NEW: API documentation
        ├── openapi.yaml               # OpenAPI 3.0 spec
        └── examples/                  # Integration examples
```

---

# Phase 1: Core Infrastructure (Week 1)

## 1.1 Resource Management Layer

**Goal**: Explicit lifecycle management for expensive resources (models, API clients)

### Files to Create

#### `cert/core/resources.py` (~300 LOC)
```python
"""
Resource lifecycle management with context managers.

Provides:
- ResourceManager ABC
- ModelResource (GPU/CPU models)
- APIClientResource (HTTP clients with pooling)
- Thread-safe loading/unloading
- Memory monitoring
"""

class ResourceManager(ABC):
    """Base class for managed resources."""

    @abstractmethod
    def load(self) -> None:
        """Load resource with error handling."""

    @abstractmethod
    def unload(self) -> None:
        """Explicit cleanup."""

    @abstractmethod
    def health_check(self) -> HealthStatus:
        """Check resource health."""

    def __enter__(self):
        self.load()
        return self

    def __exit__(self, *args):
        self.unload()

class ModelResource(ResourceManager):
    """Manage ML model lifecycle with GPU memory tracking."""

    def __init__(self, model_name: str, device: str = "auto"):
        self._model = None
        self._model_name = model_name
        self._device = self._select_device(device)
        self._lock = threading.Lock()
        self._load_time: Optional[float] = None
        self._memory_usage: Optional[int] = None

    def load(self):
        """Load model with explicit error handling and memory tracking."""
        with self._lock:
            if self._model is not None:
                return

            start = time.time()
            try:
                self._model = self._load_model()
                self._load_time = time.time() - start
                self._memory_usage = self._measure_memory()

                logger.info(
                    "Model loaded successfully",
                    extra={
                        "model": self._model_name,
                        "device": self._device,
                        "load_time_s": self._load_time,
                        "memory_mb": self._memory_usage / 1024 / 1024,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to load model {self._model_name}: {e}")
                raise ResourceLoadError(f"Model load failed: {e}") from e

    def unload(self):
        """Explicit cleanup with GPU cache clearing."""
        with self._lock:
            if self._model is not None:
                del self._model
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                self._model = None
                logger.info(f"Unloaded model {self._model_name}")
```

**Key Features**:
- Context manager protocol (`__enter__`/`__exit__`)
- Thread-safe loading with locks
- Memory tracking (GPU/CPU)
- Health checks
- Structured logging for all operations

#### `cert/measure/engine.py` (~200 LOC)
Transform existing `EmbeddingEngine` into `EmbeddingService` with proper lifecycle:

```python
class EmbeddingService(ResourceManager):
    """Production-grade embedding service with lifecycle management."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str = "auto",
        cache_size: int = 1000,
    ):
        self._model_resource = ModelResource(model_name, device)
        self._cache = LRUCache(maxsize=cache_size)
        self._metrics = EmbeddingMetrics()  # Prometheus metrics

    def embed(self, texts: List[str], timeout: float = 30.0) -> np.ndarray:
        """Embed texts with caching, retries, and timeout."""
        # Check cache first
        cache_key = self._compute_cache_key(texts)
        if cached := self._cache.get(cache_key):
            self._metrics.cache_hits.inc()
            return cached

        self._metrics.cache_misses.inc()

        # Compute with timeout
        with timeout_context(timeout):
            with self._metrics.embedding_duration.time():
                embeddings = self._model_resource.model.encode(texts)

        # Cache result
        self._cache[cache_key] = embeddings
        return embeddings
```

**Changes from Current Code**:
- Explicit lifecycle management (replaces singleton pattern)
- Cache as instance variable (not global)
- Timeout handling
- Metrics integration
- Structured logging

#### `cert/trajectory/resources.py` (~250 LOC)
```python
class HamiltonianModelResource(ModelResource):
    """Specialized model resource for trajectory monitoring."""

    def __init__(
        self,
        model_name: str,
        use_8bit: bool = True,
        device: str = "auto",
        preload: bool = False,  # NEW: preload on service startup
    ):
        super().__init__(model_name, device)
        self._use_8bit = use_8bit
        self._tokenizer = None

        if preload:
            self.load()  # Load immediately (30s startup, fast requests)

    def load(self):
        """Load model with 8-bit quantization for memory efficiency."""
        with self._lock:
            if self._model is not None:
                return

            start = time.time()
            try:
                # Load with 8-bit quantization if supported
                if self._use_8bit and torch.cuda.is_available():
                    self._model = AutoModelForCausalLM.from_pretrained(
                        self._model_name,
                        device_map="auto",
                        load_in_8bit=True,
                    )
                else:
                    self._model = AutoModelForCausalLM.from_pretrained(
                        self._model_name
                    ).to(self._device)

                self._tokenizer = AutoTokenizer.from_pretrained(self._model_name)

                self._load_time = time.time() - start
                self._memory_usage = self._measure_gpu_memory()

                logger.info(
                    "Trajectory model loaded",
                    extra={
                        "model": self._model_name,
                        "8bit": self._use_8bit,
                        "load_time_s": self._load_time,
                        "gpu_memory_mb": self._memory_usage / 1024 / 1024,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to load trajectory model: {e}")
                raise ResourceLoadError(f"Trajectory model load failed: {e}") from e
```

**Key Production Features**:
- **Preload option**: Load on startup (30s delay) for fast request handling
- **Memory bounds**: 8-bit quantization for 7B+ models
- **GPU memory tracking**: Monitor usage to prevent OOM
- **CPU fallback**: Graceful degradation when GPU unavailable

---

## 1.2 Error Handling Framework

**Goal**: Comprehensive error handling with retries, circuit breakers, and structured errors

### Files to Create

#### `cert/core/errors.py` (~200 LOC)
```python
"""
Exception hierarchy for structured error handling.

Provides:
- CERTError base class
- Error categorization (retriable, non-retriable)
- Error codes for client handling
- Structured error responses
"""

class CERTError(Exception):
    """Base exception for all CERT Framework errors."""

    def __init__(
        self,
        message: str,
        error_type: str,
        recoverable: bool,
        retry_after: Optional[float] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.error_type = error_type
        self.recoverable = recoverable
        self.retry_after = retry_after
        self.context = context or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to structured error response."""
        return {
            "error": self.error_type,
            "message": str(self),
            "recoverable": self.recoverable,
            "retry_after": self.retry_after,
            "context": self.context,
        }

# Specific error types
class ResourceError(CERTError):
    """Resource loading/management errors."""
    pass

class ResourceLoadError(ResourceError):
    """Failed to load resource (model, API client)."""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message,
            error_type="ResourceLoadError",
            recoverable=True,  # May succeed on retry
            **kwargs
        )

class GPUOutOfMemoryError(ResourceError):
    """GPU memory exhausted."""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message,
            error_type="GPUOutOfMemoryError",
            recoverable=True,  # Fallback to CPU
            **kwargs
        )

class EmbeddingTimeoutError(CERTError):
    """Embedding computation timed out."""
    def __init__(self, timeout: float, **kwargs):
        super().__init__(
            f"Embedding timed out after {timeout}s",
            error_type="EmbeddingTimeoutError",
            recoverable=True,
            retry_after=2.0,  # Suggest 2s backoff
            **kwargs
        )

class CircuitBreakerOpen(CERTError):
    """Circuit breaker is open (service degraded)."""
    def __init__(self, service: str, **kwargs):
        super().__init__(
            f"Circuit breaker open for {service}",
            error_type="CircuitBreakerOpen",
            recoverable=True,
            retry_after=30.0,  # Suggest 30s backoff
            **kwargs
        )

class InvalidInputError(CERTError):
    """Invalid input provided."""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message,
            error_type="InvalidInputError",
            recoverable=False,  # Cannot be fixed by retry
            **kwargs
        )
```

**Error Categories**:
- **Retriable**: Temporary failures (network, rate limits, GPU OOM)
- **Non-retriable**: Invalid input, configuration errors
- **Recoverable**: Can fallback to alternative (GPU → CPU)

#### `cert/core/retry.py` (~150 LOC)
```python
"""
Retry decorators with exponential backoff.

Provides:
- @retry decorator with configurable backoff
- Exponential backoff with jitter
- Max retries configuration
- Retry on specific exception types
"""

def retry(
    max_retries: int = 3,
    backoff_base: float = 2.0,
    max_backoff: float = 60.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable] = None,
):
    """
    Retry decorator with exponential backoff.

    Args:
        max_retries: Maximum retry attempts
        backoff_base: Base for exponential backoff (2^attempt)
        max_backoff: Maximum backoff time
        exceptions: Tuple of exception types to retry on
        on_retry: Callback called on each retry (for logging)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_retries:
                        raise

                    # Calculate backoff with jitter
                    backoff = min(
                        backoff_base ** attempt + random.uniform(0, 1),
                        max_backoff
                    )

                    if on_retry:
                        on_retry(attempt, backoff, e)

                    logger.warning(
                        f"Retry {attempt + 1}/{max_retries} after {backoff:.2f}s",
                        extra={
                            "function": func.__name__,
                            "attempt": attempt + 1,
                            "backoff_s": backoff,
                            "error": str(e),
                        }
                    )

                    time.sleep(backoff)

            raise MaxRetriesExceeded(f"Failed after {max_retries} retries")
        return wrapper
    return decorator

# Usage example:
@retry(
    max_retries=3,
    exceptions=(EmbeddingTimeoutError, ResourceError),
)
def compute_embeddings(texts: List[str]) -> np.ndarray:
    # Will retry up to 3 times with exponential backoff
    return embedding_service.embed(texts)
```

#### `cert/core/circuit_breaker.py` (~200 LOC)
```python
"""
Circuit breaker pattern for external service calls.

Prevents cascading failures when services are degraded.

States:
- CLOSED: Normal operation, all requests pass through
- OPEN: Service degraded, requests fail fast
- HALF_OPEN: Testing if service recovered

Transitions:
- CLOSED → OPEN: After failure_threshold consecutive failures
- OPEN → HALF_OPEN: After recovery_timeout
- HALF_OPEN → CLOSED: After success_threshold consecutive successes
- HALF_OPEN → OPEN: On any failure
"""

class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    """Circuit breaker for external service resilience."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        success_threshold: int = 2,
    ):
        self._state = CircuitBreakerState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._success_threshold = success_threshold
        self._lock = threading.Lock()

    def is_open(self) -> bool:
        """Check if circuit breaker is open (blocking requests)."""
        with self._lock:
            if self._state == CircuitBreakerState.OPEN:
                # Check if recovery timeout elapsed
                if time.time() - self._last_failure_time > self._recovery_timeout:
                    self._state = CircuitBreakerState.HALF_OPEN
                    self._success_count = 0
                    logger.info("Circuit breaker entering HALF_OPEN state")
                    return False
                return True
            return False

    def record_success(self):
        """Record successful request."""
        with self._lock:
            if self._state == CircuitBreakerState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self._success_threshold:
                    self._state = CircuitBreakerState.CLOSED
                    self._failure_count = 0
                    logger.info("Circuit breaker CLOSED (recovered)")
            elif self._state == CircuitBreakerState.CLOSED:
                self._failure_count = 0  # Reset on success

    def record_failure(self):
        """Record failed request."""
        with self._lock:
            if self._state == CircuitBreakerState.HALF_OPEN:
                # Any failure in HALF_OPEN → back to OPEN
                self._state = CircuitBreakerState.OPEN
                self._last_failure_time = time.time()
                logger.warning("Circuit breaker reopened (HALF_OPEN failure)")
            elif self._state == CircuitBreakerState.CLOSED:
                self._failure_count += 1
                if self._failure_count >= self._failure_threshold:
                    self._state = CircuitBreakerState.OPEN
                    self._last_failure_time = time.time()
                    logger.error("Circuit breaker OPEN (threshold exceeded)")

    def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        if self.is_open():
            raise CircuitBreakerOpen("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise
```

**Usage in Coordination Monitor**:
```python
# For Claude API calls
circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=30.0)

@retry(max_retries=3)
def call_claude_api(prompt: str):
    return circuit_breaker.call(anthropic_client.complete, prompt)
```

#### `cert/core/health.py` (~100 LOC)
```python
"""
Health check framework for services.

Provides:
- Health check protocol
- Readiness vs liveness checks
- Dependency health aggregation
"""

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class HealthCheckResult:
    status: HealthStatus
    message: str
    checks: Dict[str, bool]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "message": self.message,
            "checks": self.checks,
            "timestamp": self.timestamp.isoformat(),
        }

class HealthChecker:
    """Aggregate health checks from multiple components."""

    def __init__(self):
        self._checks: Dict[str, Callable[[], bool]] = {}

    def register(self, name: str, check: Callable[[], bool]):
        """Register a health check function."""
        self._checks[name] = check

    def check_health(self) -> HealthCheckResult:
        """Run all health checks."""
        results = {}
        for name, check in self._checks.items():
            try:
                results[name] = check()
            except Exception as e:
                logger.error(f"Health check {name} failed: {e}")
                results[name] = False

        # Determine overall status
        if all(results.values()):
            status = HealthStatus.HEALTHY
            message = "All systems operational"
        elif any(results.values()):
            status = HealthStatus.DEGRADED
            message = "Some systems degraded"
        else:
            status = HealthStatus.UNHEALTHY
            message = "Systems unhealthy"

        return HealthCheckResult(
            status=status,
            message=message,
            checks=results,
            timestamp=datetime.now(),
        )
```

---

## 1.3 Observability Layer

**Goal**: Production-grade logging, metrics, and tracing

### Files to Create

#### `cert/observability/logging.py` (~150 LOC)
```python
"""
Structured logging configuration.

Provides:
- JSON structured logging
- Correlation IDs for request tracing
- Log level configuration per module
- Integration with ELK/Datadog/CloudWatch
"""

def configure_logging(
    level: str = "INFO",
    format: str = "json",  # "json" or "human"
    output: str = "stdout",  # "stdout", "file", or "both"
    log_file: Optional[str] = None,
    correlation_id_header: str = "X-Correlation-ID",
):
    """Configure structured logging for CERT Framework."""

    if format == "json":
        formatter = JsonFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    # Configure root logger
    root_logger = logging.getLogger("cert")
    root_logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    root_logger.handlers.clear()

    # Add handlers
    if output in ("stdout", "both"):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    if output in ("file", "both") and log_file:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=100 * 1024 * 1024,  # 100MB
            backupCount=10,
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

class JsonFormatter(logging.Formatter):
    """JSON log formatter with structured fields."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # Add correlation ID if present
        if hasattr(record, "correlation_id"):
            log_data["correlation_id"] = record.correlation_id

        # Add exception info
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Context manager for correlation IDs
@contextmanager
def correlation_id_context(correlation_id: str):
    """Set correlation ID for all logs in this context."""
    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.correlation_id = correlation_id
        return record

    logging.setLogRecordFactory(record_factory)
    try:
        yield
    finally:
        logging.setLogRecordFactory(old_factory)
```

**Example Usage**:
```python
# Configure at application startup
configure_logging(level="INFO", format="json", output="both", log_file="cert.log")

# Use in requests
with correlation_id_context(request_id):
    logger.info(
        "Processing request",
        extra={
            "chain_id": chain_id,
            "steps": len(steps),
        }
    )
```

#### `cert/observability/metrics.py` (~250 LOC)
```python
"""
Prometheus metrics exporter.

Provides:
- Standard metrics (request rate, latency, errors)
- Custom metrics for Hamiltonian/Coordination
- Metrics HTTP endpoint
"""

from prometheus_client import (
    Counter, Histogram, Gauge, Summary,
    generate_latest, REGISTRY,
)

class MetricsCollector:
    """Centralized metrics collection for CERT Framework."""

    def __init__(self, namespace: str = "cert"):
        self.namespace = namespace

        # Request metrics
        self.requests_total = Counter(
            f"{namespace}_requests_total",
            "Total requests processed",
            ["service", "status"],
        )

        self.request_duration = Histogram(
            f"{namespace}_request_duration_seconds",
            "Request duration",
            ["service", "operation"],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
        )

        self.request_errors = Counter(
            f"{namespace}_request_errors_total",
            "Total request errors",
            ["service", "error_type"],
        )

        # Hamiltonian metrics
        self.hamiltonian_conservation_score = Histogram(
            f"{namespace}_hamiltonian_conservation_score",
            "Hamiltonian conservation score distribution",
            buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        )

        self.hamiltonian_quality_checks = Counter(
            f"{namespace}_hamiltonian_quality_checks_total",
            "Hamiltonian quality check results",
            ["result"],  # "passed" or "failed"
        )

        # Coordination metrics
        self.coordination_gamma = Histogram(
            f"{namespace}_coordination_gamma",
            "Coordination effect (gamma) distribution",
            buckets=[0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0],
        )

        self.coordination_api_calls = Counter(
            f"{namespace}_coordination_api_calls_total",
            "Claude API calls for coordination",
            ["agent", "status"],
        )

        self.coordination_cost = Counter(
            f"{namespace}_coordination_cost_usd",
            "API cost in USD",
            ["agent"],
        )

        # Resource metrics
        self.model_load_duration = Histogram(
            f"{namespace}_model_load_duration_seconds",
            "Model loading time",
            ["model_name"],
        )

        self.model_memory_usage = Gauge(
            f"{namespace}_model_memory_bytes",
            "Model memory usage",
            ["model_name", "device"],
        )

        # Cache metrics
        self.cache_hits = Counter(
            f"{namespace}_cache_hits_total",
            "Cache hits",
            ["cache_type"],
        )

        self.cache_misses = Counter(
            f"{namespace}_cache_misses_total",
            "Cache misses",
            ["cache_type"],
        )

# Metrics HTTP endpoint
def metrics_endpoint():
    """Return Prometheus metrics in text format."""
    return generate_latest(REGISTRY).decode("utf-8")

# Flask/FastAPI integration
def create_metrics_app():
    """Create Flask app for metrics endpoint."""
    from flask import Flask, Response

    app = Flask(__name__)

    @app.route("/metrics")
    def metrics():
        return Response(
            metrics_endpoint(),
            mimetype="text/plain",
        )

    @app.route("/health")
    def health():
        # Use HealthChecker from health.py
        result = health_checker.check_health()
        return result.to_dict(), 200 if result.status == HealthStatus.HEALTHY else 503

    return app
```

**Deployment**:
- Metrics exposed on `:9090/metrics`
- Scraped by Prometheus every 15s
- Dashboards in Grafana

#### `cert/observability/tracing.py` (~100 LOC)
```python
"""
OpenTelemetry tracing for distributed request tracking.

Provides:
- Request tracing with spans
- Integration with Jaeger/Zipkin
- Automatic context propagation
"""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

def configure_tracing(
    service_name: str = "cert-framework",
    jaeger_host: str = "localhost",
    jaeger_port: int = 6831,
):
    """Configure OpenTelemetry tracing."""

    # Set up tracer provider
    trace.set_tracer_provider(TracerProvider())

    # Configure Jaeger exporter
    jaeger_exporter = JaegerExporter(
        agent_host_name=jaeger_host,
        agent_port=jaeger_port,
    )

    # Add span processor
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )

    logger.info(f"Tracing configured for {service_name}")

# Usage decorator
def traced(operation_name: str):
    """Decorator to trace function execution."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)
            with tracer.start_as_current_span(operation_name) as span:
                span.set_attribute("function", func.__name__)
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    raise
        return wrapper
    return decorator
```

---

## Phase 1 Deliverables

### Code Artifacts
- ✅ `cert/core/resources.py` - Resource lifecycle management
- ✅ `cert/core/errors.py` - Exception hierarchy
- ✅ `cert/core/retry.py` - Retry decorators
- ✅ `cert/core/circuit_breaker.py` - Circuit breaker pattern
- ✅ `cert/core/health.py` - Health check framework
- ✅ `cert/observability/logging.py` - Structured logging
- ✅ `cert/observability/metrics.py` - Prometheus metrics
- ✅ `cert/observability/tracing.py` - OpenTelemetry tracing
- ✅ `cert/measure/engine.py` - Transform EmbeddingEngine → EmbeddingService
- ✅ `cert/trajectory/resources.py` - HamiltonianModelResource

### Tests
- Unit tests for all new modules (80%+ coverage)
- Integration tests for resource lifecycle
- Fault injection tests for error handling

### Documentation
- API reference for all new modules
- Migration guide (singleton → resource management)
- Configuration guide (logging, metrics, tracing)

---

# Phase 2: Hamiltonian Monitor (Week 2)

## 2.1 Core Analysis Engine

**Goal**: Extract algorithms from notebooks, add production hardening

### Current State
- **Location**: `cert/trajectory/monitor.py` (~200 LOC)
- **Class**: `ReasoningTrajectoryMonitor`
- **Status**: Functional but notebook-style

### Transform to Production

#### `cert/trajectory/engine.py` (~400 LOC)
```python
"""
Production-grade Hamiltonian analysis engine.

Extracted from notebooks with:
- Input validation
- Batch processing with memory bounds
- Timeout handling
- Comprehensive error handling
"""

class HamiltonianEngine:
    """Core Hamiltonian trajectory analysis engine."""

    def __init__(
        self,
        model_resource: HamiltonianModelResource,
        config: TrajectoryConfig,
        metrics: MetricsCollector,
    ):
        self._model_resource = model_resource
        self._config = config
        self._metrics = metrics
        self._cache = LRUCache(maxsize=config.cache_size)

    @traced("hamiltonian_analyze")
    def analyze(
        self,
        chain: ReasoningChain,
        timeout: float = 30.0,
    ) -> Union[HamiltonianMetrics, AnalysisError]:
        """
        Analyze reasoning chain with comprehensive error handling.

        Args:
            chain: ReasoningChain with steps
            timeout: Maximum analysis time (seconds)

        Returns:
            HamiltonianMetrics on success, AnalysisError on failure
        """

        # Input validation
        if not isinstance(chain, ReasoningChain):
            return AnalysisError(
                error_type="InvalidInput",
                message="Expected ReasoningChain instance",
                recoverable=False,
            )

        if len(chain.steps) < 2:
            return AnalysisError(
                error_type="InsufficientSteps",
                message=f"Need >=2 steps, got {len(chain.steps)}",
                recoverable=False,
            )

        # Bound maximum chain length (prevent DoS)
        if len(chain.steps) > self._config.max_chain_length:
            logger.warning(f"Chain too long ({len(chain.steps)}), truncating")
            chain.steps = chain.steps[:self._config.max_chain_length]

        # Check cache
        cache_key = self._compute_cache_key(chain)
        if cached := self._cache.get(cache_key):
            self._metrics.cache_hits.inc()
            return cached

        self._metrics.cache_misses.inc()

        # Analyze with retry and timeout
        start = time.time()

        with timeout_context(timeout):
            with self._metrics.request_duration.labels(
                service="hamiltonian",
                operation="analyze"
            ).time():
                try:
                    # Step 1: Compute embeddings
                    embeddings = self._compute_embeddings(chain.steps)

                    # Step 2: Compute trajectory metrics
                    metrics = self._compute_trajectory_metrics(embeddings)

                    # Step 3: Validate metrics
                    if not metrics.is_valid():
                        logger.warning(f"Invalid metrics: {metrics}")
                        return AnalysisError(
                            error_type="InvalidMetrics",
                            message="Computed metrics failed validation",
                            recoverable=True,
                        )

                    # Step 4: Quality assessment
                    metrics.passed_quality_check = self._assess_quality(metrics)

                    # Record success
                    self._metrics.requests_total.labels(
                        service="hamiltonian",
                        status="success"
                    ).inc()

                    self._metrics.hamiltonian_quality_checks.labels(
                        result="passed" if metrics.passed_quality_check else "failed"
                    ).inc()

                    # Cache result
                    self._cache[cache_key] = metrics

                    logger.info(
                        "Hamiltonian analysis complete",
                        extra={
                            "chain_id": chain.metadata.get("id"),
                            "steps": len(chain.steps),
                            "quality": "passed" if metrics.passed_quality_check else "failed",
                            "duration_s": time.time() - start,
                        }
                    )

                    return metrics

                except GPUOutOfMemoryError as e:
                    logger.error("GPU OOM, falling back to CPU")
                    return self._analyze_with_cpu(chain, timeout)

                except EmbeddingTimeoutError as e:
                    self._metrics.request_errors.labels(
                        service="hamiltonian",
                        error_type="timeout"
                    ).inc()
                    return AnalysisError(
                        error_type="EmbeddingTimeout",
                        message=str(e),
                        recoverable=True,
                        retry_after=2.0,
                    )

                except Exception as e:
                    logger.exception("Unexpected error in Hamiltonian analysis")
                    self._metrics.request_errors.labels(
                        service="hamiltonian",
                        error_type=type(e).__name__
                    ).inc()
                    return AnalysisError(
                        error_type="UnexpectedError",
                        message=str(e),
                        recoverable=False,
                    )

    def _compute_embeddings(self, steps: List[ReasoningStep]) -> np.ndarray:
        """Compute embeddings with error handling."""
        texts = [step.text for step in steps]

        try:
            embeddings = self._model_resource.embed(texts)
            return embeddings
        except torch.cuda.OutOfMemoryError:
            raise GPUOutOfMemoryError("GPU memory exhausted during embedding")

    def _analyze_with_cpu(
        self,
        chain: ReasoningChain,
        timeout: float,
    ) -> Union[HamiltonianMetrics, AnalysisError]:
        """Fallback to CPU analysis."""
        logger.info("Falling back to CPU analysis")

        # Unload GPU model
        self._model_resource.unload()

        # Load CPU model
        cpu_resource = HamiltonianModelResource(
            model_name=self._model_resource.model_name,
            device="cpu",
        )
        cpu_resource.load()

        # Analyze on CPU
        try:
            # Use CPU model
            old_resource = self._model_resource
            self._model_resource = cpu_resource
            result = self.analyze(chain, timeout)
            return result
        finally:
            # Restore GPU model
            cpu_resource.unload()
            self._model_resource = old_resource
            self._model_resource.load()
```

**Key Production Features**:
- ✅ Input validation (type checks, step count bounds)
- ✅ Maximum chain length enforcement (prevent DoS)
- ✅ Embedding caching with LRU (memory vs compute tradeoff)
- ✅ Timeout handling
- ✅ GPU OOM detection with CPU fallback
- ✅ Comprehensive metrics (request rate, latency, errors)
- ✅ Structured logging with correlation IDs
- ✅ Request tracing

---

## 2.2 Production API

**Goal**: Expose Hamiltonian monitor as production API (sync + async)

### Files to Create

#### `cert/trajectory/api.py` (~300 LOC)
```python
"""
Production API for Hamiltonian trajectory monitoring.

Provides:
- Synchronous API (backward compatible)
- Asynchronous API (for high throughput)
- Configuration management
- Health checks
"""

class HamiltonianMonitor:
    """Production Hamiltonian trajectory monitor."""

    def __init__(
        self,
        model_name: str = "Qwen/Qwen2.5-7B",
        config: Optional[TrajectoryConfig] = None,
        preload: bool = True,  # Preload on startup
    ):
        self._config = config or TrajectoryConfig()
        self._metrics = MetricsCollector()

        # Initialize model resource
        self._model_resource = HamiltonianModelResource(
            model_name=model_name,
            device=self._config.device,
            use_8bit=self._config.use_8bit,
            preload=preload,  # Load on init (30s startup, fast requests)
        )

        # Initialize engine
        self._engine = HamiltonianEngine(
            model_resource=self._model_resource,
            config=self._config,
            metrics=self._metrics,
        )

        # Health checker
        self._health_checker = HealthChecker()
        self._health_checker.register("model", self._check_model_health)

        logger.info(
            "HamiltonianMonitor initialized",
            extra={
                "model": model_name,
                "preload": preload,
            }
        )

    def analyze(
        self,
        chain: ReasoningChain,
        timeout: float = 30.0,
    ) -> Union[HamiltonianMetrics, AnalysisError]:
        """
        Analyze reasoning chain (synchronous).

        Args:
            chain: ReasoningChain with steps
            timeout: Maximum analysis time (seconds)

        Returns:
            HamiltonianMetrics on success, AnalysisError on failure
        """
        correlation_id = str(uuid.uuid4())

        with correlation_id_context(correlation_id):
            logger.info(
                "Starting Hamiltonian analysis",
                extra={
                    "chain_id": chain.metadata.get("id"),
                    "steps": len(chain.steps),
                }
            )

            result = self._engine.analyze(chain, timeout)

            if isinstance(result, AnalysisError):
                logger.error(
                    "Hamiltonian analysis failed",
                    extra={
                        "error_type": result.error_type,
                        "message": result.message,
                    }
                )

            return result

    async def analyze_async(
        self,
        chain: ReasoningChain,
        timeout: float = 30.0,
    ) -> Union[HamiltonianMetrics, AnalysisError]:
        """
        Analyze reasoning chain (asynchronous).

        Useful for high-throughput scenarios where blocking is unacceptable.
        """
        # Run in thread pool (model inference blocks)
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.analyze,
            chain,
            timeout,
        )

    def analyze_batch(
        self,
        chains: List[ReasoningChain],
        timeout: float = 60.0,
    ) -> List[Union[HamiltonianMetrics, AnalysisError]]:
        """
        Analyze multiple chains in batch.

        More efficient than individual calls due to:
        - Batch embedding computation
        - Shared model loading overhead
        """
        results = []

        # Process in batches to bound memory
        batch_size = self._config.batch_size
        for i in range(0, len(chains), batch_size):
            batch = chains[i:i + batch_size]

            for chain in batch:
                result = self.analyze(chain, timeout / len(chains))
                results.append(result)

        return results

    def health_check(self) -> HealthCheckResult:
        """Check service health."""
        return self._health_checker.check_health()

    def _check_model_health(self) -> bool:
        """Check if model is loaded and functional."""
        try:
            # Simple inference test
            test_chain = ReasoningChain(
                question="Test",
                steps=[
                    ReasoningStep(text="Step 1"),
                    ReasoningStep(text="Step 2"),
                ],
            )
            result = self._engine.analyze(test_chain, timeout=5.0)
            return not isinstance(result, AnalysisError)
        except Exception:
            return False

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, *args):
        """Context manager exit with cleanup."""
        self._model_resource.unload()
```

**Usage Examples**:
```python
# Synchronous (backward compatible)
monitor = HamiltonianMonitor(model_name="Qwen/Qwen2.5-7B")
result = monitor.analyze(chain)

# Asynchronous (high throughput)
monitor = HamiltonianMonitor(model_name="Qwen/Qwen2.5-7B")
result = await monitor.analyze_async(chain)

# Batch processing
results = monitor.analyze_batch([chain1, chain2, chain3])

# Context manager (automatic cleanup)
with HamiltonianMonitor() as monitor:
    result = monitor.analyze(chain)
```

---

## 2.3 Testing Suite

**Goal**: Comprehensive testing (unit, integration, load, fault injection)

### Files to Create

#### `tests/unit/trajectory/test_engine.py` (~300 LOC)
```python
"""Unit tests for Hamiltonian engine (mocked models)."""

import pytest
from unittest.mock import Mock, patch
from cert.trajectory.engine import HamiltonianEngine
from cert.core.errors import AnalysisError, GPUOutOfMemoryError

class TestHamiltonianEngine:
    @pytest.fixture
    def mock_model_resource(self):
        """Mock model resource."""
        resource = Mock()
        resource.embed.return_value = np.random.rand(10, 384)
        return resource

    @pytest.fixture
    def engine(self, mock_model_resource):
        """Create engine with mocked model."""
        config = TrajectoryConfig()
        metrics = MetricsCollector()
        return HamiltonianEngine(mock_model_resource, config, metrics)

    def test_analyze_valid_chain(self, engine):
        """Test analysis of valid chain."""
        chain = ReasoningChain(
            question="Test question",
            steps=[
                ReasoningStep(text="Step 1"),
                ReasoningStep(text="Step 2"),
            ],
        )

        result = engine.analyze(chain)

        assert isinstance(result, HamiltonianMetrics)
        assert result.is_valid()

    def test_analyze_insufficient_steps(self, engine):
        """Test error on insufficient steps."""
        chain = ReasoningChain(
            question="Test",
            steps=[ReasoningStep(text="Only one")],
        )

        result = engine.analyze(chain)

        assert isinstance(result, AnalysisError)
        assert result.error_type == "InsufficientSteps"
        assert not result.recoverable

    def test_analyze_too_many_steps(self, engine):
        """Test truncation of excessive steps."""
        chain = ReasoningChain(
            question="Test",
            steps=[ReasoningStep(text=f"Step {i}") for i in range(1000)],
        )

        result = engine.analyze(chain)

        # Should truncate and still succeed
        assert isinstance(result, HamiltonianMetrics)

    @patch("torch.cuda.OutOfMemoryError")
    def test_gpu_oom_fallback(self, mock_oom, engine):
        """Test GPU OOM triggers CPU fallback."""
        engine._model_resource.embed.side_effect = torch.cuda.OutOfMemoryError()

        chain = ReasoningChain(
            question="Test",
            steps=[
                ReasoningStep(text="Step 1"),
                ReasoningStep(text="Step 2"),
            ],
        )

        result = engine.analyze(chain)

        # Should fallback to CPU and succeed
        assert isinstance(result, (HamiltonianMetrics, AnalysisError))
```

#### `tests/integration/trajectory/test_end_to_end.py` (~200 LOC)
```python
"""Integration tests with real models (small)."""

import pytest
from cert.trajectory.api import HamiltonianMonitor

class TestHamiltonianMonitorIntegration:
    @pytest.fixture(scope="module")
    def monitor(self):
        """Create monitor with small model."""
        # Use small model for CI (e.g., 124M params)
        return HamiltonianMonitor(
            model_name="gpt2",  # Small model for testing
            preload=True,
        )

    def test_analyze_simple_chain(self, monitor):
        """Test analysis with real model."""
        chain = ReasoningChain(
            question="What is 2+2?",
            steps=[
                ReasoningStep(text="I need to add 2 and 2"),
                ReasoningStep(text="2 + 2 = 4"),
            ],
        )

        result = monitor.analyze(chain, timeout=10.0)

        assert isinstance(result, HamiltonianMetrics)
        assert result.is_valid()
        assert result.avg_perplexity > 0
        assert result.avg_entropy > 0

    def test_analyze_batch(self, monitor):
        """Test batch analysis."""
        chains = [
            ReasoningChain(
                question=f"Question {i}",
                steps=[
                    ReasoningStep(text=f"Step 1 for Q{i}"),
                    ReasoningStep(text=f"Step 2 for Q{i}"),
                ],
            )
            for i in range(10)
        ]

        results = monitor.analyze_batch(chains, timeout=30.0)

        assert len(results) == 10
        assert all(isinstance(r, HamiltonianMetrics) for r in results)

    def test_health_check(self, monitor):
        """Test health check."""
        health = monitor.health_check()

        assert health.status == HealthStatus.HEALTHY
        assert health.checks["model"] is True
```

#### `tests/load/trajectory/test_sustained_load.py` (~150 LOC)
```python
"""Load tests for sustained throughput (locust)."""

from locust import HttpUser, task, between
import json

class HamiltonianMonitorUser(HttpUser):
    """Simulate user making requests to Hamiltonian monitor."""

    wait_time = between(1, 3)  # 1-3s between requests

    @task
    def analyze_chain(self):
        """Send analysis request."""
        chain_data = {
            "question": "Test question",
            "steps": [
                {"text": "Step 1"},
                {"text": "Step 2"},
            ],
        }

        self.client.post(
            "/api/v1/trajectory/analyze",
            json=chain_data,
            headers={"Content-Type": "application/json"},
        )

# Run: locust -f tests/load/trajectory/test_sustained_load.py --host=http://localhost:8000
# Target: 1000 req/hour sustained (1 req/3.6s)
```

#### `tests/fault_injection/trajectory/test_chaos.py` (~100 LOC)
```python
"""Fault injection tests (chaos engineering)."""

import pytest
from unittest.mock import patch
from cert.trajectory.api import HamiltonianMonitor

class TestFaultInjection:
    @pytest.fixture
    def monitor(self):
        return HamiltonianMonitor(preload=False)

    def test_model_load_failure(self, monitor):
        """Test handling of model load failure."""
        with patch.object(monitor._model_resource, "load") as mock_load:
            mock_load.side_effect = ResourceLoadError("Model unavailable")

            chain = ReasoningChain(...)
            result = monitor.analyze(chain)

            assert isinstance(result, AnalysisError)
            assert result.error_type == "ResourceLoadError"

    def test_intermittent_gpu_failures(self, monitor):
        """Test handling of intermittent GPU failures."""
        # Simulate random GPU failures
        def side_effect(*args, **kwargs):
            if random.random() < 0.3:  # 30% failure rate
                raise torch.cuda.OutOfMemoryError()
            return np.random.rand(10, 384)

        with patch.object(monitor._model_resource, "embed", side_effect=side_effect):
            # Should retry and eventually succeed or fallback to CPU
            chain = ReasoningChain(...)
            result = monitor.analyze(chain)

            # Should not raise exception (graceful handling)
            assert result is not None
```

---

## Phase 2 Deliverables

### Code Artifacts
- ✅ `cert/trajectory/engine.py` - Production analysis engine
- ✅ `cert/trajectory/api.py` - Production API (sync + async)
- ✅ `cert/trajectory/cache.py` - LRU embedding cache
- ✅ Transform existing `monitor.py` to use new engine

### Tests
- ✅ Unit tests (mocked models, 80%+ coverage)
- ✅ Integration tests (real models, small)
- ✅ Load tests (1000 req/hour sustained)
- ✅ Fault injection tests (chaos engineering)

### Performance
- **Model preloading**: 30s startup, <1s per request
- **Throughput**: 1000 req/hour sustained
- **Latency**: p95 < 5s, p99 < 10s
- **Memory**: Bounded by batch size + cache size

---

# Phase 3: Coordination Monitor (Week 3)

## 3.1 Agent Orchestration

**Goal**: Full implementation of coordination monitoring (currently empty placeholder)

### Current State
- **Location**: `cert/coordination/__init__.py`
- **Status**: Empty placeholder with docstring

### Files to Create

#### `cert/coordination/types.py` (~150 LOC)
```python
"""
Data types for coordination monitoring.

Provides:
- CoordinationMetrics (gamma, omega, consensus rate)
- AgentResponse
- BaselineMeasurement
"""

@dataclass
class AgentResponse:
    """Response from a single agent."""
    agent_id: str
    response: str
    metadata: Dict[str, Any]
    timestamp: datetime

@dataclass
class BaselineMeasurement:
    """Baseline quality measurement for independent agents."""
    agent_responses: List[AgentResponse]
    quality_scores: List[float]
    mean_quality: float
    timestamp: datetime

@dataclass
class CoordinationMetrics:
    """Coordination monitoring metrics."""

    # Core metrics
    gamma: float  # Coordination effect = coordinated / baseline
    omega: float  # Emergence indicator
    consensus_rate: float  # Agreement between agents

    # Quality measurements
    baseline_quality: float  # Independent agent quality
    coordinated_quality: float  # Coordinated system quality

    # Response details
    agent_responses: List[AgentResponse]
    coordinated_response: str

    # Metadata
    task: str
    num_agents: int
    timestamp: datetime

    def is_coordination_effective(self) -> bool:
        """Check if coordination improved performance."""
        return self.gamma > 1.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "gamma": self.gamma,
            "omega": self.omega,
            "consensus_rate": self.consensus_rate,
            "baseline_quality": self.baseline_quality,
            "coordinated_quality": self.coordinated_quality,
            "coordination_effective": self.is_coordination_effective(),
            "task": self.task,
            "num_agents": self.num_agents,
            "timestamp": self.timestamp.isoformat(),
        }
```

#### `cert/coordination/client.py` (~300 LOC)
```python
"""
Anthropic API client with resilience patterns.

Provides:
- Rate limiting (50 req/min)
- Circuit breaker
- Retry with exponential backoff
- Cost tracking
"""

class AnthropicClientWithResilience:
    """Production-grade Anthropic API client."""

    def __init__(
        self,
        api_key: str,
        requests_per_minute: int = 50,
        circuit_breaker: Optional[CircuitBreaker] = None,
        metrics: Optional[MetricsCollector] = None,
    ):
        self._client = anthropic.Anthropic(api_key=api_key)
        self._circuit = circuit_breaker or CircuitBreaker()
        self._rate_limiter = RateLimiter(requests_per_minute=requests_per_minute)
        self._metrics = metrics or MetricsCollector()
        self._cost_tracker = CostTracker()

    @retry(
        max_retries=3,
        exceptions=(anthropic.RateLimitError, anthropic.APIError),
    )
    async def complete(
        self,
        prompt: str,
        model: str = "claude-3-sonnet-20240229",
        max_tokens: int = 1024,
        timeout: float = 30.0,
        agent_id: Optional[str] = None,
        **kwargs,
    ) -> str:
        """
        Complete prompt with resilience patterns.

        Args:
            prompt: Input prompt
            model: Claude model name
            max_tokens: Maximum response tokens
            timeout: Request timeout
            agent_id: Agent identifier (for metrics)

        Returns:
            Response text

        Raises:
            CircuitBreakerOpen: Circuit breaker is open
            MaxRetriesExceeded: Failed after retries
        """

        # Check circuit breaker
        if self._circuit.is_open():
            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="circuit_breaker_open"
            ).inc()
            raise CircuitBreakerOpen("Anthropic API circuit breaker is open")

        # Rate limit
        await self._rate_limiter.acquire()

        start = time.time()

        try:
            with timeout_context(timeout):
                response = await self._client.messages.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    **kwargs,
                )

            # Extract response text
            response_text = response.content[0].text

            # Record success
            self._circuit.record_success()
            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="success"
            ).inc()

            # Track cost
            cost = self._cost_tracker.calculate_cost(
                model=model,
                input_tokens=response.usage.input_tokens,
                output_tokens=response.usage.output_tokens,
            )
            self._metrics.coordination_cost.labels(
                agent=agent_id or "unknown"
            ).inc(cost)

            # Log
            logger.info(
                "Claude API call successful",
                extra={
                    "agent": agent_id,
                    "model": model,
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "cost_usd": cost,
                    "duration_s": time.time() - start,
                }
            )

            return response_text

        except anthropic.RateLimitError as e:
            # Parse retry-after header
            retry_after = self._parse_retry_after(e) or 60.0
            logger.warning(f"Rate limited, retry after {retry_after}s")
            await asyncio.sleep(retry_after)
            raise  # Will be retried by @retry decorator

        except anthropic.APIError as e:
            self._circuit.record_failure()

            if e.status_code and e.status_code >= 500:
                # Retriable server error
                logger.warning(f"Anthropic API error (retriable): {e}")
                raise
            else:
                # Non-retriable client error
                logger.error(f"Anthropic API error (non-retriable): {e}")
                self._metrics.coordination_api_calls.labels(
                    agent=agent_id or "unknown",
                    status="client_error"
                ).inc()
                raise

        except Exception as e:
            self._circuit.record_failure()
            logger.exception(f"Unexpected Anthropic API error: {e}")
            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="unexpected_error"
            ).inc()
            raise

class RateLimiter:
    """Token bucket rate limiter."""

    def __init__(self, requests_per_minute: int):
        self._rate = requests_per_minute / 60.0  # req/s
        self._tokens = requests_per_minute
        self._max_tokens = requests_per_minute
        self._last_update = time.time()
        self._lock = asyncio.Lock()

    async def acquire(self):
        """Acquire token (blocks if rate exceeded)."""
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_update

            # Refill tokens
            self._tokens = min(
                self._max_tokens,
                self._tokens + elapsed * self._rate
            )
            self._last_update = now

            # Wait if no tokens available
            if self._tokens < 1.0:
                wait_time = (1.0 - self._tokens) / self._rate
                await asyncio.sleep(wait_time)
                self._tokens = 0
            else:
                self._tokens -= 1.0

class CostTracker:
    """Track API costs."""

    # Claude pricing (as of 2024)
    PRICING = {
        "claude-3-sonnet-20240229": {
            "input": 0.003 / 1000,   # $3 per 1M tokens
            "output": 0.015 / 1000,  # $15 per 1M tokens
        },
        # Add other models...
    }

    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """Calculate cost in USD."""
        pricing = self.PRICING.get(model, {"input": 0, "output": 0})
        cost = (
            input_tokens * pricing["input"] +
            output_tokens * pricing["output"]
        )
        return cost
```

#### `cert/coordination/baseline.py` (~200 LOC)
```python
"""
Baseline measurement with caching.

Measures independent agent quality for comparison.
"""

class BaselineCache:
    """Cache baseline measurements to avoid redundant API calls."""

    def __init__(self, cache_file: str = ".cert_baseline_cache.json"):
        self._cache_file = cache_file
        self._cache: Dict[str, BaselineMeasurement] = {}
        self._load_cache()

    def _load_cache(self):
        """Load cache from disk."""
        if os.path.exists(self._cache_file):
            with open(self._cache_file) as f:
                data = json.load(f)
                for key, value in data.items():
                    self._cache[key] = BaselineMeasurement(**value)

    def _save_cache(self):
        """Save cache to disk."""
        data = {k: v.__dict__ for k, v in self._cache.items()}
        with open(self._cache_file, "w") as f:
            json.dump(data, f, indent=2, default=str)

    def get(self, task: str, num_agents: int) -> Optional[BaselineMeasurement]:
        """Get cached baseline measurement."""
        key = f"{task}:{num_agents}"
        return self._cache.get(key)

    def set(self, task: str, num_agents: int, measurement: BaselineMeasurement):
        """Cache baseline measurement."""
        key = f"{task}:{num_agents}"
        self._cache[key] = measurement
        self._save_cache()

class BaselineMeasurer:
    """Measure baseline quality of independent agents."""

    def __init__(
        self,
        client: AnthropicClientWithResilience,
        evaluator: "QualityEvaluator",
        cache: Optional[BaselineCache] = None,
    ):
        self._client = client
        self._evaluator = evaluator
        self._cache = cache or BaselineCache()

    async def measure_baseline(
        self,
        task: str,
        num_agents: int,
        force_refresh: bool = False,
    ) -> BaselineMeasurement:
        """
        Measure baseline quality of independent agents.

        Args:
            task: Task description
            num_agents: Number of agents
            force_refresh: Bypass cache

        Returns:
            BaselineMeasurement with quality scores
        """

        # Check cache
        if not force_refresh:
            if cached := self._cache.get(task, num_agents):
                logger.info(f"Using cached baseline for task: {task}")
                return cached

        logger.info(f"Measuring baseline for {num_agents} agents on task: {task}")

        # Query each agent independently
        responses = []
        for i in range(num_agents):
            response_text = await self._client.complete(
                prompt=task,
                agent_id=f"agent_{i}",
            )

            response = AgentResponse(
                agent_id=f"agent_{i}",
                response=response_text,
                metadata={},
                timestamp=datetime.now(),
            )
            responses.append(response)

        # Evaluate quality of each response
        quality_scores = []
        for response in responses:
            score = await self._evaluator.evaluate_response(
                task=task,
                response=response.response,
            )
            quality_scores.append(score)

        # Compute mean baseline quality
        mean_quality = sum(quality_scores) / len(quality_scores)

        measurement = BaselineMeasurement(
            agent_responses=responses,
            quality_scores=quality_scores,
            mean_quality=mean_quality,
            timestamp=datetime.now(),
        )

        # Cache result
        self._cache.set(task, num_agents, measurement)

        logger.info(
            "Baseline measurement complete",
            extra={
                "task": task,
                "num_agents": num_agents,
                "mean_quality": mean_quality,
            }
        )

        return measurement
```

#### `cert/coordination/orchestrator.py` (~300 LOC)
```python
"""
Multi-agent coordination orchestrator.

Supports:
- LangChain multi-agent
- AutoGen
- CrewAI
"""

class CoordinationOrchestrator:
    """Orchestrate multi-agent coordination measurement."""

    def __init__(
        self,
        client: AnthropicClientWithResilience,
        baseline_measurer: BaselineMeasurer,
        evaluator: "QualityEvaluator",
        metrics: MetricsCollector,
    ):
        self._client = client
        self._baseline_measurer = baseline_measurer
        self._evaluator = evaluator
        self._metrics = metrics

    async def measure_coordination(
        self,
        task: str,
        num_agents: int,
        coordination_strategy: str = "sequential",  # or "parallel", "debate"
    ) -> CoordinationMetrics:
        """
        Measure coordination effectiveness.

        Args:
            task: Task description
            num_agents: Number of agents
            coordination_strategy: Coordination approach

        Returns:
            CoordinationMetrics with gamma, omega, etc.
        """

        logger.info(
            "Starting coordination measurement",
            extra={
                "task": task,
                "num_agents": num_agents,
                "strategy": coordination_strategy,
            }
        )

        start = time.time()

        # Step 1: Measure baseline (cached if available)
        baseline = await self._baseline_measurer.measure_baseline(task, num_agents)

        # Step 2: Run coordinated agents
        coordinated_response, agent_responses = await self._run_coordinated_agents(
            task=task,
            num_agents=num_agents,
            strategy=coordination_strategy,
        )

        # Step 3: Evaluate coordinated response quality
        coordinated_quality = await self._evaluator.evaluate_response(
            task=task,
            response=coordinated_response,
        )

        # Step 4: Compute coordination metrics
        gamma = coordinated_quality / baseline.mean_quality if baseline.mean_quality > 0 else 1.0

        # Omega: measure emergence (difference from best individual)
        best_baseline_quality = max(baseline.quality_scores)
        omega = coordinated_quality - best_baseline_quality

        # Consensus rate: agreement between agents
        consensus_rate = self._compute_consensus_rate(agent_responses)

        metrics = CoordinationMetrics(
            gamma=gamma,
            omega=omega,
            consensus_rate=consensus_rate,
            baseline_quality=baseline.mean_quality,
            coordinated_quality=coordinated_quality,
            agent_responses=agent_responses,
            coordinated_response=coordinated_response,
            task=task,
            num_agents=num_agents,
            timestamp=datetime.now(),
        )

        # Record metrics
        self._metrics.coordination_gamma.observe(gamma)

        logger.info(
            "Coordination measurement complete",
            extra={
                "task": task,
                "gamma": gamma,
                "omega": omega,
                "consensus_rate": consensus_rate,
                "coordination_effective": metrics.is_coordination_effective(),
                "duration_s": time.time() - start,
            }
        )

        return metrics

    async def _run_coordinated_agents(
        self,
        task: str,
        num_agents: int,
        strategy: str,
    ) -> Tuple[str, List[AgentResponse]]:
        """Run agents with coordination."""

        if strategy == "sequential":
            return await self._sequential_coordination(task, num_agents)
        elif strategy == "parallel":
            return await self._parallel_coordination(task, num_agents)
        elif strategy == "debate":
            return await self._debate_coordination(task, num_agents)
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

    async def _sequential_coordination(
        self,
        task: str,
        num_agents: int,
    ) -> Tuple[str, List[AgentResponse]]:
        """Sequential coordination (chain-of-agents)."""

        responses = []
        current_output = task

        for i in range(num_agents):
            prompt = f"Task: {task}\n\nPrevious output: {current_output}\n\nYour response:"

            response_text = await self._client.complete(
                prompt=prompt,
                agent_id=f"agent_{i}",
            )

            response = AgentResponse(
                agent_id=f"agent_{i}",
                response=response_text,
                metadata={"position": i},
                timestamp=datetime.now(),
            )
            responses.append(response)

            current_output = response_text

        # Final output is last agent's response
        final_response = current_output

        return final_response, responses

    async def _parallel_coordination(
        self,
        task: str,
        num_agents: int,
    ) -> Tuple[str, List[AgentResponse]]:
        """Parallel coordination with aggregation."""

        # Query all agents in parallel
        tasks = [
            self._client.complete(
                prompt=task,
                agent_id=f"agent_{i}",
            )
            for i in range(num_agents)
        ]

        response_texts = await asyncio.gather(*tasks)

        responses = [
            AgentResponse(
                agent_id=f"agent_{i}",
                response=text,
                metadata={},
                timestamp=datetime.now(),
            )
            for i, text in enumerate(response_texts)
        ]

        # Aggregate responses (simple majority voting or LLM aggregation)
        aggregation_prompt = f"""Task: {task}

Agent responses:
{chr(10).join(f"Agent {i}: {r.response}" for i, r in enumerate(responses))}

Aggregate the above responses into a single high-quality response:"""

        final_response = await self._client.complete(
            prompt=aggregation_prompt,
            agent_id="aggregator",
        )

        return final_response, responses

    def _compute_consensus_rate(self, responses: List[AgentResponse]) -> float:
        """Compute consensus rate between agents."""
        # Use embedding similarity
        texts = [r.response for r in responses]

        if len(texts) < 2:
            return 1.0

        # Compute pairwise similarities
        similarities = []
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                sim = self._compute_similarity(texts[i], texts[j])
                similarities.append(sim)

        return sum(similarities) / len(similarities) if similarities else 0.0

    def _compute_similarity(self, text1: str, text2: str) -> float:
        """Compute semantic similarity."""
        # Use existing embedding service
        from cert.measure import measure
        result = measure(text1, text2)
        return result.semantic_similarity
```

---

## 3.2 Quality Evaluator

#### `cert/coordination/evaluator.py` (~200 LOC)
```python
"""
Response quality evaluation.

Provides:
- LLM-as-judge evaluation
- Behavioral consistency tracking
- Drift detection
"""

class QualityEvaluator:
    """Evaluate response quality."""

    def __init__(
        self,
        client: AnthropicClientWithResilience,
        evaluation_criteria: Optional[Dict[str, str]] = None,
    ):
        self._client = client
        self._criteria = evaluation_criteria or self._default_criteria()
        self._drift_detector = DriftDetector()

    def _default_criteria(self) -> Dict[str, str]:
        """Default evaluation criteria."""
        return {
            "accuracy": "Is the response factually accurate?",
            "relevance": "Is the response relevant to the task?",
            "completeness": "Does the response fully address the task?",
            "clarity": "Is the response clear and understandable?",
        }

    async def evaluate_response(
        self,
        task: str,
        response: str,
    ) -> float:
        """
        Evaluate response quality (0-1 scale).

        Uses LLM-as-judge with structured evaluation criteria.
        """

        # Build evaluation prompt
        criteria_str = "\n".join(
            f"- {name}: {desc}"
            for name, desc in self._criteria.items()
        )

        prompt = f"""Evaluate the following response to a task:

Task: {task}

Response: {response}

Evaluation criteria:
{criteria_str}

Provide a score from 0-10 for each criterion, then compute the average.

Format your response as JSON:
{{
  "accuracy": <score>,
  "relevance": <score>,
  "completeness": <score>,
  "clarity": <score>,
  "average": <average score>
}}"""

        eval_response = await self._client.complete(
            prompt=prompt,
            agent_id="evaluator",
        )

        # Parse JSON response
        try:
            scores = json.loads(eval_response)
            score = scores["average"] / 10.0  # Normalize to 0-1
        except (json.JSONDecodeError, KeyError):
            logger.warning(f"Failed to parse evaluation response: {eval_response}")
            score = 0.5  # Default to neutral

        # Track for drift detection
        self._drift_detector.add_sample(task, score)

        return score

class DriftDetector:
    """Detect quality drift over time."""

    def __init__(self, window_size: int = 100):
        self._window_size = window_size
        self._samples: Dict[str, List[float]] = {}

    def add_sample(self, task: str, score: float):
        """Add quality score sample."""
        if task not in self._samples:
            self._samples[task] = []

        self._samples[task].append(score)

        # Keep only recent samples
        if len(self._samples[task]) > self._window_size:
            self._samples[task] = self._samples[task][-self._window_size:]

    def detect_drift(self, task: str, threshold: float = 0.1) -> bool:
        """
        Detect if quality has drifted significantly.

        Uses moving average comparison.
        """
        samples = self._samples.get(task, [])

        if len(samples) < 20:
            return False  # Not enough data

        # Compare recent mean to historical mean
        recent_mean = sum(samples[-10:]) / 10
        historical_mean = sum(samples[:-10]) / len(samples[:-10])

        drift = abs(recent_mean - historical_mean)

        if drift > threshold:
            logger.warning(
                f"Quality drift detected for task: {task}",
                extra={
                    "recent_mean": recent_mean,
                    "historical_mean": historical_mean,
                    "drift": drift,
                }
            )
            return True

        return False
```

---

## 3.3 Production Hardening

#### `cert/coordination/resources.py` (~150 LOC)
```python
"""
API client pool management.

Provides:
- Connection pooling
- Request queuing
- Graceful degradation
"""

class APIClientPool:
    """Pool of API clients for load distribution."""

    def __init__(
        self,
        api_keys: List[str],
        requests_per_minute: int = 50,
    ):
        self._clients = [
            AnthropicClientWithResilience(
                api_key=key,
                requests_per_minute=requests_per_minute,
            )
            for key in api_keys
        ]
        self._current_index = 0
        self._lock = asyncio.Lock()

    async def get_client(self) -> AnthropicClientWithResilience:
        """Get next available client (round-robin)."""
        async with self._lock:
            client = self._clients[self._current_index]
            self._current_index = (self._current_index + 1) % len(self._clients)
            return client

class RequestQueue:
    """Queue requests with priority and cost limits."""

    def __init__(self, max_cost_per_hour: float = 10.0):
        self._queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self._max_cost_per_hour = max_cost_per_hour
        self._current_hour_cost = 0.0
        self._hour_start = time.time()

    async def enqueue(
        self,
        request: Callable,
        priority: int = 5,  # 0 = highest, 10 = lowest
    ):
        """Enqueue request with priority."""
        await self._queue.put((priority, time.time(), request))

    async def process(self):
        """Process requests respecting cost limits."""
        while True:
            # Check cost limit
            if self._check_cost_limit_exceeded():
                await asyncio.sleep(60)  # Wait 1 minute
                continue

            # Get next request
            priority, timestamp, request = await self._queue.get()

            try:
                await request()
            except Exception as e:
                logger.error(f"Request processing failed: {e}")

    def _check_cost_limit_exceeded(self) -> bool:
        """Check if cost limit exceeded for current hour."""
        # Reset if new hour
        if time.time() - self._hour_start > 3600:
            self._current_hour_cost = 0.0
            self._hour_start = time.time()

        return self._current_hour_cost >= self._max_cost_per_hour
```

---

## Phase 3 Deliverables

### Code Artifacts
- ✅ `cert/coordination/types.py` - Data types
- ✅ `cert/coordination/client.py` - Resilient API client
- ✅ `cert/coordination/baseline.py` - Baseline measurement with caching
- ✅ `cert/coordination/orchestrator.py` - Multi-agent orchestration
- ✅ `cert/coordination/evaluator.py` - Quality evaluation
- ✅ `cert/coordination/resources.py` - API client pool, request queue

### Features
- ✅ Rate limiting (50 req/min configurable)
- ✅ Circuit breaker for API resilience
- ✅ Baseline caching (avoid redundant API calls)
- ✅ Cost tracking per agent
- ✅ Multiple coordination strategies (sequential, parallel, debate)
- ✅ Quality drift detection
- ✅ Request queuing with priority
- ✅ Cost limits per hour

### Tests
- Unit tests for all modules
- Integration tests with mocked API
- Cost limit validation tests
- Drift detection tests

---

# Phase 4: Deployment & Documentation (Week 4)

## 4.1 Containerization

### Files to Create

#### `deployments/docker/Dockerfile.hamiltonian`
```dockerfile
FROM python:3.10-slim

# Install dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy package
COPY cert/ ./cert/

# Preload model (30s startup, fast requests)
ENV PRELOAD_MODEL=true
ENV MODEL_NAME=Qwen/Qwen2.5-7B

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000 9090

# Run service
CMD ["python", "-m", "cert.trajectory.server"]
```

#### `deployments/docker/docker-compose.yml`
```yaml
version: '3.8'

services:
  hamiltonian:
    build:
      context: ../..
      dockerfile: deployments/docker/Dockerfile.hamiltonian
    ports:
      - "8000:8000"  # API
      - "9090:9090"  # Metrics
    environment:
      - PRELOAD_MODEL=true
      - MODEL_NAME=Qwen/Qwen2.5-7B
      - LOG_LEVEL=INFO
      - LOG_FORMAT=json
    volumes:
      - model-cache:/root/.cache/huggingface
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '4'
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  coordination:
    build:
      context: ../..
      dockerfile: deployments/docker/Dockerfile.coordination
    ports:
      - "8001:8000"
      - "9091:9090"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LOG_LEVEL=INFO
    depends_on:
      - hamiltonian

  prometheus:
    image: prom/prometheus
    ports:
      - "9092:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus

volumes:
  model-cache:
  prometheus-data:
  grafana-data:
```

#### `deployments/kubernetes/hamiltonian/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hamiltonian-monitor
  labels:
    app: hamiltonian-monitor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hamiltonian-monitor
  template:
    metadata:
      labels:
        app: hamiltonian-monitor
    spec:
      containers:
      - name: hamiltonian
        image: cert-framework/hamiltonian:4.0.0
        ports:
        - containerPort: 8000
          name: api
        - containerPort: 9090
          name: metrics
        env:
        - name: PRELOAD_MODEL
          value: "true"
        - name: MODEL_NAME
          value: "Qwen/Qwen2.5-7B"
        - name: LOG_LEVEL
          value: "INFO"
        - name: LOG_FORMAT
          value: "json"
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: 1
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: hamiltonian-monitor
spec:
  selector:
    app: hamiltonian-monitor
  ports:
  - name: api
    port: 80
    targetPort: 8000
  - name: metrics
    port: 9090
    targetPort: 9090
  type: LoadBalancer
```

---

## 4.2 Operations Guide

### Files to Create

#### `docs/operations/DEPLOYMENT.md`
```markdown
# Deployment Guide

## Local Development

bash
# Using Docker Compose
cd deployments/docker
docker-compose up

# Access services:
# - Hamiltonian API: http://localhost:8000
# - Coordination API: http://localhost:8001
# - Prometheus: http://localhost:9092
# - Grafana: http://localhost:3000


## Production Deployment (Kubernetes)

bash
# 1. Build images
docker build -t cert-framework/hamiltonian:4.0.0 -f deployments/docker/Dockerfile.hamiltonian .
docker build -t cert-framework/coordination:4.0.0 -f deployments/docker/Dockerfile.coordination .

# 2. Push to registry
docker push cert-framework/hamiltonian:4.0.0
docker push cert-framework/coordination:4.0.0

# 3. Deploy to Kubernetes
kubectl apply -f deployments/kubernetes/hamiltonian/
kubectl apply -f deployments/kubernetes/coordination/

# 4. Check status
kubectl get pods -l app=hamiltonian-monitor
kubectl get services


## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PRELOAD_MODEL` | Preload model on startup | `true` |
| `MODEL_NAME` | Model to load | `Qwen/Qwen2.5-7B` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `LOG_FORMAT` | Log format (json/human) | `json` |
| `ANTHROPIC_API_KEY` | Claude API key | Required for coordination |
| `MAX_COST_PER_HOUR` | API cost limit (USD) | `10.0` |

### Resource Limits

**Hamiltonian Monitor:**
- Memory: 4-8 GB (depends on model size)
- CPU: 2-4 cores
- GPU: 1x NVIDIA GPU (12+ GB VRAM for 7B models)

**Coordination Monitor:**
- Memory: 2 GB
- CPU: 1-2 cores
- No GPU required

## Scaling

### Horizontal Scaling

bash
# Scale Hamiltonian monitor
kubectl scale deployment hamiltonian-monitor --replicas=5

# Scale Coordination monitor
kubectl scale deployment coordination-monitor --replicas=3


### Vertical Scaling

Edit resource requests/limits in `deployment.yaml`:

yaml
resources:
  requests:
    memory: "8Gi"  # Increase for larger models
    cpu: "4"
```

#### `docs/operations/MONITORING.md`
```markdown
# Monitoring Guide

## Metrics

### Hamiltonian Monitor

| Metric | Type | Description |
|--------|------|-------------|
| `cert_requests_total` | Counter | Total requests processed |
| `cert_request_duration_seconds` | Histogram | Request duration |
| `cert_request_errors_total` | Counter | Total errors |
| `cert_hamiltonian_quality_checks_total` | Counter | Quality check results |
| `cert_model_memory_bytes` | Gauge | Model memory usage |
| `cert_cache_hits_total` | Counter | Cache hits |

### Coordination Monitor

| Metric | Type | Description |
|--------|------|-------------|
| `cert_coordination_gamma` | Histogram | Coordination effect |
| `cert_coordination_api_calls_total` | Counter | API calls |
| `cert_coordination_cost_usd` | Counter | API cost |

## Dashboards

### Grafana Dashboards

Import dashboards from `deployments/grafana/dashboards/`:

1. **Hamiltonian Overview**: Request rate, latency, quality checks
2. **Coordination Overview**: Gamma distribution, API usage, cost tracking
3. **System Health**: Model memory, cache hit rate, error rate

## Alerts

### Prometheus Alerts

Configured in `deployments/prometheus/alerts.yml`:

- **High Error Rate**: >5% errors in 5 minutes
- **High Latency**: p95 > 10s for 5 minutes
- **Cost Limit**: Approaching hourly cost limit
- **Model OOM**: Frequent GPU OOM errors
- **Circuit Breaker Open**: API circuit breaker open

## Logs

### Log Aggregation

Forward logs to ELK/Datadog/CloudWatch:

bash
# Configure structured logging
export LOG_FORMAT=json
export LOG_OUTPUT=stdout

# Forward to log aggregator
kubectl logs -f deployment/hamiltonian-monitor | logstash
```

#### `docs/operations/TROUBLESHOOTING.md`
```markdown
# Troubleshooting Guide

## Common Issues

### 1. Model Load Failure

**Symptoms**: Service fails to start, logs show `ResourceLoadError`

**Causes**:
- Insufficient GPU memory
- Model not found in HuggingFace cache
- Network issues downloading model

**Solutions**:
bash
# Check GPU memory
nvidia-smi

# Manually download model
python -c "from transformers import AutoModel; AutoModel.from_pretrained('Qwen/Qwen2.5-7B')"

# Use smaller model or CPU
export MODEL_NAME=gpt2
export DEVICE=cpu


### 2. High Latency

**Symptoms**: p95 latency > 10s

**Causes**:
- Model not preloaded (first request loads model)
- Large batch size
- GPU memory contention

**Solutions**:
bash
# Ensure preload enabled
export PRELOAD_MODEL=true

# Reduce batch size
export BATCH_SIZE=8

# Check GPU usage
nvidia-smi dmon


### 3. API Rate Limiting

**Symptoms**: `CircuitBreakerOpen` errors in coordination monitor

**Causes**:
- Anthropic API rate limit exceeded
- Circuit breaker tripped due to failures

**Solutions**:
- Reduce request rate
- Add more API keys for load distribution
- Check circuit breaker status: `/api/v1/coordination/circuit-breaker/status`

### 4. High API Costs

**Symptoms**: Cost limit exceeded alerts

**Solutions**:
bash
# Reduce cost limit
export MAX_COST_PER_HOUR=5.0

# Use baseline cache more aggressively
export BASELINE_CACHE_TTL=86400  # 24 hours

# Monitor cost dashboard in Grafana
```

---

## 4.3 API Documentation

#### `docs/api/openapi.yaml`
```yaml
openapi: 3.0.0
info:
  title: CERT Framework API
  version: 4.0.0
  description: Production monitoring platform for EU AI Act compliance

servers:
  - url: http://localhost:8000/api/v1
    description: Local development
  - url: https://api.cert-framework.com/v1
    description: Production

paths:
  /trajectory/analyze:
    post:
      summary: Analyze reasoning trajectory
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReasoningChain'
      responses:
        '200':
          description: Analysis successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HamiltonianMetrics'
        '400':
          description: Invalid input
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AnalysisError'
        '500':
          description: Internal server error

  /coordination/measure:
    post:
      summary: Measure coordination effectiveness
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                task:
                  type: string
                num_agents:
                  type: integer
                strategy:
                  type: string
                  enum: [sequential, parallel, debate]
      responses:
        '200':
          description: Measurement successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CoordinationMetrics'

  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheckResult'
        '503':
          description: Service degraded/unhealthy

components:
  schemas:
    ReasoningChain:
      type: object
      required:
        - question
        - steps
      properties:
        question:
          type: string
        steps:
          type: array
          items:
            $ref: '#/components/schemas/ReasoningStep'

    ReasoningStep:
      type: object
      required:
        - text
      properties:
        text:
          type: string

    HamiltonianMetrics:
      type: object
      properties:
        avg_perplexity:
          type: number
        avg_entropy:
          type: number
        cumulative_surprise:
          type: number
        passed_quality_check:
          type: boolean

    CoordinationMetrics:
      type: object
      properties:
        gamma:
          type: number
          description: Coordination effect (>1 = effective)
        omega:
          type: number
          description: Emergence indicator
        consensus_rate:
          type: number
          description: Agreement between agents (0-1)

    AnalysisError:
      type: object
      properties:
        error_type:
          type: string
        message:
          type: string
        recoverable:
          type: boolean
        retry_after:
          type: number
          nullable: true

    HealthCheckResult:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        checks:
          type: object
          additionalProperties:
            type: boolean
```

---

## Phase 4 Deliverables

### Deployment Artifacts
- ✅ Docker images for Hamiltonian and Coordination monitors
- ✅ Docker Compose for local development
- ✅ Kubernetes manifests (deployments, services)
- ✅ Helm charts (optional, for advanced deployment)
- ✅ Prometheus configuration
- ✅ Grafana dashboards

### Documentation
- ✅ Deployment guide (local, production, scaling)
- ✅ Monitoring guide (metrics, dashboards, alerts)
- ✅ Troubleshooting playbook (common issues, solutions)
- ✅ Performance tuning guide (resource limits, optimization)
- ✅ OpenAPI specification (API reference)
- ✅ Integration examples (Python, cURL, REST clients)

### Operations
- ✅ Health check endpoints
- ✅ Readiness probes
- ✅ Liveness probes
- ✅ Graceful shutdown handling
- ✅ Log rotation configuration

---

# Success Criteria

## Phase 1: Core Infrastructure
- ✅ All resources use context managers
- ✅ Thread-safe loading/unloading
- ✅ Comprehensive error handling (80% error paths covered)
- ✅ Structured JSON logging
- ✅ Prometheus metrics exported
- ✅ Health checks pass

## Phase 2: Hamiltonian Monitor
- ✅ Model preloads in <30s
- ✅ Request latency: p95 <5s, p99 <10s
- ✅ Sustained throughput: 1000 req/hour
- ✅ Cache hit rate: >70%
- ✅ GPU OOM fallback to CPU works
- ✅ Test coverage: >80%

## Phase 3: Coordination Monitor
- ✅ Rate limiting enforces 50 req/min
- ✅ Circuit breaker prevents cascading failures
- ✅ Baseline caching reduces API calls by >80%
- ✅ Cost tracking accurate to $0.01
- ✅ Quality drift detection functional
- ✅ Test coverage: >75%

## Phase 4: Deployment
- ✅ Docker images build successfully
- ✅ Kubernetes deployments stable (no crashes)
- ✅ Health checks pass in production
- ✅ Metrics scraped by Prometheus
- ✅ Grafana dashboards display data
- ✅ Documentation complete and accurate

---

# Migration Path

## For Existing Users (v3.x → v4.0)

### Breaking Changes
1. **Resource Management**: Singleton patterns → Context managers
2. **Error Handling**: Exceptions raised → Structured errors returned
3. **Configuration**: Simple dicts → Config classes

### Migration Guide

#### Before (v3.x):
python
from cert.trajectory import analyze_trajectory

model, tokenizer = load_model_for_monitoring("Qwen/Qwen2.5-7B")
analysis = analyze_trajectory(model, tokenizer, "Explain AI")


#### After (v4.0):
python
from cert.trajectory import HamiltonianMonitor

with HamiltonianMonitor(model_name="Qwen/Qwen2.5-7B") as monitor:
    chain = ReasoningChain(
        question="Explain AI",
        steps=[...],
    )
    result = monitor.analyze(chain)

    if isinstance(result, AnalysisError):
        print(f"Error: {result.message}")
    else:
        print(f"Quality: {result.passed_quality_check}")


### Backward Compatibility
- v3.x public API maintained as deprecated shims
- Deprecation warnings logged
- Full removal in v5.0

---

# Implementation Schedule

## Week 1: Core Infrastructure
- **Days 1-2**: Resource management (resources.py, engine.py)
- **Days 3-4**: Error handling (errors.py, retry.py, circuit_breaker.py)
- **Day 5**: Observability (logging.py, metrics.py, tracing.py)

## Week 2: Hamiltonian Monitor
- **Days 1-2**: Core engine (extract from notebooks, add hardening)
- **Days 3-4**: Production API (api.py, sync/async)
- **Day 5**: Testing (unit, integration, load)

## Week 3: Coordination Monitor
- **Days 1-2**: Client + baseline (client.py, baseline.py)
- **Days 3-4**: Orchestrator + evaluator (orchestrator.py, evaluator.py)
- **Day 5**: Production hardening (resources.py, cost limits)

## Week 4: Deployment
- **Days 1-2**: Containerization (Dockerfile, docker-compose, K8s)
- **Days 3-4**: Documentation (deployment, monitoring, troubleshooting)
- **Day 5**: Final testing, release

---

# Risk Mitigation

## Technical Risks

### Risk: GPU OOM during load spike
**Mitigation**:
- CPU fallback implemented
- Batch size limits enforced
- Memory monitoring with alerts

### Risk: Anthropic API rate limit exceeded
**Mitigation**:
- Rate limiter enforces limits
- Circuit breaker prevents cascading failures
- Baseline caching reduces API calls

### Risk: Model loading delay on cold start
**Mitigation**:
- Preload option (30s startup delay)
- Readiness probe waits for load
- Kubernetes replicas ensure availability

## Schedule Risks

### Risk: Testing takes longer than planned
**Mitigation**:
- Parallel development (multiple phases)
- Automated testing in CI
- Focus on critical paths first

---

# Next Steps

This plan provides the complete roadmap for transforming CERT Framework into enterprise-grade infrastructure. Ready to begin implementation?

**Recommended approach**:
1. Review this plan, provide feedback
2. Prioritize phases based on business needs
3. Begin Phase 1 implementation
4. Iterate with regular reviews

Let me know if you'd like to proceed or need any clarification!
