"""CERT Agents Module - Agentic System Assessment and Monitoring.

This module provides a comprehensive framework for assessing and monitoring
agentic systems across multiple LLM providers (Anthropic, OpenAI, Google, xAI, HuggingFace)
on key operational dimensions:

- Consistency: Behavioral reliability across trials
- Performance: Output quality across diverse prompts
- Latency: Response time and throughput characteristics
- Output Quality: Length, diversity, and repetition patterns
- Robustness: Error handling and production reliability

Example usage:
    ```python
    from cert.agents import (
        AssessmentConfig,
        CERTAgentEngine,
    )
    from cert.agents.providers import AnthropicProvider, OpenAIProvider

    # Configure assessment
    config = AssessmentConfig(
        consistency_trials=20,
        performance_trials=15,
        providers={
            'anthropic': ['claude-3-5-haiku-20241022'],
            'openai': ['gpt-4o-mini'],
        }
    )

    # Initialize providers
    providers = {
        'anthropic': AnthropicProvider(api_key='...'),
        'openai': OpenAIProvider(api_key='...'),
    }

    # Run assessment
    engine = CERTAgentEngine(config, providers)
    summary = await engine.run_full_assessment()

    # Access results
    for result in summary.consistency_results:
        print(f"{result.provider}/{result.model}: {result.consistency_score:.3f}")
    ```
"""

from .config import AssessmentConfig, MetricConfig
from .engine import CERTAgentEngine
from .metrics import (
    ConsistencyMetric,
    LatencyMetric,
    MetricBase,
    MetricRegistry,
    OutputQualityMetric,
    PerformanceMetric,
    RobustnessMetric,
)
from .types import (
    AdvancedStatsResult,
    AssessmentSummary,
    ConsistencyResult,
    CoordinationResult,
    CostResult,
    LatencyResult,
    OutputQualityResult,
    PerformanceResult,
    RobustnessResult,
)

__all__ = [
    # Configuration
    "AssessmentConfig",
    "MetricConfig",
    # Engine
    "CERTAgentEngine",
    # Metrics
    "MetricBase",
    "MetricRegistry",
    "ConsistencyMetric",
    "PerformanceMetric",
    "LatencyMetric",
    "OutputQualityMetric",
    "RobustnessMetric",
    # Result types
    "ConsistencyResult",
    "PerformanceResult",
    "LatencyResult",
    "OutputQualityResult",
    "RobustnessResult",
    "CoordinationResult",
    "CostResult",
    "AdvancedStatsResult",
    "AssessmentSummary",
]
