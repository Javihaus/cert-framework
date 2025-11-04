"""
Example 3: Full Compliance Workflow

Shows complete EU AI Act compliance workflow:
1. Risk classification
2. Production monitoring with tracing
3. Generating compliance documentation (JSON)
4. Audit checks

This example uses the JSON workflow: Python generates data,
dashboard generates Word/PDF documents.
"""

import json
import subprocess
from pathlib import Path


def step1_classify_system():
    """Step 1: Classify system's risk level."""
    print("STEP 1: Risk Classification")
    print("-" * 60)
    print("Run: cert classify-system --output classification.json")
    print()
    print("This interactive command asks 10 questions to determine")
    print("if your system is high-risk per Annex III.")
    print()
    print("Example output:")
    print("  Risk Level: High-Risk AI System (Annex III)")
    print("  High-Risk Indicators: 3/10")
    print("  Requirements: Full Article 15 compliance, Annex IV docs, etc.")
    print()


def step2_monitor_production():
    """Step 2: Monitor production system."""
    print("STEP 2: Production Monitoring")
    print("-" * 60)
    print("Integrate CERT tracing into your application:")
    print()
    print("```python")
    print("from cert.tracing import get_tracer")
    print()
    print("tracer = get_tracer()")
    print("trace_id = tracer.start_trace('my_function')")
    print("# ... your LLM calls ...")
    print("tracer.end_trace(trace_id)")
    print("```")
    print()
    print("Traces are saved to traces.jsonl")
    print()


def step3_generate_compliance_data():
    """Step 3: Generate compliance documentation data."""
    print("STEP 3: Generate Compliance Data")
    print("-" * 60)
    print("Generate JSON data for compliance documentation:")
    print()
    print("cert generate-docs traces.jsonl \\")
    print("  --system-name 'My RAG System' \\")
    print("  --provider-name 'Acme Corp' \\")
    print("  --intended-purpose 'Customer support chatbot' \\")
    print("  --metadata system_metadata.json \\")
    print("  -o compliance_data.json")
    print()
    print("This creates a JSON file with:")
    print("  • Article 15 compliance metrics")
    print("  • Annex IV technical documentation data")
    print("  • Trace analysis and statistics")
    print()


def step4_upload_to_dashboard():
    """Step 4: Upload to dashboard."""
    print("STEP 4: Upload to Dashboard")
    print("-" * 60)
    print("1. Open CERT dashboard")
    print("2. Navigate to 'Documentation' page")
    print("3. Upload compliance_data.json")
    print("4. Dashboard generates Word/PDF document using TypeScript")
    print("5. Download completed document")
    print()
    print("The dashboard uses existing @react-pdf/renderer")
    print("for professional document generation.")
    print()


def step5_audit_compliance():
    """Step 5: Run audit checks."""
    print("STEP 5: Audit Compliance")
    print("-" * 60)
    print("Run automated compliance checks:")
    print()
    print("cert audit-status traces.jsonl \\")
    print("  --metadata system_metadata.json \\")
    print("  -o audit_report.json")
    print()
    print("This checks:")
    print("  • Article 15: Accuracy metrics, error rates")
    print("  • Article 19: Logging completeness")
    print("  • Annex IV: Documentation completeness")
    print()
    print("Example output:")
    print("  ✓ Article 15: COMPLIANT")
    print("  ✓ Article 19: COMPLIANT")
    print("  ✗ Annex IV: INCOMPLETE (60%)")
    print("    Missing: risk_management, human_oversight")
    print()


def create_sample_metadata():
    """Create sample system metadata file."""
    metadata = {
        "system_name": "CustomerBot",
        "system_version": "v2.1.0",
        "provider_name": "Acme Corporation",
        "intended_purpose": "Automated customer support for e-commerce",
        "architecture": {
            "model_type": "gpt-4",
            "model_version": "gpt-4-0613",
            "infrastructure": "OpenAI API via REST",
            "integration": "FastAPI backend with React frontend",
        },
        "data_governance": {
            "training_data": "GPT-4 is pre-trained by OpenAI",
            "validation_data": "Internal test set of 500 customer queries",
            "data_quality": "Quarterly review of response quality",
            "bias_mitigation": "Prompt engineering to avoid biased responses",
        },
        "performance_metrics": {
            "accuracy": "92% on test set",
            "response_time": "< 2 seconds average",
            "availability": "99.9% uptime",
        },
        "risk_management": {
            "identified_risks": "Potential for incorrect product information",
            "mitigation": "Human review of all order-related responses",
            "monitoring": "Real-time accuracy monitoring with CERT",
        },
        "human_oversight": {
            "oversight_mechanism": "Support agents can override bot responses",
            "escalation": "Complex queries escalated to human agents",
            "audit": "Weekly review of flagged conversations",
        },
    }

    output_path = Path("system_metadata.json")
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Created sample metadata: {output_path}")
    return output_path


if __name__ == "__main__":
    print("=" * 60)
    print("Example 3: Full Compliance Workflow")
    print("=" * 60)
    print()
    print("This example shows the complete EU AI Act compliance workflow")
    print("using CERT's JSON-based approach.")
    print()
    print("=" * 60)
    print()

    step1_classify_system()
    step2_monitor_production()
    step3_generate_compliance_data()
    step4_upload_to_dashboard()
    step5_audit_compliance()

    print("=" * 60)
    print("BONUS: Create Sample Metadata")
    print("=" * 60)
    print("Creating a sample system_metadata.json file...")
    print()

    metadata_file = create_sample_metadata()

    print()
    print("=" * 60)
    print("Quick Start Commands")
    print("=" * 60)
    print()
    print("1. Classify system:")
    print("   cert classify-system -o classification.json")
    print()
    print("2. Generate compliance data:")
    print("   cert generate-docs traces.jsonl \\")
    print("     --system-name 'CustomerBot' \\")
    print("     --provider-name 'Acme Corp' \\")
    print("     --metadata system_metadata.json \\")
    print("     -o compliance_data.json")
    print()
    print("3. Audit compliance:")
    print("   cert audit-status traces.jsonl \\")
    print("     --metadata system_metadata.json \\")
    print("     -o audit_report.json")
    print()
    print("4. Upload compliance_data.json to CERT dashboard")
    print()
    print("=" * 60)
    print()
    print("Why JSON instead of Word docs?")
    print("-" * 60)
    print("✓ Clean separation: Python analyzes, TypeScript formats")
    print("✓ Uses existing working code in dashboard")
    print("✓ No new Python dependencies (python-docx, Jinja2)")
    print("✓ Professional output with @react-pdf/renderer")
    print("✓ Easy to version control and review")
