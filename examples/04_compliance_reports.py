"""
Example 4: EU AI Act Compliance Reports
========================================

Purpose: Generate compliance documentation for EU AI Act Article 15.

Run: python examples/04_compliance_reports.py
Time: < 5 seconds
Dependencies: cert-framework
"""

from cert import monitor, export_report
import os


@monitor(preset="healthcare")
def process_patient_query(query: str):
    """Simulated high-risk AI system for healthcare."""
    context = "Patient has hypertension (BP: 145/95) and Type 2 diabetes (HbA1c: 8.2%). Current medications: Metformin 1000mg bid, Lisinopril 10mg qd."
    answer = "The patient has hypertension and Type 2 diabetes. Current treatment includes Metformin 1000mg twice daily and Lisinopril 10mg once daily."
    return {"context": context, "answer": answer}


def generate_sample_data():
    """Generate sample audit data."""
    print("\nGenerating sample audit data...")
    print("-" * 40)

    queries = [
        "What is the patient's condition?",
        "What medications is the patient taking?",
        "Summarize the patient's health status."
    ]

    for i, query in enumerate(queries, 1):
        result = process_patient_query(query)
        print(f"{i}. Processed query: {query[:50]}...")

    print(f"\n✓ Generated 3 audit log entries")


def create_compliance_reports():
    """Generate compliance reports in multiple formats."""
    print("\nGenerating Compliance Reports")
    print("-" * 40)

    # Text format (human-readable)
    export_report(
        audit_log_path="cert_audit.jsonl",
        system_name="Healthcare RAG System",
        system_version="1.0.0",
        risk_level="high",
        format="txt",
        output_path="cert_compliance_report.txt"
    )
    print("✓ Generated: cert_compliance_report.txt")

    # JSON format (machine-readable)
    export_report(
        audit_log_path="cert_audit.jsonl",
        system_name="Healthcare RAG System",
        system_version="1.0.0",
        risk_level="high",
        format="json",
        output_path="cert_compliance_report.json"
    )
    print("✓ Generated: cert_compliance_report.json")

    # Markdown format (documentation)
    export_report(
        audit_log_path="cert_audit.jsonl",
        system_name="Healthcare RAG System",
        system_version="1.0.0",
        risk_level="high",
        format="markdown",
        output_path="cert_compliance_report.md"
    )
    print("✓ Generated: cert_compliance_report.md")


def show_report_sample():
    """Show sample from text report."""
    print("\nSample Report Content")
    print("-" * 40)

    if os.path.exists("cert_compliance_report.txt"):
        with open("cert_compliance_report.txt", "r") as f:
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
        print("   - cert_compliance_report.txt")
        print("   - cert_compliance_report.json")
        print("   - cert_compliance_report.md")

    except Exception as e:
        print(f"\n✗ Error: {e}")
