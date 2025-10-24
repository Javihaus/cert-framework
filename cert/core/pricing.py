"""Pricing database and utilities for cost tracking.

This module provides pricing information for LLM API calls across
different providers and models.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Path to pricing database
PRICING_DB_PATH = Path(__file__).parent / "pricing.json"

# Cache for loaded pricing data
_PRICING_CACHE: Optional[Dict] = None


def load_pricing_database() -> Dict:
    """Load pricing database from JSON file.

    Returns:
        Dictionary mapping provider -> model -> {input, output} prices

    Raises:
        FileNotFoundError: If pricing.json not found
        JSONDecodeError: If pricing.json is invalid
    """
    global _PRICING_CACHE

    if _PRICING_CACHE is not None:
        return _PRICING_CACHE

    try:
        with open(PRICING_DB_PATH, "r") as f:
            _PRICING_CACHE = json.load(f)
            logger.debug(f"Loaded pricing database from {PRICING_DB_PATH}")
            return _PRICING_CACHE
    except FileNotFoundError:
        logger.error(f"Pricing database not found at {PRICING_DB_PATH}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid pricing database JSON: {e}")
        return {}


def get_pricing(
    provider: str, model: str
) -> Optional[Tuple[Optional[float], Optional[float]]]:
    """Get pricing for a specific provider and model.

    Args:
        provider: Provider name (anthropic, openai, google, xai, huggingface)
        model: Model identifier

    Returns:
        Tuple of (input_price_per_token, output_price_per_token) or None if not found

    Example:
        input_price, output_price = get_pricing("openai", "gpt-4o")
        if input_price:
            cost = tokens_input * input_price + tokens_output * output_price
    """
    db = load_pricing_database()

    provider = provider.lower()

    if provider not in db:
        logger.warning(f"Provider '{provider}' not found in pricing database")
        return None

    provider_data = db[provider]

    # Check for exact model match
    if model in provider_data:
        model_data = provider_data[model]
        if isinstance(model_data, dict) and "input" in model_data:
            return (model_data.get("input"), model_data.get("output"))

    # Check for default pricing
    if "_default" in provider_data:
        default_data = provider_data["_default"]
        if isinstance(default_data, dict):
            logger.info(
                f"Using default pricing for {provider}/{model} "
                "(exact model not in database)"
            )
            return (default_data.get("input"), default_data.get("output"))

    logger.warning(
        f"Model '{model}' not found in pricing database for provider '{provider}'"
    )
    return None


def calculate_cost(
    tokens_input: int,
    tokens_output: int,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    input_price_per_token: Optional[float] = None,
    output_price_per_token: Optional[float] = None,
) -> Tuple[Optional[float], Optional[float], Optional[float]]:
    """Calculate costs for token usage.

    Args:
        tokens_input: Number of input tokens
        tokens_output: Number of output tokens
        provider: Provider name (for auto-pricing)
        model: Model name (for auto-pricing)
        input_price_per_token: Manual price per input token (overrides auto-pricing)
        output_price_per_token: Manual price per output token (overrides auto-pricing)

    Returns:
        Tuple of (input_cost, output_cost, total_cost) or (None, None, None) if pricing unavailable

    Example:
        # Auto-pricing
        costs = calculate_cost(100, 50, provider="openai", model="gpt-4o")

        # Manual pricing
        costs = calculate_cost(
            100, 50,
            input_price_per_token=0.000003,
            output_price_per_token=0.000015
        )
    """
    # Use manual pricing if provided
    if input_price_per_token is not None and output_price_per_token is not None:
        input_cost = tokens_input * input_price_per_token
        output_cost = tokens_output * output_price_per_token
        total_cost = input_cost + output_cost
        return (input_cost, output_cost, total_cost)

    # Try auto-pricing
    if provider and model:
        pricing = get_pricing(provider, model)
        if pricing:
            input_price, output_price = pricing
            if input_price is not None and output_price is not None:
                input_cost = tokens_input * input_price
                output_cost = tokens_output * output_price
                total_cost = input_cost + output_cost
                return (input_cost, output_cost, total_cost)

    # No pricing available
    logger.debug("No pricing information available for cost calculation")
    return (None, None, None)


def list_supported_models() -> Dict[str, list]:
    """List all models in the pricing database.

    Returns:
        Dictionary mapping provider -> list of model names

    Example:
        models = list_supported_models()
        print(f"OpenAI models: {models['openai']}")
    """
    db = load_pricing_database()

    result = {}
    for provider, models in db.items():
        if provider.startswith("_"):  # Skip metadata fields
            continue

        if isinstance(models, dict):
            # Filter out metadata and _default
            model_names = [
                k for k in models.keys() if not k.startswith("_") and k != "_default"
            ]
            result[provider] = model_names

    return result


def get_pricing_info(provider: str, model: str) -> Optional[Dict]:
    """Get detailed pricing information including metadata.

    Args:
        provider: Provider name
        model: Model name

    Returns:
        Dictionary with pricing data and metadata, or None if not found

    Example:
        info = get_pricing_info("openai", "gpt-4o")
        print(f"Input: ${info['input']} per token")
        print(f"Output: ${info['output']} per token")
        if '_note' in info:
            print(f"Note: {info['_note']}")
    """
    db = load_pricing_database()

    provider = provider.lower()

    if provider not in db:
        return None

    provider_data = db[provider]

    if model in provider_data:
        return provider_data[model]

    return None


def update_pricing_database(pricing_data: Dict) -> None:
    """Update the pricing database with new data.

    Args:
        pricing_data: New pricing data to merge

    Example:
        update_pricing_database({
            "openai": {
                "gpt-5": {
                    "input": 0.00001,
                    "output": 0.00003
                }
            }
        })
    """
    global _PRICING_CACHE

    db = load_pricing_database()

    # Deep merge
    for provider, models in pricing_data.items():
        if provider not in db:
            db[provider] = {}

        if isinstance(models, dict):
            for model, prices in models.items():
                db[provider][model] = prices

    # Save to file
    try:
        with open(PRICING_DB_PATH, "w") as f:
            json.dump(db, f, indent=2)

        # Invalidate cache
        _PRICING_CACHE = None

        logger.info(f"Updated pricing database at {PRICING_DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to update pricing database: {e}")
        raise


def format_cost(cost: Optional[float]) -> str:
    """Format cost for display.

    Args:
        cost: Cost in USD

    Returns:
        Formatted cost string

    Example:
        print(format_cost(0.00123))  # "$0.00123"
        print(format_cost(None))      # "N/A"
    """
    if cost is None:
        return "N/A"

    if cost < 0.01:
        return f"${cost:.6f}"
    elif cost < 1.0:
        return f"${cost:.4f}"
    else:
        return f"${cost:.2f}"
