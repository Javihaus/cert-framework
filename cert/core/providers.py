"""LLM Provider interfaces for CERT framework v2.0.

This module provides unified provider interfaces for all supported LLM providers:
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- xAI (Grok)
- HuggingFace (open source models)

All providers implement the ProviderInterface and return ResponseMetadata.
"""

import logging
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

# ============================================================================
# RESPONSE METADATA
# ============================================================================


@dataclass
class ResponseMetadata:
    """Metadata captured from LLM provider response.

    This structure ensures consistent metadata capture across providers
    for metrics calculation.

    Attributes:
        response_text: Model's response text
        latency_seconds: Request latency in seconds
        tokens_input: Number of input tokens (if available)
        tokens_output: Number of output tokens (if available)
        tokens_total: Total tokens (if available)
        model: Model identifier
        provider: Provider name
        error: Error message if request failed
        timeout: Whether request timed out
        raw_response: Raw API response for debugging
        timestamp: Unix timestamp of response
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


# ============================================================================
# BASE PROVIDER INTERFACE
# ============================================================================


class ProviderInterface(ABC):
    """Abstract interface for language model providers.

    All provider implementations must inherit from this class and implement
    the call_model() method. The interface ensures consistent behavior across
    different LLM providers.

    Key responsibilities:
    1. API authentication and client initialization
    2. Request formatting for provider-specific API
    3. Response parsing and metadata extraction
    4. Error handling and timeout management
    """

    def __init__(self, api_key: Optional[str] = None, timeout: int = 30):
        """Initialize provider with API key.

        Args:
            api_key: API key for the provider (if None, reads from environment)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key or self._get_api_key_from_env()
        self.timeout = timeout
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def _get_api_key_from_env(self) -> str:
        """Get API key from environment variable.

        Returns:
            API key from environment

        Raises:
            ValueError: If API key not found
        """
        pass

    @abstractmethod
    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.0,
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


# ============================================================================
# ANTHROPIC (CLAUDE) PROVIDER
# ============================================================================


class AnthropicProvider(ProviderInterface):
    """Anthropic Claude provider.

    Supports Claude models including:
    - claude-3-5-sonnet-20241022
    - claude-3-5-haiku-20241022
    - claude-3-opus-20240229
    """

    def _get_api_key_from_env(self) -> str:
        """Get Anthropic API key from environment."""
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY not found in environment. "
                "Set it with: export ANTHROPIC_API_KEY='your-key'"
            )
        return api_key

    def __init__(self, api_key: Optional[str] = None, timeout: int = 30):
        """Initialize Anthropic provider.

        Args:
            api_key: Anthropic API key (if None, reads from ANTHROPIC_API_KEY env var)
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            from anthropic import Anthropic

            self.client = Anthropic(api_key=self.api_key, timeout=timeout)
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
        temperature: float = 0.0,
    ) -> ResponseMetadata:
        """Call Claude model and capture metadata."""
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
                f"Claude {model} responded in {latency:.2f}s ({len(response_text)} chars)"
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

    def _extract_token_count(self, response) -> Dict[str, Optional[int]]:
        """Extract token counts from Anthropic response."""
        try:
            return {
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens,
                "total": response.usage.input_tokens + response.usage.output_tokens,
            }
        except (AttributeError, TypeError):
            return {"input": None, "output": None, "total": None}

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "anthropic"


# ============================================================================
# OPENAI (GPT) PROVIDER
# ============================================================================


class OpenAIProvider(ProviderInterface):
    """OpenAI GPT provider.

    Supports GPT models including:
    - gpt-4o
    - gpt-4o-mini
    - gpt-4-turbo
    - gpt-3.5-turbo
    """

    def _get_api_key_from_env(self) -> str:
        """Get OpenAI API key from environment."""
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY not found in environment. "
                "Set it with: export OPENAI_API_KEY='your-key'"
            )
        return api_key

    def __init__(self, api_key: Optional[str] = None, timeout: int = 30):
        """Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key (if None, reads from OPENAI_API_KEY env var)
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            from openai import OpenAI

            self.client = OpenAI(api_key=self.api_key, timeout=timeout)
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
        temperature: float = 0.0,
    ) -> ResponseMetadata:
        """Call GPT model and capture metadata."""
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

    def _extract_token_count(self, response) -> Dict[str, Optional[int]]:
        """Extract token counts from OpenAI response."""
        try:
            return {
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }
        except (AttributeError, TypeError):
            return {"input": None, "output": None, "total": None}

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "openai"


# ============================================================================
# GOOGLE (GEMINI) PROVIDER
# ============================================================================


class GoogleProvider(ProviderInterface):
    """Google Gemini provider.

    Supports Gemini models including:
    - gemini-2.0-flash-exp
    - gemini-pro
    - gemini-pro-vision
    """

    def _get_api_key_from_env(self) -> str:
        """Get Google API key from environment."""
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY not found in environment. "
                "Set it with: export GOOGLE_API_KEY='your-key'"
            )
        return api_key

    def __init__(self, api_key: Optional[str] = None, timeout: int = 30):
        """Initialize Google provider.

        Args:
            api_key: Google API key (if None, reads from GOOGLE_API_KEY env var)
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
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
        temperature: float = 0.0,
    ) -> ResponseMetadata:
        """Call Gemini model and capture metadata."""
        start_time = time.time()

        try:
            # Call Google Gemini API
            model_obj = self.genai.GenerativeModel(model)
            response = model_obj.generate_content(
                prompt,
                generation_config=self.genai.types.GenerationConfig(
                    max_output_tokens=max_tokens, temperature=temperature
                ),
            )

            latency = time.time() - start_time

            # Extract response text
            response_text = response.text

            # Build metadata (Gemini doesn't provide token counts easily)
            metadata = ResponseMetadata(
                response_text=response_text,
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
            )

            self.logger.debug(
                f"Gemini {model} responded in {latency:.2f}s ({len(response_text)} chars)"
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

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "google"


# ============================================================================
# XAI (GROK) PROVIDER
# ============================================================================


class XAIProvider(ProviderInterface):
    """xAI Grok provider.

    Supports Grok models including:
    - grok-2-latest
    - grok-beta
    """

    def _get_api_key_from_env(self) -> str:
        """Get xAI API key from environment."""
        api_key = os.environ.get("XAI_API_KEY")
        if not api_key:
            raise ValueError(
                "XAI_API_KEY not found in environment. "
                "Set it with: export XAI_API_KEY='your-key'"
            )
        return api_key

    def __init__(self, api_key: Optional[str] = None, timeout: int = 30):
        """Initialize xAI provider.

        Args:
            api_key: xAI API key (if None, reads from XAI_API_KEY env var)
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, timeout)
        try:
            from openai import OpenAI

            # Grok uses OpenAI-compatible API
            self.client = OpenAI(api_key=self.api_key, base_url="https://api.x.ai/v1")
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
        temperature: float = 0.0,
    ) -> ResponseMetadata:
        """Call Grok model and capture metadata."""
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

    def _extract_token_count(self, response) -> Dict[str, Optional[int]]:
        """Extract token counts from xAI response."""
        try:
            return {
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }
        except (AttributeError, TypeError):
            return {"input": None, "output": None, "total": None}

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "xai"


# ============================================================================
# HUGGINGFACE PROVIDER
# ============================================================================


class HuggingFaceProvider(ProviderInterface):
    """HuggingFace provider for open-source models.

    Supports both:
    - API inference (via HuggingFace Inference API)
    - Local inference (via transformers library)
    """

    def _get_api_key_from_env(self) -> str:
        """Get HuggingFace API token from environment."""
        api_key = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
        if not api_key:
            raise ValueError(
                "HF_TOKEN not found in environment. "
                "Set it with: export HF_TOKEN='your-token'"
            )
        return api_key

    def __init__(
        self, api_key: Optional[str] = None, timeout: int = 30, use_local: bool = False
    ):
        """Initialize HuggingFace provider.

        Args:
            api_key: HuggingFace API token (if None, reads from HF_TOKEN env var)
            timeout: Request timeout in seconds
            use_local: Whether to use local inference (default: API)
        """
        super().__init__(api_key, timeout)
        self.use_local = use_local
        self.logger.info(
            f"HuggingFace provider initialized ({'local' if use_local else 'API'})"
        )

    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.0,
    ) -> ResponseMetadata:
        """Call HuggingFace model and capture metadata."""
        if self.use_local:
            return await self._call_local(model, prompt, max_tokens, temperature)
        else:
            return await self._call_api(model, prompt, max_tokens, temperature)

    async def _call_api(
        self, model: str, prompt: str, max_tokens: int, temperature: float
    ) -> ResponseMetadata:
        """Call HuggingFace Inference API."""
        start_time = time.time()

        try:
            import requests

            headers = {"Authorization": f"Bearer {self.api_key}"}
            api_url = f"https://api-inference.huggingface.co/models/{model}"

            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                    "return_full_text": False,
                },
            }

            response = requests.post(
                api_url, headers=headers, json=payload, timeout=self.timeout
            )
            response.raise_for_status()

            latency = time.time() - start_time

            # Parse response
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                response_text = result[0].get("generated_text", "")
            else:
                response_text = str(result)

            metadata = ResponseMetadata(
                response_text=response_text,
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
            )

            self.logger.debug(
                f"HuggingFace {model} responded in {latency:.2f}s "
                f"({len(response_text)} chars)"
            )

            return metadata

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"HuggingFace API error: {e}")

            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
                error=str(e),
                timeout=isinstance(e, TimeoutError),
            )

    async def _call_local(
        self, model: str, prompt: str, max_tokens: int, temperature: float
    ) -> ResponseMetadata:
        """Call HuggingFace model locally."""
        start_time = time.time()

        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer

            # Load model and tokenizer (cached after first load)
            tokenizer = AutoTokenizer.from_pretrained(model)
            model_obj = AutoModelForCausalLM.from_pretrained(model)

            # Tokenize input
            inputs = tokenizer(prompt, return_tensors="pt")

            # Generate
            outputs = model_obj.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature if temperature > 0 else 1.0,
                do_sample=True if temperature > 0 else False,
            )

            # Decode
            response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

            # Remove prompt from response if present
            if response_text.startswith(prompt):
                response_text = response_text[len(prompt) :].strip()

            latency = time.time() - start_time

            metadata = ResponseMetadata(
                response_text=response_text,
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
            )

            self.logger.debug(
                f"HuggingFace local {model} responded in {latency:.2f}s "
                f"({len(response_text)} chars)"
            )

            return metadata

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"HuggingFace local error: {e}")

            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider=self.get_provider_name(),
                error=str(e),
                timeout=False,
            )

    def get_provider_name(self) -> str:
        """Get provider name."""
        return "huggingface"


# ============================================================================
# PROVIDER FACTORY
# ============================================================================


def get_provider(
    provider_name: str, api_key: Optional[str] = None, **kwargs
) -> ProviderInterface:
    """Factory function to get provider instance by name.

    Args:
        provider_name: Provider identifier (anthropic, openai, google, xai, huggingface)
        api_key: API key (if None, reads from environment)
        **kwargs: Additional provider-specific arguments

    Returns:
        Provider instance

    Raises:
        ValueError: If provider_name is not supported

    Example:
        provider = get_provider("openai")
        response = await provider.call_model("gpt-4o", "Hello")
    """
    providers = {
        "anthropic": AnthropicProvider,
        "openai": OpenAIProvider,
        "google": GoogleProvider,
        "xai": XAIProvider,
        "huggingface": HuggingFaceProvider,
    }

    provider_name = provider_name.lower()

    if provider_name not in providers:
        raise ValueError(
            f"Unknown provider: {provider_name}. "
            f"Supported providers: {list(providers.keys())}"
        )

    return providers[provider_name](api_key=api_key, **kwargs)
