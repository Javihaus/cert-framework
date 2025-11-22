"""
Prometheus Metrics for LLM Observability

Provides Prometheus-compatible metrics collection and export
for LLM systems monitoring.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class MetricValue:
    """Single metric data point."""

    value: float
    labels: dict[str, str]
    timestamp: float = field(default_factory=time.time)


class PrometheusMetrics:
    """
    Prometheus-compatible metrics collector for LLM systems.

    Provides counters, gauges, histograms, and summaries for
    monitoring LLM performance and usage.

    Example:
        metrics = PrometheusMetrics(namespace="cert_llm")

        # Count requests
        metrics.inc_counter("requests_total", labels={"model": "gpt-4"})

        # Track latency
        metrics.observe_histogram("request_duration_seconds", 0.5,
                                  labels={"model": "gpt-4"})

        # Export metrics
        output = metrics.export_text()
    """

    def __init__(
        self,
        namespace: str = "cert",
        port: int = 8000,
        auto_start_server: bool = False,
    ):
        """
        Initialize metrics collector.

        Args:
            namespace: Metric namespace prefix
            port: Port for HTTP server
            auto_start_server: Start HTTP server automatically
        """
        self.namespace = namespace
        self.port = port

        # Metric storage
        self._counters: dict[str, list[MetricValue]] = defaultdict(list)
        self._gauges: dict[str, MetricValue] = {}
        self._histograms: dict[str, list[tuple[float, dict[str, str]]]] = defaultdict(list)
        self._summaries: dict[str, list[tuple[float, dict[str, str]]]] = defaultdict(list)

        # Histogram bucket definitions
        self._histogram_buckets = {
            "default": [
                0.005,
                0.01,
                0.025,
                0.05,
                0.075,
                0.1,
                0.25,
                0.5,
                0.75,
                1.0,
                2.5,
                5.0,
                7.5,
                10.0,
            ],
            "latency": [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
            "tokens": [10, 50, 100, 250, 500, 1000, 2000, 4000, 8000, 16000],
        }

        # Metric descriptions
        self._descriptions: dict[str, str] = {}

    def _full_name(self, name: str) -> str:
        """Get full metric name with namespace."""
        return f"{self.namespace}_{name}"

    def _labels_key(self, labels: dict[str, str]) -> str:
        """Generate key from labels."""
        if not labels:
            return ""
        return ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))

    def register_metric(
        self,
        name: str,
        description: str,
        metric_type: str = "counter",
    ) -> None:
        """Register a metric with description."""
        self._descriptions[name] = description

    def inc_counter(
        self,
        name: str,
        value: float = 1.0,
        labels: dict[str, str] | None = None,
    ) -> None:
        """
        Increment a counter metric.

        Args:
            name: Counter name
            value: Value to add (default 1)
            labels: Metric labels
        """
        labels = labels or {}
        key = f"{name}:{self._labels_key(labels)}"

        if key in self._counters:
            # Add to existing counter
            self._counters[key][-1].value += value
        else:
            self._counters[key].append(MetricValue(value=value, labels=labels))

    def set_gauge(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
    ) -> None:
        """
        Set a gauge metric value.

        Args:
            name: Gauge name
            value: Gauge value
            labels: Metric labels
        """
        labels = labels or {}
        key = f"{name}:{self._labels_key(labels)}"
        self._gauges[key] = MetricValue(value=value, labels=labels)

    def observe_histogram(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
        bucket_type: str = "default",
    ) -> None:
        """
        Observe a value for histogram.

        Args:
            name: Histogram name
            value: Observed value
            labels: Metric labels
            bucket_type: Type of buckets to use
        """
        labels = labels or {}
        self._histograms[name].append((value, labels))

    def observe_summary(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
    ) -> None:
        """
        Observe a value for summary.

        Args:
            name: Summary name
            value: Observed value
            labels: Metric labels
        """
        labels = labels or {}
        self._summaries[name].append((value, labels))

    # Pre-defined LLM metrics
    def record_llm_request(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        latency_seconds: float,
        success: bool = True,
        endpoint: str = "default",
    ) -> None:
        """Record a complete LLM request."""
        labels = {"model": model, "endpoint": endpoint}

        # Count request
        self.inc_counter(
            "llm_requests_total", labels={**labels, "status": "success" if success else "error"}
        )

        # Token metrics
        self.inc_counter("llm_input_tokens_total", value=input_tokens, labels=labels)
        self.inc_counter("llm_output_tokens_total", value=output_tokens, labels=labels)

        # Latency
        self.observe_histogram("llm_request_duration_seconds", latency_seconds, labels=labels)

        # Token histograms
        self.observe_histogram(
            "llm_input_tokens", input_tokens, labels=labels, bucket_type="tokens"
        )
        self.observe_histogram(
            "llm_output_tokens", output_tokens, labels=labels, bucket_type="tokens"
        )

    def record_error(
        self,
        error_type: str,
        model: str = "unknown",
    ) -> None:
        """Record an error."""
        self.inc_counter("llm_errors_total", labels={"error_type": error_type, "model": model})

    def set_active_requests(self, count: int) -> None:
        """Set current active request count."""
        self.set_gauge("llm_active_requests", count)

    def export_text(self) -> str:
        """
        Export metrics in Prometheus text format.

        Returns:
            Prometheus-formatted metrics string
        """
        lines = []
        lines.append("# CERT Framework LLM Metrics")
        lines.append(f"# Generated at {datetime.utcnow().isoformat()}")
        lines.append("")

        # Export counters
        for key, values in self._counters.items():
            name = key.split(":")[0]
            full_name = self._full_name(name)

            if name in self._descriptions:
                lines.append(f"# HELP {full_name} {self._descriptions[name]}")
            lines.append(f"# TYPE {full_name} counter")

            for mv in values:
                labels_str = "{" + self._labels_key(mv.labels) + "}" if mv.labels else ""
                lines.append(f"{full_name}{labels_str} {mv.value}")
            lines.append("")

        # Export gauges
        exported_gauges = set()
        for key, mv in self._gauges.items():
            name = key.split(":")[0]
            full_name = self._full_name(name)

            if name not in exported_gauges:
                if name in self._descriptions:
                    lines.append(f"# HELP {full_name} {self._descriptions[name]}")
                lines.append(f"# TYPE {full_name} gauge")
                exported_gauges.add(name)

            labels_str = "{" + self._labels_key(mv.labels) + "}" if mv.labels else ""
            lines.append(f"{full_name}{labels_str} {mv.value}")
        if exported_gauges:
            lines.append("")

        # Export histograms
        for name, observations in self._histograms.items():
            full_name = self._full_name(name)
            lines.append(f"# TYPE {full_name} histogram")

            # Group by labels
            by_labels: dict[str, list[float]] = defaultdict(list)
            for value, labels in observations:
                labels_key = self._labels_key(labels)
                by_labels[labels_key].append(value)

            buckets = self._histogram_buckets.get("default", [])
            for labels_key, values in by_labels.items():
                labels_str = "{" + labels_key + "}" if labels_key else ""

                # Bucket counts
                for bucket in buckets:
                    count = sum(1 for v in values if v <= bucket)
                    le_labels = labels_key + f',le="{bucket}"' if labels_key else f'le="{bucket}"'
                    lines.append(f"{full_name}_bucket{{{le_labels}}} {count}")

                # +Inf bucket
                inf_labels = labels_key + ',le="+Inf"' if labels_key else 'le="+Inf"'
                lines.append(f"{full_name}_bucket{{{inf_labels}}} {len(values)}")

                # Sum and count
                lines.append(f"{full_name}_sum{labels_str} {sum(values)}")
                lines.append(f"{full_name}_count{labels_str} {len(values)}")
            lines.append("")

        return "\n".join(lines)

    def get_summary(self) -> dict[str, Any]:
        """Get metrics summary as dictionary."""
        return {
            "counters": {
                key: values[-1].value if values else 0 for key, values in self._counters.items()
            },
            "gauges": {key: mv.value for key, mv in self._gauges.items()},
            "histogram_counts": {
                name: len(observations) for name, observations in self._histograms.items()
            },
        }

    def reset(self) -> None:
        """Reset all metrics."""
        self._counters.clear()
        self._gauges.clear()
        self._histograms.clear()
        self._summaries.clear()
