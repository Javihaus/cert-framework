"""Unit tests for simplified cert.measure.measure module."""

import pytest

from cert.measure.measure import BatchOptions, measure, measure_batch, measure_detailed

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


class TestMeasureValidation:
    """Test input validation for simplified API."""

    def test_empty_text1_raises_error(self):
        """Empty text1 should raise ValueError."""
        with pytest.raises(ValueError, match="non-empty"):
            measure(text1="", text2="test")

    def test_empty_text2_raises_error(self):
        """Empty text2 should raise ValueError."""
        with pytest.raises(ValueError, match="non-empty"):
            measure(text1="test", text2="")

    def test_none_text1_raises_error(self):
        """None text1 should raise TypeError."""
        with pytest.raises(TypeError):
            measure(text1=None, text2="test")

    def test_none_text2_raises_error(self):
        """None text2 should raise TypeError."""
        with pytest.raises(TypeError):
            measure(text1="test", text2=None)


class TestMeasureBasicFunctionality:
    """Test basic measurement functionality with simplified API."""

    @skip_without_models
    def test_measure_returns_float(self):
        """measure() should return a float between 0 and 1."""
        score = measure(text1="test", text2="test")

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0

    @skip_without_models
    def test_identical_texts_have_high_confidence(self):
        """Identical texts should produce high confidence score."""
        score = measure(text1="The revenue was $450 million", text2="The revenue was $450 million")

        assert score > 0.9

    @skip_without_models
    def test_very_different_texts_have_low_confidence(self):
        """Very different texts should have low confidence."""
        score = measure(text1="The sky is blue", text2="Revenue was $450 million")

        assert score < 0.5


class TestMeasureDetailed:
    """Test measure_detailed() which returns full breakdown."""

    @skip_without_models
    def test_measure_detailed_returns_result_object(self):
        """measure_detailed() should return MeasurementResult."""
        result = measure_detailed(text1="test", text2="test")

        assert hasattr(result, "confidence")
        assert hasattr(result, "semantic_score")
        assert hasattr(result, "grounding_score")

    @skip_without_models
    def test_measurement_result_has_is_accurate_method(self):
        """MeasurementResult should have is_accurate() method."""
        result = measure_detailed(text1="test", text2="test")

        assert hasattr(result, "is_accurate")
        assert callable(result.is_accurate)

    @skip_without_models
    def test_measurement_result_scores_in_range(self):
        """All scores should be between 0 and 1."""
        result = measure_detailed(text1="test", text2="test")

        assert 0.0 <= result.confidence <= 1.0
        assert 0.0 <= result.semantic_score <= 1.0
        assert 0.0 <= result.grounding_score <= 1.0


class TestMeasureBatch:
    """Test measure_batch() for processing multiple pairs."""

    @skip_without_models
    def test_measure_batch_returns_list(self):
        """measure_batch() should return list of scores."""
        pairs = [("text1", "text1"), ("text2", "text2")]
        scores = measure_batch(pairs)

        assert isinstance(scores, list)
        assert len(scores) == 2
        assert all(isinstance(s, float) for s in scores)

    @skip_without_models
    def test_measure_batch_empty_list(self):
        """measure_batch() with empty list should return empty list."""
        scores = measure_batch([])

        assert scores == []

    def test_measure_batch_skips_empty_pairs(self):
        """measure_batch() should skip pairs with empty strings."""
        pairs = [("test", "test"), ("", "test"), ("test", "")]
        options = BatchOptions(stop_on_error=False)

        # Should not raise, just skip empty pairs
        scores = measure_batch(pairs, options)

        # Should only get scores for valid pairs (may be 0 or 1 depending on implementation)
        assert isinstance(scores, list)

    def test_measure_batch_with_options(self):
        """measure_batch() should accept BatchOptions."""
        pairs = [("test", "test")]
        options = BatchOptions(batch_size=10, show_progress=False)

        # Should not raise
        scores = measure_batch(pairs, options)
        assert len(scores) == 1
