"""CERT Framework - EU AI Act Article 15 Compliance for LLM Systems

Automatic accuracy monitoring for LLM systems in regulated industries.

Primary use case: RAG hallucination detection for EU AI Act compliance.

Quick Start:
    >>> import cert
    >>> @cert.monitor
    >>> def my_rag(query):
    >>>     context = retrieve(query)
    >>>     answer = llm(context, query)
    >>>     return answer

Three use cases:
1. RAG hallucination detection (Article 15.1 + 15.4)
2. Single model accuracy verification (Article 15.1)
3. Multi-agent coordination monitoring (Article 15.4)

For v1.x compatibility, the old API remains available but is deprecated.
"""

# ===== PRIMARY API (User-Centric) =====
from .monitor import monitor
from .presets import Preset, get_preset, list_presets

# ===== REPORTS & COMPLIANCE =====
# TODO: Implement in next phase
# from .reports import export_report, show_report

# ===== ADVANCED API (Power Users) =====
from .measure import measure
from .cost_tracker import cost_tracker, cost_tracker_from_response, track_batch_costs
from .agent_monitor import agent_monitor

# ===== V2.0 Core Types =====
from .core.types import (
    # Result types
    MeasurementResult,
    CostResult,
    CostTrackerAccumulator,
    AgentMonitorResult,
    # Metric types
    ConsistencyMetric,
    PerformanceMetric,
    LatencyMetric,
    OutputQualityMetric,
    RobustnessMetric,
)

# ===== V2.0 Provider Utilities =====
from .core.providers import (
    get_provider,
    AnthropicProvider,
    OpenAIProvider,
    GoogleProvider,
    XAIProvider,
    HuggingFaceProvider,
)

# ===== V1.x Legacy API (DEPRECATED - will be removed in v3.0) =====
from .utilities import (
    compare as compare_v1,  # Deprecated: use measure() instead
    configure,  # Deprecated: pass params directly to measure()
    TestRunner,
    ConsistencyError,
    AccuracyError,
    ComparisonResult,
)

from .single_model import (
    measure_consistency,
    autodiagnose_variance,
    IntelligentComparator,
)

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

__version__ = "2.0.0-beta"

__all__ = (
    [
        # ===== PRIMARY API (User-Centric) =====
        "monitor",
        "Preset",
        "get_preset",
        "list_presets",
        # ===== ADVANCED API (Power Users) =====
        "measure",
        "cost_tracker",
        "cost_tracker_from_response",
        "track_batch_costs",
        "agent_monitor",
        # ===== V2.0 Core Types =====
        "MeasurementResult",
        "CostResult",
        "CostTrackerAccumulator",
        "AgentMonitorResult",
        "ConsistencyMetric",
        "PerformanceMetric",
        "LatencyMetric",
        "OutputQualityMetric",
        "RobustnessMetric",
        # ===== V2.0 Providers =====
        "get_provider",
        "AnthropicProvider",
        "OpenAIProvider",
        "GoogleProvider",
        "XAIProvider",
        "HuggingFaceProvider",
        # ===== V1.x Legacy (DEPRECATED) =====
        "compare_v1",
        "configure",
        "TestRunner",
        "ConsistencyError",
        "AccuracyError",
        "ComparisonResult",
        "measure_consistency",
        "autodiagnose_variance",
        "IntelligentComparator",
        "InputType",
        "DetectionResult",
        "SemanticComparator",
        "ComparisonRule",
        "EmbeddingComparator",
    ]
    + __all_langchain__
    + __all_llm_judge__
)
