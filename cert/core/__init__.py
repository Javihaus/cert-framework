"""
Core infrastructure for CERT Framework.

This module provides production-grade infrastructure components:
- Resource management (lifecycle, context managers)
- Error handling (structured exceptions, retries, circuit breakers)
- Health checks
- Configuration management
"""

from cert.core.errors import (
    CERTError,
    ResourceError,
    ResourceLoadError,
    GPUOutOfMemoryError,
    EmbeddingTimeoutError,
    CircuitBreakerOpen,
    InvalidInputError,
    MaxRetriesExceeded,
    AnalysisError,
)
from cert.core.resources import (
    ResourceManager,
    ModelResource,
)
from cert.core.retry import retry
from cert.core.circuit_breaker import CircuitBreaker, CircuitBreakerState
from cert.core.health import HealthStatus, HealthCheckResult, HealthChecker

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
