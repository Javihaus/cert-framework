"""
Convert ComplianceReport to HTML/JSON.
No business logic here - just formatting.
"""

from typing import Dict

from .analyzer import ComplianceReport


def to_json(result: ComplianceReport) -> Dict:
    """Convert to JSON for API responses."""
    return {
        "system_name": result.system_name,
        "system_version": result.system_version,
        "report_date": result.report_date,
        "article_15": {
            "compliant": result.article_15.is_compliant,
            "accuracy_score": result.article_15.accuracy_score,
            "total_requests": result.article_15.total_requests,
            "failed_requests": result.article_15.failed_requests,
            "error_rate": result.article_15.error_rate,
            "avg_response_time_ms": result.article_15.avg_response_time_ms,
            "issues": result.article_15.issues,
        },
        "annex_iv": {
            "complete": result.annex_iv.is_complete,
            "section_1_general_description": result.annex_iv.section_1_general_description,
            "section_2_system_elements": result.annex_iv.section_2_system_elements,
            "section_3_monitoring": result.annex_iv.section_3_monitoring,
            "section_4_data_governance": result.annex_iv.section_4_data_governance,
            "missing_sections": result.annex_iv.missing_sections,
        },
        "overall_compliant": result.overall_compliant,
        "risk_score": result.risk_score,
    }


def to_html(result: ComplianceReport) -> str:
    """Convert to HTML for dashboard display."""
    status_color = (
        "green" if result.risk_score < 0.3 else "orange" if result.risk_score < 0.7 else "red"
    )
    status_text = (
        "Low Risk"
        if result.risk_score < 0.3
        else "Medium Risk"
        if result.risk_score < 0.7
        else "High Risk"
    )

    html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>EU AI Act Compliance Report</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
        }}
        .header {{
            border-bottom: 3px solid #1A365D;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        h1 {{
            color: #1A365D;
            margin: 0 0 10px 0;
        }}
        .metadata {{
            color: #666;
            font-size: 14px;
        }}
        .risk-score {{
            background: {status_color};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 18px;
            font-weight: bold;
        }}
        .section {{
            margin: 30px 0;
            padding: 20px;
            background: #f5f5f5;
            border-left: 4px solid #1A365D;
        }}
        h2 {{
            color: #1A365D;
            margin-top: 0;
        }}
        .status {{
            font-weight: bold;
            font-size: 16px;
        }}
        .compliant {{
            color: green;
        }}
        .non-compliant {{
            color: red;
        }}
        ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        li {{
            margin: 5px 0;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
        }}
        .metric {{
            background: white;
            padding: 10px;
            border-radius: 3px;
        }}
        .metric-label {{
            color: #666;
            font-size: 12px;
        }}
        .metric-value {{
            font-size: 18px;
            font-weight: bold;
            color: #1A365D;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>EU AI Act Compliance Report</h1>
        <div class="metadata">
            <strong>System:</strong> {result.system_name} v{result.system_version}<br>
            <strong>Generated:</strong> {result.report_date}
        </div>
    </div>

    <div class="risk-score">
        Overall Risk: {status_text} ({result.risk_score:.2f})
    </div>

    <div class="section">
        <h2>Article 15: Accuracy, Robustness & Cybersecurity</h2>
        <p class="status {"compliant" if result.article_15.is_compliant else "non-compliant"}">
            Status: {"✓ Compliant" if result.article_15.is_compliant else "✗ Non-Compliant"}
        </p>

        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Accuracy Score</div>
                <div class="metric-value">{result.article_15.accuracy_score:.2%}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Error Rate</div>
                <div class="metric-value">{result.article_15.error_rate:.2%}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Total Requests</div>
                <div class="metric-value">{result.article_15.total_requests}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Failed Requests</div>
                <div class="metric-value">{result.article_15.failed_requests}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Response Time</div>
                <div class="metric-value">{result.article_15.avg_response_time_ms:.0f}ms</div>
            </div>
        </div>

        {_format_issues_html(result.article_15.issues)}
    </div>

    <div class="section">
        <h2>Annex IV: Technical Documentation</h2>
        <p class="status {"compliant" if result.annex_iv.is_complete else "non-compliant"}">
            Status: {"✓ Complete" if result.annex_iv.is_complete else "✗ Incomplete"}
        </p>

        <h3>Section 1: General Description</h3>
        <ul>
            <li><strong>System Name:</strong> {result.annex_iv.section_1_general_description.get("system_name", "N/A")}</li>
            <li><strong>Provider:</strong> {result.annex_iv.section_1_general_description.get("provider_name", "N/A")}</li>
            <li><strong>Intended Purpose:</strong> {result.annex_iv.section_1_general_description.get("intended_purpose", "Not specified")}</li>
        </ul>

        <h3>Section 3: Monitoring</h3>
        <ul>
            <li><strong>Total Inferences:</strong> {result.annex_iv.section_3_monitoring.get("total_inferences", 0)}</li>
            <li><strong>Monitoring Period:</strong> {result.annex_iv.section_3_monitoring.get("monitoring_period_days", 0)} days</li>
            <li><strong>Logging Status:</strong> {"Enabled" if result.annex_iv.section_3_monitoring.get("logging_enabled") else "Disabled"}</li>
        </ul>

        {_format_issues_html(result.annex_iv.missing_sections, "Missing Documentation:")}
    </div>

    <div class="section">
        <h2>Overall Compliance Summary</h2>
        <p class="status {"compliant" if result.overall_compliant else "non-compliant"}">
            {"✓ System is compliant with EU AI Act requirements" if result.overall_compliant else "✗ System has compliance gaps that must be addressed"}
        </p>
    </div>
</body>
</html>
"""
    return html


def _format_issues_html(issues: list, title: str = "Issues Identified:") -> str:
    """Helper to format issues list as HTML."""
    if not issues:
        return ""

    items = "".join(f"<li>{issue}</li>" for issue in issues)
    return f"""
        <h3>{title}</h3>
        <ul>{items}</ul>
    """
