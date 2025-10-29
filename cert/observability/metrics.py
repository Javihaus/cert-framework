"""
Prometheus metrics exporter.

Provides:
- Standard metrics (request rate, latency, errors)
- Custom metrics for Hamiltonian/Coordination
- Metrics HTTP endpoint
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Try to import prometheus_client
try:
    from prometheus_client import (
        REGISTRY,
        Counter,
        Gauge,
        Histogram,
        generate_latest,
    )

    PROMETHEUS_AVAILABLE = True
except ImportError:
    logger.warning("prometheus_client not available. Install with: pip install prometheus-client")
    PROMETHEUS_AVAILABLE = False


class MetricsCollector:
    """Centralized metrics collection for CERT Framework."""

    def __init__(self, namespace: str = "cert", enabled: bool = True):
        """
        Initialize metrics collector.

        Args:
            namespace: Metric namespace prefix
            enabled: Whether metrics collection is enabled
        """
        self.namespace = namespace
        self.enabled = enabled and PROMETHEUS_AVAILABLE

        if not self.enabled:
            logger.info("Metrics collection disabled")
            return

        # Request metrics
        self.requests_total = Counter(
            f"{namespace}_requests_total",
            "Total requests processed",
            ["service", "status"],
        )

        self.request_duration = Histogram(
            f"{namespace}_request_duration_seconds",
            "Request duration in seconds",
            ["service", "operation"],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0],
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
            ["result"],
        )

        self.hamiltonian_perplexity = Histogram(
            f"{namespace}_hamiltonian_perplexity",
            "Average perplexity distribution",
            buckets=[1, 5, 10, 20, 50, 100, 200, 500],
        )

        self.hamiltonian_entropy = Histogram(
            f"{namespace}_hamiltonian_entropy",
            "Average entropy distribution",
            buckets=[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
        )

        # Coordination metrics
        self.coordination_gamma = Histogram(
            f"{namespace}_coordination_gamma",
            "Coordination effect (gamma) distribution",
            buckets=[0.5, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0, 3.0],
        )

        self.coordination_api_calls = Counter(
            f"{namespace}_coordination_api_calls_total",
            "API calls for coordination monitoring",
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
            "Model loading time in seconds",
            ["model_name"],
            buckets=[1, 5, 10, 20, 30, 60, 120, 300],
        )

        self.model_memory_usage = Gauge(
            f"{namespace}_model_memory_bytes",
            "Model memory usage in bytes",
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

        self.cache_size = Gauge(
            f"{namespace}_cache_size",
            "Current cache size",
            ["cache_type"],
        )

        logger.info(f"Metrics collector initialized with namespace: {namespace}")

    def record_request(
        self,
        service: str,
        status: str,
        duration: Optional[float] = None,
        operation: Optional[str] = None,
    ):
        """
        Record a request.

        Args:
            service: Service name (e.g., 'hamiltonian', 'coordination')
            status: Request status ('success', 'error')
            duration: Request duration in seconds
            operation: Operation name (e.g., 'analyze', 'measure')
        """
        if not self.enabled:
            return

        self.requests_total.labels(service=service, status=status).inc()

        if duration is not None and operation is not None:
            self.request_duration.labels(service=service, operation=operation).observe(duration)

    def record_error(self, service: str, error_type: str):
        """
        Record an error.

        Args:
            service: Service name
            error_type: Type of error
        """
        if not self.enabled:
            return

        self.request_errors.labels(service=service, error_type=error_type).inc()

    def record_model_load(
        self, model_name: str, duration: float, memory_bytes: Optional[int], device: str
    ):
        """
        Record model loading metrics.

        Args:
            model_name: Model identifier
            duration: Load duration in seconds
            memory_bytes: Memory usage in bytes
            device: Device model is loaded on
        """
        if not self.enabled:
            return

        self.model_load_duration.labels(model_name=model_name).observe(duration)

        if memory_bytes is not None:
            self.model_memory_usage.labels(model_name=model_name, device=device).set(memory_bytes)

    def record_cache_hit(self, cache_type: str):
        """Record cache hit."""
        if not self.enabled:
            return
        self.cache_hits.labels(cache_type=cache_type).inc()

    def record_cache_miss(self, cache_type: str):
        """Record cache miss."""
        if not self.enabled:
            return
        self.cache_misses.labels(cache_type=cache_type).inc()

    def set_cache_size(self, cache_type: str, size: int):
        """Set current cache size."""
        if not self.enabled:
            return
        self.cache_size.labels(cache_type=cache_type).set(size)


def metrics_endpoint() -> str:
    """
    Return Prometheus metrics in text format.

    Returns:
        Metrics in Prometheus exposition format
    """
    if not PROMETHEUS_AVAILABLE:
        return "# Metrics not available (prometheus_client not installed)\n"

    return generate_latest(REGISTRY).decode("utf-8")


def create_metrics_app(host: str = "0.0.0.0", port: int = 9090):
    """
    Create Flask app for metrics endpoint.

    Args:
        host: Host to bind to
        port: Port to listen on

    Returns:
        Flask app instance
    """
    try:
        from flask import Flask, Response
    except ImportError:
        logger.error("Flask not available. Install with: pip install flask")
        return None

    app = Flask(__name__)

    @app.route("/metrics")
    def metrics():
        return Response(
            metrics_endpoint(),
            mimetype="text/plain",
        )

    @app.route("/health")
    def health():
        # Basic health check
        return {"status": "healthy"}, 200

    logger.info(f"Metrics app created (will listen on {host}:{port})")
    return app


def start_metrics_server(host: str = "0.0.0.0", port: int = 9090):
    """
    Start metrics HTTP server.

    Args:
        host: Host to bind to
        port: Port to listen on
    """
    app = create_metrics_app(host, port)
    if app:
        logger.info(f"Starting metrics server on {host}:{port}")
        app.run(host=host, port=port, threaded=True)
    else:
        logger.error("Failed to create metrics app")
