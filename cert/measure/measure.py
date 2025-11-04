"""
Simplified measurement API.

Simple case: measure(text1, text2) → float
Advanced case: measure_detailed() or measure_batch() with options
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple


@dataclass
class MeasurementResult:
    """Result of measuring similarity between two texts."""

    confidence: float  # 0.0 to 1.0
    semantic_score: float  # Semantic similarity component
    grounding_score: float  # Term grounding component

    def is_accurate(self, threshold: float = 0.5) -> bool:
        """Check if confidence exceeds threshold."""
        return self.confidence >= threshold


def measure(text1: str, text2: str) -> float:
    """
    Measure accuracy between two texts.

    Simple function that works for 95% of use cases.
    Returns confidence score from 0.0 (completely different)
    to 1.0 (identical meaning).

    Args:
        text1: First text (typically LLM output)
        text2: Second text (typically ground truth)

    Returns:
        Confidence score between 0.0 and 1.0

    Example:
        >>> confidence = measure(
        ...     "Apple's revenue was $450B",  # LLM hallucination
        ...     "Apple's revenue was $89.5B"  # Ground truth
        ... )
        >>> print(f"{confidence:.2f}")  # 0.42 - low confidence flags error
        0.42

    Note:
        For batch processing or advanced options, use measure_batch().
    """
    # Input validation - check types first
    if not isinstance(text1, str) or not isinstance(text2, str):
        raise TypeError(f"Expected strings, got {type(text1)} and {type(text2)}")

    if not text1 or not text2:
        raise ValueError("Both text1 and text2 must be non-empty strings")

    # Import here to avoid loading ML models unless actually used
    from cert.measure.embeddings import get_embedding_engine
    from cert.measure.grounding import compute_grounding_score

    # Compute semantic similarity
    embedding_engine = get_embedding_engine()
    semantic = embedding_engine.compute_similarity(text1, text2)

    # Compute term grounding
    grounding = compute_grounding_score(text1, text2)

    # Combined score (50-50 weight validated on benchmarks)
    confidence = 0.5 * semantic + 0.5 * grounding

    return confidence


def measure_detailed(text1: str, text2: str) -> MeasurementResult:
    """
    Measure accuracy with detailed breakdown.

    Returns full result object showing both semantic and grounding scores.
    Use this when you need to debug why confidence is low.

    Example:
        >>> result = measure_detailed(
        ...     "Apple's revenue was $450B",
        ...     "Apple's revenue was $89.5B"
        ... )
        >>> print(f"Confidence: {result.confidence:.2f}")
        >>> print(f"Semantic: {result.semantic_score:.2f}")
        >>> print(f"Grounding: {result.grounding_score:.2f}")
        >>> if not result.is_accurate(threshold=0.6):
        ...     print("Low confidence - check grounding score")
    """
    # Input validation - check types first
    if not isinstance(text1, str) or not isinstance(text2, str):
        raise TypeError(f"Expected strings, got {type(text1)} and {type(text2)}")

    if not text1 or not text2:
        raise ValueError("Both texts must be non-empty")

    from cert.measure.embeddings import get_embedding_engine
    from cert.measure.grounding import compute_grounding_score

    # Compute components
    embedding_engine = get_embedding_engine()
    semantic = embedding_engine.compute_similarity(text1, text2)
    grounding = compute_grounding_score(text1, text2)
    confidence = 0.5 * semantic + 0.5 * grounding

    return MeasurementResult(
        confidence=confidence,
        semantic_score=semantic,
        grounding_score=grounding,
    )


@dataclass
class BatchOptions:
    """Options for batch measurement."""

    batch_size: int = 32
    show_progress: bool = False
    stop_on_error: bool = False


def measure_batch(
    pairs: List[Tuple[str, str]], options: Optional[BatchOptions] = None
) -> List[float]:
    """
    Measure multiple text pairs efficiently.

    Use this when you have many pairs to measure. Processes in batches
    for better performance than calling measure() in a loop.

    Args:
        pairs: List of (text1, text2) tuples
        options: Optional batch processing options

    Returns:
        List of confidence scores in same order as input pairs

    Example:
        >>> pairs = [
        ...     ("output1", "truth1"),
        ...     ("output2", "truth2"),
        ...     ("output3", "truth3"),
        ... ]
        >>> scores = measure_batch(pairs)
        >>> print(f"Average confidence: {sum(scores)/len(scores):.2f}")
    """
    if not pairs:
        return []

    opts = options or BatchOptions()

    # Validate inputs
    valid_pairs = []
    for i, (text1, text2) in enumerate(pairs):
        if not text1 or not text2:
            if opts.stop_on_error:
                raise ValueError(f"Empty text in pair {i}")
            else:
                print(f"Warning: Skipping empty pair at index {i}")
                continue
        valid_pairs.append((text1, text2))

    if not valid_pairs:
        return []

    # Process pairs
    results = []

    # Process in batches
    for i in range(0, len(valid_pairs), opts.batch_size):
        batch = valid_pairs[i : i + opts.batch_size]

        batch_results = []
        for text1, text2 in batch:
            try:
                score = measure(text1, text2)
                batch_results.append(score)
            except Exception as e:
                if opts.stop_on_error:
                    raise
                print(f"Warning: Error measuring pair: {e}")
                batch_results.append(0.0)

        results.extend(batch_results)

    return results
