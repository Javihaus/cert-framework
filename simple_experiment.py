#!/usr/bin/env python3
"""
Simple direct experiment - run actual tests and report real results.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from cert.intelligent_comparator import IntelligentComparator
    from cert.detectors import detect_input_type

    print("✓ Imports successful")
except Exception as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

# Statistics
stats = {"total": 0, "passed": 0, "failed": 0, "by_type": {}, "failures": []}


def test_comparison(expected, actual, category):
    """Run a single comparison and record result."""
    comparator = IntelligentComparator()
    result = comparator.compare(expected, actual)
    detection = detect_input_type(expected, actual)

    stats["total"] += 1
    stats["by_type"][detection.type.value] = (
        stats["by_type"].get(detection.type.value, 0) + 1
    )

    if result.matched:
        stats["passed"] += 1
        status = "✓"
    else:
        stats["failed"] += 1
        status = "✗"
        stats["failures"].append(
            {
                "category": category,
                "expected": expected,
                "actual": actual,
                "type": detection.type.value,
                "rule": result.rule,
                "confidence": result.confidence,
            }
        )

    print(
        f"  {status} '{actual[:50]}' -> rule:{result.rule}, conf:{result.confidence:.2f}"
    )
    return result.matched


print("\n" + "=" * 70)
print("RUNNING ACTUAL EXPERIMENTS")
print("=" * 70)

# NUMERICAL TESTS
print("\n1. NUMERICAL TESTS")
print("-" * 70)

print("\nTest: $391.035 billion in different formats")
test_comparison("$391.035 billion", "$391.035 billion", "numerical")
test_comparison("$391.035 billion", "391B", "numerical")
test_comparison("$391.035 billion", "$391,035 million", "numerical")
test_comparison("$391.035 billion", "391 billion dollars", "numerical")

print("\nTest: iPhone revenue")
test_comparison("$201.183 billion", "201B", "numerical")
test_comparison("$201.183 billion", "$201,183 million", "numerical")

print("\nTest: Percentage")
test_comparison("46.2%", "46.2%", "numerical")
test_comparison("46.2%", "46.2 percent", "numerical")

# TEXT TESTS
print("\n2. TEXT TESTS")
print("-" * 70)

print("\nTest: CEO name")
test_comparison("Tim Cook", "Tim Cook", "text")
test_comparison("Tim Cook", "tim cook", "text")
test_comparison("Tim Cook", "TIM COOK", "text")

print("\nTest: Location")
test_comparison("Cupertino, California", "Cupertino, California", "text")
test_comparison("Cupertino, California", "Cupertino, CA", "text")
test_comparison("Cupertino, California", "Located in Cupertino, California", "text")

# SEMANTIC TESTS
print("\n3. SEMANTIC EQUIVALENCE TESTS")
print("-" * 70)

print("\nTest: Business description")
test_comparison(
    "designs, manufactures, and markets smartphones",
    "creates and sells phones",
    "semantic",
)
test_comparison(
    "designs, manufactures, and markets smartphones", "produces smartphones", "semantic"
)

print("\nTest: Market position")
test_comparison("leading technology company", "top tech company", "semantic")
test_comparison("leading technology company", "premier technology firm", "semantic")

print("\nTest: Revenue trends")
test_comparison("revenue increased", "sales grew", "semantic")
test_comparison("revenue increased", "higher revenue", "semantic")
test_comparison("revenue increased", "increased sales", "semantic")

# EDGE CASES
print("\n4. EDGE CASES")
print("-" * 70)

print("\nTest: Complex statement")
test_comparison(
    "Net income was $93.736 billion",
    "Apple's net income for fiscal 2024 was $93.736 billion",
    "edge",
)

print("\nTest: Abbreviation")
test_comparison("R&D", "research and development", "edge")

# PRINT RESULTS
print("\n" + "=" * 70)
print("ACTUAL RESULTS")
print("=" * 70)

print("\n📊 OVERALL:")
print(f"  Total tests: {stats['total']}")
print(f"  Passed: {stats['passed']} ({stats['passed'] / stats['total'] * 100:.1f}%)")
print(f"  Failed: {stats['failed']} ({stats['failed'] / stats['total'] * 100:.1f}%)")

print("\n🎯 BY INPUT TYPE:")
for input_type, count in sorted(stats["by_type"].items()):
    pct = count / stats["total"] * 100
    print(f"  {input_type}: {count} tests ({pct:.1f}%)")

print(f"\n❌ FAILURES ({len(stats['failures'])} total):")
if stats["failures"]:
    for i, failure in enumerate(stats["failures"], 1):
        print(f"\n  {i}. [{failure['category']}] {failure['type']}")
        print(f"     Expected: '{failure['expected'][:60]}'")
        print(f"     Actual: '{failure['actual'][:60]}'")
        print(f"     Rule: {failure['rule']}, Confidence: {failure['confidence']:.2f}")
else:
    print("  None!")

# RECOMMENDATIONS
print("\n" + "=" * 70)
print("RECOMMENDATIONS BASED ON ACTUAL RESULTS")
print("=" * 70)

semantic_failures = [f for f in stats["failures"] if f["category"] == "semantic"]
numerical_failures = [f for f in stats["failures"] if f["category"] == "numerical"]

print(f"\nSemantic failures: {len(semantic_failures)}")
print(f"Numerical failures: {len(numerical_failures)}")

if len(semantic_failures) < 10:
    print("\n✅ VERDICT: Training NOT justified")
    print(f"   Only {len(semantic_failures)} semantic failures")
    print(f"   Use manual equivalents: ~{len(semantic_failures) * 2} minutes work")
else:
    print("\n⚠️  VERDICT: Consider training")
    print(f"   {len(semantic_failures)} semantic failures found")
    print("   Patterns may justify training pipeline")

print("\n" + "=" * 70)
