"""
Audit command for checking EU AI Act compliance readiness.
Automated checks for Article 15 and Annex IV requirements.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import click


def load_traces(trace_file: str) -> List[Dict]:
    """Load traces from JSONL file."""
    traces = []
    with open(trace_file) as f:
        for line in f:
            if line.strip():
                traces.append(json.loads(line))
    return traces


def check_article_15_compliance(traces: List[Dict]) -> Tuple[bool, List[str], Dict]:
    """
    Check Article 15 compliance: Accuracy, robustness, and cybersecurity.

    Returns:
        (is_compliant, issues, metrics)
    """
    issues = []

    if not traces:
        issues.append("No traces found - cannot verify accuracy")
        return False, issues, {}

    # Calculate metrics
    total = len(traces)
    successful = sum(1 for t in traces if t.get("status") == "success")
    failed = total - successful
    error_rate = failed / total if total > 0 else 0

    durations = [t.get("duration_ms", 0) for t in traces if "duration_ms" in t]
    avg_duration = sum(durations) / len(durations) if durations else 0
    max_duration = max(durations) if durations else 0

    metrics = {
        "total_requests": total,
        "error_rate": error_rate,
        "avg_response_time_ms": avg_duration,
        "max_response_time_ms": max_duration,
    }

    # Check compliance thresholds
    if error_rate > 0.05:  # 5% error threshold
        issues.append(f"High error rate: {error_rate:.1%} (threshold: 5%)")

    if avg_duration > 5000:  # 5 second average response time
        issues.append(f"Slow response time: {avg_duration:.0f}ms average (threshold: 5000ms)")

    if total < 100:
        issues.append(
            f"Insufficient monitoring data: {total} traces (recommended: 100+ for statistical significance)"
        )

    # Check for required fields
    sample_trace = traces[0]
    required_fields = ["timestamp", "input_text", "output_text", "duration_ms", "status"]
    missing_fields = [field for field in required_fields if field not in sample_trace]

    if missing_fields:
        issues.append(f"Traces missing required fields: {', '.join(missing_fields)}")

    is_compliant = len(issues) == 0

    return is_compliant, issues, metrics


def check_annex_iv_compliance(metadata_file: str = None) -> Tuple[bool, List[str], Dict]:
    """
    Check Annex IV technical documentation completeness.

    Returns:
        (is_complete, missing_sections, completion_data)
    """
    required_sections = [
        "system_name",
        "system_version",
        "provider_name",
        "intended_purpose",
        "architecture",
        "data_governance",
        "performance_metrics",
        "risk_management",
        "human_oversight",
    ]

    missing = []
    completion_data = {}

    if not metadata_file or not Path(metadata_file).exists():
        missing = required_sections
        completion_data = {
            "completed_sections": 0,
            "total_sections": len(required_sections),
            "completion_percentage": 0,
        }
        return False, missing, completion_data

    # Load metadata
    try:
        with open(metadata_file) as f:
            metadata = json.load(f)
    except Exception as e:
        return False, [f"Error loading metadata: {e}"], {}

    # Check which sections are present and non-empty
    for section in required_sections:
        value = metadata.get(section)
        if not value or (isinstance(value, dict) and not value):
            missing.append(section)

    completed = len(required_sections) - len(missing)
    completion_pct = (completed / len(required_sections)) * 100

    completion_data = {
        "completed_sections": completed,
        "total_sections": len(required_sections),
        "completion_percentage": completion_pct,
    }

    is_complete = completion_pct >= 80  # 80% threshold

    return is_complete, missing, completion_data


def check_logging_compliance(traces: List[Dict]) -> Tuple[bool, List[str]]:
    """
    Check Article 19 logging requirements.

    Returns:
        (is_compliant, issues)
    """
    issues = []

    if not traces:
        issues.append("No logging found - Article 19 requires automatic logging")
        return False, issues

    # Check if traces have required fields for Article 19
    required_log_fields = ["timestamp", "input_text", "output_text", "status"]

    sample_trace = traces[0]
    missing_fields = [field for field in required_log_fields if field not in sample_trace]

    if missing_fields:
        issues.append(f"Logs missing required Article 19 fields: {', '.join(missing_fields)}")

    # Check if logging is recent (within last 30 days)
    if "timestamp" in sample_trace:
        from datetime import datetime

        try:
            latest_timestamp = max(t.get("timestamp", "") for t in traces)
            latest_date = datetime.fromisoformat(latest_timestamp.replace("Z", "+00:00"))
            days_old = (datetime.now(latest_date.tzinfo) - latest_date).days

            if days_old > 30:
                issues.append(f"Logging appears stale: latest trace is {days_old} days old")
        except Exception:
            issues.append("Could not parse timestamps - verify logging is active")

    is_compliant = len(issues) == 0

    return is_compliant, issues


@click.command(name="audit-status")
@click.argument("trace_file", type=click.Path(exists=True))
@click.option(
    "--metadata",
    "-m",
    type=click.Path(exists=True),
    help="Path to system metadata JSON file",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    help="Save audit results to JSON file",
)
@click.option(
    "--fail-on-issues",
    is_flag=True,
    help="Exit with error code if compliance issues found",
)
def audit_status(trace_file, metadata, output, fail_on_issues):
    """Check EU AI Act compliance readiness.

    This command performs automated checks for:
    - Article 15: Accuracy, robustness, and cybersecurity
    - Article 19: Logging and traceability
    - Annex IV: Technical documentation completeness

    Examples:
        cert audit-status traces.jsonl
        cert audit-status traces.jsonl --metadata system_info.json
        cert audit-status traces.jsonl -m system_info.json -o audit_report.json
    """
    click.echo("=" * 70)
    click.echo("EU AI Act Compliance Audit")
    click.echo("=" * 70)
    click.echo()

    # Load traces
    click.echo(f"Loading traces from {trace_file}...")
    try:
        traces = load_traces(trace_file)
        click.echo(f"✓ Loaded {len(traces)} traces")
        click.echo()
    except Exception as e:
        click.echo(f"✗ Error loading traces: {e}", err=True)
        sys.exit(1)

    # Check Article 15
    click.echo("Checking Article 15 (Accuracy, Robustness, Cybersecurity)...")
    article_15_compliant, article_15_issues, article_15_metrics = check_article_15_compliance(
        traces
    )

    if article_15_compliant:
        click.echo("✓ Article 15: COMPLIANT")
    else:
        click.echo("✗ Article 15: NON-COMPLIANT")

    if article_15_issues:
        for issue in article_15_issues:
            click.echo(f"  • {issue}")
    click.echo()

    # Check Article 19
    click.echo("Checking Article 19 (Logging and Traceability)...")
    article_19_compliant, article_19_issues = check_logging_compliance(traces)

    if article_19_compliant:
        click.echo("✓ Article 19: COMPLIANT")
    else:
        click.echo("✗ Article 19: NON-COMPLIANT")

    if article_19_issues:
        for issue in article_19_issues:
            click.echo(f"  • {issue}")
    click.echo()

    # Check Annex IV
    click.echo("Checking Annex IV (Technical Documentation)...")
    annex_iv_complete, annex_iv_missing, annex_iv_data = check_annex_iv_compliance(metadata)

    if annex_iv_complete:
        click.echo(f"✓ Annex IV: COMPLETE ({annex_iv_data['completion_percentage']:.0f}%)")
    else:
        click.echo(f"✗ Annex IV: INCOMPLETE ({annex_iv_data['completion_percentage']:.0f}%)")

    if annex_iv_missing:
        click.echo("  Missing sections:")
        for section in annex_iv_missing:
            click.echo(f"  • {section}")
    click.echo()

    # Overall status
    click.echo("=" * 70)
    click.echo("OVERALL STATUS")
    click.echo("=" * 70)

    all_compliant = article_15_compliant and article_19_compliant and annex_iv_complete
    total_issues = len(article_15_issues) + len(article_19_issues) + len(annex_iv_missing)

    if all_compliant:
        click.echo("✓ System is READY for EU AI Act compliance")
    else:
        click.echo(f"✗ System has {total_issues} compliance issues to address")

    click.echo()

    # Create audit result
    audit_result = {
        "timestamp": click.DateTime.utcnow().isoformat()
        if hasattr(click.DateTime, "utcnow")
        else "",
        "overall_compliant": all_compliant,
        "total_issues": total_issues,
        "article_15": {
            "compliant": article_15_compliant,
            "issues": article_15_issues,
            "metrics": article_15_metrics,
        },
        "article_19": {
            "compliant": article_19_compliant,
            "issues": article_19_issues,
        },
        "annex_iv": {
            "complete": annex_iv_complete,
            "missing_sections": annex_iv_missing,
            "completion_data": annex_iv_data,
        },
    }

    # Save to file if requested
    if output:
        try:
            with open(output, "w") as f:
                json.dump(audit_result, f, indent=2)
            click.echo(f"✓ Audit results saved to {output}")
            click.echo()
        except Exception as e:
            click.echo(f"Error saving audit results: {e}", err=True)

    # Exit with error code if requested and issues found
    if fail_on_issues and not all_compliant:
        sys.exit(1)

    return 0


if __name__ == "__main__":
    audit_status()
