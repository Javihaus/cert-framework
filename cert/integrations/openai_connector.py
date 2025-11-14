"""
OpenAI SDK Connector for CERT Framework
========================================

This connector automatically traces calls to the OpenAI SDK by monkey-patching
the OpenAI client methods. It supports:
- Chat completions (streaming and non-streaming)
- Async chat completions
- Automatic cost calculation based on token usage
- Error handling and retry logic

Usage:
    >>> import cert.integrations.auto  # Auto-activates this connector
    >>> # Or manually:
    >>> from cert.integrations.openai_connector import OpenAIConnector
    >>> from cert.core.api import get_tracer
    >>> connector = OpenAIConnector(get_tracer())
    >>> connector.activate()
"""

import functools
import logging
from datetime import datetime
from typing import Any, Dict, Iterator, Optional

try:
    from openai import AsyncOpenAI, OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector

logger = logging.getLogger(__name__)


# OpenAI pricing per 1M tokens (updated as of January 2025)
# Source: https://openai.com/pricing
OPENAI_PRICING = {
    "gpt-4": {"input": 30.0, "output": 60.0},
    "gpt-4-32k": {"input": 60.0, "output": 120.0},
    "gpt-4-turbo": {"input": 10.0, "output": 30.0},
    "gpt-4-turbo-preview": {"input": 10.0, "output": 30.0},
    "gpt-4o": {"input": 5.0, "output": 15.0},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-3.5-turbo": {"input": 0.5, "output": 1.5},
    "gpt-3.5-turbo-16k": {"input": 3.0, "output": 4.0},
    "o1": {"input": 15.0, "output": 60.0},
    "o1-mini": {"input": 3.0, "output": 12.0},
    "o1-preview": {"input": 15.0, "output": 60.0},
}


@register_connector
class OpenAIConnector(ConnectorAdapter):
    """
    Connector for OpenAI SDK.

    This connector intercepts calls to openai.OpenAI.chat.completions.create
    and automatically logs them as TracedCall objects.

    Features:
    - Automatic token counting and cost calculation
    - Support for streaming responses
    - Support for async calls
    - Handles multiple models with different pricing
    """

    def __init__(self, tracer):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI SDK not installed. Install with: pip install openai")
        super().__init__(tracer)
        self._original_create = None
        self._original_async_create = None

    def activate(self) -> None:
        """
        Activate the connector by monkey-patching OpenAI SDK methods.

        This wraps the chat.completions.create method to intercept all calls.
        """
        # Patch sync method
        self._original_create = OpenAI.chat.completions.create

        @functools.wraps(self._original_create)
        def wrapped_create(client_self, *args, **kwargs):
            return self._trace_completion(client_self, self._original_create, *args, **kwargs)

        OpenAI.chat.completions.create = wrapped_create

        # Patch async method
        self._original_async_create = AsyncOpenAI.chat.completions.create

        @functools.wraps(self._original_async_create)
        async def wrapped_async_create(client_self, *args, **kwargs):
            return await self._trace_async_completion(
                client_self, self._original_async_create, *args, **kwargs
            )

        AsyncOpenAI.chat.completions.create = wrapped_async_create

        logger.info("OpenAI connector activated")

    def _trace_completion(self, client_self, original_method, *args, **kwargs) -> Any:
        """
        Trace a synchronous completion call.

        Args:
            client_self: The OpenAI client instance
            original_method: The original create method
            *args: Positional arguments to the create method
            **kwargs: Keyword arguments to the create method

        Returns:
            The response from the original method
        """
        start_time = datetime.utcnow()
        stream = kwargs.get("stream", False)

        try:
            # Call the original method
            response = original_method(client_self, *args, **kwargs)

            # Handle streaming vs non-streaming differently
            if stream:
                # For streaming, we need to wrap the iterator
                return self._wrap_stream(response, kwargs, start_time)
            else:
                # For non-streaming, log immediately
                traced_call = self._build_traced_call(kwargs, response, start_time)
                self.log_call(traced_call)
                return response

        except Exception as e:
            # Log the error and re-raise
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="openai",
                model=kwargs.get("model", "unknown"),
                input_data=kwargs.get("messages"),
                output_data=None,
                metadata={},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    async def _trace_async_completion(self, client_self, original_method, *args, **kwargs) -> Any:
        """
        Trace an asynchronous completion call.

        Args:
            client_self: The OpenAI client instance
            original_method: The original async create method
            *args: Positional arguments to the create method
            **kwargs: Keyword arguments to the create method

        Returns:
            The response from the original method
        """
        start_time = datetime.utcnow()
        stream = kwargs.get("stream", False)

        try:
            # Call the original async method
            response = await original_method(client_self, *args, **kwargs)

            # Handle streaming vs non-streaming
            if stream:
                return self._wrap_async_stream(response, kwargs, start_time)
            else:
                traced_call = self._build_traced_call(kwargs, response, start_time)
                self.log_call(traced_call)
                return response

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="openai",
                model=kwargs.get("model", "unknown"),
                input_data=kwargs.get("messages"),
                output_data=None,
                metadata={},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _wrap_stream(
        self, stream: Iterator, request_kwargs: Dict, start_time: datetime
    ) -> Iterator:
        """
        Wrap a streaming response to accumulate chunks and log when complete.

        Args:
            stream: The original stream iterator
            request_kwargs: The request parameters
            start_time: When the request started

        Yields:
            Individual chunks from the stream
        """
        chunks = []
        accumulated_text = []

        try:
            for chunk in stream:
                chunks.append(chunk)

                # Try to extract text from this chunk
                if hasattr(chunk, "choices") and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if hasattr(delta, "content") and delta.content:
                        accumulated_text.append(delta.content)

                yield chunk

            # Stream complete, log it
            full_response = "".join(accumulated_text)
            traced_call = self._build_streaming_traced_call(
                request_kwargs, full_response, chunks, start_time
            )
            self.log_call(traced_call)

        except Exception as e:
            # Log the error
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="openai",
                model=request_kwargs.get("model", "unknown"),
                input_data=request_kwargs.get("messages"),
                output_data=None,
                metadata={"streaming": True},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    async def _wrap_async_stream(self, stream, request_kwargs: Dict, start_time: datetime):
        """
        Wrap an async streaming response.

        Args:
            stream: The async stream iterator
            request_kwargs: The request parameters
            start_time: When the request started

        Yields:
            Individual chunks from the stream
        """
        chunks = []
        accumulated_text = []

        try:
            async for chunk in stream:
                chunks.append(chunk)

                if hasattr(chunk, "choices") and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if hasattr(delta, "content") and delta.content:
                        accumulated_text.append(delta.content)

                yield chunk

            # Stream complete, log it
            full_response = "".join(accumulated_text)
            traced_call = self._build_streaming_traced_call(
                request_kwargs, full_response, chunks, start_time
            )
            self.log_call(traced_call)

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="openai",
                model=request_kwargs.get("model", "unknown"),
                input_data=request_kwargs.get("messages"),
                output_data=None,
                metadata={"streaming": True},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _build_traced_call(self, request: Dict, response: Any, start_time: datetime) -> TracedCall:
        """
        Build a TracedCall from a non-streaming request/response.

        Args:
            request: Request parameters
            response: OpenAI API response
            start_time: When the request started

        Returns:
            TracedCall object
        """
        model = request.get("model", "unknown")

        # Extract response text
        output_data = None
        if hasattr(response, "choices") and len(response.choices) > 0:
            choice = response.choices[0]
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                output_data = choice.message.content

        # Build metadata
        metadata = self.extract_metadata(response)

        # Calculate cost
        cost = self._calculate_cost_from_usage(model, response)

        return TracedCall(
            timestamp=self.format_timestamp(start_time),
            platform="openai",
            model=model,
            input_data=request.get("messages"),
            output_data=output_data,
            metadata=metadata,
            cost=cost,
        )

    def _build_streaming_traced_call(
        self,
        request: Dict,
        accumulated_output: str,
        chunks: list,
        start_time: datetime,
    ) -> TracedCall:
        """
        Build a TracedCall from a streaming request/response.

        Args:
            request: Request parameters
            accumulated_output: Accumulated text from all chunks
            chunks: List of all stream chunks
            start_time: When the request started

        Returns:
            TracedCall object
        """
        model = request.get("model", "unknown")

        # Extract metadata from last chunk if available
        metadata = {"streaming": True, "chunk_count": len(chunks)}

        # Try to get finish reason from last chunk
        if chunks and hasattr(chunks[-1], "choices") and len(chunks[-1].choices) > 0:
            finish_reason = chunks[-1].choices[0].finish_reason
            if finish_reason:
                metadata["finish_reason"] = finish_reason

        # Estimate tokens (we don't get usage data in streaming mode)
        metadata["estimated_prompt_tokens"] = self._estimate_tokens(
            str(request.get("messages", ""))
        )
        metadata["estimated_completion_tokens"] = self._estimate_tokens(accumulated_output)

        # Calculate estimated cost
        cost = self._calculate_estimated_cost(
            model,
            metadata["estimated_prompt_tokens"],
            metadata["estimated_completion_tokens"],
        )

        return TracedCall(
            timestamp=self.format_timestamp(start_time),
            platform="openai",
            model=model,
            input_data=request.get("messages"),
            output_data=accumulated_output,
            metadata=metadata,
            cost=cost,
        )

    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """
        Extract metadata from OpenAI response.

        Args:
            call_data: OpenAI API response object

        Returns:
            Dictionary of metadata
        """
        metadata = {}

        # Extract finish reason
        if hasattr(call_data, "choices") and len(call_data.choices) > 0:
            finish_reason = call_data.choices[0].finish_reason
            if finish_reason:
                metadata["finish_reason"] = finish_reason

        # Extract token usage
        if hasattr(call_data, "usage"):
            usage = call_data.usage
            metadata["prompt_tokens"] = getattr(usage, "prompt_tokens", 0)
            metadata["completion_tokens"] = getattr(usage, "completion_tokens", 0)
            metadata["total_tokens"] = getattr(usage, "total_tokens", 0)

        # Extract response ID
        if hasattr(call_data, "id"):
            metadata["response_id"] = call_data.id

        # Extract model (the actual model used, which may differ from requested)
        if hasattr(call_data, "model"):
            metadata["actual_model"] = call_data.model

        return metadata

    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """
        Calculate cost from OpenAI response.

        Args:
            call_data: OpenAI API response object

        Returns:
            Cost in USD, or None if unable to calculate
        """
        if hasattr(call_data, "model") and hasattr(call_data, "usage"):
            return self._calculate_cost_from_usage(call_data.model, call_data)
        return None

    def _calculate_cost_from_usage(self, model: str, response: Any) -> Optional[float]:
        """
        Calculate cost from usage data in response.

        Args:
            model: Model identifier
            response: OpenAI response with usage data

        Returns:
            Cost in USD, or None if unable to calculate
        """
        if not hasattr(response, "usage"):
            return None

        usage = response.usage
        prompt_tokens = getattr(usage, "prompt_tokens", 0)
        completion_tokens = getattr(usage, "completion_tokens", 0)

        return self._calculate_estimated_cost(model, prompt_tokens, completion_tokens)

    def _calculate_estimated_cost(
        self, model: str, prompt_tokens: int, completion_tokens: int
    ) -> Optional[float]:
        """
        Calculate estimated cost from token counts.

        Args:
            model: Model identifier
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens

        Returns:
            Estimated cost in USD, or None if pricing not available
        """
        # Find pricing for this model
        pricing = None
        for model_prefix, model_pricing in OPENAI_PRICING.items():
            if model.startswith(model_prefix):
                pricing = model_pricing
                break

        if not pricing:
            return None

        # Calculate cost (pricing is per 1M tokens)
        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        """
        Rough estimate of token count from text.

        Uses the approximation that 1 token ≈ 4 characters for English text.

        Args:
            text: Text to estimate

        Returns:
            Estimated token count
        """
        return max(1, len(text) // 4)
