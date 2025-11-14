"""
Integration tests for AWS Bedrock Connector
============================================

These tests verify that the Bedrock connector correctly traces calls to
AWS Bedrock models.

Note: These tests require boto3 to be installed. Real AWS tests require
valid AWS credentials and will incur costs.

Run tests:
    pytest tests/integration/test_bedrock_connector.py -v
"""

import json
from io import BytesIO
from unittest.mock import Mock, patch

import pytest

# Try to import boto3
try:
    import boto3
    from botocore.response import StreamingBody

    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

from cert.integrations.bedrock_connector import BedrockConnector

# Skip all tests if boto3 is not installed
pytestmark = pytest.mark.skipif(not BOTO3_AVAILABLE, reason="boto3 not installed")


class TestBedrockConnector:
    """Test suite for Bedrock connector."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        # Create mock tracer
        self.tracer = Mock()
        self.tracer.log_trace = Mock()

        # Create connector
        self.connector = BedrockConnector(self.tracer)

        yield

    def create_mock_claude_response(self, text="Test response"):
        """Create a mock Claude response."""
        response_body = {
            "content": [{"text": text}],
            "stop_reason": "end_turn",
        }

        response = {
            "body": BytesIO(json.dumps(response_body).encode("utf-8")),
            "contentType": "application/json",
            "ResponseMetadata": {
                "RequestId": "test-request-id",
                "HTTPStatusCode": 200,
            },
        }

        return response

    def create_mock_titan_response(self, text="Test response"):
        """Create a mock Titan response."""
        response_body = {
            "results": [{"outputText": text}],
        }

        response = {
            "body": BytesIO(json.dumps(response_body).encode("utf-8")),
            "contentType": "application/json",
            "ResponseMetadata": {
                "RequestId": "test-request-id",
                "HTTPStatusCode": 200,
            },
        }

        return response

    def test_connector_activation(self):
        """Verify connector activates successfully."""
        self.connector.activate()
        # boto3.client should be wrapped
        assert boto3.client != self.connector._original_client

    def test_claude_output_extraction(self):
        """Verify Claude response parsing."""
        response_body = {"content": [{"text": "Hello from Claude"}]}

        output = self.connector._extract_output(response_body, "anthropic.claude-v2")

        assert output == "Hello from Claude"

    def test_titan_output_extraction(self):
        """Verify Titan response parsing."""
        response_body = {"results": [{"outputText": "Hello from Titan"}]}

        output = self.connector._extract_output(response_body, "amazon.titan-text-express")

        assert output == "Hello from Titan"

    def test_llama_output_extraction(self):
        """Verify Llama response parsing."""
        response_body = {"generation": "Hello from Llama"}

        output = self.connector._extract_output(response_body, "meta.llama2-13b")

        assert output == "Hello from Llama"

    def test_request_body_parsing(self):
        """Verify request body is parsed correctly."""
        # JSON string
        body = json.dumps({"prompt": "Test"}).encode("utf-8")
        parsed = self.connector._parse_request_body(body)

        assert parsed == {"prompt": "Test"}

    def test_metadata_extraction(self):
        """Verify metadata extraction from response."""
        response = self.create_mock_claude_response()

        metadata = self.connector.extract_metadata(response)

        assert "request_id" in metadata
        assert metadata["request_id"] == "test-request-id"
        assert "content_type" in metadata

    def test_invoke_traced(self):
        """Verify invoke_model calls are traced."""
        self.connector.activate()

        # Mock the bedrock-runtime client
        mock_client = Mock()
        mock_client.invoke_model = Mock(return_value=self.create_mock_claude_response())

        with patch.object(self.connector, "_original_client", return_value=mock_client):
            # Wrap the client
            self.connector._wrap_client_methods(mock_client)

            # Make a call
            request_body = {"messages": [{"role": "user", "content": "Hi"}]}
            mock_client.invoke_model(
                modelId="anthropic.claude-v2",
                body=json.dumps(request_body).encode("utf-8"),
            )

            # Verify trace was logged
            assert self.tracer.log_trace.called
            logged_trace = self.tracer.log_trace.call_args[0][0]

            assert logged_trace["platform"] == "bedrock"
            assert "anthropic.claude" in logged_trace["model"]

    def test_error_handling(self):
        """Verify errors are captured and logged."""
        self.connector.activate()

        mock_client = Mock()
        mock_client.invoke_model = Mock(side_effect=Exception("API Error"))

        with patch.object(self.connector, "_original_client", return_value=mock_client):
            self.connector._wrap_client_methods(mock_client)

            try:
                mock_client.invoke_model(modelId="anthropic.claude-v2", body=b'{"prompt": "test"}')
            except Exception:
                pass  # Expected

            # Verify error was logged
            assert self.tracer.log_trace.called
            logged_trace = self.tracer.log_trace.call_args[0][0]

            assert logged_trace["error"] is not None
            assert "API Error" in logged_trace["error"]

    def test_multiple_model_families(self):
        """Verify different model families are handled correctly."""
        test_cases = [
            ("anthropic.claude-v2", {"content": [{"text": "Claude response"}]}, "Claude response"),
            (
                "amazon.titan-text",
                {"results": [{"outputText": "Titan response"}]},
                "Titan response",
            ),
            ("meta.llama2", {"generation": "Llama response"}, "Llama response"),
        ]

        for model_id, response_body, expected_output in test_cases:
            output = self.connector._extract_output(response_body, model_id)
            assert output == expected_output, f"Failed for {model_id}"

    def test_streaming_text_extraction(self):
        """Verify streaming text extraction."""
        # Claude streaming chunk
        chunk = {"delta": {"text": "Hello"}}
        text = self.connector._extract_streaming_text(chunk, "anthropic.claude-v2")
        assert text == "Hello"

        # Titan streaming chunk
        chunk = {"outputText": "World"}
        text = self.connector._extract_streaming_text(chunk, "amazon.titan-text")
        assert text == "World"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
