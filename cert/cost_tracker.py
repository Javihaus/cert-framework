"""Cost tracking function for LLM API usage.

This module provides the cost_tracker() function for tracking token usage
and calculating costs across LLM API calls.
"""

import logging
from typing import Any, Dict, Optional

from cert.core.pricing import calculate_cost
from cert.core.types import CostResult

logger = logging.getLogger(__name__)


def cost_tracker(
    *,
    tokens_input: Optional[int] = None,
    tokens_output: Optional[int] = None,
    tokens_total: Optional[int] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    cost_per_input_token: Optional[float] = None,
    cost_per_output_token: Optional[float] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> CostResult:
    """Track token usage and calculate costs for LLM API calls.

    Supports both automatic pricing (via provider/model) and manual pricing
    (via cost_per_*_token parameters). Manual pricing overrides automatic.

    Args:
        tokens_input: Number of input tokens
        tokens_output: Number of output tokens
        tokens_total: Total tokens (if input/output not separated)
        provider: Provider name for automatic pricing lookup
        model: Model name for automatic pricing lookup
        cost_per_input_token: Manual cost per input token (overrides auto-pricing)
        cost_per_output_token: Manual cost per output token (overrides auto-pricing)
        metadata: Additional metadata to store with the result

    Returns:
        CostResult with:
            - tokens_input: int
            - tokens_output: int
            - tokens_total: int
            - cost_input: float (if pricing available)
            - cost_output: float (if pricing available)
            - cost_total: float (if pricing available)
            - provider: str
            - model: str
            - metadata: dict
            - timestamp: str (ISO format)

    Raises:
        ValueError: If insufficient token information provided

    Examples:
        # Manual token counts with manual pricing
        result = cost_tracker(
            tokens_input=100,
            tokens_output=50,
            cost_per_input_token=0.00001,
            cost_per_output_token=0.00003
        )
        print(f"Total cost: ${result.cost_total:.6f}")

        # Auto-pricing lookup
        result = cost_tracker(
            tokens_input=100,
            tokens_output=50,
            provider="openai",
            model="gpt-4o"
        )
        print(f"Cost: ${result.cost_total:.6f}")

        # From API response metadata (OpenAI example)
        response = openai_client.chat.completions.create(...)
        result = cost_tracker(
            tokens_input=response.usage.prompt_tokens,
            tokens_output=response.usage.completion_tokens,
            provider="openai",
            model="gpt-4o"
        )

        # From API response metadata (Anthropic example)
        message = anthropic_client.messages.create(...)
        result = cost_tracker(
            tokens_input=message.usage.input_tokens,
            tokens_output=message.usage.output_tokens,
            provider="anthropic",
            model="claude-3-5-sonnet-20241022"
        )

        # Total tokens only (no cost calculation)
        result = cost_tracker(
            tokens_total=150,
            provider="openai",
            model="gpt-4o"
        )
        # result.cost_total will be None (need input/output separation)
    """
    # Validate token information
    if tokens_total is None and (tokens_input is None or tokens_output is None):
        raise ValueError(
            "Must provide either (tokens_input AND tokens_output) OR tokens_total"
        )

    # Calculate token totals
    if tokens_input is not None and tokens_output is not None:
        calculated_total = tokens_input + tokens_output
        if tokens_total is not None and tokens_total != calculated_total:
            logger.warning(
                f"tokens_total ({tokens_total}) doesn't match "
                f"tokens_input + tokens_output ({calculated_total}). "
                f"Using calculated total."
            )
        tokens_total = calculated_total
    elif tokens_total is not None:
        # Only total provided - cannot separate input/output
        if tokens_input is None:
            tokens_input = 0
        if tokens_output is None:
            tokens_output = 0
        logger.debug(
            "Only tokens_total provided. Cost calculation requires "
            "input/output separation for accurate pricing."
        )

    # Calculate costs
    cost_input: Optional[float] = None
    cost_output: Optional[float] = None
    cost_total: Optional[float] = None

    if tokens_input > 0 and tokens_output > 0:
        # We have input/output separation - can calculate costs
        cost_input, cost_output, cost_total = calculate_cost(
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            provider=provider,
            model=model,
            input_price_per_token=cost_per_input_token,
            output_price_per_token=cost_per_output_token,
        )

        if cost_total is not None:
            logger.info(
                f"Cost calculated: ${cost_total:.6f} "
                f"(input: {tokens_input} tokens @ ${cost_input:.6f}, "
                f"output: {tokens_output} tokens @ ${cost_output:.6f})"
            )
        else:
            logger.debug(
                f"No pricing available for {provider}/{model}. "
                f"Token counts tracked: input={tokens_input}, output={tokens_output}"
            )
    else:
        logger.debug(
            f"Cost calculation skipped (need input/output separation). "
            f"Total tokens: {tokens_total}"
        )

    # Build result
    result = CostResult(
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        tokens_total=tokens_total,
        cost_input=cost_input,
        cost_output=cost_output,
        cost_total=cost_total,
        provider=provider,
        model=model,
        metadata=metadata or {},
    )

    return result


def cost_tracker_from_response(
    response: Any,
    provider: str,
    model: str,
    **kwargs,
) -> CostResult:
    """Convenience function to extract tokens from API response.

    Automatically extracts token counts from common API response formats
    (OpenAI, Anthropic, Google, xAI).

    Args:
        response: API response object
        provider: Provider name
        model: Model name
        **kwargs: Additional arguments for cost_tracker()

    Returns:
        CostResult

    Raises:
        ValueError: If cannot extract token counts from response

    Examples:
        # OpenAI
        response = openai_client.chat.completions.create(...)
        result = cost_tracker_from_response(response, "openai", "gpt-4o")

        # Anthropic
        message = anthropic_client.messages.create(...)
        result = cost_tracker_from_response(message, "anthropic", "claude-3-5-sonnet-20241022")
    """
    tokens_input: Optional[int] = None
    tokens_output: Optional[int] = None

    provider_lower = provider.lower()

    try:
        if provider_lower in ["openai", "xai"]:
            # OpenAI-compatible format
            tokens_input = response.usage.prompt_tokens
            tokens_output = response.usage.completion_tokens

        elif provider_lower == "anthropic":
            # Anthropic format
            tokens_input = response.usage.input_tokens
            tokens_output = response.usage.output_tokens

        elif provider_lower == "google":
            # Google Gemini (if usage info available)
            if hasattr(response, "usage_metadata"):
                tokens_input = getattr(response.usage_metadata, "prompt_token_count", None)
                tokens_output = getattr(response.usage_metadata, "candidates_token_count", None)
            else:
                raise AttributeError("No usage metadata in Google response")

        else:
            raise ValueError(f"Unsupported provider for auto-extraction: {provider}")

    except (AttributeError, KeyError) as e:
        raise ValueError(
            f"Could not extract token counts from {provider} response: {e}. "
            f"Use cost_tracker() directly with manual token counts."
        )

    if tokens_input is None or tokens_output is None:
        raise ValueError(
            f"Token counts not found in {provider} response. "
            f"Use cost_tracker() directly."
        )

    return cost_tracker(
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        provider=provider,
        model=model,
        **kwargs,
    )


# Convenience function for batch tracking
def track_batch_costs(
    cost_results: list[CostResult],
) -> CostResult:
    """Aggregate multiple cost results into a single total.

    Args:
        cost_results: List of CostResult objects to aggregate

    Returns:
        CostResult with aggregated totals

    Example:
        results = []
        for call in api_calls:
            result = cost_tracker(...)
            results.append(result)

        total = track_batch_costs(results)
        print(f"Total: ${total.cost_total:.4f} for {total.tokens_total} tokens")
    """
    if not cost_results:
        return CostResult(
            tokens_input=0,
            tokens_output=0,
            tokens_total=0,
            cost_total=0.0,
        )

    total_tokens_input = sum(r.tokens_input for r in cost_results)
    total_tokens_output = sum(r.tokens_output for r in cost_results)
    total_tokens = sum(r.tokens_total for r in cost_results)

    # Calculate costs if available
    costs_input = [r.cost_input for r in cost_results if r.cost_input is not None]
    costs_output = [r.cost_output for r in cost_results if r.cost_output is not None]
    costs_total = [r.cost_total for r in cost_results if r.cost_total is not None]

    return CostResult(
        tokens_input=total_tokens_input,
        tokens_output=total_tokens_output,
        tokens_total=total_tokens,
        cost_input=sum(costs_input) if costs_input else None,
        cost_output=sum(costs_output) if costs_output else None,
        cost_total=sum(costs_total) if costs_total else None,
        provider=None,  # Mixed providers
        model=None,  # Mixed models
        metadata={"num_calls": len(cost_results)},
    )
