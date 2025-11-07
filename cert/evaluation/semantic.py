"""
Semantic similarity evaluator (default for CERT).

Uses cosine similarity + NLI + grounding analysis to evaluate
if an answer is grounded in provided context.
"""

from typing import Any, Dict

from cert.evaluation.base import AccuracyEvaluator


class SemanticEvaluator(AccuracyEvaluator):
    """Default evaluator using semantic similarity.

    Combines three signals:
    - Semantic similarity (embeddings)
    - Natural Language Inference (entailment)
    - Term grounding (lexical overlap)

    Suitable for general-purpose LLM applications where semantic
    equivalence is acceptable.
    """

    def __init__(self):
        """Initialize semantic evaluator with ML models."""
        try:
            from cert.measure import measure
        except ImportError as e:
            raise ImportError(
                "SemanticEvaluator requires: pip install cert-framework[evaluation]\n"
                f"Original error: {e}"
            )
        self._measure = measure

    @property
    def description(self) -> str:
        return "Semantic similarity using embeddings + NLI + grounding"

    def evaluate(self, context: str, answer: str, threshold: float = 0.7) -> Dict[str, Any]:
        """Evaluate using semantic similarity.

        Args:
            context: Source context
            answer: Generated answer
            threshold: Confidence threshold

        Returns:
            Dict with matched, confidence, and component scores
        """
        result = self._measure(text1=answer, text2=context, threshold=threshold)

        return {
            "matched": result.matched,
            "confidence": result.confidence,
            "semantic_score": result.semantic_score,
            "nli_score": result.nli_score,
            "grounding_score": result.grounding_score,
            "evaluator": self.name,
        }
