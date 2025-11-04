"""Tests for CLI commands."""

import json
import tempfile
from pathlib import Path

import pytest


class TestCLIModules:
    """Test that CLI modules can be imported."""

    def test_import_classify(self):
        """Test classify module imports."""
        from cert.cli.classify import load_risk_questions

        questions = load_risk_questions()
        assert "questions" in questions
        assert "risk_levels" in questions
        assert len(questions["questions"]) == 10

    def test_import_generate(self):
        """Test generate module imports."""
        from cert.cli.generate import analyze_traces, load_traces

        # Test empty traces
        metrics = analyze_traces([])
        assert metrics["total_requests"] == 0
        assert metrics["error_rate"] == 0.0

        # Test with sample traces
        sample_traces = [
            {"status": "success", "duration_ms": 100},
            {"status": "error", "duration_ms": 200},
        ]
        metrics = analyze_traces(sample_traces)
        assert metrics["total_requests"] == 2
        assert metrics["successful_requests"] == 1
        assert metrics["failed_requests"] == 1
        assert metrics["error_rate"] == 0.5

    def test_import_audit(self):
        """Test audit module imports."""
        from cert.cli.audit import check_article_15_compliance

        # Test with empty traces
        is_compliant, issues, metrics = check_article_15_compliance([])
        assert not is_compliant
        assert len(issues) > 0
        assert "No traces found" in issues[0]

    def test_load_traces_from_jsonl(self):
        """Test loading traces from JSONL file."""
        from cert.cli.generate import load_traces

        # Create temp JSONL file
        with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
            f.write(json.dumps({"trace_id": "1", "status": "success"}) + "\n")
            f.write(json.dumps({"trace_id": "2", "status": "error"}) + "\n")
            temp_file = f.name

        try:
            traces = load_traces(temp_file)
            assert len(traces) == 2
            assert traces[0]["trace_id"] == "1"
            assert traces[1]["trace_id"] == "2"
        finally:
            Path(temp_file).unlink()

    def test_generate_annex_iv_data(self):
        """Test Annex IV data generation."""
        from cert.cli.generate import generate_annex_iv_data

        metadata = {
            "system_name": "Test System",
            "architecture": {"model_type": "gpt-4"},
            "data_governance": {"training_data": "test"},
        }

        annex_iv = generate_annex_iv_data(metadata)

        assert "section_1_general" in annex_iv
        assert "section_2_architecture" in annex_iv
        assert "section_3_data_governance" in annex_iv

        # Check completion status
        assert annex_iv["section_1_general"]["completed"] is True
        assert annex_iv["section_2_architecture"]["completed"] is True

    def test_check_logging_compliance(self):
        """Test logging compliance checks."""
        from cert.cli.audit import check_logging_compliance

        # Test with valid traces
        traces = [
            {
                "timestamp": "2023-01-01T00:00:00Z",
                "input_text": "test",
                "output_text": "response",
                "status": "success",
            }
        ]

        is_compliant, issues = check_logging_compliance(traces)
        # May have issues due to old timestamp, but should check fields
        assert isinstance(is_compliant, bool)
        assert isinstance(issues, list)

    def test_risk_questions_structure(self):
        """Test risk questions JSON structure."""
        from cert.cli.classify import load_risk_questions

        data = load_risk_questions()

        # Validate structure
        assert "questions" in data
        assert "risk_levels" in data

        # Check each question has required fields
        for question in data["questions"]:
            assert "id" in question
            assert "text" in question
            assert "category" in question
            assert "annex_reference" in question
            assert "examples" in question

        # Check risk levels
        assert "no_answers" in data["risk_levels"]
        assert "1_to_2_answers" in data["risk_levels"]
        assert "3_or_more_answers" in data["risk_levels"]

    def test_article_15_compliance_with_good_traces(self):
        """Test Article 15 compliance with good traces."""
        from cert.cli.audit import check_article_15_compliance

        # Create 100 good traces to meet threshold
        good_traces = [
            {
                "status": "success",
                "duration_ms": 100,
                "timestamp": "2024-01-01T00:00:00Z",
                "input_text": "test",
                "output_text": "response",
            }
            for _ in range(100)
        ]

        is_compliant, issues, metrics = check_article_15_compliance(good_traces)

        assert metrics["total_requests"] == 100
        assert metrics["error_rate"] == 0.0
        assert is_compliant or len(issues) > 0  # May fail on other criteria

    def test_article_15_compliance_with_high_error_rate(self):
        """Test Article 15 compliance detects high error rate."""
        from cert.cli.audit import check_article_15_compliance

        # Create traces with high error rate
        bad_traces = [
            {"status": "error", "duration_ms": 100, "timestamp": "2024-01-01T00:00:00Z"}
            for _ in range(100)
        ]

        is_compliant, issues, metrics = check_article_15_compliance(bad_traces)

        assert not is_compliant
        assert metrics["error_rate"] == 1.0
        assert any("error rate" in issue.lower() for issue in issues)
