"""Test basic functionality works.

These tests verify that core functionality actually works,
not just that imports succeed.
"""

import pytest


class TestComparisonResult:
    """Test ComparisonResult type."""

    def test_create_comparison_result(self):
        """Test that ComparisonResult can be instantiated."""
        from cert.utilities.types import ComparisonResult

        result = ComparisonResult(
            matched=True,
            rule="test-rule",
            confidence=0.95,
            explanation="test explanation"
        )

        assert result.matched is True
        assert result.rule == "test-rule"
        assert result.confidence == 0.95
        assert result.explanation == "test explanation"

    def test_comparison_result_bool(self):
        """Test ComparisonResult boolean evaluation."""
        from cert.utilities.types import ComparisonResult

        result_match = ComparisonResult(
            matched=True, rule="test", confidence=0.9
        )
        result_no_match = ComparisonResult(
            matched=False, rule="test", confidence=0.3
        )

        assert bool(result_match) is True
        assert bool(result_no_match) is False


class TestSemanticComparator:
    """Test SemanticComparator basic functionality."""

    def test_instantiate_semantic_comparator(self):
        """Test SemanticComparator can be created."""
        from cert.rag import SemanticComparator

        comparator = SemanticComparator()
        assert comparator is not None

    def test_semantic_compare_identical(self):
        """Test comparing identical strings."""
        from cert.rag import SemanticComparator

        comparator = SemanticComparator()
        result = comparator.compare("hello", "hello")

        assert result is not None
        assert result.matched is True
        assert result.confidence >= 0.9


class TestIntelligentComparator:
    """Test IntelligentComparator basic functionality."""

    def test_instantiate_intelligent_comparator(self):
        """Test IntelligentComparator can be created."""
        from cert.single_model import IntelligentComparator

        comparator = IntelligentComparator()
        assert comparator is not None

    def test_intelligent_compare_identical(self):
        """Test comparing identical strings."""
        from cert.single_model import IntelligentComparator

        comparator = IntelligentComparator()
        result = comparator.compare("test", "test")

        assert result is not None
        assert result.matched is True


class TestAssessmentConfig:
    """Test AssessmentConfig."""

    def test_create_default_config(self):
        """Test creating default AssessmentConfig."""
        from cert.agents import AssessmentConfig

        config = AssessmentConfig()
        assert config.consistency_trials == 20
        assert config.performance_trials == 15
        assert config.temperature == 0.7

    def test_create_custom_config(self):
        """Test creating custom AssessmentConfig."""
        from cert.agents import AssessmentConfig

        config = AssessmentConfig(
            consistency_trials=10,
            temperature=0.5,
            providers={"anthropic": ["claude-3-5-haiku-20241022"]}
        )

        assert config.consistency_trials == 10
        assert config.temperature == 0.5
        assert "anthropic" in config.providers
