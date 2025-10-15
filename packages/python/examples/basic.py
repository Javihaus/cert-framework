"""Basic CERT usage examples."""

from cert import compare

# ============================================================================
# Example 1: Simple Comparison
# ============================================================================
print("=" * 60)
print("Example 1: Simple Comparison")
print("=" * 60)

result = compare("revenue increased", "sales grew")
print(f"Match: {result.matched}, Confidence: {result.confidence:.1%}")
print()

# Boolean usage
if compare("revenue increased", "sales grew"):
    print("✓ These mean the same thing!")
print()


# ============================================================================
# Example 2: Batch Processing
# ============================================================================
print("=" * 60)
print("Example 2: Batch Processing")
print("=" * 60)

pairs = [
    ("net income rose", "profit increased"),
    ("revenue up", "revenue down"),
    ("CEO resigned", "executive departed"),
    ("Q3 earnings", "third quarter profits"),
    ("YoY growth", "year-over-year increase"),
]

for text1, text2 in pairs:
    result = compare(text1, text2)
    symbol = "✓" if result else "✗"
    print(f"{symbol} '{text1}' ↔ '{text2}' ({result.confidence:.0%})")
print()


# ============================================================================
# Example 3: Custom Thresholds
# ============================================================================
print("=" * 60)
print("Example 3: Custom Thresholds")
print("=" * 60)

text1, text2 = "good quality", "great product"

# Default threshold (0.80)
result_default = compare(text1, text2)
print(f"Default (0.80): {result_default.matched} ({result_default.confidence:.1%})")

# Stricter threshold
result_strict = compare(text1, text2, threshold=0.95)
print(f"Strict (0.95):  {result_strict.matched} ({result_strict.confidence:.1%})")

# More lenient threshold
result_loose = compare(text1, text2, threshold=0.50)
print(f"Lenient (0.50): {result_loose.matched} ({result_loose.confidence:.1%})")
print()


# ============================================================================
# Example 4: Error Handling
# ============================================================================
print("=" * 60)
print("Example 4: Error Handling")
print("=" * 60)

# Empty text
try:
    compare("", "some text")
except ValueError as e:
    print(f"✓ Caught error: {e}")

# Wrong type
try:
    compare(123, "text")
except TypeError as e:
    print(f"✓ Caught error: {e}")

# Invalid threshold
try:
    compare("text1", "text2", threshold=1.5)
except ValueError as e:
    print(f"✓ Caught error: {e}")

print()


# ============================================================================
# Summary
# ============================================================================
print("=" * 60)
print("Summary")
print("=" * 60)
print(
    """
Three usage patterns:

1. Simple:
   result = compare(text1, text2)
   print(result.matched)

2. As boolean:
   if compare(text1, text2):
       print("Match!")

3. Custom threshold:
   result = compare(text1, text2, threshold=0.90)

Default model: all-mpnet-base-v2 (87.6% accuracy on STS-Benchmark)
Default threshold: 0.80 (balanced precision/recall)
"""
)
