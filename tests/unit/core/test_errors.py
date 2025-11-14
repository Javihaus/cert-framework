"""Unit tests for error handling framework."""

from cert.core.errors import (
    AnalysisError,
    CERTError,
    CircuitBreakerOpen,
    GPUOutOfMemoryError,
    InvalidInputError,
    ResourceLoadError,
)


class TestCERTError:
    """Test base error class."""

    def test_error_creation(self):
        """Test basic error creation."""
        error = CERTError(
            message="Test error",
            error_type="TestError",
            recoverable=True,
            retry_after=5.0,
        )

        assert str(error) == "Test error"
        assert error.error_type == "TestError"
        assert error.recoverable is True
        assert error.retry_after == 5.0

    def test_error_to_dict(self):
        """Test error serialization."""
        error = CERTError(
            message="Test error",
            error_type="TestError",
            recoverable=False,
            context={"key": "value"},
        )

        error_dict = error.to_dict()

        assert error_dict["error"] == "TestError"
        assert error_dict["message"] == "Test error"
        assert error_dict["recoverable"] is False
        assert error_dict["context"]["key"] == "value"


class TestSpecificErrors:
    """Test specific error types."""

    def test_resource_load_error(self):
        """Test ResourceLoadError."""
        error = ResourceLoadError("Failed to load model")

        assert error.error_type == "ResourceLoadError"
        assert error.recoverable is True
        assert "Failed to load model" in str(error)

    def test_gpu_oom_error(self):
        """Test GPUOutOfMemoryError."""
        error = GPUOutOfMemoryError()

        assert error.error_type == "GPUOutOfMemoryError"
        assert error.recoverable is True
        assert "GPU memory exhausted" in str(error)

    def test_invalid_input_error(self):
        """Test InvalidInputError."""
        error = InvalidInputError("Invalid prompt")

        assert error.error_type == "InvalidInputError"
        assert error.recoverable is False
        assert "Invalid prompt" in str(error)

    def test_circuit_breaker_open(self):
        """Test CircuitBreakerOpen."""
        error = CircuitBreakerOpen(service="test-service")

        assert error.error_type == "CircuitBreakerOpen"
        assert error.recoverable is True
        assert error.retry_after == 30.0
        assert "test-service" in str(error)

    def test_analysis_error(self):
        """Test AnalysisError."""
        error = AnalysisError(
            error_type="CustomAnalysisError",
            message="Analysis failed",
            recoverable=True,
        )

        assert error.error_type == "CustomAnalysisError"
        assert error.is_valid() is False
