"""
Unit tests for the monitoring module.
"""

import pytest
from datetime import datetime


class TestEmbeddingDriftMonitor:
    """Tests for EmbeddingDriftMonitor."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.drift import EmbeddingDriftMonitor
        assert EmbeddingDriftMonitor is not None

    def test_initialization(self):
        """Test monitor initialization."""
        from cert.monitoring.drift import EmbeddingDriftMonitor

        monitor = EmbeddingDriftMonitor(
            drift_threshold=0.3,
            warning_threshold=0.2,
            min_samples_for_detection=5,
        )

        assert monitor.drift_threshold == 0.3
        assert monitor.warning_threshold == 0.2
        assert monitor.min_samples_for_detection == 5

    def test_baseline_operations(self):
        """Test baseline add and finalize."""
        from cert.monitoring.drift import EmbeddingDriftMonitor

        monitor = EmbeddingDriftMonitor(min_samples_for_detection=3)

        # Add baseline embeddings
        for i in range(5):
            embedding = [0.1 * i, 0.2 * i, 0.3 * i]
            result = monitor.add_to_baseline(embedding=embedding)
            assert result is True

        # Finalize baseline
        result = monitor.finalize_baseline()
        assert result is True

    def test_drift_detection(self):
        """Test drift detection."""
        from cert.monitoring.drift import EmbeddingDriftMonitor, DriftSeverity

        monitor = EmbeddingDriftMonitor(
            min_samples_for_detection=3,
            drift_threshold=0.3,
        )

        # Add baseline
        for i in range(5):
            monitor.add_to_baseline(embedding=[0.1, 0.2, 0.3])
        monitor.finalize_baseline()

        # Check drift with similar embedding
        result = monitor.check_drift(embedding=[0.1, 0.2, 0.3])
        assert result.severity in [DriftSeverity.NONE, DriftSeverity.LOW]


class TestCanaryPromptMonitor:
    """Tests for CanaryPromptMonitor."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.drift import CanaryPromptMonitor
        assert CanaryPromptMonitor is not None

    def test_initialization(self):
        """Test monitor initialization with default canaries."""
        from cert.monitoring.drift import CanaryPromptMonitor

        monitor = CanaryPromptMonitor(use_default_canaries=True)
        assert len(monitor._canaries) > 0

    def test_add_canary(self):
        """Test adding custom canary."""
        from cert.monitoring.drift import CanaryPromptMonitor, CanaryPrompt, CanaryType

        monitor = CanaryPromptMonitor(use_default_canaries=False)

        canary = CanaryPrompt(
            prompt="What is 1+1?",
            canary_type=CanaryType.REASONING,
            expected_keywords=["2", "two"],
        )

        canary_id = monitor.add_canary(canary)
        assert canary_id is not None
        assert len(monitor._canaries) == 1


class TestLatencyTracker:
    """Tests for LatencyTracker."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.realtime import LatencyTracker
        assert LatencyTracker is not None

    def test_record_latency(self):
        """Test recording latency measurements."""
        from cert.monitoring.realtime import LatencyTracker

        tracker = LatencyTracker()

        measurement = tracker.record(
            endpoint="chat",
            latency_ms=150.0,
            model="gpt-4",
        )

        assert measurement.latency_ms == 150.0
        assert measurement.model == "gpt-4"

    def test_get_stats(self):
        """Test getting latency statistics."""
        from cert.monitoring.realtime import LatencyTracker

        tracker = LatencyTracker()

        # Add some measurements
        for i in range(10):
            tracker.record(
                endpoint="chat",
                latency_ms=100.0 + i * 10,
            )

        stats = tracker.get_stats()
        assert stats is not None
        assert stats.count == 10
        assert stats.min == 100.0
        assert stats.max == 190.0


class TestAnomalyDetector:
    """Tests for AnomalyDetector."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.realtime import AnomalyDetector
        assert AnomalyDetector is not None

    def test_add_metric(self):
        """Test adding metric values."""
        from cert.monitoring.realtime import AnomalyDetector

        detector = AnomalyDetector(min_samples=5)

        # Add baseline values
        for i in range(10):
            detector.add_metric("latency", 100.0)

        # Check baseline
        baseline = detector.get_baseline("latency")
        assert baseline is not None
        assert baseline["mean"] == 100.0


class TestTokenAnalytics:
    """Tests for TokenAnalytics."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.realtime import TokenAnalytics
        assert TokenAnalytics is not None

    def test_record_usage(self):
        """Test recording token usage."""
        from cert.monitoring.realtime import TokenAnalytics

        analytics = TokenAnalytics()

        usage = analytics.record(
            model="gpt-4",
            endpoint="chat",
            input_tokens=100,
            output_tokens=50,
        )

        assert usage.input_tokens == 100
        assert usage.output_tokens == 50
        assert usage.total_tokens == 150

    def test_get_summary(self):
        """Test getting usage summary."""
        from cert.monitoring.realtime import TokenAnalytics

        analytics = TokenAnalytics()

        for i in range(5):
            analytics.record(
                model="gpt-4",
                endpoint="chat",
                input_tokens=100,
                output_tokens=50,
            )

        summary = analytics.get_summary()
        assert summary is not None
        assert summary.total_requests == 5
        assert summary.total_input_tokens == 500


class TestLLMJudge:
    """Tests for LLMJudge."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.feedback import LLMJudge
        assert LLMJudge is not None

    def test_initialization(self):
        """Test judge initialization."""
        from cert.monitoring.feedback import LLMJudge

        def mock_llm(prompt):
            return '{"scores": {"accuracy": 8}, "overall_score": 8, "reasoning": "Good"}'

        judge = LLMJudge(judge_function=mock_llm)
        assert judge is not None


class TestHumanFeedbackCollector:
    """Tests for HumanFeedbackCollector."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.monitoring.feedback import HumanFeedbackCollector
        assert HumanFeedbackCollector is not None

    def test_record_thumbs(self):
        """Test recording thumbs feedback."""
        from cert.monitoring.feedback import HumanFeedbackCollector

        collector = HumanFeedbackCollector()

        feedback = collector.record_thumbs(
            request_id="req_123",
            positive=True,
            prompt="What is AI?",
            response="AI is...",
        )

        assert feedback.value is True
        assert feedback.request_id == "req_123"

    def test_get_stats(self):
        """Test getting feedback statistics."""
        from cert.monitoring.feedback import HumanFeedbackCollector

        collector = HumanFeedbackCollector()

        # Add positive feedback
        for _ in range(8):
            collector.record_thumbs("req", positive=True)

        # Add negative feedback
        for _ in range(2):
            collector.record_thumbs("req", positive=False)

        stats = collector.get_stats()
        assert stats.total_feedback == 10
        assert stats.positive_count == 8
        assert stats.negative_count == 2
