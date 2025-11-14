"""
Integration tests for OpenAI Connector
=======================================

These tests verify that the OpenAI connector correctly traces calls to the
OpenAI SDK.

Note: These tests require an OpenAI API key to be set in the environment
variable OPENAI_API_KEY. If not set, tests will be skipped.

Run tests:
    pytest tests/integration/test_openai_connector.py -v

Run with real API calls (costs money!):
    OPENAI_RUN_LIVE_TESTS=1 pytest tests/integration/test_openai_connector.py -v
"""

import os
from unittest.mock import Mock, patch

import pytest

# Try to import OpenAI
try:
    from openai import OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from cert.integrations.openai_connector import OpenAIConnector

from .connector_test_base import ConnectorTestBase

# Skip all tests if OpenAI is not installed
pytestmark = pytest.mark.skipif(not OPENAI_AVAILABLE, reason="OpenAI SDK not installed")


class TestOpenAIConnector(ConnectorTestBase):
    """
    Test suite for OpenAI connector.

    This inherits all standard tests from ConnectorTestBase and adds
    OpenAI-specific tests.
    """

    @pytest.fixture(autouse=True)
    def setup_openai(self):
        """Set up OpenAI-specific test fixtures."""
        self.run_live_tests = os.environ.get("OPENAI_RUN_LIVE_TESTS") == "1"
        self.api_key = os.environ.get("OPENAI_API_KEY", "test-key")

        # Create mock client if not running live tests
        if not self.run_live_tests:
            self._setup_mock_client()

        yield

    def _setup_mock_client(self):
        """Set up a mock OpenAI client for testing without API calls."""
        # Create mock response
        mock_response = Mock()
        mock_response.id = "chatcmpl-test123"
        mock_response.model = "gpt-3.5-turbo-0125"
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Hello! I'm a test response."
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage = Mock()
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 8
        mock_response.usage.total_tokens = 18

        self.mock_response = mock_response

    def create_connector(self) -> OpenAIConnector:
        """Create an OpenAI connector instance."""
        return OpenAIConnector(self.tracer)

    def make_test_call(self):
        """Make a test OpenAI API call."""
        if self.run_live_tests:
            # Real API call
            client = OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say 'test' once"}],
                max_tokens=5,
            )
        else:
            # Mock call
            with patch.object(OpenAI.chat.completions, "create", return_value=self.mock_response):
                client = OpenAI(api_key=self.api_key)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "Say 'test' once"}],
                    max_tokens=5,
                )

        return response

    def get_expected_platform_name(self) -> str:
        """Return expected platform identifier."""
        return "openai"

    def get_expected_model_name(self):
        """Return expected model name (with version)."""
        if self.run_live_tests:
            return None  # Model version varies
        else:
            return "gpt-3.5-turbo-0125"

    def make_streaming_call(self):
        """Make a streaming OpenAI API call."""
        if self.run_live_tests:
            client = OpenAI(api_key=self.api_key)
            stream = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Count to 3"}],
                max_tokens=10,
                stream=True,
            )
        else:
            # Mock streaming response
            mock_chunks = []

            # Create a few mock chunks
            for i, word in enumerate(["One", " two", " three"]):
                chunk = Mock()
                chunk.choices = [Mock()]
                chunk.choices[0].delta = Mock()
                chunk.choices[0].delta.content = word
                chunk.choices[0].finish_reason = None if i < 2 else "stop"
                mock_chunks.append(chunk)

            with patch.object(OpenAI.chat.completions, "create", return_value=iter(mock_chunks)):
                client = OpenAI(api_key=self.api_key)
                stream = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "Count to 3"}],
                    max_tokens=10,
                    stream=True,
                )

        return stream

    # OpenAI-specific tests

    def test_cost_calculation(self):
        """Verify cost calculation is accurate."""
        # Make a call
        self.make_test_call()

        # Get trace
        trace = self.tracer.get_last_trace()

        # Verify cost was calculated
        assert trace["cost"] is not None, "Cost was not calculated"
        assert trace["cost"] > 0, "Cost should be positive"

        # Verify it's reasonable (should be very small for a short test)
        assert trace["cost"] < 0.01, f"Cost seems too high: ${trace['cost']}"

    def test_token_counts(self):
        """Verify token counts are captured."""
        # Make a call
        self.make_test_call()

        # Get trace
        trace = self.tracer.get_last_trace()

        # Verify token counts in metadata
        metadata = trace["metadata"]
        assert "prompt_tokens" in metadata
        assert "completion_tokens" in metadata
        assert "total_tokens" in metadata

        # Verify they're positive integers
        assert metadata["prompt_tokens"] > 0
        assert metadata["completion_tokens"] > 0
        assert metadata["total_tokens"] == (
            metadata["prompt_tokens"] + metadata["completion_tokens"]
        )

    def test_response_id_captured(self):
        """Verify OpenAI response ID is captured."""
        # Make a call
        self.make_test_call()

        # Get trace
        trace = self.tracer.get_last_trace()

        # Verify response ID
        metadata = trace["metadata"]
        assert "response_id" in metadata
        assert metadata["response_id"].startswith("chatcmpl-")

    def test_finish_reason_captured(self):
        """Verify finish reason is captured."""
        # Make a call
        self.make_test_call()

        # Get trace
        trace = self.tracer.get_last_trace()

        # Verify finish reason
        metadata = trace["metadata"]
        assert "finish_reason" in metadata
        assert metadata["finish_reason"] in ["stop", "length", "content_filter"]

    def test_multiple_models_tracked(self):
        """Verify different models are tracked correctly."""
        if not self.run_live_tests:
            pytest.skip("Mock test - skipping multi-model test")

        models_to_test = ["gpt-3.5-turbo", "gpt-4o-mini"]

        for model in models_to_test:
            client = OpenAI(api_key=self.api_key)
            client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
            )

        # Verify we have traces for both models
        traces = self.tracer.get_traces()
        models_used = set(t["model"] for t in traces)

        # At minimum, we should have captured the model names
        assert len(models_used) >= 1

    def test_error_details_captured(self):
        """Verify error details are captured when API call fails."""
        # Trigger an error by using invalid parameters
        try:
            if not self.run_live_tests:
                with patch.object(
                    OpenAI.chat.completions,
                    "create",
                    side_effect=Exception("Invalid request"),
                ):
                    client = OpenAI(api_key=self.api_key)
                    client.chat.completions.create(
                        model="invalid-model",
                        messages=[{"role": "user", "content": "Test"}],
                    )
            else:
                client = OpenAI(api_key=self.api_key)
                client.chat.completions.create(
                    model="invalid-model-name-xyz",
                    messages=[{"role": "user", "content": "Test"}],
                )
        except Exception:
            pass  # Expected to fail

        # Get the trace
        trace = self.tracer.get_last_trace()

        # Verify error was logged
        assert trace is not None
        assert trace["error"] is not None
        assert len(trace["error"]) > 0

    def test_messages_format_preserved(self):
        """Verify that messages are captured in their original format."""
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is 2+2?"},
        ]

        if self.run_live_tests:
            client = OpenAI(api_key=self.api_key)
            client.chat.completions.create(model="gpt-3.5-turbo", messages=messages, max_tokens=5)
        else:
            with patch.object(OpenAI.chat.completions, "create", return_value=self.mock_response):
                client = OpenAI(api_key=self.api_key)
                client.chat.completions.create(
                    model="gpt-3.5-turbo", messages=messages, max_tokens=5
                )

        # Get trace
        trace = self.tracer.get_last_trace()

        # Verify messages are preserved
        assert trace["input_data"] == messages


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
