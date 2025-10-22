"""Unit tests for RobustnessMetric."""

import pytest

from cert.benchmark.metrics.robustness import RobustnessMetric
from cert.benchmark.providers.base import ResponseMetadata


class TestRobustnessMetric:
    """Test suite for RobustnessMetric."""

    @pytest.fixture
    def metric(self):
        """Create RobustnessMetric instance."""
        return RobustnessMetric()

    @pytest.mark.asyncio
    async def test_all_successful(self, metric):
        """Test with all successful responses."""
        metadata_list = [
            ResponseMetadata(
                response_text=f"Response {i}", latency_seconds=1.0, model="test", provider="test"
            )
            for i in range(10)
        ]

        data = {"metadata_list": metadata_list, "provider": "test", "model": "test"}

        result = await metric.calculate(data)

        assert result.error_rate == 0.0
        assert result.timeout_rate == 0.0
        assert result.successful_trials == 10
        assert result.failed_trials == 0
        assert result.num_trials == 10

    @pytest.mark.asyncio
    async def test_some_failures(self, metric):
        """Test with mix of success and failures."""
        metadata_list = [
            ResponseMetadata(response_text="OK", latency_seconds=1.0, model="test", provider="test"),
            ResponseMetadata(response_text="", latency_seconds=0.5, model="test", provider="test", error="API Error"),
            ResponseMetadata(response_text="OK", latency_seconds=1.0, model="test", provider="test"),
            ResponseMetadata(response_text="", latency_seconds=0.5, model="test", provider="test", error="Timeout", timeout=True),
        ]

        data = {"metadata_list": metadata_list, "provider": "test", "model": "test"}

        result = await metric.calculate(data)

        assert result.error_rate == 50.0  # 2/4
        assert result.timeout_rate == 25.0  # 1/4
        assert result.successful_trials == 2
        assert result.failed_trials == 2
        assert result.timeout_trials == 1

    @pytest.mark.asyncio
    async def test_exception_classification(self, metric):
        """Test exception type classification."""
        metadata_list = [
            ResponseMetadata(response_text="", latency_seconds=0.5, model="test", provider="test", error="Request timed out"),
            ResponseMetadata(response_text="", latency_seconds=0.5, model="test", provider="test", error="Rate limit exceeded"),
            ResponseMetadata(response_text="", latency_seconds=0.5, model="test", provider="test", error="401 Unauthorized"),
        ]

        data = {"metadata_list": metadata_list, "provider": "test", "model": "test"}

        result = await metric.calculate(data)

        assert "TimeoutError" in result.exception_counts
        assert "RateLimitError" in result.exception_counts
        assert "AuthenticationError" in result.exception_counts

    def test_extract_error_type_timeout(self, metric):
        """Test timeout error extraction."""
        assert metric._extract_error_type("Request timed out") == "TimeoutError"
        assert metric._extract_error_type("Connection timeout") == "TimeoutError"

    def test_extract_error_type_rate_limit(self, metric):
        """Test rate limit error extraction."""
        assert metric._extract_error_type("Rate limit exceeded") == "RateLimitError"
        assert metric._extract_error_type("RateLimitError") == "RateLimitError"

    def test_extract_error_type_auth(self, metric):
        """Test authentication error extraction."""
        assert metric._extract_error_type("401 Unauthorized") == "AuthenticationError"
        assert metric._extract_error_type("Authentication failed") == "AuthenticationError"

    def test_validate_valid_result(self, metric):
        """Test validation of valid result."""
        from cert.benchmark.types import RobustnessResult

        result = RobustnessResult(
            provider="test",
            model="test",
            error_rate=10.0,
            timeout_rate=5.0,
            exception_counts={"TimeoutError": 1},
            successful_trials=9,
            failed_trials=1,
            timeout_trials=1,
            num_trials=10,
        )

        assert metric.validate(result) is True

    def test_validate_invalid_rate(self, metric):
        """Test validation catches invalid rates."""
        from cert.benchmark.types import RobustnessResult

        result = RobustnessResult(
            provider="test",
            model="test",
            error_rate=150.0,  # Invalid: > 100
            timeout_rate=5.0,
            exception_counts={},
            successful_trials=9,
            failed_trials=1,
            timeout_trials=0,
            num_trials=10,
        )

        assert metric.validate(result) is False
