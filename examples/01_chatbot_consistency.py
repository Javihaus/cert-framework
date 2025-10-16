"""
Example 1: Testing Chatbot Response Consistency

Problem: LLMs are non-deterministic. Same question, different answers.
Solution: CERT validates answers are semantically equivalent.

This example uses pre-recorded responses. For live OpenAI integration,
see: examples/05_real_llm_testing.py
"""

from cert import compare

# Simulated chatbot responses (in production, these come from LLM API)
# Question: "What's your refund policy?"

responses = {
    "run_1": "We offer full refunds within 30 days of purchase. No questions asked.",
    "run_2": "You can get a complete refund if you request it within 30 days.",
    "run_3": "30-day money-back guarantee - full refund, no questions.",
    "run_4": "Refunds available up to 30 days after purchase.",  # Consistent
    "run_5": "We offer a 90-day refund window for all purchases.",  # INCONSISTENT - different policy!
}


def test_response_consistency(responses: dict, threshold: float = 0.80):
    """Test that all responses are semantically equivalent.

    Args:
        responses: Dict of response_id -> response_text
        threshold: Similarity threshold for equivalence

    Returns:
        List of inconsistent pairs
    """
    baseline = list(responses.values())[0]
    inconsistencies = []

    for run_id, response in list(responses.items())[1:]:
        result = compare(baseline, response, threshold=threshold)

        if not result.matched:
            inconsistencies.append(
                {
                    "run": run_id,
                    "response": response,
                    "confidence": result.confidence,
                }
            )

    return inconsistencies


if __name__ == "__main__":
    print("=" * 70)
    print("CHATBOT CONSISTENCY TEST")
    print("=" * 70)
    print(f"\nQuestion: 'What's your refund policy?'")
    print(f"Testing {len(responses)} responses for consistency\n")

    issues = test_response_consistency(responses)

    if not issues:
        print("✓ All responses are consistent")
    else:
        print(f"✗ Found {len(issues)} inconsistent responses:\n")

        for issue in issues:
            print(f"  {issue['run']}: '{issue['response']}'")
            print(f"  Confidence: {issue['confidence']:.0%} (below threshold)")
            print(f"  → ISSUE: This response contradicts the baseline\n")

    print("=" * 70)
    print("WHY THIS MATTERS")
    print("=" * 70)
    print("Inconsistent responses:")
    print("  - Erode user trust")
    print("  - Create legal/compliance issues")
    print("  - Indicate prompt engineering problems")
    print()
    print("Use CERT to:")
    print("  - Catch inconsistencies before production")
    print("  - Validate prompt changes don't break consistency")
    print("  - Test temperature/sampling parameter effects")
