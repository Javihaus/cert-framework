#!/usr/bin/env python3
"""Quick test to verify NLI state mutation fix."""

import logging
import sys

# Enable debug logging to see the detailed NLI logs
logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s:%(name)s:%(message)s"
)

sys.path.insert(0, "/Users/javiermarin/cert-framework/packages/python")

from cert import measure

# Test with 3 simple cases
test_cases = [
    ("Apple revenue was $394B", "Apple made approximately $394 billion"),  # Should match
    ("Revenue was $394B", "Revenue was $500B"),  # Should NOT match (contradiction)
    ("The study included 500 participants", "The research had 500 people"),  # Should match
]

print("\n" + "=" * 60)
print("Testing NLI with new raw model implementation")
print("=" * 60)

results = []
for i, (context, answer) in enumerate(test_cases, 1):
    print(f"\n{'='*60}")
    print(f"Test {i}/{len(test_cases)}")
    print(f"{'='*60}")
    print(f"Context: {context}")
    print(f"Answer: {answer}")

    try:
        result = measure(
            context,
            answer,
            use_semantic=False,
            use_nli=True,
            use_grounding=False
        )

        results.append({
            "context": context,
            "answer": answer,
            "nli_score": result.nli_score,
            "matched": result.matched,
            "confidence": result.confidence
        })

        print(f"\nResult:")
        print(f"  NLI Score: {result.nli_score:.3f}")
        print(f"  Confidence: {result.confidence:.3f}")
        print(f"  Matched: {result.matched}")

    except Exception as e:
        print(f"\nERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Check if scores vary (not all the same)
print(f"\n{'='*60}")
print("Summary:")
print(f"{'='*60}")

nli_scores = [r["nli_score"] for r in results]
print(f"\nNLI Scores: {[f'{s:.3f}' for s in nli_scores]}")
print(f"Min: {min(nli_scores):.3f}, Max: {max(nli_scores):.3f}, Range: {max(nli_scores) - min(nli_scores):.3f}")

if max(nli_scores) - min(nli_scores) < 0.01:
    print("\n⚠️  WARNING: All scores are nearly identical!")
    print("   This suggests state mutation bug is still present.")
    sys.exit(1)
else:
    print("\n✅ SUCCESS: Scores vary - NLI is working correctly!")
    sys.exit(0)
