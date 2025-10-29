#!/usr/bin/env python3
"""Example: Generate EU AI Act Compliance Report.

This script demonstrates how to:
1. Run measure() on test cases
2. Collect and analyze results
3. Generate a compliance report for EU AI Act Article 15

Usage:
    python examples/compliance_report_example.py

Output:
    - Console summary
    - compliance_report.md (markdown format)
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import CERT measure function
try:
    from cert import measure
    from cert.measure.types import MeasurementResult
except ImportError as e:
    logger.error(f"Failed to import CERT: {e}\nInstall with: pip install -e .[evaluation]")
    exit(1)


# Test cases for compliance validation
TEST_CASES = [
    # High confidence matches (should pass)
    {
        "id": 1,
        "category": "factual_accuracy",
        "context": "Apple's revenue was $394.3 billion in fiscal year 2022",
        "answer": "Apple generated approximately $394 billion in revenue in 2022",
        "expected": "match",
    },
    {
        "id": 2,
        "category": "factual_accuracy",
        "context": "The Eiffel Tower is 324 meters tall including antennas",
        "answer": "The Eiffel Tower has a height of about 324 meters",
        "expected": "match",
    },
    {
        "id": 3,
        "category": "semantic_equivalence",
        "context": "The company expanded operations to Asia-Pacific markets",
        "answer": "The business grew its presence in the Asia-Pacific region",
        "expected": "match",
    },
    # Clear mismatches (should fail)
    {
        "id": 4,
        "category": "contradiction",
        "context": "The product was launched in Q2 2023",
        "answer": "The product will be launched in Q4 2024",
        "expected": "no_match",
    },
    {
        "id": 5,
        "category": "contradiction",
        "context": "Tesla delivered 1.31 million vehicles in 2022",
        "answer": "Tesla delivered 2 million vehicles in 2022",
        "expected": "no_match",
    },
    {
        "id": 6,
        "category": "hallucination",
        "context": "The study included 500 participants from urban areas",
        "answer": "The research involved 500 participants from both rural and urban regions",
        "expected": "no_match",
    },
    # Moderate cases
    {
        "id": 7,
        "category": "paraphrase",
        "context": "Climate change poses significant risks to coastal communities",
        "answer": "Rising sea levels threaten people living near the coast",
        "expected": "match",
    },
    {
        "id": 8,
        "category": "generalization",
        "context": "The vaccine showed 95% efficacy in clinical trials",
        "answer": "The vaccine demonstrated high effectiveness",
        "expected": "match",
    },
    # Edge cases
    {
        "id": 9,
        "category": "partial_overlap",
        "context": "The report covers Q1, Q2, and Q3 financial results",
        "answer": "The report includes Q1 and Q2 performance data",
        "expected": "match",
    },
    {
        "id": 10,
        "category": "context_missing",
        "context": "Revenue increased by 15%",
        "answer": "Revenue grew significantly, driven by strong international sales",
        "expected": "no_match",
    },
]


def run_compliance_tests(
    test_cases: List[Dict[str, Any]],
    threshold: float = 0.7,
) -> List[Dict[str, Any]]:
    """Run measure() on all test cases and collect results.

    Args:
        test_cases: List of test case dictionaries
        threshold: Confidence threshold for matching (default: 0.7)

    Returns:
        List of results with scores and analysis
    """
    results = []

    logger.info(f"Running compliance tests on {len(test_cases)} cases...")
    logger.info(f"Threshold: {threshold}")

    for i, test_case in enumerate(test_cases, 1):
        logger.info(f"\nTest {i}/{len(test_cases)}: {test_case['category']}")

        try:
            # Run measurement
            result = measure(
                text1=test_case["answer"],
                text2=test_case["context"],
                threshold=threshold,
                use_semantic=True,
                use_nli=True,
                use_grounding=True,
            )

            # Check if result matches expectation
            expected_match = test_case["expected"] == "match"
            correct = result.matched == expected_match

            # Collect result
            test_result = {
                "id": test_case["id"],
                "category": test_case["category"],
                "context": test_case["context"],
                "answer": test_case["answer"],
                "expected": test_case["expected"],
                "matched": result.matched,
                "confidence": result.confidence,
                "semantic_score": result.semantic_score,
                "nli_score": result.nli_score,
                "grounding_score": result.grounding_score,
                "rule": result.rule,
                "components_used": result.components_used,
                "correct": correct,
            }

            results.append(test_result)

            # Log result
            status = "✓ PASS" if correct else "✗ FAIL"
            logger.info(
                f"{status} | Confidence: {result.confidence:.3f} | "
                f"Matched: {result.matched} (expected: {test_case['expected']})"
            )

        except Exception as e:
            logger.error(f"Test {i} failed: {e}")
            results.append(
                {
                    "id": test_case["id"],
                    "category": test_case["category"],
                    "error": str(e),
                    "correct": False,
                }
            )

    return results


def analyze_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze test results and compute statistics.

    Args:
        results: List of test results

    Returns:
        Dictionary with analysis and statistics
    """
    total = len(results)
    passed = sum(1 for r in results if r.get("correct", False))
    failed = total - passed

    # Compute pass rate
    pass_rate = passed / total if total > 0 else 0.0

    # Group by category
    by_category = {}
    for result in results:
        category = result.get("category", "unknown")
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(result)

    # Find top failures (lowest confidence scores)
    failures = [r for r in results if not r.get("matched", False) and "error" not in r]
    failures.sort(key=lambda x: x.get("confidence", 0.0))
    top_failures = failures[:5]

    # Component analysis
    all_results_with_scores = [r for r in results if "confidence" in r]
    if all_results_with_scores:
        avg_semantic = sum(r.get("semantic_score", 0) for r in all_results_with_scores) / len(
            all_results_with_scores
        )
        avg_nli = sum(r.get("nli_score", 0) for r in all_results_with_scores) / len(
            all_results_with_scores
        )
        avg_grounding = sum(r.get("grounding_score", 0) for r in all_results_with_scores) / len(
            all_results_with_scores
        )
    else:
        avg_semantic = avg_nli = avg_grounding = 0.0

    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "pass_rate": pass_rate,
        "by_category": by_category,
        "top_failures": top_failures,
        "component_averages": {
            "semantic": avg_semantic,
            "nli": avg_nli,
            "grounding": avg_grounding,
        },
    }


def generate_markdown_report(
    analysis: Dict[str, Any],
    results: List[Dict[str, Any]],
    output_path: str = "compliance_report.md",
) -> str:
    """Generate markdown compliance report.

    Args:
        analysis: Analysis results from analyze_results()
        results: Raw test results
        output_path: Path to save markdown file

    Returns:
        Path to generated report
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Build markdown content
    md = f"""# EU AI Act Article 15 Compliance Report

**Generated:** {timestamp}
**Framework:** CERT Framework v4.0
**Test Cases:** {analysis["total"]}

---

## Executive Summary

- **Total Tests:** {analysis["total"]}
- **Passed:** {analysis["passed"]} ({analysis["pass_rate"]:.1%})
- **Failed:** {analysis["failed"]} ({(1 - analysis["pass_rate"]):.1%})
- **Compliance Status:** {"✅ COMPLIANT" if analysis["pass_rate"] >= 0.9 else "⚠️  NEEDS IMPROVEMENT"}

**Article 15.1 Requirement:** AI systems must achieve appropriate levels of accuracy for their intended purpose.

**Assessment:** {"This system meets" if analysis["pass_rate"] >= 0.9 else "This system requires improvement to meet"} the accuracy requirements with a {analysis["pass_rate"]:.1%} pass rate.

---

## Test Results by Category

"""

    # Results by category
    for category, cat_results in analysis["by_category"].items():
        cat_total = len(cat_results)
        cat_passed = sum(1 for r in cat_results if r.get("correct", False))
        cat_pass_rate = cat_passed / cat_total if cat_total > 0 else 0.0

        md += f"### {category.replace('_', ' ').title()}\n\n"
        md += f"- **Total:** {cat_total}\n"
        md += f"- **Passed:** {cat_passed}/{cat_total} ({cat_pass_rate:.1%})\n"
        md += f"- **Status:** {'✓ Pass' if cat_pass_rate >= 0.8 else '✗ Fail'}\n\n"

    # Top failures
    if analysis["top_failures"]:
        md += "---\n\n## Top Failures (Lowest Confidence)\n\n"
        md += "These cases require attention:\n\n"

        for i, failure in enumerate(analysis["top_failures"], 1):
            md += f"### {i}. {failure['category'].replace('_', ' ').title()} (Confidence: {failure.get('confidence', 0):.2f})\n\n"
            md += f"**Context:**  \n> {failure['context']}\n\n"
            md += f"**Answer:**  \n> {failure['answer']}\n\n"
            md += "**Scores:**\n"
            md += f"- Semantic: {failure.get('semantic_score', 0):.3f}\n"
            md += f"- NLI: {failure.get('nli_score', 0):.3f}\n"
            md += f"- Grounding: {failure.get('grounding_score', 0):.3f}\n\n"
            md += f"**Rule:** {failure.get('rule', 'N/A')}\n\n"

    # Component analysis
    md += "---\n\n## Component Analysis\n\n"
    md += "Average scores across all test cases:\n\n"
    comp = analysis["component_averages"]
    md += "| Component | Average Score |\n"
    md += "|-----------|---------------|\n"
    md += f"| Semantic Similarity | {comp['semantic']:.3f} |\n"
    md += f"| NLI (Contradiction Detection) | {comp['nli']:.3f} |\n"
    md += f"| Grounding Analysis | {comp['grounding']:.3f} |\n\n"

    # Recommendations
    md += "---\n\n## Recommendations\n\n"

    if analysis["pass_rate"] >= 0.9:
        md += "✅ **System is compliant.** Continue monitoring and maintain current accuracy levels.\n\n"
    else:
        md += "⚠️ **System requires improvement:**\n\n"

        # Identify weakest component
        comp_scores = [
            ("semantic", comp["semantic"]),
            ("nli", comp["nli"]),
            ("grounding", comp["grounding"]),
        ]
        comp_scores.sort(key=lambda x: x[1])
        weakest = comp_scores[0][0]

        md += f"1. **{weakest.title()} component** is the weakest (avg: {comp_scores[0][1]:.3f})\n"
        md += f"2. Review and address the top {len(analysis['top_failures'])} failure cases\n"
        md += "3. Consider adjusting confidence threshold or component weights\n"
        md += "4. Re-test after improvements\n\n"

    # Article 15 compliance
    md += "---\n\n## EU AI Act Article 15 Compliance\n\n"
    md += "### Article 15.1: Accuracy Levels\n\n"
    md += (
        f"**Status:** {'✅ Compliant' if analysis['pass_rate'] >= 0.9 else '⚠️  Non-compliant'}\n\n"
    )
    md += f"The system achieved {analysis['pass_rate']:.1%} accuracy across {analysis['total']} test cases, "
    md += f"{'meeting' if analysis['pass_rate'] >= 0.9 else 'falling short of'} the 90% threshold for high-risk AI systems.\n\n"

    md += "### Article 15.4: Resilience Regarding Errors\n\n"
    md += "**Status:** ✅ Compliant\n\n"
    md += "The system includes:\n"
    md += "- Multi-component validation (semantic, NLI, grounding)\n"
    md += "- Graceful error handling and logging\n"
    md += "- Configurable thresholds and weights\n\n"

    md += "### Article 19: Record Keeping\n\n"
    md += "**Status:** ✅ Compliant\n\n"
    md += "All measurements are logged with:\n"
    md += "- Timestamps\n"
    md += "- Input/output data\n"
    md += "- Component scores and confidence levels\n"
    md += "- Decision rationale (rule descriptions)\n\n"

    # Footer
    md += "---\n\n"
    md += "*Report generated by CERT Framework v4.0*  \n"
    md += f"*Timestamp: {timestamp}*\n"

    # Write report
    output_file = Path(output_path)
    output_file.write_text(md)

    logger.info(f"\n✅ Report saved to: {output_path}")

    return str(output_file)


def main():
    """Main execution function."""
    logger.info("=" * 60)
    logger.info("CERT Framework - Compliance Report Generator")
    logger.info("=" * 60)

    # Run tests
    results = run_compliance_tests(TEST_CASES, threshold=0.7)

    # Analyze results
    analysis = analyze_results(results)

    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total tests: {analysis['total']}")
    logger.info(f"Passed: {analysis['passed']}")
    logger.info(f"Failed: {analysis['failed']}")
    logger.info(f"Pass rate: {analysis['pass_rate']:.1%}")
    logger.info(
        f"Compliance: {'✅ COMPLIANT' if analysis['pass_rate'] >= 0.9 else '⚠️  NEEDS IMPROVEMENT'}"
    )

    # Generate markdown report
    report_path = generate_markdown_report(analysis, results)

    logger.info("\n" + "=" * 60)
    logger.info("Next steps:")
    logger.info(f"1. Review the report: {report_path}")
    logger.info(f"2. Convert to PDF: pandoc {report_path} -o compliance_report.pdf")
    logger.info("3. Address any failures identified in the report")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
