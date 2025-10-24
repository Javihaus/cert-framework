"""Output quality metric calculator.

Analyzes output characteristics like length, diversity, and repetition.
"""

import logging
from typing import List

import numpy as np
from scipy.spatial.distance import pdist

from cert.core.embeddings import get_embedding_engine
from cert.core.types import OutputQualityMetric

logger = logging.getLogger(__name__)


def calculate_output_quality(
    responses: List[str],
    embedding_model: str = "all-MiniLM-L6-v2",
) -> OutputQualityMetric:
    """Calculate output quality metrics from responses.

    Analyzes:
    - Mean response length (characters)
    - Semantic diversity (how different responses are)
    - Repetition score (how much repetition within responses)

    Args:
        responses: List of response texts
        embedding_model: Sentence transformer model for embeddings

    Returns:
        OutputQualityMetric with:
            - mean_length: Average response length in characters
            - semantic_diversity: Diversity score (0.0-1.0), higher = more diverse
            - repetition_score: Repetition score (0.0-1.0), lower = less repetition
            - num_trials: Number of responses analyzed

    Raises:
        ValueError: If no valid responses

    Example:
        responses = [
            "Response A with unique content",
            "Response B with different ideas",
            "Response C explores new concepts"
        ]
        metric = calculate_output_quality(responses)
        print(f"Diversity: {metric.semantic_diversity:.3f}")
    """
    if not responses:
        raise ValueError("Must provide at least one response")

    logger.debug(f"Calculating output quality for {len(responses)} responses")

    # Filter valid responses
    valid_responses = [r for r in responses if r and len(r.strip()) > 0]

    if not valid_responses:
        raise ValueError("No valid responses to analyze")

    # 1. Mean length
    lengths = [len(r) for r in valid_responses]
    mean_length = float(np.mean(lengths))

    # 2. Semantic diversity
    semantic_diversity = _calculate_semantic_diversity(valid_responses, embedding_model)

    # 3. Repetition score
    repetition_score = _calculate_repetition_score(valid_responses)

    logger.info(
        f"Output Quality: length={mean_length:.0f}, "
        f"diversity={semantic_diversity:.3f}, "
        f"repetition={repetition_score:.3f}"
    )

    return OutputQualityMetric(
        mean_length=mean_length,
        semantic_diversity=semantic_diversity,
        repetition_score=repetition_score,
        num_trials=len(valid_responses),
    )


def _calculate_semantic_diversity(
    responses: List[str],
    embedding_model: str,
) -> float:
    """Calculate semantic diversity of responses.

    Higher diversity = responses cover different topics/angles
    Lower diversity = responses are very similar

    Args:
        responses: List of responses
        embedding_model: Model name for embeddings

    Returns:
        Diversity score (0.0-1.0)
    """
    if len(responses) < 2:
        return 0.0  # Can't measure diversity with 1 response

    try:
        # Get embedding engine
        embedding_engine = get_embedding_engine(model_name=embedding_model)

        # Generate embeddings
        embeddings = []
        for response in responses:
            emb = embedding_engine.get_embedding(response)
            embeddings.append(emb)

        embeddings_array = np.array(embeddings)

        # Calculate pairwise cosine distances
        distances = pdist(embeddings_array, metric="cosine")

        # Diversity = mean distance
        # Higher distance = more diverse
        diversity = float(np.mean(distances))

        # Normalize to [0, 1]
        # Cosine distance is [0, 2], typical values [0, 1]
        diversity = min(1.0, diversity)

        return diversity

    except Exception as e:
        logger.warning(f"Error calculating semantic diversity: {e}")
        return 0.5  # Default neutral


def _calculate_repetition_score(responses: List[str]) -> float:
    """Calculate repetition score within responses.

    Measures how much repetition exists within individual responses.
    Lower score = less repetition (better)

    Args:
        responses: List of responses

    Returns:
        Repetition score (0.0-1.0), lower = less repetition
    """
    repetition_scores = []

    for response in responses:
        # Split into words
        words = response.lower().split()

        if len(words) < 2:
            repetition_scores.append(0.0)
            continue

        # Count unique vs total words
        unique_words = len(set(words))
        total_words = len(words)

        # Repetition = 1 - (unique / total)
        # If all words unique: repetition = 0
        # If all words same: repetition = 1
        repetition = 1.0 - (unique_words / total_words)

        repetition_scores.append(repetition)

    if not repetition_scores:
        return 0.0

    # Average across all responses
    return float(np.mean(repetition_scores))
