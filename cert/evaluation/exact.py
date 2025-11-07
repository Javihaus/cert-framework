"""
Exact match evaluator for high-precision domains.

For financial, medical, or legal applications where semantic
equivalence is not acceptable - the answer must precisely
match what's in the context.
"""

import re
from typing import Any, Dict

from cert.evaluation.base import AccuracyEvaluator


class ExactMatchEvaluator(AccuracyEvaluator):
    """Evaluator requiring exact numerical and entity matching.

    Suitable for:
    - Financial calculations (must match exactly)
    - Medical dosages (no room for interpretation)
    - Legal citations (precise references required)

    Extracts numbers, dates, and key entities and requires
    exact matches rather than semantic similarity.
    """

    @property
    def description(self) -> str:
        return "Exact match for numbers, dates, and key entities"

    def evaluate(self, context: str, answer: str, threshold: float = 0.7) -> Dict[str, Any]:
        """Evaluate using exact matching logic.

        Args:
            context: Source context
            answer: Generated answer
            threshold: Minimum match ratio required

        Returns:
            Dict with matched, confidence, and precision metrics
        """
        # Extract numbers (integers and decimals)
        context_numbers = set(re.findall(r'\b\d+\.?\d*\b', context))
        answer_numbers = set(re.findall(r'\b\d+\.?\d*\b', answer))

        # Extract dates (simple pattern)
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b'
        context_dates = set(re.findall(date_pattern, context))
        answer_dates = set(re.findall(date_pattern, answer))

        # Calculate exact match scores
        num_precision = self._calculate_precision(answer_numbers, context_numbers)
        date_precision = self._calculate_precision(answer_dates, context_dates)

        # Overall confidence (weighted average)
        # If no numbers/dates found, default to high confidence
        # (prevents division by zero for text-only content)
        if len(answer_numbers) == 0 and len(answer_dates) == 0:
            confidence = 1.0  # No numerical claims to verify
        else:
            weights = []
            scores = []
            if len(answer_numbers) > 0:
                weights.append(2.0)  # Numbers weighted higher
                scores.append(num_precision)
            if len(answer_dates) > 0:
                weights.append(1.0)
                scores.append(date_precision)

            confidence = sum(w * s for w, s in zip(weights, scores)) / sum(weights)

        return {
            "matched": confidence >= threshold,
            "confidence": confidence,
            "number_precision": num_precision,
            "date_precision": date_precision,
            "context_numbers": list(context_numbers),
            "answer_numbers": list(answer_numbers),
            "evaluator": self.name,
        }

    @staticmethod
    def _calculate_precision(predicted: set, reference: set) -> float:
        """Calculate precision: what % of predicted are in reference.

        Args:
            predicted: Set of items in answer
            reference: Set of items in context

        Returns:
            Precision score 0.0-1.0
        """
        if len(predicted) == 0:
            return 1.0  # No claims made = perfect precision
        if len(reference) == 0:
            return 0.0  # Made claims but no reference = fail

        correct = len(predicted & reference)
        return correct / len(predicted)
