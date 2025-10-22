"""Unit tests for BenchmarkConfig."""

import pytest

from cert.benchmark.config import BenchmarkConfig


class TestBenchmarkConfig:
    """Test suite for BenchmarkConfig."""

    def test_default_config(self):
        """Test default configuration values."""
        config = BenchmarkConfig()

        assert config.consistency_trials == 20
        assert config.performance_trials == 15
        assert config.temperature == 0.7
        assert config.max_tokens == 1024
        assert config.timeout == 30
        assert "consistency" in config.enabled_metrics

    def test_custom_config(self):
        """Test custom configuration."""
        config = BenchmarkConfig(
            consistency_trials=50,
            performance_trials=30,
            temperature=0.5,
            providers={"anthropic": ["claude-3-5-haiku-20241022"]},
        )

        assert config.consistency_trials == 50
        assert config.performance_trials == 30
        assert config.temperature == 0.5

    def test_invalid_consistency_trials(self):
        """Test validation of consistency trials."""
        with pytest.raises(ValueError, match="consistency_trials must be >= 10"):
            BenchmarkConfig(consistency_trials=5)

    def test_invalid_performance_trials(self):
        """Test validation of performance trials."""
        with pytest.raises(ValueError, match="performance_trials must be >= 5"):
            BenchmarkConfig(performance_trials=2)

    def test_invalid_temperature(self):
        """Test validation of temperature."""
        with pytest.raises(ValueError, match="temperature must be between 0.0 and 1.0"):
            BenchmarkConfig(temperature=1.5)

    def test_invalid_timeout(self):
        """Test validation of timeout."""
        with pytest.raises(ValueError, match="timeout must be positive"):
            BenchmarkConfig(timeout=-5)

    def test_invalid_max_tokens(self):
        """Test validation of max_tokens."""
        with pytest.raises(ValueError, match="max_tokens must be positive"):
            BenchmarkConfig(max_tokens=0)

    def test_invalid_providers(self):
        """Test validation of providers."""
        with pytest.raises(ValueError, match="At least one provider must be configured"):
            BenchmarkConfig(providers={})

    def test_empty_models_list(self):
        """Test validation of empty models list."""
        with pytest.raises(ValueError, match="has no models configured"):
            BenchmarkConfig(providers={"anthropic": []})

    def test_invalid_metric(self):
        """Test validation of invalid metric names."""
        with pytest.raises(ValueError, match="Invalid metric"):
            BenchmarkConfig(enabled_metrics=["consistency", "invalid_metric"])

    def test_is_metric_enabled(self):
        """Test metric enabled checking."""
        config = BenchmarkConfig(enabled_metrics=["consistency", "performance"])

        assert config.is_metric_enabled("consistency") is True
        assert config.is_metric_enabled("performance") is True
        assert config.is_metric_enabled("latency") is False

    def test_get_all_model_combinations(self):
        """Test getting all provider/model combinations."""
        config = BenchmarkConfig(
            providers={
                "anthropic": ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"],
                "openai": ["gpt-4o-mini"],
            }
        )

        combinations = config.get_all_model_combinations()

        assert len(combinations) == 3
        assert ("anthropic", "claude-3-5-haiku-20241022") in combinations
        assert ("anthropic", "claude-3-5-sonnet-20241022") in combinations
        assert ("openai", "gpt-4o-mini") in combinations
