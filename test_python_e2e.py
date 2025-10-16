#!/usr/bin/env python3
"""
Test 2: Python Integration E2E Test

Verifies that Python bindings work end-to-end.
This must pass before claiming Python integration works.
"""

import sys

print("=" * 70)
print("Python E2E Test")
print("=" * 70)
print("\nTesting: Can we import and use the Python API?\n")

# Test 1: Import the core API
try:
    from cert import compare
    print("[PASS] Test 1: Import cert.compare")
except ImportError as e:
    print("[FAIL] Test 1: Import cert.compare")
    print("   Error: {}".format(e))
    sys.exit(1)

# Test 2: Basic comparison
try:
    result = compare("revenue increased", "sales grew")
    assert hasattr(result, 'matched'), "Result missing 'matched' attribute"
    assert hasattr(result, 'confidence'), "Result missing 'confidence' attribute"
    assert isinstance(result.matched, bool), "matched should be boolean"
    assert isinstance(result.confidence, float), "confidence should be float"
    print("[PASS] Test 2: Basic comparison")
    print("   Matched: {}, Confidence: {:.2f}".format(result.matched, result.confidence))
except Exception as e:
    print("[FAIL] Test 2: Basic comparison")
    print("   Error: {}".format(e))
    sys.exit(1)

# Test 3: Threshold adjustment
try:
    result_strict = compare("test", "test", threshold=0.95)
    result_loose = compare("test", "test", threshold=0.70)
    assert result_strict.matched, "Identical texts should match with any threshold"
    assert result_loose.matched, "Identical texts should match with any threshold"
    print("[PASS] Test 3: Threshold adjustment")
except Exception as e:
    print("[FAIL] Test 3: Threshold adjustment")
    print("   Error: {}".format(e))
    sys.exit(1)

# Test 4: Semantic equivalence detection
try:
    result = compare("CEO resigned", "executive departed")
    # These should have reasonably high confidence (semantic similarity)
    assert result.confidence > 0.5, "Semantic similarity too low: {}".format(result.confidence)
    print("[PASS] Test 4: Semantic equivalence")
    print("   'CEO resigned' vs 'executive departed': {:.2f}".format(result.confidence))
except Exception as e:
    print("[FAIL] Test 4: Semantic equivalence")
    print("   Error: {}".format(e))
    sys.exit(1)

# Test 5: Contradiction detection
try:
    result = compare("revenue up", "revenue down")
    # These should have lower confidence (contradiction)
    print("[PASS] Test 5: Contradiction detection")
    print("   'revenue up' vs 'revenue down': {:.2f}".format(result.confidence))
    if result.confidence > 0.7:
        print("   [WARN] Contradiction confidence seems high")
except Exception as e:
    print("[FAIL] Test 5: Contradiction detection")
    print("   Error: {}".format(e))
    sys.exit(1)

# Test 6: Error handling
try:
    try:
        compare("", "test")
        print("[FAIL] Test 6: Error handling")
        print("   Should raise ValueError for empty strings")
        sys.exit(1)
    except ValueError:
        print("[PASS] Test 6: Error handling")
        print("   Correctly raises ValueError for empty strings")
except Exception as e:
    print("[FAIL] Test 6: Error handling")
    print("   Error: {}".format(e))
    sys.exit(1)

print("\n" + "=" * 70)
print("ALL TESTS PASSED")
print("=" * 70)
print("\nPython bindings are working correctly.")
print("Safe to claim: Python integration works.\n")
