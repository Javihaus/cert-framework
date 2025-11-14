"""
Utility Functions for CERT Connectors
======================================

This module provides reusable utilities shared across multiple connectors.
These utilities help reduce code duplication and ensure consistency.

Functions:
- format_timestamp: Standard ISO 8601 timestamp formatting
- safe_extract: Safely navigate nested dictionaries
- estimate_tokens: Rough token count estimation
- CostCalculator: Reusable cost calculation logic
"""

from datetime import datetime
from typing import Any, Dict, Optional


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """
    Format a datetime object as an ISO 8601 string with Z suffix.

    This is the standard timestamp format for all CERT traces.

    Args:
        dt: Datetime object to format (defaults to current UTC time)

    Returns:
        ISO 8601 formatted timestamp string (e.g., "2025-01-15T10:30:00.123456Z")

    Example:
        >>> from datetime import datetime
        >>> dt = datetime(2025, 1, 15, 10, 30, 0)
        >>> format_timestamp(dt)
        '2025-01-15T10:30:00Z'
    """
    if dt is None:
        dt = datetime.utcnow()
    return dt.isoformat() + "Z"


def safe_extract(obj: Any, path: str, default: Any = None) -> Any:
    """
    Safely navigate nested dictionaries/objects using a path string.

    This function handles missing keys and type mismatches gracefully,
    returning a default value instead of raising exceptions.

    Args:
        obj: The object to navigate (typically a dict)
        path: Dot-separated path to the value (e.g., "user.profile.name")
        default: Value to return if path doesn't exist

    Returns:
        The value at the path, or default if not found

    Example:
        >>> data = {"user": {"profile": {"name": "Alice"}}}
        >>> safe_extract(data, "user.profile.name")
        'Alice'
        >>> safe_extract(data, "user.profile.age", default=0)
        0
        >>> safe_extract(data, "user.settings.theme", default="dark")
        'dark'
    """
    keys = path.split(".")

    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        elif hasattr(obj, key):
            obj = getattr(obj, key)
        else:
            return default

    return obj


def estimate_tokens(text: str, chars_per_token: int = 4) -> int:
    """
    Estimate the number of tokens in a text string.

    This is a rough approximation based on character count. Different
    models and tokenizers may produce different actual token counts.

    The approximation of 4 characters per token works reasonably well
    for English text with modern tokenizers (GPT-3/4, Claude, etc.)

    Args:
        text: Text to estimate tokens for
        chars_per_token: Average characters per token (default: 4)

    Returns:
        Estimated token count (minimum 1)

    Example:
        >>> estimate_tokens("Hello, world!")
        3
        >>> estimate_tokens("This is a longer sentence with more words.")
        11
    """
    if not text:
        return 0

    return max(1, len(str(text)) // chars_per_token)


def estimate_tokens_from_messages(messages: list, chars_per_token: int = 4) -> int:
    """
    Estimate token count from a list of messages.

    This is useful for chat-style APIs where input is a list of message dicts.

    Args:
        messages: List of message dicts (e.g., [{"role": "user", "content": "Hi"}])
        chars_per_token: Average characters per token

    Returns:
        Estimated total token count

    Example:
        >>> messages = [
        ...     {"role": "system", "content": "You are helpful"},
        ...     {"role": "user", "content": "Hello!"}
        ... ]
        >>> estimate_tokens_from_messages(messages)
        6
    """
    total_chars = 0

    for message in messages:
        if isinstance(message, dict):
            # Count content
            content = message.get("content", "")
            total_chars += len(str(content))

            # Count role
            role = message.get("role", "")
            total_chars += len(str(role))

            # Add overhead for message structure (~4 tokens per message)
            total_chars += 16  # ~4 tokens

        elif isinstance(message, str):
            total_chars += len(message)

    return max(1, total_chars // chars_per_token)


class CostCalculator:
    """
    Reusable cost calculation utilities.

    This class provides methods for calculating API costs based on
    token usage and pricing tables.
    """

    @staticmethod
    def calculate_from_usage(
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        pricing_table: Dict[str, Dict[str, float]],
    ) -> Optional[float]:
        """
        Calculate cost from token usage using a pricing table.

        Args:
            model: Model identifier
            prompt_tokens: Number of input tokens
            completion_tokens: Number of output tokens
            pricing_table: Dict mapping model names to pricing info
                          Format: {
                              "model-name": {
                                  "input": price_per_million_tokens,
                                  "output": price_per_million_tokens
                              }
                          }

        Returns:
            Cost in USD, or None if model not in pricing table

        Example:
            >>> pricing = {"gpt-3.5-turbo": {"input": 0.5, "output": 1.5}}
            >>> CostCalculator.calculate_from_usage(
            ...     "gpt-3.5-turbo", 1000, 500, pricing
            ... )
            0.0012  # (1000/1M * 0.5) + (500/1M * 1.5)
        """
        # Try exact match first
        if model in pricing_table:
            pricing = pricing_table[model]
        else:
            # Try prefix match (e.g., "gpt-4-turbo-preview" matches "gpt-4-turbo")
            pricing = None
            for model_prefix, model_pricing in pricing_table.items():
                if model.startswith(model_prefix):
                    pricing = model_pricing
                    break

            if pricing is None:
                return None

        # Calculate cost (pricing is per 1M tokens)
        input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
        output_cost = (completion_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost

    @staticmethod
    def calculate_from_text(
        model: str,
        prompt_text: str,
        completion_text: str,
        pricing_table: Dict[str, Dict[str, float]],
        chars_per_token: int = 4,
    ) -> Optional[float]:
        """
        Calculate estimated cost from raw text.

        This estimates token counts and then calculates cost.

        Args:
            model: Model identifier
            prompt_text: Input text
            completion_text: Output text
            pricing_table: Pricing information
            chars_per_token: Characters per token for estimation

        Returns:
            Estimated cost in USD, or None if unable to calculate

        Example:
            >>> pricing = {"gpt-3.5-turbo": {"input": 0.5, "output": 1.5}}
            >>> CostCalculator.calculate_from_text(
            ...     "gpt-3.5-turbo",
            ...     "What is 2+2?",
            ...     "2+2 equals 4.",
            ...     pricing
            ... )
            0.00001  # Very small cost for short texts
        """
        prompt_tokens = estimate_tokens(prompt_text, chars_per_token)
        completion_tokens = estimate_tokens(completion_text, chars_per_token)

        return CostCalculator.calculate_from_usage(
            model, prompt_tokens, completion_tokens, pricing_table
        )


def parse_json_safely(data: Any) -> Optional[Dict]:
    """
    Safely parse JSON data from various input types.

    Handles strings, bytes, and already-parsed dicts.

    Args:
        data: JSON data to parse (string, bytes, or dict)

    Returns:
        Parsed dictionary, or None if parsing fails

    Example:
        >>> parse_json_safely('{"key": "value"}')
        {'key': 'value'}
        >>> parse_json_safely(b'{"key": "value"}')
        {'key': 'value'}
        >>> parse_json_safely({"key": "value"})
        {'key': 'value'}
        >>> parse_json_safely("invalid json")
        None
    """
    import json

    # Already a dict
    if isinstance(data, dict):
        return data

    # Convert bytes to string
    if isinstance(data, bytes):
        try:
            data = data.decode("utf-8")
        except UnicodeDecodeError:
            return None

    # Parse string
    if isinstance(data, str):
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return None

    return None


def truncate_string(s: str, max_length: int = 1000, suffix: str = "...") -> str:
    """
    Truncate a string to a maximum length.

    Useful for preventing excessively long traces in logs.

    Args:
        s: String to truncate
        max_length: Maximum length (including suffix)
        suffix: Suffix to append if truncated

    Returns:
        Truncated string

    Example:
        >>> truncate_string("Hello, world!", 10)
        'Hello, ...'
        >>> truncate_string("Short", 100)
        'Short'
    """
    if len(s) <= max_length:
        return s

    return s[: max_length - len(suffix)] + suffix


def sanitize_metadata(metadata: Dict[str, Any], max_value_length: int = 1000) -> Dict[str, Any]:
    """
    Sanitize metadata dictionary for safe logging.

    This function:
    - Truncates long string values
    - Removes None values
    - Converts non-serializable values to strings

    Args:
        metadata: Metadata dictionary to sanitize
        max_value_length: Maximum length for string values

    Returns:
        Sanitized metadata dictionary

    Example:
        >>> sanitize_metadata({
        ...     "key1": "short",
        ...     "key2": "very " * 500,  # Very long string
        ...     "key3": None,
        ...     "key4": 42
        ... })
        {'key1': 'short', 'key2': 'very very very...', 'key4': 42}
    """
    sanitized = {}

    for key, value in metadata.items():
        # Skip None values
        if value is None:
            continue

        # Truncate long strings
        if isinstance(value, str) and len(value) > max_value_length:
            value = truncate_string(value, max_value_length)

        # Convert complex objects to strings
        if not isinstance(value, (str, int, float, bool, list, dict)):
            value = str(value)

        sanitized[key] = value

    return sanitized


def merge_metadata(*metadata_dicts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge multiple metadata dictionaries.

    Later dictionaries override earlier ones for conflicting keys.

    Args:
        *metadata_dicts: Variable number of metadata dictionaries

    Returns:
        Merged metadata dictionary

    Example:
        >>> merge_metadata(
        ...     {"key1": "value1", "key2": "value2"},
        ...     {"key2": "override", "key3": "value3"}
        ... )
        {'key1': 'value1', 'key2': 'override', 'key3': 'value3'}
    """
    merged = {}

    for metadata in metadata_dicts:
        if metadata:
            merged.update(metadata)

    return merged
