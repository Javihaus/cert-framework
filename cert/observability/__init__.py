"""
CERT Framework Observability
=============================

Observability and metrics export modules for monitoring CERT Framework.

Available Modules:
- prometheus: Prometheus metrics exporter for accuracy monitoring

Usage:
    >>> from cert.observability.prometheus import export_metrics_from_audit_log
    >>> from cert.observability.prometheus import start_metrics_server
    >>>
    >>> # Export metrics from audit log
    >>> export_metrics_from_audit_log("data/audit.jsonl")
    >>>
    >>> # Start metrics server
    >>> start_metrics_server(port=8000)

Note: Prometheus integration requires prometheus_client:
    pip install prometheus-client
"""

from cert.observability.prometheus import (
    export_metrics_from_audit_log,
    start_metrics_server,
    get_metrics_text,
    export_metrics_continuously,
    create_grafana_dashboard_json,
)

__all__ = [
    "export_metrics_from_audit_log",
    "start_metrics_server",
    "get_metrics_text",
    "export_metrics_continuously",
    "create_grafana_dashboard_json",
]
