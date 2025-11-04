"""
FastAPI backend for CERT Dashboard report generation.

This service handles PDF report generation requests from the Next.js dashboard.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel


# Pydantic models for request validation
class Measurement(BaseModel):
    confidence: float
    rule: str
    components_used: List[str]


class EvaluationResult(BaseModel):
    timestamp: str
    query: str
    response: Optional[str] = None
    measurement: Measurement
    passed: bool
    duration_ms: Optional[float] = None


class DateRange(BaseModel):
    start: str
    end: str


class EvaluationSummary(BaseModel):
    total_traces: int
    evaluated_traces: int
    passed_traces: int
    failed_traces: int
    accuracy: float
    mean_confidence: float
    threshold_used: float
    date_range: DateRange


class ReportMetadata(BaseModel):
    title: str
    organization: Optional[str] = ""
    evaluator: Optional[str] = ""
    notes: Optional[str] = ""
    generated_date: str


class ReportRequest(BaseModel):
    summary: EvaluationSummary
    results: List[EvaluationResult]
    metadata: ReportMetadata


# Initialize FastAPI app
app = FastAPI(title="CERT Report API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def generate_pdf_report(
    summary: EvaluationSummary, results: List[EvaluationResult], metadata: ReportMetadata
) -> bytes:
    """Generate PDF report from evaluation data."""
    try:
        from weasyprint import HTML
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="WeasyPrint not installed. Run: pip install weasyprint",
        )

    # Generate HTML content
    html_content = generate_html_report(summary, results, metadata)

    # Convert to PDF
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes


def generate_html_report(
    summary: EvaluationSummary, results: List[EvaluationResult], metadata: ReportMetadata
) -> str:
    """Generate HTML report with professional styling."""
    is_compliant = summary.accuracy >= 0.9

    # Classification of failed traces
    failed_results = [r for r in results if not r.passed]
    borderline_results = [
        r for r in results if 0.5 <= r.measurement.confidence < summary.threshold_used
    ]

    # Score distribution
    distribution = compute_score_distribution(results, summary.threshold_used)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{metadata.title}</title>
    <style>
        @page {{
            size: A4;
            margin: 2.5cm;
        }}

        body {{
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #112358;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }}

        .header {{
            border-bottom: 4px solid #3C6098;
            padding-bottom: 20px;
            margin-bottom: 30px;
            page-break-after: avoid;
        }}

        .logo-section {{
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }}

        .title {{
            font-size: 28pt;
            font-weight: 700;
            color: #3C6098;
            margin: 0;
        }}

        .subtitle {{
            font-size: 14pt;
            color: #718096;
            margin-top: 8px;
        }}

        .metadata-box {{
            background-color: #FBF5F0;
            border-left: 4px solid #3C6098;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        .metadata-row {{
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }}

        .metadata-label {{
            font-weight: 600;
            color: #718096;
        }}

        .metadata-value {{
            color: #112358;
            font-weight: 500;
        }}

        h1 {{
            font-size: 20pt;
            font-weight: 700;
            color: #3C6098;
            margin-top: 40px;
            margin-bottom: 20px;
            page-break-after: avoid;
        }}

        h2 {{
            font-size: 16pt;
            font-weight: 600;
            color: #112358;
            margin-top: 30px;
            margin-bottom: 15px;
            page-break-after: avoid;
        }}

        h3 {{
            font-size: 13pt;
            font-weight: 600;
            color: #112358;
            margin-top: 20px;
            margin-bottom: 10px;
            page-break-after: avoid;
        }}

        .status-banner {{
            padding: 24px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
            page-break-inside: avoid;
            background: {"linear-gradient(135deg, #48bb78 0%, #38a169 100%)" if is_compliant else "linear-gradient(135deg, #E48B59 0%, #dd6b20 100%)"};
            color: white;
        }}

        .status-icon {{
            font-size: 48pt;
            margin-bottom: 10px;
        }}

        .status-title {{
            font-size: 22pt;
            font-weight: 700;
            margin-bottom: 8px;
        }}

        .status-message {{
            font-size: 13pt;
            opacity: 0.95;
        }}

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
        }}

        .metric-card {{
            background: white;
            border: 2px solid #E6DDD6;
            border-radius: 8px;
            padding: 20px;
            page-break-inside: avoid;
        }}

        .metric-label {{
            font-size: 11pt;
            color: #718096;
            font-weight: 600;
            margin-bottom: 8px;
        }}

        .metric-value {{
            font-size: 36pt;
            font-weight: 700;
            color: #3C6098;
            line-height: 1;
        }}

        .metric-threshold {{
            font-size: 10pt;
            color: #718096;
            margin-top: 8px;
        }}

        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        th, td {{
            border: 1px solid #E6DDD6;
            padding: 12px;
            text-align: left;
        }}

        th {{
            background-color: #3C6098;
            color: white;
            font-weight: 600;
        }}

        tr:nth-child(even) {{
            background-color: #FBF5F0;
        }}

        .compliant {{
            color: #48bb78;
            font-weight: 700;
        }}

        .non-compliant {{
            color: #fc8181;
            font-weight: 700;
        }}

        .warning {{
            color: #E48B59;
            font-weight: 700;
        }}

        .info-box {{
            background-color: #E8F4F8;
            border-left: 4px solid #3C6098;
            padding: 16px;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        .warning-box {{
            background-color: #FEF3C7;
            border-left: 4px solid #E48B59;
            padding: 16px;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        .recommendation-box {{
            background-color: #F0F9FF;
            border: 2px solid #3C6098;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        .recommendation-title {{
            font-size: 14pt;
            font-weight: 700;
            color: #3C6098;
            margin-bottom: 12px;
        }}

        ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}

        li {{
            margin: 8px 0;
        }}

        .footer {{
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #E6DDD6;
            font-size: 9pt;
            color: #718096;
            text-align: center;
        }}

        .page-break {{
            page-break-before: always;
        }}
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="logo-section">
            <div style="flex: 1;">
                <h1 class="title">{metadata.title}</h1>
                <p class="subtitle">EU AI Act Article 15 Compliance Evaluation</p>
            </div>
        </div>
    </div>

    <!-- Report Metadata -->
    <div class="metadata-box">
        <div class="metadata-row">
            <span class="metadata-label">Organization:</span>
            <span class="metadata-value">{metadata.organization or "N/A"}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Evaluator:</span>
            <span class="metadata-value">{metadata.evaluator or "N/A"}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Report Generated:</span>
            <span class="metadata-value">{datetime.fromisoformat(metadata.generated_date.replace("Z", "+00:00")).strftime("%B %d, %Y at %I:%M %p UTC")}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Evaluation Period:</span>
            <span class="metadata-value">{summary.date_range.start} to {summary.date_range.end}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Threshold Used:</span>
            <span class="metadata-value">{summary.threshold_used:.2f}</span>
        </div>
    </div>

    {f'<div class="metadata-box"><p><strong>Notes:</strong> {metadata.notes}</p></div>' if metadata.notes else ""}

    <!-- Compliance Status Banner -->
    <div class="status-banner">
        <div class="status-icon">{"✓" if is_compliant else "⚠"}</div>
        <div class="status-title">
            {"COMPLIANT" if is_compliant else "NON-COMPLIANT"}
        </div>
        <div class="status-message">
            {f"System achieves {summary.accuracy * 100:.1f}% accuracy, meeting the 90% compliance threshold." if is_compliant else f"System achieves {summary.accuracy * 100:.1f}% accuracy. Below the 90% threshold. Action required."}
        </div>
    </div>

    <!-- Executive Summary -->
    <h1>Executive Summary</h1>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-label">Accuracy</div>
            <div class="metric-value" style="color: {"#48bb78" if summary.accuracy >= 0.9 else "#E48B59" if summary.accuracy >= 0.8 else "#fc8181"};">
                {summary.accuracy * 100:.1f}%
            </div>
            <div class="metric-threshold">Threshold: 90%</div>
        </div>

        <div class="metric-card">
            <div class="metric-label">Total Traces</div>
            <div class="metric-value">{summary.total_traces:,}</div>
            <div class="metric-threshold">Evaluated: {summary.evaluated_traces:,}</div>
        </div>

        <div class="metric-card">
            <div class="metric-label">Passed Traces</div>
            <div class="metric-value" style="color: #48bb78;">{summary.passed_traces:,}</div>
            <div class="metric-threshold">{summary.passed_traces / summary.total_traces * 100:.1f}% of total</div>
        </div>

        <div class="metric-card">
            <div class="metric-label">Failed Traces</div>
            <div class="metric-value" style="color: #fc8181;">{summary.failed_traces:,}</div>
            <div class="metric-threshold">{summary.failed_traces / summary.total_traces * 100:.1f}% of total</div>
        </div>
    </div>

    <h2>Mean Confidence Score</h2>
    <p>The average confidence score across all evaluations is <strong style="color: #3C6098;">{summary.mean_confidence:.3f}</strong> (threshold: {summary.threshold_used:.2f}).</p>

    <p>{"This indicates strong performance with most predictions highly confident." if summary.mean_confidence > 0.8 else "This suggests moderate performance near the boundary. Small improvements will significantly increase compliance."}</p>

    <!-- Detailed Evaluation Metrics -->
    <div class="page-break"></div>
    <h1>Detailed Evaluation Metrics</h1>

    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Assessment</th>
        </tr>
        <tr>
            <td>Total Traces Evaluated</td>
            <td>{summary.total_traces:,}</td>
            <td class="compliant">✓ Complete</td>
        </tr>
        <tr>
            <td>Accuracy Rate</td>
            <td>{summary.accuracy * 100:.2f}%</td>
            <td class="{"compliant" if summary.accuracy >= 0.9 else "non-compliant"}">
                {"✓ Meets Threshold" if summary.accuracy >= 0.9 else "✗ Below Threshold"}
            </td>
        </tr>
        <tr>
            <td>Mean Confidence</td>
            <td>{summary.mean_confidence:.3f}</td>
            <td class="{"compliant" if summary.mean_confidence > summary.threshold_used else "warning"}">
                {"✓ Above Threshold" if summary.mean_confidence > summary.threshold_used else "⚠ Near Threshold"}
            </td>
        </tr>
        <tr>
            <td>Passed Traces</td>
            <td>{summary.passed_traces:,}</td>
            <td class="compliant">Documented</td>
        </tr>
        <tr>
            <td>Failed Traces</td>
            <td>{summary.failed_traces:,}</td>
            <td class="{"compliant" if summary.failed_traces == 0 else "warning"}">
                {"✓ No Failures" if summary.failed_traces == 0 else "Requires Review"}
            </td>
        </tr>
    </table>

    <!-- Score Distribution Analysis -->
    <h1>Score Distribution Analysis</h1>

    <p>The following table shows how confidence scores are distributed across different ranges:</p>

    <table>
        <tr>
            <th>Score Range</th>
            <th>Count</th>
            <th>Percentage</th>
            <th>Status</th>
        </tr>
        {generate_distribution_rows(distribution)}
    </table>

    {generate_borderline_analysis(borderline_results, results, summary.threshold_used) if borderline_results else ""}

    <!-- Failed Trace Analysis -->
    {generate_failed_trace_section(failed_results, summary) if failed_results else '<div class="info-box"><p><strong>✓ No Failed Traces:</strong> All evaluated traces passed the compliance threshold.</p></div>'}

    <!-- Recommendations -->
    <div class="page-break"></div>
    <h1>Recommendations</h1>

    {generate_recommendations(summary, borderline_results, failed_results)}

    <!-- EU AI Act Compliance -->
    <h1>EU AI Act Compliance Reference</h1>

    <h2>Article 15: Accuracy, Robustness and Cybersecurity</h2>
    <p>This evaluation addresses the <strong>accuracy requirements</strong> of Article 15.1, which mandates that high-risk AI systems achieve appropriate levels of accuracy.</p>

    <div class="info-box">
        <p><strong>Article 15.1 Extract:</strong></p>
        <p style="font-style: italic; margin-left: 20px;">
            "High-risk AI systems shall be designed and developed in such a way that they achieve, in the light of their intended purpose, an appropriate level of accuracy, robustness and cybersecurity..."
        </p>
    </div>

    <h2>Article 19: Automatic Logging</h2>
    <p>All traces shown in this report have been automatically logged in compliance with Article 19 requirements, providing a complete audit trail for regulatory review.</p>

    <div class="info-box">
        <p><strong>Article 19.1 Extract:</strong></p>
        <p style="font-style: italic; margin-left: 20px;">
            "High-risk AI systems shall be designed and developed with capabilities enabling the automatic recording of events (logs) while the high-risk AI systems are operating..."
        </p>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Generated by CERT Framework</strong></p>
        <p>This report provides technical documentation for EU AI Act compliance evaluation</p>
        <p>Report ID: {metadata.generated_date}</p>
    </div>
</body>
</html>"""


def compute_score_distribution(results: List[EvaluationResult], threshold: float) -> Dict[str, Any]:
    """Compute score distribution across buckets."""
    ranges = [
        {"min": 0.0, "max": 0.1, "label": "0.0-0.1"},
        {"min": 0.1, "max": 0.2, "label": "0.1-0.2"},
        {"min": 0.2, "max": 0.3, "label": "0.2-0.3"},
        {"min": 0.3, "max": 0.4, "label": "0.3-0.4"},
        {"min": 0.4, "max": 0.5, "label": "0.4-0.5"},
        {"min": 0.5, "max": 0.6, "label": "0.5-0.6"},
        {"min": 0.6, "max": threshold, "label": f"0.6-{threshold:.1f}"},
        {"min": threshold, "max": 0.8, "label": f"{threshold:.1f}-0.8"},
        {"min": 0.8, "max": 0.9, "label": "0.8-0.9"},
        {"min": 0.9, "max": 1.0, "label": "0.9-1.0"},
    ]

    total = len(results)
    buckets = []

    for idx, range_def in enumerate(ranges):
        is_last_bucket = idx == len(ranges) - 1
        count = sum(
            1
            for r in results
            if r.measurement.confidence >= range_def["min"]
            and (
                r.measurement.confidence <= range_def["max"]
                if is_last_bucket
                else r.measurement.confidence < range_def["max"]
            )
        )

        # Determine status
        status = "pass"
        if range_def["max"] <= 0.5:
            status = "fail"
        elif range_def["max"] <= threshold:
            status = "warn"

        buckets.append(
            {
                "label": range_def["label"],
                "count": count,
                "percentage": (count / total * 100) if total > 0 else 0,
                "status": status,
            }
        )

    return {"buckets": buckets, "total": total}


def generate_distribution_rows(distribution: Dict[str, Any]) -> str:
    """Generate HTML table rows for distribution."""
    rows = []
    for bucket in distribution["buckets"]:
        status_class = (
            "non-compliant"
            if bucket["status"] == "fail"
            else "warning"
            if bucket["status"] == "warn"
            else "compliant"
        )
        status_label = (
            "Failed"
            if bucket["status"] == "fail"
            else "Borderline"
            if bucket["status"] == "warn"
            else "Passed"
        )

        rows.append(
            f"""<tr>
            <td>{bucket["label"]}</td>
            <td>{bucket["count"]}</td>
            <td>{bucket["percentage"]:.1f}%</td>
            <td class="{status_class}">{status_label}</td>
        </tr>"""
        )

    return "\n".join(rows)


def generate_borderline_analysis(
    borderline_results: List[EvaluationResult],
    all_results: List[EvaluationResult],
    threshold: float,
) -> str:
    """Generate borderline trace analysis section."""
    borderline_count = len(borderline_results)
    borderline_percent = (borderline_count / len(all_results) * 100) if all_results else 0

    return f"""
    <div class="warning-box">
        <h3 style="margin-top: 0;">⚠ Critical Finding: Borderline Cases</h3>
        <p><strong>{borderline_count} traces ({borderline_percent:.1f}%)</strong> scored between 0.5-{threshold:.1f} - just below or near the threshold.</p>
        <p>These represent borderline cases where small improvements could significantly increase compliance. Focus engineering effort here for maximum impact.</p>
    </div>
    """


def generate_failed_trace_section(
    failed_results: List[EvaluationResult], summary: EvaluationSummary
) -> str:
    """Generate failed trace analysis section."""
    return f"""
    <h1>Failed Trace Analysis</h1>

    <p>A total of <strong>{len(failed_results)}</strong> traces failed to meet the compliance threshold of {summary.threshold_used:.2f}.</p>

    <h2>Sample Failed Traces</h2>
    <p>Below are examples of failed traces for review:</p>

    <table>
        <tr>
            <th>Query</th>
            <th>Confidence</th>
            <th>Timestamp</th>
        </tr>
        {generate_failed_trace_rows(failed_results[:10])}
    </table>

    <p><em>Note: Only the first 10 failed traces are shown. Complete trace data is available in the source evaluation file.</em></p>
    """


def generate_failed_trace_rows(failed_results: List[EvaluationResult]) -> str:
    """Generate HTML table rows for failed traces."""
    rows = []
    for result in failed_results:
        query_preview = result.query[:80] + "..." if len(result.query) > 80 else result.query
        rows.append(
            f"""<tr>
            <td>{query_preview}</td>
            <td class="non-compliant">{result.measurement.confidence:.3f}</td>
            <td>{result.timestamp}</td>
        </tr>"""
        )

    return "\n".join(rows)


def generate_recommendations(
    summary: EvaluationSummary,
    borderline_results: List[EvaluationResult],
    failed_results: List[EvaluationResult],
) -> str:
    """Generate recommendations based on evaluation results."""
    recommendations = []

    if summary.accuracy < 0.9:
        recommendations.append(
            {
                "priority": "HIGH",
                "title": "Improve Overall Accuracy",
                "description": f"Current accuracy is {summary.accuracy * 100:.1f}%, below the 90% compliance threshold. Review failed traces to identify systematic issues.",
            }
        )

    if borderline_results:
        borderline_percent = len(borderline_results) / summary.total_traces * 100
        recommendations.append(
            {
                "priority": "HIGH",
                "title": "Address Borderline Cases",
                "description": f"{len(borderline_results)} traces ({borderline_percent:.1f}%) are just below the threshold. Small improvements here will have maximum impact on compliance.",
            }
        )

    if summary.mean_confidence < summary.threshold_used + 0.1:
        recommendations.append(
            {
                "priority": "MEDIUM",
                "title": "Increase Confidence Margin",
                "description": f"Mean confidence ({summary.mean_confidence:.3f}) is close to the threshold ({summary.threshold_used:.2f}). Increase the margin to improve system resilience.",
            }
        )

    if failed_results:
        recommendations.append(
            {
                "priority": "MEDIUM",
                "title": "Analyze Failed Trace Patterns",
                "description": f"Review the {len(failed_results)} failed traces to identify common patterns (incomplete responses, missing information, irrelevant content).",
            }
        )

    recommendations.append(
        {
            "priority": "LOW",
            "title": "Continuous Monitoring",
            "description": "Implement regular evaluation cycles to track compliance trends and catch degradation early.",
        }
    )

    html = ""
    for rec in recommendations:
        priority_color = (
            "#fc8181"
            if rec["priority"] == "HIGH"
            else "#E48B59"
            if rec["priority"] == "MEDIUM"
            else "#3C6098"
        )
        html += f"""
        <div class="recommendation-box" style="border-color: {priority_color};">
            <div class="recommendation-title" style="color: {priority_color};">
                {rec["priority"]} PRIORITY: {rec["title"]}
            </div>
            <p>{rec["description"]}</p>
        </div>
        """

    return html


@app.post("/api/generate-report")
async def generate_report(request: ReportRequest):
    """Generate PDF report from evaluation data."""
    try:
        # Generate PDF
        pdf_bytes = generate_pdf_report(request.summary, request.results, request.metadata)

        # Return PDF with proper headers
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="cert_report_{datetime.now().strftime("%Y-%m-%d")}.pdf"'
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "CERT Report API"}


if __name__ == "__main__":
    import os

    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
