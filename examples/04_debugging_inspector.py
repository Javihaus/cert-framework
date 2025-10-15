"""
Example 4: Debugging with Inspector

Shows how to understand and debug comparison results.
Use when: comparisons fail unexpectedly, tuning thresholds, building trust.

This example demonstrates manual inspection. For a visual inspector tool,
see: https://github.com/Javihaus/cert-framework#inspector
"""

from cert import compare


def inspect_comparison(text1: str, text2: str, expected: bool):
    """Run comparison and show detailed analysis.

    Args:
        text1: First text
        text2: Second text
        expected: What you expected the result to be
    """
    result = compare(text1, text2)

    # Determine if result matches expectations
    status = "✓" if result.matched == expected else "✗"

    print(f"{status} Comparison:")
    print(f"  Text 1: '{text1}'")
    print(f"  Text 2: '{text2}'")
    print(f"  Matched: {result.matched} (expected: {expected})")
    print(f"  Confidence: {result.confidence:.3f}")
    print(f"  Threshold: 0.80")

    # Explain the result
    if result.matched and expected:
        print(f"  ✓ CORRECT: Confidence {result.confidence:.3f} > threshold 0.80")
    elif not result.matched and not expected:
        print(f"  ✓ CORRECT: Confidence {result.confidence:.3f} < threshold 0.80")
    elif result.matched and not expected:
        print(f"  ✗ FALSE POSITIVE: Matched but shouldn't have")
        print(f"    → Consider raising threshold to 0.85-0.90")
    else:
        print(f"  ✗ FALSE NEGATIVE: Didn't match but should have")
        print(f"    → Consider lowering threshold to 0.70-0.75")

    print()


if __name__ == "__main__":
    print("=" * 70)
    print("DEBUGGING COMPARISON RESULTS")
    print("=" * 70)
    print()

    # Test cases with expected outcomes
    test_cases = [
        ("revenue increased", "sales grew", True),
        ("revenue up", "revenue down", False),
        ("CEO resigned", "executive departed", True),
        ("profit rose", "profit fell", False),
        # Edge cases
        ("Q3 revenue", "third quarter sales", True),
        ("net income", "gross profit", False),
    ]

    print("Running test cases:\n")
    for text1, text2, expected in test_cases:
        inspect_comparison(text1, text2, expected)

    print("=" * 70)
    print("COMMON DEBUGGING SCENARIOS")
    print("=" * 70)
    print()

    print("Scenario 1: Too many false positives")
    print("  Problem: Unrelated texts are matching")
    print("  Solution: Increase threshold (try 0.85 or 0.90)")
    print("  Example:")
    result = compare("good product", "bad service", threshold=0.80)
    print(f"    Default (0.80): {result.matched} ({result.confidence:.2f})")
    result = compare("good product", "bad service", threshold=0.85)
    print(f"    Higher (0.85): {result.matched} ({result.confidence:.2f})")
    print()

    print("Scenario 2: Too many false negatives")
    print("  Problem: Similar texts aren't matching")
    print("  Solution: Decrease threshold (try 0.70 or 0.75)")
    print("  Example:")
    result = compare("CEO quits", "executive leaves", threshold=0.80)
    print(f"    Default (0.80): {result.matched} ({result.confidence:.2f})")
    result = compare("CEO quits", "executive leaves", threshold=0.70)
    print(f"    Lower (0.70): {result.matched} ({result.confidence:.2f})")
    print()

    print("Scenario 3: Domain-specific terms fail")
    print("  Problem: Acronyms/jargon don't match their expansions")
    print("  Examples that work well with default model:")
    examples = [
        (
            "EBITDA",
            "earnings before interest, taxes, depreciation, and amortization",
        ),
        ("P/E ratio", "price to earnings ratio"),
        ("myocardial infarction", "heart attack"),
    ]
    for text1, text2 in examples:
        result = compare(text1, text2)
        symbol = "✓" if result.matched else "✗"
        print(f"    {symbol} '{text1}' vs '{text2}': {result.confidence:.2f}")

    print()
    print("  Note: Default model handles common domain terminology well")
    print("  For specialized jargon, consider fine-tuning on domain data")
