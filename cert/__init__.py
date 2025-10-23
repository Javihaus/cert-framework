"""
CERT Framework - Three Core Capabilities for LLM Systems

1. Single Model Testing: Individual model evaluation and consistency
2. RAG Systems: Hallucination detection and context grounding
3. Agent Pipelines: Multi-agent system assessment and monitoring
"""

# Utilities (shared across all three capabilities)
from .utilities import (
    compare,
    configure,
    TestRunner,
    ConsistencyError,
    AccuracyError,
    ComparisonResult,
)

# Single Model Testing
from .single_model import (
    measure_consistency,
    autodiagnose_variance,
    IntelligentComparator,
)

# RAG Systems
from .rag import (
    InputType,
    DetectionResult,
    SemanticComparator,
    ComparisonRule,
    EmbeddingComparator,
)

# Conditional import for LangChain integration
try:
    from .agents.integrations.langchain import wrap_chain, CertChainWrapper  # noqa: F401

    __all_langchain__ = ["wrap_chain", "CertChainWrapper"]
except ImportError:
    __all_langchain__ = []

# Conditional import for LLM Judge comparator
try:
    from .single_model.llm_judge import LLMJudgeComparator  # noqa: F401

    __all_llm_judge__ = ["LLMJudgeComparator"]
except ImportError:
    __all_llm_judge__ = []

__version__ = "1.0.0"

__all__ = (
    [
        # Utilities
        "compare",
        "configure",
        "TestRunner",
        "ConsistencyError",
        "AccuracyError",
        "ComparisonResult",
        # Single Model
        "measure_consistency",
        "autodiagnose_variance",
        "IntelligentComparator",
        # RAG
        "InputType",
        "DetectionResult",
        "SemanticComparator",
        "ComparisonRule",
        "EmbeddingComparator",
    ]
    + __all_langchain__
    + __all_llm_judge__
)

# Three core modules available as subpackages:
# - cert.single_model: Individual model testing
# - cert.rag: RAG system testing
# - cert.agents: Agent pipeline assessment
#   - cert.agents.providers: LLM providers (Anthropic, OpenAI, Google, xAI, HuggingFace)
#   - cert.agents.integrations: Framework integrations (LangChain, AutoGen, CrewAI)
