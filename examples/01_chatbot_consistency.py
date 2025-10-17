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

"""
Threshold tuning:
- 0.75 (default): Allows stylistic variation, focuses on factual consistency
- 0.80: Stricter tone matching, may flag legitimate paraphrases
- 0.85+: Very strict, only for testing with controlled templates

The numeric-contradiction detection catches factual errors regardless of threshold.
"""

def test_response_consistency(responses: dict, threshold: float = 0.75, verbose: bool = True):
    """Test that all responses are semantically equivalent.

    Args:
        responses: Dict of response_id -> response_text
        threshold: Similarity threshold for equivalence
        verbose: Show all comparisons, not just failures

    Returns:
        Tuple of (all_results, inconsistencies)
    """
    baseline = list(responses.values())[0]
    baseline_id = list(responses.keys())[0]
    all_results = []
    inconsistencies = []

    if verbose:
        print(f"Baseline ({baseline_id}):")
        print(f"  '{baseline}'\n")
        print("Comparisons:")
        print("-" * 70)

    for run_id, response in list(responses.items())[1:]:
        result = compare(baseline, response, threshold=threshold)

        result_data = {
            "run": run_id,
            "response": response,
            "confidence": result.confidence,
            "matched": result.matched,
            "rule": getattr(result, 'rule', 'embedding-similarity')
        }
        all_results.append(result_data)

        if not result.matched:
            inconsistencies.append(result_data)

        if verbose:
            status = "✓ PASS" if result.matched else "✗ FAIL"
            print(f"{run_id}: {status}")
            print(f"  Confidence: {result.confidence:.1%} (threshold: {threshold:.0%})")
            print(f"  Text: '{response}'")
            if hasattr(result, 'rule'):
                print(f"  Rule: {result.rule}")
            print()

    return all_results, inconsistencies


if __name__ == "__main__":
    print("=" * 70)
    print("CHATBOT CONSISTENCY TEST")
    print("=" * 70)
    print(f"\nQuestion: 'What's your refund policy?'")
    print(f"Testing {len(responses)} responses for consistency\n")
    print("Loading semantic model (one-time, ~5 seconds)...")
    print()

    all_results, issues = test_response_consistency(responses)

    print("=" * 70)
    print(f"RESULTS: {len(responses) - 1 - len(issues)}/{len(responses) - 1} passed")
    print("=" * 70)

    if not issues:
        print("\n✓ All responses are consistent")
    else:
        print(f"\n✗ Found {len(issues)} inconsistent response(s):")
        for issue in issues:
            print(f"\n  {issue['run']}:")
            print(f"    Text: '{issue['response']}'")
            print(f"    Confidence: {issue['confidence']:.1%}")
            print(f"    → FAILED: Below threshold or contradicts baseline")

    print("\n" + "=" * 70)
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
