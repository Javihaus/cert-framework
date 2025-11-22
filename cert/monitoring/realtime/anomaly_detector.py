"""
Anomaly Detection for LLM Systems

This module provides statistical anomaly detection for:
- Latency spikes
- Error rate changes
- Token usage anomalies
- Cost spikes
- Behavior drift
"""

import statistics
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable


class AnomalyType(Enum):
    """Types of anomalies that can be detected."""

    LATENCY_SPIKE = "latency_spike"
    ERROR_RATE_SPIKE = "error_rate_spike"
    TOKEN_USAGE_ANOMALY = "token_usage_anomaly"
    COST_SPIKE = "cost_spike"
    THROUGHPUT_DROP = "throughput_drop"
    RESPONSE_LENGTH_ANOMALY = "response_length_anomaly"


class AnomalySeverity(Enum):
    """Severity levels for detected anomalies."""

    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class Anomaly:
    """A detected anomaly."""

    anomaly_type: AnomalyType
    severity: AnomalySeverity
    value: float
    expected_range: tuple[float, float]
    z_score: float
    description: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "anomaly_type": self.anomaly_type.value,
            "severity": self.severity.value,
            "value": self.value,
            "expected_range_low": self.expected_range[0],
            "expected_range_high": self.expected_range[1],
            "z_score": self.z_score,
            "description": self.description,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class MetricPoint:
    """A single metric data point."""

    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


class AnomalyDetector:
    """
    Statistical anomaly detection for LLM monitoring metrics.

    Uses z-score based detection with configurable thresholds and
    sliding windows. Supports multiple metric types and can track
    historical baselines.

    Example:
        detector = AnomalyDetector(
            z_score_threshold=2.5,
            min_samples=30
        )

        # Add baseline data
        for latency in historical_latencies:
            detector.add_metric("latency", latency)

        # Check for anomalies
        current_latency = 5000  # ms
        anomalies = detector.check("latency", current_latency)
        for anomaly in anomalies:
            print(f"Detected: {anomaly.description}")
    """

    def __init__(
        self,
        z_score_threshold: float = 3.0,
        warning_threshold: float = 2.0,
        min_samples: int = 30,
        window_size: int = 1000,
        seasonality_window_hours: int | None = None,
        on_anomaly_callback: Callable[[Anomaly], None] | None = None,
    ):
        """
        Initialize the anomaly detector.

        Args:
            z_score_threshold: Z-score threshold for critical anomalies
            warning_threshold: Z-score threshold for warning anomalies
            min_samples: Minimum samples needed for detection
            window_size: Size of sliding window for baseline
            seasonality_window_hours: Hours for seasonality detection (e.g., 24)
            on_anomaly_callback: Callback when anomaly is detected
        """
        self.z_score_threshold = z_score_threshold
        self.warning_threshold = warning_threshold
        self.min_samples = min_samples
        self.window_size = window_size
        self.seasonality_window_hours = seasonality_window_hours
        self.on_anomaly_callback = on_anomaly_callback

        # Metric storage per type
        self._metrics: dict[str, deque[MetricPoint]] = {}
        self._baselines: dict[str, dict[str, float]] = {}
        self._anomaly_history: list[Anomaly] = []

    def add_metric(
        self,
        name: str,
        value: float,
        timestamp: datetime | None = None,
    ) -> list[Anomaly]:
        """
        Add a metric value and check for anomalies.

        Args:
            name: Name of the metric (e.g., "latency", "error_rate")
            value: Metric value
            timestamp: Optional timestamp

        Returns:
            List of detected anomalies (if any)
        """
        if name not in self._metrics:
            self._metrics[name] = deque(maxlen=self.window_size)

        point = MetricPoint(
            name=name,
            value=value,
            timestamp=timestamp or datetime.utcnow(),
        )
        self._metrics[name].append(point)

        # Check for anomalies
        return self.check(name, value)

    def check(
        self,
        name: str,
        value: float,
    ) -> list[Anomaly]:
        """
        Check if a value is anomalous for a given metric.

        Args:
            name: Name of the metric
            value: Value to check

        Returns:
            List of detected anomalies
        """
        anomalies = []

        # Get baseline statistics
        stats = self._get_stats(name)
        if not stats:
            return anomalies

        # Calculate z-score
        z_score = self._calculate_z_score(value, stats["mean"], stats["std"])

        if abs(z_score) >= self.z_score_threshold:
            severity = AnomalySeverity.CRITICAL
        elif abs(z_score) >= self.warning_threshold:
            severity = AnomalySeverity.WARNING
        else:
            return anomalies

        # Determine anomaly type
        anomaly_type = self._determine_anomaly_type(name, value, stats)

        # Calculate expected range
        low = stats["mean"] - self.warning_threshold * stats["std"]
        high = stats["mean"] + self.warning_threshold * stats["std"]

        description = self._generate_description(name, value, stats, z_score, anomaly_type)

        anomaly = Anomaly(
            anomaly_type=anomaly_type,
            severity=severity,
            value=value,
            expected_range=(max(0, low), high),
            z_score=z_score,
            description=description,
            metadata={
                "metric_name": name,
                "baseline_mean": stats["mean"],
                "baseline_std": stats["std"],
                "sample_count": stats["count"],
            },
        )

        self._anomaly_history.append(anomaly)
        anomalies.append(anomaly)

        # Call callback
        if self.on_anomaly_callback:
            self.on_anomaly_callback(anomaly)

        return anomalies

    def _get_stats(self, name: str) -> dict[str, float] | None:
        """Get baseline statistics for a metric."""
        if name not in self._metrics:
            return None

        values = [p.value for p in self._metrics[name]]
        if len(values) < self.min_samples:
            return None

        mean = statistics.mean(values)
        std = statistics.stdev(values) if len(values) > 1 else 0.001

        # Ensure std is not zero to avoid division errors
        if std == 0:
            std = 0.001

        return {
            "mean": mean,
            "std": std,
            "min": min(values),
            "max": max(values),
            "count": len(values),
        }

    def _calculate_z_score(
        self,
        value: float,
        mean: float,
        std: float,
    ) -> float:
        """Calculate z-score for a value."""
        if std == 0:
            return 0.0
        return (value - mean) / std

    def _determine_anomaly_type(
        self,
        name: str,
        value: float,
        stats: dict[str, float],
    ) -> AnomalyType:
        """Determine the type of anomaly based on metric name."""
        name_lower = name.lower()

        if "latency" in name_lower or "duration" in name_lower:
            return AnomalyType.LATENCY_SPIKE
        elif "error" in name_lower:
            return AnomalyType.ERROR_RATE_SPIKE
        elif "token" in name_lower:
            return AnomalyType.TOKEN_USAGE_ANOMALY
        elif "cost" in name_lower:
            return AnomalyType.COST_SPIKE
        elif "throughput" in name_lower or "rps" in name_lower:
            return AnomalyType.THROUGHPUT_DROP
        elif "length" in name_lower or "size" in name_lower:
            return AnomalyType.RESPONSE_LENGTH_ANOMALY

        # Default based on value direction
        if value > stats["mean"]:
            return AnomalyType.LATENCY_SPIKE
        return AnomalyType.THROUGHPUT_DROP

    def _generate_description(
        self,
        name: str,
        value: float,
        stats: dict[str, float],
        z_score: float,
        anomaly_type: AnomalyType,
    ) -> str:
        """Generate human-readable anomaly description."""
        direction = "above" if z_score > 0 else "below"
        percent_change = abs(value - stats["mean"]) / stats["mean"] * 100

        return (
            f"{name} is {abs(z_score):.1f} standard deviations {direction} "
            f"baseline ({value:.2f} vs mean {stats['mean']:.2f}, "
            f"{percent_change:.1f}% change)"
        )

    def set_baseline(
        self,
        name: str,
        values: list[float],
    ) -> bool:
        """
        Set a baseline from historical values.

        Args:
            name: Metric name
            values: List of historical values

        Returns:
            True if baseline set successfully
        """
        if len(values) < self.min_samples:
            return False

        if name not in self._metrics:
            self._metrics[name] = deque(maxlen=self.window_size)

        for value in values:
            point = MetricPoint(name=name, value=value)
            self._metrics[name].append(point)

        return True

    def get_baseline(self, name: str) -> dict[str, float] | None:
        """Get current baseline statistics for a metric."""
        return self._get_stats(name)

    def get_anomaly_rate(
        self,
        window_hours: int = 24,
        metric_name: str | None = None,
    ) -> float:
        """
        Get rate of anomalies detected.

        Args:
            window_hours: Time window in hours
            metric_name: Filter by specific metric

        Returns:
            Anomaly rate (anomalies per hour)
        """
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        recent_anomalies = [a for a in self._anomaly_history if a.timestamp >= cutoff]

        if metric_name:
            recent_anomalies = [
                a for a in recent_anomalies if a.metadata.get("metric_name") == metric_name
            ]

        return len(recent_anomalies) / window_hours

    def get_anomaly_history(
        self,
        limit: int | None = None,
        severity_filter: AnomalySeverity | None = None,
        anomaly_type_filter: AnomalyType | None = None,
    ) -> list[Anomaly]:
        """
        Get anomaly history with optional filters.

        Args:
            limit: Maximum number of anomalies to return
            severity_filter: Filter by severity
            anomaly_type_filter: Filter by anomaly type

        Returns:
            List of anomalies
        """
        history = self._anomaly_history

        if severity_filter:
            history = [a for a in history if a.severity == severity_filter]

        if anomaly_type_filter:
            history = [a for a in history if a.anomaly_type == anomaly_type_filter]

        if limit:
            history = history[-limit:]

        return history

    def get_summary(self) -> dict[str, Any]:
        """Get summary of anomaly detection status."""
        total_anomalies = len(self._anomaly_history)
        recent_cutoff = datetime.utcnow() - timedelta(hours=1)
        recent_anomalies = [a for a in self._anomaly_history if a.timestamp >= recent_cutoff]

        severity_counts = {}
        for a in self._anomaly_history:
            severity_counts[a.severity.value] = severity_counts.get(a.severity.value, 0) + 1

        type_counts = {}
        for a in self._anomaly_history:
            type_counts[a.anomaly_type.value] = type_counts.get(a.anomaly_type.value, 0) + 1

        return {
            "total_anomalies": total_anomalies,
            "recent_anomalies_1h": len(recent_anomalies),
            "anomalies_per_hour": self.get_anomaly_rate(24),
            "by_severity": severity_counts,
            "by_type": type_counts,
            "monitored_metrics": list(self._metrics.keys()),
        }

    def clear_history(self) -> None:
        """Clear anomaly history."""
        self._anomaly_history.clear()

    def reset_baseline(self, name: str) -> None:
        """Reset baseline for a specific metric."""
        if name in self._metrics:
            self._metrics[name].clear()


class MultiMetricAnomalyDetector:
    """
    Anomaly detector that monitors multiple correlated metrics.

    Detects compound anomalies where multiple metrics deviate together,
    which can indicate systematic issues.
    """

    def __init__(
        self,
        detectors: dict[str, AnomalyDetector] | None = None,
        correlation_threshold: float = 0.7,
        compound_anomaly_window_seconds: float = 60.0,
    ):
        """
        Initialize multi-metric detector.

        Args:
            detectors: Dictionary of metric name to detector
            correlation_threshold: Threshold for correlated anomalies
            compound_anomaly_window_seconds: Time window for compound detection
        """
        self.detectors = detectors or {}
        self.correlation_threshold = correlation_threshold
        self.compound_anomaly_window_seconds = compound_anomaly_window_seconds
        self._recent_anomalies: deque[tuple[str, Anomaly]] = deque(maxlen=100)

    def add_detector(self, name: str, detector: AnomalyDetector) -> None:
        """Add a detector for a metric."""
        self.detectors[name] = detector

    def check_all(
        self,
        metrics: dict[str, float],
    ) -> tuple[list[Anomaly], list[dict[str, Any]]]:
        """
        Check all metrics for anomalies.

        Args:
            metrics: Dictionary of metric name to value

        Returns:
            Tuple of (individual anomalies, compound anomaly events)
        """
        all_anomalies = []
        current_time = datetime.utcnow()

        # Check each metric
        for name, value in metrics.items():
            if name in self.detectors:
                anomalies = self.detectors[name].check(name, value)
                for anomaly in anomalies:
                    all_anomalies.append(anomaly)
                    self._recent_anomalies.append((name, anomaly))

        # Detect compound anomalies
        compound_events = self._detect_compound_anomalies(current_time)

        return all_anomalies, compound_events

    def _detect_compound_anomalies(
        self,
        current_time: datetime,
    ) -> list[dict[str, Any]]:
        """Detect compound anomalies from multiple correlated metrics."""
        cutoff = current_time - timedelta(seconds=self.compound_anomaly_window_seconds)

        # Group recent anomalies by time window
        recent = [
            (name, anomaly)
            for name, anomaly in self._recent_anomalies
            if anomaly.timestamp >= cutoff
        ]

        if len(recent) < 2:
            return []

        # Check for compound anomalies
        compound_events = []
        affected_metrics = list({name for name, _ in recent})

        if len(affected_metrics) >= 2:
            compound_events.append(
                {
                    "type": "compound_anomaly",
                    "affected_metrics": affected_metrics,
                    "anomaly_count": len(recent),
                    "timestamp": current_time.isoformat(),
                    "description": f"Multiple anomalies detected in {', '.join(affected_metrics)}",
                }
            )

        return compound_events
