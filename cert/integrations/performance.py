"""
Performance Monitoring for CERT Connectors
===========================================

Utilities for monitoring and profiling connector performance to ensure
overhead remains < 5ms per traced call.
"""

import time
import statistics
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics for a connector."""
    connector_name: str
    call_count: int = 0
    total_overhead_ms: float = 0.0
    min_overhead_ms: float = float('inf')
    max_overhead_ms: float = 0.0
    measurements: List[float] = field(default_factory=list)

    @property
    def average_overhead_ms(self) -> float:
        """Calculate average overhead in milliseconds."""
        return self.total_overhead_ms / self.call_count if self.call_count > 0 else 0.0

    @property
    def median_overhead_ms(self) -> float:
        """Calculate median overhead in milliseconds."""
        return statistics.median(self.measurements) if self.measurements else 0.0

    @property
    def p95_overhead_ms(self) -> float:
        """Calculate 95th percentile overhead."""
        if not self.measurements:
            return 0.0
        sorted_measurements = sorted(self.measurements)
        index = int(len(sorted_measurements) * 0.95)
        return sorted_measurements[min(index, len(sorted_measurements) - 1)]

    @property
    def exceeds_target(self) -> bool:
        """Check if overhead exceeds 5ms target."""
        return self.average_overhead_ms > 5.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "connector_name": self.connector_name,
            "call_count": self.call_count,
            "average_overhead_ms": round(self.average_overhead_ms, 3),
            "median_overhead_ms": round(self.median_overhead_ms, 3),
            "p95_overhead_ms": round(self.p95_overhead_ms, 3),
            "min_overhead_ms": round(self.min_overhead_ms, 3),
            "max_overhead_ms": round(self.max_overhead_ms, 3),
            "exceeds_target": self.exceeds_target,
        }


class PerformanceMonitor:
    """
    Monitor performance of connectors.

    This class tracks the overhead introduced by connectors and provides
    metrics to ensure performance targets are met.
    """

    def __init__(self):
        self.metrics: Dict[str, PerformanceMetrics] = {}
        self.enabled = False

    def enable(self):
        """Enable performance monitoring."""
        self.enabled = True
        logger.info("Performance monitoring enabled")

    def disable(self):
        """Disable performance monitoring."""
        self.enabled = False
        logger.info("Performance monitoring disabled")

    def record_overhead(self, connector_name: str, overhead_ms: float):
        """
        Record overhead measurement for a connector.

        Args:
            connector_name: Name of the connector
            overhead_ms: Overhead in milliseconds
        """
        if not self.enabled:
            return

        if connector_name not in self.metrics:
            self.metrics[connector_name] = PerformanceMetrics(connector_name)

        metrics = self.metrics[connector_name]
        metrics.call_count += 1
        metrics.total_overhead_ms += overhead_ms
        metrics.min_overhead_ms = min(metrics.min_overhead_ms, overhead_ms)
        metrics.max_overhead_ms = max(metrics.max_overhead_ms, overhead_ms)
        metrics.measurements.append(overhead_ms)

        # Keep only last 1000 measurements to prevent memory growth
        if len(metrics.measurements) > 1000:
            metrics.measurements = metrics.measurements[-1000:]

        # Warn if overhead is high
        if overhead_ms > 10.0:
            logger.warning(
                f"{connector_name} overhead high: {overhead_ms:.2f}ms "
                f"(target: < 5ms)"
            )

    def get_metrics(self, connector_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get performance metrics.

        Args:
            connector_name: Specific connector name, or None for all

        Returns:
            Dictionary of metrics
        """
        if connector_name:
            metrics = self.metrics.get(connector_name)
            return metrics.to_dict() if metrics else {}

        return {
            name: metrics.to_dict()
            for name, metrics in self.metrics.items()
        }

    def get_summary(self) -> Dict[str, Any]:
        """
        Get performance summary across all connectors.

        Returns:
            Summary statistics
        """
        if not self.metrics:
            return {"message": "No performance data collected"}

        all_measurements = []
        for metrics in self.metrics.values():
            all_measurements.extend(metrics.measurements)

        total_calls = sum(m.call_count for m in self.metrics.values())

        return {
            "total_calls": total_calls,
            "connector_count": len(self.metrics),
            "overall_average_ms": round(statistics.mean(all_measurements), 3) if all_measurements else 0.0,
            "overall_median_ms": round(statistics.median(all_measurements), 3) if all_measurements else 0.0,
            "overall_p95_ms": round(
                sorted(all_measurements)[int(len(all_measurements) * 0.95)] if all_measurements else 0.0, 3
            ),
            "connectors_exceeding_target": [
                name for name, metrics in self.metrics.items()
                if metrics.exceeds_target
            ],
            "by_connector": self.get_metrics(),
        }

    def reset(self):
        """Reset all metrics."""
        self.metrics.clear()
        logger.info("Performance metrics reset")


# Global performance monitor instance
_monitor = PerformanceMonitor()


def get_performance_monitor() -> PerformanceMonitor:
    """Get the global performance monitor instance."""
    return _monitor


class PerformanceTracker:
    """
    Context manager for tracking connector overhead.

    Usage:
        with PerformanceTracker("my_connector"):
            # Code to measure
            pass
    """

    def __init__(self, connector_name: str):
        self.connector_name = connector_name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration_ms = (time.perf_counter() - self.start_time) * 1000
            _monitor.record_overhead(self.connector_name, duration_ms)


def benchmark_connector(
    connector_name: str,
    test_func,
    iterations: int = 100
) -> Dict[str, Any]:
    """
    Benchmark a connector's performance.

    Args:
        connector_name: Name of connector
        test_func: Function to benchmark
        iterations: Number of iterations

    Returns:
        Benchmark results
    """
    measurements = []

    for _ in range(iterations):
        start = time.perf_counter()
        test_func()
        duration_ms = (time.perf_counter() - start) * 1000
        measurements.append(duration_ms)

    return {
        "connector_name": connector_name,
        "iterations": iterations,
        "average_ms": round(statistics.mean(measurements), 3),
        "median_ms": round(statistics.median(measurements), 3),
        "min_ms": round(min(measurements), 3),
        "max_ms": round(max(measurements), 3),
        "p95_ms": round(sorted(measurements)[int(len(measurements) * 0.95)], 3),
        "p99_ms": round(sorted(measurements)[int(len(measurements) * 0.99)], 3),
        "exceeds_5ms_target": statistics.mean(measurements) > 5.0,
        "exceeds_10ms_target": statistics.mean(measurements) > 10.0,
    }
