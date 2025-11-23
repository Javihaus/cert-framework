"""
CERT Framework - Observability Module

Production-grade observability for LLM systems including:
- Telemetry: OpenTelemetry integration, Prometheus metrics, custom metrics
- Visualization: Grafana dashboards, real-time UI
- Alerting: Alert management, escalation rules, incident response
- Streaming: WebSocket real-time trace streaming
"""

from cert.observability.alerting import (
    Alert,
    AlertManager,
    AlertSeverity,
    EscalationManager,
    EscalationRule,
    Incident,
    IncidentResponse,
)
from cert.observability.telemetry import (
    CustomMetrics,
    MetricType,
    OpenTelemetryExporter,
    PrometheusMetrics,
)
from cert.observability.visualization import (
    GrafanaDashboardGenerator,
    RealTimeUI,
)

# WebSocket streaming (optional - requires 'websockets' package)
try:
    from cert.observability.websocket import (
        WebSocketTraceServer,
        WebSocketTracer,
        TraceEvent,
        create_streaming_tracer,
    )
    WEBSOCKET_AVAILABLE = True
except ImportError:
    WEBSOCKET_AVAILABLE = False
    WebSocketTraceServer = None
    WebSocketTracer = None
    TraceEvent = None
    create_streaming_tracer = None

__all__ = [
    # Telemetry
    "OpenTelemetryExporter",
    "PrometheusMetrics",
    "CustomMetrics",
    "MetricType",
    # Visualization
    "GrafanaDashboardGenerator",
    "RealTimeUI",
    # Alerting
    "AlertManager",
    "Alert",
    "AlertSeverity",
    "EscalationRule",
    "EscalationManager",
    "IncidentResponse",
    "Incident",
    # WebSocket streaming
    "WebSocketTraceServer",
    "WebSocketTracer",
    "TraceEvent",
    "create_streaming_tracer",
    "WEBSOCKET_AVAILABLE",
]
