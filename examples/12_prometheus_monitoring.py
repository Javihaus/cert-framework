"""
Example 12: Prometheus Monitoring Integration
==============================================

Purpose: Demonstrate Prometheus metrics export for real-time monitoring.

This example shows:
- Exporting metrics from audit logs
- Starting Prometheus metrics server
- Creating Grafana dashboards
- Continuous metrics updates

Run: python examples/12_prometheus_monitoring.py
Time: Runs continuously (Ctrl+C to stop)
Dependencies: cert-framework, prometheus-client

Install: pip install prometheus-client
"""

import time
import json
from pathlib import Path


def example_basic_metrics_export():
    """Demonstrate basic metrics export from audit log."""
    print("\n1. Basic Metrics Export")
    print("-" * 60)

    # Check if prometheus_client is available
    try:
        from cert.observability.prometheus import export_metrics_from_audit_log

        print("  ✓ prometheus_client installed")
    except ImportError:
        print("  ✗ prometheus_client not installed")
        print("  Run: pip install prometheus-client")
        return

    # Create mock audit log for demonstration
    mock_log_path = "data/mock_audit.jsonl"
    Path("data").mkdir(exist_ok=True)

    with open(mock_log_path, "w") as f:
        # Mock entries
        for i in range(10):
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "healthcare",
                "accuracy_result": {
                    "accuracy_score": 0.85 + (i % 3) * 0.05,
                    "passed": i % 3 != 2,
                    "metrics": {
                        "semantic_score": 0.90,
                        "nli_score": 0.85,
                        "grounding_score": 0.95,
                    },
                },
            }
            f.write(json.dumps(entry) + "\n")

    # Export metrics
    stats = export_metrics_from_audit_log(mock_log_path, system_name="example-system")

    print(f"\n  Metrics exported:")
    print(f"    Total evaluations: {stats['total_evaluations']}")
    print(f"    Passed: {stats['passed']}")
    print(f"    Failed: {stats['failed']}")
    print(f"\n  Metrics available in Prometheus format")


def example_metrics_server():
    """Demonstrate starting Prometheus metrics server."""
    print("\n2. Prometheus Metrics Server")
    print("-" * 60)

    print("""
  # Start metrics server:

  from cert.observability.prometheus import start_metrics_server

  # Start server on port 8000
  start_metrics_server(port=8000)

  # Metrics available at:
  # http://localhost:8000/metrics

  # Server runs in background and serves metrics
  # Compatible with Prometheus scraping
    """)

    print("  ✓ Server provides metrics endpoint")
    print("  ✓ Auto-updates from audit log")
    print("  ✓ Compatible with Prometheus scrape config")


def example_continuous_export():
    """Demonstrate continuous metrics export."""
    print("\n3. Continuous Metrics Export")
    print("-" * 60)

    print("""
  # Continuously export metrics:

  from cert.observability.prometheus import (
      export_metrics_continuously,
      start_metrics_server
  )

  # Start metrics server
  start_metrics_server(port=8000)

  # Continuously export (updates every 60 seconds)
  export_metrics_continuously(
      audit_log_path="data/audit.jsonl",
      system_name="production",
      interval_seconds=60,
      lookback_minutes=5  # Only recent entries
  )

  # Metrics auto-update in real-time
  # Prometheus scrapes every 15-60 seconds
    """)

    print("  ✓ Updates every N seconds")
    print("  ✓ Configurable lookback window")
    print("  ✓ Production-ready monitoring")


def example_grafana_dashboard():
    """Demonstrate Grafana dashboard creation."""
    print("\n4. Grafana Dashboard Creation")
    print("-" * 60)

    try:
        from cert.observability.prometheus import create_grafana_dashboard_json

        dashboard = create_grafana_dashboard_json(system_name="my-llm-system")

        # Save dashboard
        output_path = "data/grafana-dashboard.json"
        with open(output_path, "w") as f:
            json.dump(dashboard, f, indent=2)

        print(f"  ✓ Dashboard created: {output_path}")
        print(f"  ✓ Panels: {len(dashboard['dashboard']['panels'])}")
        print(f"\n  Dashboard includes:")
        for panel in dashboard["dashboard"]["panels"]:
            print(f"    - {panel['title']}")

        print(f"\n  Import into Grafana:")
        print(f"    1. Open Grafana UI")
        print(f"    2. Go to Dashboards > Import")
        print(f"    3. Upload {output_path}")

    except ImportError:
        print("  ✗ prometheus_client not installed")


def example_available_metrics():
    """Show all available Prometheus metrics."""
    print("\n5. Available Prometheus Metrics")
    print("-" * 60)

    metrics = [
        ("cert_accuracy_score", "Current accuracy score", "Gauge"),
        ("cert_confidence_score", "Confidence score", "Gauge"),
        ("cert_evaluations_total", "Total evaluations", "Counter"),
        ("cert_failures_total", "Total failures", "Counter"),
        ("cert_evaluation_duration_seconds", "Evaluation duration", "Histogram"),
        ("cert_compliance_status", "Compliance status (1/0)", "Gauge"),
        ("cert_compliance_pass_rate", "Compliance pass rate", "Gauge"),
        ("cert_semantic_similarity", "Semantic similarity", "Gauge"),
        ("cert_nli_score", "NLI score", "Gauge"),
        ("cert_grounding_score", "Grounding score", "Gauge"),
        ("cert_last_evaluation_timestamp", "Last evaluation time", "Gauge"),
    ]

    print(f"\n  {'Metric':<40} {'Type':<12} {'Description'}")
    print("  " + "-" * 70)

    for name, desc, mtype in metrics:
        print(f"  {name:<40} {mtype:<12} {desc}")

    print(f"\n  Labels:")
    print(f"    preset: general, healthcare, financial, legal")
    print(f"    system: custom system identifier")
    print(f"    status: passed, failed")
    print(f"    article: EU AI Act article number")


def example_prometheus_config():
    """Show Prometheus scrape configuration."""
    print("\n6. Prometheus Scrape Configuration")
    print("-" * 60)

    print("""
  # Add to prometheus.yml:

  scrape_configs:
    - job_name: 'cert-framework'
      scrape_interval: 30s
      static_configs:
        - targets: ['localhost:8000']
          labels:
            environment: 'production'
            service: 'llm-api'

  # Or with service discovery:
  
  scrape_configs:
    - job_name: 'cert-framework'
      kubernetes_sd_configs:
        - role: pod
      relabel_configs:
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          target_label: __address__
          regex: ([^:]+)(?::\\d+)?;(\\d+)
          replacement: $1:$2
    """)

    print("  ✓ Compatible with Prometheus 2.x")
    print("  ✓ Supports service discovery")
    print("  ✓ Works with Kubernetes/Docker")


def example_alerting_rules():
    """Show example Prometheus alerting rules."""
    print("\n7. Prometheus Alerting Rules")
    print("-" * 60)

    print("""
  # Add to prometheus-alerts.yml:

  groups:
    - name: cert_framework_alerts
      interval: 30s
      rules:
        - alert: LowAccuracyScore
          expr: cert_accuracy_score < 0.7
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Low accuracy detected"
            description: "Accuracy score is {{ $value }}"

        - alert: HighFailureRate
          expr: rate(cert_failures_total[5m]) > 0.1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High failure rate"
            description: "Failure rate is {{ $value }} per second"

        - alert: ComplianceViolation
          expr: cert_compliance_pass_rate < 0.8
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "EU AI Act compliance violation"
            description: "Pass rate is {{ $value }}"
    """)

    print("  ✓ Alert on low accuracy")
    print("  ✓ Alert on high failure rate")
    print("  ✓ Alert on compliance violations")
    print("  ✓ Integrate with PagerDuty, Slack, etc.")


if __name__ == "__main__":
    print("Example 12: Prometheus Monitoring Integration")
    print("=" * 60)

    try:
        example_basic_metrics_export()
        example_metrics_server()
        example_continuous_export()
        example_grafana_dashboard()
        example_available_metrics()
        example_prometheus_config()
        example_alerting_rules()

        print("\n✓ Example complete!")
        print("\n💡 Key Takeaways:")
        print("   - export_metrics_from_audit_log() for batch export")
        print("   - start_metrics_server() for HTTP endpoint")
        print("   - export_metrics_continuously() for real-time")
        print("   - create_grafana_dashboard_json() for visualization")
        print("   - Compatible with standard Prometheus stack")
        print("   - Ready for production monitoring")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
