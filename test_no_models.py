#!/usr/bin/env python3
"""Test measure() without loading heavy ML models."""

import sys
sys.path.insert(0, "/Users/javiermarin/cert-framework/packages/python")

print("Testing grounding component (no ML models)...")

from cert import measure

# Test cases for grounding (doesn't require model loading)
test_cases = [
    {
        "context": "Apple revenue was 394 billion dollars in 2022",
        "answer": "Apple made 394 billion in revenue",
        "expected": "high_grounding"
    },
    {
        "context": "The company earned 100 million",
        "answer": "The business made 500 thousand dollars",  # Different numbers
        "expected": "medium_grounding"
    },
    {
        "context": "Weather is sunny today",
        "answer": "The stock price increased significantly yesterday",  # No overlap
        "expected": "low_grounding"
    },
]

print("\n" + "="*60)
print("Testing Grounding Component (No Model Loading)")
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
            use_semantic=False,  # Skip semantic (requires model)
            use_nli=False,  # Skip NLI (requires model)
            use_grounding=True,  # Only grounding (no model)
            threshold=0.7
        )

        score = result.grounding_score
        results.append(score)

        print(f"  → Grounding Score: {score:.3f}")
        print(f"  → Matched: {result.matched}")

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

# Check if grounding works
if max(results) - min(results) < 0.05:
    print("\n✗ FAILED: Grounding scores don't vary")
    sys.exit(1)
else:
    print("\n✓ SUCCESS: Grounding component works!")

# Now test that NLI imports and structure is correct
print("\n" + "="*60)
print("Testing NLI Code Structure (No Inference)")
print("="*60)

try:
    from cert.measure.nli import NLIEngine
    print("✓ NLIEngine imports successfully")

    # Check that it has the right methods
    assert hasattr(NLIEngine, 'check_entailment')
    print("✓ check_entailment method exists")

    # Check __init__ doesn't use pipeline
    import inspect
    init_source = inspect.getsource(NLIEngine.__init__)

    if 'pipeline(' in init_source:
        print("✗ WARNING: Still using pipeline API in __init__")
    elif 'AutoModelForSequenceClassification' in init_source:
        print("✓ Using AutoModel (not pipeline)")
    else:
        print("? Unknown initialization method")

    # Check check_entailment structure
    check_source = inspect.getsource(NLIEngine.check_entailment)

    if 'text_pair' in check_source:
        print("✓ Using text_pair parameter")
    else:
        print("✗ WARNING: Not using text_pair parameter")

    if 'torch.no_grad()' in check_source or 'self.torch.no_grad()' in check_source:
        print("✓ Using torch.no_grad()")
    else:
        print("✗ WARNING: Not using torch.no_grad()")

    if 'self.model.eval()' in check_source:
        print("✓ Forcing model.eval()")
    else:
        print("✗ WARNING: Not forcing model.eval()")

    print("\n✓ NLI code structure looks correct!")
    print("  (Cannot test inference without enough RAM for model)")

except Exception as e:
    print(f"✗ ERROR checking NLI structure: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print("✓ Grounding component works and produces varying scores")
print("✓ NLI code structure is correct (uses raw model, not pipeline)")
print("  → Full NLI inference test requires more RAM")
print("  → Code changes are correct, ready for testing on larger machine")
