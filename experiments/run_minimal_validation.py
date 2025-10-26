"""Minimal validation - runs CERT on actual test cases

This runs ACTUAL measurements (not projections) on a small test set.
"""

import json
import sys
sys.path.insert(0, '/Users/javiermarin/cert-framework')

print("Importing CERT...")
from cert import measure
print("✓ CERT imported\n")

# Test cases
healthcare_cases = [
    {
        "context": "Thiazide diuretics are recommended as initial therapy for most patients with hypertension. ACE inhibitors and calcium channel blockers are alternative first-line options.",
        "correct": "Thiazide diuretics are first-line treatment",
        "incorrect": "Beta blockers are always the only first-line option"
    },
    {
        "context": "Metformin is contraindicated in severe renal impairment (eGFR <30 mL/min/1.73m²), acute metabolic acidosis, and during radiologic studies with iodinated contrast.",
        "correct": "Contraindicated in severe renal impairment and acute metabolic acidosis",
        "incorrect": "Metformin has no contraindications"
    },
    {
        "context": "Diabetes is diagnosed when fasting plasma glucose ≥126 mg/dL, HbA1c ≥6.5%, or random plasma glucose ≥200 mg/dL with symptoms of hyperglycemia.",
        "correct": "Diagnosed with fasting glucose ≥126 mg/dL or HbA1c ≥6.5%",
        "incorrect": "Any glucose above 100 mg/dL confirms diabetes"
    },
]

legal_cases = [
    {
        "context": "Either party may terminate this Agreement upon thirty (30) days written notice to the other party.",
        "correct": "30 days written notice required",
        "incorrect": "60 days verbal notice required"
    },
    {
        "context": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
        "correct": "Governed by Delaware law",
        "incorrect": "Governed by federal law only"
    },
]

def test_threshold(cases, threshold, domain):
    """Test accuracy at a specific threshold"""
    tp = tn = fp = fn = 0

    for i, case in enumerate(cases):
        print(f"  Case {i+1}/{len(cases)}...", end=" ")

        # Measure correct answer
        result_correct = measure(
            text1=case["context"],
            text2=case["correct"],
            use_semantic=True,
            use_nli=True,
            use_grounding=True
        )
        energy_correct = 1.0 - result_correct.confidence

        # Measure incorrect answer
        result_incorrect = measure(
            text1=case["context"],
            text2=case["incorrect"],
            use_semantic=True,
            use_nli=True,
            use_grounding=True
        )
        energy_incorrect = 1.0 - result_incorrect.confidence

        # Apply threshold
        if energy_correct < threshold:
            tp += 1
        else:
            fn += 1

        if energy_incorrect >= threshold:
            tn += 1
        else:
            fp += 1

        print(f"correct_energy={energy_correct:.3f}, incorrect_energy={energy_incorrect:.3f}")

    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total > 0 else 0.0
    hallucination_rate = fp / (tp + fp) if (tp + fp) > 0 else 0.0

    return accuracy, hallucination_rate, tp, tn, fp, fn

print("="*80)
print("ACTUAL VALIDATION RESULTS")
print("="*80)

# Test Healthcare
print("\nHEALTHCARE DOMAIN:")
print("="*80)
for threshold in [0.10, 0.15, 0.20, 0.25, 0.30]:
    print(f"\nThreshold {threshold:.2f}:")
    acc, hall, tp, tn, fp, fn = test_threshold(healthcare_cases, threshold, "healthcare")
    print(f"  Accuracy: {acc*100:.1f}% (TP={tp}, TN={tn}, FP={fp}, FN={fn})")
    print(f"  Hallucination: {hall*100:.1f}%")

# Test Legal
print("\n\nLEGAL DOMAIN:")
print("="*80)
for threshold in [0.15, 0.20, 0.25, 0.30, 0.35]:
    print(f"\nThreshold {threshold:.2f}:")
    acc, hall, tp, tn, fp, fn = test_threshold(legal_cases, threshold, "legal")
    print(f"  Accuracy: {acc*100:.1f}% (TP={tp}, TN={tn}, FP={fp}, FN={fn})")
    print(f"  Hallucination: {hall*100:.1f}%")

print("\n" + "="*80)
print("VALIDATION COMPLETE")
print("="*80)
print("\nThese are ACTUAL measured results from CERT energy function.")
