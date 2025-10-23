"""Anthropic Claude provider implementation."""

import time

from .base import ProviderInterface, ResponseMetadata


class AnthropicProvider(ProviderInterface):
    """Anthropic Claude provider for CERT benchmarking.

    Supports Claude models including:
    - claude-3-5-sonnet-20241022
    - claude-3-5-haiku-20241022
    - claude-3-opus-20240229
    """

    def __init__(self, api_key: str, timeout: int = 30):
        """Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            from anthropic import Anthropic

            self.client = Anthropic(api_key=api_key, timeout=timeout)
            self.logger.info("Anthropic client initialized")
        except ImportError:
            raise ImportError(
                "anthropic package not installed. Install with: pip install anthropic"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize Anthropic client: {e}")
            raise

    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ResponseMetadata:
        """Call Claude model and capture metadata.

        Args:
            model: Claude model identifier
            prompt: Input prompt
            max_tokens: Maximum output tokens
            temperature: Sampling temperature

        Returns:
            ResponseMetadata with response and timing
        """
        start_time = time.time()

        try:
            # Call Anthropic API
            message = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
            )

            latency = time.time() - start_time

            # Extract response text
            response_text = message.content[0].text

            # Extract token usage
            tokens = self._extract_token_count(message)

            # Build metadata
            metadata = ResponseMetadata(
                response_text=response_text,
                latency_seconds=latency,
                tokens_input=tokens["input"],
                tokens_output=tokens["output"],
                tokens_total=tokens["total"],
                model=model,
                provider=self.get_provider_name(),
                raw_response={
                    "id": message.id,
                    "type": message.type,
                    "role": message.role,
                    "stop_reason": message.stop_reason,
                },
            )

            self.logger.debug(
                f"Claude {model} responded in {latency:.2f}s "
                f"({len(response_text)} chars)"
            )

            return metadata

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"Anthropic API error: {e}")

            # Return error metadata
            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
                error=str(e),
                timeout=isinstance(e, TimeoutError),
            )

    def _extract_token_count(self, response) -> dict:
        """Extract token counts from Anthropic response.

        Args:
            response: Anthropic API response object

        Returns:
            Dict with token counts
        """
        try:
            return {
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens,
                "total": response.usage.input_tokens + response.usage.output_tokens,
            }
        except (AttributeError, TypeError):
            return {"input": None, "output": None, "total": None}

    def get_provider_name(self) -> str:
        """Get provider name.

        Returns:
            'anthropic'
        """
        return "anthropic"
