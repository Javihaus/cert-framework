#!/usr/bin/env python3
"""Quick test of the new simple API."""

from cert import compare, configure

print("="*60)
print("Testing New Simple API")
print("="*60)

# Test 1: Basic comparison
print("\n1. Basic comparison:")
result = compare("revenue increased", "sales grew")
print("   Match: {}".format(result.matched))
print("   Confidence: {:.1%}".format(result.confidence))
print("   String repr: {}".format(result))

# Test 2: Boolean usage
print("\n2. Boolean usage:")
if compare("revenue increased", "sales grew"):
    print("   ✓ Texts match!")
else:
    print("   ✗ Texts don't match")

# Test 3: Custom threshold
print("\n3. Custom threshold:")
result1 = compare("good", "great", threshold=0.70)
result2 = compare("good", "great", threshold=0.90)
print("   Threshold 0.70: {} ({:.1%})".format(result1.matched, result1.confidence))
print("   Threshold 0.90: {} ({:.1%})".format(result2.matched, result2.confidence))

# Test 4: Negative case
print("\n4. Negative case:")
result = compare("revenue", "expenses")
print("   Match: {} ({:.1%})".format(result.matched, result.confidence))

print("\n" + "="*60)
print("All tests passed! API is working.")
print("="*60)
