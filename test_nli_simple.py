#!/usr/bin/env python3
"""Minimal test to verify NLI produces varying scores."""

import sys
sys.path.insert(0, "/Users/javiermarin/cert-framework/packages/python")

print("Importing CERT...")
from cert import measure

# Three test cases with clearly different relationships
test_cases = [
    # Case 1: Entailment (should score high ~0.8-1.0)
    {
        "context": "The company revenue was 100 million dollars",
        "answer": "The company made 100 million",
        "expected": "high_score"
    },
    # Case 2: Contradiction (should score low ~0.0-0.2)
    {
        "context": "The revenue was 100 million dollars",
        "answer": "The revenue was 500 million dollars",
        "expected": "low_score"
    },
    # Case 3: Neutral (should score medium ~0.4-0.6)
    {
        "context": "The company revenue was 100 million",
        "answer": "The weather was sunny",
        "expected": "medium_score"
    },
]

print("\n" + "="*60)
print("Running NLI Tests")
print("="*60)

results = []
for i, test in enumerate(test_cases, 1):
    print(f"\nTest {i}: {test['expected']}")
    print(f"  Context: {test['context']}")
    print(f"  Answer: {test['answer']}")

    try:
        result = measure(
            test["context"],
            test["answer"],
            use_semantic=False,
            use_nli=True,
            use_grounding=False,
            threshold=0.7
        )

        score = result.nli_score
        results.append(score)

        print(f"  → NLI Score: {score:.3f}")
        print(f"  → Confidence: {result.confidence:.3f}")

    except Exception as e:
        print(f"  ✗ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Analyze results
print("\n" + "="*60)
print("Analysis")
print("="*60)

scores_str = ", ".join([f"{s:.3f}" for s in results])
print(f"\nScores: [{scores_str}]")
print(f"Min: {min(results):.3f}")
print(f"Max: {max(results):.3f}")
print(f"Range: {max(results) - min(results):.3f}")

# Check if scores vary
score_range = max(results) - min(results)

if score_range < 0.05:
    print("\n✗ FAILED: All scores are nearly identical!")
    print("  State mutation bug still present - all returning neutral.")
    sys.exit(1)
elif score_range < 0.2:
    print("\n⚠ WARNING: Scores vary slightly but not much.")
    print("  NLI may be working but with limited discrimination.")
    sys.exit(0)
else:
    print("\n✓ SUCCESS: Scores vary significantly!")
    print("  NLI is producing different predictions for different inputs.")

    # Check if scores match expectations
    entailment_score = results[0]  # Should be high
    contradiction_score = results[1]  # Should be low

    if entailment_score > 0.6 and contradiction_score < 0.4:
        print("  Scores match expected patterns (entailment high, contradiction low).")
        sys.exit(0)
    else:
        print("  Note: Scores vary but may not match semantic expectations.")
        sys.exit(0)
