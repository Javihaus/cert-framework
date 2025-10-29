"""Integration tests for core infrastructure."""

import pytest
import time
from cert.core.resources import ModelResource
from cert.core.errors import CERTError, ResourceLoadError
from cert.core.circuit_breaker import CircuitBreaker
from cert.core.health import HealthChecker, HealthStatus
from cert.observability.logging import configure_logging
from cert.observability.metrics import MetricsCollector


class TestResourceManagement:
    """Test resource lifecycle management."""

    def test_context_manager(self):
        """Test resource cleanup with context manager."""

        class TestResource(ModelResource):
            def _load_model(self):
                return {"test": "model"}

        with TestResource("test-model") as resource:
            resource.load()
            assert resource.is_loaded()
            assert resource.model == {"test": "model"}

        # Should be unloaded after context exit
        assert not resource.is_loaded()

    def test_health_check(self):
        """Test health check aggregation."""
        checker = HealthChecker()

        # Register checks
        checker.register("test1", lambda: True)
        checker.register("test2", lambda: True)

        health = checker.check_health()
        assert health.status == HealthStatus.HEALTHY
        assert health.checks["test1"] is True
        assert health.checks["test2"] is True

    def test_health_check_degraded(self):
        """Test degraded health status."""
        checker = HealthChecker()

        checker.register("test1", lambda: True)
        checker.register("test2", lambda: False)

        health = checker.check_health()
        assert health.status == HealthStatus.DEGRADED


class TestCircuitBreaker:
    """Test circuit breaker functionality."""

    def test_circuit_breaker_integration(self):
        """Test circuit breaker in real scenario."""
        breaker = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

        call_count = [0]

        def unreliable_service():
            call_count[0] += 1
            if call_count[0] <= 2:
                raise Exception("Service unavailable")
            return "success"

        # First two calls should fail and open circuit
        with pytest.raises(Exception):
            breaker.call(unreliable_service)

        with pytest.raises(Exception):
            breaker.call(unreliable_service)

        # Circuit should be open
        assert breaker.is_open()

        # Wait for recovery
        time.sleep(0.15)

        # Should transition to HALF_OPEN
        assert not breaker.is_open()

        # Next call should succeed
        result = breaker.call(unreliable_service)
        assert result == "success"


class TestObservability:
    """Test observability infrastructure."""

    def test_structured_logging(self):
        """Test structured logging configuration."""
        import tempfile

        with tempfile.NamedTemporaryFile(delete=False) as f:
            log_file = f.name

        configure_logging(
            level="INFO",
            format="json",
            output="file",
            log_file=log_file,
        )

        import logging

        logger = logging.getLogger("cert")
        logger.info("Test message", extra={"key": "value"})

        # Verify log file created
        import os

        assert os.path.exists(log_file)

        # Clean up
        os.remove(log_file)

    def test_metrics_collection(self):
        """Test metrics collection."""
        metrics = MetricsCollector(enabled=True)

        # Record some metrics
        metrics.record_request("test_service", "success", duration=1.5, operation="test")
        metrics.record_error("test_service", "TestError")
        metrics.record_cache_hit("test_cache")
        metrics.record_cache_miss("test_cache")

        # Metrics should be recorded (no assertions needed, just verify no errors)
        assert True


class TestErrorHandling:
    """Test error handling framework."""

    def test_error_serialization(self):
        """Test error to dict conversion."""
        error = ResourceLoadError("Test error", context={"key": "value"})

        error_dict = error.to_dict()

        assert error_dict["error"] == "ResourceLoadError"
        assert error_dict["message"] == "Test error"
        assert error_dict["recoverable"] is True
        assert error_dict["context"]["key"] == "value"

    def test_error_hierarchy(self):
        """Test error inheritance."""
        error = ResourceLoadError("Test")

        assert isinstance(error, CERTError)
        assert isinstance(error, Exception)


@pytest.mark.integration
class TestIntegration:
    """End-to-end integration tests."""

    def test_full_stack(self):
        """Test full stack integration."""
        # Configure logging
        configure_logging(level="INFO", format="human", output="stdout")

        # Initialize metrics
        metrics = MetricsCollector(enabled=True)

        # Create health checker
        checker = HealthChecker()
        checker.register("test", lambda: True)

        # Create circuit breaker
        breaker = CircuitBreaker()

        # Everything should work together
        health = checker.check_health()
        assert health.status == HealthStatus.HEALTHY

        def test_operation():
            return "success"

        result = breaker.call(test_operation)
        assert result == "success"

        metrics.record_request("test", "success", duration=0.1, operation="test")

        # Test passes if no exceptions
        assert True
