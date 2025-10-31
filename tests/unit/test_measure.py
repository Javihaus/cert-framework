"""Unit tests for cert.measure.measure module."""

import pytest

from cert.measure.measure import measure

# Check if optional ML dependencies are available
try:
    import sentence_transformers  # noqa: F401

    HAS_MODELS = True
except ImportError:
    HAS_MODELS = False

skip_without_models = pytest.mark.skipif(
    not HAS_MODELS,
    reason="Requires sentence-transformers (install with: pip install cert-framework[evaluation])",
)


class TestMeasureDefaults:
    """Test that measure() uses correct default configuration."""

    @skip_without_models
    def test_default_uses_semantic_and_grounding_only(self):
        """Default config should use semantic + grounding, not NLI."""
        result = measure(text1="The sky is blue", text2="The sky is blue")

        # Check that correct components were used
        assert "semantic" in result.components_used
        assert "grounding" in result.components_used
        assert "nli" not in result.components_used

    @skip_without_models
    def test_default_weights_are_balanced(self):
        """Semantic and grounding should have equal weight by default."""
        result = measure(text1="Test text", text2="Test text")

        # Check weights in metadata
        weights = result.metadata["weights"]
        assert weights["semantic"] == pytest.approx(0.5)
        assert weights["grounding"] == pytest.approx(0.5)
        assert weights["nli"] == 0.0


class TestMeasureValidation:
    """Test input validation."""

    def test_empty_text1_raises_error(self):
        """Empty text1 should raise ValueError."""
        with pytest.raises(ValueError, match="non-empty"):
            measure(text1="", text2="test")

    def test_empty_text2_raises_error(self):
        """Empty text2 should raise ValueError."""
        with pytest.raises(ValueError, match="non-empty"):
            measure(text1="test", text2="")

    def test_very_long_text1_raises_error(self):
        """Text longer than MAX_LENGTH should raise ValueError."""
        long_text = "a" * 20_000
        with pytest.raises(ValueError, match="too long"):
            measure(text1=long_text, text2="test")

    def test_very_long_text2_raises_error(self):
        """Text longer than MAX_LENGTH should raise ValueError."""
        long_text = "a" * 20_000
        with pytest.raises(ValueError, match="too long"):
            measure(text1="test", text2=long_text)


class TestMeasureBasicFunctionality:
    """Test basic measurement functionality."""

    @skip_without_models
    def test_identical_texts_have_high_confidence(self):
        """Identical texts should produce high confidence score."""
        result = measure(text1="The revenue was $450 million", text2="The revenue was $450 million")

        assert result.matched is True
        assert result.confidence > 0.8

    @skip_without_models
    def test_very_different_texts_have_low_confidence(self):
        """Completely different texts should have low confidence."""
        result = measure(
            text1="The sky is blue", text2="Financial revenue increased", threshold=0.5
        )

        assert result.confidence < 0.5

    @skip_without_models
    def test_result_has_required_fields(self):
        """Result should have all expected fields."""
        result = measure(text1="test", text2="test")

        assert hasattr(result, "matched")
        assert hasattr(result, "confidence")
        assert hasattr(result, "semantic_score")
        assert hasattr(result, "nli_score")
        assert hasattr(result, "grounding_score")
        assert hasattr(result, "threshold_used")
        assert hasattr(result, "rule")
        assert hasattr(result, "components_used")


class TestMeasureComponentControl:
    """Test enabling/disabling individual components."""

    @skip_without_models
    def test_can_enable_nli_explicitly(self):
        """Should be able to enable NLI if needed."""
        result = measure(text1="test", text2="test", use_nli=True)

        assert "nli" in result.components_used
        assert result.nli_score is not None

    @skip_without_models
    def test_can_use_semantic_only(self):
        """Should be able to use just semantic similarity."""
        result = measure(text1="test", text2="test", use_semantic=True, use_grounding=False)

        assert result.components_used == ["semantic"]
        assert result.semantic_score is not None
        assert result.grounding_score is None

    def test_cannot_disable_all_components(self):
        """Should raise error if all components disabled."""
        with pytest.raises(ValueError, match="At least one component"):
            measure(
                text1="test",
                text2="test",
                use_semantic=False,
                use_nli=False,
                use_grounding=False,
            )


class TestMeasureWeightNormalization:
    """Test that weights are normalized correctly."""

    @skip_without_models
    def test_weights_sum_to_one(self):
        """Weights should always sum to 1.0 after normalization."""
        result = measure(text1="test", text2="test", semantic_weight=0.3, grounding_weight=0.7)

        weights = result.metadata["weights"]
        total = weights["semantic"] + weights["grounding"] + weights["nli"]
        assert total == pytest.approx(1.0)

    def test_zero_weight_sum_raises_error(self):
        """Should raise error if all weights are zero."""
        with pytest.raises(ValueError, match="must be > 0"):
            measure(text1="test", text2="test", semantic_weight=0.0, grounding_weight=0.0)
