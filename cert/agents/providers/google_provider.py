"""Google Gemini provider implementation."""

import time

from .base import ProviderInterface, ResponseMetadata


class GoogleProvider(ProviderInterface):
    """Google Gemini provider for CERT benchmarking.

    Supports Gemini models including:
    - gemini-2.0-flash-exp
    - gemini-1.5-pro
    - gemini-1.5-flash
    """

    def __init__(self, api_key: str, timeout: int = 30):
        """Initialize Google Gemini provider.

        Args:
            api_key: Google API key
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            self.genai = genai
            self.logger.info("Google Gemini client initialized")
        except ImportError:
            raise ImportError(
                "google-generativeai package not installed. "
                "Install with: pip install google-generativeai"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize Google client: {e}")
            raise

    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ResponseMetadata:
        """Call Gemini model and capture metadata.

        Args:
            model: Gemini model identifier
            prompt: Input prompt
            max_tokens: Maximum output tokens
            temperature: Sampling temperature

        Returns:
            ResponseMetadata with response and timing
        """
        start_time = time.time()

        try:
            # Initialize model
            model_obj = self.genai.GenerativeModel(model)

            # Call Gemini API
            response = model_obj.generate_content(
                prompt,
                generation_config=self.genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature,
                ),
            )

            latency = time.time() - start_time

            # Extract response text
            response_text = response.text

            # Extract token usage (if available)
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
                raw_response={},
            )

            self.logger.debug(
                f"Gemini {model} responded in {latency:.2f}s "
                f"({len(response_text)} chars)"
            )

            return metadata

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"Google Gemini API error: {e}")

            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
                error=str(e),
                timeout=isinstance(e, TimeoutError),
            )

    def _extract_token_count(self, response) -> dict:
        """Extract token counts from Gemini response.

        Args:
            response: Gemini API response object

        Returns:
            Dict with token counts
        """
        try:
            # Gemini provides token counts in usage_metadata
            if hasattr(response, "usage_metadata"):
                return {
                    "input": response.usage_metadata.prompt_token_count,
                    "output": response.usage_metadata.candidates_token_count,
                    "total": response.usage_metadata.total_token_count,
                }
        except (AttributeError, TypeError):
            pass
        return {"input": None, "output": None, "total": None}

    def get_provider_name(self) -> str:
        """Get provider name.

        Returns:
            'google'
        """
        return "google"
