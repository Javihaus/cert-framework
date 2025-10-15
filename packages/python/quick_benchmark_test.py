"""Quick benchmark test to validate embeddings work correctly."""

from cert.embeddings import EmbeddingComparator

print("Loading embedding model (this may take a minute on first run)...")
comparator = EmbeddingComparator(threshold=0.75)
print("Model loaded successfully!")

# Test a few example comparisons
test_cases = [
    ("The cat sat on the mat", "A cat is sitting on a rug", True),
    ("Apple reported revenue growth", "Apple's sales increased", True),
    ("The weather is sunny", "It's raining heavily", False),
    ("Machine learning model", "Deep learning algorithm", True),
    ("$391 billion", "$391B", True),  # Should work with embeddings
]

print("\nRunning quick validation tests...")
print("="*60)

correct = 0
total = len(test_cases)

for s1, s2, expected_match in test_cases:
    result = comparator.compare(s1, s2)
    match = result.matched
    confidence = result.confidence

    status = "✓" if match == expected_match else "✗"
    print(f"\n{status} Expected: {expected_match}, Got: {match} (confidence: {confidence:.3f})")
    print(f"   '{s1}' vs '{s2}'")

    if match == expected_match:
        correct += 1

print("\n" + "="*60)
print(f"Quick validation: {correct}/{total} correct ({correct/total*100:.1f}%)")

if correct == total:
    print("\n✓ All quick tests passed! Embeddings are working correctly.")
    print("\nNext: Run full STS-Benchmark validation with:")
    print("  python3 tests/test_benchmark_validation.py")
else:
    print(f"\n⚠ {total - correct} tests failed. Check threshold settings.")
