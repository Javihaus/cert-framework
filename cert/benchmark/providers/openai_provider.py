"""OpenAI GPT provider implementation."""

import time

from .base import ProviderInterface, ResponseMetadata


class OpenAIProvider(ProviderInterface):
    """OpenAI GPT provider for CERT benchmarking.

    Supports GPT models including:
    - gpt-4o
    - gpt-4o-mini
    - gpt-4-turbo
    - gpt-3.5-turbo
    """

    def __init__(self, api_key: str, timeout: int = 30):
        """Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            from openai import OpenAI

            self.client = OpenAI(api_key=api_key, timeout=timeout)
            self.logger.info("OpenAI client initialized")
        except ImportError:
            raise ImportError(
                "openai package not installed. Install with: pip install openai"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI client: {e}")
            raise

    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ResponseMetadata:
        """Call GPT model and capture metadata.

        Args:
            model: GPT model identifier
            prompt: Input prompt
            max_tokens: Maximum output tokens
            temperature: Sampling temperature

        Returns:
            ResponseMetadata with response and timing
        """
        start_time = time.time()

        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
            )

            latency = time.time() - start_time

            # Extract response text
            response_text = response.choices[0].message.content

            # Extract token usage
            tokens = self._extract_token_count(response)

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
                    "id": response.id,
                    "model": response.model,
                    "finish_reason": response.choices[0].finish_reason,
                },
            )

            self.logger.debug(
                f"GPT {model} responded in {latency:.2f}s ({len(response_text)} chars)"
            )

            return metadata

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"OpenAI API error: {e}")

            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
                error=str(e),
                timeout=isinstance(e, TimeoutError),
            )

    def _extract_token_count(self, response) -> dict:
        """Extract token counts from OpenAI response.

        Args:
            response: OpenAI API response object

        Returns:
            Dict with token counts
        """
        try:
            return {
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }
        except (AttributeError, TypeError):
            return {"input": None, "output": None, "total": None}

    def get_provider_name(self) -> str:
        """Get provider name.

        Returns:
            'openai'
        """
        return "openai"
