"""Type definitions for CERT agents assessment framework.

This module defines result dataclasses for all assessment metrics including:
- Consistency testing (behavioral reliability)
- Performance testing (output quality)
- Latency metrics (response time, throughput)
- Output quality metrics (length, diversity, repetition)
- Robustness metrics (error handling, timeouts)
"""

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class ConsistencyResult:
    """Results from consistency testing.

    Measures behavioral reliability across multiple trials using semantic embeddings.
    Higher consistency scores indicate more predictable model behavior.
    """

    provider: str
    model: str
    consistency_score: float  # 0-1, higher = more consistent
    mean_distance: float  # Average cosine distance between responses
    std_distance: float  # Standard deviation of distances
    num_trials: int
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class PerformanceResult:
    """Results from performance testing.

    Measures output quality across multiple prompts evaluating semantic relevance,
    completeness, and structure.
    """

    provider: str
    model: str
    mean_score: float  # 0-1, average quality score
    std_score: float  # Standard deviation of scores
    min_score: float  # Minimum score observed
    max_score: float  # Maximum score observed
    num_trials: int
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class LatencyResult:
    """Latency metrics from test execution.

    Captures response time characteristics including percentiles and throughput.
    Critical for production deployment decisions.
    """

    provider: str
    model: str
    mean_latency_seconds: float
    std_latency_seconds: float
    min_latency_seconds: float
    max_latency_seconds: float
    p50_latency_seconds: float  # Median latency
    p95_latency_seconds: float  # 95th percentile
    p99_latency_seconds: float  # 99th percentile
    tokens_per_second: Optional[float]  # Throughput if available
    num_trials: int
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class OutputQualityResult:
    """Output quality metrics.

    Analyzes response characteristics including length, semantic diversity,
    and repetition patterns.
    """

    provider: str
    model: str
    mean_output_length_tokens: float
    mean_output_length_words: float
    std_output_length_tokens: float
    std_output_length_words: float
    semantic_diversity_score: float  # 0-1, higher = more diverse responses
    repetition_score: float  # 0-1, lower = less repetition
    num_trials: int
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class RobustnessResult:
    """Robustness and error handling metrics.

    Tracks error rates, timeout behavior, and exception patterns to assess
    production reliability.
    """

    provider: str
    model: str
    error_rate: float  # Percentage 0-100
    timeout_rate: float  # Percentage 0-100
    exception_counts: Dict[str, int]  # {exception_type: count}
    successful_trials: int
    failed_trials: int
    timeout_trials: int
    num_trials: int
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class CoordinationResult:
    """Results from coordination testing (multi-agent scenarios).

    OPTIONAL metric: Measures performance degradation in multi-step workflows.
    """

    provider: str
    model: str
    mean_performance: float
    std_performance: float
    num_trials: int
    degradation_factor: float  # How much performance degrades vs single-step
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class CostResult:
    """Cost metrics (OPTIONAL - if available from provider).

    Tracks token usage and estimated costs for budget planning.
    """

    provider: str
    model: str
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    cost_per_1k_tokens: float
    num_trials: int
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class AdvancedStatsResult:
    """Advanced statistical metrics (OPTIONAL).

    Provides deeper statistical analysis for research and detailed comparisons.
    """

    provider: str
    model: str
    coefficient_of_variation: float  # CV = std/mean for normalized variability
    distribution_skewness: float  # Measure of distribution asymmetry
    distribution_kurtosis: float  # Measure of distribution tail behavior
    ci_95_lower: float  # 95% confidence interval lower bound
    ci_95_upper: float  # 95% confidence interval upper bound
    effect_size_vs_baseline: Optional[float]  # Cohen's d if baseline provided
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class AssessmentSummary:
    """Complete assessment execution summary.

    Aggregates all results with metadata about the assessment run.
    """

    start_time: str
    end_time: str
    duration_seconds: float
    framework_version: str
    consistency_results: List[ConsistencyResult] = field(default_factory=list)
    performance_results: List[PerformanceResult] = field(default_factory=list)
    latency_results: List[LatencyResult] = field(default_factory=list)
    output_quality_results: List[OutputQualityResult] = field(default_factory=list)
    robustness_results: List[RobustnessResult] = field(default_factory=list)
    coordination_results: List[CoordinationResult] = field(default_factory=list)
    cost_results: List[CostResult] = field(default_factory=list)
    advanced_stats_results: List[AdvancedStatsResult] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_seconds": self.duration_seconds,
            "framework_version": self.framework_version,
            "consistency_results": [r.to_dict() for r in self.consistency_results],
            "performance_results": [r.to_dict() for r in self.performance_results],
            "latency_results": [r.to_dict() for r in self.latency_results],
            "output_quality_results": [
                r.to_dict() for r in self.output_quality_results
            ],
            "robustness_results": [r.to_dict() for r in self.robustness_results],
            "coordination_results": [r.to_dict() for r in self.coordination_results],
            "cost_results": [r.to_dict() for r in self.cost_results],
            "advanced_stats_results": [
                r.to_dict() for r in self.advanced_stats_results
            ],
        }


# Backward compatibility alias
BenchmarkSummary = AssessmentSummary
