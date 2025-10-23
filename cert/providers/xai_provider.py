"""xAI Grok provider implementation."""

import time

from .base import ProviderInterface, ResponseMetadata


class XAIProvider(ProviderInterface):
    """xAI Grok provider for CERT benchmarking.

    Supports Grok models including:
    - grok-2-latest
    - grok-2-1212
    - grok-beta

    Note: Grok uses OpenAI-compatible API
    """

    def __init__(self, api_key: str, timeout: int = 30):
        """Initialize xAI Grok provider.

        Args:
            api_key: xAI API key
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            from openai import OpenAI

            # Grok uses OpenAI-compatible API with custom base URL
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1",
                timeout=timeout,
            )
            self.logger.info("xAI Grok client initialized")
        except ImportError:
            raise ImportError(
                "openai package not installed. Install with: pip install openai"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize xAI client: {e}")
            raise

    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ResponseMetadata:
        """Call Grok model and capture metadata.

        Args:
            model: Grok model identifier
            prompt: Input prompt
            max_tokens: Maximum output tokens
            temperature: Sampling temperature

        Returns:
            ResponseMetadata with response and timing
        """
        start_time = time.time()

        try:
            # Call xAI API (OpenAI-compatible)
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
                f"Grok {model} responded in {latency:.2f}s ({len(response_text)} chars)"
            )

            return metadata

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"xAI API error: {e}")

            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
                error=str(e),
                timeout=isinstance(e, TimeoutError),
            )

    def _extract_token_count(self, response) -> dict:
        """Extract token counts from xAI response.

        Args:
            response: xAI API response object

        Returns:
            Dict with token counts
        """
        try:
            # xAI uses same structure as OpenAI
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
            'xai'
        """
        return "xai"
