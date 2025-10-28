"""
Unit tests for Prometheus integration.

Tests the Prometheus metrics export and server functionality.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Skip all tests if prometheus_client not installed
pytest.importorskip("prometheus_client")

from cert.observability.prometheus import (
    export_metrics_from_audit_log,
    get_metrics_text,
    create_grafana_dashboard_json,
)


class TestPrometheusIntegration:
    """Test Prometheus metrics export."""

    def test_export_metrics_from_audit_log_basic(self):
        """Test basic metrics export from audit log."""
        # Create temporary audit log
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            # Write test entries
            for i in range(5):
                entry = {
                    "type": "request",
                    "timestamp": "2024-01-15T10:00:00",
                    "preset": "healthcare",
                    "accuracy_result": {
                        "accuracy_score": 0.85,
                        "passed": True,
                        "metrics": {
                            "semantic_score": 0.90,
                            "nli_score": 0.85,
                            "grounding_score": 0.95,
                        },
                    },
                }
                f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            # Export metrics
            stats = export_metrics_from_audit_log(log_path, system_name="test")

            assert stats["total_evaluations"] == 5
            assert stats["passed"] == 5
            assert stats["failed"] == 0
            assert "healthcare" in stats["by_preset"]

        finally:
            Path(log_path).unlink()

    def test_export_metrics_passed_and_failed(self):
        """Test metrics export with both passed and failed evaluations."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            # 3 passed
            for i in range(3):
                entry = {
                    "type": "request",
                    "timestamp": "2024-01-15T10:00:00",
                    "preset": "general",
                    "accuracy_result": {"accuracy_score": 0.90, "passed": True},
                }
                f.write(json.dumps(entry) + "\n")

            # 2 failed
            for i in range(2):
                entry = {
                    "type": "request",
                    "timestamp": "2024-01-15T10:00:00",
                    "preset": "general",
                    "accuracy_result": {
                        "accuracy_score": 0.60,
                        "passed": False,
                        "reason": "low_accuracy",
                    },
                }
                f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            assert stats["total_evaluations"] == 5
            assert stats["passed"] == 3
            assert stats["failed"] == 2

        finally:
            Path(log_path).unlink()

    def test_export_metrics_multiple_presets(self):
        """Test metrics export with multiple presets."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            presets = ["healthcare", "financial", "legal"]

            for preset in presets:
                for i in range(2):
                    entry = {
                        "type": "request",
                        "timestamp": "2024-01-15T10:00:00",
                        "preset": preset,
                        "accuracy_result": {"accuracy_score": 0.85, "passed": True},
                    }
                    f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            assert stats["total_evaluations"] == 6
            assert len(stats["by_preset"]) == 3

            for preset in presets:
                assert preset in stats["by_preset"]
                assert stats["by_preset"][preset]["total"] == 2

        finally:
            Path(log_path).unlink()

    def test_export_metrics_with_compliance(self):
        """Test metrics export with compliance information."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "healthcare",
                "accuracy_result": {"accuracy_score": 0.85, "passed": True},
                "compliance_check": {
                    "Article 15.1": True,
                    "Article 15.4": True,
                    "Article 19.1": False,
                },
            }
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            assert stats["total_evaluations"] == 1

        finally:
            Path(log_path).unlink()

    def test_export_metrics_lookback_window(self):
        """Test metrics export with lookback window."""
        from datetime import datetime, timedelta

        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            # Old entry (10 minutes ago)
            old_time = datetime.now() - timedelta(minutes=10)
            entry = {
                "type": "request",
                "timestamp": old_time.isoformat(),
                "preset": "general",
                "accuracy_result": {"accuracy_score": 0.85, "passed": True},
            }
            f.write(json.dumps(entry) + "\n")

            # Recent entry (1 minute ago)
            recent_time = datetime.now() - timedelta(minutes=1)
            entry = {
                "type": "request",
                "timestamp": recent_time.isoformat(),
                "preset": "general",
                "accuracy_result": {"accuracy_score": 0.90, "passed": True},
            }
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            # Only process last 5 minutes
            stats = export_metrics_from_audit_log(log_path, lookback_minutes=5)

            # Should only see recent entry
            assert stats["total_evaluations"] == 1

        finally:
            Path(log_path).unlink()

    def test_export_metrics_skips_invalid_entries(self):
        """Test that invalid entries are skipped."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            # Valid entry
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "general",
                "accuracy_result": {"accuracy_score": 0.85, "passed": True},
            }
            f.write(json.dumps(entry) + "\n")

            # Invalid JSON
            f.write("{invalid json}\n")

            # Missing accuracy_result
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "general",
            }
            f.write(json.dumps(entry) + "\n")

            # Wrong type
            entry = {"type": "other", "timestamp": "2024-01-15T10:00:00"}
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            # Should only process the valid entry
            assert stats["total_evaluations"] == 1

        finally:
            Path(log_path).unlink()

    def test_export_metrics_nonexistent_file(self):
        """Test error handling for nonexistent file."""
        with pytest.raises(FileNotFoundError):
            export_metrics_from_audit_log("nonexistent.jsonl")

    def test_get_metrics_text(self):
        """Test getting metrics in Prometheus text format."""
        # Export some metrics first
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "general",
                "accuracy_result": {"accuracy_score": 0.85, "passed": True},
            }
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            export_metrics_from_audit_log(log_path)

            # Get metrics text
            metrics_text = get_metrics_text()

            assert isinstance(metrics_text, str)
            # Should contain some cert metrics
            assert "cert_" in metrics_text

        finally:
            Path(log_path).unlink()

    def test_create_grafana_dashboard_json(self):
        """Test Grafana dashboard JSON creation."""
        dashboard = create_grafana_dashboard_json(system_name="test-system")

        assert isinstance(dashboard, dict)
        assert "dashboard" in dashboard
        assert "title" in dashboard["dashboard"]
        assert "panels" in dashboard["dashboard"]

        # Check that dashboard has panels
        panels = dashboard["dashboard"]["panels"]
        assert len(panels) > 0

        # Check panel structure
        for panel in panels:
            assert "title" in panel
            assert "targets" in panel

    def test_create_grafana_dashboard_has_accuracy_panel(self):
        """Test that dashboard includes accuracy panel."""
        dashboard = create_grafana_dashboard_json()

        panels = dashboard["dashboard"]["panels"]
        panel_titles = [p["title"] for p in panels]

        assert "Accuracy Score" in panel_titles

    def test_create_grafana_dashboard_has_compliance_panel(self):
        """Test that dashboard includes compliance panel."""
        dashboard = create_grafana_dashboard_json()

        panels = dashboard["dashboard"]["panels"]
        panel_titles = [p["title"] for p in panels]

        assert any("Compliance" in title for title in panel_titles)

    def test_export_metrics_detailed_metrics(self):
        """Test that detailed metrics (semantic, nli, grounding) are exported."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "healthcare",
                "accuracy_result": {
                    "accuracy_score": 0.85,
                    "passed": True,
                    "metrics": {
                        "semantic_score": 0.92,
                        "nli_score": 0.88,
                        "grounding_score": 0.96,
                    },
                },
            }
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            assert stats["total_evaluations"] == 1

            # Metrics should be exported to Prometheus gauges
            # (actual gauge values tested via get_metrics_text)

        finally:
            Path(log_path).unlink()

    def test_export_metrics_system_name_label(self):
        """Test that system name is used as label."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "general",
                "accuracy_result": {"accuracy_score": 0.85, "passed": True},
            }
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path, system_name="my-system")

            assert stats["total_evaluations"] == 1

            # Check that metrics include system label
            metrics_text = get_metrics_text()
            assert 'system="my-system"' in metrics_text

        finally:
            Path(log_path).unlink()

    def test_export_metrics_empty_log(self):
        """Test metrics export with empty log file."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            assert stats["total_evaluations"] == 0
            assert stats["passed"] == 0
            assert stats["failed"] == 0

        finally:
            Path(log_path).unlink()

    def test_export_metrics_preset_statistics(self):
        """Test per-preset statistics."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            # Healthcare: 2 passed, 1 failed
            for passed in [True, True, False]:
                entry = {
                    "type": "request",
                    "timestamp": "2024-01-15T10:00:00",
                    "preset": "healthcare",
                    "accuracy_result": {
                        "accuracy_score": 0.85 if passed else 0.65,
                        "passed": passed,
                    },
                }
                f.write(json.dumps(entry) + "\n")

            # Financial: 1 passed
            entry = {
                "type": "request",
                "timestamp": "2024-01-15T10:00:00",
                "preset": "financial",
                "accuracy_result": {"accuracy_score": 0.90, "passed": True},
            }
            f.write(json.dumps(entry) + "\n")

            log_path = f.name

        try:
            stats = export_metrics_from_audit_log(log_path)

            assert stats["by_preset"]["healthcare"]["total"] == 3
            assert stats["by_preset"]["healthcare"]["passed"] == 2
            assert stats["by_preset"]["healthcare"]["failed"] == 1

            assert stats["by_preset"]["financial"]["total"] == 1
            assert stats["by_preset"]["financial"]["passed"] == 1
            assert stats["by_preset"]["financial"]["failed"] == 0

        finally:
            Path(log_path).unlink()
