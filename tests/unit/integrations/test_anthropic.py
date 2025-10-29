"""
Unit tests for Anthropic SDK integration.

Tests the wrapping of Anthropic clients and streaming support.
"""

import pytest
from unittest.mock import Mock, MagicMock

# Skip all tests if anthropic not installed
pytest.importorskip("anthropic")

from cert.integrations.anthropic import (
    wrap_anthropic_client,
    wrap_anthropic_completion,
)


class TestAnthropicIntegration:
    """Test Anthropic SDK integration wrappers."""

    def test_wrap_client_basic(self):
        """Test basic Anthropic client wrapping."""
        # Create mock client
        mock_content = Mock()
        mock_content.text = "Paris is the capital of France"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        # Wrap client
        wrapped = wrap_anthropic_client(mock_client, preset="general")

        assert wrapped is mock_client

        # Call wrapped client
        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "What is the capital of France?"}],
        )

        # Verify result structure
        assert isinstance(result, dict)
        assert "query" in result
        assert "context" in result
        assert "answer" in result
        assert "_original_response" in result

    def test_wrap_client_extracts_query(self):
        """Test that user message is extracted as query."""
        mock_content = Mock()
        mock_content.text = "Answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "What is 2+2?"}],
        )

        assert result["query"] == "What is 2+2?"

    def test_wrap_client_extracts_system_context(self):
        """Test that system message is extracted as context."""
        mock_content = Mock()
        mock_content.text = "Answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "Question"}],
            system="You are a helpful assistant.",
        )

        assert "helpful assistant" in result["context"]

    def test_wrap_client_multi_turn_conversation(self):
        """Test multi-turn conversation context extraction."""
        mock_content = Mock()
        mock_content.text = "Answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        messages = [
            {"role": "user", "content": "First question"},
            {"role": "assistant", "content": "First answer"},
            {"role": "user", "content": "Second question"},
        ]

        result = wrapped.messages.create(model="claude-3-opus-20240229", messages=messages)

        # Query should be last user message
        assert result["query"] == "Second question"

        # Context should include previous messages
        assert "First question" in result["context"]
        assert "First answer" in result["context"]

    def test_wrap_client_multimodal_content(self):
        """Test handling multimodal content (text + images)."""
        mock_content = Mock()
        mock_content.text = "Image description"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        # Message with multimodal content
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image?"},
                    {"type": "image", "source": {"type": "base64", "data": "..."}},
                ],
            }
        ]

        result = wrapped.messages.create(model="claude-3-opus-20240229", messages=messages)

        # Should extract text from multimodal content
        assert result["query"] == "What is in this image?"

    def test_wrap_client_system_list_format(self):
        """Test system parameter as list of text blocks."""
        mock_content = Mock()
        mock_content.text = "Answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "Question"}],
            system=[{"type": "text", "text": "System instruction"}],
        )

        assert "System instruction" in result["context"]

    def test_wrap_client_multiple_content_blocks(self):
        """Test response with multiple content blocks."""
        block1 = Mock()
        block1.text = "First part"

        block2 = Mock()
        block2.text = "Second part"

        mock_response = Mock()
        mock_response.content = [block1, block2]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "Question"}],
        )

        # Should combine all text blocks
        assert "First part" in result["answer"]
        assert "Second part" in result["answer"]

    def test_wrap_client_no_context(self):
        """Test when no system or previous messages provided."""
        mock_content = Mock()
        mock_content.text = "Simple answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "Question"}],
        )

        assert result["context"] == "(no context)"

    def test_wrap_client_with_different_presets(self):
        """Test wrapping with different industry presets."""
        mock_content = Mock()
        mock_content.text = "Answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        for preset in ["general", "healthcare", "financial", "legal"]:
            mock_client = Mock()
            mock_client.messages = mock_messages

            wrapped = wrap_anthropic_client(mock_client, preset=preset)

            result = wrapped.messages.create(
                model="claude-3-opus-20240229",
                messages=[{"role": "user", "content": "test"}],
            )

            assert isinstance(result, dict)

    def test_wrap_client_with_custom_config(self):
        """Test wrapping with custom monitor config."""
        mock_content = Mock()
        mock_content.text = "Answer"

        mock_response = Mock()
        mock_response.content = [mock_content]

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        custom_config = {"threshold": 0.75, "require_approval": False}

        wrapped = wrap_anthropic_client(mock_client, monitor_config=custom_config)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "test"}],
        )

        assert isinstance(result, dict)

    def test_wrap_client_preserves_original_response(self):
        """Test that original response is preserved."""
        mock_content = Mock()
        mock_content.text = "Answer"

        original_response = Mock()
        original_response.content = [mock_content]
        original_response.id = "msg_123"
        original_response.model = "claude-3-opus-20240229"

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=original_response)

        mock_client = Mock()
        mock_client.messages = mock_messages

        wrapped = wrap_anthropic_client(mock_client)

        result = wrapped.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "test"}],
        )

        assert result["_original_response"] == original_response
        assert result["_original_response"].id == "msg_123"

    def test_wrap_anthropic_completion_basic(self):
        """Test wrapping custom completion functions."""

        def my_completion(query):
            return {
                "query": query,
                "context": "Retrieved context",
                "answer": f"Answer to {query}",
            }

        wrapped = wrap_anthropic_completion(my_completion, preset="general")

        result = wrapped("What is AI?")

        assert isinstance(result, dict)
        assert result["answer"] == "Answer to What is AI?"

    def test_wrap_anthropic_completion_with_string_return(self):
        """Test wrapping function that returns string."""

        def my_completion(query):
            return f"Answer to {query}"

        wrapped = wrap_anthropic_completion(my_completion)

        result = wrapped("test query")

        # Should convert to proper format
        assert isinstance(result, dict)
        assert result["query"] == "test query"
        assert "Answer to test query" in result["answer"]

    def test_wrap_multiple_clients_independently(self):
        """Test that wrapping multiple clients doesn't interfere."""
        content1 = Mock()
        content1.text = "Answer 1"

        response1 = Mock()
        response1.content = [content1]

        messages1 = Mock()
        messages1.create = Mock(return_value=response1)

        client1 = Mock()
        client1.messages = messages1

        content2 = Mock()
        content2.text = "Answer 2"

        response2 = Mock()
        response2.content = [content2]

        messages2 = Mock()
        messages2.create = Mock(return_value=response2)

        client2 = Mock()
        client2.messages = messages2

        wrapped1 = wrap_anthropic_client(client1)
        wrapped2 = wrap_anthropic_client(client2)

        result1 = wrapped1.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "q1"}],
        )
        result2 = wrapped2.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": "q2"}],
        )

        assert result1["answer"] == "Answer 1"
        assert result2["answer"] == "Answer 2"
