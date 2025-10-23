"""Shared utilities used across CERT framework.

This module contains utilities shared by all three core capabilities:
- Single model testing
- RAG systems
- Agent pipelines
"""

from .compare import compare, configure
from .runner import TestRunner, ConsistencyError, AccuracyError
from .types import (
    GroundTruth,
    TestResult,
    TestConfig,
    ConsistencyResult,
    DegradationAlert,
    TestStatus,
    HumanAnnotation,
    ComparisonResult,
)

__all__ = [
    # Compare API
    "compare",
    "configure",
    # Test Runner
    "TestRunner",
    "ConsistencyError",
    "AccuracyError",
    # Types
    "GroundTruth",
    "TestResult",
    "TestConfig",
    "ConsistencyResult",
    "DegradationAlert",
    "TestStatus",
    "HumanAnnotation",
    "ComparisonResult",
]
