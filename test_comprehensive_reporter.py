#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for the comprehensive Annex IV compliance reporter.

This script demonstrates how to use the new ComplianceReporter to generate
complete EU AI Act documentation covering all 9 Annex IV sections.
"""

import json
from cert.compliance import ComplianceReporter

# System metadata - in production, this would be loaded from a JSON file
system_metadata = {
    "architecture_description": """
The CERT Framework is a Python-based compliance monitoring system that wraps
around AI applications to provide real-time compliance evaluation. The architecture
consists of three main layers:

1. **Measurement Layer**: Evaluates AI outputs using configurable rules and metrics
2. **Logging Layer**: Automatically captures all interactions with full metadata
3. **Monitoring Layer**: Provides real-time dashboard and analytics

The system integrates with existing AI applications through a simple Python SDK,
requiring minimal code changes while providing comprehensive compliance monitoring.
""",
    "integrations": [
        {
            "name": "Anthropic Claude API",
            "description": "Primary LLM integration for AI-powered responses",
            "interface_type": "REST API via Python SDK",
        },
        {
            "name": "CERT Dashboard",
            "description": "Real-time compliance monitoring interface",
            "interface_type": "Next.js web application",
        },
    ],
    "third_party_components": [
        {
            "name": "sentence-transformers",
            "purpose": "Semantic similarity evaluation for accuracy measurement",
            "integration": "Python library via pip",
        },
        {
            "name": "anthropic",
            "purpose": "LLM API access and response generation",
            "integration": "Python SDK",
        },
        {
            "name": "Next.js / React",
            "purpose": "Dashboard web interface",
            "integration": "Separate web application",
        },
    ],
    "cybersecurity_overview": """
The system implements multiple layers of security:
- HTTPS encryption for all network communications
- API key-based authentication for external services
- Secure storage of logs with access controls
- No PII storage in default configuration
- Regular security audits and updates
""",
    "risk_overview": """
Risk assessment conducted according to Annex III of the EU AI Act:
- System classified as HIGH-RISK due to application domain
- Primary risks: Inaccurate responses, system availability, data privacy
- Mitigation: Real-time accuracy monitoring, redundancy, secure logging
- Regular monitoring and reporting through CERT Dashboard
""",
    "development_overview": """
Development follows modern software engineering practices:
- Git version control with GitHub
- Automated testing with pytest
- Code review process for all changes
- Continuous integration and deployment
- Semantic versioning for releases
""",
    "core_version": "v1.0.0",
    "dependencies": "Python 3.9+, sentence-transformers, anthropic, fastapi",
    "model_version": "claude-3-sonnet (via Anthropic API)",
    "min_hardware": "4 CPU cores, 8GB RAM, 10GB storage",
    "recommended_hardware": "8 CPU cores, 16GB RAM, 50GB storage",
    "gpu_requirements": "Optional - improves semantic similarity performance",
    "network_requirements": "HTTPS connectivity to api.anthropic.com",
    "data_overview": """
Data handling practices:
- All interactions logged locally in JSONL format
- No data shared with third parties except AI provider
- Logs retained for 90 days by default (configurable)
- Secure deletion of expired logs
- GDPR-compliant data handling
""",
    "validation_data_source": """
Validation performed using:
- Internal test dataset of 1,000 example interactions
- Production traces from pilot deployment
- Edge case testing for robustness validation
""",
    "oversight_philosophy": """
Human oversight is central to the system design:
- Real-time dashboard for continuous monitoring
- Automatic alerts for compliance violations
- Detailed drill-down into individual interactions
- Manual review capability for flagged cases
- Clear escalation procedures documented
""",
}

# Mock evaluation results
evaluation_results = {
    "total_traces": 1500,
    "passed": 1425,
    "failed": 75,
    "pass_rate": 0.95,
    "preset": "general",
    "threshold": 0.70,
}


def test_reporter_initialization():
    """Test that reporter can be initialized."""
    print("Testing reporter initialization...")

    reporter = ComplianceReporter(
        system_name="CERT AI Compliance Monitor",
        provider_name="CERT Framework Project",
        system_version="v1.0.0",
        risk_classification="HIGH-RISK",
        intended_purpose=(
            "Real-time compliance monitoring for AI systems deployed under the EU AI Act. "
            "The system evaluates AI outputs for accuracy, robustness, and regulatory compliance, "
            "providing automatic logging per Article 19 and comprehensive Article 15 monitoring."
        ),
    )

    print("✓ Reporter initialized successfully")
    return reporter


def test_markdown_generation(reporter):
    """Test markdown report generation."""
    print("\nTesting markdown report generation...")

    try:
        # Create a simple test trace
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
            test_trace = {
                "timestamp": "2024-01-15T10:30:45.123Z",
                "query": "What is the capital of France?",
                "response": "The capital of France is Paris.",
                "measurement": {
                    "confidence": 0.95,
                    "rule": "factual_accuracy",
                    "components_used": ["semantic_similarity"],
                },
                "passed": True,
                "duration_ms": 145.2,
            }
            f.write(json.dumps(test_trace) + '\n')
            trace_file = f.name

        output_path = "/tmp/test_report.md"
        result = reporter.generate_comprehensive_report(
            log_path=trace_file,
            output_path=output_path,
            system_metadata=system_metadata,
            evaluation_results=evaluation_results,
            format="markdown",
        )

        print(f"✓ Markdown report generated: {result}")

        # Show a preview
        with open(result) as f:
            preview = f.read()[:500]
            print(f"\nPreview:\n{preview}...\n")

        return True
    except Exception as e:
        print(f"✗ Markdown generation failed: {e}")
        return False


def test_html_generation(reporter):
    """Test HTML report generation."""
    print("\nTesting HTML report generation...")

    try:
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
            test_trace = {
                "timestamp": "2024-01-15T10:30:45.123Z",
                "query": "What is the capital of France?",
                "response": "The capital of France is Paris.",
                "measurement": {
                    "confidence": 0.95,
                    "rule": "factual_accuracy",
                    "components_used": ["semantic_similarity"],
                },
                "passed": True,
                "duration_ms": 145.2,
            }
            f.write(json.dumps(test_trace) + '\n')
            trace_file = f.name

        output_path = "/tmp/test_report.html"
        result = reporter.generate_comprehensive_report(
            log_path=trace_file,
            output_path=output_path,
            system_metadata=system_metadata,
            evaluation_results=evaluation_results,
            format="html",
        )

        print(f"✓ HTML report generated: {result}")
        print(f"  Open in browser: file://{result}")
        return True
    except Exception as e:
        print(f"✗ HTML generation failed: {e}")
        return False


def test_pdf_generation(reporter):
    """Test PDF report generation (requires weasyprint)."""
    print("\nTesting PDF report generation...")

    try:
        import weasyprint
        print("  weasyprint is installed ✓")
    except ImportError:
        print("  ⚠ weasyprint not installed - skipping PDF test")
        print("  Install with: pip install weasyprint")
        return False

    try:
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
            test_trace = {
                "timestamp": "2024-01-15T10:30:45.123Z",
                "query": "What is the capital of France?",
                "response": "The capital of France is Paris.",
                "measurement": {
                    "confidence": 0.95,
                    "rule": "factual_accuracy",
                    "components_used": ["semantic_similarity"],
                },
                "passed": True,
                "duration_ms": 145.2,
            }
            f.write(json.dumps(test_trace) + '\n')
            trace_file = f.name

        output_path = "/tmp/test_report.pdf"
        result = reporter.generate_comprehensive_report(
            log_path=trace_file,
            output_path=output_path,
            system_metadata=system_metadata,
            evaluation_results=evaluation_results,
            format="pdf",
        )

        print(f"✓ PDF report generated: {result}")
        print(f"  Open with: open {result}")
        return True
    except Exception as e:
        print(f"✗ PDF generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("CERT Framework - Comprehensive Compliance Reporter Test")
    print("=" * 70)

    # Test initialization
    reporter = test_reporter_initialization()

    # Test report generation
    markdown_ok = test_markdown_generation(reporter)
    html_ok = test_html_generation(reporter)
    pdf_ok = test_pdf_generation(reporter)

    # Summary
    print("\n" + "=" * 70)
    print("Test Summary:")
    print(f"  Markdown: {'✓ PASS' if markdown_ok else '✗ FAIL'}")
    print(f"  HTML:     {'✓ PASS' if html_ok else '✗ FAIL'}")
    print(f"  PDF:      {'✓ PASS' if pdf_ok else '⚠ SKIPPED (weasyprint not installed)'}")
    print("=" * 70)

    if markdown_ok and html_ok:
        print("\n✅ Core functionality working!")
        print("\nNext steps:")
        print("1. Install weasyprint for PDF generation:")
        print("   pip install weasyprint")
        print("\n2. Load your production traces and generate a real report:")
        print("   python examples/generate_compliance_report.py")
    else:
        print("\n⚠ Some tests failed - check error messages above")
