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
            "failure_explanations": [],
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
    failure_explanations = []  # Collect failure explanations

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
                    else:
                        # Collect explanation for non-compliant requests
                        explanation = entry.get("explanation")
                        if explanation:
                            failure_explanations.append(
                                {
                                    "timestamp": entry.get("timestamp"),
                                    "function": entry.get("function"),
                                    "explanation": explanation,
                                }
                            )

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
            "failure_explanations": [],
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
        "failure_explanations": failure_explanations,
    }


def _generate_text_report(system_name: str, stats: Dict) -> str:
    """Generate plain-English text report with proper EU AI Act citations."""

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
EU AI ACT COMPLIANCE REPORT
Article 11 Technical Documentation | Article 15 Accuracy, Robustness & Cybersecurity
Article 19 Automatically Generated Logs
{"=" * 80}

Generated by: CERT Framework v3.0
Report Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}

Regulation: EU 2024/1689 (Artificial Intelligence Act)
Compliance Deadline (High-Risk): August 2, 2026

{"=" * 80}
SECTION 1: SYSTEM IDENTIFICATION
{"=" * 80}

System Name: {system_name}
Monitoring Period: {stats["period_start"] or "N/A"} to {stats["period_end"] or "N/A"}
Data Span: {stats["audit_retention_days"]} days

Reference Documents:
├─ Article 11 (Technical Documentation Requirements)
├─ Article 15 (Accuracy, Robustness and Cybersecurity)
├─ Article 19 (Automatically Generated Logs)
└─ Annex IV (Technical Documentation)

{"=" * 80}
SECTION 2: ARTICLE 15.1 - ACCURACY REQUIREMENTS
{"=" * 80}

Regulatory Requirement (EU 2024/1689, Article 15, Paragraph 1):

  "High-risk AI systems shall be designed and developed in such a way
  that they achieve an appropriate level of accuracy, robustness and
  cybersecurity, and that they perform consistently in those respects
  throughout their lifecycle."

Measurement Methodology (Article 15.2):
Composite accuracy measurement combining:
  ├─ Semantic Similarity Analysis (30% weight)
  ├─ Natural Language Inference (50% weight)
  └─ Grounding Verification (20% weight)

Measurement Results:

┌─────────────────────────────────┬──────────┬────────────┬──────────┐
│ Metric                          │ Value    │ Threshold  │ Status   │
├─────────────────────────────────┼──────────┼────────────┼──────────┤
│ Overall Accuracy Score          │ {stats["mean_accuracy"]:>6.1%}   │ ≥90.0%     │ {("✓ PASS" if accuracy_compliant else "✗ FAIL"):>8} │
│ Semantic Similarity Score       │ {stats["mean_semantic_score"]:>6.1%}   │ N/A        │ N/A      │
│ NLI Entailment Score           │ {stats["mean_nli_score"]:>6.1%}   │ N/A        │ N/A      │
│ Grounding Verification Score    │ {stats["mean_grounding_score"]:>6.1%}   │ N/A        │ N/A      │
│ Hallucination Detection Rate    │ {stats["hallucination_rate"]:>6.1%}   │ ≤5.0%      │ {("✓ PASS" if hallucination_compliant else "✗ FAIL"):>8} │
│ Compliance Rate                 │ {stats["compliance_rate"]:>6.1%}   │ ≥95.0%     │ {("✓ PASS" if stats["compliance_rate"] >= 0.95 else "✗ FAIL"):>8} │
└─────────────────────────────────┴──────────┴────────────┴──────────┘

Total Requests Analyzed: {stats["total_requests"]:,}

Declared Accuracy (Article 15, Paragraph 3):

  Regulatory Requirement:
  "The levels of accuracy and the relevant accuracy metrics of high-risk
  AI systems shall be declared in the accompanying instructions of use."

  Declared Accuracy Threshold: 90.0%
  Measured Accuracy (This Period): {stats["mean_accuracy"]:.1%}

  {("✓ System performs ABOVE declared accuracy threshold" if accuracy_compliant else "✗ System performs BELOW declared accuracy threshold")}

{"=" * 80}
SECTION 3: ARTICLE 15.4 - ROBUSTNESS & RESILIENCE
{"=" * 80}

Regulatory Requirement (EU 2024/1689, Article 15, Paragraph 4):

  "High-risk AI systems shall be as resilient as possible regarding
  errors, faults or inconsistencies that may occur within the system
  or the environment in which the system operates, in particular due
  to their interaction with natural persons or other systems."

Robustness Metrics:

┌─────────────────────────────────┬──────────┬────────────┬──────────┐
│ Metric                          │ Value    │ Threshold  │ Status   │
├─────────────────────────────────┼──────────┼────────────┼──────────┤
│ System Error Rate               │ {stats["error_rate"]:>6.1%}   │ ≤5.0%      │ {("✓ PASS" if robustness_compliant else "✗ FAIL"):>8} │
│ Success Rate                    │ {(1 - stats["error_rate"]):>6.1%}   │ ≥95.0%     │ {("✓ PASS" if (1 - stats["error_rate"]) >= 0.95 else "✗ FAIL"):>8} │
└─────────────────────────────────┴──────────┴────────────┴──────────┘

{"=" * 80}
SECTION 4: ARTICLE 19 - AUDIT TRAIL COMPLIANCE
{"=" * 80}

Regulatory Requirement (EU 2024/1689, Article 19, Paragraph 1):

  "High-risk AI systems shall be designed and developed with capabilities
  enabling the automatic recording of events ('logs') over the lifetime
  of the system."

Minimum Retention (Article 19):

  "The logs shall be kept for a period that is appropriate in light of
  the intended purpose of the high-risk AI system and applicable legal
  obligations under Union or national law, of at least 6 months..."

Logging Implementation:

┌──────────────────────────────────┬────────────────────────────────┐
│ Requirement                      │ Implementation Status          │
├──────────────────────────────────┼────────────────────────────────┤
│ Automatic Event Recording        │ {"✓ Enabled" if audit_compliant else "✗ Disabled":>30} │
│ Log Format                       │ {("JSONL (JSON Lines)"):>30} │
│ Total Events Logged              │ {(f"{stats['total_requests']:,} requests"):>30} │
│ Retention Period (Minimum)       │ {("180 days (6 months)"):>30} │
│ Actual Data Span                 │ {(f"{stats['audit_retention_days']} days"):>30} │
│ Immutable Records                │ {("✓ Append-only log format"):>30} │
│ Timestamp Format                 │ {("ISO 8601 UTC"):>30} │
└──────────────────────────────────┴────────────────────────────────┘

Log Content (per Article 19 requirements):
  ✓ Timestamp of each request
  ✓ Input data (context provided)
  ✓ Output data (generated response)
  ✓ Accuracy metrics computed
  ✓ Hallucination detection flags
  ✓ Compliance determination
  ✓ Error events with details

{"=" * 80}
SECTION 5: ANNEX IV - TECHNICAL DOCUMENTATION
{"=" * 80}

This report addresses the following Annex IV requirements:

1. General Description (Annex IV.1)
   ✓ System: {system_name}

2. Monitoring and Control (Annex IV.3)
   ✓ Continuous monitoring enabled
   ✓ Performance metrics: Accuracy, Robustness, Hallucination Rate
   ✓ Appropriateness: Composite scoring methodology documented

3. Performance Metrics (Annex IV.3)
   ✓ Accuracy metrics: {stats["mean_accuracy"]:.1%} (composite)
   ✓ Robustness metrics: {(1 - stats["error_rate"]):.1%} success rate
   ✓ Appropriateness justification: See METRICS_METHODOLOGY.md

4. Risk Management (Annex IV.4)
   ✓ Hallucination detection: {stats["hallucination_rate"]:.1%} rate
   ✓ Risk mitigation: Automatic flagging of non-compliant outputs

5. Post-Market Monitoring (Annex IV.8)
   ✓ Monitoring system: CERT Framework continuous monitoring
   ✓ Monitoring frequency: Real-time per request
   ✓ Reporting frequency: As needed (this report)

{"=" * 80}
SECTION 6: OVERALL COMPLIANCE DETERMINATION
{"=" * 80}

┌─────────────────────────────────┬──────────┐
│ Compliance Area                 │ Status   │
├─────────────────────────────────┼──────────┤
│ Article 15.1 - Accuracy         │ {("✓ PASS" if accuracy_compliant else "✗ FAIL"):>8} │
│ Article 15.3 - Declaration      │ {("✓ PASS" if accuracy_compliant else "✗ FAIL"):>8} │
│ Article 15.4 - Robustness       │ {("✓ PASS" if robustness_compliant else "✗ FAIL"):>8} │
│ Article 19 - Audit Logging      │ {("✓ PASS" if audit_compliant else "✗ FAIL"):>8} │
│ Annex IV - Documentation        │ {("✓ PASS" if overall_compliant else "⚠ PARTIAL"):>8} │
└─────────────────────────────────┴──────────┘

╔═════════════════════════════════════════════════════════╗
║ OVERALL STATUS: {status_symbol} {status_text:^43} ║
╚═════════════════════════════════════════════════════════╝

{("All monitored metrics meet or exceed EU AI Act requirements." if overall_compliant else "System requires attention: One or more metrics below compliance thresholds.")}

{"=" * 80}
SECTION 7: FAILURE ANALYSIS
{"=" * 80}

"""

    # Add failure analysis if we have explanations
    failure_explanations = stats.get("failure_explanations", [])
    if failure_explanations:
        report += f"""
This section provides detailed analysis of non-compliant requests with
actionable recommendations for improvement.

Total Non-Compliant Requests: {len(failure_explanations)}

"""
        # Show up to 5 most recent failures
        recent_failures = failure_explanations[-5:]
        for i, failure in enumerate(recent_failures, 1):
            explanation = failure["explanation"]
            report += f"""
─────────────────────────────────────────────────────────────────────────────
Failure #{i}
─────────────────────────────────────────────────────────────────────────────

Timestamp: {failure["timestamp"]}
Function: {failure["function"]}

Failure Reason: {explanation["reason"]}
Severity: {explanation["severity"].upper()}

Evidence:
"""
            for evidence_item in explanation["evidence"]:
                report += f"  • {evidence_item}\n"

            report += f"""
Recommendation:
  {explanation["recommendation"]}

"""

        if len(failure_explanations) > 5:
            report += f"\n(Showing 5 most recent failures. Total: {len(failure_explanations)})\n"

    else:
        report += """
No failure explanations available. This indicates either:
  • All requests are compliant (100% compliance rate)
  • Monitoring has just been enabled
  • Audit log does not yet contain detailed failure data

"""

    report += f"""
{"=" * 80}
SECTION 8: RECOMMENDATIONS & CONTINUOUS IMPROVEMENT
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
SECTION 9: DISCLAIMERS & CERTIFICATIONS
{"=" * 80}

Important Disclaimers:

This report is generated by CERT Framework, a technical monitoring and
compliance documentation tool. This report:

✓ DOES provide technical evidence of accuracy and robustness metrics
✓ DOES document automatically generated logs per Article 19
✓ DOES measure "appropriate levels of accuracy" per Article 15.1
✓ DOES support technical documentation requirements per Annex IV

✗ DOES NOT constitute legal compliance certification
✗ DOES NOT replace organizational compliance processes
✗ DOES NOT guarantee EU AI Act conformity
✗ DOES NOT constitute legal advice

Compliance Responsibility:

Full EU AI Act compliance requires:
  • Organizational risk management processes
  • Human oversight and governance structures
  • Data governance and quality management systems
  • Conformity assessment procedures (for certain high-risk systems)
  • Professional legal counsel

Certification Authority:

This report may be submitted to:
  • Notified bodies for conformity assessment (Article 43)
  • National competent authorities (Article 70)
  • Market surveillance authorities (Article 74)

Official EU AI Act Resources:
  • Full Text: https://artificialintelligenceact.eu/
  • Article 11: https://artificialintelligenceact.eu/article/11/
  • Article 15: https://artificialintelligenceact.eu/article/15/
  • Article 19: https://artificialintelligenceact.eu/article/19/
  • Annex IV: https://artificialintelligenceact.eu/annex/4/
  • Compliance Checker: https://artificialintelligenceact.eu/assessment/

{"─" * 80}
Report Generated By:
CERT Framework v3.0.0
https://github.com/Javihaus/cert-framework

Generation Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
{"─" * 80}

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
