"""Compliance report generation for EU AI Act Article 15.

Generates plain-English compliance reports for non-technical stakeholders.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict


def export_report(
    output_path: str = "cert_compliance_report.txt",
    audit_log: str = "cert_audit.jsonl",
    system_name: str = "LLM System",
    format: str = "txt",
) -> str:
    """Export compliance report for EU AI Act Article 15.

    Generates plain-English report for compliance teams showing:
    - Accuracy metrics (Article 15.1)
    - Robustness metrics (Article 15.4)
    - Audit trail status (Article 19)

    Args:
        output_path: Path to save report (default: cert_compliance_report.txt)
        audit_log: Path to audit log to analyze (default: cert_audit.jsonl)
        system_name: Name of your AI system (default: "LLM System")
        format: Report format - "txt", "json", or "csv" (default: "txt")

    Returns:
        Path to generated report

    Examples:
        # Generate text report
        cert.export_report(
            output_path="compliance_report.txt",
            system_name="Customer Service RAG"
        )

        # Generate JSON report
        cert.export_report(
            output_path="compliance_report.json",
            format="json"
        )
    """
    # Load audit log and compute statistics
    stats = _load_audit_statistics(audit_log)

    # Generate report based on format
    if format == "txt":
        content = _generate_text_report(system_name, stats)
    elif format == "json":
        content = _generate_json_report(system_name, stats)
    elif format == "csv":
        content = _generate_csv_report(system_name, stats)
    else:
        raise ValueError(f"Unsupported format: {format}. Use 'txt', 'json', or 'csv'")

    # Write report
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w") as f:
        f.write(content)

    return str(output_file)


def show_report(audit_log: str = "cert_audit.jsonl", system_name: str = "LLM System"):
    """Print compliance report to terminal.

    Args:
        audit_log: Path to audit log (default: cert_audit.jsonl)
        system_name: Name of your AI system (default: "LLM System")

    Example:
        >>> cert.show_report(system_name="Customer Service RAG")
    """
    stats = _load_audit_statistics(audit_log)
    report = _generate_text_report(system_name, stats)
    print(report)


def _load_audit_statistics(audit_log: str) -> Dict:
    """Load and compute statistics from audit log."""
    audit_path = Path(audit_log)

    if not audit_path.exists():
        return {
            "total_requests": 0,
            "hallucination_rate": 0.0,
            "compliance_rate": 0.0,
            "mean_accuracy": 0.0,
            "error_rate": 0.0,
            "mean_semantic_score": 0.0,
            "mean_nli_score": 0.0,
            "mean_grounding_score": 0.0,
            "period_start": None,
            "period_end": None,
            "audit_retention_days": 0,
        }

    total_requests = 0
    total_hallucinations = 0
    total_compliant = 0
    total_errors = 0
    accuracy_scores = []
    semantic_scores = []
    nli_scores = []
    grounding_scores = []
    timestamps = []

    with audit_path.open("r") as f:
        for line in f:
            try:
                entry = json.loads(line)

                if entry.get("type") == "request":
                    total_requests += 1
                    timestamps.append(entry.get("timestamp"))

                    if entry.get("hallucination_detected"):
                        total_hallucinations += 1
                    if entry.get("is_compliant"):
                        total_compliant += 1

                    accuracy_scores.append(entry.get("accuracy_score", 0.0))

                    metrics = entry.get("metrics", {})
                    semantic_scores.append(metrics.get("semantic_score", 0.0))
                    nli_scores.append(metrics.get("nli_score", 0.0))
                    grounding_scores.append(metrics.get("grounding_score", 0.0))

                elif entry.get("type") == "error":
                    total_errors += 1

            except json.JSONDecodeError:
                continue

    if total_requests == 0:
        return {
            "total_requests": 0,
            "hallucination_rate": 0.0,
            "compliance_rate": 0.0,
            "mean_accuracy": 0.0,
            "error_rate": 0.0,
            "mean_semantic_score": 0.0,
            "mean_nli_score": 0.0,
            "mean_grounding_score": 0.0,
            "period_start": None,
            "period_end": None,
            "audit_retention_days": 0,
        }

    # Calculate statistics
    hallucination_rate = total_hallucinations / total_requests
    compliance_rate = total_compliant / total_requests
    mean_accuracy = sum(accuracy_scores) / len(accuracy_scores)
    mean_semantic = sum(semantic_scores) / len(semantic_scores)
    mean_nli = sum(nli_scores) / len(nli_scores)
    mean_grounding = sum(grounding_scores) / len(grounding_scores)

    total_operations = total_requests + total_errors
    error_rate = total_errors / total_operations if total_operations > 0 else 0.0

    # Calculate retention period
    if timestamps:
        period_start = min(timestamps)
        period_end = max(timestamps)
        start_dt = datetime.fromisoformat(period_start)
        end_dt = datetime.fromisoformat(period_end)
        retention_days = (end_dt - start_dt).days
    else:
        period_start = None
        period_end = None
        retention_days = 0

    return {
        "total_requests": total_requests,
        "hallucination_rate": hallucination_rate,
        "compliance_rate": compliance_rate,
        "mean_accuracy": mean_accuracy,
        "error_rate": error_rate,
        "mean_semantic_score": mean_semantic,
        "mean_nli_score": mean_nli,
        "mean_grounding_score": mean_grounding,
        "period_start": period_start,
        "period_end": period_end,
        "audit_retention_days": retention_days,
    }


def _generate_text_report(system_name: str, stats: Dict) -> str:
    """Generate plain-English text report."""

    # Determine compliance status
    accuracy_compliant = stats["mean_accuracy"] >= 0.90
    robustness_compliant = stats["error_rate"] <= 0.05
    hallucination_compliant = stats["hallucination_rate"] <= 0.05
    audit_compliant = stats["total_requests"] > 0

    overall_compliant = (
        accuracy_compliant
        and robustness_compliant
        and hallucination_compliant
        and audit_compliant
    )

    status_symbol = "✓" if overall_compliant else "✗"
    status_text = "COMPLIANT" if overall_compliant else "NON-COMPLIANT"

    report = f"""
{"=" * 80}
EU AI ACT ARTICLE 15 COMPLIANCE REPORT
{"=" * 80}

System: {system_name}
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Measurement Period: {stats["period_start"] or "N/A"} to {stats["period_end"] or "N/A"}

OVERALL STATUS: {status_symbol} {status_text}

{"=" * 80}
ARTICLE 15.1 - ACCURACY REQUIREMENTS
{"=" * 80}

"High-risk AI systems shall be designed and developed to achieve
appropriate levels of accuracy..."

Accuracy Metrics:
├─ Overall Accuracy Score:      {stats["mean_accuracy"]:.1%}
├─ Semantic Accuracy:            {stats["mean_semantic_score"]:.1%}
├─ NLI Contradiction Score:      {stats["mean_nli_score"]:.1%}
└─ Grounding Score:              {stats["mean_grounding_score"]:.1%}

Hallucination Detection:
├─ Hallucination Rate:           {stats["hallucination_rate"]:.1%}
└─ Threshold:                    <5% (recommended)

Compliance Assessment:
├─ Total Requests Analyzed:      {stats["total_requests"]:,}
├─ Compliant Responses:          {stats["compliance_rate"]:.1%}
└─ Status:                       {"✓ COMPLIANT" if accuracy_compliant else "✗ NON-COMPLIANT"} (threshold: 90%)

{"=" * 80}
ARTICLE 15.4 - ROBUSTNESS & RESILIENCE
{"=" * 80}

"High-risk AI systems shall be resilient regarding errors, faults,
or inconsistencies..."

Robustness Metrics:
├─ Error Rate:                   {stats["error_rate"]:.1%}
├─ Success Rate:                 {(1 - stats["error_rate"]):.1%}
└─ Status:                       {"✓ COMPLIANT" if robustness_compliant else "✗ NON-COMPLIANT"} (threshold: <5% errors)

{"=" * 80}
ARTICLE 19 - AUTOMATIC LOGGING
{"=" * 80}

"High-risk AI systems shall be designed and developed with capabilities
enabling automatic recording of events over the lifetime of the system."

Audit Trail:
├─ Logging Enabled:              {"✓ YES" if audit_compliant else "✗ NO"}
├─ Total Requests Logged:        {stats["total_requests"]:,}
├─ Data Retention Period:        {stats["audit_retention_days"]} days
├─ Minimum Required:             180 days (6 months)
└─ Status:                       {"✓ COMPLIANT" if audit_compliant else "✗ NON-COMPLIANT"}

{"=" * 80}
RECOMMENDATIONS
{"=" * 80}

"""

    # Add recommendations based on compliance status
    recommendations = []

    if not accuracy_compliant:
        recommendations.append(
            "⚠ Accuracy below 90% threshold. Consider:\n"
            "  - Reviewing prompt engineering\n"
            "  - Improving context retrieval quality\n"
            "  - Fine-tuning model on domain data"
        )

    if not hallucination_compliant:
        recommendations.append(
            "⚠ Hallucination rate above 5% threshold. Consider:\n"
            "  - Enabling stricter NLI contradiction detection\n"
            "  - Improving grounding verification\n"
            "  - Implementing human review for high-risk outputs"
        )

    if not robustness_compliant:
        recommendations.append(
            "⚠ Error rate above 5% threshold. Consider:\n"
            "  - Implementing retry logic\n"
            "  - Adding fallback mechanisms\n"
            "  - Improving error handling"
        )

    if stats["audit_retention_days"] < 180:
        recommendations.append(
            "⚠ Audit retention below 6-month minimum. Consider:\n"
            "  - Collecting more data over time\n"
            "  - Ensuring continuous logging is enabled"
        )

    if recommendations:
        for rec in recommendations:
            report += f"\n{rec}\n"
    else:
        report += "\n✓ No immediate actions required. System meets all compliance thresholds.\n"

    report += f"""
{"=" * 80}
IMPORTANT DISCLAIMERS
{"=" * 80}

This report is generated by CERT Framework, a technical monitoring tool.

- This report does NOT constitute legal compliance with the EU AI Act
- Compliance requires organizational processes beyond technical monitoring
- High-risk classification depends on your specific use case and deployment
- Seek professional legal advice for compliance strategy
- CERT provides monitoring tools to support compliance efforts

Official EU AI Act Resources:
- Article 15: https://artificialintelligenceact.eu/article/15/
- Article 19: https://artificialintelligenceact.eu/article/19/
- Compliance Checker: https://artificialintelligenceact.eu/assessment/

{"=" * 80}
END OF REPORT
{"=" * 80}
"""

    return report


def _generate_json_report(system_name: str, stats: Dict) -> str:
    """Generate JSON report."""
    report = {
        "report_type": "EU_AI_ACT_ARTICLE_15_COMPLIANCE",
        "system_name": system_name,
        "generated_at": datetime.now().isoformat(),
        "measurement_period": {
            "start": stats["period_start"],
            "end": stats["period_end"],
            "retention_days": stats["audit_retention_days"],
        },
        "article_15_1_accuracy": {
            "overall_accuracy": stats["mean_accuracy"],
            "semantic_accuracy": stats["mean_semantic_score"],
            "nli_score": stats["mean_nli_score"],
            "grounding_score": stats["mean_grounding_score"],
            "hallucination_rate": stats["hallucination_rate"],
            "compliance_rate": stats["compliance_rate"],
            "total_requests": stats["total_requests"],
            "compliant": stats["mean_accuracy"] >= 0.90,
        },
        "article_15_4_robustness": {
            "error_rate": stats["error_rate"],
            "success_rate": 1 - stats["error_rate"],
            "compliant": stats["error_rate"] <= 0.05,
        },
        "article_19_audit_trail": {
            "logging_enabled": stats["total_requests"] > 0,
            "total_requests_logged": stats["total_requests"],
            "retention_days": stats["audit_retention_days"],
            "minimum_required_days": 180,
            "compliant": stats["total_requests"] > 0,
        },
        "overall_compliance": {
            "status": "COMPLIANT"
            if (
                stats["mean_accuracy"] >= 0.90
                and stats["error_rate"] <= 0.05
                and stats["total_requests"] > 0
            )
            else "NON-COMPLIANT"
        },
    }

    return json.dumps(report, indent=2)


def _generate_csv_report(system_name: str, stats: Dict) -> str:
    """Generate CSV report."""
    lines = [
        "Metric,Value,Threshold,Status",
        f"Overall Accuracy,{stats['mean_accuracy']:.3f},0.90,{'PASS' if stats['mean_accuracy'] >= 0.90 else 'FAIL'}",
        f"Semantic Accuracy,{stats['mean_semantic_score']:.3f},N/A,N/A",
        f"NLI Score,{stats['mean_nli_score']:.3f},N/A,N/A",
        f"Grounding Score,{stats['mean_grounding_score']:.3f},N/A,N/A",
        f"Hallucination Rate,{stats['hallucination_rate']:.3f},0.05,{'PASS' if stats['hallucination_rate'] <= 0.05 else 'FAIL'}",
        f"Error Rate,{stats['error_rate']:.3f},0.05,{'PASS' if stats['error_rate'] <= 0.05 else 'FAIL'}",
        f"Total Requests,{stats['total_requests']},N/A,N/A",
        f"Compliance Rate,{stats['compliance_rate']:.3f},N/A,N/A",
        f"Retention Days,{stats['audit_retention_days']},180,{'PASS' if stats['audit_retention_days'] >= 180 else 'FAIL'}",
    ]

    return "\n".join(lines)
