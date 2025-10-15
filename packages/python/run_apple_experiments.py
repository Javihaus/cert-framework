#!/usr/bin/env python3
"""
Run Apple 10-K experiments and generate analysis report.
"""

import os
import sys
import json
from collections import defaultdict

# Enable routing logging
os.environ['CERT_LOG_ROUTING'] = '1'

# Import after setting env var
from cert import IntelligentComparator, GroundTruth

# Statistics collector
stats = {
    'total_comparisons': 0,
    'by_detection_type': defaultdict(int),
    'by_rule': defaultdict(int),
    'matched': 0,
    'failed': 0,
    'failures_by_type': defaultdict(list),
}


def log_comparison(detection_type, rule, matched, confidence, expected, actual):
    """Log a comparison for statistics."""
    stats['total_comparisons'] += 1
    stats['by_detection_type'][detection_type] += 1
    stats['by_rule'][rule] += 1

    if matched:
        stats['matched'] += 1
    else:
        stats['failed'] += 1
        stats['failures_by_type'][detection_type].append({
            'expected': expected,
            'actual': actual,
            'rule': rule,
            'confidence': confidence
        })


def test_numerical_comparisons():
    """Test numerical data extraction scenarios."""
    print("\n" + "="*70)
    print("NUMERICAL TESTS - Financial Data Extraction")
    print("="*70)

    comparator = IntelligentComparator()

    test_cases = [
        # (expected, actual_outputs, description)
        ("$391.035 billion", [
            "$391.035 billion",
            "391B",
            "$391,035 million",
            "391 billion dollars",
            "$391,035,000,000",
        ], "Total Revenue FY2024"),

        ("$201.183 billion", [
            "201B",
            "$201,183 million",
            "201.183 billion",
        ], "iPhone Revenue FY2024"),

        ("$96.169 billion", [
            "96.169 billion",
            "$96,169 million",
            "96B",
            "$96.169B",
        ], "Services Revenue FY2024"),

        ("46.2%", [
            "46.2%",
            "46.2 percent",
        ], "Gross Margin Percentage"),

        ("$31.370 billion", [
            "31.370 billion",
            "$31,370 million",
            "31.37B",
        ], "R&D Expenses"),
    ]

    for expected, outputs, description in test_cases:
        print(f"\n{description}")
        print(f"  Expected: {expected}")

        passed = 0
        failed = 0

        for output in outputs:
            result = comparator.compare(expected, output)

            # Manually log since we're bypassing the auto-logger
            from cert.detectors import detect_input_type
            detection = detect_input_type(expected, output)
            log_comparison(
                detection.type.value,
                result.rule,
                result.matched,
                result.confidence,
                expected,
                output
            )

            if result.matched:
                passed += 1
                print(f"    ✓ '{output}' (rule: {result.rule}, confidence: {result.confidence:.2f})")
            else:
                failed += 1
                print(f"    ✗ '{output}' (rule: {result.rule}, confidence: {result.confidence:.2f})")

        print(f"  Result: {passed}/{len(outputs)} passed")


def test_text_comparisons():
    """Test text-based comparisons."""
    print("\n" + "="*70)
    print("TEXT TESTS - String Matching")
    print("="*70)

    comparator = IntelligentComparator()

    test_cases = [
        ("Tim Cook", [
            "Tim Cook",
            "tim cook",
            "TIM COOK",
        ], "CEO Name"),

        ("Cupertino, California", [
            "Cupertino, California",
            "Cupertino, CA",
            "Located in Cupertino, California",
            "The company is headquartered in Cupertino, California",
        ], "Headquarters Location"),

        ("September 28, 2024", [
            "September 28, 2024",
            "2024-09-28",
            "Sept 28, 2024",
            "The fiscal year ended on September 28, 2024",
        ], "Fiscal Year End"),
    ]

    for expected, outputs, description in test_cases:
        print(f"\n{description}")
        print(f"  Expected: {expected}")

        passed = 0
        failed = 0

        for output in outputs:
            result = comparator.compare(expected, output)

            from cert.detectors import detect_input_type
            detection = detect_input_type(expected, output)
            log_comparison(
                detection.type.value,
                result.rule,
                result.matched,
                result.confidence,
                expected,
                output
            )

            if result.matched:
                passed += 1
                print(f"    ✓ '{output}' (rule: {result.rule})")
            else:
                failed += 1
                print(f"    ✗ '{output}' (rule: {result.rule}, confidence: {result.confidence:.2f})")

        print(f"  Result: {passed}/{len(outputs)} passed")


def test_semantic_equivalence():
    """Test semantic equivalence cases."""
    print("\n" + "="*70)
    print("SEMANTIC EQUIVALENCE TESTS - Training Need Assessment")
    print("="*70)

    comparator = IntelligentComparator()

    test_cases = [
        ("designs, manufactures, and markets smartphones, computers, tablets, wearables, and accessories", [
            "creates and sells phones, computers, tablets, wearables, and accessories",
            "produces smartphones, PCs, tablets, wearable devices, and accessories",
            "designs and markets mobile devices, computers, tablets, wearables, and related products",
        ], "Business Description"),

        ("leading technology company", [
            "top tech company",
            "premier technology firm",
            "major player in technology sector",
        ], "Market Position"),

        ("revenue increased", [
            "sales grew",
            "higher revenue",
            "revenue went up",
            "increased sales",
        ], "Revenue Growth"),
    ]

    semantic_failures = []

    for expected, outputs, description in test_cases:
        print(f"\n{description}")
        print(f"  Expected: {expected}")

        passed = 0
        failed = 0

        for output in outputs:
            result = comparator.compare(expected, output)

            from cert.detectors import detect_input_type
            detection = detect_input_type(expected, output)
            log_comparison(
                detection.type.value,
                result.rule,
                result.matched,
                result.confidence,
                expected,
                output
            )

            if result.matched:
                passed += 1
                print(f"    ✓ '{output}' (rule: {result.rule}, conf: {result.confidence:.2f})")
            else:
                failed += 1
                semantic_failures.append({
                    'category': description,
                    'expected': expected,
                    'actual': output,
                    'rule': result.rule,
                    'confidence': result.confidence
                })
                print(f"    ✗ '{output}' (rule: {result.rule}, conf: {result.confidence:.2f})")

        print(f"  Result: {passed}/{len(outputs)} passed")

    return semantic_failures


def test_edge_cases():
    """Test edge cases and complex scenarios."""
    print("\n" + "="*70)
    print("EDGE CASES - Complex Scenarios")
    print("="*70)

    comparator = IntelligentComparator()

    test_cases = [
        (
            "Net income was $93.736 billion",
            "According to the consolidated statements, Apple's net income for fiscal 2024 was $93.736 billion",
            "Complex financial statement"
        ),
        (
            "Revenue increased from $383.285 billion in 2023 to $391.035 billion in 2024",
            "Revenue grew 2% from $383.285B (2023) to $391.035B (2024)",
            "Year-over-year comparison"
        ),
        (
            "R&D",
            "research and development",
            "Abbreviation expansion"
        ),
    ]

    for expected, actual, description in test_cases:
        print(f"\n{description}")
        print(f"  Expected: {expected}")
        print(f"  Actual: {actual}")

        result = comparator.compare(expected, actual)

        from cert.detectors import detect_input_type
        detection = detect_input_type(expected, actual)
        log_comparison(
            detection.type.value,
            result.rule,
            result.matched,
            result.confidence,
            expected,
            actual
        )

        if result.matched:
            print(f"  ✓ MATCHED (rule: {result.rule}, confidence: {result.confidence:.2f})")
        else:
            print(f"  ✗ FAILED (rule: {result.rule}, confidence: {result.confidence:.2f})")


def print_statistics():
    """Print comprehensive statistics report."""
    print("\n" + "="*70)
    print("COMPREHENSIVE ANALYSIS REPORT")
    print("="*70)

    print(f"\n📊 OVERALL STATISTICS")
    print(f"  Total comparisons: {stats['total_comparisons']}")
    print(f"  Matched: {stats['matched']} ({stats['matched']/max(stats['total_comparisons'],1)*100:.1f}%)")
    print(f"  Failed: {stats['failed']} ({stats['failed']/max(stats['total_comparisons'],1)*100:.1f}%)")

    print(f"\n🎯 ROUTING BY INPUT TYPE")
    for detection_type, count in sorted(stats['by_detection_type'].items(), key=lambda x: x[1], reverse=True):
        pct = count / max(stats['total_comparisons'], 1) * 100
        print(f"  {detection_type}: {count} ({pct:.1f}%)")

    print(f"\n📝 RULES USED")
    for rule, count in sorted(stats['by_rule'].items(), key=lambda x: x[1], reverse=True):
        pct = count / max(stats['total_comparisons'], 1) * 100
        print(f"  {rule}: {count} ({pct:.1f}%)")

    print(f"\n❌ FAILURES BY TYPE")
    if stats['failed'] == 0:
        print("  No failures!")
    else:
        for detection_type, failures in stats['failures_by_type'].items():
            print(f"\n  {detection_type} ({len(failures)} failures):")
            for i, failure in enumerate(failures[:3], 1):  # Show first 3
                print(f"    {i}. Expected: '{failure['expected'][:60]}...'")
                print(f"       Actual: '{failure['actual'][:60]}...'")
                print(f"       Rule: {failure['rule']}, Confidence: {failure['confidence']:.2f}")


def print_recommendations(semantic_failures):
    """Print actionable recommendations."""
    print("\n" + "="*70)
    print("RECOMMENDATIONS")
    print("="*70)

    # Analyze failure patterns
    numerical_failures = len(stats['failures_by_type'].get('numerical', []))
    text_failures = len(stats['failures_by_type'].get('general_text', []))
    num_semantic_failures = len(semantic_failures)

    print(f"\n📋 FAILURE ANALYSIS:")
    print(f"  Numerical failures: {numerical_failures}")
    print(f"  Text/semantic failures: {text_failures}")
    print(f"  Semantic equivalence failures: {num_semantic_failures}")

    print(f"\n💡 RECOMMENDED ACTIONS:\n")

    if numerical_failures > 0:
        print("  ⚠️  NUMERICAL ISSUES DETECTED")
        print("     → Review and improve number normalization rules")
        print("     → Check patterns in failures (units? formats?)")
        print("     → Quick fix: 1-2 hours to improve rules\n")

    if num_semantic_failures < 10:
        print("  ✅ SEMANTIC FAILURES ARE MANAGEABLE")
        print(f"     → Only {num_semantic_failures} semantic equivalence failures found")
        print("     → RECOMMENDATION: Use manual equivalents lists")
        print("     → Time: 2 minutes per case = " + f"{num_semantic_failures * 2} minutes total")
        print("     → Example:")
        print("       GroundTruth(")
        print("         expected='revenue increased',")
        print("         equivalents=['sales grew', 'higher revenue', 'revenue went up']")
        print("       )\n")
    elif num_semantic_failures < 20:
        print("  ⚠️  MODERATE SEMANTIC FAILURES")
        print(f"     → {num_semantic_failures} semantic equivalence failures found")
        print("     → RECOMMENDATION: Start with manual equivalents")
        print("     → If patterns emerge after 20+ cases, consider training")
        print("     → Time: Manual = ~40 min, Training = 6-10 hours\n")
    else:
        print("  🚨 HIGH SEMANTIC FAILURE RATE")
        print(f"     → {num_semantic_failures} semantic equivalence failures found")
        print("     → RECOMMENDATION: Build annotation + training pipeline")
        print("     → Clear patterns justify the investment")
        print("     → Time: 6-10 hours for full training pipeline")
        print("     → Expected improvement: 15-20% better semantic matching\n")

    print("  📈 OVERALL ASSESSMENT:")
    success_rate = stats['matched'] / max(stats['total_comparisons'], 1) * 100

    if success_rate >= 90:
        print(f"     ✅ Excellent: {success_rate:.1f}% success rate")
        print("     → Intelligent routing is working well")
        print("     → Focus on fixing remaining edge cases manually")
    elif success_rate >= 75:
        print(f"     ⚠️  Good: {success_rate:.1f}% success rate")
        print("     → Some improvements needed")
        print("     → Review failure patterns to prioritize fixes")
    else:
        print(f"     🚨 Needs work: {success_rate:.1f}% success rate")
        print("     → Significant issues to address")
        print("     → Consider rule improvements before training")


def main():
    """Run all experiments and generate report."""
    print("\n" + "="*70)
    print("APPLE 10-K INTELLIGENT ROUTING EXPERIMENT")
    print("="*70)
    print("\nTesting intelligent routing with real financial data extraction...")

    # Run all test categories
    test_numerical_comparisons()
    test_text_comparisons()
    semantic_failures = test_semantic_equivalence()
    test_edge_cases()

    # Print comprehensive report
    print_statistics()
    print_recommendations(semantic_failures)

    print("\n" + "="*70)
    print("EXPERIMENT COMPLETE")
    print("="*70)
    print("\nNext steps:")
    print("  1. Review the recommendations above")
    print("  2. Implement the suggested quick fixes")
    print("  3. Re-run to validate improvements")
    print("  4. Only build training if 20+ semantic failures persist\n")


if __name__ == "__main__":
    main()
