"""Single model testing and evaluation.

This module provides tools for testing individual language models including:
- Consistency measurement across multiple trials
- LLM-as-judge evaluation
- Intelligent comparison with type detection
"""

from .consistency import measure_consistency, autodiagnose_variance
from .intelligent_comparator import IntelligentComparator
from .protocols import ComparatorProtocol

# Conditional import for LLM Judge
try:
    from .llm_judge import LLMJudgeComparator  # noqa: F401

    __all_llm__ = ["LLMJudgeComparator"]
except ImportError:
    __all_llm__ = []

__all__ = [
    "measure_consistency",
    "autodiagnose_variance",
    "IntelligentComparator",
    "ComparatorProtocol",
] + __all_llm__
