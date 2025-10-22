"""Unit tests for ConsistencyMetric."""

import pytest

from cert.benchmark.metrics.consistency import ConsistencyMetric
from cert.benchmark.types import ConsistencyResult


class TestConsistencyMetric:
    """Test suite for ConsistencyMetric."""

    @pytest.fixture
    def metric(self):
        """Create ConsistencyMetric instance."""
        return ConsistencyMetric(config={"embedding_model": "all-MiniLM-L6-v2"})

    @pytest.mark.asyncio
    async def test_calculate_consistent_responses(self, metric):
        """Test consistency calculation with similar responses."""
        responses = [
            "The key factors are planning and execution.",
            "Planning and execution are the key factors.",
            "Key factors include planning and execution.",
            "The main factors are planning and execution.",
            "Planning and execution are key factors.",
        ]

        data = {"responses": responses, "provider": "test", "model": "test"}

        result = await metric.calculate(data)

        assert isinstance(result, ConsistencyResult)
        assert result.provider == "test"
        assert result.model == "test"
        assert result.num_trials == 5
        # Consistent responses should have high consistency score
        assert result.consistency_score > 0.7
        assert result.mean_distance >= 0
        assert result.std_distance >= 0

    @pytest.mark.asyncio
    async def test_calculate_inconsistent_responses(self, metric):
        """Test consistency calculation with diverse responses."""
        responses = [
            "Strategic planning is important.",
            "User authentication requires secure passwords.",
            "Machine learning needs training data.",
            "Database optimization improves performance.",
            "The weather is sunny today.",
        ]

        data = {"responses": responses, "provider": "test", "model": "test"}

        result = await metric.calculate(data)

        # Inconsistent responses should have lower consistency score
        assert result.consistency_score < 0.7

    @pytest.mark.asyncio
    async def test_missing_responses(self, metric):
        """Test error handling for missing responses."""
        data = {"provider": "test", "model": "test"}

        with pytest.raises(ValueError, match="At least 2 valid responses required"):
            await metric.calculate(data)

    @pytest.mark.asyncio
    async def test_insufficient_responses(self, metric):
        """Test error handling for insufficient responses."""
        data = {"responses": ["Only one response"], "provider": "test", "model": "test"}

        with pytest.raises(ValueError, match="At least 2 valid responses required"):
            await metric.calculate(data)

    @pytest.mark.asyncio
    async def test_empty_responses_filtered(self, metric):
        """Test that empty responses are filtered out."""
        responses = [
            "Valid response one",
            "",  # Empty
            "Valid response two",
            "   ",  # Whitespace only
            "Valid response three",
        ]

        data = {"responses": responses, "provider": "test", "model": "test"}

        result = await metric.calculate(data)

        # Should only count 3 valid responses
        assert result.num_trials == 3

    def test_validate_valid_result(self, metric):
        """Test validation of valid result."""
        result = ConsistencyResult(
            provider="test",
            model="test",
            consistency_score=0.85,
            mean_distance=0.15,
            std_distance=0.05,
            num_trials=10,
        )

        assert metric.validate(result) is True

    def test_validate_invalid_score(self, metric):
        """Test validation catches invalid scores."""
        result = ConsistencyResult(
            provider="test",
            model="test",
            consistency_score=1.5,  # Invalid: > 1.0
            mean_distance=0.15,
            std_distance=0.05,
            num_trials=10,
        )

        assert metric.validate(result) is False
