"""CERT Benchmark Framework - Agentic AI Model Provider Benchmarking.

This module provides a comprehensive benchmarking framework for comparing
language models across multiple providers (Anthropic, OpenAI, Google, xAI)
on key business dimensions:

- Consistency: Behavioral reliability across trials
- Performance: Output quality across diverse prompts
- Latency: Response time and throughput characteristics
- Output Quality: Length, diversity, and repetition patterns
- Robustness: Error handling and production reliability

Example usage:
    ```python
    from cert.benchmark import (
        BenchmarkConfig,
        CERTBenchmarkEngine,
        AnthropicProvider,
        OpenAIProvider,
    )

    # Configure benchmark
    config = BenchmarkConfig(
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

    # Run benchmark
    engine = CERTBenchmarkEngine(config, providers)
    summary = await engine.run_full_benchmark()

    # Access results
    for result in summary.consistency_results:
        print(f"{result.provider}/{result.model}: {result.consistency_score:.3f}")
    ```
"""

from .config import BenchmarkConfig, MetricConfig
from .engine import CERTBenchmarkEngine
from .metrics import (
    ConsistencyMetric,
    LatencyMetric,
    MetricBase,
    MetricRegistry,
    OutputQualityMetric,
    PerformanceMetric,
    RobustnessMetric,
)
from .providers import (
    AnthropicProvider,
    GoogleProvider,
    OpenAIProvider,
    ProviderInterface,
    ResponseMetadata,
    XAIProvider,
)
from .types import (
    AdvancedStatsResult,
    BenchmarkSummary,
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
    "BenchmarkConfig",
    "MetricConfig",
    # Engine
    "CERTBenchmarkEngine",
    # Providers
    "ProviderInterface",
    "ResponseMetadata",
    "AnthropicProvider",
    "OpenAIProvider",
    "GoogleProvider",
    "XAIProvider",
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
    "BenchmarkSummary",
]
