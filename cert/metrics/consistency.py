"""Consistency metric calculator.

Measures behavioral reliability across multiple trials using semantic
embeddings to calculate variance in responses.
"""

import logging
from typing import List

import numpy as np
from scipy.spatial.distance import pdist

from cert.core.embeddings import get_embedding_engine
from cert.core.types import ConsistencyMetric

logger = logging.getLogger(__name__)


def calculate_consistency(
    responses: List[str],
    embedding_model: str = "all-MiniLM-L6-v2",
) -> ConsistencyMetric:
    """Calculate consistency score from multiple responses.

    Consistency measures how similar responses are to each other across trials.
    Uses semantic embeddings to compute pairwise distances, then calculates
    consistency as 1 - (std_dev / mean_distance).

    High consistency = low variance in responses = predictable behavior
    Low consistency = high variance = unpredictable behavior

    Args:
        responses: List of response texts from multiple trials
        embedding_model: Sentence transformer model for embeddings

    Returns:
        ConsistencyMetric with:
            - score: Consistency score (0.0-1.0), higher = more consistent
            - mean_distance: Average semantic distance between responses
            - std_distance: Standard deviation of distances
            - num_trials: Number of valid responses
            - responses: All response texts

    Raises:
        ValueError: If fewer than 2 valid responses

    Example:
        responses = [
            "Machine learning is AI subset",
            "ML is part of artificial intelligence",
            "Machine learning falls under AI"
        ]
        metric = calculate_consistency(responses)
        print(f"Consistency: {metric.score:.3f}")  # ~0.85 (high consistency)
    """
    # Filter empty/invalid responses
    valid_responses = [r for r in responses if r and len(r.strip()) > 0]

    if len(valid_responses) < 2:
        raise ValueError(
            f"Need at least 2 valid responses for consistency calculation, "
            f"got {len(valid_responses)}"
        )

    logger.debug(f"Calculating consistency for {len(valid_responses)} responses")

    # Get embedding engine
    embedding_engine = get_embedding_engine(model_name=embedding_model)

    # Generate embeddings
    embeddings = []
    for response in valid_responses:
        emb = embedding_engine.get_embedding(response)
        embeddings.append(emb)

    embeddings_array = np.array(embeddings)

    # Calculate pairwise cosine distances
    distances = pdist(embeddings_array, metric="cosine")

    if len(distances) == 0:
        # Only one unique embedding (all responses identical)
        return ConsistencyMetric(
            score=1.0,
            mean_distance=0.0,
            std_distance=0.0,
            num_trials=len(valid_responses),
            responses=valid_responses,
        )

    # Calculate statistics
    mean_distance = float(np.mean(distances))
    std_distance = float(np.std(distances))

    # Calculate consistency score
    # Consistency = 1 - (coefficient of variation)
    # When std_dev is 0, consistency is perfect (1.0)
    # When std_dev approaches mean, consistency is low (→0)
    if mean_distance == 0:
        consistency_score = 1.0
    else:
        # Coefficient of variation: std / mean
        cv = std_distance / mean_distance
        # Consistency: 1 - cv, bounded to [0, 1]
        consistency_score = max(0.0, min(1.0, 1.0 - cv))

    logger.info(
        f"Consistency: {consistency_score:.3f} "
        f"(mean_dist={mean_distance:.3f}, std_dist={std_distance:.3f})"
    )

    return ConsistencyMetric(
        score=consistency_score,
        mean_distance=mean_distance,
        std_distance=std_distance,
        num_trials=len(valid_responses),
        responses=valid_responses,
    )
