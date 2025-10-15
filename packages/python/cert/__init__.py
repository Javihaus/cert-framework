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
    HumanAnnotation,
)
from .runner import TestRunner, ConsistencyError, AccuracyError
from .consistency import measure_consistency, autodiagnose_variance
from .semantic import SemanticComparator, ComparisonRule, ComparisonResult
from .intelligent_comparator import IntelligentComparator
from .detectors import InputType, DetectionResult

# Conditional import for LangChain integration
try:
    from .langchain_integration import wrap_chain, CertChainWrapper
    __all_langchain__ = ["wrap_chain", "CertChainWrapper"]
except ImportError:
    __all_langchain__ = []

# Conditional import for Embedding comparator
try:
    from .embeddings import EmbeddingComparator
    __all_embeddings__ = ["EmbeddingComparator"]
except ImportError:
    __all_embeddings__ = []

# Conditional import for LLM Judge comparator
try:
    from .llm_judge import LLMJudgeComparator
    __all_llm_judge__ = ["LLMJudgeComparator"]
except ImportError:
    __all_llm_judge__ = []

__version__ = "1.0.0"

__all__ = [
    # Types
    "GroundTruth",
    "TestResult",
    "TestConfig",
    "ConsistencyResult",
    "DegradationAlert",
    "TestStatus",
    "HumanAnnotation",
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
    "IntelligentComparator",
    # Detectors
    "InputType",
    "DetectionResult",
] + __all_langchain__ + __all_embeddings__ + __all_llm_judge__
