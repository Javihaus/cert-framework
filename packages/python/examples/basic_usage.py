"""Basic CERT usage examples.

This shows three patterns of increasing complexity:
1. Simple boolean check
2. Batch processing with results
3. Custom threshold tuning
"""

from cert import compare

# ============================================================================
# Example 1: Simple Comparison
# ============================================================================
print("=" * 60)
print("Example 1: Simple Comparison")
print("=" * 60)

result = compare("revenue increased", "sales grew")
print(f"Match: {result.matched}")
print(f"Confidence: {result.confidence:.1%}")
print(f"Result: {result}")  # Uses __str__ method
print()

# Boolean usage
if compare("revenue increased", "sales grew"):
    print("✓ These mean the same thing!")
print()


# ============================================================================
# Example 2: Batch Checking
# ============================================================================
print("=" * 60)
print("Example 2: Batch Processing")
print("=" * 60)

pairs = [
    ("revenue up", "sales increased"),
    ("profit declined", "loss reported"),
    ("EBITDA", "earnings before interest, taxes, depreciation, and amortization"),
    ("YoY growth", "year-over-year increase"),
    ("market cap", "market capitalization"),
]

for text1, text2 in pairs:
    result = compare(text1, text2)
    status = "✓" if result else "✗"
    print(f"{status} '{text1}' ↔ '{text2}' ({result.confidence:.1%})")
print()


# ============================================================================
# Example 3: Custom Threshold
# ============================================================================
print("=" * 60)
print("Example 3: Custom Threshold")
print("=" * 60)

# Default threshold (0.80)
result1 = compare("good product", "great item")
print(f"Default (0.80): {result1.matched} ({result1.confidence:.1%})")

# Stricter threshold
result2 = compare("good product", "great item", threshold=0.90)
print(f"Strict (0.90): {result2.matched} ({result2.confidence:.1%})")

# More lenient threshold
result3 = compare("good product", "great item", threshold=0.70)
print(f"Lenient (0.70): {result3.matched} ({result3.confidence:.1%})")
print()


# ============================================================================
# Example 4: Configure Once, Use Many Times
# ============================================================================
print("=" * 60)
print("Example 4: Global Configuration")
print("=" * 60)

# Configure once at startup (optional)
# configure(model_name="sentence-transformers/all-mpnet-base-v2", threshold=0.85)

# Then all compare() calls use these settings
results = [
    compare("fast response", "quick reply"),
    compare("high quality", "excellent"),
    compare("reduced latency", "faster performance"),
]

print("Using global configuration:")
for i, result in enumerate(results, 1):
    print(f"  {i}. {result}")
print()


# ============================================================================
# Example 5: Domain-Specific Testing
# ============================================================================
print("=" * 60)
print("Example 5: Domain-Specific Examples")
print("=" * 60)

# Financial domain
financial_pairs = [
    ("Q3 revenue", "third quarter sales"),
    ("operating margin", "EBIT margin"),
    ("CapEx", "capital expenditure"),
]

print("Financial terminology:")
for text1, text2 in financial_pairs:
    result = compare(text1, text2)
    print(f"  {text1} ≈ {text2}: {result.matched} ({result.confidence:.1%})")
print()

# Medical domain
medical_pairs = [
    ("MI", "myocardial infarction"),
    ("HTN", "hypertension"),
    ("SOB", "shortness of breath"),
]

print("Medical terminology:")
for text1, text2 in medical_pairs:
    result = compare(text1, text2)
    print(f"  {text1} ≈ {text2}: {result.matched} ({result.confidence:.1%})")
print()


# ============================================================================
# Summary
# ============================================================================
print("=" * 60)
print("Summary")
print("=" * 60)
print("""
Three usage patterns:

1. Simple:
   if compare(text1, text2):
       print("Match!")

2. Detailed:
   result = compare(text1, text2)
   print(f"Confidence: {result.confidence:.1%}")

3. Custom:
   result = compare(text1, text2, threshold=0.90)

Default model: all-mpnet-base-v2 (85%+ accuracy on STS-Benchmark)
Default threshold: 0.80 (87.6% accuracy, balanced precision/recall)

First call downloads model (~420MB), subsequent calls are fast (~50-100ms).
""")
