"""
Exception hierarchy for structured error handling.

Provides:
- CERTError base class
- Error categorization (retriable, non-retriable)
- Error codes for client handling
- Structured error responses
"""

from typing import Any, Dict, Optional


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


class ResourceError(CERTError):
    """Resource loading/management errors."""

    def __init__(self, message: str, **kwargs):
        super().__init__(
            message, error_type="ResourceError", recoverable=True, **kwargs
        )


class ResourceLoadError(ResourceError):
    """Failed to load resource (model, API client)."""

    def __init__(self, message: str, **kwargs):
        kwargs.setdefault("error_type", "ResourceLoadError")
        super().__init__(message, **kwargs)


class GPUOutOfMemoryError(ResourceError):
    """GPU memory exhausted."""

    def __init__(self, message: str = "GPU memory exhausted", **kwargs):
        kwargs.setdefault("error_type", "GPUOutOfMemoryError")
        kwargs.setdefault("recoverable", True)
        super().__init__(message, **kwargs)


class EmbeddingTimeoutError(CERTError):
    """Embedding computation timed out."""

    def __init__(self, timeout: float, **kwargs):
        super().__init__(
            f"Embedding computation timed out after {timeout}s",
            error_type="EmbeddingTimeoutError",
            recoverable=True,
            retry_after=2.0,
            **kwargs,
        )


class CircuitBreakerOpen(CERTError):
    """Circuit breaker is open (service degraded)."""

    def __init__(self, service: str = "service", **kwargs):
        super().__init__(
            f"Circuit breaker open for {service}",
            error_type="CircuitBreakerOpen",
            recoverable=True,
            retry_after=30.0,
            **kwargs,
        )


class InvalidInputError(CERTError):
    """Invalid input provided."""

    def __init__(self, message: str, **kwargs):
        super().__init__(
            message, error_type="InvalidInputError", recoverable=False, **kwargs
        )


class MaxRetriesExceeded(CERTError):
    """Maximum retries exceeded."""

    def __init__(self, retries: int, **kwargs):
        super().__init__(
            f"Failed after {retries} retries",
            error_type="MaxRetriesExceeded",
            recoverable=False,
            **kwargs,
        )


class AnalysisError(CERTError):
    """Error during analysis (Hamiltonian, Coordination, etc.)."""

    def __init__(self, error_type: str, message: str, recoverable: bool, **kwargs):
        super().__init__(
            message, error_type=error_type, recoverable=recoverable, **kwargs
        )

    def is_valid(self) -> bool:
        """Check if this represents a valid analysis result (always False for errors)."""
        return False
