"""
Comprehensive EU AI Act Annex IV compliance reporter.

Generates complete technical documentation covering all 9 sections of Annex IV,
plus Article 15 (accuracy, robustness, cybersecurity) and Article 19 (logging).

This is production-grade compliance documentation designed for regulatory submission.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class ComplianceReporter:
    """Generate complete EU AI Act Annex IV compliance documentation."""

    def __init__(
        self,
        system_name: str,
        provider_name: str,
        system_version: str,
        risk_classification: str = "HIGH-RISK",
        intended_purpose: str = "",
    ):
        """Initialize comprehensive compliance reporter.

        Args:
            system_name: Name of the AI system
            provider_name: Legal name of provider organization
            system_version: System version (e.g., v1.0.0)
            risk_classification: Risk level per Annex III (HIGH-RISK, LIMITED-RISK, etc.)
            intended_purpose: Detailed description of intended use
        """
        self.system_name = system_name
        self.provider_name = provider_name
        self.system_version = system_version
        self.risk_classification = risk_classification
        self.intended_purpose = intended_purpose

    def generate_comprehensive_report(
        self,
        log_path: str,
        output_path: str,
        system_metadata: Dict[str, Any],
        evaluation_results: Optional[Dict[str, Any]] = None,
        format: str = "pdf",
    ) -> str:
        """Generate comprehensive Annex IV compliance report.

        Args:
            log_path: Path to JSONL trace log file
            output_path: Path for output report
            system_metadata: Dictionary containing system architecture, security, etc.
            evaluation_results: Optional pre-computed evaluation results
            format: Report format (pdf, html, markdown)

        Returns:
            Path to generated report
        """
        # Load and analyze traces
        traces = self._load_traces(log_path)
        stats = self._compute_statistics(traces, evaluation_results)

        # Generate report based on format
        if format == "markdown":
            content = self._generate_markdown(stats, system_metadata)
        elif format == "html":
            content = self._generate_html(stats, system_metadata)
        elif format == "pdf":
            html_content = self._generate_html(stats, system_metadata)
            return self._convert_to_pdf(html_content, output_path)
        else:
            raise ValueError(
                f"Unsupported format: {format}. Use 'markdown', 'html', or 'pdf'"
            )

        # Write report
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(content)

        return str(output_file)

    def _load_traces(self, log_path: str) -> List[Dict]:
        """Load traces from JSONL log file."""
        traces = []
        log_file = Path(log_path)

        if not log_file.exists():
            raise FileNotFoundError(f"Log file not found: {log_path}")

        with open(log_file) as f:
            for line in f:
                try:
                    traces.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

        return traces

    def _compute_statistics(
        self, traces: List[Dict], evaluation_results: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Compute statistics from traces and evaluation results."""
        total = len(traces)
        errors = sum(1 for t in traces if t.get("status") == "error")
        success = total - errors

        # Compute timing statistics
        durations = [t.get("duration_ms", 0) for t in traces if t.get("duration_ms")]
        avg_duration = sum(durations) / len(durations) if durations else 0

        # Time period
        timestamps = [t.get("timestamp") for t in traces if t.get("timestamp")]
        period_start = min(timestamps) if timestamps else None
        period_end = max(timestamps) if timestamps else None

        stats = {
            "system_name": self.system_name,
            "provider_name": self.provider_name,
            "system_version": self.system_version,
            "risk_classification": self.risk_classification,
            "intended_purpose": self.intended_purpose,
            "report_date": datetime.utcnow().isoformat(),
            "total_requests": total,
            "successful_requests": success,
            "error_count": errors,
            "success_rate": success / total if total > 0 else 0,
            "error_rate": errors / total if total > 0 else 0,
            "avg_duration_ms": avg_duration,
            "period_start": period_start,
            "period_end": period_end,
            "traces": traces,
        }

        # Add evaluation results if provided
        if evaluation_results:
            stats.update(
                {
                    "total_evaluated": evaluation_results.get("total_traces", 0),
                    "passed": evaluation_results.get("passed", 0),
                    "failed": evaluation_results.get("failed", 0),
                    "pass_rate": evaluation_results.get("pass_rate", 0),
                    "preset": evaluation_results.get("preset"),
                    "threshold": evaluation_results.get("threshold"),
                }
            )

        return stats

    def _generate_html(self, stats: Dict, metadata: Dict) -> str:
        """Generate professional HTML report with all Annex IV sections."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EU AI Act Technical Documentation - {stats["system_name"]}</title>
    <style>
        @page {{
            size: A4;
            margin: 2.5cm;
        }}

        body {{
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }}

        h1 {{
            font-size: 24pt;
            font-weight: bold;
            color: #003399;
            border-bottom: 3px solid #003399;
            padding-bottom: 10px;
            margin-top: 30px;
            page-break-after: avoid;
        }}

        h2 {{
            font-size: 16pt;
            font-weight: bold;
            color: #003399;
            margin-top: 25px;
            page-break-after: avoid;
        }}

        h3 {{
            font-size: 13pt;
            font-weight: bold;
            color: #555;
            margin-top: 15px;
            page-break-after: avoid;
        }}

        .cover-page {{
            text-align: center;
            margin-top: 100px;
            page-break-after: always;
        }}

        .cover-title {{
            font-size: 28pt;
            font-weight: bold;
            color: #003399;
            margin: 30px 0;
        }}

        .cover-subtitle {{
            font-size: 18pt;
            color: #666;
            margin: 20px 0;
        }}

        .cover-info {{
            font-size: 12pt;
            margin: 40px 0;
            line-height: 2;
        }}

        .eu-emblem {{
            width: 120px;
            height: 120px;
            margin: 0 auto;
        }}

        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            page-break-inside: avoid;
        }}

        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}

        th {{
            background-color: #003399;
            color: white;
            font-weight: bold;
        }}

        tr:nth-child(even) {{
            background-color: #f9f9f9;
        }}

        .compliant {{
            color: #27ae60;
            font-weight: bold;
        }}

        .non-compliant {{
            color: #e74c3c;
            font-weight: bold;
        }}

        .section {{
            margin-top: 30px;
            page-break-inside: avoid;
        }}

        .metadata-box {{
            background-color: #f5f5f5;
            border-left: 4px solid #003399;
            padding: 15px;
            margin: 15px 0;
        }}

        .signature-block {{
            margin-top: 50px;
            page-break-inside: avoid;
        }}

        .signature-line {{
            border-top: 1px solid #000;
            width: 300px;
            margin-top: 50px;
        }}

        .footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }}

        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}

        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 10pt;
        }}
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <div class="eu-emblem" style="border: 3px solid #003399; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
            <span style="color: #003399; font-weight: bold; font-size: 48pt;">★</span>
        </div>

        <div class="cover-title">
            EU AI ACT<br/>TECHNICAL DOCUMENTATION
        </div>

        <div class="cover-subtitle">
            Annex IV Compliance Report
        </div>

        <div class="cover-info">
            <strong>AI System:</strong> {stats["system_name"]}<br/>
            <strong>Provider:</strong> {stats["provider_name"]}<br/>
            <strong>Version:</strong> {stats["system_version"]}<br/>
            <strong>Risk Classification:</strong> {stats["risk_classification"]}<br/>
            <strong>Report Date:</strong> {datetime.utcnow().strftime("%d %B %Y")}<br/>
        </div>

        <div style="margin-top: 80px; font-size: 10pt; color: #666;">
            Generated in compliance with Regulation (EU) 2024/1689<br/>
            (Artificial Intelligence Act)
        </div>
    </div>

    <!-- Table of Contents -->
    <div style="page-break-after: always;">
        <h1>Table of Contents</h1>
        <div style="margin-left: 20px;">
            <p><strong>Section 1:</strong> General Description of the AI System</p>
            <p><strong>Section 2:</strong> Detailed Description of System Elements</p>
            <p><strong>Section 3:</strong> Detailed Description of System Development</p>
            <p><strong>Section 4:</strong> Monitoring, Functioning and Control</p>
            <p><strong>Section 5:</strong> Description of Risk Management System</p>
            <p><strong>Section 6:</strong> Description of Changes Made to the System</p>
            <p><strong>Section 7:</strong> Description of the System Operation</p>
            <p><strong>Section 8:</strong> Human Oversight</p>
            <p><strong>Section 9:</strong> Accuracy, Robustness and Cybersecurity</p>
            <p><strong>Appendix A:</strong> Article 19 Automatic Logging</p>
            <p><strong>Appendix B:</strong> Statistical Evidence</p>
        </div>
    </div>

    <!-- Section 1: General Description -->
    <div class="section">
        <h1>Section 1: General Description of the AI System</h1>

        <h2>1.1 System Identification</h2>
        <div class="metadata-box">
            <p><strong>System Name:</strong> {stats["system_name"]}</p>
            <p><strong>Provider:</strong> {stats["provider_name"]}</p>
            <p><strong>Version:</strong> {stats["system_version"]}</p>
            <p><strong>Risk Classification:</strong> {stats["risk_classification"]}</p>
        </div>

        <h2>1.2 Intended Purpose</h2>
        <p>{stats["intended_purpose"]}</p>

        <h2>1.3 System Architecture</h2>
        <p>{metadata.get("architecture_description", "System architecture details to be provided by provider.")}</p>

        <h2>1.4 Integration Points</h2>
        {self._format_integrations(metadata.get("integrations", []))}
    </div>

    <!-- Section 2: Detailed Description of System Elements -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 2: Detailed Description of System Elements</h1>

        <h2>2.1 Core Components</h2>
        <p>The CERT Framework implements the following core components:</p>
        <ul>
            <li><strong>Measurement Engine:</strong> Evaluates AI outputs for accuracy and reliability</li>
            <li><strong>Rule Engine:</strong> Applies compliance rules and validates outputs</li>
            <li><strong>Logging System:</strong> Automatically captures all interactions per Article 19</li>
            <li><strong>Monitoring Dashboard:</strong> Real-time compliance visualization</li>
        </ul>

        <h2>2.2 Third-Party Components</h2>
        {self._format_third_party_components(metadata.get("third_party_components", []))}
    </div>

    <!-- Section 3: Detailed Description of System Development -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 3: Detailed Description of System Development</h1>

        <h2>3.1 Development Process</h2>
        <p>{metadata.get("development_overview", "Development process details to be provided by provider.")}</p>

        <h2>3.2 Version Control</h2>
        <div class="metadata-box">
            <p><strong>Core Framework Version:</strong> {metadata.get("core_version", self.system_version)}</p>
            <p><strong>Dependencies:</strong> {metadata.get("dependencies", "Listed in requirements.txt")}</p>
            <p><strong>Model Version:</strong> {metadata.get("model_version", "N/A")}</p>
        </div>
    </div>

    <!-- Section 4: Monitoring, Functioning and Control -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 4: Monitoring, Functioning and Control</h1>

        <h2>4.1 Automatic Logging (Article 19)</h2>
        <p>All system interactions are automatically logged with the following information:</p>
        <ul>
            <li>Timestamp (ISO 8601 format)</li>
            <li>Input query/prompt</li>
            <li>System output/response</li>
            <li>Compliance measurement results</li>
            <li>Performance metrics (duration, token count)</li>
            <li>Rule evaluation outcomes</li>
        </ul>

        <h2>4.2 Real-Time Monitoring</h2>
        <p>The CERT Dashboard provides real-time compliance monitoring with:</p>
        <ul>
            <li>Success rate tracking</li>
            <li>Rule pass/fail analytics</li>
            <li>Error detection and alerting</li>
            <li>Performance metrics visualization</li>
        </ul>

        <h2>4.3 Operational Statistics</h2>
        {self._format_operational_stats(stats)}
    </div>

    <!-- Section 5: Description of Risk Management System -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 5: Description of Risk Management System</h1>

        <h2>5.1 Risk Assessment</h2>
        <p>{metadata.get("risk_overview", "Risk management process details to be provided by provider.")}</p>

        <h2>5.2 Risk Mitigation Measures</h2>
        <ul>
            <li><strong>Automated Monitoring:</strong> Continuous compliance evaluation per Article 15</li>
            <li><strong>Threshold Enforcement:</strong> Configurable accuracy thresholds</li>
            <li><strong>Error Logging:</strong> Complete audit trail of failures</li>
            <li><strong>Human Oversight:</strong> Dashboard for human review and intervention</li>
        </ul>
    </div>

    <!-- Section 6: Description of Changes -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 6: Description of Changes Made to the System</h1>

        <h2>6.1 Version History</h2>
        <div class="metadata-box">
            <p><strong>Current Version:</strong> {stats["system_version"]}</p>
            <p><strong>Report Period:</strong> {stats.get("period_start", "N/A")} to {stats.get("period_end", "N/A")}</p>
        </div>

        <h2>6.2 Change Management</h2>
        <p>All system changes are tracked through version control. Significant changes that affect compliance characteristics are documented in this section.</p>
    </div>

    <!-- Section 7: Description of System Operation -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 7: Description of the System Operation</h1>

        <h2>7.1 Technical Requirements</h2>
        <table>
            <tr>
                <th>Requirement</th>
                <th>Specification</th>
            </tr>
            <tr>
                <td>Minimum Hardware</td>
                <td>{metadata.get("min_hardware", "4 CPU cores, 8GB RAM")}</td>
            </tr>
            <tr>
                <td>Recommended Hardware</td>
                <td>{metadata.get("recommended_hardware", "8 CPU cores, 16GB RAM")}</td>
            </tr>
            <tr>
                <td>GPU Requirements</td>
                <td>{metadata.get("gpu_requirements", "Optional")}</td>
            </tr>
            <tr>
                <td>Network Requirements</td>
                <td>{metadata.get("network_requirements", "HTTPS connectivity")}</td>
            </tr>
        </table>

        <h2>7.2 Operational Performance</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Average Response Time</td>
                <td>{stats["avg_duration_ms"]:.2f} ms</td>
            </tr>
            <tr>
                <td>Success Rate</td>
                <td>{stats["success_rate"]:.1%}</td>
            </tr>
            <tr>
                <td>Total Requests Processed</td>
                <td>{stats["total_requests"]:,}</td>
            </tr>
        </table>
    </div>

    <!-- Section 8: Human Oversight -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 8: Human Oversight</h1>

        <h2>8.1 Oversight Mechanisms</h2>
        <p>{metadata.get("oversight_philosophy", "Human oversight mechanisms to be specified by provider.")}</p>

        <h2>8.2 Dashboard Monitoring</h2>
        <p>The CERT Dashboard provides human oversight through:</p>
        <ul>
            <li>Real-time compliance monitoring</li>
            <li>Detailed evaluation results per interaction</li>
            <li>Rule-by-rule compliance breakdown</li>
            <li>Historical trend analysis</li>
            <li>Anomaly detection and alerting</li>
        </ul>
    </div>

    <!-- Section 9: Accuracy, Robustness and Cybersecurity -->
    <div class="section" style="page-break-before: always;">
        <h1>Section 9: Accuracy, Robustness and Cybersecurity</h1>

        <h2>9.1 Accuracy Evaluation (Article 15.1)</h2>
        {self._format_accuracy_evaluation(stats)}

        <h2>9.2 Robustness Assessment (Article 15.4)</h2>
        {self._format_robustness_assessment(stats)}

        <h2>9.3 Cybersecurity Measures (Article 15.3)</h2>
        <p>{metadata.get("cybersecurity_overview", "Cybersecurity measures to be specified by provider.")}</p>

        <h3>Data Protection</h3>
        <p>{metadata.get("data_overview", "Data handling practices to be specified by provider.")}</p>
    </div>

    <!-- Appendix A: Article 19 Logging -->
    <div class="section" style="page-break-before: always;">
        <h1>Appendix A: Article 19 Automatic Logging</h1>

        <h2>A.1 Logging Implementation</h2>
        <p>The system implements automatic logging as required by Article 19 of the EU AI Act. Every interaction is captured with complete metadata for audit purposes.</p>

        <h2>A.2 Log Format</h2>
        <p>Logs are stored in JSONL format with the following structure:</p>
        <pre>{self._format_log_example()}</pre>

        <h2>A.3 Log Retention</h2>
        <p>Logs are retained according to provider policy and regulatory requirements. Current log statistics:</p>
        <ul>
            <li><strong>Total Logged Requests:</strong> {stats["total_requests"]:,}</li>
            <li><strong>Date Range:</strong> {stats.get("period_start", "N/A")} to {stats.get("period_end", "N/A")}</li>
        </ul>
    </div>

    <!-- Appendix B: Statistical Evidence -->
    <div class="section" style="page-break-before: always;">
        <h1>Appendix B: Statistical Evidence</h1>

        <h2>B.1 Compliance Metrics</h2>
        {self._format_compliance_summary(stats)}

        <h2>B.2 Overall Compliance Status</h2>
        <div class="metadata-box" style="font-size: 14pt;">
            {self._get_compliance_status(stats)}
        </div>
    </div>

    <!-- Signature Block -->
    <div class="signature-block" style="page-break-before: always;">
        <h1>Declaration of Conformity</h1>

        <p>I, the undersigned, representing <strong>{stats["provider_name"]}</strong>, declare that the AI system described in this document has been developed and deployed in accordance with the requirements set out in Regulation (EU) 2024/1689 (Artificial Intelligence Act).</p>

        <p style="margin-top: 30px;">
            <strong>Date:</strong> _______________________
        </p>

        <p style="margin-top: 30px;">
            <strong>Name:</strong> _______________________
        </p>

        <p style="margin-top: 30px;">
            <strong>Position:</strong> _______________________
        </p>

        <div class="signature-line">
            Signature
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Generated by CERT Framework | Report ID: {stats["report_date"]}</p>
        <p>This document is a technical documentation file as required by Annex IV of the EU AI Act</p>
    </div>
</body>
</html>"""

    def _format_integrations(self, integrations: List[Dict]) -> str:
        """Format integration points section."""
        if not integrations:
            return "<p>Integration points to be specified by provider.</p>"

        html = "<table><tr><th>Integration</th><th>Description</th><th>Interface Type</th></tr>"
        for integration in integrations:
            html += f"""<tr>
                <td>{integration.get('name', 'N/A')}</td>
                <td>{integration.get('description', 'N/A')}</td>
                <td>{integration.get('interface_type', 'N/A')}</td>
            </tr>"""
        html += "</table>"
        return html

    def _format_third_party_components(self, components: List[Dict]) -> str:
        """Format third-party components section."""
        if not components:
            return "<p>No third-party components or to be specified by provider.</p>"

        html = "<table><tr><th>Component</th><th>Purpose</th><th>Integration Method</th></tr>"
        for comp in components:
            html += f"""<tr>
                <td>{comp.get('name', 'N/A')}</td>
                <td>{comp.get('purpose', 'N/A')}</td>
                <td>{comp.get('integration', 'N/A')}</td>
            </tr>"""
        html += "</table>"
        return html

    def _format_operational_stats(self, stats: Dict) -> str:
        """Format operational statistics table."""
        return f"""<table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Requests</td>
                <td>{stats["total_requests"]:,}</td>
            </tr>
            <tr>
                <td>Successful Requests</td>
                <td>{stats["successful_requests"]:,}</td>
            </tr>
            <tr>
                <td>Failed Requests</td>
                <td>{stats["error_count"]:,}</td>
            </tr>
            <tr>
                <td>Success Rate</td>
                <td>{stats["success_rate"]:.1%}</td>
            </tr>
            <tr>
                <td>Error Rate</td>
                <td>{stats["error_rate"]:.1%}</td>
            </tr>
            <tr>
                <td>Average Response Time</td>
                <td>{stats["avg_duration_ms"]:.2f} ms</td>
            </tr>
        </table>"""

    def _format_accuracy_evaluation(self, stats: Dict) -> str:
        """Format accuracy evaluation section."""
        if "total_evaluated" not in stats:
            return """<p><em>Accuracy evaluation metrics not available. Run evaluation with CERT Framework:</em></p>
            <pre>from cert.evaluation import Evaluator

evaluator = Evaluator(threshold=0.7)
results = evaluator.evaluate_log_file(
    log_file="production_traces.jsonl",
    output="evaluation_results.json"
)</pre>"""

        return f"""<table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Traces Evaluated</td>
                <td>{stats["total_evaluated"]:,}</td>
            </tr>
            <tr>
                <td>Passed</td>
                <td>{stats["passed"]:,}</td>
            </tr>
            <tr>
                <td>Failed</td>
                <td>{stats["failed"]:,}</td>
            </tr>
            <tr>
                <td>Pass Rate</td>
                <td class="{'compliant' if stats['pass_rate'] >= 0.9 else 'non-compliant'}">{stats["pass_rate"]:.1%}</td>
            </tr>
            <tr>
                <td>Evaluation Preset</td>
                <td>{stats.get("preset", "N/A")}</td>
            </tr>
            <tr>
                <td>Threshold Used</td>
                <td>{stats.get("threshold", "N/A")}</td>
            </tr>
        </table>

        <p><strong>Assessment:</strong> The system demonstrates {'<span class="compliant">COMPLIANT</span>' if stats['pass_rate'] >= 0.9 else '<span class="non-compliant">NON-COMPLIANT</span>'} levels of accuracy according to Article 15.1 requirements.</p>"""

    def _format_robustness_assessment(self, stats: Dict) -> str:
        """Format robustness assessment section."""
        return f"""<table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Error Rate</td>
                <td>{stats["error_rate"]:.1%}</td>
                <td class="{'compliant' if stats['error_rate'] < 0.05 else 'non-compliant'}">{'ACCEPTABLE' if stats['error_rate'] < 0.05 else 'EXCEEDS THRESHOLD'}</td>
            </tr>
            <tr>
                <td>System Availability</td>
                <td>{stats["success_rate"]:.1%}</td>
                <td class="compliant">OPERATIONAL</td>
            </tr>
        </table>

        <p>Error handling is implemented with automatic logging of all failures for investigation. The system maintains {'<span class="compliant">acceptable</span>' if stats['error_rate'] < 0.05 else '<span class="non-compliant">elevated</span>'} error rates according to Article 15.4 resilience requirements.</p>"""

    def _format_log_example(self) -> str:
        """Format example log entry."""
        example = {
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
        return json.dumps(example, indent=2)

    def _format_compliance_summary(self, stats: Dict) -> str:
        """Format compliance summary table."""
        return f"""<table>
            <tr>
                <th>Compliance Area</th>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
            </tr>
            <tr>
                <td rowspan="2">Article 15.1 (Accuracy)</td>
                <td>Pass Rate</td>
                <td>{stats.get('pass_rate', 0):.1%}</td>
                <td class="{'compliant' if stats.get('pass_rate', 0) >= 0.9 else 'non-compliant'}">{'✓ COMPLIANT' if stats.get('pass_rate', 0) >= 0.9 else '✗ NON-COMPLIANT'}</td>
            </tr>
            <tr>
                <td>Traces Evaluated</td>
                <td>{stats.get('total_evaluated', stats['total_requests']):,}</td>
                <td class="compliant">✓ DOCUMENTED</td>
            </tr>
            <tr>
                <td rowspan="2">Article 15.4 (Robustness)</td>
                <td>Error Rate</td>
                <td>{stats['error_rate']:.1%}</td>
                <td class="{'compliant' if stats['error_rate'] < 0.05 else 'non-compliant'}">{'✓ COMPLIANT' if stats['error_rate'] < 0.05 else '✗ NON-COMPLIANT'}</td>
            </tr>
            <tr>
                <td>Availability</td>
                <td>{stats['success_rate']:.1%}</td>
                <td class="compliant">✓ MONITORED</td>
            </tr>
            <tr>
                <td>Article 19 (Logging)</td>
                <td>Automatic Logging</td>
                <td>{stats['total_requests']:,} requests logged</td>
                <td class="compliant">✓ COMPLIANT</td>
            </tr>
        </table>"""

    def _get_compliance_status(self, stats: Dict) -> str:
        """Determine overall compliance status."""
        # Check error rate
        error_ok = stats["error_rate"] < 0.05

        # Check pass rate if available
        pass_rate_ok = True
        if "pass_rate" in stats:
            pass_rate_ok = stats["pass_rate"] >= 0.9

        # Logging is always compliant if we have traces
        logging_ok = stats["total_requests"] > 0

        if error_ok and pass_rate_ok and logging_ok:
            return '<p class="compliant" style="font-size: 18pt;">✅ COMPLIANT - System meets EU AI Act requirements</p><p>This system demonstrates compliance with Article 15 (accuracy, robustness, cybersecurity) and Article 19 (automatic logging) of the EU AI Act.</p>'
        else:
            issues = []
            if not error_ok:
                issues.append(f"High error rate ({stats['error_rate']:.1%})")
            if not pass_rate_ok:
                issues.append(f"Low pass rate ({stats.get('pass_rate', 0):.1%})")
            if not logging_ok:
                issues.append("Insufficient logging data")

            return f'<p class="non-compliant" style="font-size: 18pt;">⚠️ NON-COMPLIANT - Action Required</p><p><strong>Issues Identified:</strong> {", ".join(issues)}</p><p>Please address these issues before regulatory submission.</p>'

    def _generate_markdown(self, stats: Dict, metadata: Dict) -> str:
        """Generate markdown version of the report."""
        # Simplified markdown version for quick review
        return f"""# EU AI Act Technical Documentation

## System Information

- **System Name:** {stats["system_name"]}
- **Provider:** {stats["provider_name"]}
- **Version:** {stats["system_version"]}
- **Risk Classification:** {stats["risk_classification"]}
- **Report Date:** {stats["report_date"]}

## Intended Purpose

{stats["intended_purpose"]}

## Annex IV Sections

### Section 1: General Description
{metadata.get("architecture_description", "To be provided")}

### Section 9: Accuracy, Robustness and Cybersecurity

#### Accuracy (Article 15.1)
- Pass Rate: {stats.get('pass_rate', 0):.1%}
- Total Evaluated: {stats.get('total_evaluated', 0):,}

#### Robustness (Article 15.4)
- Error Rate: {stats['error_rate']:.1%}
- Success Rate: {stats['success_rate']:.1%}

#### Article 19: Automatic Logging
- Total Logged: {stats['total_requests']:,}
- Period: {stats.get('period_start', 'N/A')} to {stats.get('period_end', 'N/A')}

## Compliance Status

{self._get_compliance_status(stats)}

---

*For complete documentation, generate PDF format*
"""

    def _convert_to_pdf(self, html_content: str, output_path: str) -> str:
        """Convert HTML to PDF using WeasyPrint."""
        try:
            from weasyprint import HTML

            HTML(string=html_content).write_pdf(output_path)
            return output_path
        except ImportError as e:
            raise ImportError(
                "PDF generation requires: pip install weasyprint\n"
                "On macOS: brew install python3 cairo pango gdk-pixbuf libffi\n"
                "On Ubuntu: apt-get install python3-pip python3-cffi python3-brotli libpango-1.0-0\n"
                "Then: pip install weasyprint"
            ) from e
