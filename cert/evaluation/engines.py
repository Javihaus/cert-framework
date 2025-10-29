"""
Lazy model loading for evaluation engines.

Models are loaded only when first needed (lazy evaluation) and cached
in memory for subsequent uses. This improves cold start time and reduces
memory usage when evaluation is not needed.
"""

import threading
from typing import Optional


class LazyModelLoader:
    """Singleton pattern for lazy model loading.

    Models are loaded on first use and cached for subsequent calls.
    Thread-safe implementation using double-checked locking.
    """

    _instance = None
    _lock = threading.Lock()
    _embedding_engine = None
    _nli_engine = None
    _embedding_model_name = None
    _nli_model_name = None

    @classmethod
    def get_embedding_engine(cls, model_name: str = "all-MiniLM-L6-v2"):
        """Get or create embedding engine (lazy loaded).

        Args:
            model_name: Name of sentence-transformers model to use

        Returns:
            EmbeddingEngine instance
        """
        # Check if we need to reload (model name changed)
        if cls._embedding_engine is not None and cls._embedding_model_name != model_name:
            cls._embedding_engine = None

        # Double-checked locking for thread safety
        if cls._embedding_engine is None:
            with cls._lock:
                if cls._embedding_engine is None:
                    try:
                        from cert.measure.embeddings import EmbeddingEngine

                        print(f"Loading embedding model: {model_name}...")
                        cls._embedding_engine = EmbeddingEngine(model_name)
                        cls._embedding_model_name = model_name
                        print(f"✓ Embedding model loaded")
                    except ImportError as e:
                        raise ImportError(
                            "Embedding engine requires: pip install cert-framework[evaluation]\n"
                            f"Original error: {e}"
                        )

        return cls._embedding_engine

    @classmethod
    def get_nli_engine(cls, model_name: str = "microsoft/deberta-v3-base"):
        """Get or create NLI engine (lazy loaded).

        Args:
            model_name: Name of transformers NLI model to use

        Returns:
            NLIEngine instance
        """
        # Check if we need to reload (model name changed)
        if cls._nli_engine is not None and cls._nli_model_name != model_name:
            cls._nli_engine = None

        # Double-checked locking for thread safety
        if cls._nli_engine is None:
            with cls._lock:
                if cls._nli_engine is None:
                    try:
                        from cert.measure.nli import NLIEngine

                        print(f"Loading NLI model: {model_name}...")
                        cls._nli_engine = NLIEngine(model_name)
                        cls._nli_model_name = model_name
                        print(f"✓ NLI model loaded")
                    except ImportError as e:
                        raise ImportError(
                            "NLI engine requires: pip install cert-framework[evaluation]\n"
                            f"Original error: {e}"
                        )

        return cls._nli_engine

    @classmethod
    def clear_cache(cls):
        """Clear loaded models (useful for testing or memory management)."""
        with cls._lock:
            cls._embedding_engine = None
            cls._nli_engine = None
            cls._embedding_model_name = None
            cls._nli_model_name = None
            print("✓ Model cache cleared")

    @classmethod
    def is_loaded(cls, engine_type: str) -> bool:
        """Check if a specific engine is loaded.

        Args:
            engine_type: 'embedding' or 'nli'

        Returns:
            True if engine is loaded, False otherwise
        """
        if engine_type == "embedding":
            return cls._embedding_engine is not None
        elif engine_type == "nli":
            return cls._nli_engine is not None
        else:
            raise ValueError(f"Unknown engine type: {engine_type}")

    @classmethod
    def get_memory_usage(cls) -> dict:
        """Get approximate memory usage of loaded models.

        Returns:
            Dictionary with memory estimates in MB
        """
        import sys

        memory = {
            "embedding_engine": 0,
            "nli_engine": 0,
            "total": 0,
        }

        if cls._embedding_engine is not None:
            # Rough estimate: ~100MB for MiniLM
            memory["embedding_engine"] = 100

        if cls._nli_engine is not None:
            # Rough estimate: ~500MB for DeBERTa
            memory["nli_engine"] = 500

        memory["total"] = memory["embedding_engine"] + memory["nli_engine"]

        return memory
