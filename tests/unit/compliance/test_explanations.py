"""Tests for compliance explanations module."""

from cert.compliance.explanations import (
    FailureExplanation,
    explain_measurement_failure,
)


class MockMeasurementResult:
    """Mock measurement result for testing."""

    def __init__(
        self,
        confidence=0.5,
        semantic_score=0.5,
        nli_score=0.5,
        nli_label="entailment",
        grounding_score=0.5,
        ungrounded_terms=None,
    ):
        self.confidence = confidence
        self.semantic_score = semantic_score
        self.nli_score = nli_score
        self.nli_label = nli_label
        self.grounding_score = grounding_score
        self.ungrounded_terms = ungrounded_terms or []


def test_failure_explanation_dataclass():
    """Test FailureExplanation dataclass."""
    explanation = FailureExplanation(
        reason="Test reason",
        evidence=["Evidence 1", "Evidence 2"],
        severity="high",
        recommendation="Test recommendation",
    )

    assert explanation.reason == "Test reason"
    assert len(explanation.evidence) == 2
    assert explanation.severity == "high"
    assert explanation.recommendation == "Test recommendation"


def test_failure_explanation_to_text():
    """Test FailureExplanation text formatting."""
    explanation = FailureExplanation(
        reason="Response contradicts source",
        evidence=["NLI detected contradiction", "Low grounding score"],
        severity="high",
        recommendation="Review source material",
    )

    text = explanation.to_text()

    assert "Failure Reason: Response contradicts source" in text
    assert "Severity: HIGH" in text
    assert "Evidence:" in text
    assert "NLI detected contradiction" in text
    assert "Low grounding score" in text
    assert "Recommendation: Review source material" in text


def test_failure_explanation_to_dict():
    """Test FailureExplanation dict serialization."""
    explanation = FailureExplanation(
        reason="Test reason",
        evidence=["Evidence 1"],
        severity="medium",
        recommendation="Test recommendation",
    )

    result = explanation.to_dict()

    assert result["reason"] == "Test reason"
    assert result["evidence"] == ["Evidence 1"]
    assert result["severity"] == "medium"
    assert result["recommendation"] == "Test recommendation"


def test_explain_low_semantic_score():
    """Test explanation for low semantic similarity."""
    result = MockMeasurementResult(semantic_score=0.3, confidence=0.4)

    explanation = explain_measurement_failure(result, "answer", "context")

    assert any("semantic" in e.lower() for e in explanation.evidence)
    assert any("different topics" in e.lower() for e in explanation.evidence)


def test_explain_nli_contradiction():
    """Test explanation for NLI contradiction."""
    result = MockMeasurementResult(
        nli_label="contradiction", nli_score=0.8, confidence=0.4
    )

    explanation = explain_measurement_failure(result, "answer", "context")

    assert explanation.reason == "Response contradicts source material"
    assert explanation.severity == "high"
    assert any("contradiction" in e.lower() for e in explanation.evidence)
    assert "review source material" in explanation.recommendation.lower()


def test_explain_ungrounded_terms():
    """Test explanation for ungrounded terms."""
    result = MockMeasurementResult(
        ungrounded_terms=["term1", "term2", "term3"], confidence=0.6
    )

    explanation = explain_measurement_failure(result, "answer", "context")

    assert explanation.reason == "Response contains hallucinated information"
    assert any("ungrounded terms" in e.lower() for e in explanation.evidence)
    assert any("hallucination" in e.lower() for e in explanation.evidence)
    assert "verify ungrounded terms" in explanation.recommendation.lower()


def test_explain_low_grounding_score():
    """Test explanation for low grounding score."""
    result = MockMeasurementResult(grounding_score=0.3, confidence=0.5)

    explanation = explain_measurement_failure(result, "answer", "context")

    assert any("grounding score is low" in e.lower() for e in explanation.evidence)


def test_explain_multiple_failures():
    """Test explanation with multiple failure types."""
    result = MockMeasurementResult(
        semantic_score=0.3,
        nli_label="contradiction",
        nli_score=0.9,
        grounding_score=0.2,
        ungrounded_terms=["term1", "term2"],
        confidence=0.3,
    )

    explanation = explain_measurement_failure(result, "answer", "context")

    # Should have multiple pieces of evidence
    assert len(explanation.evidence) >= 2
    # Contradictions are high severity
    assert explanation.severity == "high"
    # Should prioritize contradiction in recommendation
    assert "review source material" in explanation.recommendation.lower()


def test_severity_assessment_high():
    """Test high severity assessment."""
    # Contradiction should be high severity
    result = MockMeasurementResult(nli_label="contradiction", nli_score=0.9)

    explanation = explain_measurement_failure(result, "answer", "context")

    assert explanation.severity == "high"


def test_severity_assessment_medium():
    """Test medium severity assessment."""
    # Single failure type with moderate confidence
    result = MockMeasurementResult(semantic_score=0.4, confidence=0.6)

    explanation = explain_measurement_failure(result, "answer", "context")

    assert explanation.severity in ["medium", "low"]


def test_severity_assessment_low():
    """Test low severity assessment."""
    # Close to threshold
    result = MockMeasurementResult(semantic_score=0.65, confidence=0.68)

    explanation = explain_measurement_failure(result, "answer", "context")

    assert explanation.severity == "low"


def test_explain_generic_failure():
    """Test explanation when no specific evidence found."""
    # Result with no obvious failures but low confidence
    result = MockMeasurementResult(
        semantic_score=0.8,
        nli_score=0.8,
        grounding_score=0.8,
        nli_label="entailment",
        confidence=0.5,
    )

    explanation = explain_measurement_failure(result, "answer", "context")

    # Should still provide explanation
    assert len(explanation.evidence) > 0
    assert "confidence" in explanation.evidence[0].lower()
    assert explanation.recommendation is not None


def test_ungrounded_terms_truncation():
    """Test that long lists of ungrounded terms are truncated in evidence."""
    # Create many ungrounded terms
    many_terms = [f"term{i}" for i in range(10)]
    result = MockMeasurementResult(ungrounded_terms=many_terms, confidence=0.6)

    explanation = explain_measurement_failure(result, "answer", "context")

    # Should mention truncation
    evidence_text = " ".join(explanation.evidence)
    assert "more" in evidence_text or len(many_terms) <= 5


def test_recommendation_priority_contradiction():
    """Test that contradiction gets highest priority recommendation."""
    result = MockMeasurementResult(
        semantic_score=0.3,  # Also low semantic
        nli_label="contradiction",  # But contradiction is priority
        nli_score=0.9,
        confidence=0.3,
    )

    explanation = explain_measurement_failure(result, "answer", "context")

    # Should recommend reviewing source material (contradiction priority)
    assert "review source material" in explanation.recommendation.lower()


def test_recommendation_priority_hallucination():
    """Test hallucination recommendation when no contradiction."""
    result = MockMeasurementResult(ungrounded_terms=["term1", "term2"], confidence=0.6)

    explanation = explain_measurement_failure(result, "answer", "context")

    # Should recommend verifying ungrounded terms
    assert "verify ungrounded terms" in explanation.recommendation.lower()


def test_recommendation_priority_semantic():
    """Test semantic recommendation when no other issues."""
    result = MockMeasurementResult(semantic_score=0.3, confidence=0.5)

    explanation = explain_measurement_failure(result, "answer", "context")

    # Should recommend improving semantic alignment
    assert (
        "semantic alignment" in explanation.recommendation.lower()
        or "focus on topics" in explanation.recommendation.lower()
    )


def test_off_topic_detection():
    """Test off-topic response detection."""
    result = MockMeasurementResult(semantic_score=0.2, confidence=0.4)

    explanation = explain_measurement_failure(result, "answer", "context")

    assert explanation.reason == "Response is off-topic"
    assert any("different topics" in e.lower() for e in explanation.evidence)
