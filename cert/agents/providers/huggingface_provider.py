"""Hugging Face provider implementation for CERT framework.

Supports both:
1. Inference API (serverless): Fast, no setup, supports DeepSeek, Qwen, etc.
2. Local models: Load models with transformers library for full control
"""

import time

from .base import ProviderInterface, ResponseMetadata


class HuggingFaceProvider(ProviderInterface):
    """Hugging Face provider with dual mode support.

    Modes:
    - 'api': Use Inference API (requires HF_TOKEN)
    - 'local': Load model locally with transformers (requires GPU recommended)

    Supported models (API mode):
    - 'deepseek-ai/DeepSeek-V3'
    - 'Qwen/Qwen2.5-72B-Instruct'
    - 'meta-llama/Llama-3.3-70B-Instruct'
    - Any model with Inference API enabled
    """

    def __init__(
        self,
        api_key: str,
        timeout: int = 30,
        mode: str = "api",
        device: str = "auto",
    ):
        """Initialize HuggingFace provider.

        Args:
            api_key: Hugging Face API token
            timeout: Request timeout in seconds
            mode: 'api' for Inference API, 'local' for local models
            device: Device for local mode ('auto', 'cuda', 'cpu')
        """
        super().__init__(api_key, timeout)
        self.mode = mode
        self.device = device
        self.client = None
        self.tokenizer = None
        self.model = None

        if mode == "api":
            self._init_api_client()
        elif mode == "local":
            # Lazy loading - model loaded on first call
            pass
        else:
            raise ValueError(f"Invalid mode: {mode}. Use 'api' or 'local'")

    def _init_api_client(self):
        """Initialize Inference API client."""
        try:
            from huggingface_hub import InferenceClient

            self.client = InferenceClient(token=self.api_key)
            self.logger.info("Initialized HuggingFace Inference API client")
        except ImportError:
            raise ImportError(
                "huggingface_hub not installed. "
                "Install with: pip install huggingface-hub"
            )

    def _load_local_model(self, model: str):
        """Load model locally with transformers.

        Args:
            model: Model identifier from HuggingFace Hub
        """
        if self.model is not None:
            self.logger.info(f"Model {model} already loaded")
            return

        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer

            self.logger.info(f"Loading model {model} locally (this may take time)...")

            self.tokenizer = AutoTokenizer.from_pretrained(model)
            self.model = AutoModelForCausalLM.from_pretrained(
                model, device_map=self.device, torch_dtype="auto"
            )

            self.logger.info(f"Model {model} loaded successfully on {self.device}")
        except ImportError:
            raise ImportError(
                "transformers not installed. "
                "Install with: pip install transformers torch"
            )
        except Exception as e:
            self.logger.error(f"Failed to load model {model}: {e}")
            raise

    async def call_model(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ResponseMetadata:
        """Call HuggingFace model (API or local).

        Args:
            model: Model identifier (e.g., 'deepseek-ai/DeepSeek-V3')
            prompt: Input prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature

        Returns:
            ResponseMetadata with response and metrics
        """
        if self.mode == "api":
            return await self._call_api(model, prompt, max_tokens, temperature)
        else:
            return await self._call_local(model, prompt, max_tokens, temperature)

    async def _call_api(
        self,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> ResponseMetadata:
        """Call via Inference API.

        Args:
            model: Model identifier
            prompt: Input prompt
            max_tokens: Maximum tokens
            temperature: Temperature

        Returns:
            ResponseMetadata
        """
        import asyncio

        start_time = time.time()

        try:
            # Run in thread pool since InferenceClient is synchronous
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.text_generation(
                    prompt,
                    model=model,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    return_full_text=False,
                ),
            )

            latency = time.time() - start_time

            # Estimate token counts (API doesn't always provide this)
            tokens_input = len(prompt.split()) * 1.3  # Rough approximation
            tokens_output = len(response.split()) * 1.3

            return ResponseMetadata(
                response_text=response,
                latency_seconds=latency,
                tokens_input=int(tokens_input),
                tokens_output=int(tokens_output),
                tokens_total=int(tokens_input + tokens_output),
                model=model,
                provider="huggingface",
            )

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"HuggingFace API error: {e}")
            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider="huggingface",
                error=str(e),
            )

    async def _call_local(
        self,
        model: str,
        prompt: str,
        max_tokens: int,
        temperature: float,
    ) -> ResponseMetadata:
        """Call local model with transformers.

        Args:
            model: Model identifier
            prompt: Input prompt
            max_tokens: Maximum tokens
            temperature: Temperature

        Returns:
            ResponseMetadata
        """
        import asyncio

        # Load model if not already loaded
        self._load_local_model(model)

        start_time = time.time()

        try:
            # Run inference in thread pool (blocking operation)
            loop = asyncio.get_event_loop()

            def generate():
                inputs = self.tokenizer(prompt, return_tensors="pt").to(
                    self.model.device
                )
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    do_sample=True if temperature > 0 else False,
                )
                response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                # Remove input prompt from response
                if response.startswith(prompt):
                    response = response[len(prompt) :].strip()
                return response, inputs["input_ids"].shape[1], outputs.shape[1]

            response_text, input_length, output_length = await loop.run_in_executor(
                None, generate
            )

            latency = time.time() - start_time

            return ResponseMetadata(
                response_text=response_text,
                latency_seconds=latency,
                tokens_input=input_length,
                tokens_output=output_length - input_length,
                tokens_total=output_length,
                model=model,
                provider="huggingface-local",
            )

        except Exception as e:
            latency = time.time() - start_time
            self.logger.error(f"Local model error: {e}")
            return ResponseMetadata(
                response_text="",
                latency_seconds=latency,
                model=model,
                provider="huggingface-local",
                error=str(e),
            )

    def get_provider_name(self) -> str:
        """Get provider name.

        Returns:
            'huggingface' or 'huggingface-local'
        """
        return "huggingface" if self.mode == "api" else "huggingface-local"
