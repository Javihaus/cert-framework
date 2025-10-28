"""Prometheus metrics exporter for CERT Framework.

Exports accuracy and compliance metrics to Prometheus for real-time monitoring.

Usage:
    from cert.observability.prometheus import (
        export_metrics_from_audit_log,
        start_metrics_server,
    )

    # Export current metrics from audit log
    export_metrics_from_audit_log("data/audit.jsonl")

    # Start Prometheus metrics server
    start_metrics_server(port=8000)

    # Metrics available at http://localhost:8000/metrics
"""

import json
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path

try:
    from prometheus_client import (
        Gauge,
        Counter,
        Histogram,
        start_http_server,
        generate_latest,
        REGISTRY,
    )

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False


# Prometheus metrics
if PROMETHEUS_AVAILABLE:
    # Accuracy metrics
    accuracy_gauge = Gauge(
        "cert_accuracy_score",
        "Current accuracy score from CERT measurements",
        ["preset", "system"],
    )

    confidence_gauge = Gauge(
        "cert_confidence_score",
        "Confidence score from CERT measurements",
        ["preset", "system"],
    )

    # Evaluation counters
    evaluation_total = Counter(
        "cert_evaluations_total",
        "Total number of CERT evaluations",
        ["preset", "status", "system"],
    )

    failure_total = Counter(
        "cert_failures_total",
        "Total number of failed evaluations",
        ["preset", "reason", "system"],
    )

    # Evaluation duration
    evaluation_duration = Histogram(
        "cert_evaluation_duration_seconds",
        "Time spent on CERT evaluations",
        ["preset", "system"],
        buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0),
    )

    # Compliance metrics
    compliance_gauge = Gauge(
        "cert_compliance_status",
        "EU AI Act compliance status (1=compliant, 0=non-compliant)",
        ["preset", "article", "system"],
    )

    compliance_pass_rate = Gauge(
        "cert_compliance_pass_rate",
        "Pass rate for compliance requirements",
        ["preset", "system"],
    )

    # Semantic and NLI metrics
    semantic_score_gauge = Gauge(
        "cert_semantic_similarity",
        "Semantic similarity score",
        ["preset", "system"],
    )

    nli_score_gauge = Gauge(
        "cert_nli_score",
        "Natural Language Inference score",
        ["preset", "system"],
    )

    grounding_score_gauge = Gauge(
        "cert_grounding_score",
        "Grounding score (hallucination detection)",
        ["preset", "system"],
    )

    # System health
    last_evaluation_timestamp = Gauge(
        "cert_last_evaluation_timestamp",
        "Unix timestamp of last evaluation",
        ["preset", "system"],
    )


def export_metrics_from_audit_log(
    audit_log_path: str,
    system_name: str = "default",
    lookback_minutes: Optional[int] = None,
) -> Dict[str, Any]:
    """Export metrics from audit log to Prometheus.

    Args:
        audit_log_path: Path to JSONL audit log
        system_name: Name of the system being monitored
        lookback_minutes: Only process entries from last N minutes

    Returns:
        Dict with summary statistics

    Example:
        >>> from cert.observability.prometheus import export_metrics_from_audit_log
        >>>
        >>> # Export all metrics
        >>> stats = export_metrics_from_audit_log("data/audit.jsonl")
        >>>
        >>> # Export only last 5 minutes
        >>> stats = export_metrics_from_audit_log(
        ...     "data/audit.jsonl",
        ...     lookback_minutes=5
        ... )
    """
    if not PROMETHEUS_AVAILABLE:
        raise ImportError(
            "prometheus_client is required for Prometheus integration. "
            "Install with: pip install prometheus-client"
        )

    path = Path(audit_log_path)
    if not path.exists():
        raise FileNotFoundError(f"Audit log not found: {audit_log_path}")

    # Calculate cutoff time if lookback specified
    cutoff_time = None
    if lookback_minutes:
        cutoff_time = datetime.now() - timedelta(minutes=lookback_minutes)

    # Process audit log
    stats = {
        "total_evaluations": 0,
        "passed": 0,
        "failed": 0,
        "by_preset": {},
    }

    with open(path, "r") as f:
        for line in f:
            try:
                entry = json.loads(line)

                # Skip if outside lookback window
                if cutoff_time and "timestamp" in entry:
                    entry_time = datetime.fromisoformat(entry["timestamp"])
                    if entry_time < cutoff_time:
                        continue

                # Only process request entries with accuracy results
                if entry.get("type") != "request":
                    continue

                if "accuracy_result" not in entry:
                    continue

                stats["total_evaluations"] += 1

                # Extract metrics
                preset = entry.get("preset", "unknown")
                accuracy_result = entry["accuracy_result"]
                accuracy_score = accuracy_result.get("accuracy_score", 0.0)
                passed = accuracy_result.get("passed", False)

                # Update counters
                if passed:
                    stats["passed"] += 1
                else:
                    stats["failed"] += 1

                # Track by preset
                if preset not in stats["by_preset"]:
                    stats["by_preset"][preset] = {"total": 0, "passed": 0, "failed": 0}

                stats["by_preset"][preset]["total"] += 1
                if passed:
                    stats["by_preset"][preset]["passed"] += 1
                else:
                    stats["by_preset"][preset]["failed"] += 1

                # Update Prometheus metrics
                status = "passed" if passed else "failed"
                evaluation_total.labels(
                    preset=preset, status=status, system=system_name
                ).inc()

                # Update gauges (latest value)
                accuracy_gauge.labels(preset=preset, system=system_name).set(
                    accuracy_score
                )

                confidence_gauge.labels(preset=preset, system=system_name).set(
                    accuracy_score
                )

                # Detailed metrics
                metrics = accuracy_result.get("metrics", {})

                if "semantic_score" in metrics:
                    semantic_score_gauge.labels(preset=preset, system=system_name).set(
                        metrics["semantic_score"]
                    )

                if "nli_score" in metrics:
                    nli_score_gauge.labels(preset=preset, system=system_name).set(
                        metrics["nli_score"]
                    )

                if "grounding_score" in metrics:
                    grounding_score_gauge.labels(preset=preset, system=system_name).set(
                        metrics["grounding_score"]
                    )

                # Track failures
                if not passed:
                    reason = accuracy_result.get("reason", "unknown")
                    failure_total.labels(
                        preset=preset, reason=reason, system=system_name
                    ).inc()

                # Compliance metrics (if available)
                if "compliance_check" in entry:
                    compliance = entry["compliance_check"]
                    compliant_count = sum(1 for v in compliance.values() if v)
                    total_requirements = len(compliance)

                    if total_requirements > 0:
                        pass_rate = compliant_count / total_requirements
                        compliance_pass_rate.labels(
                            preset=preset, system=system_name
                        ).set(pass_rate)

                    # Per-article compliance
                    for article, compliant in compliance.items():
                        compliance_gauge.labels(
                            preset=preset, article=article, system=system_name
                        ).set(1.0 if compliant else 0.0)

                # Update timestamp
                last_evaluation_timestamp.labels(preset=preset, system=system_name).set(
                    time.time()
                )

            except (json.JSONDecodeError, KeyError):
                # Skip malformed entries
                continue

    return stats


def start_metrics_server(port: int = 8000, addr: str = "0.0.0.0"):
    """Start Prometheus metrics HTTP server.

    Args:
        port: Port to listen on (default: 8000)
        addr: Address to bind to (default: 0.0.0.0)

    Example:
        >>> from cert.observability.prometheus import start_metrics_server
        >>>
        >>> # Start server
        >>> start_metrics_server(port=8000)
        >>> # Metrics available at http://localhost:8000/metrics
    """
    if not PROMETHEUS_AVAILABLE:
        raise ImportError(
            "prometheus_client is required for Prometheus integration. "
            "Install with: pip install prometheus-client"
        )

    start_http_server(port, addr=addr)
    print(f"Prometheus metrics server started on {addr}:{port}")
    print(f"Metrics available at http://{addr}:{port}/metrics")


def get_metrics_text() -> str:
    """Get current metrics in Prometheus text format.

    Returns:
        Metrics in Prometheus exposition format

    Example:
        >>> from cert.observability.prometheus import get_metrics_text
        >>>
        >>> metrics = get_metrics_text()
        >>> print(metrics)
    """
    if not PROMETHEUS_AVAILABLE:
        raise ImportError(
            "prometheus_client is required for Prometheus integration. "
            "Install with: pip install prometheus-client"
        )

    return generate_latest(REGISTRY).decode("utf-8")


def export_metrics_continuously(
    audit_log_path: str,
    system_name: str = "default",
    interval_seconds: int = 60,
    lookback_minutes: int = 5,
):
    """Continuously export metrics from audit log.

    Args:
        audit_log_path: Path to JSONL audit log
        system_name: Name of the system being monitored
        interval_seconds: How often to update metrics
        lookback_minutes: Only process recent entries

    Example:
        >>> from cert.observability.prometheus import export_metrics_continuously
        >>>
        >>> # Update metrics every 60 seconds
        >>> export_metrics_continuously(
        ...     "data/audit.jsonl",
        ...     interval_seconds=60,
        ...     lookback_minutes=5
        ... )
    """
    if not PROMETHEUS_AVAILABLE:
        raise ImportError(
            "prometheus_client is required for Prometheus integration. "
            "Install with: pip install prometheus-client"
        )

    print(f"Starting continuous metrics export from {audit_log_path}")
    print(f"Updating every {interval_seconds} seconds")
    print(f"Lookback window: {lookback_minutes} minutes")

    while True:
        try:
            stats = export_metrics_from_audit_log(
                audit_log_path,
                system_name=system_name,
                lookback_minutes=lookback_minutes,
            )
            print(
                f"Updated metrics: {stats['total_evaluations']} evaluations "
                f"({stats['passed']} passed, {stats['failed']} failed)"
            )
        except Exception as e:
            print(f"Error updating metrics: {e}")

        time.sleep(interval_seconds)


def create_grafana_dashboard_json(system_name: str = "default") -> Dict[str, Any]:
    """Create Grafana dashboard JSON for CERT metrics.

    Args:
        system_name: Name of the system being monitored

    Returns:
        Grafana dashboard JSON

    Example:
        >>> from cert.observability.prometheus import create_grafana_dashboard_json
        >>> import json
        >>>
        >>> dashboard = create_grafana_dashboard_json("my-llm-system")
        >>> with open("grafana-dashboard.json", "w") as f:
        ...     json.dump(dashboard, f, indent=2)
    """
    return {
        "dashboard": {
            "title": f"CERT Framework - {system_name}",
            "tags": ["cert", "llm", "accuracy", "compliance"],
            "timezone": "browser",
            "panels": [
                {
                    "title": "Accuracy Score",
                    "type": "graph",
                    "targets": [
                        {
                            "expr": f'cert_accuracy_score{{system="{system_name}"}}',
                            "legendFormat": "{{preset}}",
                        }
                    ],
                    "yaxes": [{"min": 0, "max": 1}],
                    "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
                },
                {
                    "title": "Evaluation Rate",
                    "type": "graph",
                    "targets": [
                        {
                            "expr": f'rate(cert_evaluations_total{{system="{system_name}"}}[5m])',
                            "legendFormat": "{{preset}} - {{status}}",
                        }
                    ],
                    "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
                },
                {
                    "title": "Compliance Pass Rate",
                    "type": "gauge",
                    "targets": [
                        {
                            "expr": f'cert_compliance_pass_rate{{system="{system_name}"}}',
                            "legendFormat": "{{preset}}",
                        }
                    ],
                    "gridPos": {"x": 0, "y": 8, "w": 6, "h": 8},
                },
                {
                    "title": "Failure Reasons",
                    "type": "piechart",
                    "targets": [
                        {
                            "expr": f'cert_failures_total{{system="{system_name}"}}',
                            "legendFormat": "{{reason}}",
                        }
                    ],
                    "gridPos": {"x": 6, "y": 8, "w": 6, "h": 8},
                },
                {
                    "title": "Semantic Similarity",
                    "type": "graph",
                    "targets": [
                        {
                            "expr": f'cert_semantic_similarity{{system="{system_name}"}}',
                            "legendFormat": "{{preset}}",
                        }
                    ],
                    "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
                },
                {
                    "title": "NLI Score",
                    "type": "graph",
                    "targets": [
                        {
                            "expr": f'cert_nli_score{{system="{system_name}"}}',
                            "legendFormat": "{{preset}}",
                        }
                    ],
                    "gridPos": {"x": 0, "y": 16, "w": 12, "h": 8},
                },
                {
                    "title": "Grounding Score (Hallucination Detection)",
                    "type": "graph",
                    "targets": [
                        {
                            "expr": f'cert_grounding_score{{system="{system_name}"}}',
                            "legendFormat": "{{preset}}",
                        }
                    ],
                    "gridPos": {"x": 12, "y": 16, "w": 12, "h": 8},
                },
            ],
        }
    }
