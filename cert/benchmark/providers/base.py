"""Base provider interface for CERT benchmark framework.

This module defines the abstract provider interface that all LLM providers
must implement. It also defines response metadata structure for capturing
latency, token usage, and other metrics.
"""

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class ResponseMetadata:
    """Metadata captured from LLM provider response.

    This structure ensures consistent metadata capture across providers
    for metrics calculation.
    """

    response_text: str
    latency_seconds: float
    tokens_input: Optional[int] = None
    tokens_output: Optional[int] = None
    tokens_total: Optional[int] = None
    model: Optional[str] = None
    provider: Optional[str] = None
    error: Optional[str] = None
    timeout: bool = False
    raw_response: Optional[Dict[str, Any]] = None
    timestamp: float = field(default_factory=time.time)


class ProviderInterface(ABC):
    """Abstract interface for language model providers.

    All provider implementations must inherit from this class and implement
    the call_model() method. The interface ensures consistent behavior across
    different LLM providers (Anthropic, OpenAI, Google, xAI, etc.).

    Key responsibilities:
    1. API authentication and client initialization
    2. Request formatting for provider-specific API
    3. Response parsing and metadata extraction
    4. Error handling and timeout management
    """

    def __init__(self, api_key: str, timeout: int = 30):
        """Initialize provider with API key.

        Args:
            api_key: API key for the provider
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.timeout = timeout
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ResponseMetadata:
        """Call the language model and capture metadata.

        Args:
            model: Model name/identifier (provider-specific)
            prompt: Input prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            ResponseMetadata with response text, latency, and token usage

        Raises:
            TimeoutError: If request exceeds timeout
            Exception: For API errors (provider-specific exceptions)
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Get provider name.

        Returns:
            Provider identifier (e.g., 'anthropic', 'openai')
        """
        pass

    def _extract_token_count(self, response: Any) -> Dict[str, Optional[int]]:
        """Extract token counts from provider response (if available).

        Override this method in provider-specific implementations to extract
        token usage data from API responses.

        Args:
            response: Raw provider response object

        Returns:
            Dictionary with 'input', 'output', 'total' token counts
        """
        return {"input": None, "output": None, "total": None}

    async def call_with_retry(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        max_retries: int = 3,
    ) -> ResponseMetadata:
        """Call model with automatic retry on transient failures.

        Args:
            model: Model name
            prompt: Input prompt
            max_tokens: Maximum tokens
            temperature: Sampling temperature
            max_retries: Maximum number of retry attempts

        Returns:
            ResponseMetadata

        Raises:
            Exception: If all retries fail
        """
        import asyncio

        last_exception = None

        for attempt in range(max_retries):
            try:
                return await self.call_model(model, prompt, max_tokens, temperature)
            except Exception as e:
                last_exception = e
                self.logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    # Exponential backoff: 1s, 2s, 4s
                    await asyncio.sleep(2**attempt)

        # All retries failed
        self.logger.error(f"All {max_retries} attempts failed")
        raise last_exception
