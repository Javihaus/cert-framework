"""Advanced CERT usage with custom configuration."""

from cert import EmbeddingComparator, configure

# ============================================================================
# Example 1: Using a Different Model
# ============================================================================
print("=" * 60)
print("Example 1: Different Model")
print("=" * 60)

# Use a faster but less accurate model
comparator = EmbeddingComparator(
    model_name="sentence-transformers/all-MiniLM-L6-v2",  # Faster, less accurate
    threshold=0.75,
)

result = comparator.compare(
    "The quarterly earnings exceeded expectations", "Q3 profits beat forecasts"
)

print(f"Result: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Rule: {result.rule}")
print()


# ============================================================================
# Example 2: Global Configuration
# ============================================================================
print("=" * 60)
print("Example 2: Global Configuration")
print("=" * 60)

# Configure once at application startup
configure(model_name="sentence-transformers/all-mpnet-base-v2", threshold=0.85)

# Then all compare() calls use these settings
from cert import compare

results = [
    compare("fast response", "quick reply"),
    compare("high quality", "excellent"),
    compare("reduced latency", "faster performance"),
]

print("Using global configuration (threshold=0.85):")
for i, result in enumerate(results, 1):
    print(f"  {i}. {result}")
print()


# ============================================================================
# Example 3: Embedding Cache
# ============================================================================
print("=" * 60)
print("Example 3: Embedding Cache")
print("=" * 60)

# The comparator caches embeddings for performance
comparator = EmbeddingComparator(cache_size=1000)

# First comparison computes embeddings
result1 = comparator.compare("revenue increased", "sales grew")
print(f"First call:  {result1.matched} (computed embeddings)")

# Second comparison with same texts uses cache
result2 = comparator.compare("revenue increased", "sales grew")
print(f"Second call: {result2.matched} (used cache)")

# Cache size
print(f"Cache entries: {len(comparator.cache)}")
print()


# ============================================================================
# Example 4: Accessing Detailed Results
# ============================================================================
print("=" * 60)
print("Example 4: Detailed Results")
print("=" * 60)

result = comparator.compare("The company's revenue increased", "Sales grew")

print(f"Matched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Rule used: {result.rule}")
print(f"String repr: {result}")
print(f"Boolean: {bool(result)}")
print()


# ============================================================================
# Example 5: Domain-Specific Testing
# ============================================================================
print("=" * 60)
print("Example 5: Domain-Specific Examples")
print("=" * 60)

# Financial terminology
financial_pairs = [
    ("EBITDA", "earnings before interest, taxes, depreciation, and amortization"),
    ("YoY growth", "year-over-year increase"),
    ("CapEx", "capital expenditure"),
    ("ROE", "return on equity"),
]

print("Financial terminology:")
for text1, text2 in financial_pairs:
    result = comparator.compare(text1, text2)
    print(f"  {text1} ≈ {text2}: {result.matched} ({result.confidence:.1%})")
print()

# Medical terminology
medical_pairs = [
    ("STEMI", "ST-elevation myocardial infarction"),
    ("HTN", "hypertension"),
    ("MI", "myocardial infarction"),
    ("CVA", "cerebrovascular accident"),
]

print("Medical terminology:")
for text1, text2 in medical_pairs:
    result = comparator.compare(text1, text2)
    print(f"  {text1} ≈ {text2}: {result.matched} ({result.confidence:.1%})")
print()


# ============================================================================
# Example 6: Performance Comparison
# ============================================================================
print("=" * 60)
print("Example 6: Performance Comparison")
print("=" * 60)

import time

# Test with multiple comparisons
test_pairs = [
    ("revenue up", "sales increased"),
    ("profit down", "earnings declined"),
    ("CEO resigned", "executive departed"),
] * 10  # 30 comparisons

start = time.time()
for text1, text2 in test_pairs:
    comparator.compare(text1, text2)
elapsed = time.time() - start

print(f"30 comparisons: {elapsed:.2f}s")
print(f"Average per comparison: {(elapsed / 30) * 1000:.1f}ms")
print()


# ============================================================================
# Summary
# ============================================================================
print("=" * 60)
print("Advanced Usage Summary")
print("=" * 60)
print(
    """
Advanced features:

1. Custom models:
   EmbeddingComparator(model_name="all-MiniLM-L6-v2")

2. Global configuration:
   configure(model_name="...", threshold=0.85)

3. Embedding cache:
   EmbeddingComparator(cache_size=1000)

4. Detailed results:
   result.matched, result.confidence, result.rule

5. Domain-specific:
   Works well on financial, medical, legal terminology

Performance:
- First call: ~5s (model loading)
- Cached: <1ms
- Uncached: 50-100ms per comparison
"""
)
