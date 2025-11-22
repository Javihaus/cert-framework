"""
Alert Manager for LLM Observability

Provides alert definition, triggering, and notification management
for production LLM systems.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable


class AlertSeverity(Enum):
    """Alert severity levels."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertStatus(Enum):
    """Alert status."""

    FIRING = "firing"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"
    SILENCED = "silenced"


@dataclass
class AlertRule:
    """Definition of an alert rule."""

    name: str
    condition: str  # Expression to evaluate
    severity: AlertSeverity
    description: str = ""
    duration: int = 0  # Seconds condition must be true
    labels: dict[str, str] = field(default_factory=dict)
    annotations: dict[str, str] = field(default_factory=dict)
    runbook_url: str = ""


@dataclass
class Alert:
    """An active alert instance."""

    alert_id: str
    rule_name: str
    severity: AlertSeverity
    status: AlertStatus
    message: str
    labels: dict[str, str]
    annotations: dict[str, str]
    fired_at: datetime
    resolved_at: datetime | None = None
    acknowledged_by: str | None = None
    value: float | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "alert_id": self.alert_id,
            "rule_name": self.rule_name,
            "severity": self.severity.value,
            "status": self.status.value,
            "message": self.message,
            "labels": self.labels,
            "annotations": self.annotations,
            "fired_at": self.fired_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "acknowledged_by": self.acknowledged_by,
            "value": self.value,
        }


class AlertManager:
    """
    Alert manager for LLM observability.

    Manages alert rules, triggers alerts based on conditions,
    and handles alert lifecycle.

    Example:
        manager = AlertManager()

        # Define alert rules
        manager.add_rule(AlertRule(
            name="high_error_rate",
            condition="error_rate > 0.05",
            severity=AlertSeverity.CRITICAL,
            description="Error rate exceeds 5%"
        ))

        # Check metrics and fire alerts
        manager.evaluate({"error_rate": 0.08})

        # Get active alerts
        for alert in manager.get_active_alerts():
            print(f"[{alert.severity.value}] {alert.message}")
    """

    def __init__(
        self,
        on_alert_callback: Callable[[Alert], None] | None = None,
        on_resolve_callback: Callable[[Alert], None] | None = None,
    ):
        """
        Initialize alert manager.

        Args:
            on_alert_callback: Callback when alert fires
            on_resolve_callback: Callback when alert resolves
        """
        self.on_alert_callback = on_alert_callback
        self.on_resolve_callback = on_resolve_callback

        self._rules: dict[str, AlertRule] = {}
        self._alerts: dict[str, Alert] = {}
        self._alert_history: list[Alert] = []
        self._alert_counter = 0
        self._silenced_rules: set[str] = set()

    def _generate_alert_id(self) -> str:
        """Generate unique alert ID."""
        self._alert_counter += 1
        return f"alert_{int(datetime.utcnow().timestamp())}_{self._alert_counter}"

    def add_rule(self, rule: AlertRule) -> None:
        """Add an alert rule."""
        self._rules[rule.name] = rule

    def remove_rule(self, name: str) -> bool:
        """Remove an alert rule."""
        if name in self._rules:
            del self._rules[name]
            return True
        return False

    def silence_rule(self, name: str, duration_minutes: int = 60) -> None:
        """Silence a rule temporarily."""
        self._silenced_rules.add(name)

    def unsilence_rule(self, name: str) -> None:
        """Unsilence a rule."""
        self._silenced_rules.discard(name)

    def evaluate(
        self,
        metrics: dict[str, float],
    ) -> list[Alert]:
        """
        Evaluate all rules against current metrics.

        Args:
            metrics: Current metric values

        Returns:
            List of newly fired alerts
        """
        new_alerts = []

        for rule_name, rule in self._rules.items():
            if rule_name in self._silenced_rules:
                continue

            # Simple condition evaluation
            try:
                condition_met = self._evaluate_condition(rule.condition, metrics)
            except Exception:
                condition_met = False

            alert_key = f"{rule_name}"

            if condition_met:
                if alert_key not in self._alerts:
                    # Fire new alert
                    alert = Alert(
                        alert_id=self._generate_alert_id(),
                        rule_name=rule_name,
                        severity=rule.severity,
                        status=AlertStatus.FIRING,
                        message=rule.description or rule.condition,
                        labels=rule.labels.copy(),
                        annotations=rule.annotations.copy(),
                        fired_at=datetime.utcnow(),
                        value=metrics.get(rule.condition.split()[0]),
                    )

                    self._alerts[alert_key] = alert
                    new_alerts.append(alert)

                    if self.on_alert_callback:
                        self.on_alert_callback(alert)
            else:
                if alert_key in self._alerts:
                    # Resolve alert
                    alert = self._alerts[alert_key]
                    alert.status = AlertStatus.RESOLVED
                    alert.resolved_at = datetime.utcnow()

                    self._alert_history.append(alert)
                    del self._alerts[alert_key]

                    if self.on_resolve_callback:
                        self.on_resolve_callback(alert)

        return new_alerts

    def _evaluate_condition(
        self,
        condition: str,
        metrics: dict[str, float],
    ) -> bool:
        """Evaluate a condition string."""
        # Simple parser for conditions like "error_rate > 0.05"
        parts = condition.split()
        if len(parts) != 3:
            return False

        metric_name, operator, threshold = parts
        metric_value = metrics.get(metric_name)

        if metric_value is None:
            return False

        try:
            threshold_value = float(threshold)
        except ValueError:
            return False

        if operator == ">":
            return metric_value > threshold_value
        elif operator == ">=":
            return metric_value >= threshold_value
        elif operator == "<":
            return metric_value < threshold_value
        elif operator == "<=":
            return metric_value <= threshold_value
        elif operator == "==":
            return metric_value == threshold_value
        elif operator == "!=":
            return metric_value != threshold_value

        return False

    def acknowledge_alert(
        self,
        alert_id: str,
        acknowledged_by: str,
    ) -> bool:
        """Acknowledge an alert."""
        for alert in self._alerts.values():
            if alert.alert_id == alert_id:
                alert.status = AlertStatus.ACKNOWLEDGED
                alert.acknowledged_by = acknowledged_by
                return True
        return False

    def get_active_alerts(
        self,
        severity_filter: AlertSeverity | None = None,
    ) -> list[Alert]:
        """Get active alerts."""
        alerts = list(self._alerts.values())

        if severity_filter:
            alerts = [a for a in alerts if a.severity == severity_filter]

        return sorted(alerts, key=lambda a: a.fired_at, reverse=True)

    def get_alert_history(
        self,
        limit: int = 100,
    ) -> list[Alert]:
        """Get alert history."""
        return self._alert_history[-limit:]

    def get_summary(self) -> dict[str, Any]:
        """Get alerting summary."""
        active = list(self._alerts.values())

        severity_counts = {}
        for alert in active:
            severity_counts[alert.severity.value] = severity_counts.get(alert.severity.value, 0) + 1

        return {
            "active_alerts": len(active),
            "by_severity": severity_counts,
            "total_rules": len(self._rules),
            "silenced_rules": len(self._silenced_rules),
        }

    def export_alerts(self, filepath: str) -> bool:
        """Export active alerts to JSON."""
        try:
            data = [a.to_dict() for a in self._alerts.values()]
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False


# Pre-defined alert rules for LLM monitoring
DEFAULT_LLM_ALERT_RULES = [
    AlertRule(
        name="high_error_rate",
        condition="error_rate > 0.05",
        severity=AlertSeverity.CRITICAL,
        description="LLM error rate exceeds 5%",
    ),
    AlertRule(
        name="high_latency",
        condition="latency_p99 > 5000",
        severity=AlertSeverity.WARNING,
        description="P99 latency exceeds 5 seconds",
    ),
    AlertRule(
        name="drift_detected",
        condition="drift_score > 0.3",
        severity=AlertSeverity.WARNING,
        description="Embedding drift detected",
    ),
    AlertRule(
        name="cost_spike",
        condition="hourly_cost > 100",
        severity=AlertSeverity.WARNING,
        description="Hourly cost exceeds $100",
    ),
    AlertRule(
        name="low_accuracy",
        condition="accuracy_score < 0.8",
        severity=AlertSeverity.ERROR,
        description="Accuracy score below 80%",
    ),
]
