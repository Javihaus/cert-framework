"""
Evaluation module for offline accuracy measurement.

This module provides tools for batch evaluating trace logs with semantic similarity,
NLI contradiction detection, and grounding analysis.

Requires: pip install cert-framework[evaluation]

Example:
    >>> from cert.evaluation import Evaluator
    >>>
    >>> evaluator = Evaluator(preset="financial", threshold=0.8)
    >>> results = evaluator.evaluate_log_file("traces.jsonl")
    >>> print(f"Pass rate: {results['pass_rate']:.1%}")
"""

from cert.evaluation.evaluator import Evaluator

__all__ = ["Evaluator"]
