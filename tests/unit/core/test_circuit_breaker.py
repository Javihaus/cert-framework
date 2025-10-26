"""Unit tests for circuit breaker."""

import time
import pytest
from cert.core.circuit_breaker import CircuitBreaker, CircuitBreakerState
from cert.core.errors import CircuitBreakerOpen


class TestCircuitBreaker:
    """Test circuit breaker functionality."""

    def test_initial_state(self):
        """Test circuit breaker starts in CLOSED state."""
        cb = CircuitBreaker(failure_threshold=3)

        assert cb.state == CircuitBreakerState.CLOSED
        assert not cb.is_open()

    def test_open_on_failures(self):
        """Test circuit breaker opens after threshold failures."""
        cb = CircuitBreaker(failure_threshold=3)

        # Record failures
        cb.record_failure()
        assert cb.state == CircuitBreakerState.CLOSED

        cb.record_failure()
        assert cb.state == CircuitBreakerState.CLOSED

        cb.record_failure()
        assert cb.state == CircuitBreakerState.OPEN
        assert cb.is_open()

    def test_reset_on_success(self):
        """Test failures reset on success in CLOSED state."""
        cb = CircuitBreaker(failure_threshold=3)

        cb.record_failure()
        cb.record_failure()
        cb.record_success()

        # Should reset failure count
        cb.record_failure()
        assert cb.state == CircuitBreakerState.CLOSED

    def test_half_open_transition(self):
        """Test transition to HALF_OPEN after recovery timeout."""
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

        # Open circuit breaker
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitBreakerState.OPEN

        # Wait for recovery timeout
        time.sleep(0.15)

        # Should transition to HALF_OPEN
        is_open = cb.is_open()
        assert not is_open
        assert cb.state == CircuitBreakerState.HALF_OPEN

    def test_half_open_to_closed(self):
        """Test transition from HALF_OPEN to CLOSED on successes."""
        cb = CircuitBreaker(
            failure_threshold=2,
            recovery_timeout=0.1,
            success_threshold=2
        )

        # Open circuit breaker
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitBreakerState.OPEN

        # Wait for recovery
        time.sleep(0.15)
        cb.is_open()  # Trigger transition to HALF_OPEN

        # Record successes
        cb.record_success()
        assert cb.state == CircuitBreakerState.HALF_OPEN

        cb.record_success()
        assert cb.state == CircuitBreakerState.CLOSED

    def test_half_open_to_open_on_failure(self):
        """Test HALF_OPEN returns to OPEN on failure."""
        cb = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

        # Open circuit breaker
        cb.record_failure()
        cb.record_failure()

        # Wait for recovery
        time.sleep(0.15)
        cb.is_open()  # Transition to HALF_OPEN

        # Record failure
        cb.record_failure()
        assert cb.state == CircuitBreakerState.OPEN

    def test_call_with_success(self):
        """Test successful call through circuit breaker."""
        cb = CircuitBreaker()

        def successful_func():
            return "success"

        result = cb.call(successful_func)
        assert result == "success"
        assert cb.state == CircuitBreakerState.CLOSED

    def test_call_with_failure(self):
        """Test failed call through circuit breaker."""
        cb = CircuitBreaker(failure_threshold=1)

        def failing_func():
            raise ValueError("test error")

        with pytest.raises(ValueError):
            cb.call(failing_func)

        assert cb.state == CircuitBreakerState.OPEN

    def test_call_when_open(self):
        """Test call fails fast when circuit breaker is open."""
        cb = CircuitBreaker(failure_threshold=1)

        # Open circuit breaker
        cb.record_failure()

        def dummy_func():
            return "should not execute"

        with pytest.raises(CircuitBreakerOpen):
            cb.call(dummy_func)

    def test_get_stats(self):
        """Test statistics retrieval."""
        cb = CircuitBreaker(name="test-breaker", failure_threshold=5)

        cb.record_failure()
        cb.record_failure()

        stats = cb.get_stats()

        assert stats["name"] == "test-breaker"
        assert stats["state"] == "closed"
        assert stats["failure_count"] == 2
        assert stats["failure_threshold"] == 5

    def test_reset(self):
        """Test circuit breaker reset."""
        cb = CircuitBreaker(failure_threshold=2)

        # Open circuit breaker
        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitBreakerState.OPEN

        # Reset
        cb.reset()
        assert cb.state == CircuitBreakerState.CLOSED
        stats = cb.get_stats()
        assert stats["failure_count"] == 0
