"""Minimal coordination monitoring for multi-agent systems.

Measures coordination effectiveness using gamma (γ) metric:
γ = coordinated_performance / (baseline_a * baseline_b)

If γ > 1.0: Coordination is helping
If γ < 1.0: Coordination is hurting
If γ ≈ 1.0: No coordination effect
"""

import logging
from dataclasses import dataclass
from typing import Callable, List

import numpy as np

from cert.core.embeddings import get_embedding_engine

logger = logging.getLogger(__name__)


@dataclass
class CoordinationResult:
    """Result from coordination monitoring.

    Attributes:
        gamma: Coordination effect (coordinated / independent)
        baseline_a: Agent A baseline performance
        baseline_b: Agent B baseline performance
        coordinated_performance: Actual coordinated performance
        num_trials: Number of trials run
        recommendation: Plain-English recommendation
    """

    gamma: float
    baseline_a: float
    baseline_b: float
    coordinated_performance: float
    num_trials: int
    recommendation: str


def measure_coordination(
    agent_a: Callable[[str], str],
    agent_b: Callable[[str], str],
    coordinated_func: Callable[[str], str],
    test_prompts: List[str],
    trials_per_agent: int = 10,
) -> CoordinationResult:
    """Measure coordination effectiveness between two agents.

    Compares coordinated performance (A → B) vs independent baselines.

    Args:
        agent_a: First agent function (takes prompt, returns response)
        agent_b: Second agent function (takes prompt, returns response)
        coordinated_func: Coordinated function (A's output → B)
        test_prompts: List of test prompts
        trials_per_agent: Number of trials per agent (default: 10)

    Returns:
        CoordinationResult with gamma metric and baselines

    Example:
        >>> def agent_a(prompt):
        ...     return model_a.generate(prompt)
        >>>
        >>> def agent_b(prompt):
        ...     return model_b.generate(prompt)
        >>>
        >>> def coordinated(prompt):
        ...     output_a = agent_a(prompt)
        ...     return agent_b(f"Improve this: {output_a}")
        >>>
        >>> result = measure_coordination(
        ...     agent_a, agent_b, coordinated,
        ...     test_prompts=["Analyze X", "Evaluate Y"]
        ... )
        >>>
        >>> print(f"Gamma: {result.gamma:.3f}")
        >>> print(result.recommendation)
    """
    logger.info("Measuring coordination between agents")

    # Establish baseline for agent A
    logger.info("Establishing baseline for Agent A...")
    baseline_a = _establish_baseline(agent_a, test_prompts[:trials_per_agent])

    # Establish baseline for agent B
    logger.info("Establishing baseline for Agent B...")
    baseline_b = _establish_baseline(agent_b, test_prompts[:trials_per_agent])

    # Measure coordinated performance
    logger.info("Measuring coordinated performance...")
    coordinated_perf = _establish_baseline(
        coordinated_func, test_prompts[:trials_per_agent]
    )

    # Calculate gamma
    expected_independent = baseline_a * baseline_b

    if expected_independent == 0:
        gamma = 0.0
        recommendation = (
            "⚠ Cannot calculate coordination effect (baseline performance is zero)"
        )
    else:
        gamma = coordinated_perf / expected_independent

        if gamma > 1.1:
            recommendation = (
                f"✓ Coordination is HELPING (+{(gamma - 1.0) * 100:.1f}% improvement). "
                "The coordinated system performs better than independent agents."
            )
        elif gamma < 0.9:
            recommendation = (
                f"✗ Coordination is HURTING ({(1.0 - gamma) * 100:.1f}% degradation). "
                "Consider using single agent instead."
            )
        else:
            recommendation = (
                "≈ Coordination has NO significant effect. "
                "Coordinated performance similar to independent agents."
            )

    logger.info(
        f"Coordination effect: γ={gamma:.3f} "
        f"(baseline_a={baseline_a:.3f}, baseline_b={baseline_b:.3f}, "
        f"coordinated={coordinated_perf:.3f})"
    )

    return CoordinationResult(
        gamma=gamma,
        baseline_a=baseline_a,
        baseline_b=baseline_b,
        coordinated_performance=coordinated_perf,
        num_trials=trials_per_agent,
        recommendation=recommendation,
    )


def _establish_baseline(agent_func: Callable[[str], str], prompts: List[str]) -> float:
    """Establish baseline performance for an agent.

    Args:
        agent_func: Agent function to test
        prompts: List of test prompts

    Returns:
        Average quality score (0.0 - 1.0)
    """
    embedding_engine = get_embedding_engine()
    scores = []

    for prompt in prompts:
        try:
            response = agent_func(prompt)

            # Score response quality using semantic similarity to prompt
            # (Simplified version - notebook has more complex ResponseEvaluator)
            score = _score_response_simple(prompt, response, embedding_engine)
            scores.append(score)

        except Exception as e:
            logger.warning(f"Error in baseline trial: {e}")
            scores.append(0.0)

    if not scores:
        return 0.0

    return float(np.mean(scores))


def _score_response_simple(
    prompt: str, response: str, embedding_engine
) -> float:
    """Simple response scoring (simplified from notebook's ResponseEvaluator).

    Measures:
    - Semantic relevance (50%)
    - Response completeness (30%)
    - Has structure (20%)

    Args:
        prompt: Input prompt
        response: Agent response
        embedding_engine: Embedding engine for similarity

    Returns:
        Quality score (0.0 - 1.0)
    """
    if not response or len(response.strip()) < 10:
        return 0.0

    try:
        # 1. Semantic relevance (50%)
        similarity = embedding_engine.compute_similarity(prompt, response)
        relevance = max(0.0, min(1.0, (similarity + 1) / 2))  # Normalize to [0,1]

        # 2. Completeness (30%) - based on response length
        word_count = len(response.split())
        completeness = min(1.0, word_count / 200)  # 200 words = excellent

        # 3. Structure (20%) - has basic formatting
        has_structure = 0.5
        if any(char in response for char in [".", "\n", ":"]):
            has_structure = 1.0

        # Weighted score
        score = relevance * 0.5 + completeness * 0.3 + has_structure * 0.2

        return float(score)

    except Exception as e:
        logger.warning(f"Error scoring response: {e}")
        return 0.5  # Default neutral score
