"""
Human-readable explanations for measurement failures.

Converts numeric scores into actionable natural language explanations for:
- Compliance officers
- Business stakeholders
- Technical teams debugging issues

Every failed measurement gets:
- Clear reason for failure
- Supporting evidence
- Severity assessment
- Actionable recommendation
"""

from dataclasses import dataclass
from typing import List


@dataclass
class FailureExplanation:
    """Human-readable explanation of measurement failure."""

    reason: str
    evidence: List[str]
    severity: str  # 'high', 'medium', 'low'
    recommendation: str

    def to_text(self) -> str:
        """Format as readable text."""
        text = f"Failure Reason: {self.reason}\n"
        text += f"Severity: {self.severity.upper()}\n\n"
        text += "Evidence:\n"
        for item in self.evidence:
            text += f"  - {item}\n"
        text += f"\nRecommendation: {self.recommendation}"
        return text

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "reason": self.reason,
            "evidence": self.evidence,
            "severity": self.severity,
            "recommendation": self.recommendation,
        }


def explain_measurement_failure(measurement_result, text1: str, text2: str) -> FailureExplanation:
    """
    Generate explanation for why measurement failed.

    Analyzes measurement components to identify specific issues:
    - Low semantic similarity → Off-topic response
    - NLI contradiction → Factually incorrect
    - Ungrounded terms → Hallucination

    Args:
        measurement_result: Result from measure() call
        text1: The evaluated text (model output)
        text2: The reference text (context/ground truth)

    Returns:
        FailureExplanation with reason, evidence, recommendations

    Example:
        >>> from cert import measure
        >>> from cert.compliance.explanations import explain_measurement_failure
        >>>
        >>> result = measure(
        ...     text1="The company has 10,000 employees",
        ...     text2="Company size is confidential"
        ... )
        >>>
        >>> if not result.matched:
        ...     explanation = explain_measurement_failure(result, text1, text2)
        ...     print(explanation.to_text())
    """
    evidence = []

    # Check semantic similarity
    if (
        hasattr(measurement_result, "semantic_score")
        and measurement_result.semantic_score is not None
    ):
        if measurement_result.semantic_score < 0.7:
            evidence.append(
                f"Semantic similarity is low ({measurement_result.semantic_score:.2f}). "
                f"The response discusses different topics than the source material."
            )

    # Check NLI contradictions
    if hasattr(measurement_result, "nli_label") and measurement_result.nli_label == "contradiction":
        nli_score = getattr(measurement_result, "nli_score", 0.0)
        evidence.append(
            f"Natural Language Inference detected contradiction (confidence: "
            f"{nli_score:.2f}). The response makes claims that contradict the source."
        )

    # Check grounding
    ungrounded_terms = getattr(measurement_result, "ungrounded_terms", [])
    if ungrounded_terms:
        terms = ", ".join(f"'{term}'" for term in ungrounded_terms[:5])
        if len(ungrounded_terms) > 5:
            terms += f" (and {len(ungrounded_terms) - 5} more)"
        evidence.append(
            f"Response contains ungrounded terms not found in source: {terms}. "
            f"This indicates potential hallucination."
        )

    # Check grounding score
    if (
        hasattr(measurement_result, "grounding_score")
        and measurement_result.grounding_score is not None
    ):
        if measurement_result.grounding_score < 0.7:
            evidence.append(
                f"Grounding score is low ({measurement_result.grounding_score:.2f}). "
                f"Response includes claims not supported by the source."
            )

    # If no specific evidence found, provide generic explanation
    if not evidence:
        confidence = getattr(measurement_result, "confidence", 0.0)
        evidence.append(
            f"Overall confidence score is below threshold ({confidence:.2f}). "
            f"The response does not sufficiently align with the source material."
        )

    # Determine severity based on evidence
    severity = _assess_severity(evidence, measurement_result)

    # Generate recommendation
    recommendation = _generate_recommendation(evidence, measurement_result)

    # Main failure reason
    reason = "Response does not accurately reflect source material"
    if any("contradiction" in e.lower() for e in evidence):
        reason = "Response contradicts source material"
    elif any("hallucination" in e.lower() for e in evidence):
        reason = "Response contains hallucinated information"
    elif any("off-topic" in e.lower() or "different topics" in e.lower() for e in evidence):
        reason = "Response is off-topic"

    return FailureExplanation(
        reason=reason,
        evidence=evidence,
        severity=severity,
        recommendation=recommendation,
    )


def _assess_severity(evidence: List[str], measurement_result) -> str:
    """
    Assess failure severity.

    High severity:
    - Contradictions (factually wrong)
    - Multiple failure types
    - Very low scores

    Medium severity:
    - Hallucinations without contradiction
    - Single failure type
    - Moderately low scores

    Low severity:
    - Only semantic mismatch
    - Scores close to threshold
    """
    # Check for contradictions (always high severity)
    if any("contradiction" in e.lower() for e in evidence):
        return "high"

    # Multiple types of evidence = higher severity
    if len(evidence) >= 2:
        return "high"

    # Check confidence score
    confidence = getattr(measurement_result, "confidence", 0.0)
    if confidence < 0.5:
        return "high"
    elif confidence < 0.65:
        return "medium"
    else:
        return "low"


def _generate_recommendation(evidence: List[str], measurement_result) -> str:
    """
    Generate actionable recommendation based on evidence.

    Prioritizes recommendations by severity:
    1. Contradiction → Review source material
    2. Hallucination → Verify ungrounded claims
    3. Low semantic similarity → Improve relevance
    4. Low grounding → Add more context
    """
    # Check for contradiction
    if any("contradiction" in e.lower() for e in evidence):
        return "Review source material. Response contradicts known facts and must be corrected."

    # Check for hallucination
    if any("hallucination" in e.lower() or "ungrounded" in e.lower() for e in evidence):
        return (
            "Verify ungrounded terms against source. May indicate hallucination or missing context."
        )

    # Check for semantic issues
    if any("semantic" in e.lower() or "different topics" in e.lower() for e in evidence):
        return "Improve semantic alignment. Response should focus on topics present in source material."

    # Check for grounding issues
    if any("grounding" in e.lower() for e in evidence):
        return "Add more context to source material or constrain response to only use provided information."

    # Generic recommendation
    return "Review response against source material and improve accuracy."
