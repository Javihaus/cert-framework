"""
Grafana Dashboard Generator for LLM Observability

Generates Grafana dashboard JSON configurations for monitoring
LLM systems with production-ready panels and alerts.
"""

from dataclasses import dataclass
from typing import Any
import json


@dataclass
class Panel:
    """Grafana panel configuration."""

    title: str
    panel_type: str  # "graph", "stat", "gauge", "table", "heatmap"
    targets: list[dict[str, Any]]
    gridPos: dict[str, int]
    description: str = ""


class GrafanaDashboardGenerator:
    """
    Generates Grafana dashboard configurations for LLM monitoring.

    Creates production-ready dashboards with panels for:
    - Request latency and throughput
    - Token usage and costs
    - Error rates and types
    - Model performance metrics
    - Drift detection alerts

    Example:
        generator = GrafanaDashboardGenerator()

        # Generate LLM overview dashboard
        dashboard = generator.generate_llm_overview()

        # Export to JSON
        generator.export_dashboard(dashboard, "llm_dashboard.json")
    """

    def __init__(
        self,
        datasource: str = "Prometheus",
        namespace: str = "cert",
    ):
        """
        Initialize generator.

        Args:
            datasource: Grafana datasource name
            namespace: Prometheus metric namespace
        """
        self.datasource = datasource
        self.namespace = namespace

    def generate_llm_overview(self) -> dict[str, Any]:
        """Generate LLM system overview dashboard."""
        return {
            "dashboard": {
                "id": None,
                "uid": "cert-llm-overview",
                "title": "CERT LLM Overview",
                "tags": ["llm", "cert", "overview"],
                "timezone": "browser",
                "schemaVersion": 30,
                "version": 1,
                "refresh": "30s",
                "panels": [
                    # Row 1: Key Metrics
                    self._stat_panel(
                        "Total Requests",
                        f'sum({self.namespace}_llm_requests_total)',
                        {"h": 4, "w": 6, "x": 0, "y": 0},
                    ),
                    self._stat_panel(
                        "Error Rate",
                        f'sum(rate({self.namespace}_llm_errors_total[5m])) / sum(rate({self.namespace}_llm_requests_total[5m])) * 100',
                        {"h": 4, "w": 6, "x": 6, "y": 0},
                        unit="percent",
                    ),
                    self._stat_panel(
                        "Avg Latency (p50)",
                        f'histogram_quantile(0.5, sum(rate({self.namespace}_llm_request_duration_seconds_bucket[5m])) by (le))',
                        {"h": 4, "w": 6, "x": 12, "y": 0},
                        unit="s",
                    ),
                    self._stat_panel(
                        "Total Tokens",
                        f'sum({self.namespace}_llm_input_tokens_total) + sum({self.namespace}_llm_output_tokens_total)',
                        {"h": 4, "w": 6, "x": 18, "y": 0},
                    ),
                    # Row 2: Request Latency
                    self._graph_panel(
                        "Request Latency",
                        [
                            {
                                "expr": f'histogram_quantile(0.5, sum(rate({self.namespace}_llm_request_duration_seconds_bucket[5m])) by (le, model))',
                                "legendFormat": "p50 - {{{{model}}}}",
                            },
                            {
                                "expr": f'histogram_quantile(0.9, sum(rate({self.namespace}_llm_request_duration_seconds_bucket[5m])) by (le, model))',
                                "legendFormat": "p90 - {{{{model}}}}",
                            },
                            {
                                "expr": f'histogram_quantile(0.99, sum(rate({self.namespace}_llm_request_duration_seconds_bucket[5m])) by (le, model))',
                                "legendFormat": "p99 - {{{{model}}}}",
                            },
                        ],
                        {"h": 8, "w": 12, "x": 0, "y": 4},
                    ),
                    # Row 2: Request Rate
                    self._graph_panel(
                        "Request Rate",
                        [
                            {
                                "expr": f'sum(rate({self.namespace}_llm_requests_total[5m])) by (model)',
                                "legendFormat": "{{{{model}}}}",
                            },
                        ],
                        {"h": 8, "w": 12, "x": 12, "y": 4},
                    ),
                    # Row 3: Token Usage
                    self._graph_panel(
                        "Token Usage",
                        [
                            {
                                "expr": f'sum(rate({self.namespace}_llm_input_tokens_total[5m])) by (model)',
                                "legendFormat": "Input - {{{{model}}}}",
                            },
                            {
                                "expr": f'sum(rate({self.namespace}_llm_output_tokens_total[5m])) by (model)',
                                "legendFormat": "Output - {{{{model}}}}",
                            },
                        ],
                        {"h": 8, "w": 12, "x": 0, "y": 12},
                    ),
                    # Row 3: Errors
                    self._graph_panel(
                        "Errors by Type",
                        [
                            {
                                "expr": f'sum(rate({self.namespace}_llm_errors_total[5m])) by (error_type)',
                                "legendFormat": "{{{{error_type}}}}",
                            },
                        ],
                        {"h": 8, "w": 12, "x": 12, "y": 12},
                    ),
                ],
            },
        }

    def generate_cost_dashboard(self) -> dict[str, Any]:
        """Generate cost analysis dashboard."""
        return {
            "dashboard": {
                "id": None,
                "uid": "cert-llm-costs",
                "title": "CERT LLM Costs",
                "tags": ["llm", "cert", "costs"],
                "panels": [
                    self._stat_panel(
                        "Total Cost (24h)",
                        f'sum(increase({self.namespace}_llm_cost_usd_total[24h]))',
                        {"h": 4, "w": 8, "x": 0, "y": 0},
                        unit="currencyUSD",
                    ),
                    self._stat_panel(
                        "Cost per Request",
                        f'sum(rate({self.namespace}_llm_cost_usd_total[1h])) / sum(rate({self.namespace}_llm_requests_total[1h]))',
                        {"h": 4, "w": 8, "x": 8, "y": 0},
                        unit="currencyUSD",
                    ),
                    self._graph_panel(
                        "Cost by Model",
                        [
                            {
                                "expr": f'sum(rate({self.namespace}_llm_cost_usd_total[1h])) by (model) * 3600',
                                "legendFormat": "{{{{model}}}}",
                            },
                        ],
                        {"h": 8, "w": 24, "x": 0, "y": 4},
                    ),
                ],
            },
        }

    def generate_compliance_dashboard(self) -> dict[str, Any]:
        """Generate EU AI Act compliance dashboard."""
        return {
            "dashboard": {
                "id": None,
                "uid": "cert-compliance",
                "title": "CERT EU AI Act Compliance",
                "tags": ["llm", "cert", "compliance", "eu-ai-act"],
                "panels": [
                    self._stat_panel(
                        "Compliance Score",
                        f'{self.namespace}_compliance_score',
                        {"h": 4, "w": 6, "x": 0, "y": 0},
                        unit="percent",
                    ),
                    self._stat_panel(
                        "Human Oversight Events",
                        f'sum({self.namespace}_human_oversight_events_total)',
                        {"h": 4, "w": 6, "x": 6, "y": 0},
                    ),
                    self._stat_panel(
                        "Drift Alerts",
                        f'sum({self.namespace}_drift_alerts_total)',
                        {"h": 4, "w": 6, "x": 12, "y": 0},
                    ),
                    self._stat_panel(
                        "Accuracy Score",
                        f'avg({self.namespace}_accuracy_score)',
                        {"h": 4, "w": 6, "x": 18, "y": 0},
                        unit="percent",
                    ),
                ],
            },
        }

    def _stat_panel(
        self,
        title: str,
        expr: str,
        gridPos: dict[str, int],
        unit: str = "short",
    ) -> dict[str, Any]:
        """Generate a stat panel."""
        return {
            "title": title,
            "type": "stat",
            "gridPos": gridPos,
            "targets": [
                {
                    "expr": expr,
                    "datasource": self.datasource,
                }
            ],
            "fieldConfig": {
                "defaults": {
                    "unit": unit,
                }
            },
        }

    def _graph_panel(
        self,
        title: str,
        targets: list[dict[str, Any]],
        gridPos: dict[str, int],
    ) -> dict[str, Any]:
        """Generate a graph panel."""
        return {
            "title": title,
            "type": "timeseries",
            "gridPos": gridPos,
            "targets": [
                {**t, "datasource": self.datasource}
                for t in targets
            ],
        }

    def export_dashboard(
        self,
        dashboard: dict[str, Any],
        filepath: str,
    ) -> bool:
        """Export dashboard to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(dashboard, f, indent=2)
            return True
        except Exception:
            return False
