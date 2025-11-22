"""
Unit tests for the observability module.
"""

import pytest


class TestOpenTelemetryExporter:
    """Tests for OpenTelemetryExporter."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.telemetry import OpenTelemetryExporter
        assert OpenTelemetryExporter is not None

    def test_initialization(self):
        """Test exporter initialization."""
        from cert.observability.telemetry import OpenTelemetryExporter

        exporter = OpenTelemetryExporter(
            service_name="test-service",
            export_to_console=False,
        )

        assert exporter.service_name == "test-service"

    def test_start_span(self):
        """Test span creation."""
        from cert.observability.telemetry import OpenTelemetryExporter

        exporter = OpenTelemetryExporter(service_name="test")

        with exporter.start_span("test_operation") as span:
            span.set_attribute("key", "value")

        traces = exporter.get_traces()
        assert len(traces) > 0


class TestPrometheusMetrics:
    """Tests for PrometheusMetrics."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.telemetry import PrometheusMetrics
        assert PrometheusMetrics is not None

    def test_increment_counter(self):
        """Test counter increment."""
        from cert.observability.telemetry import PrometheusMetrics

        metrics = PrometheusMetrics(namespace="test")

        metrics.inc_counter("requests_total", labels={"endpoint": "chat"})
        metrics.inc_counter("requests_total", labels={"endpoint": "chat"})

        summary = metrics.get_summary()
        assert "requests_total:endpoint=\"chat\"" in summary["counters"]

    def test_set_gauge(self):
        """Test gauge setting."""
        from cert.observability.telemetry import PrometheusMetrics

        metrics = PrometheusMetrics(namespace="test")

        metrics.set_gauge("active_requests", 5)

        summary = metrics.get_summary()
        assert "active_requests:" in summary["gauges"]

    def test_record_llm_request(self):
        """Test recording LLM request."""
        from cert.observability.telemetry import PrometheusMetrics

        metrics = PrometheusMetrics(namespace="test")

        metrics.record_llm_request(
            model="gpt-4",
            input_tokens=100,
            output_tokens=50,
            latency_seconds=0.5,
        )

        summary = metrics.get_summary()
        assert len(summary["counters"]) > 0


class TestCustomMetrics:
    """Tests for CustomMetrics."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.telemetry import CustomMetrics, MetricType
        assert CustomMetrics is not None
        assert MetricType is not None

    def test_define_and_record(self):
        """Test defining and recording custom metrics."""
        from cert.observability.telemetry import CustomMetrics, MetricType

        metrics = CustomMetrics()

        metrics.define(
            "accuracy",
            MetricType.GAUGE,
            "Model accuracy score",
        )

        metrics.record("accuracy", 0.95)

        current = metrics.get_current("accuracy")
        assert current == 0.95

    def test_get_statistics(self):
        """Test getting metric statistics."""
        from cert.observability.telemetry import CustomMetrics, MetricType

        metrics = CustomMetrics()

        for i in range(10):
            metrics.record("latency", 100.0 + i)

        stats = metrics.get_statistics("latency")
        assert stats["count"] == 10
        assert stats["min"] == 100.0
        assert stats["max"] == 109.0


class TestAlertManager:
    """Tests for AlertManager."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.alerting import AlertManager, AlertSeverity
        assert AlertManager is not None
        assert AlertSeverity is not None

    def test_add_rule(self):
        """Test adding alert rules."""
        from cert.observability.alerting import AlertManager, AlertSeverity
        from cert.observability.alerting.alert_manager import AlertRule

        manager = AlertManager()

        rule = AlertRule(
            name="high_error_rate",
            condition="error_rate > 0.05",
            severity=AlertSeverity.CRITICAL,
            description="Error rate exceeds 5%",
        )

        manager.add_rule(rule)
        assert "high_error_rate" in manager._rules

    def test_evaluate_alerts(self):
        """Test alert evaluation."""
        from cert.observability.alerting import AlertManager, AlertSeverity
        from cert.observability.alerting.alert_manager import AlertRule

        manager = AlertManager()

        manager.add_rule(AlertRule(
            name="high_error_rate",
            condition="error_rate > 0.05",
            severity=AlertSeverity.CRITICAL,
        ))

        # Should trigger alert
        alerts = manager.evaluate({"error_rate": 0.10})
        assert len(alerts) == 1

        # Should not trigger again
        alerts = manager.evaluate({"error_rate": 0.10})
        assert len(alerts) == 0  # Already firing


class TestIncidentResponse:
    """Tests for IncidentResponse."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.alerting import IncidentResponse, Incident
        assert IncidentResponse is not None
        assert Incident is not None

    def test_create_incident(self):
        """Test creating an incident."""
        from cert.observability.alerting import IncidentResponse
        from cert.observability.alerting.incident_response import IncidentSeverity

        ir = IncidentResponse()

        incident = ir.create_incident(
            title="High error rate on chat endpoint",
            description="Error rate spiked to 15%",
            severity=IncidentSeverity.SEV2,
            created_by="oncall@test.com",
        )

        assert incident is not None
        assert incident.title == "High error rate on chat endpoint"
        assert incident.incident_id.startswith("INC-")

    def test_resolve_incident(self):
        """Test resolving an incident."""
        from cert.observability.alerting import IncidentResponse
        from cert.observability.alerting.incident_response import IncidentSeverity, IncidentStatus

        ir = IncidentResponse()

        incident = ir.create_incident(
            title="Test Incident",
            description="Test description",
            severity=IncidentSeverity.SEV3,
            created_by="test@test.com",
        )

        result = ir.resolve_incident(
            incident.incident_id,
            root_cause="Test root cause",
            mitigation="Test mitigation",
            resolved_by="test@test.com",
        )

        assert result is True

        updated = ir.get_incident(incident.incident_id)
        assert updated.status == IncidentStatus.RESOLVED


class TestGrafanaDashboardGenerator:
    """Tests for GrafanaDashboardGenerator."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.visualization import GrafanaDashboardGenerator
        assert GrafanaDashboardGenerator is not None

    def test_generate_dashboard(self):
        """Test generating a dashboard."""
        from cert.observability.visualization import GrafanaDashboardGenerator

        generator = GrafanaDashboardGenerator(namespace="cert")

        dashboard = generator.generate_llm_overview()

        assert dashboard is not None
        assert "dashboard" in dashboard
        assert dashboard["dashboard"]["title"] == "CERT LLM Overview"


class TestRealTimeUI:
    """Tests for RealTimeUI."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.observability.visualization import RealTimeUI
        assert RealTimeUI is not None

    def test_update_metrics(self):
        """Test updating UI metrics."""
        from cert.observability.visualization import RealTimeUI

        ui = RealTimeUI(title="Test Dashboard")

        ui.update_metric("requests", 100, unit="req/s")
        ui.update_metric("latency", 250, unit="ms", status="normal")

        summary = ui.get_metrics_summary()
        assert "requests" in summary
        assert summary["requests"]["value"] == 100

    def test_render(self):
        """Test rendering the dashboard."""
        from cert.observability.visualization import RealTimeUI

        ui = RealTimeUI(title="Test Dashboard")
        ui.update_metric("test", 42)

        output = ui.render()
        assert "Test Dashboard" in output
        assert "test" in output
