"""Smoke tests to verify basic package structure and imports work.

These tests ensure the three-capability structure is correctly set up
and all core modules can be imported.
"""

import pytest


class TestPackageStructure:
    """Test that the package structure is correct."""

    def test_import_main_package(self):
        """Test that cert package can be imported."""
        import cert

        assert hasattr(cert, "__version__")

    def test_import_utilities(self):
        """Test that utilities module exports are available."""
        from cert import compare, configure, TestRunner, ComparisonResult

        assert callable(compare)
        assert callable(configure)
        assert TestRunner is not None
        assert ComparisonResult is not None

    def test_import_single_model(self):
        """Test that single_model module exports are available."""
        from cert import measure_consistency, IntelligentComparator

        assert callable(measure_consistency)
        assert IntelligentComparator is not None

    def test_import_rag(self):
        """Test that RAG module exports are available."""
        from cert import (
            InputType,
            DetectionResult,
            SemanticComparator,
            EmbeddingComparator,
        )

        assert InputType is not None
        assert DetectionResult is not None
        assert SemanticComparator is not None
        assert EmbeddingComparator is not None

    def test_three_capability_subpackages(self):
        """Test that all three capability subpackages exist."""
        import cert.single_model
        import cert.rag
        import cert.agents

        assert cert.single_model is not None
        assert cert.rag is not None
        assert cert.agents is not None


class TestBasicFunctionality:
    """Test basic functionality works."""

    def test_compare_function_exists(self):
        """Test that compare function is callable."""
        from cert import compare

        assert callable(compare)

    def test_comparison_result_type(self):
        """Test ComparisonResult type exists."""
        from cert.utilities.types import ComparisonResult

        # Create a result
        result = ComparisonResult(
            matched=True, rule="test", confidence=0.9, explanation="test"
        )

        assert result.matched is True
        assert result.confidence == 0.9

    def test_intelligent_comparator_instantiation(self):
        """Test IntelligentComparator can be instantiated."""
        from cert import IntelligentComparator

        comparator = IntelligentComparator()
        assert comparator is not None


class TestAgentsModule:
    """Test agents module structure."""

    def test_agents_providers_exist(self):
        """Test that provider classes can be imported."""
        from cert.agents.providers import (
            AnthropicProvider,
            OpenAIProvider,
            GoogleProvider,
            XAIProvider,
        )

        assert AnthropicProvider is not None
        assert OpenAIProvider is not None
        assert GoogleProvider is not None
        assert XAIProvider is not None

    def test_agents_config_exists(self):
        """Test that AssessmentConfig can be imported."""
        from cert.agents import AssessmentConfig

        assert AssessmentConfig is not None

    def test_agents_engine_exists(self):
        """Test that CERTAgentEngine can be imported."""
        from cert.agents import CERTAgentEngine

        assert CERTAgentEngine is not None
