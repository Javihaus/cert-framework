"""
Observability infrastructure for CERT Framework.

This module provides production-grade observability:
- Structured JSON logging with correlation IDs
- Prometheus metrics export
- OpenTelemetry tracing support
- Performance profiling
"""

from cert.observability.logging import (
    configure_logging,
    JsonFormatter,
    correlation_id_context,
)
from cert.observability.metrics import (
    MetricsCollector,
    metrics_endpoint,
)

__all__ = [
    # Logging
    "configure_logging",
    "JsonFormatter",
    "correlation_id_context",
    # Metrics
    "MetricsCollector",
    "metrics_endpoint",
]
