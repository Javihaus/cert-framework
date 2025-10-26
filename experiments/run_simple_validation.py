"""Simple validation study - demonstrates threshold calibration concept

This is a simplified version that runs quickly to demonstrate the methodology.
Uses 50 test cases per domain instead of 500 for speed.
"""

import json
import os
import sys
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple

# Add cert to path
sys.path.insert(0, '/Users/javiermarin/cert-framework')

# Check if cert is available
try:
    from cert import measure
    print("✓ CERT Framework imported successfully")
except ImportError as e:
    print(f"✗ Error importing CERT: {e}")
    print("\nPlease ensure CERT is installed:")
    print("  cd /Users/javiermarin/cert-framework")
    print("  pip install -e packages/python")
    sys.exit(1)


@dataclass
class TestCase:
    """Single test case with ground truth"""
    query: str
    context: str
    correct_answer: str
    incorrect_answer: str
    domain: str


@dataclass
class CalibrationResult:
    """Results from threshold calibration"""
    domain: str
    energy_threshold: float
    accuracy: float
    hallucination_rate: float
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int


def create_legal_cases(n: int = 50) -> List[TestCase]:
    """Create synthetic legal test cases"""

    templates = [
        {
            "query": "What is the notice period for termination?",
            "context": "Either party may terminate this Agreement upon thirty (30) days' written notice.",
            "correct": "30 days written notice",
            "incorrect": "60 days verbal notice"
        },
        {
            "query": "What is the governing law?",
            "context": "This Agreement shall be governed by the laws of the State of Delaware.",
            "correct": "Delaware law",
            "incorrect": "Federal law and international treaties"
        },
        {
            "query": "What is the liability limitation?",
            "context": "Liability shall not exceed amounts paid in the twelve (12) months preceding the claim.",
            "correct": "Limited to amounts paid in preceding 12 months",
            "incorrect": "No liability cap, unlimited damages"
        },
        {
            "query": "Is arbitration required?",
            "context": "Disputes shall be resolved through binding arbitration under AAA rules.",
            "correct": "Yes, binding arbitration under AAA rules",
            "incorrect": "No, disputes go to federal court"
        },
        {
            "query": "What are confidentiality obligations?",
            "context": "Confidential Information must be maintained for three (3) years post-termination.",
            "correct": "3 years post-termination",
            "incorrect": "Perpetual confidentiality"
        },
    ]

    cases = []
    for i in range(n):
        template = templates[i % len(templates)]
        cases.append(TestCase(
            query=template["query"],
            context=template["context"],
            correct_answer=template["correct"],
            incorrect_answer=template["incorrect"],
            domain="legal"
        ))

    return cases


def create_healthcare_cases(n: int = 50) -> List[TestCase]:
    """Create synthetic healthcare test cases"""

    templates = [
        {
            "query": "What is first-line treatment for hypertension?",
            "context": "Thiazide diuretics are recommended as initial therapy. ACE inhibitors and calcium channel blockers are alternatives.",
            "correct": "Thiazide diuretics are first-line, with ACE inhibitors and CCBs as alternatives",
            "incorrect": "Beta blockers are always first-line for all patients"
        },
        {
            "query": "What are contraindications for metformin?",
            "context": "Metformin is contraindicated in severe renal impairment (eGFR <30), acute metabolic acidosis, and with iodinated contrast.",
            "correct": "Severe renal impairment, acute acidosis, iodinated contrast",
            "incorrect": "No contraindications, safe for all diabetics"
        },
        {
            "query": "What are diagnostic criteria for diabetes?",
            "context": "Diabetes is diagnosed when fasting glucose ≥126 mg/dL, HbA1c ≥6.5%, or random glucose ≥200 mg/dL with symptoms.",
            "correct": "Fasting ≥126 mg/dL, HbA1c ≥6.5%, or random ≥200 with symptoms",
            "incorrect": "Any glucose above 100 mg/dL confirms diabetes"
        },
        {
            "query": "What is the mechanism of statins?",
            "context": "Statins inhibit HMG-CoA reductase, reducing cholesterol synthesis and upregulating LDL receptors.",
            "correct": "Inhibit HMG-CoA reductase to reduce synthesis and upregulate LDL receptors",
            "incorrect": "Directly dissolve cholesterol plaques in arteries"
        },
        {
            "query": "What are signs of anaphylaxis?",
            "context": "Anaphylaxis presents with skin changes (urticaria, angioedema), respiratory compromise, and/or cardiovascular collapse.",
            "correct": "Skin changes, respiratory compromise, cardiovascular collapse",
            "incorrect": "Only mild skin rashes without serious symptoms"
        },
    ]

    cases = []
    for i in range(n):
        template = templates[i % len(templates)]
        cases.append(TestCase(
            query=template["query"],
            context=template["context"],
            correct_answer=template["correct"],
            incorrect_answer=template["incorrect"],
            domain="healthcare"
        ))

    return cases


def evaluate_at_threshold(test_cases: List[TestCase], threshold: float) -> CalibrationResult:
    """Evaluate accuracy at a specific energy threshold"""

    tp = 0  # Correct answers accepted
    tn = 0  # Incorrect answers rejected
    fp = 0  # Incorrect answers accepted (HALLUCINATIONS)
    fn = 0  # Correct answers rejected

    domain = test_cases[0].domain

    for i, case in enumerate(test_cases):
        if (i + 1) % 10 == 0:
            print(f"    Processed {i+1}/{len(test_cases)} cases...")

        # Evaluate correct answer
        correct_result = measure(
            text1=case.context,
            text2=case.correct_answer,
            use_semantic=True,
            use_nli=True,
            use_grounding=True
        )
        correct_energy = 1.0 - correct_result.confidence

        # Evaluate incorrect answer
        incorrect_result = measure(
            text1=case.context,
            text2=case.incorrect_answer,
            use_semantic=True,
            use_nli=True,
            use_grounding=True
        )
        incorrect_energy = 1.0 - incorrect_result.confidence

        # Apply threshold
        if correct_energy < threshold:
            tp += 1
        else:
            fn += 1

        if incorrect_energy >= threshold:
            tn += 1
        else:
            fp += 1

    # Calculate metrics
    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total > 0 else 0.0
    hallucination_rate = fp / (tp + fp) if (tp + fp) > 0 else 0.0

    return CalibrationResult(
        domain=domain,
        energy_threshold=threshold,
        accuracy=accuracy,
        hallucination_rate=hallucination_rate,
        true_positives=tp,
        true_negatives=tn,
        false_positives=fp,
        false_negatives=fn
    )


def calibrate_domain(test_cases: List[TestCase], target_accuracy: float, domain: str):
    """Calibrate threshold for a domain"""

    print(f"\n{'='*80}")
    print(f"CALIBRATING {domain.upper()} DOMAIN")
    print(f"{'='*80}")
    print(f"Target accuracy: {target_accuracy*100:.1f}%")
    print(f"Test cases: {len(test_cases)}")

    # Test thresholds
    thresholds = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]
    results = []

    for threshold in thresholds:
        print(f"\n  Testing threshold {threshold:.2f}...")
        result = evaluate_at_threshold(test_cases, threshold)
        results.append(result)

        print(f"    Accuracy: {result.accuracy*100:.1f}%")
        print(f"    Hallucination rate: {result.hallucination_rate*100:.1f}%")
        print(f"    TP={result.true_positives}, TN={result.true_negatives}, "
              f"FP={result.false_positives}, FN={result.false_negatives}")

    # Find best threshold
    best_result = None
    min_diff = float('inf')

    for result in results:
        diff = abs(result.accuracy - target_accuracy)
        if diff < min_diff:
            min_diff = diff
            best_result = result

    return best_result, results


def main():
    """Run validation study"""

    print("\n" + "#"*80)
    print("# PRESET THRESHOLD VALIDATION STUDY")
    print("# Legal and Healthcare Domains (Simplified)")
    print("#"*80)

    # Create output directory
    os.makedirs("validation_results", exist_ok=True)

    # Load test cases
    print("\n" + "="*80)
    print("STEP 1: LOAD TEST CASES")
    print("="*80)

    legal_cases = create_legal_cases(50)
    healthcare_cases = create_healthcare_cases(50)

    print(f"\n✓ Created {len(legal_cases)} legal test cases")
    print(f"✓ Created {len(healthcare_cases)} healthcare test cases")

    # Calibrate thresholds
    print("\n" + "="*80)
    print("STEP 2: CALIBRATE THRESHOLDS")
    print("="*80)

    # Legal: Target 95%
    legal_best, legal_results = calibrate_domain(legal_cases, 0.95, "legal")

    # Healthcare: Target 98%
    healthcare_best, healthcare_results = calibrate_domain(healthcare_cases, 0.98, "healthcare")

    # Generate report
    print("\n" + "="*80)
    print("VALIDATION RESULTS")
    print("="*80)

    print("\nLEGAL DOMAIN:")
    print(f"  Target accuracy:          95.0%")
    print(f"  Achieved accuracy:        {legal_best.accuracy*100:.1f}%")
    print(f"  Hallucination rate:       {legal_best.hallucination_rate*100:.1f}%")
    print(f"  Recommended threshold:    {legal_best.energy_threshold:.2f}")
    print(f"  Test cases:               {len(legal_cases)}")

    print("\nHEALTHCARE DOMAIN:")
    print(f"  Target accuracy:          98.0%")
    print(f"  Achieved accuracy:        {healthcare_best.accuracy*100:.1f}%")
    print(f"  Hallucination rate:       {healthcare_best.hallucination_rate*100:.1f}%")
    print(f"  Recommended threshold:    {healthcare_best.energy_threshold:.2f}")
    print(f"  Test cases:               {len(healthcare_cases)}")

    # Save results
    recommendations = {
        "legal": {
            "target_accuracy": 0.95,
            "recommended_energy_threshold": legal_best.energy_threshold,
            "achieved_accuracy": legal_best.accuracy,
            "achieved_hallucination_rate": legal_best.hallucination_rate,
            "n_test_cases": len(legal_cases),
            "note": "Simplified validation with synthetic data - use real datasets for production"
        },
        "healthcare": {
            "target_accuracy": 0.98,
            "recommended_energy_threshold": healthcare_best.energy_threshold,
            "achieved_accuracy": healthcare_best.accuracy,
            "achieved_hallucination_rate": healthcare_best.hallucination_rate,
            "n_test_cases": len(healthcare_cases),
            "note": "Simplified validation with synthetic data - use real datasets for production"
        }
    }

    output_file = "validation_results/simple_validation_results.json"
    with open(output_file, "w") as f:
        json.dump(recommendations, f, indent=2)

    print(f"\n✓ Results saved to: {output_file}")

    # Print detailed calibration table
    print("\n" + "="*80)
    print("DETAILED CALIBRATION RESULTS")
    print("="*80)

    print("\nLegal Domain:")
    print(f"{'Threshold':<12} {'Accuracy':<12} {'Hallucination':<15} {'Status':<20}")
    print("-" * 80)
    for result in legal_results:
        status = "✓ MEETS TARGET" if result.accuracy >= 0.95 else ""
        print(f"{result.energy_threshold:<12.2f} {result.accuracy*100:<12.1f}% "
              f"{result.hallucination_rate*100:<15.1f}% {status:<20}")

    print("\nHealthcare Domain:")
    print(f"{'Threshold':<12} {'Accuracy':<12} {'Hallucination':<15} {'Status':<20}")
    print("-" * 80)
    for result in healthcare_results:
        status = "✓ MEETS TARGET" if result.accuracy >= 0.98 else ""
        print(f"{result.energy_threshold:<12.2f} {result.accuracy*100:<12.1f}% "
              f"{result.hallucination_rate*100:<15.1f}% {status:<20}")

    print("\n" + "="*80)
    print("VALIDATION STUDY COMPLETE")
    print("="*80)
    print("\nNOTE: This used synthetic test data for demonstration.")
    print("For production use, run with real datasets (LegalBench-RAG, MedQA).")


if __name__ == "__main__":
    main()
