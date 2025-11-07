"""
Evaluation module for offline accuracy measurement.

This module provides tools for batch evaluating trace logs with pluggable
accuracy evaluators for domain-specific EU AI Act Article 15 compliance.

Requires: pip install cert-framework[evaluation]

Examples:
    >>> # Default semantic similarity evaluator
    >>> from cert.evaluation import Evaluator
    >>> evaluator = Evaluator(threshold=0.8)
    >>> results = evaluator.evaluate_log_file("traces.jsonl")
    >>> print(f"Pass rate: {results['pass_rate']:.1%}")
    >>>
    >>> # Financial domain with exact match evaluator
    >>> from cert.evaluation import Evaluator, ExactMatchEvaluator
    >>> evaluator = Evaluator(accuracy_evaluator=ExactMatchEvaluator())
    >>> results = evaluator.evaluate_log_file("financial_traces.jsonl")
    >>>
    >>> # Custom evaluator for specialized domains
    >>> from cert.evaluation import AccuracyEvaluator
    >>> class MedicalEvaluator(AccuracyEvaluator):
    ...     def evaluate(self, context, answer, threshold):
    ...         # Your medical terminology validation here
    ...         return {"matched": True, "confidence": 0.95}
    >>> evaluator = Evaluator(accuracy_evaluator=MedicalEvaluator())
"""

from cert.evaluation.base import AccuracyEvaluator
from cert.evaluation.evaluator import Evaluator
from cert.evaluation.exact import ExactMatchEvaluator
from cert.evaluation.semantic import SemanticEvaluator

__all__ = ["Evaluator", "AccuracyEvaluator", "SemanticEvaluator", "ExactMatchEvaluator"]
