"""
Unit tests for LangChain integration.

Tests the wrapping of LangChain chains, agents, and callbacks.
"""

import pytest
from unittest.mock import Mock, MagicMock
from cert.integrations.langchain import (
    wrap_langchain_chain,
    wrap_langchain_agent,
    create_monitored_callback,
)


class TestLangChainIntegration:
    """Test LangChain integration wrappers."""

    def test_wrap_langchain_chain_basic(self):
        """Test basic chain wrapping."""
        # Create mock chain
        mock_chain = Mock()
        mock_chain.invoke = Mock(
            return_value={
                "result": "Paris is the capital",
                "source_documents": [
                    Mock(page_content="France's capital is Paris")
                ],
            }
        )

        # Wrap chain
        wrapped = wrap_langchain_chain(mock_chain, preset="general")

        # Verify wrapped
        assert wrapped is mock_chain
        assert wrapped.invoke != mock_chain.invoke.__wrapped__

        # Call wrapped chain
        result = wrapped.invoke({"query": "What is the capital of France?"})

        # Verify result structure
        assert isinstance(result, dict)
        assert "query" in result
        assert "context" in result
        assert "answer" in result
        assert "_original_result" in result

    def test_wrap_langchain_chain_extracts_context(self):
        """Test that source documents are extracted as context."""
        mock_chain = Mock()
        mock_chain.invoke = Mock(
            return_value={
                "result": "The answer",
                "source_documents": [
                    Mock(page_content="Document 1 content"),
                    Mock(page_content="Document 2 content"),
                ],
            }
        )

        wrapped = wrap_langchain_chain(mock_chain)
        result = wrapped.invoke({"query": "test query"})

        # Context should contain both documents
        assert "Document 1 content" in result["context"]
        assert "Document 2 content" in result["context"]

    def test_wrap_langchain_chain_no_source_documents(self):
        """Test handling when no source documents are present."""
        mock_chain = Mock()
        mock_chain.invoke = Mock(return_value={"result": "Simple answer"})

        wrapped = wrap_langchain_chain(mock_chain)
        result = wrapped.invoke({"query": "test"})

        # Should have placeholder context
        assert result["context"] == "(no context retrieved)"
        assert result["answer"] == "Simple answer"

    def test_wrap_langchain_chain_different_input_keys(self):
        """Test handling different input key names."""
        mock_chain = Mock()
        mock_chain.invoke = Mock(return_value={"answer": "Response"})

        wrapped = wrap_langchain_chain(mock_chain)

        # Test with 'question' key
        result = wrapped.invoke({"question": "What is this?"})
        assert result["query"] == "What is this?"

        # Test with 'input' key
        result = wrapped.invoke({"input": "Tell me more"})
        assert result["query"] == "Tell me more"

    def test_wrap_langchain_chain_different_output_keys(self):
        """Test handling different output key names."""
        mock_chain = Mock()
        mock_chain.invoke = Mock(return_value={"answer": "The answer", "output": "Out"})

        wrapped = wrap_langchain_chain(mock_chain)
        result = wrapped.invoke({"query": "test"})

        # Should extract 'answer' field
        assert result["answer"] == "The answer"

    def test_wrap_langchain_chain_with_call_method(self):
        """Test wrapping chains that use __call__ instead of invoke."""
        mock_chain = Mock()
        mock_chain.__call__ = Mock(return_value={"result": "Answer"})

        wrapped = wrap_langchain_chain(mock_chain)

        # Should wrap __call__ if it exists
        if hasattr(wrapped, "__call__"):
            result = wrapped({"query": "test"})
            assert isinstance(result, dict)

    def test_wrap_langchain_chain_with_custom_config(self):
        """Test wrapping with custom monitor config."""
        mock_chain = Mock()
        mock_chain.invoke = Mock(return_value={"result": "Answer"})

        custom_config = {"threshold": 0.75, "require_approval": False}

        wrapped = wrap_langchain_chain(mock_chain, monitor_config=custom_config)
        result = wrapped.invoke({"query": "test"})

        assert isinstance(result, dict)

    def test_wrap_langchain_agent_basic(self):
        """Test basic agent wrapping."""
        mock_agent = Mock()
        mock_agent.invoke = Mock(
            return_value={
                "output": "Final answer",
                "intermediate_steps": [("Step 1", "Result 1"), ("Step 2", "Result 2")],
            }
        )

        wrapped = wrap_langchain_agent(mock_agent, preset="general")

        result = wrapped.invoke({"input": "What is the weather?"})

        assert isinstance(result, dict)
        assert "query" in result
        assert "context" in result
        assert "answer" in result

    def test_wrap_langchain_agent_extracts_intermediate_steps(self):
        """Test that intermediate steps are captured as context."""
        mock_agent = Mock()
        steps = [("Action 1", "Observation 1"), ("Action 2", "Observation 2")]
        mock_agent.invoke = Mock(
            return_value={"output": "Final", "intermediate_steps": steps}
        )

        wrapped = wrap_langchain_agent(mock_agent)
        result = wrapped.invoke({"input": "test"})

        # Context should mention steps
        assert "Step" in result["context"]

    def test_wrap_langchain_agent_no_intermediate_steps(self):
        """Test agent without intermediate steps."""
        mock_agent = Mock()
        mock_agent.invoke = Mock(return_value={"output": "Direct answer"})

        wrapped = wrap_langchain_agent(mock_agent)
        result = wrapped.invoke({"input": "test"})

        assert result["context"] == "(agent reasoning steps)"
        assert result["answer"] == "Direct answer"

    def test_create_monitored_callback(self):
        """Test callback handler creation."""
        callback = create_monitored_callback(preset="healthcare")

        assert callback is not None
        assert hasattr(callback, "on_retriever_end")
        assert hasattr(callback, "on_chain_start")
        assert hasattr(callback, "on_chain_end")

    def test_callback_preset_configuration(self):
        """Test callback with different presets."""
        for preset in ["general", "healthcare", "financial", "legal"]:
            callback = create_monitored_callback(preset=preset)
            assert callback.preset == preset

    def test_wrap_chain_preserves_original_result(self):
        """Test that original result is preserved."""
        original_result = {
            "result": "Answer",
            "source_documents": [],
            "custom_field": "custom_value",
        }

        mock_chain = Mock()
        mock_chain.invoke = Mock(return_value=original_result)

        wrapped = wrap_langchain_chain(mock_chain)
        result = wrapped.invoke({"query": "test"})

        # Original result should be preserved
        assert result["_original_result"] == original_result

    def test_wrap_chain_with_string_result(self):
        """Test handling when chain returns a string instead of dict."""
        mock_chain = Mock()
        mock_chain.invoke = Mock(return_value="Simple string answer")

        wrapped = wrap_langchain_chain(mock_chain)
        result = wrapped.invoke({"query": "test"})

        # Should convert string to proper format
        assert result["answer"] == "Simple string answer"

    def test_wrap_multiple_chains_independently(self):
        """Test that wrapping multiple chains doesn't interfere."""
        chain1 = Mock()
        chain1.invoke = Mock(return_value={"result": "Answer 1"})

        chain2 = Mock()
        chain2.invoke = Mock(return_value={"result": "Answer 2"})

        wrapped1 = wrap_langchain_chain(chain1)
        wrapped2 = wrap_langchain_chain(chain2)

        result1 = wrapped1.invoke({"query": "q1"})
        result2 = wrapped2.invoke({"query": "q2"})

        assert result1["answer"] == "Answer 1"
        assert result2["answer"] == "Answer 2"
