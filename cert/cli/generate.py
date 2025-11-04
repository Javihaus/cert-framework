"""
Generate compliance documentation data as JSON.

This outputs JSON that can be uploaded to the CERT dashboard,
which handles the actual Word document generation using TypeScript.

This approach keeps the Python backend simple and uses existing
working code in the dashboard.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import click


def load_traces(trace_file: str) -> List[Dict]:
    """Load traces from JSONL file."""
    traces = []
    with open(trace_file, "r") as f:
        for line in f:
            if line.strip():
                traces.append(json.loads(line))
    return traces


def analyze_traces(traces: List[Dict]) -> Dict:
    """Analyze traces for compliance metrics."""
    if not traces:
        return {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "error_rate": 0.0,
            "avg_response_time_ms": 0.0,
        }

    total = len(traces)
    successful = sum(1 for t in traces if t.get("status") == "success")
    failed = total - successful

    durations = [t.get("duration_ms", 0) for t in traces if "duration_ms" in t]
    avg_duration = sum(durations) / len(durations) if durations else 0

    return {
        "total_requests": total,
        "successful_requests": successful,
        "failed_requests": failed,
        "error_rate": failed / total if total > 0 else 0.0,
        "avg_response_time_ms": avg_duration,
    }


def generate_annex_iv_data(system_metadata: Dict) -> Dict:
    """Generate Annex IV technical documentation data."""
    return {
        "section_1_general": {
            "title": "General Information",
            "completed": bool(system_metadata.get("system_name")),
            "data": {
                "system_name": system_metadata.get("system_name", ""),
                "system_version": system_metadata.get("system_version", ""),
                "provider_name": system_metadata.get("provider_name", ""),
                "intended_purpose": system_metadata.get("intended_purpose", ""),
                "deployment_date": system_metadata.get("deployment_date", ""),
            },
        },
        "section_2_architecture": {
            "title": "AI System Architecture",
            "completed": bool(system_metadata.get("architecture")),
            "data": {
                "model_type": system_metadata.get("architecture", {}).get("model_type", ""),
                "model_version": system_metadata.get("architecture", {}).get("model_version", ""),
                "infrastructure": system_metadata.get("architecture", {}).get(
                    "infrastructure", ""
                ),
                "integration": system_metadata.get("architecture", {}).get("integration", ""),
            },
        },
        "section_3_data_governance": {
            "title": "Data and Data Governance",
            "completed": bool(system_metadata.get("data_governance")),
            "data": {
                "training_data": system_metadata.get("data_governance", {}).get(
                    "training_data", ""
                ),
                "validation_data": system_metadata.get("data_governance", {}).get(
                    "validation_data", ""
                ),
                "data_quality": system_metadata.get("data_governance", {}).get(
                    "data_quality", ""
                ),
                "bias_mitigation": system_metadata.get("data_governance", {}).get(
                    "bias_mitigation", ""
                ),
            },
        },
        "section_4_performance": {
            "title": "Performance Metrics",
            "completed": bool(system_metadata.get("performance_metrics")),
            "data": system_metadata.get("performance_metrics", {}),
        },
        "section_5_risk_management": {
            "title": "Risk Management",
            "completed": bool(system_metadata.get("risk_management")),
            "data": system_metadata.get("risk_management", {}),
        },
        "section_6_human_oversight": {
            "title": "Human Oversight",
            "completed": bool(system_metadata.get("human_oversight")),
            "data": system_metadata.get("human_oversight", {}),
        },
    }


@click.command(name="generate-docs")
@click.argument("trace_file", type=click.Path(exists=True))
@click.option("--output", "-o", type=click.Path(), help="Output JSON file path")
@click.option("--system-name", required=True, help="Name of your AI system")
@click.option("--system-version", default="v1.0", help="System version")
@click.option("--provider-name", required=True, help="Your organization name")
@click.option("--intended-purpose", help="Intended purpose of the AI system")
@click.option(
    "--metadata",
    type=click.Path(exists=True),
    help="Path to JSON file with additional system metadata",
)
def generate_docs(
    trace_file, output, system_name, system_version, provider_name, intended_purpose, metadata
):
    """Generate compliance documentation data as JSON.

    This command creates a JSON file containing all compliance data
    that can be uploaded to the CERT dashboard for document generation.

    Examples:
        cert generate-docs traces.jsonl --system-name "My RAG System" --provider-name "Acme Corp" -o compliance_data.json

        cert generate-docs traces.jsonl --system-name "Chatbot" --provider-name "Company" --metadata system_info.json -o data.json
    """
    click.echo("Generating compliance documentation data...")
    click.echo(f"  Trace file: {trace_file}")
    click.echo(f"  System: {system_name} {system_version}")
    click.echo(f"  Provider: {provider_name}")
    click.echo()

    # Load traces
    try:
        traces = load_traces(trace_file)
        click.echo(f"✓ Loaded {len(traces)} traces")
    except Exception as e:
        click.echo(f"Error loading traces: {e}", err=True)
        sys.exit(1)

    # Load additional metadata if provided
    system_metadata = {
        "system_name": system_name,
        "system_version": system_version,
        "provider_name": provider_name,
        "intended_purpose": intended_purpose or "",
    }

    if metadata:
        try:
            with open(metadata, "r") as f:
                additional_metadata = json.load(f)
                system_metadata.update(additional_metadata)
            click.echo(f"✓ Loaded additional metadata from {metadata}")
        except Exception as e:
            click.echo(f"Warning: Could not load metadata file: {e}", err=True)

    # Analyze traces
    metrics = analyze_traces(traces)
    click.echo(f"✓ Analyzed traces: {metrics['error_rate']:.1%} error rate")

    # Generate Annex IV data
    annex_iv_data = generate_annex_iv_data(system_metadata)

    # Calculate completion percentage
    completed_sections = sum(1 for section in annex_iv_data.values() if section.get("completed"))
    total_sections = len(annex_iv_data)
    completion_pct = (completed_sections / total_sections) * 100

    click.echo(f"✓ Annex IV: {completed_sections}/{total_sections} sections completed ({completion_pct:.0f}%)")

    # Create output data structure
    output_data = {
        "metadata": {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "cert_version": "4.0.0",
            "system_name": system_name,
            "system_version": system_version,
            "provider_name": provider_name,
        },
        "article_15_compliance": {
            "title": "Article 15: Accuracy, Robustness, and Cybersecurity",
            "metrics": metrics,
            "compliant": metrics["error_rate"] < 0.05,  # Example threshold
            "issues": (
                []
                if metrics["error_rate"] < 0.05
                else [
                    f"Error rate {metrics['error_rate']:.1%} exceeds 5% threshold",
                ]
            ),
        },
        "annex_iv_documentation": {
            "title": "Annex IV: Technical Documentation",
            "completion_percentage": completion_pct,
            "sections": annex_iv_data,
            "complete": completion_pct >= 80,  # Consider 80% complete as acceptable
            "missing_sections": [
                section["title"]
                for section in annex_iv_data.values()
                if not section.get("completed")
            ],
        },
        "trace_summary": {
            "trace_file": trace_file,
            "total_traces": len(traces),
            "date_range": {
                "start": min((t.get("timestamp", "") for t in traces), default=""),
                "end": max((t.get("timestamp", "") for t in traces), default=""),
            },
        },
    }

    # Save to file
    output_path = output or f"compliance_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    try:
        with open(output_path, "w") as f:
            json.dump(output_data, f, indent=2)
        click.echo()
        click.echo(f"✓ Compliance data saved to {output_path}")
        click.echo()
        click.echo("Next steps:")
        click.echo("  1. Upload this JSON file to the CERT dashboard")
        click.echo("  2. Use the dashboard to generate Word/PDF documentation")
        click.echo("  3. Review and complete any missing Annex IV sections")
        click.echo()
    except Exception as e:
        click.echo(f"Error saving output: {e}", err=True)
        sys.exit(1)

    return 0


if __name__ == "__main__":
    generate_docs()
