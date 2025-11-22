"""
Real-time Latency Tracking for LLM Systems

This module provides comprehensive latency monitoring including:
- Per-request latency tracking
- Time-to-first-token (TTFT) monitoring
- P50, P90, P99 percentile calculations
- SLA compliance tracking
- Latency trend analysis
"""

import json
import statistics
import time
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable


class LatencyTier(Enum):
    """Performance tiers based on latency."""

    EXCELLENT = "excellent"  # < P25
    GOOD = "good"  # P25 - P50
    ACCEPTABLE = "acceptable"  # P50 - P75
    SLOW = "slow"  # P75 - P90
    DEGRADED = "degraded"  # P90 - P99
    CRITICAL = "critical"  # > P99


@dataclass
class LatencyMeasurement:
    """A single latency measurement."""

    request_id: str
    endpoint: str
    latency_ms: float
    time_to_first_token_ms: float | None = None
    time_to_completion_ms: float | None = None
    model: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "request_id": self.request_id,
            "endpoint": self.endpoint,
            "latency_ms": self.latency_ms,
            "time_to_first_token_ms": self.time_to_first_token_ms,
            "time_to_completion_ms": self.time_to_completion_ms,
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class LatencyStats:
    """Latency statistics for a time window."""

    count: int
    mean: float
    median: float
    std: float
    min: float
    max: float
    p50: float
    p75: float
    p90: float
    p95: float
    p99: float
    window_start: datetime
    window_end: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "count": self.count,
            "mean": self.mean,
            "median": self.median,
            "std": self.std,
            "min": self.min,
            "max": self.max,
            "p50": self.p50,
            "p75": self.p75,
            "p90": self.p90,
            "p95": self.p95,
            "p99": self.p99,
            "window_start": self.window_start.isoformat(),
            "window_end": self.window_end.isoformat(),
        }


@dataclass
class SLAConfig:
    """SLA configuration for latency thresholds."""

    p50_threshold_ms: float = 1000.0
    p90_threshold_ms: float = 3000.0
    p99_threshold_ms: float = 5000.0
    max_latency_ms: float = 10000.0
    ttft_threshold_ms: float = 500.0


@dataclass
class SLAStatus:
    """Current SLA compliance status."""

    compliant: bool
    violations: list[str]
    compliance_rate: float
    stats: LatencyStats | None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "compliant": self.compliant,
            "violations": self.violations,
            "compliance_rate": self.compliance_rate,
            "stats": self.stats.to_dict() if self.stats else None,
        }


class LatencyTracker:
    """
    Real-time latency tracking for LLM systems.

    Provides comprehensive latency monitoring with percentile calculations,
    SLA compliance tracking, and trend analysis.

    Example:
        tracker = LatencyTracker(
            sla_config=SLAConfig(p90_threshold_ms=2000)
        )

        # Track a request
        with tracker.track("chat_completion", model="gpt-4") as ctx:
            response = llm.chat(prompt)
            ctx.set_first_token_time()  # Optional: track TTFT
            ctx.set_tokens(input=100, output=50)

        # Get statistics
        stats = tracker.get_stats(window_minutes=60)
        print(f"P90 latency: {stats.p90}ms")

        # Check SLA compliance
        status = tracker.check_sla()
        print(f"SLA compliant: {status.compliant}")
    """

    def __init__(
        self,
        sla_config: SLAConfig | None = None,
        window_size: int = 10000,
        enable_per_endpoint_stats: bool = True,
        enable_per_model_stats: bool = True,
        on_sla_violation_callback: Callable[[SLAStatus], None] | None = None,
    ):
        """
        Initialize the latency tracker.

        Args:
            sla_config: SLA configuration with thresholds
            window_size: Maximum number of measurements to keep
            enable_per_endpoint_stats: Track stats per endpoint
            enable_per_model_stats: Track stats per model
            on_sla_violation_callback: Callback when SLA is violated
        """
        self.sla_config = sla_config or SLAConfig()
        self.window_size = window_size
        self.enable_per_endpoint_stats = enable_per_endpoint_stats
        self.enable_per_model_stats = enable_per_model_stats
        self.on_sla_violation_callback = on_sla_violation_callback

        self._measurements: deque[LatencyMeasurement] = deque(maxlen=window_size)
        self._request_counter = 0

    def _generate_request_id(self) -> str:
        """Generate a unique request ID."""
        self._request_counter += 1
        timestamp = int(time.time() * 1000)
        return f"req_{timestamp}_{self._request_counter}"

    def track(
        self,
        endpoint: str,
        model: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "LatencyContext":
        """
        Create a tracking context for a request.

        Args:
            endpoint: Name of the endpoint being called
            model: Model being used (optional)
            metadata: Additional metadata

        Returns:
            LatencyContext for use in a with statement
        """
        return LatencyContext(
            tracker=self,
            request_id=self._generate_request_id(),
            endpoint=endpoint,
            model=model,
            metadata=metadata or {},
        )

    def record(
        self,
        endpoint: str,
        latency_ms: float,
        model: str | None = None,
        time_to_first_token_ms: float | None = None,
        input_tokens: int | None = None,
        output_tokens: int | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> LatencyMeasurement:
        """
        Record a latency measurement directly.

        Args:
            endpoint: Name of the endpoint
            latency_ms: Total latency in milliseconds
            model: Model used
            time_to_first_token_ms: Time to first token
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            metadata: Additional metadata

        Returns:
            The recorded LatencyMeasurement
        """
        measurement = LatencyMeasurement(
            request_id=self._generate_request_id(),
            endpoint=endpoint,
            latency_ms=latency_ms,
            time_to_first_token_ms=time_to_first_token_ms,
            time_to_completion_ms=latency_ms,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            metadata=metadata or {},
        )

        self._measurements.append(measurement)
        return measurement

    def _add_measurement(self, measurement: LatencyMeasurement) -> None:
        """Add a measurement to the tracker."""
        self._measurements.append(measurement)

    def _percentile(self, values: list[float], p: float) -> float:
        """Calculate percentile of a sorted list."""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        k = (len(sorted_values) - 1) * p / 100
        f = int(k)
        c = f + 1 if f + 1 < len(sorted_values) else f
        if f == c:
            return sorted_values[int(k)]
        return sorted_values[f] * (c - k) + sorted_values[c] * (k - f)

    def get_stats(
        self,
        window_minutes: int | None = None,
        endpoint: str | None = None,
        model: str | None = None,
    ) -> LatencyStats | None:
        """
        Get latency statistics.

        Args:
            window_minutes: Time window in minutes (None = all data)
            endpoint: Filter by endpoint
            model: Filter by model

        Returns:
            LatencyStats or None if no data
        """
        measurements = list(self._measurements)

        # Apply time window filter
        if window_minutes:
            cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
            measurements = [m for m in measurements if m.timestamp >= cutoff]

        # Apply endpoint filter
        if endpoint:
            measurements = [m for m in measurements if m.endpoint == endpoint]

        # Apply model filter
        if model:
            measurements = [m for m in measurements if m.model == model]

        if not measurements:
            return None

        latencies = [m.latency_ms for m in measurements]

        return LatencyStats(
            count=len(latencies),
            mean=statistics.mean(latencies),
            median=statistics.median(latencies),
            std=statistics.stdev(latencies) if len(latencies) > 1 else 0,
            min=min(latencies),
            max=max(latencies),
            p50=self._percentile(latencies, 50),
            p75=self._percentile(latencies, 75),
            p90=self._percentile(latencies, 90),
            p95=self._percentile(latencies, 95),
            p99=self._percentile(latencies, 99),
            window_start=min(m.timestamp for m in measurements),
            window_end=max(m.timestamp for m in measurements),
        )

    def get_ttft_stats(
        self,
        window_minutes: int | None = None,
    ) -> dict[str, float] | None:
        """Get time-to-first-token statistics."""
        measurements = [m for m in self._measurements if m.time_to_first_token_ms is not None]

        if window_minutes:
            cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
            measurements = [m for m in measurements if m.timestamp >= cutoff]

        if not measurements:
            return None

        ttft_values = [m.time_to_first_token_ms for m in measurements]

        return {
            "count": len(ttft_values),
            "mean": statistics.mean(ttft_values),
            "median": statistics.median(ttft_values),
            "p90": self._percentile(ttft_values, 90),
            "p99": self._percentile(ttft_values, 99),
        }

    def check_sla(self, window_minutes: int = 60) -> SLAStatus:
        """
        Check SLA compliance.

        Args:
            window_minutes: Time window for compliance check

        Returns:
            SLAStatus with compliance details
        """
        stats = self.get_stats(window_minutes=window_minutes)

        if not stats:
            return SLAStatus(
                compliant=True,
                violations=[],
                compliance_rate=1.0,
                stats=None,
            )

        violations = []

        if stats.p50 > self.sla_config.p50_threshold_ms:
            violations.append(
                f"P50 ({stats.p50:.0f}ms) exceeds threshold ({self.sla_config.p50_threshold_ms:.0f}ms)"
            )

        if stats.p90 > self.sla_config.p90_threshold_ms:
            violations.append(
                f"P90 ({stats.p90:.0f}ms) exceeds threshold ({self.sla_config.p90_threshold_ms:.0f}ms)"
            )

        if stats.p99 > self.sla_config.p99_threshold_ms:
            violations.append(
                f"P99 ({stats.p99:.0f}ms) exceeds threshold ({self.sla_config.p99_threshold_ms:.0f}ms)"
            )

        if stats.max > self.sla_config.max_latency_ms:
            violations.append(
                f"Max latency ({stats.max:.0f}ms) exceeds threshold ({self.sla_config.max_latency_ms:.0f}ms)"
            )

        # Check TTFT if available
        ttft_stats = self.get_ttft_stats(window_minutes=window_minutes)
        if ttft_stats and ttft_stats["p90"] > self.sla_config.ttft_threshold_ms:
            violations.append(
                f"TTFT P90 ({ttft_stats['p90']:.0f}ms) exceeds threshold ({self.sla_config.ttft_threshold_ms:.0f}ms)"
            )

        # Calculate compliance rate
        measurements = [
            m
            for m in self._measurements
            if m.timestamp >= datetime.utcnow() - timedelta(minutes=window_minutes)
        ]
        compliant_count = sum(
            1 for m in measurements if m.latency_ms <= self.sla_config.p99_threshold_ms
        )
        compliance_rate = compliant_count / len(measurements) if measurements else 1.0

        status = SLAStatus(
            compliant=len(violations) == 0,
            violations=violations,
            compliance_rate=compliance_rate,
            stats=stats,
        )

        # Call callback if violations
        if violations and self.on_sla_violation_callback:
            self.on_sla_violation_callback(status)

        return status

    def classify_latency(self, latency_ms: float) -> LatencyTier:
        """Classify a latency value into a performance tier."""
        stats = self.get_stats()
        if not stats:
            return LatencyTier.ACCEPTABLE

        if latency_ms < stats.p50 * 0.5:
            return LatencyTier.EXCELLENT
        elif latency_ms < stats.p50:
            return LatencyTier.GOOD
        elif latency_ms < stats.p75:
            return LatencyTier.ACCEPTABLE
        elif latency_ms < stats.p90:
            return LatencyTier.SLOW
        elif latency_ms < stats.p99:
            return LatencyTier.DEGRADED
        return LatencyTier.CRITICAL

    def get_trend(
        self,
        window_minutes: int = 60,
        bucket_minutes: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Get latency trend over time.

        Args:
            window_minutes: Total time window
            bucket_minutes: Size of each time bucket

        Returns:
            List of stats per time bucket
        """
        cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
        measurements = [m for m in self._measurements if m.timestamp >= cutoff]

        if not measurements:
            return []

        # Group by time bucket
        buckets: dict[int, list[LatencyMeasurement]] = {}
        for m in measurements:
            bucket_key = int(m.timestamp.timestamp() // (bucket_minutes * 60))
            if bucket_key not in buckets:
                buckets[bucket_key] = []
            buckets[bucket_key].append(m)

        # Calculate stats per bucket
        trend = []
        for bucket_key in sorted(buckets.keys()):
            bucket_measurements = buckets[bucket_key]
            latencies = [m.latency_ms for m in bucket_measurements]

            bucket_time = datetime.fromtimestamp(bucket_key * bucket_minutes * 60)
            trend.append(
                {
                    "timestamp": bucket_time.isoformat(),
                    "count": len(latencies),
                    "mean": statistics.mean(latencies),
                    "p50": self._percentile(latencies, 50),
                    "p90": self._percentile(latencies, 90),
                }
            )

        return trend

    def get_endpoint_breakdown(
        self,
        window_minutes: int | None = None,
    ) -> dict[str, LatencyStats]:
        """Get latency breakdown by endpoint."""
        if not self.enable_per_endpoint_stats:
            return {}

        endpoints = {m.endpoint for m in self._measurements}
        breakdown = {}

        for endpoint in endpoints:
            stats = self.get_stats(
                window_minutes=window_minutes,
                endpoint=endpoint,
            )
            if stats:
                breakdown[endpoint] = stats

        return breakdown

    def get_model_breakdown(
        self,
        window_minutes: int | None = None,
    ) -> dict[str, LatencyStats]:
        """Get latency breakdown by model."""
        if not self.enable_per_model_stats:
            return {}

        models = {m.model for m in self._measurements if m.model}
        breakdown = {}

        for model in models:
            stats = self.get_stats(
                window_minutes=window_minutes,
                model=model,
            )
            if stats:
                breakdown[model] = stats

        return breakdown

    def export_measurements(
        self,
        filepath: str,
        window_minutes: int | None = None,
    ) -> bool:
        """Export measurements to JSON file."""
        try:
            measurements = list(self._measurements)
            if window_minutes:
                cutoff = datetime.utcnow() - timedelta(minutes=window_minutes)
                measurements = [m for m in measurements if m.timestamp >= cutoff]

            data = [m.to_dict() for m in measurements]
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False


class LatencyContext:
    """Context manager for tracking latency of a single request."""

    def __init__(
        self,
        tracker: LatencyTracker,
        request_id: str,
        endpoint: str,
        model: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self.tracker = tracker
        self.request_id = request_id
        self.endpoint = endpoint
        self.model = model
        self.metadata = metadata or {}

        self._start_time: float | None = None
        self._first_token_time: float | None = None
        self._input_tokens: int | None = None
        self._output_tokens: int | None = None

    def __enter__(self) -> "LatencyContext":
        self._start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._start_time is None:
            return

        end_time = time.perf_counter()
        latency_ms = (end_time - self._start_time) * 1000

        ttft_ms = None
        if self._first_token_time is not None:
            ttft_ms = (self._first_token_time - self._start_time) * 1000

        measurement = LatencyMeasurement(
            request_id=self.request_id,
            endpoint=self.endpoint,
            latency_ms=latency_ms,
            time_to_first_token_ms=ttft_ms,
            time_to_completion_ms=latency_ms,
            model=self.model,
            input_tokens=self._input_tokens,
            output_tokens=self._output_tokens,
            metadata=self.metadata,
        )

        self.tracker._add_measurement(measurement)

    def set_first_token_time(self) -> None:
        """Mark the time when first token is received."""
        self._first_token_time = time.perf_counter()

    def set_tokens(
        self,
        input: int | None = None,
        output: int | None = None,
    ) -> None:
        """Set token counts for the request."""
        self._input_tokens = input
        self._output_tokens = output

    def add_metadata(self, key: str, value: Any) -> None:
        """Add metadata to the measurement."""
        self.metadata[key] = value
