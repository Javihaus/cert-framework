"""
Integration tests for LangChain Connector
==========================================

These tests verify that the LangChain connector correctly traces calls made
through the LangChain framework.

Note: These tests require LangChain to be installed. If not installed,
tests will be skipped.

Run tests:
    pytest tests/integration/test_langchain_connector.py -v
"""

import pytest
from unittest.mock import Mock, MagicMock
import uuid

# Try to import LangChain
try:
    from langchain.callbacks.base import BaseCallbackHandler
    from langchain.schema import LLMResult, Generation
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

from cert.integrations.langchain_connector import LangChainConnector, CERTCallbackHandler

# Skip all tests if LangChain is not installed
pytestmark = pytest.mark.skipif(
    not LANGCHAIN_AVAILABLE, reason="LangChain not installed"
)


class TestLangChainConnector:
    """Test suite for LangChain connector."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test fixtures."""
        # Create mock tracer
        self.tracer = Mock()
        self.tracer.log_trace = Mock()

        # Create connector
        self.connector = LangChainConnector(self.tracer)
        self.connector.activate()

        yield

        # Cleanup
        self.connector.active_llm_calls.clear()
        self.connector.active_chains.clear()

    def create_mock_llm_result(self, text="Test response", model_name="gpt-3.5-turbo"):
        """Create a mock LLMResult for testing."""
        generation = Generation(text=text)
        result = LLMResult(
            generations=[[generation]],
            llm_output={
                "model_name": model_name,
                "token_usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )
        return result

    def test_handler_creation(self):
        """Verify handler is created on activation."""
        assert self.connector.handler is not None
        assert isinstance(self.connector.handler, CERTCallbackHandler)

    def test_llm_call_traced(self):
        """Verify LLM calls are traced correctly."""
        handler = self.connector.handler
        run_id = uuid.uuid4()

        # Simulate LLM call lifecycle
        handler.on_llm_start(
            serialized={"model_name": "gpt-3.5-turbo"},
            prompts=["Test prompt"],
            run_id=run_id,
        )

        # Verify call is tracked
        assert str(run_id) in self.connector.active_llm_calls

        # Simulate completion
        result = self.create_mock_llm_result()
        handler.on_llm_end(response=result, run_id=run_id)

        # Verify trace was logged
        assert self.tracer.log_trace.called
        logged_trace = self.tracer.log_trace.call_args[0][0]

        # Verify trace structure
        assert logged_trace["platform"] == "langchain"
        assert logged_trace["model"] == "gpt-3.5-turbo"
        assert logged_trace["input_data"] == ["Test prompt"]
        assert logged_trace["output_data"] == "Test response"
        assert "metadata" in logged_trace

        # Verify call is no longer tracked
        assert str(run_id) not in self.connector.active_llm_calls

    def test_llm_error_traced(self):
        """Verify LLM errors are traced correctly."""
        handler = self.connector.handler
        run_id = uuid.uuid4()

        # Start LLM call
        handler.on_llm_start(
            serialized={"model_name": "gpt-3.5-turbo"},
            prompts=["Test prompt"],
            run_id=run_id,
        )

        # Simulate error
        error = Exception("Test error")
        handler.on_llm_error(error=error, run_id=run_id)

        # Verify error trace was logged
        assert self.tracer.log_trace.called
        logged_trace = self.tracer.log_trace.call_args[0][0]

        assert logged_trace["error"] == "Test error"
        assert logged_trace["platform"] == "langchain"

    def test_chain_tracking(self):
        """Verify chain execution is tracked."""
        handler = self.connector.handler
        run_id = uuid.uuid4()

        # Start chain
        handler.on_chain_start(
            serialized={"name": "test_chain"},
            inputs={"input": "test"},
            run_id=run_id,
        )

        # Verify chain is tracked
        assert str(run_id) in self.connector.active_chains

        # End chain
        handler.on_chain_end(outputs={"output": "result"}, run_id=run_id)

        # Verify chain is no longer tracked
        assert str(run_id) not in self.connector.active_chains

    def test_metadata_extraction(self):
        """Verify metadata is extracted from LLMResult."""
        result = self.create_mock_llm_result()
        metadata = self.connector.extract_metadata(result)

        assert "prompt_tokens" in metadata
        assert "completion_tokens" in metadata
        assert "total_tokens" in metadata
        assert metadata["prompt_tokens"] == 10
        assert metadata["completion_tokens"] == 5
        assert metadata["total_tokens"] == 15

    def test_cost_calculation_openai_model(self):
        """Verify cost calculation for OpenAI models."""
        result = self.create_mock_llm_result(model_name="gpt-3.5-turbo")
        cost = self.connector.calculate_cost(result)

        # Should be able to calculate cost for OpenAI models
        # (if OpenAI connector is available)
        if cost is not None:
            assert cost > 0
            assert cost < 0.01  # Should be very small for test

    def test_nested_calls_tracked(self):
        """Verify nested LLM calls (parent-child) are tracked correctly."""
        handler = self.connector.handler
        parent_id = uuid.uuid4()
        child_id = uuid.uuid4()

        # Start parent call
        handler.on_llm_start(
            serialized={"model_name": "gpt-4"},
            prompts=["Parent prompt"],
            run_id=parent_id,
        )

        # Start child call
        handler.on_llm_start(
            serialized={"model_name": "gpt-3.5-turbo"},
            prompts=["Child prompt"],
            run_id=child_id,
            parent_run_id=parent_id,
        )

        # Verify both are tracked
        assert str(parent_id) in self.connector.active_llm_calls
        assert str(child_id) in self.connector.active_llm_calls

        # Verify child knows its parent
        child_data = self.connector.active_llm_calls[str(child_id)]
        assert child_data["parent_run_id"] == str(parent_id)

    def test_model_name_extraction(self):
        """Verify model name extraction from various formats."""
        handler = self.connector.handler

        # Test extraction from response
        result = self.create_mock_llm_result(model_name="gpt-4")
        model = handler._extract_model_name({}, result)
        assert model == "gpt-4"

        # Test extraction from serialized config
        serialized = {"model_name": "gpt-3.5-turbo"}
        model = handler._extract_model_name(serialized, None)
        assert model == "gpt-3.5-turbo"

        # Test extraction from kwargs
        serialized = {"kwargs": {"model": "claude-2"}}
        model = handler._extract_model_name(serialized, None)
        assert model == "claude-2"

    def test_output_extraction(self):
        """Verify output text extraction from LLMResult."""
        handler = self.connector.handler

        # Test with valid result
        result = self.create_mock_llm_result(text="Test output")
        output = handler._extract_output(result)
        assert output == "Test output"

        # Test with empty result
        result = LLMResult(generations=[])
        output = handler._extract_output(result)
        assert output is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
