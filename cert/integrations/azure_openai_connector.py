"""
Azure OpenAI Connector for CERT Framework
==========================================

This connector automatically traces calls to Azure OpenAI by monkey-patching
the Azure OpenAI client methods.

Usage:
    >>> import cert.integrations.auto  # Auto-activates this connector
"""

import functools
from datetime import datetime
from typing import Any, Dict, Optional
import logging

try:
    from openai import AzureOpenAI, AsyncAzureOpenAI
    AZURE_OPENAI_AVAILABLE = True
except ImportError:
    AZURE_OPENAI_AVAILABLE = False

from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector

logger = logging.getLogger(__name__)


# Azure OpenAI uses same pricing as OpenAI but may vary by region
from cert.integrations.openai_connector import OPENAI_PRICING as AZURE_PRICING


@register_connector
class AzureOpenAIConnector(ConnectorAdapter):
    """Connector for Azure OpenAI SDK."""

    def __init__(self, tracer):
        if not AZURE_OPENAI_AVAILABLE:
            raise ImportError(
                "Azure OpenAI not available. Install with: pip install openai"
            )
        super().__init__(tracer)
        self._original_create = None

    def activate(self) -> None:
        """Activate the connector by monkey-patching Azure OpenAI SDK."""
        self._original_create = AzureOpenAI.chat.completions.create

        @functools.wraps(self._original_create)
        def wrapped_create(client_self, *args, **kwargs):
            return self._trace_completion(client_self, self._original_create, *args, **kwargs)

        AzureOpenAI.chat.completions.create = wrapped_create
        logger.info("Azure OpenAI connector activated")

    def _trace_completion(self, client_self, original_method, *args, **kwargs) -> Any:
        """Trace a completion call."""
        start_time = datetime.utcnow()
        stream = kwargs.get("stream", False)

        try:
            response = original_method(client_self, *args, **kwargs)

            if not stream:
                traced_call = self._build_traced_call(kwargs, response, start_time)
                self.log_call(traced_call)

            return response

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="azure_openai",
                model=kwargs.get("model", "unknown"),
                input_data=kwargs.get("messages"),
                output_data=None,
                metadata={},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _build_traced_call(self, request: Dict, response: Any, start_time: datetime) -> TracedCall:
        """Build a TracedCall from Azure OpenAI request/response."""
        model = request.get("model", "unknown")

        # Extract output
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
            platform="azure_openai",
            model=model,
            input_data=request.get("messages"),
            output_data=output_data,
            metadata=metadata,
            cost=cost,
        )

    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """Extract metadata from Azure OpenAI response."""
        metadata = {}

        # Same as OpenAI
        if hasattr(call_data, "choices") and len(call_data.choices) > 0:
            finish_reason = call_data.choices[0].finish_reason
            if finish_reason:
                metadata["finish_reason"] = finish_reason

        if hasattr(call_data, "usage"):
            usage = call_data.usage
            metadata["prompt_tokens"] = getattr(usage, "prompt_tokens", 0)
            metadata["completion_tokens"] = getattr(usage, "completion_tokens", 0)
            metadata["total_tokens"] = getattr(usage, "total_tokens", 0)

        if hasattr(call_data, "id"):
            metadata["response_id"] = call_data.id

        if hasattr(call_data, "model"):
            metadata["actual_model"] = call_data.model

        return metadata

    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """Calculate cost from Azure OpenAI response."""
        if hasattr(call_data, "model") and hasattr(call_data, "usage"):
            return self._calculate_cost_from_usage(call_data.model, call_data)
        return None

    def _calculate_cost_from_usage(self, model: str, response: Any) -> Optional[float]:
        """Calculate cost from usage data."""
        if not hasattr(response, "usage"):
            return None

        usage = response.usage
        prompt_tokens = getattr(usage, "prompt_tokens", 0)
        completion_tokens = getattr(usage, "completion_tokens", 0)

        return self._calculate_estimated_cost(model, prompt_tokens, completion_tokens)

    def _calculate_estimated_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> Optional[float]:
        """Calculate estimated cost from token counts."""
        # Find pricing for this model
        pricing = None
        for model_prefix, model_pricing in AZURE_PRICING.items():
            if model.startswith(model_prefix):
                pricing = model_pricing
                break

        if not pricing:
            return None

        # Calculate cost (pricing is per 1M tokens)
        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost
