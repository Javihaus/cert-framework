"""CERT Framework v2.0 - Simplified API for AI System Testing

Three core functions for comprehensive AI testing:
1. measure() - Text reliability and similarity measurement
2. cost_tracker() - Token usage and cost tracking
3. agent_monitor() - Agent/model monitoring and assessment

This is the NEW v2.0 API with explicit parameters and simplified usage.
For v1.x compatibility, the old API remains available but is deprecated.
"""

# ===== V2.0 Core Functions (NEW - Recommended) =====
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
        # ===== V2.0 Core Functions (NEW) =====
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
