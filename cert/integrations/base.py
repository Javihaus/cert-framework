"""
Base Connector Architecture for CERT Framework
================================================

This module provides the foundational classes for building platform connectors
that automatically trace AI/LLM calls across different platforms.

The connector architecture follows these principles:
1. Standard trace format across all platforms
2. Error isolation - connector failures never break user code
3. Circuit breaker pattern for reliability
4. Abstract interface for platform-specific logic
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass
class TracedCall:
    """
    Standard format for all traced AI/LLM calls.

    This unified structure ensures consistency across all platforms
    and makes it easy to aggregate, analyze, and export traces.

    Attributes:
        timestamp: ISO 8601 formatted timestamp with Z suffix
        platform: Platform identifier (e.g., "openai", "anthropic", "bedrock")
        model: Model identifier (e.g., "gpt-4-turbo", "claude-3-opus")
        input_data: Input to the model (prompt, messages, etc.)
        output_data: Output from the model
        metadata: Platform-specific metadata (tokens, finish_reason, etc.)
        cost: Calculated cost in USD (None if unable to calculate)
        error: Error message if the call failed (None if successful)
    """

    timestamp: str
    platform: str
    model: str
    input_data: Any
    output_data: Any
    metadata: Dict[str, Any] = field(default_factory=dict)
    cost: Optional[float] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "timestamp": self.timestamp,
            "platform": self.platform,
            "model": self.model,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "metadata": self.metadata,
            "cost": self.cost,
            "error": self.error,
        }


class ConnectorAdapter(ABC):
    """
    Abstract base class for all platform connectors.

    Each connector must implement the abstract methods to handle
    platform-specific integration patterns while maintaining a
    consistent interface.

    Features:
    - Circuit breaker: Automatically disables after repeated failures
    - Error isolation: Exceptions are caught and logged, never propagated
    - Flexible integration: Subclasses choose their integration approach

    Example:
        class MyPlatformConnector(ConnectorAdapter):
            def activate(self):
                # Install hooks into the platform
                pass

            def extract_metadata(self, call_data):
                # Extract platform-specific metadata
                return {"tokens": call_data.usage.total_tokens}

            def calculate_cost(self, call_data):
                # Calculate cost based on usage
                return call_data.usage.total_tokens * 0.00002
    """

    def __init__(self, tracer):
        """
        Initialize the connector.

        Args:
            tracer: The CERT tracer instance for logging traces
        """
        self.tracer = tracer
        self.enabled = True
        self.failure_count = 0
        self.max_failures = 3  # Disable after this many consecutive failures

    @abstractmethod
    def activate(self) -> None:
        """
        Install hooks into the target platform.

        This method is called once during connector initialization.
        Implementations should:
        - Install monkey patches if using API interception
        - Register callbacks if using hook-based integration
        - Wrap SDK clients if using proxy pattern

        The activation should be idempotent and safe to call multiple times.

        Raises:
            ImportError: If the platform SDK is not installed
            Exception: If activation fails for any reason
        """
        pass

    @abstractmethod
    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """
        Extract platform-specific metadata from call data.

        Metadata should include information useful for debugging and analysis:
        - Token counts (prompt_tokens, completion_tokens, total_tokens)
        - Model parameters (temperature, max_tokens, etc.)
        - Finish reason (stop, length, content_filter, etc.)
        - Request/response IDs
        - Latency information

        Args:
            call_data: Platform-specific request/response data

        Returns:
            Dictionary of metadata key-value pairs
        """
        pass

    @abstractmethod
    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """
        Calculate the cost of the API call in USD.

        Cost calculation should be based on:
        - Token usage (input tokens, output tokens)
        - Model pricing (different models have different rates)
        - Any additional charges (fine-tuning, custom models, etc.)

        Args:
            call_data: Platform-specific request/response data

        Returns:
            Cost in USD, or None if cost cannot be calculated
        """
        pass

    def log_call(self, traced_call: TracedCall) -> None:
        """
        Log a traced call with circuit breaker protection.

        This method handles the actual logging and implements the circuit
        breaker pattern to prevent cascading failures.

        Circuit breaker behavior:
        - Tracks consecutive failures
        - Disables connector after max_failures
        - Resets failure count on success

        Args:
            traced_call: The TracedCall object to log
        """
        if not self.enabled:
            # Circuit breaker is open, skip logging
            return

        try:
            # Log the trace
            self.tracer.log_trace(traced_call.to_dict())

            # Reset failure count on success
            self.failure_count = 0

        except Exception as e:
            # Increment failure count
            self.failure_count += 1

            # Open circuit breaker if threshold reached
            if self.failure_count >= self.max_failures:
                self.enabled = False
                print(
                    f"WARNING: CERT connector '{self.__class__.__name__}' "
                    f"disabled after {self.max_failures} consecutive failures: {e}"
                )
            else:
                print(
                    f"WARNING: CERT connector '{self.__class__.__name__}' "
                    f"logging failed ({self.failure_count}/{self.max_failures}): {e}"
                )

    def reset_circuit_breaker(self) -> None:
        """
        Manually reset the circuit breaker.

        This can be called to re-enable a disabled connector after
        addressing the underlying issue.
        """
        self.enabled = True
        self.failure_count = 0

    def is_healthy(self) -> bool:
        """
        Check if the connector is healthy and active.

        Returns:
            True if the connector is enabled, False otherwise
        """
        return self.enabled

    @staticmethod
    def format_timestamp(dt: Optional[datetime] = None) -> str:
        """
        Format a datetime object as an ISO 8601 string with Z suffix.

        Args:
            dt: Datetime object to format (defaults to current UTC time)

        Returns:
            ISO 8601 formatted timestamp string
        """
        if dt is None:
            dt = datetime.utcnow()
        return dt.isoformat() + "Z"


class AsyncConnectorAdapter(ConnectorAdapter):
    """
    Base class for connectors that need to handle async operations.

    Some platforms (like streaming responses) require async handling.
    This class extends ConnectorAdapter with async-aware methods.
    """

    async def log_call_async(self, traced_call: TracedCall) -> None:
        """
        Async version of log_call for non-blocking logging.

        Args:
            traced_call: The TracedCall object to log
        """
        # For now, we just call the sync version
        # In the future, this could use async I/O for better performance
        self.log_call(traced_call)
