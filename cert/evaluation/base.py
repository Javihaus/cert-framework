"""
Abstract base class for accuracy evaluators.

This allows different industries to implement Article 15 compliance
according to their domain-specific requirements.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict


class AccuracyEvaluator(ABC):
    """Abstract base for pluggable accuracy evaluation strategies.

    Different industries interpret EU AI Act Article 15 differently:
    - General: Semantic similarity (default)
    - Financial: Exact match for numerical values
    - Healthcare: Medical terminology grounding
    - Legal: Citation and precedent accuracy

    Implement this interface to create custom evaluators for your domain.
    """

    @abstractmethod
    def evaluate(self, context: str, answer: str, threshold: float = 0.7) -> Dict[str, Any]:
        """Evaluate accuracy of an answer given context.

        Args:
            context: Source context (retrieved documents, knowledge base, etc.)
            answer: Generated answer or response
            threshold: Confidence threshold for pass/fail (0.0-1.0)

        Returns:
            Dictionary with at least:
                - matched: bool (passed threshold or not)
                - confidence: float (0.0-1.0 accuracy score)
                - Any additional domain-specific metrics

        Examples:
            >>> evaluator = SemanticEvaluator()
            >>> result = evaluator.evaluate(
            ...     context="The capital of France is Paris",
            ...     answer="Paris is the capital city",
            ...     threshold=0.7
            ... )
            >>> result['matched']
            True
            >>> result['confidence']
            0.92
        """
        pass

    @property
    def name(self) -> str:
        """Human-readable name for this evaluator."""
        return self.__class__.__name__

    @property
    def description(self) -> str:
        """Short description of what this evaluator measures."""
        return "Accuracy evaluator"

    def batch_evaluate(self, pairs: list, threshold: float = 0.7) -> list:
        """Evaluate multiple context-answer pairs.

        Default implementation calls evaluate() for each pair.
        Override for batch optimization if applicable.

        Args:
            pairs: List of (context, answer) tuples
            threshold: Confidence threshold for pass/fail

        Returns:
            List of evaluation result dictionaries
        """
        return [self.evaluate(context, answer, threshold) for context, answer in pairs]
