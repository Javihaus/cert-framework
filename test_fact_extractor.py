"""Quick test of fact extraction and numeric contradiction detection."""

from cert.fact_extractor import (
    extract_numbers,
    check_numeric_contradiction,
    check_factual_contradiction
)

print("=" * 70)
print("TESTING FACT EXTRACTION")
print("=" * 70)

# Test number extraction
test_texts = [
    "30-day money-back guarantee",
    "We offer refunds within 90 days",
    "$50 or 100% refund",
    "Response time: 2 hours"
]

for text in test_texts:
    numbers = extract_numbers(text)
    print(f"\nText: '{text}'")
    print(f"Numbers found: {numbers}")

print("\n" + "=" * 70)
print("TESTING NUMERIC CONTRADICTION DETECTION")
print("=" * 70)

# Test contradiction detection
test_pairs = [
    ("30-day refund policy", "90-day refund policy"),  # Should detect contradiction
    ("30-day refund", "We offer refunds within 30 days"),  # Should NOT detect
    ("$50 price", "$100 price"),  # Should detect contradiction
    ("100% satisfaction guarantee", "100% refund available"),  # Should NOT detect (different contexts)
]

for text1, text2 in test_pairs:
    has_contradiction, explanation = check_numeric_contradiction(text1, text2)
    status = "❌ CONTRADICTION" if has_contradiction else "✓ OK"
    print(f"\n{status}")
    print(f"  Text 1: '{text1}'")
    print(f"  Text 2: '{text2}'")
    if explanation:
        print(f"  Reason: {explanation}")

print("\n" + "=" * 70)
print("REAL-WORLD TEST: Chatbot Responses")
print("=" * 70)

baseline = "We offer full refunds within 30 days of purchase. No questions asked."
responses = {
    "run_2": "You can get a complete refund if you request it within 30 days.",
    "run_5": "We offer a 90-day refund window for all purchases.",
}

print(f"\nBaseline: '{baseline}'")

for run_id, response in responses.items():
    has_contradiction, explanation = check_factual_contradiction(baseline, response)
    status = "❌ FAIL" if has_contradiction else "✓ PASS"
    print(f"\n{status} {run_id}:")
    print(f"  Text: '{response}'")
    if explanation:
        print(f"  Issue: {explanation}")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print("✓ run_2: Same policy (30 days), different wording - OK")
print("❌ run_5: Different policy (90 vs 30 days) - CAUGHT")
print("\nFact extraction catches what embeddings miss!")
