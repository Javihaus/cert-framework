"""
LangChain Connector for CERT Framework
======================================

This connector integrates with LangChain's callback system to automatically
trace LLM calls made through LangChain chains and agents.

Unlike other connectors that use monkey-patching, this connector implements
LangChain's BaseCallbackHandler interface to hook into the framework's
event system.

Usage:
    >>> import cert.integrations.auto  # Auto-activates this connector
    >>> # Or manually:
    >>> from cert.integrations.langchain_connector import LangChainConnector
    >>> from cert.core.api import get_tracer
    >>> connector = LangChainConnector(get_tracer())
    >>> connector.activate()
    >>>
    >>> # Use the handler in your chains
    >>> from langchain.chains import LLMChain
    >>> chain = LLMChain(llm=llm, callbacks=[connector.handler])
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

try:
    from langchain.callbacks.base import BaseCallbackHandler
    from langchain.schema import LLMResult

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

    # Create a dummy base class if LangChain is not installed
    class BaseCallbackHandler:
        pass


from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector

logger = logging.getLogger(__name__)


@register_connector
class LangChainConnector(ConnectorAdapter):
    """
    Connector for LangChain framework.

    This connector implements LangChain's BaseCallbackHandler to trace
    all LLM calls made through LangChain chains and agents.

    Features:
    - Tracks individual LLM calls
    - Tracks chain execution with parent-child relationships
    - Captures token usage and metadata
    - Supports multi-step chains and agents
    """

    def __init__(self, tracer):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain not installed. Install with: pip install langchain")
        super().__init__(tracer)
        self.handler = None
        self.active_llm_calls = {}
        self.active_chains = {}

    def activate(self) -> None:
        """
        Activate the connector by creating a callback handler.

        Note: Unlike other connectors, LangChain requires users to explicitly
        add the handler to their chains. We can't auto-inject it globally.

        However, we can make it available as a singleton that users import.
        """
        self.handler = CERTCallbackHandler(self)
        logger.info("LangChain connector activated")
        logger.info(
            "Add the handler to your chains: chain = LLMChain(..., callbacks=[connector.handler])"
        )

    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """
        Extract metadata from LangChain LLMResult.

        Args:
            call_data: LangChain LLMResult object

        Returns:
            Dictionary of metadata
        """
        metadata = {}

        if not LANGCHAIN_AVAILABLE:
            return metadata

        if isinstance(call_data, LLMResult):
            # Extract token usage if available
            if call_data.llm_output:
                token_usage = call_data.llm_output.get("token_usage", {})
                if token_usage:
                    metadata["prompt_tokens"] = token_usage.get("prompt_tokens", 0)
                    metadata["completion_tokens"] = token_usage.get("completion_tokens", 0)
                    metadata["total_tokens"] = token_usage.get("total_tokens", 0)

                # Extract model name
                model_name = call_data.llm_output.get("model_name")
                if model_name:
                    metadata["model_name"] = model_name

            # Extract generation info
            if call_data.generations and len(call_data.generations) > 0:
                gen_info = call_data.generations[0][0].generation_info
                if gen_info:
                    metadata["finish_reason"] = gen_info.get("finish_reason")

        return metadata

    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """
        Calculate cost from LangChain LLMResult.

        Note: Cost calculation depends on the underlying LLM provider.
        We try to extract token usage and model info to estimate cost.

        Args:
            call_data: LangChain LLMResult object

        Returns:
            Estimated cost in USD, or None if unable to calculate
        """
        if not LANGCHAIN_AVAILABLE or not isinstance(call_data, LLMResult):
            return None

        # Extract token usage and model
        metadata = self.extract_metadata(call_data)

        if not all(k in metadata for k in ["prompt_tokens", "completion_tokens", "model_name"]):
            return None

        model_name = metadata["model_name"]
        prompt_tokens = metadata["prompt_tokens"]
        completion_tokens = metadata["completion_tokens"]

        # Try to estimate cost based on model name
        # Import pricing from OpenAI connector if the model is OpenAI
        if "gpt" in model_name.lower():
            try:
                from cert.integrations.openai_connector import OPENAI_PRICING

                for model_prefix, pricing in OPENAI_PRICING.items():
                    if model_name.startswith(model_prefix):
                        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
                        output_cost = (completion_tokens / 1_000_000) * pricing["output"]
                        return input_cost + output_cost
            except ImportError:
                pass

        return None


class CERTCallbackHandler(BaseCallbackHandler):
    """
    LangChain callback handler that integrates with CERT tracing.

    This handler hooks into LangChain's event system to trace all
    LLM calls and chain executions.
    """

    def __init__(self, connector: LangChainConnector):
        """
        Initialize the handler.

        Args:
            connector: The parent LangChainConnector instance
        """
        super().__init__()
        self.connector = connector

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        *,
        run_id: uuid.UUID,
        parent_run_id: Optional[uuid.UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when LLM starts running.

        Args:
            serialized: Serialized LLM configuration
            prompts: List of prompts being sent
            run_id: Unique ID for this run
            parent_run_id: ID of parent run (for nested calls)
            **kwargs: Additional keyword arguments
        """
        call_id = str(run_id)

        # Store call data for later
        self.connector.active_llm_calls[call_id] = {
            "start_time": datetime.utcnow(),
            "prompts": prompts,
            "serialized": serialized,
            "parent_run_id": str(parent_run_id) if parent_run_id else None,
            "metadata": kwargs,
        }

        logger.debug(f"LLM call started: {call_id}")

    def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: uuid.UUID,
        parent_run_id: Optional[uuid.UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when LLM finishes running.

        Args:
            response: The LLMResult from the LLM
            run_id: Unique ID for this run
            parent_run_id: ID of parent run
            **kwargs: Additional keyword arguments
        """
        call_id = str(run_id)

        if call_id not in self.connector.active_llm_calls:
            logger.warning(f"LLM call ended but not found in active calls: {call_id}")
            return

        # Get stored call data
        call_data = self.connector.active_llm_calls.pop(call_id)

        # Extract model name
        model = self._extract_model_name(call_data["serialized"], response)

        # Extract output
        output = self._extract_output(response)

        # Build metadata
        metadata = self.connector.extract_metadata(response)
        metadata["run_id"] = call_id

        if call_data["parent_run_id"]:
            metadata["parent_run_id"] = call_data["parent_run_id"]

        # Calculate cost
        cost = self.connector.calculate_cost(response)

        # Create traced call
        traced_call = TracedCall(
            timestamp=self.connector.format_timestamp(call_data["start_time"]),
            platform="langchain",
            model=model,
            input_data=call_data["prompts"],
            output_data=output,
            metadata=metadata,
            cost=cost,
        )

        # Log it
        self.connector.log_call(traced_call)

        logger.debug(f"LLM call completed: {call_id}")

    def on_llm_error(
        self,
        error: Union[Exception, KeyboardInterrupt],
        *,
        run_id: uuid.UUID,
        parent_run_id: Optional[uuid.UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when LLM errors.

        Args:
            error: The error that occurred
            run_id: Unique ID for this run
            parent_run_id: ID of parent run
            **kwargs: Additional keyword arguments
        """
        call_id = str(run_id)

        if call_id not in self.connector.active_llm_calls:
            return

        call_data = self.connector.active_llm_calls.pop(call_id)

        # Create error trace
        traced_call = TracedCall(
            timestamp=self.connector.format_timestamp(call_data["start_time"]),
            platform="langchain",
            model=self._extract_model_name(call_data["serialized"], None),
            input_data=call_data["prompts"],
            output_data=None,
            metadata={"run_id": call_id},
            error=str(error),
        )

        self.connector.log_call(traced_call)

        logger.debug(f"LLM call errored: {call_id}")

    def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        *,
        run_id: uuid.UUID,
        parent_run_id: Optional[uuid.UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when a chain starts running.

        Args:
            serialized: Serialized chain configuration
            inputs: Inputs to the chain
            run_id: Unique ID for this run
            parent_run_id: ID of parent run
            **kwargs: Additional keyword arguments
        """
        chain_id = str(run_id)

        self.connector.active_chains[chain_id] = {
            "start_time": datetime.utcnow(),
            "inputs": inputs,
            "serialized": serialized,
            "parent_run_id": str(parent_run_id) if parent_run_id else None,
        }

        logger.debug(f"Chain started: {chain_id}")

    def on_chain_end(
        self,
        outputs: Dict[str, Any],
        *,
        run_id: uuid.UUID,
        parent_run_id: Optional[uuid.UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when a chain finishes running.

        Args:
            outputs: Outputs from the chain
            run_id: Unique ID for this run
            parent_run_id: ID of parent run
            **kwargs: Additional keyword arguments
        """
        chain_id = str(run_id)

        if chain_id in self.connector.active_chains:
            self.connector.active_chains.pop(chain_id)

        logger.debug(f"Chain completed: {chain_id}")

    def on_chain_error(
        self,
        error: Union[Exception, KeyboardInterrupt],
        *,
        run_id: uuid.UUID,
        parent_run_id: Optional[uuid.UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when a chain errors.

        Args:
            error: The error that occurred
            run_id: Unique ID for this run
            parent_run_id: ID of parent run
            **kwargs: Additional keyword arguments
        """
        chain_id = str(run_id)

        if chain_id in self.connector.active_chains:
            self.connector.active_chains.pop(chain_id)

        logger.debug(f"Chain errored: {chain_id}")

    @staticmethod
    def _extract_model_name(serialized: Dict[str, Any], response: Optional[LLMResult]) -> str:
        """
        Extract model name from serialized config or response.

        Args:
            serialized: Serialized LLM configuration
            response: LLMResult (may be None for errors)

        Returns:
            Model name or "unknown"
        """
        # Try to get from response first
        if response and response.llm_output:
            model_name = response.llm_output.get("model_name")
            if model_name:
                return model_name

        # Try to get from serialized config
        if serialized:
            # LangChain stores model info in different places
            if "model_name" in serialized:
                return serialized["model_name"]

            # Check in kwargs
            kwargs = serialized.get("kwargs", {})
            if "model_name" in kwargs:
                return kwargs["model_name"]
            if "model" in kwargs:
                return kwargs["model"]

            # Check in id list (e.g., ["langchain", "llms", "openai", "OpenAI"])
            id_list = serialized.get("id", [])
            if len(id_list) > 0:
                return id_list[-1]  # Last element is usually the class name

        return "unknown"

    @staticmethod
    def _extract_output(response: LLMResult) -> Optional[str]:
        """
        Extract output text from LLMResult.

        Args:
            response: LLMResult object

        Returns:
            Output text or None
        """
        if not response or not response.generations:
            return None

        # Get first generation's text
        if len(response.generations) > 0 and len(response.generations[0]) > 0:
            return response.generations[0][0].text

        return None
