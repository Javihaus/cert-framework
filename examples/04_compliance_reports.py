"""
Example 4: EU AI Act Compliance Reports
========================================

Purpose: Generate compliance documentation for EU AI Act Article 15.

This example demonstrates:
- Monitoring compliant and non-compliant requests
- Automatic failure analysis with explanations
- Generating reports in multiple formats (txt, json, csv)
- Section 7: Failure Analysis with severity and recommendations

Run: python examples/04_compliance_reports.py
Time: < 10 seconds
Dependencies: cert-framework
"""

import os

from cert import export_report, monitor


@monitor(preset="healthcare")
def process_patient_query(query: str, context: str = None, answer: str = None):
    """Simulated high-risk AI system for healthcare.

    Args:
        query: Patient query
        context: Optional override for testing failures
        answer: Optional override for testing failures
    """
    if context is None:
        context = "Patient has hypertension (BP: 145/95) and Type 2 diabetes (HbA1c: 8.2%). Current medications: Metformin 1000mg bid, Lisinopril 10mg qd."
    if answer is None:
        answer = "The patient has hypertension and Type 2 diabetes. Current treatment includes Metformin 1000mg twice daily and Lisinopril 10mg once daily."

    return {"context": context, "answer": answer}


def generate_sample_data():
    """Generate sample audit data with compliant and non-compliant examples."""
    print("\nGenerating sample audit data...")
    print("-" * 40)

    # Compliant examples (accurate responses)
    compliant_examples = [
        ("What is the patient's condition?", None, None),
        ("What medications is the patient taking?", None, None),
        ("Summarize the patient's health status.", None, None),
    ]

    # Non-compliant examples (to showcase failure analysis)
    non_compliant_examples = [
        # Example 1: Hallucination (ungrounded terms)
        (
            "What is the patient's treatment plan?",
            "Patient has hypertension. Taking Metformin.",
            "Patient is scheduled for surgery next week and needs insulin injections daily.",  # Hallucination
        ),
        # Example 2: Contradiction
        (
            "Does the patient have diabetes?",
            "Patient has Type 2 diabetes with HbA1c of 8.2%.",
            "No, the patient does not have diabetes.",  # Contradiction
        ),
        # Example 3: Off-topic response
        (
            "What are the patient's medications?",
            "Patient takes Metformin 1000mg and Lisinopril 10mg.",
            "The weather today is sunny and warm.",  # Off-topic
        ),
    ]

    print("\nProcessing compliant requests...")
    for i, (query, context, answer) in enumerate(compliant_examples, 1):
        process_patient_query(query, context, answer)
        print(f"  {i}. ✓ {query[:50]}...")

    print("\nProcessing non-compliant requests (intentional failures)...")
    for i, (query, context, answer) in enumerate(non_compliant_examples, 1):
        process_patient_query(query, context, answer)
        print(f"  {i}. ✗ {query[:50]}... (failure expected)")

    total = len(compliant_examples) + len(non_compliant_examples)
    print(
        f"\n✓ Generated {total} audit log entries ({len(compliant_examples)} compliant, {len(non_compliant_examples)} non-compliant)"
    )


def create_compliance_reports():
    """Generate compliance reports in multiple formats."""
    print("\nGenerating Compliance Reports")
    print("-" * 40)

    # Text format (human-readable, includes Section 7: Failure Analysis)
    export_report(
        output_path="cert_compliance_report.txt",
        audit_log="cert_audit.jsonl",
        system_name="Healthcare RAG System",
        format="txt",
    )
    print("✓ Generated: cert_compliance_report.txt")
    print("  - Includes Section 7: Failure Analysis with explanations")

    # JSON format (machine-readable)
    export_report(
        output_path="cert_compliance_report.json",
        audit_log="cert_audit.jsonl",
        system_name="Healthcare RAG System",
        format="json",
    )
    print("✓ Generated: cert_compliance_report.json")

    # CSV format (spreadsheet-compatible)
    export_report(
        output_path="cert_compliance_report.csv",
        audit_log="cert_audit.jsonl",
        system_name="Healthcare RAG System",
        format="csv",
    )
    print("✓ Generated: cert_compliance_report.csv")


def show_report_sample():
    """Show sample from text report."""
    print("\nSample Report Content")
    print("-" * 40)

    if os.path.exists("cert_compliance_report.txt"):
        with open("cert_compliance_report.txt") as f:
            lines = f.readlines()[:15]  # First 15 lines
            print("".join(lines))
            print("... (truncated)")
    else:
        print("Report file not found")


if __name__ == "__main__":
    print("Example 4: EU AI Act Compliance Reports")
    print("=" * 40)

    try:
        # Step 1: Generate sample data
        generate_sample_data()

        # Step 2: Create compliance reports
        create_compliance_reports()

        # Step 3: Show sample
        show_report_sample()

        print("\n✓ Example complete!")
        print("\n📄 Report files created in current directory:")
        print("   - cert_compliance_report.txt (includes Section 7: Failure Analysis)")
        print("   - cert_compliance_report.json")
        print("   - cert_compliance_report.csv")
        print("\n💡 Check Section 7 in the .txt report to see detailed failure explanations")
        print("   with severity levels and actionable recommendations!")

    except Exception as e:
        print(f"\n✗ Error: {e}")
