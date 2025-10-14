"""
CERT Framework - Consistency Evaluation and Reliability Testing for LLM systems.
"""

from .types import (
    GroundTruth,
    TestResult,
    TestConfig,
    ConsistencyResult,
    DegradationAlert,
    TestStatus,
)
from .runner import TestRunner, ConsistencyError, AccuracyError
from .consistency import measure_consistency, autodiagnose_variance
from .semantic import SemanticComparator, ComparisonRule, ComparisonResult

__version__ = "1.0.0"

__all__ = [
    # Types
    "GroundTruth",
    "TestResult",
    "TestConfig",
    "ConsistencyResult",
    "DegradationAlert",
    "TestStatus",
    # Runner
    "TestRunner",
    "ConsistencyError",
    "AccuracyError",
    # Consistency
    "measure_consistency",
    "autodiagnose_variance",
    # Semantic
    "SemanticComparator",
    "ComparisonRule",
    "ComparisonResult",
]
