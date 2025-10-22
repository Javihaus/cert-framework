"""Latency metric implementation.

Measures response time characteristics including mean, std, percentiles, and throughput.
"""

import numpy as np

from ..types import LatencyResult
from .base import MetricBase, MetricRegistry


@MetricRegistry.register("latency")
class LatencyMetric(MetricBase):
    """Latency metric for CERT benchmarking.

    Analyzes response time patterns to assess production viability.
    Key measurements:
    - Mean and standard deviation
    - Percentiles (P50, P95, P99) for SLA planning
    - Throughput (tokens/second) if available

    Latency is critical for:
    - User-facing applications (chat, assistants)
    - Real-time systems (agentic workflows)
    - Cost optimization (faster = cheaper at scale)
    """

    async def calculate(self, data: dict) -> LatencyResult:
        """Calculate latency metrics from timing data.

        Args:
            data: Dictionary containing:
                - timings: List of response latencies in seconds
                - provider: Provider name
                - model: Model identifier
                - tokens_output: Optional list of output token counts

        Returns:
            LatencyResult with timing statistics

        Raises:
            ValueError: If data is invalid or insufficient
        """
        # Validate input
        if "timings" not in data or not data["timings"]:
            raise ValueError("No timing data provided")

        if "provider" not in data or "model" not in data:
            raise ValueError("Provider and model must be specified")

        timings = data["timings"]

        if len(timings) < 2:
            raise ValueError(
                "At least 2 timing samples required for statistical analysis"
            )

        # Calculate statistics
        timings_array = np.array(timings)

        mean_latency = float(np.mean(timings_array))
        std_latency = float(np.std(timings_array))
        min_latency = float(np.min(timings_array))
        max_latency = float(np.max(timings_array))
        p50_latency = float(np.percentile(timings_array, 50))
        p95_latency = float(np.percentile(timings_array, 95))
        p99_latency = float(np.percentile(timings_array, 99))

        # Calculate throughput if token data available
        tokens_per_second = None
        if "tokens_output" in data and data["tokens_output"]:
            tokens_output = data["tokens_output"]
            if len(tokens_output) == len(timings):
                # Filter out None values
                valid_pairs = [
                    (t, lat)
                    for t, lat in zip(tokens_output, timings)
                    if t is not None and lat > 0
                ]
                if valid_pairs:
                    total_tokens = sum(t for t, _ in valid_pairs)
                    total_time = sum(lat for _, lat in valid_pairs)
                    tokens_per_second = (
                        total_tokens / total_time if total_time > 0 else None
                    )

        # Create result
        result = LatencyResult(
            provider=data["provider"],
            model=data["model"],
            mean_latency_seconds=mean_latency,
            std_latency_seconds=std_latency,
            min_latency_seconds=min_latency,
            max_latency_seconds=max_latency,
            p50_latency_seconds=p50_latency,
            p95_latency_seconds=p95_latency,
            p99_latency_seconds=p99_latency,
            tokens_per_second=tokens_per_second,
            num_trials=len(timings),
        )

        # Validate result
        if not self.validate(result):
            raise ValueError("Calculated latency metrics failed validation")

        # Store result
        self.results.append(result)

        self.logger.info(
            f"Latency: {data['provider']}/{data['model']} - "
            f"mean={mean_latency:.3f}s, p95={p95_latency:.3f}s, p99={p99_latency:.3f}s"
        )

        return result

    def validate(self, value: LatencyResult) -> bool:
        """Validate latency result.

        Args:
            value: LatencyResult to validate

        Returns:
            True if valid
        """
        # All timing values must be non-negative
        if value.mean_latency_seconds < 0:
            return False
        if value.std_latency_seconds < 0:
            return False
        if value.min_latency_seconds < 0:
            return False
        if value.max_latency_seconds < 0:
            return False

        # Percentiles must be ordered
        if not (
            value.min_latency_seconds
            <= value.p50_latency_seconds
            <= value.p95_latency_seconds
            <= value.p99_latency_seconds
            <= value.max_latency_seconds
        ):
            return False

        # Throughput (if present) must be positive
        if value.tokens_per_second is not None and value.tokens_per_second <= 0:
            return False

        # Number of trials must be positive
        if value.num_trials <= 0:
            return False

        return True
