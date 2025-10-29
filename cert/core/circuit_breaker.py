"""
Circuit breaker pattern for external service calls.

Prevents cascading failures when external services are degraded.

WHEN TO USE:
- External API calls (Anthropic, OpenAI, etc.)
- Database connections
- Network requests
- Any remote service that can fail

WHEN NOT TO USE:
- Local model inference (embeddings, NLI)
- File I/O operations
- In-memory computation
- Fast local operations that fail deterministically

Circuit breakers add latency and complexity. Use them only where cascading
failures are possible (Service A down → Circuit opens → Service B doesn't wait).

States:
- CLOSED: Normal operation, all requests pass through
- OPEN: Service degraded, requests fail fast
- HALF_OPEN: Testing if service recovered

Transitions:
- CLOSED → OPEN: After failure_threshold consecutive failures
- OPEN → HALF_OPEN: After recovery_timeout
- HALF_OPEN → CLOSED: After success_threshold consecutive successes
- HALF_OPEN → OPEN: On any failure

Example:
    >>> from cert.core.circuit_breaker import CircuitBreaker
    >>>
    >>> # Protect external API calls
    >>> breaker = CircuitBreaker(failure_threshold=5, name="anthropic_api")
    >>>
    >>> def call_external_api():
    >>>     return breaker.call(lambda: anthropic.complete(...))
"""

import logging
import threading
import time
from enum import Enum
from typing import Any, Callable, Optional

from cert.core.errors import CircuitBreakerOpen

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """Circuit breaker states."""

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
        name: str = "default",
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening
            recovery_timeout: Seconds to wait before trying HALF_OPEN
            success_threshold: Successes needed in HALF_OPEN to close
            name: Circuit breaker name (for logging)
        """
        self._name = name
        self._state = CircuitBreakerState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._success_threshold = success_threshold
        self._lock = threading.Lock()

    @property
    def state(self) -> CircuitBreakerState:
        """Get current circuit breaker state."""
        return self._state

    @property
    def name(self) -> str:
        """Get circuit breaker name."""
        return self._name

    def is_open(self) -> bool:
        """
        Check if circuit breaker is open (blocking requests).

        Returns:
            True if circuit breaker is open and requests should be blocked
        """
        with self._lock:
            if self._state == CircuitBreakerState.OPEN:
                # Check if recovery timeout elapsed
                if (
                    self._last_failure_time
                    and time.time() - self._last_failure_time > self._recovery_timeout
                ):
                    self._state = CircuitBreakerState.HALF_OPEN
                    self._success_count = 0
                    logger.info(f"Circuit breaker '{self._name}' entering HALF_OPEN state")
                    return False
                return True
            return False

    def record_success(self):
        """Record successful request."""
        with self._lock:
            if self._state == CircuitBreakerState.HALF_OPEN:
                self._success_count += 1
                logger.debug(
                    f"Circuit breaker '{self._name}' success "
                    f"({self._success_count}/{self._success_threshold})"
                )

                if self._success_count >= self._success_threshold:
                    self._state = CircuitBreakerState.CLOSED
                    self._failure_count = 0
                    logger.info(f"Circuit breaker '{self._name}' CLOSED (recovered)")
            elif self._state == CircuitBreakerState.CLOSED:
                # Reset failure count on success
                self._failure_count = 0

    def record_failure(self):
        """Record failed request."""
        with self._lock:
            if self._state == CircuitBreakerState.HALF_OPEN:
                # Any failure in HALF_OPEN → back to OPEN
                self._state = CircuitBreakerState.OPEN
                self._last_failure_time = time.time()
                logger.warning(f"Circuit breaker '{self._name}' reopened (HALF_OPEN failure)")
            elif self._state == CircuitBreakerState.CLOSED:
                self._failure_count += 1
                logger.debug(
                    f"Circuit breaker '{self._name}' failure "
                    f"({self._failure_count}/{self._failure_threshold})"
                )

                if self._failure_count >= self._failure_threshold:
                    self._state = CircuitBreakerState.OPEN
                    self._last_failure_time = time.time()
                    logger.error(f"Circuit breaker '{self._name}' OPEN (threshold exceeded)")

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Function to execute
            *args: Positional arguments for function
            **kwargs: Keyword arguments for function

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit breaker is open
        """
        if self.is_open():
            raise CircuitBreakerOpen(service=self._name)

        try:
            result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception:
            self.record_failure()
            raise

    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute async function with circuit breaker protection.

        Args:
            func: Async function to execute
            *args: Positional arguments for function
            **kwargs: Keyword arguments for function

        Returns:
            Function result

        Raises:
            CircuitBreakerOpen: If circuit breaker is open
        """
        if self.is_open():
            raise CircuitBreakerOpen(service=self._name)

        try:
            result = await func(*args, **kwargs)
            self.record_success()
            return result
        except Exception:
            self.record_failure()
            raise

    def reset(self):
        """Reset circuit breaker to initial state."""
        with self._lock:
            self._state = CircuitBreakerState.CLOSED
            self._failure_count = 0
            self._success_count = 0
            self._last_failure_time = None
            logger.info(f"Circuit breaker '{self._name}' reset")

    def get_stats(self) -> dict:
        """
        Get circuit breaker statistics.

        Returns:
            Dictionary with current state and counters
        """
        with self._lock:
            return {
                "name": self._name,
                "state": self._state.value,
                "failure_count": self._failure_count,
                "success_count": self._success_count,
                "failure_threshold": self._failure_threshold,
                "success_threshold": self._success_threshold,
                "recovery_timeout": self._recovery_timeout,
                "last_failure_time": self._last_failure_time,
            }
