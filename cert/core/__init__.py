"""
Core infrastructure for CERT Framework.

This module provides production-grade infrastructure components:
- Resource management (lifecycle, context managers)
- Error handling (structured exceptions, retries, circuit breakers)
- Health checks
- Configuration management
"""

from cert.core.circuit_breaker import CircuitBreaker, CircuitBreakerState
from cert.core.errors import (
    AnalysisError,
    CERTError,
    CircuitBreakerOpen,
    EmbeddingTimeoutError,
    GPUOutOfMemoryError,
    InvalidInputError,
    MaxRetriesExceeded,
    ResourceError,
    ResourceLoadError,
)
from cert.core.health import HealthChecker, HealthCheckResult, HealthStatus
from cert.core.resources import (
    ModelResource,
    ResourceManager,
)
from cert.core.retry import retry

__all__ = [
    # Errors
    "CERTError",
    "ResourceError",
    "ResourceLoadError",
    "GPUOutOfMemoryError",
    "EmbeddingTimeoutError",
    "CircuitBreakerOpen",
    "InvalidInputError",
    "MaxRetriesExceeded",
    "AnalysisError",
    # Resources
    "ResourceManager",
    "ModelResource",
    # Retry
    "retry",
    # Circuit Breaker
    "CircuitBreaker",
    "CircuitBreakerState",
    # Health
    "HealthStatus",
    "HealthCheckResult",
    "HealthChecker",
]
