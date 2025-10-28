"""
Unit tests for LlamaIndex integration.

Tests the wrapping of LlamaIndex query engines, chat engines, and agents.
"""

import pytest
from unittest.mock import Mock, MagicMock

# Skip all tests if llama_index not installed
pytest.importorskip("llama_index")

from cert.integrations.llamaindex import (
    wrap_llamaindex_engine,
    wrap_llamaindex_agent,
    wrap_llamaindex_chat_engine,
)


class TestLlamaIndexIntegration:
    """Test LlamaIndex integration wrappers."""

    def test_wrap_query_engine_basic(self):
        """Test basic query engine wrapping."""
        # Create mock query engine
        mock_response = Mock()
        mock_response.response = "Paris is the capital"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        # Wrap engine
        wrapped = wrap_llamaindex_engine(mock_engine, preset="general")

        assert wrapped is mock_engine

        # Call wrapped engine
        result = wrapped.query("What is the capital of France?")

        # Verify result structure
        assert isinstance(result, dict)
        assert "query" in result
        assert "context" in result
        assert "answer" in result
        assert "_original_response" in result

    def test_wrap_query_engine_extracts_source_nodes(self):
        """Test that source nodes are extracted as context."""
        # Create mock nodes
        node1 = Mock()
        node1.node = Mock()
        node1.node.text = "France info document"

        node2 = Mock()
        node2.node = Mock()
        node2.node.text = "Paris details document"

        mock_response = Mock()
        mock_response.response = "The answer"
        mock_response.source_nodes = [node1, node2]

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_engine(mock_engine)
        result = wrapped.query("test query")

        # Context should contain both nodes
        assert "France info document" in result["context"]
        assert "Paris details document" in result["context"]

    def test_wrap_query_engine_no_source_nodes(self):
        """Test handling when no source nodes are present."""
        mock_response = Mock()
        mock_response.response = "Simple answer"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_engine(mock_engine)
        result = wrapped.query("test")

        assert result["context"] == "(no context retrieved)"
        assert result["answer"] == "Simple answer"

    def test_wrap_query_engine_node_text_attribute(self):
        """Test handling nodes with direct text attribute."""
        # Some LlamaIndex nodes have text directly
        node = Mock()
        node.text = "Direct text content"

        mock_response = Mock()
        mock_response.response = "Answer"
        mock_response.source_nodes = [node]

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_engine(mock_engine)
        result = wrapped.query("test")

        assert "Direct text content" in result["context"]

    def test_wrap_query_engine_response_string(self):
        """Test handling when response doesn't have .response attribute."""
        # Create a custom class that returns string when converted
        class StringResponse:
            def __str__(self):
                return "String response"

        mock_response = StringResponse()

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_engine(mock_engine)
        result = wrapped.query("test")

        assert "String response" in result["answer"]

    def test_wrap_chat_engine_basic(self):
        """Test basic chat engine wrapping."""
        mock_response = Mock()
        mock_response.response = "Hello!"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_chat_engine(mock_engine, preset="general")

        result = wrapped.chat("Hello")

        assert isinstance(result, dict)
        assert "query" in result
        assert "context" in result
        assert "answer" in result

    def test_wrap_chat_engine_with_context(self):
        """Test chat engine with context from nodes."""
        node = Mock()
        node.node = Mock()
        node.node.text = "Chat history context"

        mock_response = Mock()
        mock_response.response = "Chat response"
        mock_response.source_nodes = [node]

        mock_engine = Mock()
        mock_engine.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_chat_engine(mock_engine)
        result = wrapped.chat("message")

        assert "Chat history context" in result["context"]

    def test_wrap_chat_engine_no_context(self):
        """Test chat engine without source nodes."""
        mock_response = Mock()
        mock_response.response = "Chat response"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_chat_engine(mock_engine)
        result = wrapped.chat("message")

        assert result["context"] == "(conversation history)"

    def test_wrap_agent_basic(self):
        """Test basic agent wrapping."""
        mock_response = Mock()
        mock_response.response = "Agent answer"
        mock_response.sources = []

        mock_agent = Mock()
        mock_agent.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_agent(mock_agent, preset="general")

        result = wrapped.chat("What is the weather?")

        assert isinstance(result, dict)
        assert "query" in result
        assert "context" in result
        assert "answer" in result

    def test_wrap_agent_with_sources(self):
        """Test agent with reasoning sources."""
        source = Mock()
        source.content = "Tool call: search_weather(SF)"

        mock_response = Mock()
        mock_response.response = "It's sunny"
        mock_response.sources = [source]

        mock_agent = Mock()
        mock_agent.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_agent(mock_agent)
        result = wrapped.chat("weather?")

        # Context should include tool calls
        assert "search_weather" in result["context"]

    def test_wrap_agent_no_sources(self):
        """Test agent without sources."""
        mock_response = Mock()
        mock_response.response = "Direct answer"
        mock_response.sources = []

        mock_agent = Mock()
        mock_agent.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_agent(mock_agent)
        result = wrapped.chat("test")

        assert result["context"] == "(agent reasoning)"

    def test_wrap_with_different_presets(self):
        """Test wrapping with different industry presets."""
        mock_response = Mock()
        mock_response.response = "Answer"
        mock_response.source_nodes = []

        for preset in ["general", "healthcare", "financial", "legal"]:
            mock_engine = Mock()
            mock_engine.query = Mock(return_value=mock_response)

            wrapped = wrap_llamaindex_engine(mock_engine, preset=preset)
            result = wrapped.query("test")

            assert isinstance(result, dict)

    def test_wrap_with_custom_config(self):
        """Test wrapping with custom monitor config."""
        mock_response = Mock()
        mock_response.response = "Answer"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        custom_config = {"threshold": 0.75, "require_approval": False}

        wrapped = wrap_llamaindex_engine(mock_engine, monitor_config=custom_config)
        result = wrapped.query("test")

        assert isinstance(result, dict)

    def test_wrap_preserves_original_response(self):
        """Test that original response is preserved."""
        original_response = Mock()
        original_response.response = "Answer"
        original_response.source_nodes = []
        original_response.custom_attr = "custom_value"

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=original_response)

        wrapped = wrap_llamaindex_engine(mock_engine)
        result = wrapped.query("test")

        assert result["_original_response"] == original_response
        assert result["_original_response"].custom_attr == "custom_value"

    def test_wrap_multiple_engines_independently(self):
        """Test that wrapping multiple engines doesn't interfere."""
        response1 = Mock()
        response1.response = "Answer 1"
        response1.source_nodes = []

        response2 = Mock()
        response2.response = "Answer 2"
        response2.source_nodes = []

        engine1 = Mock()
        engine1.query = Mock(return_value=response1)

        engine2 = Mock()
        engine2.query = Mock(return_value=response2)

        wrapped1 = wrap_llamaindex_engine(engine1)
        wrapped2 = wrap_llamaindex_engine(engine2)

        result1 = wrapped1.query("q1")
        result2 = wrapped2.query("q2")

        assert result1["answer"] == "Answer 1"
        assert result2["answer"] == "Answer 2"

    def test_wrap_query_engine_with_args_kwargs(self):
        """Test that additional args and kwargs are passed through."""
        mock_response = Mock()
        mock_response.response = "Answer"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.query = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_engine(mock_engine)

        # Call with query string only
        result = wrapped.query("test query")
        assert isinstance(result, dict)

    def test_wrap_chat_engine_with_args_kwargs(self):
        """Test chat engine passes through args and kwargs."""
        mock_response = Mock()
        mock_response.response = "Response"
        mock_response.source_nodes = []

        mock_engine = Mock()
        mock_engine.chat = Mock(return_value=mock_response)

        wrapped = wrap_llamaindex_chat_engine(mock_engine)

        # Call with additional kwargs
        result = wrapped.chat("message")
        assert isinstance(result, dict)
