"""
Caching utilities for evaluation to improve performance.

Provides LRU caching for repeated evaluations of the same text pairs.
Useful when running multiple evaluations or when the same context/answer
pairs appear frequently.
"""

import hashlib
from functools import lru_cache
from typing import Any


def cache_key(*args: Any) -> str:
    """Generate cache key from arguments.

    Args:
        *args: Variable arguments to hash

    Returns:
        MD5 hash of concatenated arguments
    """
    combined = "|".join(str(arg) for arg in args)
    return hashlib.md5(combined.encode()).hexdigest()


@lru_cache(maxsize=1000)
def cached_measure(
    text1: str,
    text2: str,
    threshold: float = 0.7,
    use_semantic: bool = True,
    use_nli: bool = True,
    use_grounding: bool = True,
) -> Any:
    """Cached measurement for repeated evaluations.

    Uses LRU cache with maxsize=1000 to store recent evaluation results.
    This significantly speeds up repeated evaluations of the same text pairs.

    Args:
        text1: First text (typically the answer)
        text2: Second text (typically the context)
        threshold: Confidence threshold
        use_semantic: Enable semantic similarity
        use_nli: Enable NLI contradiction detection
        use_grounding: Enable term grounding analysis

    Returns:
        Measurement result object

    Note:
        Cache is shared across all calls. Use clear_cache() to reset.
    """
    from cert.measure import measure

    return measure(
        text1=text1,
        text2=text2,
        threshold=threshold,
        use_semantic=use_semantic,
        use_nli=use_nli,
        use_grounding=use_grounding,
    )


def clear_cache():
    """Clear the measurement cache.

    Useful for testing or when you want to free memory.
    """
    cached_measure.cache_clear()
    print("✓ Measurement cache cleared")


def get_cache_info() -> dict:
    """Get cache statistics.

    Returns:
        Dictionary with cache hits, misses, size, and maxsize
    """
    info = cached_measure.cache_info()
    return {
        "hits": info.hits,
        "misses": info.misses,
        "maxsize": info.maxsize,
        "currsize": info.currsize,
        "hit_rate": info.hits / (info.hits + info.misses) if (info.hits + info.misses) > 0 else 0.0,
    }


class MeasurementCache:
    """Persistent cache for measurements (optional, for advanced use).

    This class provides a disk-based cache for evaluation results,
    useful for very large datasets or long-running evaluations.
    """

    def __init__(self, cache_dir: str = ".cert_cache"):
        """Initialize persistent cache.

        Args:
            cache_dir: Directory to store cache files
        """
        from pathlib import Path

        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def get(self, key: str) -> Any:
        """Get cached result by key.

        Args:
            key: Cache key (use cache_key() to generate)

        Returns:
            Cached result or None if not found
        """
        import json

        cache_file = self.cache_dir / f"{key}.json"
        if cache_file.exists():
            with open(cache_file) as f:
                return json.load(f)
        return None

    def set(self, key: str, value: Any) -> None:
        """Store result in cache.

        Args:
            key: Cache key
            value: Result to cache (must be JSON-serializable)
        """
        import json

        cache_file = self.cache_dir / f"{key}.json"
        with open(cache_file, "w") as f:
            json.dump(value, f)

    def clear(self) -> None:
        """Clear all cached results."""
        import shutil

        if self.cache_dir.exists():
            shutil.rmtree(self.cache_dir)
            self.cache_dir.mkdir(exist_ok=True)
        print(f"✓ Persistent cache cleared: {self.cache_dir}")

    def size(self) -> int:
        """Get number of cached items.

        Returns:
            Number of cache files
        """
        return len(list(self.cache_dir.glob("*.json")))
