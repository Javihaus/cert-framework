# -*- coding: utf-8 -*-
"""
Test NLI Model on Numeric Contradictions

This script tests whether the NLI model (microsoft/deberta-v3-base)
can detect numeric contradictions, which is critical for financial
RAG applications.

If NLI catches these reliably, we don't need regex. If it marks them
as NEUTRAL, we need a hybrid approach with numeric pre-filtering.
"""

from cert.nli import NLIDetector

def main():
    print("=" * 70)
    print("TESTING NLI MODEL ON NUMERIC CONTRADICTIONS")
    print("=" * 70)
    print()
    print("Model: microsoft/deberta-v3-base")
    print("Task: Detect whether NLI can catch numeric contradictions")
    print()

    nli = NLIDetector()
    print()

    test_cases = [
        # Numeric contradictions
        ("Revenue was $30M", "Revenue was $90M", "CONTRADICTION"),
        ("Growth rate: 15%", "Growth rate: 25%", "CONTRADICTION"),
        ("Price: $100", "Price: $200", "CONTRADICTION"),

        # Unit contradictions
        ("Revenue: $30 million", "Revenue: $30 billion", "CONTRADICTION"),
        ("Valid for 30 days", "Valid for 90 days", "CONTRADICTION"),

        # Entity contradictions
        ("Apple's revenue", "Microsoft's revenue", "CONTRADICTION"),
        ("CEO Tim Cook", "CEO Satya Nadella", "CONTRADICTION"),

        # Date contradictions
        ("2023 Q4 results", "2024 Q4 results", "CONTRADICTION"),
        ("January 2024", "December 2023", "CONTRADICTION"),

        # Semantic contradictions (should definitely catch these)
        ("Revenue increased", "Revenue decreased", "CONTRADICTION"),
        ("The product is safe", "The product is dangerous", "CONTRADICTION"),

        # Entailments (should not be contradictions)
        ("Revenue was $30M", "Revenue was thirty million dollars", "ENTAILMENT"),
        ("Growth: 15%", "Growth: fifteen percent", "ENTAILMENT"),

        # Neutral (related but not contradictory)
        ("Apple's revenue increased", "Apple's profit margin improved", "NEUTRAL"),
        ("Q4 2024 revenue", "Q4 2024 expenses", "NEUTRAL"),
    ]

    print("-" * 70)
    print("TEST RESULTS")
    print("-" * 70)
    print()

    correct = 0
    total = 0

    for text1, text2, expected_label in test_cases:
        result = nli.check_entailment(text1, text2)
        total += 1

        is_correct = result.label.upper() == expected_label
        if is_correct:
            correct += 1

        status = "✓" if is_correct else "✗"

        print(f"{status} Expected: {expected_label:15} Got: {result.label.upper():15}")
        print(f"   Context:  '{text1}'")
        print(f"   Answer:   '{text2}'")
        print(f"   Score:    {result.entailment_score:.3f}")
        print()

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print()
    print(f"Accuracy: {correct}/{total} ({100*correct/total:.1f}%)")
    print()

    # Analyze by category
    categories = {
        "Numeric": [0, 1, 2],
        "Unit": [3, 4],
        "Entity": [5, 6],
        "Date": [7, 8],
        "Semantic": [9, 10],
        "Entailment": [11, 12],
        "Neutral": [13, 14],
    }

    print("Accuracy by Category:")
    print("-" * 40)
    for category, indices in categories.items():
        cat_correct = sum(1 for i in indices if test_cases[i][2] == nli.check_entailment(test_cases[i][0], test_cases[i][1]).label.upper())
        cat_total = len(indices)
        print(f"  {category:15} {cat_correct}/{cat_total} ({100*cat_correct/cat_total:.0f}%)")

    print()
    print("=" * 70)
    print("CONCLUSION")
    print("=" * 70)
    print()

    if correct / total >= 0.85:
        print("✓ NLI model is sufficient for contradiction detection")
        print("  No need for regex-based numeric pre-filtering")
        print()
        print("  Next steps:")
        print("  1. Wire NLI into compare() API")
        print("  2. Update examples to use check_hallucinations=True")
        print("  3. Document when to use NLI mode")
    else:
        print("✗ NLI model has gaps in contradiction detection")
        print("  Consider hybrid approach: regex pre-filter + NLI")
        print()
        print("  Next steps:")
        print("  1. Implement fast numeric contradiction check")
        print("  2. Fall back to NLI for semantic contradictions")
        print("  3. Benchmark performance improvement")
    print()

if __name__ == "__main__":
    main()
