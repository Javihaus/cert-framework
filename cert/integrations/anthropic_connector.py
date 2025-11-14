"""
Anthropic SDK Connector for CERT Framework
===========================================

This connector automatically traces calls to the Anthropic SDK by monkey-patching
the Anthropic client methods.

Usage:
    >>> import cert.integrations.auto  # Auto-activates this connector
"""

import functools
from datetime import datetime
from typing import Any, Dict, Optional
import logging

try:
    import anthropic
    from anthropic import Anthropic, AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector

logger = logging.getLogger(__name__)


# Anthropic pricing per 1M tokens (as of January 2025)
ANTHROPIC_PRICING = {
    "claude-3-opus": {"input": 15.0, "output": 75.0},
    "claude-3-sonnet": {"input": 3.0, "output": 15.0},
    "claude-3-haiku": {"input": 0.25, "output": 1.25},
    "claude-2.1": {"input": 8.0, "output": 24.0},
    "claude-2.0": {"input": 8.0, "output": 24.0},
    "claude-instant": {"input": 0.80, "output": 2.40},
}


@register_connector
class AnthropicConnector(ConnectorAdapter):
    """Connector for Anthropic SDK."""

    def __init__(self, tracer):
        if not ANTHROPIC_AVAILABLE:
            raise ImportError(
                "Anthropic SDK not installed. Install with: pip install anthropic"
            )
        super().__init__(tracer)
        self._original_create = None

    def activate(self) -> None:
        """Activate the connector by monkey-patching Anthropic SDK."""
        self._original_create = Anthropic.messages.create

        @functools.wraps(self._original_create)
        def wrapped_create(client_self, *args, **kwargs):
            return self._trace_message(client_self, self._original_create, *args, **kwargs)

        Anthropic.messages.create = wrapped_create
        logger.info("Anthropic connector activated")

    def _trace_message(self, client_self, original_method, *args, **kwargs) -> Any:
        """Trace a message API call."""
        start_time = datetime.utcnow()

        try:
            response = original_method(client_self, *args, **kwargs)
            traced_call = self._build_traced_call(kwargs, response, start_time)
            self.log_call(traced_call)
            return response

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="anthropic",
                model=kwargs.get("model", "unknown"),
                input_data=kwargs.get("messages"),
                output_data=None,
                metadata={},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _build_traced_call(self, request: Dict, response: Any, start_time: datetime) -> TracedCall:
        """Build a TracedCall from Anthropic request/response."""
        model = request.get("model", "unknown")

        # Extract output
        output_data = None
        if hasattr(response, "content") and len(response.content) > 0:
            output_data = response.content[0].text

        # Build metadata
        metadata = self.extract_metadata(response)

        # Calculate cost
        cost = self._calculate_cost_from_usage(model, response)

        return TracedCall(
            timestamp=self.format_timestamp(start_time),
            platform="anthropic",
            model=model,
            input_data=request.get("messages"),
            output_data=output_data,
            metadata=metadata,
            cost=cost,
        )

    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """Extract metadata from Anthropic response."""
        metadata = {}

        if hasattr(call_data, "stop_reason"):
            metadata["stop_reason"] = call_data.stop_reason

        if hasattr(call_data, "usage"):
            usage = call_data.usage
            metadata["input_tokens"] = getattr(usage, "input_tokens", 0)
            metadata["output_tokens"] = getattr(usage, "output_tokens", 0)

        if hasattr(call_data, "id"):
            metadata["response_id"] = call_data.id

        if hasattr(call_data, "model"):
            metadata["actual_model"] = call_data.model

        return metadata

    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """Calculate cost from Anthropic response."""
        if hasattr(call_data, "model") and hasattr(call_data, "usage"):
            return self._calculate_cost_from_usage(call_data.model, call_data)
        return None

    def _calculate_cost_from_usage(self, model: str, response: Any) -> Optional[float]:
        """Calculate cost from usage data."""
        if not hasattr(response, "usage"):
            return None

        usage = response.usage
        input_tokens = getattr(usage, "input_tokens", 0)
        output_tokens = getattr(usage, "output_tokens", 0)

        # Find pricing for this model
        pricing = None
        for model_prefix, model_pricing in ANTHROPIC_PRICING.items():
            if model.startswith(model_prefix):
                pricing = model_pricing
                break

        if not pricing:
            return None

        # Calculate cost (pricing is per 1M tokens)
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost
