"""Test that all core modules can be imported.

These are the most basic tests - they just verify the package structure
is correct and imports don't fail.
"""


def test_import_cert():
    """Test main cert package imports."""
    import cert
    assert cert.__version__ is not None


def test_import_utilities():
    """Test utilities module imports."""
    from cert.utilities import compare, TestRunner, ComparisonResult
    assert compare is not None
    assert TestRunner is not None
    assert ComparisonResult is not None


def test_import_single_model():
    """Test single_model module imports."""
    from cert.single_model import measure_consistency, IntelligentComparator
    assert measure_consistency is not None
    assert IntelligentComparator is not None


def test_import_rag():
    """Test RAG module imports."""
    from cert.rag import EmbeddingComparator, SemanticComparator
    assert EmbeddingComparator is not None
    assert SemanticComparator is not None


def test_import_agents():
    """Test agents module imports."""
    from cert.agents import AssessmentConfig, CERTAgentEngine
    assert AssessmentConfig is not None
    assert CERTAgentEngine is not None


def test_import_agents_providers():
    """Test agents providers import."""
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
