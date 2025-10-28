"""
Unit tests for OpenAI SDK integration.

Tests the wrapping of OpenAI clients and assistants.
"""

import pytest
from unittest.mock import Mock, MagicMock

# Skip all tests if openai not installed
pytest.importorskip("openai")

from cert.integrations.openai import (
    wrap_openai_client,
    wrap_openai_completion,
    wrap_openai_assistants,
)


class TestOpenAIIntegration:
    """Test OpenAI SDK integration wrappers."""

    def test_wrap_client_basic(self):
        """Test basic OpenAI client wrapping."""
        # Create mock client
        mock_message = Mock()
        mock_message.content = "Paris is the capital"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        # Wrap client
        wrapped = wrap_openai_client(mock_client, preset="general")

        assert wrapped is mock_client

        # Call wrapped client
        result = wrapped.chat.completions.create(
            model="gpt-4",
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
        mock_message = Mock()
        mock_message.content = "4"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        result = wrapped.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "What is 2+2?"}]
        )

        assert result["query"] == "What is 2+2?"

    def test_wrap_client_extracts_system_context(self):
        """Test that system message is extracted as context."""
        mock_message = Mock()
        mock_message.content = "Answer"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        result = wrapped.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Question"},
            ],
        )

        assert "System: You are a helpful assistant" in result["context"]

    def test_wrap_client_multi_turn_conversation(self):
        """Test multi-turn conversation context extraction."""
        mock_message = Mock()
        mock_message.content = "Answer"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        messages = [
            {"role": "user", "content": "First question"},
            {"role": "assistant", "content": "First answer"},
            {"role": "user", "content": "Second question"},
        ]

        result = wrapped.chat.completions.create(model="gpt-4", messages=messages)

        # Query should be last user message
        assert result["query"] == "Second question"

        # Context should include previous messages
        assert "First question" in result["context"]
        assert "First answer" in result["context"]

    def test_wrap_client_multimodal_content(self):
        """Test handling multimodal content."""
        mock_message = Mock()
        mock_message.content = "Image description"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        # Message with multimodal content
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image?"},
                    {"type": "image_url", "image_url": {"url": "https://..."}},
                ],
            }
        ]

        result = wrapped.chat.completions.create(model="gpt-4", messages=messages)

        # Should extract text from multimodal content
        assert result["query"] == "What is in this image?"

    def test_wrap_client_no_context(self):
        """Test when no system or previous messages provided."""
        mock_message = Mock()
        mock_message.content = "Simple answer"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        result = wrapped.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "Question"}]
        )

        assert result["context"] == "(no context)"

    def test_wrap_client_with_different_presets(self):
        """Test wrapping with different industry presets."""
        mock_message = Mock()
        mock_message.content = "Answer"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        for preset in ["general", "healthcare", "financial", "legal"]:
            mock_client = Mock()
            mock_client.chat = mock_chat

            wrapped = wrap_openai_client(mock_client, preset=preset)

            result = wrapped.chat.completions.create(
                model="gpt-4", messages=[{"role": "user", "content": "test"}]
            )

            assert isinstance(result, dict)

    def test_wrap_client_with_custom_config(self):
        """Test wrapping with custom monitor config."""
        mock_message = Mock()
        mock_message.content = "Answer"

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        custom_config = {"threshold": 0.75, "require_approval": False}

        wrapped = wrap_openai_client(mock_client, monitor_config=custom_config)

        result = wrapped.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "test"}]
        )

        assert isinstance(result, dict)

    def test_wrap_client_preserves_original_response(self):
        """Test that original response is preserved."""
        mock_message = Mock()
        mock_message.content = "Answer"

        mock_choice = Mock()
        mock_choice.message = mock_message

        original_response = Mock()
        original_response.choices = [mock_choice]
        original_response.id = "chatcmpl-123"
        original_response.model = "gpt-4"

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=original_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        result = wrapped.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "test"}]
        )

        assert result["_original_response"] == original_response
        assert result["_original_response"].id == "chatcmpl-123"

    def test_wrap_openai_completion_basic(self):
        """Test wrapping custom completion functions."""

        def my_completion(query):
            return {
                "query": query,
                "context": "Retrieved context",
                "answer": f"Answer to {query}",
            }

        wrapped = wrap_openai_completion(my_completion, preset="general")

        result = wrapped("What is AI?")

        assert isinstance(result, dict)
        assert result["answer"] == "Answer to What is AI?"

    def test_wrap_openai_completion_with_string_return(self):
        """Test wrapping function that returns string."""

        def my_completion(query):
            return f"Answer to {query}"

        wrapped = wrap_openai_completion(my_completion)

        result = wrapped("test query")

        # Should convert to proper format
        assert isinstance(result, dict)
        assert result["query"] == "test query"
        assert "Answer to test query" in result["answer"]

    def test_wrap_openai_assistants_basic(self):
        """Test wrapping assistants API."""
        mock_response = Mock()
        mock_response.id = "msg_123"

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_threads = Mock()
        mock_threads.messages = mock_messages

        mock_beta = Mock()
        mock_beta.threads = mock_threads

        mock_client = Mock()
        mock_client.beta = mock_beta

        wrapped = wrap_openai_assistants(mock_client, preset="general")

        result = wrapped.beta.threads.messages.create(
            thread_id="thread_123", role="user", content="Hello"
        )

        assert isinstance(result, dict)

    def test_wrap_openai_assistants_user_message(self):
        """Test assistants API captures user messages."""
        mock_response = Mock()
        mock_response.id = "msg_123"

        mock_messages = Mock()
        mock_messages.create = Mock(return_value=mock_response)

        mock_threads = Mock()
        mock_threads.messages = mock_messages

        mock_beta = Mock()
        mock_beta.threads = mock_threads

        mock_client = Mock()
        mock_client.beta = mock_beta

        wrapped = wrap_openai_assistants(mock_client)

        result = wrapped.beta.threads.messages.create(
            thread_id="thread_123", role="user", content="What is the weather?"
        )

        assert result["query"] == "What is the weather?"
        assert "thread_123" in result["context"]

    def test_wrap_multiple_clients_independently(self):
        """Test that wrapping multiple clients doesn't interfere."""
        message1 = Mock()
        message1.content = "Answer 1"

        choice1 = Mock()
        choice1.message = message1

        response1 = Mock()
        response1.choices = [choice1]

        completions1 = Mock()
        completions1.create = Mock(return_value=response1)

        chat1 = Mock()
        chat1.completions = completions1

        client1 = Mock()
        client1.chat = chat1

        message2 = Mock()
        message2.content = "Answer 2"

        choice2 = Mock()
        choice2.message = message2

        response2 = Mock()
        response2.choices = [choice2]

        completions2 = Mock()
        completions2.create = Mock(return_value=response2)

        chat2 = Mock()
        chat2.completions = completions2

        client2 = Mock()
        client2.chat = chat2

        wrapped1 = wrap_openai_client(client1)
        wrapped2 = wrap_openai_client(client2)

        result1 = wrapped1.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "q1"}]
        )
        result2 = wrapped2.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "q2"}]
        )

        assert result1["answer"] == "Answer 1"
        assert result2["answer"] == "Answer 2"

    def test_wrap_client_empty_choices(self):
        """Test handling when response has no choices."""
        mock_response = Mock()
        mock_response.choices = []

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        result = wrapped.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "test"}]
        )

        # Should handle gracefully
        assert result["answer"] == ""

    def test_wrap_client_none_message_content(self):
        """Test handling when message content is None."""
        mock_message = Mock()
        mock_message.content = None

        mock_choice = Mock()
        mock_choice.message = mock_message

        mock_response = Mock()
        mock_response.choices = [mock_choice]

        mock_completions = Mock()
        mock_completions.create = Mock(return_value=mock_response)

        mock_chat = Mock()
        mock_chat.completions = mock_completions

        mock_client = Mock()
        mock_client.chat = mock_chat

        wrapped = wrap_openai_client(mock_client)

        result = wrapped.chat.completions.create(
            model="gpt-4", messages=[{"role": "user", "content": "test"}]
        )

        # Should handle None content
        assert result["answer"] == ""
