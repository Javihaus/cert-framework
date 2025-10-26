"""Test basic imports and API availability."""

import pytest


class TestImports:
    """Test all modules can be imported."""

    def test_core_imports(self):
        """Test core infrastructure imports."""
        from cert.core import (
            CERTError,
            ResourceManager,
            ModelResource,
            retry,
            CircuitBreaker,
            HealthChecker,
        )
        assert CERTError is not None
        assert ResourceManager is not None
        assert ModelResource is not None
        assert retry is not None
        assert CircuitBreaker is not None
        assert HealthChecker is not None

    def test_observability_imports(self):
        """Test observability imports."""
        from cert.observability import (
            configure_logging,
            MetricsCollector,
        )
        assert configure_logging is not None
        assert MetricsCollector is not None

    def test_trajectory_imports(self):
        """Test trajectory (Hamiltonian) imports."""
        from cert.trajectory import (
            HamiltonianMonitor,
            HamiltonianEngine,
            HamiltonianModelResource,
            TrajectoryConfig,
        )
        assert HamiltonianMonitor is not None
        assert HamiltonianEngine is not None
        assert HamiltonianModelResource is not None
        assert TrajectoryConfig is not None

    def test_coordination_imports(self):
        """Test coordination imports."""
        from cert.coordination import (
            AgentResponse,
            CoordinationMetrics,
            AnthropicClientWithResilience,
            CoordinationOrchestrator,
            QualityEvaluator,
            BaselineMeasurer,
        )
        assert AgentResponse is not None
        assert CoordinationMetrics is not None
        assert AnthropicClientWithResilience is not None
        assert CoordinationOrchestrator is not None
        assert QualityEvaluator is not None
        assert BaselineMeasurer is not None

    def test_backward_compatibility(self):
        """Test v3.x API still available."""
        from cert.trajectory import (
            ReasoningTrajectoryMonitor,
            load_model_for_monitoring,
        )
        assert ReasoningTrajectoryMonitor is not None
        assert load_model_for_monitoring is not None


class TestAPIAvailability:
    """Test API endpoints are accessible."""

    def test_trajectory_api(self):
        """Test trajectory API instantiation."""
        from cert.trajectory import HamiltonianMonitor, TrajectoryConfig

        config = TrajectoryConfig(
            perplexity_threshold=50.0,
            entropy_threshold=2.5,
        )

        # Should instantiate without errors
        # (won't load model without preload=True)
        monitor = HamiltonianMonitor(
            model_name="gpt2",
            config=config,
            preload=False,
        )

        assert monitor is not None
        assert monitor.config.perplexity_threshold == 50.0

    def test_coordination_types(self):
        """Test coordination types."""
        from cert.coordination import AgentResponse, CoordinationMetrics
        from datetime import datetime

        response = AgentResponse(
            agent_id="test_agent",
            response="Test response",
        )

        assert response.agent_id == "test_agent"
        assert response.response == "Test response"

        # Test to_dict
        response_dict = response.to_dict()
        assert response_dict["agent_id"] == "test_agent"


class TestConfiguration:
    """Test configuration management."""

    def test_trajectory_config(self):
        """Test trajectory configuration."""
        from cert.trajectory import TrajectoryConfig

        config = TrajectoryConfig(
            perplexity_threshold=100.0,
            entropy_threshold=3.0,
            max_new_tokens=200,
        )

        assert config.perplexity_threshold == 100.0
        assert config.entropy_threshold == 3.0
        assert config.max_new_tokens == 200

        # Test to_dict
        config_dict = config.to_dict()
        assert config_dict["perplexity_threshold"] == 100.0

    def test_logging_config(self):
        """Test logging configuration."""
        from cert.observability import configure_logging

        # Should configure without errors
        configure_logging(
            level="INFO",
            format="human",
            output="stdout",
        )

        # Test passes if no exception
        assert True

    def test_metrics_config(self):
        """Test metrics configuration."""
        from cert.observability import MetricsCollector

        metrics = MetricsCollector(
            namespace="test",
            enabled=True,
        )

        assert metrics.namespace == "test"
        assert metrics.enabled is True
