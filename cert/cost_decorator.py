"""Decorator-based cost tracking for LLM API calls.

Automatically extracts tokens from API responses and calculates costs.
No manual token counting required.
"""

import functools
import logging
from datetime import datetime
from typing import Any, Callable, Optional

from cert.core.pricing import get_pricing

logger = logging.getLogger(__name__)


class CostTracker:
    """Global cost tracker for accumulating costs across calls."""

    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0
        self.total_calls = 0
        self.call_history = []

    def add(
        self,
        input_tokens: int,
        output_tokens: int,
        cost: float,
        provider: str,
        model: str,
        timestamp: str,
    ):
        """Add a call to the tracker."""
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_cost += cost
        self.total_calls += 1

        self.call_history.append(
            {
                "timestamp": timestamp,
                "provider": provider,
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost": cost,
            }
        )

    def get_summary(self):
        """Get summary statistics."""
        return {
            "total_calls": self.total_calls,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_tokens": self.total_input_tokens + self.total_output_tokens,
            "total_cost": self.total_cost,
            "average_cost_per_call": self.total_cost / self.total_calls
            if self.total_calls > 0
            else 0.0,
        }

    def reset(self):
        """Reset all tracking."""
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0
        self.total_calls = 0
        self.call_history = []


# Global tracker instance
_global_tracker = CostTracker()


def cost_tracker(
    _func: Optional[Callable] = None,
    *,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    show_cost: bool = True,
):
    """Decorator to automatically track token usage and costs.

    Automatically extracts tokens from API responses and calculates costs.
    No manual token counting required.

    Args:
        provider: Provider name (openai, anthropic, google, xai)
        model: Model name (gpt-4o, claude-3-5-sonnet-20241022, etc.)
        show_cost: Print cost after each call (default: True)

    Returns:
        Decorated function with automatic cost tracking

    Examples:
        # Automatic detection (if response has usage info)
        @cert.cost_tracker
        def my_openai_call(prompt):
            return client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}]
            )

        # With explicit provider/model
        @cert.cost_tracker(provider="openai", model="gpt-4o")
        def my_llm_call(prompt):
            return client.chat.completions.create(...)

        # View accumulated costs
        summary = cert.get_cost_summary()
        print(f"Total cost: ${summary['total_cost']:.4f}")
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            timestamp = datetime.now().isoformat()

            # Call original function
            result = func(*args, **kwargs)

            # Extract tokens from result
            input_tokens, output_tokens, detected_provider, detected_model = (
                _extract_tokens_from_response(result)
            )

            if input_tokens is None or output_tokens is None:
                logger.warning(
                    f"Could not extract token usage from {func.__name__} response. "
                    "Make sure the API returns usage information."
                )
                return result

            # Use explicit provider/model or detected ones
            final_provider = provider or detected_provider
            final_model = model or detected_model

            if not final_provider or not final_model:
                logger.warning(
                    f"Could not determine provider/model for {func.__name__}. "
                    "Specify with @cost_tracker(provider='...', model='...')"
                )
                return result

            # Calculate cost
            pricing = get_pricing(final_provider, final_model)
            if pricing:
                input_price, output_price = pricing
                cost_input = input_tokens * input_price
                cost_output = output_tokens * output_price
                total_cost = cost_input + cost_output
            else:
                logger.warning(
                    f"No pricing available for {final_provider}/{final_model}. "
                    "Cost will not be calculated."
                )
                total_cost = 0.0

            # Add to global tracker
            _global_tracker.add(
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost=total_cost,
                provider=final_provider,
                model=final_model,
                timestamp=timestamp,
            )

            # Show cost
            if show_cost and total_cost > 0:
                print(
                    f"💰 Cost: ${total_cost:.6f} "
                    f"({input_tokens} in, {output_tokens} out) "
                    f"- {final_provider}/{final_model}"
                )

            return result

        return wrapper

    # Support both @cost_tracker and @cost_tracker(...)
    if _func is None:
        return decorator
    else:
        return decorator(_func)


def _extract_tokens_from_response(response: Any) -> tuple:
    """Extract tokens from API response.

    Returns:
        (input_tokens, output_tokens, provider, model) or (None, None, None, None)
    """
    # OpenAI format
    if hasattr(response, "usage"):
        usage = response.usage
        input_tokens = getattr(usage, "prompt_tokens", None)
        output_tokens = getattr(usage, "completion_tokens", None)
        model = getattr(response, "model", None)

        if input_tokens and output_tokens:
            return input_tokens, output_tokens, "openai", model

    # Anthropic format
    if hasattr(response, "usage"):
        usage = response.usage
        input_tokens = getattr(usage, "input_tokens", None)
        output_tokens = getattr(usage, "output_tokens", None)
        model = getattr(response, "model", None)

        if input_tokens and output_tokens:
            return input_tokens, output_tokens, "anthropic", model

    # Google format
    if hasattr(response, "usage_metadata"):
        usage = response.usage_metadata
        input_tokens = getattr(usage, "prompt_token_count", None)
        output_tokens = getattr(usage, "candidates_token_count", None)

        if input_tokens and output_tokens:
            # Try to get model from response
            model = None
            return input_tokens, output_tokens, "google", model

    # Dict format (if response is dict)
    if isinstance(response, dict):
        # OpenAI dict format
        if "usage" in response:
            usage = response["usage"]
            input_tokens = usage.get("prompt_tokens")
            output_tokens = usage.get("completion_tokens")
            model = response.get("model")

            if input_tokens and output_tokens:
                return input_tokens, output_tokens, "openai", model

        # Anthropic dict format
        if "usage" in response:
            usage = response["usage"]
            input_tokens = usage.get("input_tokens")
            output_tokens = usage.get("output_tokens")
            model = response.get("model")

            if input_tokens and output_tokens:
                return input_tokens, output_tokens, "anthropic", model

    return None, None, None, None


def get_cost_summary():
    """Get summary of all tracked costs.

    Returns:
        Dictionary with total_calls, total_tokens, total_cost, etc.

    Example:
        >>> summary = cert.get_cost_summary()
        >>> print(f"Total cost: ${summary['total_cost']:.4f}")
        >>> print(f"Total calls: {summary['total_calls']}")
    """
    return _global_tracker.get_summary()


def reset_cost_tracker():
    """Reset cost tracking.

    Useful for starting fresh or measuring costs for specific operations.

    Example:
        >>> cert.reset_cost_tracker()
        >>> # Run some operations
        >>> summary = cert.get_cost_summary()
    """
    _global_tracker.reset()


def get_cost_history():
    """Get detailed history of all tracked calls.

    Returns:
        List of dicts with timestamp, provider, model, tokens, cost

    Example:
        >>> history = cert.get_cost_history()
        >>> for call in history:
        ...     print(f"{call['timestamp']}: ${call['cost']:.6f}")
    """
    return _global_tracker.call_history.copy()
