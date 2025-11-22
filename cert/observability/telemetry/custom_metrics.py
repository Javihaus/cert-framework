"""
Custom Metrics for LLM Observability

Provides flexible custom metric collection for domain-specific
LLM monitoring needs.
"""

import json
import statistics
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any


class MetricType(Enum):
    """Types of custom metrics."""

    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    RATE = "rate"
    PERCENTAGE = "percentage"


@dataclass
class MetricDefinition:
    """Definition of a custom metric."""

    name: str
    metric_type: MetricType
    description: str
    unit: str = ""
    labels: list[str] = field(default_factory=list)
    aggregation: str = "sum"  # sum, avg, max, min, p50, p90, p99


@dataclass
class MetricDataPoint:
    """Single metric data point."""

    value: float
    labels: dict[str, str]
    timestamp: datetime = field(default_factory=datetime.utcnow)


class CustomMetrics:
    """
    Custom metrics collection for LLM observability.

    Provides flexible metric definition and collection for
    domain-specific monitoring needs.

    Example:
        metrics = CustomMetrics()

        # Define custom metrics
        metrics.define("hallucination_rate", MetricType.PERCENTAGE,
                       "Rate of detected hallucinations")
        metrics.define("response_quality", MetricType.GAUGE,
                       "Response quality score", labels=["model", "task"])

        # Record values
        metrics.record("hallucination_rate", 0.05)
        metrics.record("response_quality", 0.85,
                       labels={"model": "gpt-4", "task": "summarization"})

        # Get aggregations
        stats = metrics.get_statistics("response_quality", window_minutes=60)
    """

    def __init__(
        self,
        max_history: int = 100000,
        default_window_minutes: int = 60,
    ):
        """
        Initialize custom metrics.

        Args:
            max_history: Maximum data points to keep per metric
            default_window_minutes: Default time window for aggregations
        """
        self.max_history = max_history
        self.default_window_minutes = default_window_minutes

        self._definitions: dict[str, MetricDefinition] = {}
        self._data: dict[str, deque[MetricDataPoint]] = {}

    def define(
        self,
        name: str,
        metric_type: MetricType,
        description: str,
        unit: str = "",
        labels: list[str] | None = None,
        aggregation: str = "sum",
    ) -> None:
        """
        Define a new custom metric.

        Args:
            name: Metric name
            metric_type: Type of metric
            description: Human-readable description
            unit: Unit of measurement
            labels: Expected label names
            aggregation: Default aggregation method
        """
        self._definitions[name] = MetricDefinition(
            name=name,
            metric_type=metric_type,
            description=description,
            unit=unit,
            labels=labels or [],
            aggregation=aggregation,
        )
        self._data[name] = deque(maxlen=self.max_history)

    def record(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
        timestamp: datetime | None = None,
    ) -> bool:
        """
        Record a metric value.

        Args:
            name: Metric name
            value: Metric value
            labels: Metric labels
            timestamp: Optional timestamp

        Returns:
            True if recorded successfully
        """
        if name not in self._definitions:
            # Auto-define as gauge if not defined
            self.define(name, MetricType.GAUGE, f"Auto-defined metric: {name}")

        point = MetricDataPoint(
            value=value,
            labels=labels or {},
            timestamp=timestamp or datetime.utcnow(),
        )

        self._data[name].append(point)
        return True

    def increment(
        self,
        name: str,
        delta: float = 1.0,
        labels: dict[str, str] | None = None,
    ) -> None:
        """
        Increment a counter metric.

        Args:
            name: Metric name
            delta: Amount to increment
            labels: Metric labels
        """
        if name not in self._definitions:
            self.define(name, MetricType.COUNTER, f"Auto-defined counter: {name}")

        # Get current value
        current = self.get_current(name, labels)
        new_value = (current or 0.0) + delta
        self.record(name, new_value, labels)

    def get_current(
        self,
        name: str,
        labels: dict[str, str] | None = None,
    ) -> float | None:
        """
        Get current value of a metric.

        Args:
            name: Metric name
            labels: Filter by labels

        Returns:
            Current value or None
        """
        if name not in self._data:
            return None

        data = list(self._data[name])
        if not data:
            return None

        # Filter by labels if provided
        if labels:
            data = [d for d in data if all(d.labels.get(k) == v for k, v in labels.items())]

        if not data:
            return None

        return data[-1].value

    def get_statistics(
        self,
        name: str,
        window_minutes: int | None = None,
        labels: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """
        Get statistics for a metric.

        Args:
            name: Metric name
            window_minutes: Time window
            labels: Filter by labels

        Returns:
            Dictionary of statistics
        """
        if name not in self._data:
            return {}

        window = window_minutes or self.default_window_minutes
        cutoff = datetime.utcnow() - timedelta(minutes=window)

        data = [d for d in self._data[name] if d.timestamp >= cutoff]

        # Filter by labels
        if labels:
            data = [d for d in data if all(d.labels.get(k) == v for k, v in labels.items())]

        if not data:
            return {"count": 0}

        values = [d.value for d in data]

        stats = {
            "count": len(values),
            "sum": sum(values),
            "mean": statistics.mean(values),
            "min": min(values),
            "max": max(values),
            "current": values[-1],
        }

        if len(values) > 1:
            stats["std"] = statistics.stdev(values)
            sorted_values = sorted(values)
            stats["p50"] = sorted_values[len(sorted_values) // 2]
            stats["p90"] = sorted_values[int(len(sorted_values) * 0.9)]
            stats["p99"] = sorted_values[int(len(sorted_values) * 0.99)]

        return stats

    def get_rate(
        self,
        name: str,
        window_minutes: int = 1,
        labels: dict[str, str] | None = None,
    ) -> float:
        """
        Calculate rate of change per minute.

        Args:
            name: Metric name
            window_minutes: Time window
            labels: Filter by labels

        Returns:
            Rate per minute
        """
        stats = self.get_statistics(name, window_minutes, labels)
        if stats.get("count", 0) == 0:
            return 0.0

        return stats["sum"] / window_minutes

    def get_trend(
        self,
        name: str,
        window_minutes: int = 60,
        bucket_minutes: int = 5,
        labels: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Get metric trend over time.

        Args:
            name: Metric name
            window_minutes: Total window
            bucket_minutes: Bucket size
            labels: Filter by labels

        Returns:
            List of bucketed statistics
        """
        if name not in self._data:
            return []

        cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
        data = [d for d in self._data[name] if d.timestamp >= cutoff]

        if labels:
            data = [d for d in data if all(d.labels.get(k) == v for k, v in labels.items())]

        if not data:
            return []

        # Group by bucket
        buckets: dict[int, list[float]] = {}
        for d in data:
            bucket_key = int(d.timestamp.timestamp() // (bucket_minutes * 60))
            if bucket_key not in buckets:
                buckets[bucket_key] = []
            buckets[bucket_key].append(d.value)

        trend = []
        for bucket_key in sorted(buckets.keys()):
            values = buckets[bucket_key]
            bucket_time = datetime.fromtimestamp(bucket_key * bucket_minutes * 60)
            trend.append(
                {
                    "timestamp": bucket_time.isoformat(),
                    "count": len(values),
                    "mean": statistics.mean(values),
                    "sum": sum(values),
                }
            )

        return trend

    def list_metrics(self) -> list[dict[str, Any]]:
        """List all defined metrics."""
        return [
            {
                "name": d.name,
                "type": d.metric_type.value,
                "description": d.description,
                "unit": d.unit,
                "labels": d.labels,
                "data_points": len(self._data.get(d.name, [])),
            }
            for d in self._definitions.values()
        ]

    def export(self, filepath: str) -> bool:
        """Export all metrics to JSON file."""
        try:
            export_data = {
                "definitions": [
                    {
                        "name": d.name,
                        "type": d.metric_type.value,
                        "description": d.description,
                        "unit": d.unit,
                    }
                    for d in self._definitions.values()
                ],
                "data": {
                    name: [
                        {
                            "value": dp.value,
                            "labels": dp.labels,
                            "timestamp": dp.timestamp.isoformat(),
                        }
                        for dp in data
                    ]
                    for name, data in self._data.items()
                },
            }
            with open(filepath, "w") as f:
                json.dump(export_data, f, indent=2)
            return True
        except Exception:
            return False

    def clear(self, name: str | None = None) -> None:
        """Clear metric data."""
        if name:
            if name in self._data:
                self._data[name].clear()
        else:
            for data in self._data.values():
                data.clear()
