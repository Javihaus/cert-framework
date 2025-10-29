"""
Resource management for trajectory monitoring.

Specialized model resources for Hamiltonian trajectory analysis with:
- 8-bit quantization support
- GPU memory optimization
- Preload option for fast request handling
"""

import logging
from typing import Any, Tuple

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from cert.core.errors import GPUOutOfMemoryError, ResourceLoadError
from cert.core.resources import ModelResource

logger = logging.getLogger(__name__)


class HamiltonianModelResource(ModelResource):
    """Specialized model resource for trajectory monitoring."""

    def __init__(
        self,
        model_name: str,
        use_8bit: bool = True,
        device: str = "auto",
        preload: bool = False,
        trust_remote_code: bool = True,
    ):
        """
        Initialize trajectory model resource.

        Args:
            model_name: HuggingFace model identifier
            use_8bit: Use 8-bit quantization for memory efficiency
            device: Device selection ('auto', 'cuda', 'cpu')
            preload: Load model immediately (30s startup, fast requests)
            trust_remote_code: Trust remote code in model
        """
        super().__init__(model_name, device, resource_name=f"hamiltonian:{model_name}")
        self._use_8bit = use_8bit
        self._trust_remote_code = trust_remote_code
        self._tokenizer = None

        if preload:
            logger.info(f"Preloading model: {model_name}")
            self.load()

    def _load_model(self) -> Any:
        """
        Load model with 8-bit quantization for memory efficiency.

        Returns:
            Loaded model object

        Raises:
            ResourceLoadError: If model loading fails
            GPUOutOfMemoryError: If GPU runs out of memory
        """
        try:
            # Load tokenizer
            logger.debug(f"Loading tokenizer: {self._model_name}")
            self._tokenizer = AutoTokenizer.from_pretrained(
                self._model_name, trust_remote_code=self._trust_remote_code
            )

            # Set padding token if not set
            if self._tokenizer.pad_token is None:
                self._tokenizer.pad_token = self._tokenizer.eos_token
                logger.debug("Set pad_token to eos_token")

            # Load model with appropriate configuration
            logger.debug(f"Loading model: {self._model_name}")

            if self._use_8bit and self._device == "cuda":
                # 8-bit quantization for memory efficiency
                model = AutoModelForCausalLM.from_pretrained(
                    self._model_name,
                    device_map="auto",
                    load_in_8bit=True,
                    torch_dtype=torch.float16,
                    trust_remote_code=self._trust_remote_code,
                )
                logger.info("Model loaded with 8-bit quantization")
            else:
                # Standard loading
                model = AutoModelForCausalLM.from_pretrained(
                    self._model_name,
                    device_map="auto" if self._device == "cuda" else None,
                    torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
                    trust_remote_code=self._trust_remote_code,
                )
                logger.info("Model loaded in standard precision")

            # Move to device if not using device_map
            if self._device != "cuda" or not self._use_8bit:
                model = model.to(self._device)

            return model

        except torch.cuda.OutOfMemoryError as e:
            logger.error(f"GPU out of memory loading {self._model_name}")
            raise GPUOutOfMemoryError(
                f"GPU memory exhausted loading model: {self._model_name}",
                context={"model": self._model_name, "use_8bit": self._use_8bit},
            ) from e
        except Exception as e:
            logger.error(f"Failed to load model {self._model_name}: {e}")
            raise ResourceLoadError(
                f"Model loading failed: {e}", context={"model": self._model_name}
            ) from e

    def unload(self) -> None:
        """Explicit cleanup with tokenizer and GPU cache clearing."""
        with self._lock:
            if not self._loaded:
                return

            try:
                # Clean up tokenizer
                if self._tokenizer is not None:
                    del self._tokenizer
                    self._tokenizer = None

                # Clean up model
                if self._model is not None:
                    del self._model
                    self._model = None

                # Clear GPU cache
                if self._device == "cuda" and torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    logger.debug("GPU cache cleared")

                # Force garbage collection
                import gc

                gc.collect()

                self._loaded = False
                logger.info(f"Trajectory model unloaded: {self._model_name}")

            except Exception as e:
                logger.error(f"Error unloading trajectory model: {e}", exc_info=True)

    @property
    def tokenizer(self) -> Any:
        """
        Get the loaded tokenizer.

        Returns:
            Tokenizer object

        Raises:
            RuntimeError: If model/tokenizer not loaded
        """
        if not self._loaded or self._tokenizer is None:
            raise RuntimeError(f"Tokenizer for '{self._model_name}' not loaded. Call load() first.")
        return self._tokenizer

    def get_model_and_tokenizer(self) -> Tuple[Any, Any]:
        """
        Get both model and tokenizer.

        Returns:
            Tuple of (model, tokenizer)

        Raises:
            RuntimeError: If not loaded
        """
        return (self.model, self.tokenizer)

    def health_check(self) -> bool:
        """
        Check if model and tokenizer are loaded and functional.

        Returns:
            True if both model and tokenizer are loaded
        """
        with self._lock:
            return self._loaded and self._model is not None and self._tokenizer is not None

    def test_inference(self, test_prompt: str = "Test") -> bool:
        """
        Test if model can perform inference.

        Args:
            test_prompt: Test prompt for inference

        Returns:
            True if inference succeeds
        """
        if not self.health_check():
            return False

        try:
            with torch.no_grad():
                inputs = self._tokenizer(test_prompt, return_tensors="pt").to(self._device)
                self._model.generate(
                    inputs.input_ids,
                    max_new_tokens=5,
                    do_sample=False,
                )
            return True
        except Exception as e:
            logger.error(f"Inference test failed: {e}")
            return False
