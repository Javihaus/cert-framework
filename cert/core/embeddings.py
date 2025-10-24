"""Embedding utilities for semantic similarity.

This module provides sentence embedding functionality for semantic comparison.
Uses sentence-transformers for state-of-the-art semantic similarity.
"""

import logging
from typing import Dict, Optional

import numpy as np
from numpy.typing import NDArray
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    """Sentence embedding engine with caching.

    Uses sentence-transformers to generate embeddings for semantic similarity.
    Default model: all-MiniLM-L6-v2 (~90MB, faster) for measure()
    Production model: all-mpnet-base-v2 (~420MB, more accurate) available as option

    Attributes:
        model: SentenceTransformer model
        cache: Dictionary of text -> embedding cache
        cache_size: Maximum cache size
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        cache_size: int = 1000,
    ):
        """Initialize embedding engine.

        Args:
            model_name: Sentence transformer model name
            cache_size: Maximum number of embeddings to cache

        Note: First run downloads the model:
            - all-MiniLM-L6-v2: ~90MB (fast, good)
            - all-mpnet-base-v2: ~420MB (slower, excellent)
        """
        self.model_name = model_name
        self.cache_size = cache_size
        self.cache: Dict[str, NDArray[np.floating]] = {}

        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        logger.info(f"Embedding model loaded: {model_name}")

    def get_embedding(self, text: str) -> NDArray[np.floating]:
        """Get embedding for text with caching.

        Args:
            text: Text to embed

        Returns:
            Numpy array containing the embedding
        """
        if text in self.cache:
            return self.cache[text]

        # Generate embedding
        embedding = self.model.encode(text, convert_to_numpy=True)

        # Cache management (FIFO)
        if len(self.cache) >= self.cache_size:
            # Remove oldest entry
            self.cache.pop(next(iter(self.cache)))

        self.cache[text] = embedding
        return embedding

    def compute_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Cosine similarity score (0.0-1.0)
        """
        emb1 = self.get_embedding(text1)
        emb2 = self.get_embedding(text2)

        # Cosine similarity
        similarity = float(
            np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        )

        return similarity

    def clear_cache(self) -> None:
        """Clear the embedding cache."""
        self.cache.clear()
        logger.debug("Embedding cache cleared")


# Global singleton for efficient reuse
_GLOBAL_EMBEDDING_ENGINE: Optional[EmbeddingEngine] = None


def get_embedding_engine(model_name: str = "all-MiniLM-L6-v2") -> EmbeddingEngine:
    """Get global embedding engine (singleton pattern).

    Args:
        model_name: Sentence transformer model name

    Returns:
        EmbeddingEngine instance (reuses existing if same model)
    """
    global _GLOBAL_EMBEDDING_ENGINE

    if _GLOBAL_EMBEDDING_ENGINE is None or _GLOBAL_EMBEDDING_ENGINE.model_name != model_name:
        _GLOBAL_EMBEDDING_ENGINE = EmbeddingEngine(model_name=model_name)

    return _GLOBAL_EMBEDDING_ENGINE
