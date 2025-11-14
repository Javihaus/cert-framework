"""
Standard Test Suite for CERT Connectors
========================================

This module provides a base test class that all connector tests should inherit from.
It enforces consistency and ensures that all connectors meet minimum quality standards.

All connectors MUST pass these tests to be included in the official registry.

Usage:
    class TestMyConnector(ConnectorTestBase):
        def create_connector(self):
            return MyConnector(self.tracer)

        def make_test_call(self):
            # Make an actual API call to your platform
            return client.chat.completions.create(...)

        def get_expected_platform_name(self):
            return "myplatform"
"""

import time
import pytest
from abc import ABC, abstractmethod
from typing import Any, Optional
import json
import tempfile
import os

from cert.integrations.base import ConnectorAdapter, TracedCall


class MockTracer:
    """
    Mock tracer for testing connectors in isolation.

    This tracer captures logged traces in memory so tests can
    verify that connectors are logging correctly.
    """

    def __init__(self):
        self.traces = []
        self.log_file = None

    def log_trace(self, trace_data: dict) -> None:
        """
        Log a trace to memory.

        Args:
            trace_data: Dictionary representation of a TracedCall
        """
        self.traces.append(trace_data)

        # Also log to file if configured
        if self.log_file:
            with open(self.log_file, "a") as f:
                f.write(json.dumps(trace_data) + "\n")

    def get_traces(self) -> list:
        """Get all logged traces."""
        return self.traces.copy()

    def get_last_trace(self) -> Optional[dict]:
        """Get the most recently logged trace."""
        return self.traces[-1] if self.traces else None

    def clear_traces(self) -> None:
        """Clear all logged traces."""
        self.traces = []

    def use_file(self, filepath: str) -> None:
        """Configure tracer to also log to a file."""
        self.log_file = filepath


class ConnectorTestBase(ABC):
    """
    Base class for connector integration tests.

    Subclasses must implement the abstract methods to provide
    connector-specific test logic.

    This test suite verifies:
    1. Basic calls are traced correctly
    2. Streaming responses work (if applicable)
    3. Async calls work (if applicable)
    4. Errors are handled gracefully
    5. Performance overhead is acceptable
    """

    @pytest.fixture(autouse=True)
    def setup(self):
        """
        Set up test fixtures.

        This runs before each test method.
        """
        self.tracer = MockTracer()
        self.connector = self.create_connector()
        self.connector.activate()
        yield
        # Cleanup after each test
        self.tracer.clear_traces()

    @abstractmethod
    def create_connector(self) -> ConnectorAdapter:
        """
        Create an instance of the connector being tested.

        Returns:
            Configured connector instance
        """
        pass

    @abstractmethod
    def make_test_call(self) -> Any:
        """
        Make a test API call to the platform.

        This should make a real API call that will be traced by the connector.
        The call should be simple and fast (avoid expensive models if possible).

        Returns:
            The response from the API call
        """
        pass

    @abstractmethod
    def get_expected_platform_name(self) -> str:
        """
        Get the expected platform identifier.

        Returns:
            Platform name that should appear in traces (e.g., "openai")
        """
        pass

    # Optional methods that can be overridden

    def make_streaming_call(self) -> Any:
        """
        Make a streaming API call (if supported).

        Override this if your platform supports streaming responses.

        Returns:
            Streaming response object

        Raises:
            NotImplementedError: If streaming is not supported
        """
        raise NotImplementedError("Streaming not implemented for this connector")

    def make_async_call(self) -> Any:
        """
        Make an async API call (if supported).

        Override this if your platform supports async calls.

        Returns:
            Async response object

        Raises:
            NotImplementedError: If async is not supported
        """
        raise NotImplementedError("Async not implemented for this connector")

    def get_expected_model_name(self) -> Optional[str]:
        """
        Get the expected model name from test calls.

        Returns:
            Model name that should appear in traces, or None to skip check
        """
        return None

    # Standard test cases

    def test_basic_call_traced(self):
        """
        Verify that a simple API call gets traced correctly.

        This test ensures:
        - The call is logged to the tracer
        - All required fields are present
        - The platform name is correct
        """
        # Make a test call
        response = self.make_test_call()

        # Verify we got a response
        assert response is not None, "Test call returned None"

        # Verify trace was logged
        traces = self.tracer.get_traces()
        assert len(traces) > 0, "No traces were logged"

        # Get the last trace
        trace = self.tracer.get_last_trace()

        # Verify required fields
        assert "timestamp" in trace, "Missing timestamp field"
        assert "platform" in trace, "Missing platform field"
        assert "model" in trace, "Missing model field"
        assert "input_data" in trace, "Missing input_data field"
        assert "output_data" in trace, "Missing output_data field"
        assert "metadata" in trace, "Missing metadata field"

        # Verify platform name
        expected_platform = self.get_expected_platform_name()
        assert trace["platform"] == expected_platform, (
            f"Expected platform '{expected_platform}', got '{trace['platform']}'"
        )

        # Verify model name if provided
        expected_model = self.get_expected_model_name()
        if expected_model:
            assert trace["model"] == expected_model, (
                f"Expected model '{expected_model}', got '{trace['model']}'"
            )

        # Verify input and output are present
        assert trace["input_data"] is not None, "input_data is None"
        assert trace["output_data"] is not None, "output_data is None"

    def test_streaming_call_traced(self):
        """
        Verify that streaming responses are traced correctly.

        This test is skipped if streaming is not implemented.
        """
        try:
            stream = self.make_streaming_call()
        except NotImplementedError:
            pytest.skip("Streaming not implemented for this connector")
            return

        # Consume the stream
        chunks = []
        for chunk in stream:
            chunks.append(chunk)

        # Verify we got chunks
        assert len(chunks) > 0, "No chunks received from stream"

        # Verify trace was logged
        traces = self.tracer.get_traces()
        assert len(traces) > 0, "No traces were logged for streaming call"

        # Verify the trace has complete data
        trace = self.tracer.get_last_trace()
        assert trace["output_data"] is not None, "Streaming trace has no output_data"

    @pytest.mark.asyncio
    async def test_async_call_traced(self):
        """
        Verify that async calls are traced correctly.

        This test is skipped if async is not implemented.
        """
        try:
            response = await self.make_async_call()
        except NotImplementedError:
            pytest.skip("Async not implemented for this connector")
            return

        # Verify response
        assert response is not None, "Async call returned None"

        # Verify trace was logged
        traces = self.tracer.get_traces()
        assert len(traces) > 0, "No traces were logged for async call"

    def test_error_isolation(self):
        """
        Verify that connector errors don't break user code.

        This test ensures that if the tracer fails, the original
        API call still completes successfully.
        """
        # Make the tracer fail
        original_log = self.tracer.log_trace

        def failing_log(trace_data):
            raise Exception("Simulated tracer failure")

        self.tracer.log_trace = failing_log

        # Make a call - this should NOT raise an exception
        try:
            response = self.make_test_call()
            assert response is not None, "Call failed when tracer was broken"
        except Exception as e:
            pytest.fail(
                f"Connector did not isolate tracer error - user code broke: {e}"
            )
        finally:
            # Restore tracer
            self.tracer.log_trace = original_log

    def test_overhead_acceptable(self):
        """
        Verify that connector overhead is < 10ms per call.

        This ensures connectors don't significantly slow down user code.
        """
        # Measure baseline (without connector)
        self.connector.enabled = False
        baseline_times = []

        for _ in range(5):
            start = time.perf_counter()
            self.make_test_call()
            baseline_times.append(time.perf_counter() - start)

        baseline_avg = sum(baseline_times) / len(baseline_times)

        # Measure with connector
        self.connector.enabled = True
        connector_times = []

        for _ in range(5):
            start = time.perf_counter()
            self.make_test_call()
            connector_times.append(time.perf_counter() - start)

        connector_avg = sum(connector_times) / len(connector_times)

        # Calculate overhead
        overhead = connector_avg - baseline_avg
        overhead_ms = overhead * 1000

        # Verify overhead is acceptable
        assert overhead_ms < 10, (
            f"Connector overhead too high: {overhead_ms:.2f}ms "
            f"(baseline: {baseline_avg*1000:.2f}ms, "
            f"with connector: {connector_avg*1000:.2f}ms)"
        )

    def test_circuit_breaker_activates(self):
        """
        Verify that the circuit breaker opens after repeated failures.
        """
        # Make the tracer fail
        def failing_log(trace_data):
            raise Exception("Simulated failure")

        self.tracer.log_trace = failing_log

        # Make calls until circuit breaker opens
        for i in range(5):
            try:
                self.make_test_call()
            except:
                pass  # Ignore errors from the actual call

        # Verify circuit breaker opened
        assert not self.connector.is_healthy(), (
            "Circuit breaker did not open after repeated failures"
        )

    def test_metadata_extraction(self):
        """
        Verify that metadata is extracted correctly.
        """
        # Make a call
        self.make_test_call()

        # Get the trace
        trace = self.tracer.get_last_trace()

        # Verify metadata exists and is a dict
        assert "metadata" in trace, "No metadata in trace"
        assert isinstance(trace["metadata"], dict), "Metadata is not a dict"

        # Metadata should have at least one field
        assert len(trace["metadata"]) > 0, "Metadata is empty"

    def test_cost_calculation(self):
        """
        Verify that cost calculation works (or returns None).
        """
        # Make a call
        self.make_test_call()

        # Get the trace
        trace = self.tracer.get_last_trace()

        # Verify cost field exists
        assert "cost" in trace, "No cost field in trace"

        # Cost should be either None or a positive number
        if trace["cost"] is not None:
            assert isinstance(trace["cost"], (int, float)), "Cost is not a number"
            assert trace["cost"] >= 0, "Cost is negative"

    def test_timestamp_format(self):
        """
        Verify that timestamps are in ISO 8601 format with Z suffix.
        """
        # Make a call
        self.make_test_call()

        # Get the trace
        trace = self.tracer.get_last_trace()

        # Verify timestamp format
        timestamp = trace["timestamp"]
        assert timestamp.endswith("Z"), "Timestamp doesn't end with Z"
        assert "T" in timestamp, "Timestamp is not ISO 8601 format"

        # Verify it can be parsed
        from datetime import datetime
        try:
            datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        except ValueError as e:
            pytest.fail(f"Timestamp is not valid ISO 8601: {e}")

    def test_trace_serialization(self):
        """
        Verify that traces can be serialized to JSON.
        """
        # Make a call
        self.make_test_call()

        # Get the trace
        trace = self.tracer.get_last_trace()

        # Try to serialize to JSON
        try:
            json_str = json.dumps(trace)
            # Try to deserialize
            deserialized = json.loads(json_str)
            assert isinstance(deserialized, dict), "Deserialized trace is not a dict"
        except (TypeError, ValueError) as e:
            pytest.fail(f"Trace is not JSON serializable: {e}")
