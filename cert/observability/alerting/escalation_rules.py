"""
Escalation Rules for Alert Management

Provides escalation policies and notification routing
for production LLM alert handling.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable
from enum import Enum


class NotificationChannel(Enum):
    """Notification channels."""
    EMAIL = "email"
    SLACK = "slack"
    PAGERDUTY = "pagerduty"
    WEBHOOK = "webhook"
    SMS = "sms"


@dataclass
class EscalationRule:
    """Definition of an escalation rule."""

    name: str
    severity_threshold: str  # "warning", "error", "critical"
    delay_minutes: int  # Wait before escalating
    notification_channels: list[NotificationChannel]
    recipients: list[str]
    repeat_interval_minutes: int = 0  # 0 = no repeat


@dataclass
class EscalationEvent:
    """Record of an escalation event."""

    alert_id: str
    rule_name: str
    channel: NotificationChannel
    recipients: list[str]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    success: bool = True
    error_message: str = ""


class EscalationManager:
    """
    Escalation manager for alert notifications.

    Handles escalation policies, notification routing,
    and on-call scheduling.

    Example:
        manager = EscalationManager()

        # Add escalation rules
        manager.add_rule(EscalationRule(
            name="critical_oncall",
            severity_threshold="critical",
            delay_minutes=0,
            notification_channels=[NotificationChannel.PAGERDUTY],
            recipients=["oncall@company.com"]
        ))

        # Process alert
        manager.escalate(alert)
    """

    def __init__(
        self,
        notification_handlers: dict[NotificationChannel, Callable] | None = None,
    ):
        """
        Initialize escalation manager.

        Args:
            notification_handlers: Handlers for each channel
        """
        self._rules: list[EscalationRule] = []
        self._handlers = notification_handlers or {}
        self._events: list[EscalationEvent] = []
        self._last_notification: dict[str, datetime] = {}

    def add_rule(self, rule: EscalationRule) -> None:
        """Add an escalation rule."""
        self._rules.append(rule)
        # Sort by delay (ascending)
        self._rules.sort(key=lambda r: r.delay_minutes)

    def set_handler(
        self,
        channel: NotificationChannel,
        handler: Callable[[str, list[str], dict], bool],
    ) -> None:
        """Set handler for a notification channel."""
        self._handlers[channel] = handler

    def escalate(
        self,
        alert_id: str,
        severity: str,
        message: str,
        context: dict[str, Any] | None = None,
        fired_at: datetime | None = None,
    ) -> list[EscalationEvent]:
        """
        Escalate an alert through configured rules.

        Args:
            alert_id: Alert identifier
            severity: Alert severity
            message: Alert message
            context: Additional context
            fired_at: When alert was fired

        Returns:
            List of escalation events
        """
        events = []
        fired_at = fired_at or datetime.utcnow()
        elapsed_minutes = (datetime.utcnow() - fired_at).total_seconds() / 60

        for rule in self._rules:
            # Check severity threshold
            if not self._matches_severity(severity, rule.severity_threshold):
                continue

            # Check delay
            if elapsed_minutes < rule.delay_minutes:
                continue

            # Check repeat interval
            notification_key = f"{alert_id}:{rule.name}"
            if notification_key in self._last_notification:
                last_time = self._last_notification[notification_key]
                if rule.repeat_interval_minutes > 0:
                    minutes_since = (datetime.utcnow() - last_time).total_seconds() / 60
                    if minutes_since < rule.repeat_interval_minutes:
                        continue
                else:
                    # No repeat
                    continue

            # Send notifications
            for channel in rule.notification_channels:
                event = self._send_notification(
                    alert_id=alert_id,
                    rule=rule,
                    channel=channel,
                    message=message,
                    context=context,
                )
                events.append(event)

            self._last_notification[notification_key] = datetime.utcnow()

        return events

    def _matches_severity(self, severity: str, threshold: str) -> bool:
        """Check if severity matches threshold."""
        severity_order = ["info", "warning", "error", "critical"]
        try:
            return severity_order.index(severity) >= severity_order.index(threshold)
        except ValueError:
            return False

    def _send_notification(
        self,
        alert_id: str,
        rule: EscalationRule,
        channel: NotificationChannel,
        message: str,
        context: dict[str, Any] | None,
    ) -> EscalationEvent:
        """Send notification through a channel."""
        event = EscalationEvent(
            alert_id=alert_id,
            rule_name=rule.name,
            channel=channel,
            recipients=rule.recipients,
        )

        if channel in self._handlers:
            try:
                success = self._handlers[channel](
                    message,
                    rule.recipients,
                    context or {},
                )
                event.success = success
            except Exception as e:
                event.success = False
                event.error_message = str(e)
        else:
            event.success = False
            event.error_message = f"No handler for channel: {channel.value}"

        self._events.append(event)
        return event

    def get_events(
        self,
        alert_id: str | None = None,
        limit: int = 100,
    ) -> list[EscalationEvent]:
        """Get escalation events."""
        events = self._events

        if alert_id:
            events = [e for e in events if e.alert_id == alert_id]

        return events[-limit:]
