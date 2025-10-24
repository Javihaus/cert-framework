"""Performance metric calculator.

Measures output quality across diverse prompts by scoring responses on
relevance, completeness, and structure.
"""

import logging
from typing import List, Tuple

import numpy as np

from cert.core.embeddings import get_embedding_engine
from cert.core.types import PerformanceMetric

logger = logging.getLogger(__name__)


def calculate_performance(
    prompt_response_pairs: List[Tuple[str, str]],
    embedding_model: str = "all-MiniLM-L6-v2",
) -> PerformanceMetric:
    """Calculate performance score from prompt-response pairs.

    Performance measures output quality by scoring each response on:
    - Semantic relevance to prompt (50%)
    - Completeness based on length (30%)
    - Structure (bullets, paragraphs, etc.) (20%)

    Args:
        prompt_response_pairs: List of (prompt, response) tuples
        embedding_model: Sentence transformer model for embeddings

    Returns:
        PerformanceMetric with:
            - mean_score: Average quality score (0.0-1.0)
            - std_score: Standard deviation
            - min_score: Minimum score observed
            - max_score: Maximum score observed
            - num_trials: Number of pairs evaluated
            - scores: All individual scores

    Raises:
        ValueError: If no valid pairs provided

    Example:
        pairs = [
            ("Explain AI", "AI is artificial intelligence..."),
            ("What is ML?", "Machine learning is a subset of AI..."),
        ]
        metric = calculate_performance(pairs)
        print(f"Performance: {metric.mean_score:.3f}")
    """
    if not prompt_response_pairs:
        raise ValueError("Must provide at least one prompt-response pair")

    logger.debug(f"Calculating performance for {len(prompt_response_pairs)} pairs")

    # Get embedding engine
    embedding_engine = get_embedding_engine(model_name=embedding_model)

    scores = []

    for prompt, response in prompt_response_pairs:
        score = _score_response(prompt, response, embedding_engine)
        scores.append(score)

    if not scores:
        raise ValueError("No valid scores calculated")

    # Calculate statistics
    mean_score = float(np.mean(scores))
    std_score = float(np.std(scores))
    min_score = float(np.min(scores))
    max_score = float(np.max(scores))

    logger.info(
        f"Performance: mean={mean_score:.3f}, std={std_score:.3f}, "
        f"range=[{min_score:.3f}, {max_score:.3f}]"
    )

    return PerformanceMetric(
        mean_score=mean_score,
        std_score=std_score,
        min_score=min_score,
        max_score=max_score,
        num_trials=len(scores),
        scores=scores,
    )


def _score_response(
    prompt: str,
    response: str,
    embedding_engine,
) -> float:
    """Score a single response's quality (0.0-1.0).

    Evaluates:
    - Semantic relevance to prompt (50%)
    - Response length/completeness (30%)
    - Presence of structured content (20%)

    Args:
        prompt: Input prompt
        response: Model response
        embedding_engine: EmbeddingEngine instance

    Returns:
        Quality score (0.0-1.0)
    """
    # Handle empty/invalid responses
    if not response or len(response.strip()) < 10:
        return 0.0

    try:
        # 1. Semantic relevance (50%)
        prompt_emb = embedding_engine.get_embedding(prompt)
        response_emb = embedding_engine.get_embedding(response)

        # Cosine similarity
        relevance = float(
            np.dot(prompt_emb, response_emb)
            / (np.linalg.norm(prompt_emb) * np.linalg.norm(response_emb))
        )

        # Normalize from [-1, 1] to [0, 1]
        relevance = max(0.0, min(1.0, (relevance + 1) / 2))

        # 2. Completeness based on length (30%)
        # 200 words = excellent, 0 words = poor
        word_count = len(response.split())
        completeness = min(1.0, word_count / 200)

        # 3. Structure (20%)
        # Check for bullets, numbering, paragraphs, colons
        has_structure = 0.5  # Default
        if any(marker in response for marker in ['.', '\n', ':', '-', '•', '1.', '2.']):
            has_structure = 1.0

        # Weighted score
        score = (
            relevance * 0.5 +
            completeness * 0.3 +
            has_structure * 0.2
        )

        return float(score)

    except Exception as e:
        logger.warning(f"Error scoring response: {e}")
        return 0.5  # Default neutral score on error
