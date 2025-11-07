"""
Test that report schemas are valid and fixtures match contracts.

These tests ensure Python and TypeScript schemas stay synchronized.
"""

import json
from pathlib import Path

from cert.compliance.schemas import FailedTrace, PerformanceMetrics


def test_sample_report_validates():
    """Ensure sample fixture matches Python schema."""
    fixture_path = Path(__file__).parent / "fixtures" / "sample_report.json"
    data = json.loads(fixture_path.read_text())

    # Manual validation - check all required fields exist
    assert "metadata" in data
    assert "performance" in data
    assert "temporal" in data
    assert "failed_traces" in data
    assert "evaluation_methodology" in data
    assert "compliance_statement" in data

    # Validate metadata fields
    meta = data["metadata"]
    assert "system_name" in meta
    assert "system_version" in meta
    assert "provider_name" in meta
    assert "intended_purpose" in meta
    assert "report_date" in meta

    # Validate performance metrics
    perf = data["performance"]
    assert "total_traces" in perf
    assert "evaluated_traces" in perf
    assert "passed_traces" in perf
    assert "failed_traces" in perf
    assert "accuracy_percentage" in perf
    assert "mean_confidence" in perf
    assert "median_confidence" in perf
    assert "threshold_used" in perf

    # Validate types
    assert isinstance(perf["total_traces"], int)
    assert isinstance(perf["accuracy_percentage"], (int, float))
    assert isinstance(perf["mean_confidence"], (int, float))

    # Validate temporal
    temp = data["temporal"]
    assert "period_start" in temp
    assert "period_end" in temp
    assert "daily_accuracy" in temp
    assert isinstance(temp["daily_accuracy"], list)

    # Validate failed traces
    traces = data["failed_traces"]
    assert isinstance(traces, list)
    if len(traces) > 0:
        trace = traces[0]
        assert "timestamp" in trace
        assert "context" in trace
        assert "answer" in trace
        assert "confidence" in trace
        assert "reason" in trace


def test_performance_metrics_schema():
    """Test PerformanceMetrics dataclass structure."""
    metrics = PerformanceMetrics(
        total_traces=1000,
        evaluated_traces=950,
        passed_traces=894,
        failed_traces=56,
        accuracy_percentage=94.1,
        mean_confidence=0.847,
        median_confidence=0.873,
        threshold_used=0.7,
    )

    assert metrics.total_traces == 1000
    assert metrics.accuracy_percentage == 94.1
    assert metrics.mean_confidence == 0.847


def test_failed_trace_schema():
    """Test FailedTrace dataclass structure."""
    trace = FailedTrace(
        timestamp="2025-10-15T14:23:00Z",
        input_query="What was Apple's Q4 revenue?",
        context="Apple reported Q4 2024 revenue of $89.5 billion",
        answer="Apple's Q4 revenue was $450 billion",
        confidence=0.42,
        reason="Numerical hallucination",
    )

    assert trace.timestamp == "2025-10-15T14:23:00Z"
    assert trace.confidence == 0.42
    assert trace.reason == "Numerical hallucination"


def test_fixture_has_consistent_counts():
    """Verify passed + failed = evaluated traces."""
    fixture_path = Path(__file__).parent / "fixtures" / "sample_report.json"
    data = json.loads(fixture_path.read_text())

    perf = data["performance"]
    passed = perf["passed_traces"]
    failed = perf["failed_traces"]
    evaluated = perf["evaluated_traces"]

    assert passed + failed == evaluated, "Trace counts must be consistent"


def test_fixture_accuracy_matches_calculation():
    """Verify accuracy percentage matches passed/evaluated ratio."""
    fixture_path = Path(__file__).parent / "fixtures" / "sample_report.json"
    data = json.loads(fixture_path.read_text())

    perf = data["performance"]
    expected_accuracy = (perf["passed_traces"] / perf["evaluated_traces"]) * 100
    actual_accuracy = perf["accuracy_percentage"]

    assert abs(expected_accuracy - actual_accuracy) < 0.1, "Accuracy calculation mismatch"
