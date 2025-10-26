"""Unit tests for retry decorator."""

import pytest
from cert.core.retry import retry
from cert.core.errors import MaxRetriesExceeded


class TestRetryDecorator:
    """Test retry decorator functionality."""

    def test_no_retry_on_success(self):
        """Test function succeeds without retry."""
        call_count = [0]

        @retry(max_retries=3)
        def successful_func():
            call_count[0] += 1
            return "success"

        result = successful_func()

        assert result == "success"
        assert call_count[0] == 1

    def test_retry_on_failure_then_success(self):
        """Test function retries on failure then succeeds."""
        call_count = [0]

        @retry(max_retries=3)
        def intermittent_func():
            call_count[0] += 1
            if call_count[0] < 3:
                raise ValueError("Temporary error")
            return "success"

        result = intermittent_func()

        assert result == "success"
        assert call_count[0] == 3

    def test_max_retries_exceeded(self):
        """Test max retries exceeded raises exception."""
        call_count = [0]

        @retry(max_retries=2)
        def failing_func():
            call_count[0] += 1
            raise ValueError("Persistent error")

        with pytest.raises(ValueError) as exc_info:
            failing_func()

        assert "Persistent error" in str(exc_info.value)
        assert call_count[0] == 3  # Initial call + 2 retries

    def test_retry_specific_exceptions(self):
        """Test retry only on specific exception types."""
        call_count = [0]

        @retry(max_retries=3, exceptions=(ValueError,))
        def specific_exception_func():
            call_count[0] += 1
            if call_count[0] == 1:
                raise ValueError("Retriable")
            raise TypeError("Not retriable")

        with pytest.raises(TypeError):
            specific_exception_func()

        # Should have retried ValueError, then failed on TypeError
        assert call_count[0] == 2

    def test_retry_callback(self):
        """Test retry callback is called."""
        callback_calls = []

        def on_retry(attempt, backoff, error):
            callback_calls.append((attempt, backoff, str(error)))

        call_count = [0]

        @retry(max_retries=2, backoff_base=1.0, on_retry=on_retry)
        def failing_func():
            call_count[0] += 1
            raise ValueError(f"Error {call_count[0]}")

        with pytest.raises(ValueError):
            failing_func()

        assert len(callback_calls) == 2
        assert callback_calls[0][0] == 0  # First retry attempt
        assert callback_calls[1][0] == 1  # Second retry attempt

    def test_backoff_timing(self):
        """Test exponential backoff (basic check)."""
        call_count = [0]

        @retry(max_retries=2, backoff_base=0.01)
        def failing_func():
            call_count[0] += 1
            raise ValueError("Error")

        import time
        start = time.time()

        with pytest.raises(ValueError):
            failing_func()

        elapsed = time.time() - start

        # Should have waited at least some time for backoff
        # (0.01^0 + 0.01^1 = roughly 0.02s, but with jitter)
        assert elapsed > 0.01
