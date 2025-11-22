"""
Real-time UI Components for LLM Monitoring

Provides terminal-based real-time monitoring display for
production LLM systems.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable
import time


@dataclass
class UIMetric:
    """Metric for display."""

    name: str
    value: Any
    unit: str = ""
    trend: str = ""  # "up", "down", "stable"
    status: str = "normal"  # "normal", "warning", "critical"


class RealTimeUI:
    """
    Real-time terminal UI for LLM monitoring.

    Provides live dashboard display in terminal for monitoring
    LLM system health and performance.

    Example:
        ui = RealTimeUI()

        # Update metrics
        ui.update_metric("requests", 1500, unit="req/s")
        ui.update_metric("latency_p50", 250, unit="ms")
        ui.update_metric("error_rate", 0.5, unit="%", status="warning")

        # Render dashboard
        ui.render()
    """

    def __init__(
        self,
        title: str = "CERT LLM Monitor",
        refresh_interval: float = 1.0,
    ):
        """
        Initialize UI.

        Args:
            title: Dashboard title
            refresh_interval: Refresh interval in seconds
        """
        self.title = title
        self.refresh_interval = refresh_interval

        self._metrics: dict[str, UIMetric] = {}
        self._alerts: list[dict[str, Any]] = []
        self._logs: list[str] = []
        self._max_logs = 10

    def update_metric(
        self,
        name: str,
        value: Any,
        unit: str = "",
        status: str = "normal",
        trend: str = "",
    ) -> None:
        """Update a metric value."""
        self._metrics[name] = UIMetric(
            name=name,
            value=value,
            unit=unit,
            status=status,
            trend=trend,
        )

    def add_alert(
        self,
        message: str,
        severity: str = "warning",
    ) -> None:
        """Add an alert."""
        self._alerts.append({
            "message": message,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
        })
        # Keep last 5 alerts
        self._alerts = self._alerts[-5:]

    def add_log(self, message: str) -> None:
        """Add a log entry."""
        timestamp = datetime.utcnow().strftime("%H:%M:%S")
        self._logs.append(f"[{timestamp}] {message}")
        self._logs = self._logs[-self._max_logs:]

    def render(self) -> str:
        """
        Render the dashboard as a string.

        Returns:
            Formatted dashboard string
        """
        width = 60
        lines = []

        # Header
        lines.append("=" * width)
        lines.append(f"{self.title:^{width}}")
        lines.append(f"{'Updated: ' + datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'):^{width}}")
        lines.append("=" * width)

        # Metrics
        lines.append("\n METRICS")
        lines.append("-" * width)

        for metric in self._metrics.values():
            status_indicator = {
                "normal": " ",
                "warning": "!",
                "critical": "X",
            }.get(metric.status, " ")

            trend_indicator = {
                "up": "↑",
                "down": "↓",
                "stable": "→",
            }.get(metric.trend, " ")

            value_str = f"{metric.value}{metric.unit}"
            lines.append(f" [{status_indicator}] {metric.name:<20} {value_str:>15} {trend_indicator}")

        # Alerts
        if self._alerts:
            lines.append("\n ALERTS")
            lines.append("-" * width)
            for alert in self._alerts[-3:]:
                severity_icon = "⚠" if alert["severity"] == "warning" else "🔴"
                lines.append(f" {severity_icon} {alert['message'][:50]}")

        # Logs
        if self._logs:
            lines.append("\n RECENT ACTIVITY")
            lines.append("-" * width)
            for log in self._logs[-5:]:
                lines.append(f" {log[:55]}")

        lines.append("\n" + "=" * width)

        return "\n".join(lines)

    def print_dashboard(self) -> None:
        """Print dashboard to terminal."""
        print(self.render())

    def get_metrics_summary(self) -> dict[str, Any]:
        """Get metrics as dictionary."""
        return {
            m.name: {
                "value": m.value,
                "unit": m.unit,
                "status": m.status,
            }
            for m in self._metrics.values()
        }
