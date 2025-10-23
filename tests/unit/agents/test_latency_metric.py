"""Unit tests for LatencyMetric."""

import pytest
import numpy as np

from cert.agents.metrics.latency import LatencyMetric
from cert.agents.types import LatencyResult


class TestLatencyMetric:
    """Test suite for LatencyMetric."""

    @pytest.fixture
    def metric(self):
        """Create LatencyMetric instance."""
        return LatencyMetric()

    @pytest.mark.asyncio
    async def test_calculate_basic(self, metric):
        """Test basic latency calculation."""
        data = {
            "timings": [0.5, 0.6, 0.55, 0.58, 0.52],
            "provider": "test-provider",
            "model": "test-model",
        }

        result = await metric.calculate(data)

        assert isinstance(result, LatencyResult)
        assert result.provider == "test-provider"
        assert result.model == "test-model"
        assert result.num_trials == 5
        assert 0.5 <= result.mean_latency_seconds <= 0.6
        assert result.min_latency_seconds == 0.5
        assert result.max_latency_seconds == 0.6

    @pytest.mark.asyncio
    async def test_percentiles_ordered(self, metric):
        """Test that percentiles are properly ordered."""
        data = {
            "timings": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            "provider": "test",
            "model": "test",
        }

        result = await metric.calculate(data)

        # Verify percentile ordering
        assert result.min_latency_seconds <= result.p50_latency_seconds
        assert result.p50_latency_seconds <= result.p95_latency_seconds
        assert result.p95_latency_seconds <= result.p99_latency_seconds
        assert result.p99_latency_seconds <= result.max_latency_seconds

    @pytest.mark.asyncio
    async def test_throughput_calculation(self, metric):
        """Test tokens per second calculation."""
        data = {
            "timings": [1.0, 1.0, 1.0],
            "tokens_output": [100, 100, 100],
            "provider": "test",
            "model": "test",
        }

        result = await metric.calculate(data)

        assert result.tokens_per_second is not None
        assert result.tokens_per_second == 100.0  # 100 tokens / 1 second

    @pytest.mark.asyncio
    async def test_missing_timings(self, metric):
        """Test error handling for missing timings."""
        data = {"provider": "test", "model": "test"}

        with pytest.raises(ValueError, match="No timing data"):
            await metric.calculate(data)

    @pytest.mark.asyncio
    async def test_insufficient_samples(self, metric):
        """Test error handling for insufficient samples."""
        data = {"timings": [0.5], "provider": "test", "model": "test"}

        with pytest.raises(ValueError, match="At least 2 timing samples"):
            await metric.calculate(data)

    @pytest.mark.asyncio
    async def test_missing_provider_model(self, metric):
        """Test error handling for missing provider/model."""
        data = {"timings": [0.5, 0.6]}

        with pytest.raises(ValueError, match="Provider and model must be specified"):
            await metric.calculate(data)

    def test_validate_valid_result(self, metric):
        """Test validation of valid result."""
        result = LatencyResult(
            provider="test",
            model="test",
            mean_latency_seconds=0.5,
            std_latency_seconds=0.1,
            min_latency_seconds=0.4,
            max_latency_seconds=0.6,
            p50_latency_seconds=0.5,
            p95_latency_seconds=0.58,
            p99_latency_seconds=0.59,
            tokens_per_second=100.0,
            num_trials=10,
        )

        assert metric.validate(result) is True

    def test_validate_negative_latency(self, metric):
        """Test validation catches negative latencies."""
        result = LatencyResult(
            provider="test",
            model="test",
            mean_latency_seconds=-0.5,  # Invalid
            std_latency_seconds=0.1,
            min_latency_seconds=0.4,
            max_latency_seconds=0.6,
            p50_latency_seconds=0.5,
            p95_latency_seconds=0.58,
            p99_latency_seconds=0.59,
            tokens_per_second=None,
            num_trials=10,
        )

        assert metric.validate(result) is False

    def test_validate_unordered_percentiles(self, metric):
        """Test validation catches unordered percentiles."""
        result = LatencyResult(
            provider="test",
            model="test",
            mean_latency_seconds=0.5,
            std_latency_seconds=0.1,
            min_latency_seconds=0.4,
            max_latency_seconds=0.6,
            p50_latency_seconds=0.5,
            p95_latency_seconds=0.3,  # Invalid: p95 < p50
            p99_latency_seconds=0.59,
            tokens_per_second=None,
            num_trials=10,
        )

        assert metric.validate(result) is False
