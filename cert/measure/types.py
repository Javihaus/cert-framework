"""Core data types for CERT framework v2.0.

This module defines all result types and metric dataclasses used across
the measure(), agent_monitor(), and cost_tracker() functions.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd

# ============================================================================
# MEASUREMENT RESULTS (for measure() function)
# ============================================================================


@dataclass
class MeasurementResult:
    """Result from measure() function.

    Attributes:
        matched: Whether texts match above threshold
        confidence: Overall confidence score (0.0-1.0)
        semantic_score: Semantic similarity score (0.0-1.0) if enabled
        nli_score: NLI entailment score (0.0-1.0) if enabled
        grounding_score: Grounding analysis score (0.0-1.0) if enabled
        threshold_used: Threshold that was applied
        rule: Description of which component made the decision
        components_used: List of components that were enabled
        metadata: Additional metadata
        timestamp: ISO format timestamp
    """

    matched: bool
    confidence: float
    semantic_score: Optional[float] = None
    nli_score: Optional[float] = None
    grounding_score: Optional[float] = None
    threshold_used: float = 0.7
    rule: str = ""
    components_used: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def __bool__(self) -> bool:
        """Allow use in boolean context."""
        return self.matched

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "matched": self.matched,
            "confidence": self.confidence,
            "semantic_score": self.semantic_score,
            "nli_score": self.nli_score,
            "grounding_score": self.grounding_score,
            "threshold_used": self.threshold_used,
            "rule": self.rule,
            "components_used": self.components_used,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
        }
        
    def get(self, key, default=None):
        """Dict-like access for backwards compatibility."""
        return getattr(self, key, default)

# ============================================================================
# METRIC DATACLASSES (for agent_monitor() function)
# ============================================================================


@dataclass
class ConsistencyMetric:
    """Consistency measurement results.

    Measures behavioral reliability across multiple trials using semantic
    embeddings to calculate variance.

    Attributes:
        score: Consistency score (0.0-1.0), higher = more consistent
        mean_distance: Average semantic distance between responses
        std_distance: Standard deviation of semantic distances
        num_trials: Number of trials executed
        responses: All response texts collected
    """

    score: float
    mean_distance: float
    std_distance: float
    num_trials: int
    responses: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "score": self.score,
            "mean_distance": self.mean_distance,
            "std_distance": self.std_distance,
            "num_trials": self.num_trials,
            "num_responses": len(self.responses),
        }


@dataclass
class PerformanceMetric:
    """Performance measurement results.

    Measures output quality across diverse prompts, scoring each response
    on relevance, completeness, and structure.

    Attributes:
        mean_score: Average quality score (0.0-1.0)
        std_score: Standard deviation of scores
        min_score: Minimum score observed
        max_score: Maximum score observed
        num_trials: Number of trials executed
        scores: All individual scores
    """

    mean_score: float
    std_score: float
    min_score: float
    max_score: float
    num_trials: int
    scores: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "mean_score": self.mean_score,
            "std_score": self.std_score,
            "min_score": self.min_score,
            "max_score": self.max_score,
            "num_trials": self.num_trials,
        }


@dataclass
class LatencyMetric:
    """Latency measurement results.

    Measures response time distribution across trials.

    Attributes:
        mean_ms: Average latency in milliseconds
        median_ms: Median latency (p50)
        p95_ms: 95th percentile latency
        p99_ms: 99th percentile latency
        min_ms: Minimum latency observed
        max_ms: Maximum latency observed
        num_trials: Number of trials measured
        latencies: All individual latency measurements
    """

    mean_ms: float
    median_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float
    num_trials: int
    latencies: List[float] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "mean_ms": self.mean_ms,
            "median_ms": self.median_ms,
            "p95_ms": self.p95_ms,
            "p99_ms": self.p99_ms,
            "min_ms": self.min_ms,
            "max_ms": self.max_ms,
            "num_trials": self.num_trials,
        }


@dataclass
class OutputQualityMetric:
    """Output quality analysis.

    Analyzes output characteristics like length, diversity, and repetition.

    Attributes:
        mean_length: Average response length in characters
        semantic_diversity: Semantic diversity score (0.0-1.0)
        repetition_score: Repetition score (0.0-1.0), lower = less repetition
        num_trials: Number of trials analyzed
    """

    mean_length: float
    semantic_diversity: float
    repetition_score: float
    num_trials: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "mean_length": self.mean_length,
            "semantic_diversity": self.semantic_diversity,
            "repetition_score": self.repetition_score,
            "num_trials": self.num_trials,
        }


@dataclass
class RobustnessMetric:
    """Error handling and reliability measurement.

    Measures how well the model handles errors, timeouts, and edge cases.

    Attributes:
        success_rate: Successful response rate (0.0-1.0)
        error_rate: Error rate (0.0-1.0)
        timeout_rate: Timeout rate (0.0-1.0)
        num_trials: Total number of trials attempted
        errors: List of error messages encountered
    """

    success_rate: float
    error_rate: float
    timeout_rate: float
    num_trials: int
    errors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "success_rate": self.success_rate,
            "error_rate": self.error_rate,
            "timeout_rate": self.timeout_rate,
            "num_trials": self.num_trials,
            "num_errors": len(self.errors),
        }


# ============================================================================
# AGENT MONITOR RESULT (for agent_monitor() function)
# ============================================================================


@dataclass
class AgentMonitorResult:
    """Result from agent_monitor() function.

    Comprehensive monitoring result containing all requested metrics
    for a single agent/model.

    Attributes:
        provider: Provider name (openai, anthropic, google, xai, huggingface)
        model: Model identifier
        consistency: Consistency metric if enabled
        performance: Performance metric if enabled
        latency: Latency metric if enabled
        output_quality: Output quality metric if enabled
        robustness: Robustness metric if enabled
        config: Configuration used for monitoring
        duration_seconds: Total execution time
        timestamp: ISO format timestamp
    """

    provider: str
    model: str
    consistency: Optional[ConsistencyMetric] = None
    performance: Optional[PerformanceMetric] = None
    latency: Optional[LatencyMetric] = None
    output_quality: Optional[OutputQualityMetric] = None
    robustness: Optional[RobustnessMetric] = None
    config: Dict[str, Any] = field(default_factory=dict)
    duration_seconds: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "provider": self.provider,
            "model": self.model,
            "consistency": self.consistency.to_dict() if self.consistency else None,
            "performance": self.performance.to_dict() if self.performance else None,
            "latency": self.latency.to_dict() if self.latency else None,
            "output_quality": (self.output_quality.to_dict() if self.output_quality else None),
            "robustness": self.robustness.to_dict() if self.robustness else None,
            "config": self.config,
            "duration_seconds": self.duration_seconds,
            "timestamp": self.timestamp,
        }

    def to_dataframe(self) -> pd.DataFrame:
        """Convert to pandas DataFrame for analysis.

        Returns:
            DataFrame with one row containing all metrics as columns
        """
        data = {
            "provider": self.provider,
            "model": self.model,
            "timestamp": self.timestamp,
            "duration_seconds": self.duration_seconds,
        }

        # Add consistency metrics
        if self.consistency:
            data.update(
                {
                    "consistency_score": self.consistency.score,
                    "consistency_mean_distance": self.consistency.mean_distance,
                    "consistency_std_distance": self.consistency.std_distance,
                    "consistency_trials": self.consistency.num_trials,
                }
            )

        # Add performance metrics
        if self.performance:
            data.update(
                {
                    "performance_mean": self.performance.mean_score,
                    "performance_std": self.performance.std_score,
                    "performance_min": self.performance.min_score,
                    "performance_max": self.performance.max_score,
                    "performance_trials": self.performance.num_trials,
                }
            )

        # Add latency metrics
        if self.latency:
            data.update(
                {
                    "latency_mean_ms": self.latency.mean_ms,
                    "latency_median_ms": self.latency.median_ms,
                    "latency_p95_ms": self.latency.p95_ms,
                    "latency_p99_ms": self.latency.p99_ms,
                    "latency_min_ms": self.latency.min_ms,
                    "latency_max_ms": self.latency.max_ms,
                }
            )

        # Add output quality metrics
        if self.output_quality:
            data.update(
                {
                    "output_mean_length": self.output_quality.mean_length,
                    "output_diversity": self.output_quality.semantic_diversity,
                    "output_repetition": self.output_quality.repetition_score,
                }
            )

        # Add robustness metrics
        if self.robustness:
            data.update(
                {
                    "robustness_success_rate": self.robustness.success_rate,
                    "robustness_error_rate": self.robustness.error_rate,
                    "robustness_timeout_rate": self.robustness.timeout_rate,
                }
            )

        return pd.DataFrame([data])


# ============================================================================
# COST TRACKING RESULTS (for cost_tracker() function)
# ============================================================================


@dataclass
class CostResult:
    """Result from cost_tracker() function.

    Tracks token usage and calculates costs if pricing information is available.

    Attributes:
        tokens_input: Number of input tokens
        tokens_output: Number of output tokens
        tokens_total: Total tokens
        cost_input: Cost for input tokens (if pricing available)
        cost_output: Cost for output tokens (if pricing available)
        cost_total: Total cost (if pricing available)
        provider: Provider name
        model: Model name
        metadata: Additional metadata
        timestamp: ISO format timestamp
    """

    tokens_input: int
    tokens_output: int
    tokens_total: int
    cost_input: Optional[float] = None
    cost_output: Optional[float] = None
    cost_total: Optional[float] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "tokens_input": self.tokens_input,
            "tokens_output": self.tokens_output,
            "tokens_total": self.tokens_total,
            "cost_input": self.cost_input,
            "cost_output": self.cost_output,
            "cost_total": self.cost_total,
            "provider": self.provider,
            "model": self.model,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
        }


@dataclass
class CostTrackerAccumulator:
    """Accumulator for tracking costs across multiple calls.

    Example:
        tracker = CostTrackerAccumulator()
        for call in calls:
            result = cost_tracker(...)
            tracker.add(result)
        total = tracker.get_total()
    """

    results: List[CostResult] = field(default_factory=list)

    def add(self, result: CostResult) -> None:
        """Add a cost result to the accumulator."""
        self.results.append(result)

    def get_total(self) -> CostResult:
        """Get total costs across all tracked results.

        Returns:
            CostResult with aggregated totals
        """
        if not self.results:
            return CostResult(tokens_input=0, tokens_output=0, tokens_total=0, cost_total=0.0)

        total_tokens_input = sum(r.tokens_input for r in self.results)
        total_tokens_output = sum(r.tokens_output for r in self.results)
        total_tokens = sum(r.tokens_total for r in self.results)

        # Calculate costs if available
        costs_input = [r.cost_input for r in self.results if r.cost_input is not None]
        costs_output = [r.cost_output for r in self.results if r.cost_output is not None]
        costs_total = [r.cost_total for r in self.results if r.cost_total is not None]

        return CostResult(
            tokens_input=total_tokens_input,
            tokens_output=total_tokens_output,
            tokens_total=total_tokens,
            cost_input=sum(costs_input) if costs_input else None,
            cost_output=sum(costs_output) if costs_output else None,
            cost_total=sum(costs_total) if costs_total else None,
            provider=None,  # Mixed providers
            model=None,  # Mixed models
            metadata={"num_calls": len(self.results)},
        )

    def get_by_provider(self) -> Dict[str, CostResult]:
        """Get totals grouped by provider.

        Returns:
            Dictionary mapping provider name to CostResult
        """
        by_provider: Dict[str, List[CostResult]] = {}

        for result in self.results:
            if result.provider:
                if result.provider not in by_provider:
                    by_provider[result.provider] = []
                by_provider[result.provider].append(result)

        # Create accumulators for each provider
        totals = {}
        for provider, results in by_provider.items():
            acc = CostTrackerAccumulator(results=results)
            totals[provider] = acc.get_total()
            totals[provider].provider = provider

        return totals

    def to_dataframe(self) -> pd.DataFrame:
        """Convert all results to pandas DataFrame.

        Returns:
            DataFrame with one row per result
        """
        return pd.DataFrame([r.to_dict() for r in self.results])
