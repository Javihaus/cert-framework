"""
Resource lifecycle management with context managers.

Provides:
- ResourceManager ABC
- ModelResource (GPU/CPU models)
- Thread-safe loading/unloading
- Memory monitoring
"""

import logging
import threading
import time
from abc import ABC, abstractmethod
from typing import Any, Optional

from cert.core.errors import ResourceLoadError

logger = logging.getLogger(__name__)


class ResourceManager(ABC):
    """Base class for managed resources with explicit lifecycle."""

    def __init__(self, name: str = "resource"):
        """
        Initialize resource manager.

        Args:
            name: Resource name for logging
        """
        self._name = name
        self._loaded = False
        self._load_time: Optional[float] = None

    @abstractmethod
    def load(self) -> None:
        """Load resource with error handling."""
        pass

    @abstractmethod
    def unload(self) -> None:
        """Explicit cleanup."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        Check resource health.

        Returns:
            True if resource is healthy and functional
        """
        pass

    def is_loaded(self) -> bool:
        """Check if resource is loaded."""
        return self._loaded

    def get_load_time(self) -> Optional[float]:
        """Get time taken to load resource."""
        return self._load_time

    def __enter__(self):
        """Context manager entry."""
        self.load()
        return self

    def __exit__(self, *args):
        """Context manager exit with cleanup."""
        self.unload()


class ModelResource(ResourceManager):
    """Manage ML model lifecycle with GPU memory tracking."""

    def __init__(
        self,
        model_name: str,
        device: str = "auto",
        resource_name: Optional[str] = None,
    ):
        """
        Initialize model resource.

        Args:
            model_name: Model identifier (HuggingFace model name or path)
            device: Device to load model on ('auto', 'cuda', 'cpu')
            resource_name: Optional name override for logging
        """
        super().__init__(name=resource_name or f"model:{model_name}")
        self._model = None
        self._model_name = model_name
        self._device = self._select_device(device)
        self._lock = threading.Lock()
        self._memory_usage: Optional[int] = None

    def _select_device(self, device: str) -> str:
        """
        Select appropriate device.

        Args:
            device: Requested device ('auto', 'cuda', 'cpu')

        Returns:
            Actual device to use
        """
        if device == "auto":
            try:
                import torch

                if torch.cuda.is_available():
                    return "cuda"
            except ImportError:
                pass
            return "cpu"
        return device

    def load(self) -> None:
        """Load model with explicit error handling and memory tracking."""
        with self._lock:
            if self._loaded:
                logger.debug(f"Model '{self._model_name}' already loaded")
                return

            start = time.time()
            try:
                self._model = self._load_model()
                self._load_time = time.time() - start
                self._memory_usage = self._measure_memory()
                self._loaded = True

                logger.info(
                    f"Model loaded successfully: {self._model_name}",
                    extra={
                        "model": self._model_name,
                        "device": self._device,
                        "load_time_s": self._load_time,
                        "memory_mb": self._memory_usage / 1024 / 1024
                        if self._memory_usage
                        else None,
                    },
                )
            except Exception as e:
                logger.error(
                    f"Failed to load model '{self._model_name}': {e}", exc_info=True
                )
                raise ResourceLoadError(
                    f"Model load failed: {e}",
                    context={"model": self._model_name, "device": self._device},
                ) from e

    def _load_model(self) -> Any:
        """
        Load the actual model. Override in subclasses.

        Returns:
            Loaded model object
        """
        # Base implementation - subclasses should override
        raise NotImplementedError("Subclasses must implement _load_model()")

    def _measure_memory(self) -> Optional[int]:
        """
        Measure memory usage of loaded model.

        Returns:
            Memory usage in bytes, or None if cannot measure
        """
        try:
            import torch

            if self._device == "cuda" and torch.cuda.is_available():
                # GPU memory
                return torch.cuda.memory_allocated()
            else:
                # CPU memory (approximate using model parameters)
                if hasattr(self._model, "get_memory_footprint"):
                    return self._model.get_memory_footprint()
                elif hasattr(self._model, "num_parameters"):
                    # Rough estimate: 4 bytes per parameter (fp32)
                    return self._model.num_parameters() * 4
        except Exception as e:
            logger.debug(f"Could not measure memory: {e}")

        return None

    def unload(self) -> None:
        """Explicit cleanup with GPU cache clearing."""
        with self._lock:
            if not self._loaded:
                logger.debug(f"Model '{self._model_name}' not loaded")
                return

            try:
                if self._model is not None:
                    del self._model
                    self._model = None

                # Clear GPU cache if using CUDA
                if self._device == "cuda":
                    try:
                        import torch

                        if torch.cuda.is_available():
                            torch.cuda.empty_cache()
                            logger.debug("GPU cache cleared")
                    except ImportError:
                        pass

                self._loaded = False
                logger.info(f"Model unloaded: {self._model_name}")
            except Exception as e:
                logger.error(f"Error unloading model: {e}", exc_info=True)

    def health_check(self) -> bool:
        """
        Check if model is loaded and accessible.

        Returns:
            True if model is loaded
        """
        with self._lock:
            return self._loaded and self._model is not None

    @property
    def model(self) -> Any:
        """
        Get the loaded model.

        Returns:
            Model object

        Raises:
            RuntimeError: If model not loaded
        """
        if not self._loaded or self._model is None:
            raise RuntimeError(
                f"Model '{self._model_name}' not loaded. Call load() first."
            )
        return self._model

    @property
    def device(self) -> str:
        """Get device model is loaded on."""
        return self._device

    @property
    def memory_usage(self) -> Optional[int]:
        """Get model memory usage in bytes."""
        return self._memory_usage
