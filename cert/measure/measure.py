"""Measurement function for text reliability assessment.

This module provides the measure() function - the primary entry point for
measuring semantic similarity and reliability between two texts.

Replaces all previous comparison functions (compare, configure, RAG functions).
"""

import logging
from typing import Optional

from cert.measure.embeddings import get_embedding_engine
from cert.measure.grounding import compute_grounding_score, get_ungrounded_terms
from cert.measure.nli import get_nli_engine
from cert.measure.types import MeasurementResult

logger = logging.getLogger(__name__)


def measure(
    text1: str,
    text2: str,
    *,
    use_semantic: bool = True,
    semantic_weight: float = 0.3,
    use_nli: bool = True,
    nli_weight: float = 0.5,
    use_grounding: bool = True,
    grounding_weight: float = 0.2,
    threshold: float = 0.7,
    embedding_model: str = "all-MiniLM-L6-v2",
    nli_model: str = "microsoft/deberta-v3-base",
    **kwargs,
) -> MeasurementResult:
    """Measure reliability/similarity between two texts.

    Combines semantic embeddings, NLI contradiction detection, and grounding
    analysis to produce a confidence score indicating how well text1 aligns with text2.

    Args:
        text1: First text (typically model output/answer)
        text2: Second text (typically context/ground truth)
        use_semantic: Enable semantic similarity via embeddings
        semantic_weight: Weight for semantic component (0.0-1.0)
        use_nli: Enable NLI contradiction detection
        nli_weight: Weight for NLI component (0.0-1.0)
        use_grounding: Enable term grounding analysis
        grounding_weight: Weight for grounding component (0.0-1.0)
        threshold: Confidence threshold for match (0.0-1.0)
        embedding_model: Sentence transformer model name
        nli_model: NLI model name
        **kwargs: Additional parameters (reserved for future use)

    Returns:
        MeasurementResult with:
            - matched: bool (confidence >= threshold)
            - confidence: float (0.0-1.0)
            - semantic_score: float (if enabled)
            - nli_score: float (if enabled)
            - grounding_score: float (if enabled)
            - threshold_used: float
            - rule: str (description of decision)
            - components_used: list of enabled components

    Raises:
        ValueError: If no components enabled or weights invalid

    Examples:
        # Basic semantic comparison
        result = measure("revenue increased", "sales grew")
        print(result.matched, result.confidence)

        # RAG hallucination detection
        result = measure(
            text1="Revenue was $500B",
            text2="Revenue was $391B in 2023",
            use_nli=True,
            nli_weight=0.5
        )
        if not result.matched:
            print("Potential hallucination detected!")

        # Fast mode (semantic only)
        result = measure(
            text1="Fast response",
            text2="Quick reply",
            use_semantic=True,
            use_nli=False,
            use_grounding=False
        )

        # Customized weights
        result = measure(
            text1, text2,
            semantic_weight=0.4,
            nli_weight=0.4,
            grounding_weight=0.2,
            threshold=0.8
        )
    """
    # Validate inputs
    if not text1 or not text2:
        raise ValueError("Both text1 and text2 must be non-empty strings")

    # Validate at least one component enabled
    if not (use_semantic or use_nli or use_grounding):
        raise ValueError("At least one component (semantic, nli, grounding) must be enabled")

    # Normalize weights
    enabled_weights = []
    if use_semantic:
        enabled_weights.append(semantic_weight)
    if use_nli:
        enabled_weights.append(nli_weight)
    if use_grounding:
        enabled_weights.append(grounding_weight)

    total_weight = sum(enabled_weights)
    if total_weight == 0:
        raise ValueError("Sum of enabled component weights must be > 0")

    # Normalize weights to sum to 1.0
    if use_semantic:
        semantic_weight = semantic_weight / total_weight
    if use_nli:
        nli_weight = nli_weight / total_weight
    if use_grounding:
        grounding_weight = grounding_weight / total_weight

    logger.debug(
        f"Measuring: semantic={use_semantic}({semantic_weight:.2f}), "
        f"nli={use_nli}({nli_weight:.2f}), "
        f"grounding={use_grounding}({grounding_weight:.2f})"
    )

    # Compute component scores
    semantic_score: Optional[float] = None
    nli_score: Optional[float] = None
    grounding_score: Optional[float] = None
    components_used = []

    # 1. Semantic similarity
    if use_semantic:
        try:
            embedding_engine = get_embedding_engine(model_name=embedding_model)
            semantic_score = embedding_engine.compute_similarity(text1, text2)
            components_used.append("semantic")
            logger.debug(f"Semantic score: {semantic_score:.3f}")
        except Exception as e:
            logger.error(f"SEMANTIC FAILED: {type(e).__name__}: {e}", exc_info=True)
            # Don't return fake score - let caller handle it
            raise RuntimeError(f"Semantic similarity component failed: {e}") from e

    # 2. NLI (treat text2 as premise, text1 as hypothesis)
    if use_nli:
        try:
            nli_engine = get_nli_engine(model_name=nli_model)
            nli_result = nli_engine.check_entailment(context=text2, answer=text1)
            nli_score = nli_result.entailment_score
            components_used.append("nli")
            logger.debug(f"NLI: {nli_result.label} (score: {nli_score:.3f})")
        except Exception as e:
            logger.error(f"NLI FAILED: {type(e).__name__}: {e}", exc_info=True)
            # Don't return fake score - let caller handle it
            raise RuntimeError(f"NLI component failed: {e}") from e

    # 3. Grounding (check if text1 terms appear in text2)
    if use_grounding:
        try:
            grounding_score = compute_grounding_score(context=text2, answer=text1)
            components_used.append("grounding")
            logger.debug(f"Grounding score: {grounding_score:.3f}")

            # Log ungrounded terms for debugging
            ungrounded = get_ungrounded_terms(context=text2, answer=text1)
            if ungrounded:
                logger.debug(f"Ungrounded terms: {ungrounded}")
        except Exception as e:
            logger.error(f"GROUNDING FAILED: {type(e).__name__}: {e}", exc_info=True)
            # Don't return fake score - let caller handle it
            raise RuntimeError(f"Grounding component failed: {e}") from e

    # Compute weighted confidence
    confidence = 0.0

    if use_semantic and semantic_score is not None:
        confidence += semantic_weight * semantic_score

    if use_nli and nli_score is not None:
        confidence += nli_weight * nli_score

    if use_grounding and grounding_score is not None:
        confidence += grounding_weight * grounding_score

    # Determine match
    matched = confidence >= threshold

    # Generate rule description
    rule = _generate_rule_description(
        matched=matched,
        confidence=confidence,
        threshold=threshold,
        components_used=components_used,
        semantic_score=semantic_score,
        nli_score=nli_score,
        grounding_score=grounding_score,
    )

    # Build result
    result = MeasurementResult(
        matched=matched,
        confidence=confidence,
        semantic_score=semantic_score,
        nli_score=nli_score,
        grounding_score=grounding_score,
        threshold_used=threshold,
        rule=rule,
        components_used=components_used,
        metadata={
            "embedding_model": embedding_model if use_semantic else None,
            "nli_model": nli_model if use_nli else None,
            "weights": {
                "semantic": semantic_weight if use_semantic else 0.0,
                "nli": nli_weight if use_nli else 0.0,
                "grounding": grounding_weight if use_grounding else 0.0,
            },
        },
    )

    logger.info(
        f"Measurement complete: matched={matched}, confidence={confidence:.3f}, "
        f"components={components_used}"
    )

    return result


def _generate_rule_description(
    matched: bool,
    confidence: float,
    threshold: float,
    components_used: list,
    semantic_score: Optional[float],
    nli_score: Optional[float],
    grounding_score: Optional[float],
) -> str:
    """Generate human-readable rule description.

    Args:
        matched: Whether texts matched
        confidence: Overall confidence score
        threshold: Threshold used
        components_used: List of components used
        semantic_score: Semantic similarity score
        nli_score: NLI entailment score
        grounding_score: Grounding score

    Returns:
        Human-readable description
    """
    if matched:
        status = f"Match (confidence {confidence:.2f} >= threshold {threshold:.2f})"
    else:
        status = f"No match (confidence {confidence:.2f} < threshold {threshold:.2f})"

    # Identify strongest/weakest components
    scores = []
    if semantic_score is not None:
        scores.append(("semantic", semantic_score))
    if nli_score is not None:
        scores.append(("nli", nli_score))
    if grounding_score is not None:
        scores.append(("grounding", grounding_score))

    if scores:
        scores.sort(key=lambda x: x[1], reverse=True)
        strongest = scores[0]
        weakest = scores[-1]

        details = f"; strongest: {strongest[0]}({strongest[1]:.2f})"
        if len(scores) > 1:
            details += f", weakest: {weakest[0]}({weakest[1]:.2f})"
    else:
        details = ""

    return f"{status}{details}"


# Backward compatibility alias (will be removed in future version)
def compare(text1: str, text2: str, **kwargs) -> MeasurementResult:
    """Legacy alias for measure(). Use measure() instead.

    This function is deprecated and will be removed in a future version.
    """
    logger.warning(
        "compare() is deprecated. Use measure() instead. compare() will be removed in v3.0.0"
    )
    return measure(text1, text2, **kwargs)
