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
from .rag.semantic import SemanticComparator, ComparisonRule, ComparisonResult
from .intelligent_comparator import IntelligentComparator
from .rag.detectors import InputType, DetectionResult

# Conditional import for LangChain integration
try:
    from .integrations.langchain import wrap_chain, CertChainWrapper  # noqa: F401

    __all_langchain__ = ["wrap_chain", "CertChainWrapper"]
except ImportError:
    __all_langchain__ = []

# Embedding comparator (REQUIRED)
from .rag.embeddings import EmbeddingComparator  # noqa: F401
from .compare import compare, configure  # noqa: F401

__all_embeddings__ = ["EmbeddingComparator", "compare", "configure"]

# Conditional import for LLM Judge comparator
try:
    from .llm_judge import LLMJudgeComparator  # noqa: F401

    __all_llm_judge__ = ["LLMJudgeComparator"]
except ImportError:
    __all_llm_judge__ = []

__version__ = "1.1.0"

__all__ = (
    [
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
    ]
    + __all_langchain__
    + __all_embeddings__
    + __all_llm_judge__
)

# Agent assessment module is available as cert.agents
# Example: from cert.agents import CERTAgentEngine, AssessmentConfig
# Backward compatibility: cert.benchmark still works but is deprecated
