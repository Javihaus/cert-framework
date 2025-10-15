"""Embedding-based semantic comparison using sentence transformers."""

from typing import Optional
from cert.types import ComparisonResult

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False


class EmbeddingComparator:
    """
    Semantic comparator using sentence embeddings.

    Better than rule-based for:
    - Open-ended questions with multiple valid phrasings
    - Abstract concepts (e.g., "benefit of caching")
    - Different levels of detail

    Tradeoffs:
    - Requires sentence-transformers (~500MB download first time)
    - Slower: ~50-100ms per comparison vs <1ms for rules
    - Requires threshold tuning for your use case

    Args:
        model_name: Sentence transformer model to use
        threshold: Similarity threshold (0-1). Higher = stricter matching
        cache_size: Number of embeddings to cache (for consistency testing)

    Example:
        comparator = EmbeddingComparator(threshold=0.75)
        result = comparator.compare(
            "Reduced latency",
            "The main benefit is faster response times"
        )
        # result.matched = True, confidence = 0.82
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        threshold: float = 0.75,
        cache_size: int = 1000
    ):
        if not EMBEDDINGS_AVAILABLE:
            raise ImportError(
                "sentence-transformers not installed. Install with:\n"
                "  pip install cert-framework[embeddings]"
            )

        self.model = SentenceTransformer(model_name)
        self.threshold = threshold
        self.cache: dict = {}
        self.cache_size = cache_size

    def _get_embedding(self, text: str) -> 'np.ndarray':
        """Get embedding with caching."""
        if text in self.cache:
            return self.cache[text]

        embedding = self.model.encode(text, convert_to_numpy=True)

        # Simple cache management
        if len(self.cache) >= self.cache_size:
            # Remove oldest entry (FIFO)
            self.cache.pop(next(iter(self.cache)))

        self.cache[text] = embedding
        return embedding

    def compare(self, expected: str, actual: str) -> ComparisonResult:
        """
        Compare using cosine similarity of embeddings.

        Returns:
            ComparisonResult with matched=True if similarity >= threshold
        """
        # Get embeddings
        exp_emb = self._get_embedding(expected)
        act_emb = self._get_embedding(actual)

        # Compute cosine similarity
        similarity = float(np.dot(exp_emb, act_emb) / (
            np.linalg.norm(exp_emb) * np.linalg.norm(act_emb)
        ))

        matched = similarity >= self.threshold

        return ComparisonResult(
            matched=matched,
            rule="embedding-similarity",
            confidence=similarity
        )
