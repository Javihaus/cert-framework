"""Latency metric calculator.

Measures response time distribution across trials.
"""

import logging
from typing import List

import numpy as np

from cert.core.types import LatencyMetric

logger = logging.getLogger(__name__)


def calculate_latency(
    latencies_seconds: List[float],
) -> LatencyMetric:
    """Calculate latency statistics from response times.

    Computes distribution statistics including mean, median, and percentiles.
    Useful for understanding performance characteristics and SLA compliance.

    Args:
        latencies_seconds: List of latency measurements in seconds

    Returns:
        LatencyMetric with:
            - mean_ms: Average latency in milliseconds
            - median_ms: Median latency (p50)
            - p95_ms: 95th percentile latency
            - p99_ms: 99th percentile latency
            - min_ms: Minimum latency
            - max_ms: Maximum latency
            - num_trials: Number of measurements
            - latencies: All measurements in milliseconds

    Raises:
        ValueError: If no latencies provided

    Example:
        latencies = [0.5, 0.6, 0.55, 0.7, 0.52]  # seconds
        metric = calculate_latency(latencies)
        print(f"Mean: {metric.mean_ms:.0f}ms, P95: {metric.p95_ms:.0f}ms")
    """
    if not latencies_seconds:
        raise ValueError("Must provide at least one latency measurement")

    logger.debug(f"Calculating latency for {len(latencies_seconds)} measurements")

    # Convert to milliseconds
    latencies_ms = [lat * 1000 for lat in latencies_seconds]

    # Calculate statistics
    mean_ms = float(np.mean(latencies_ms))
    median_ms = float(np.median(latencies_ms))
    p95_ms = float(np.percentile(latencies_ms, 95))
    p99_ms = float(np.percentile(latencies_ms, 99))
    min_ms = float(np.min(latencies_ms))
    max_ms = float(np.max(latencies_ms))

    logger.info(
        f"Latency: mean={mean_ms:.1f}ms, median={median_ms:.1f}ms, "
        f"p95={p95_ms:.1f}ms, p99={p99_ms:.1f}ms"
    )

    return LatencyMetric(
        mean_ms=mean_ms,
        median_ms=median_ms,
        p95_ms=p95_ms,
        p99_ms=p99_ms,
        min_ms=min_ms,
        max_ms=max_ms,
        num_trials=len(latencies_ms),
        latencies=latencies_ms,
    )
