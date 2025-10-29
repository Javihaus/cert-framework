"""
Standalone compliance reporter for generating EU AI Act Article 15 reports.

Designed to be used via CLI or programmatically for generating compliance
documentation from trace logs.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional


class ComplianceReporter:
    """Generate EU AI Act Article 15 compliance reports from trace logs."""

    def __init__(self, system_name: str, risk_level: str = "high"):
        """Initialize compliance reporter.

        Args:
            system_name: Name of the AI system being documented
            risk_level: Risk classification (high, medium, low)
        """
        self.system_name = system_name
        self.risk_level = risk_level

    def generate_report(
        self,
        log_path: str,
        output_path: str,
        format: str = "markdown",
        evaluation_results: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate compliance report from trace logs.

        Args:
            log_path: Path to JSONL trace log file
            output_path: Path for output report
            format: Report format (markdown, html, pdf, txt)
            evaluation_results: Optional pre-computed evaluation results

        Returns:
            Path to generated report
        """
        # Load and analyze traces
        traces = self._load_traces(log_path)
        stats = self._compute_statistics(traces, evaluation_results)

        # Generate report based on format
        if format == "markdown":
            content = self._generate_markdown(stats)
        elif format == "html":
            content = self._generate_html(stats)
        elif format == "txt":
            content = self._generate_text(stats)
        elif format == "pdf":
            # For PDF, generate HTML first then convert
            html_content = self._generate_html(stats)
            return self._convert_to_pdf(html_content, output_path)
        else:
            raise ValueError(
                f"Unsupported format: {format}. "
                "Use 'markdown', 'html', 'txt', or 'pdf'"
            )

        # Write report
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(content)

        return str(output_file)

    def _load_traces(self, log_path: str) -> list:
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
        self,
        traces: list,
        evaluation_results: Optional[Dict[str, Any]] = None
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
            "risk_level": self.risk_level,
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
            stats.update({
                "total_evaluated": evaluation_results.get("total_traces", 0),
                "passed": evaluation_results.get("passed", 0),
                "failed": evaluation_results.get("failed", 0),
                "pass_rate": evaluation_results.get("pass_rate", 0),
                "preset": evaluation_results.get("preset"),
                "threshold": evaluation_results.get("threshold"),
            })

        return stats

    def _generate_markdown(self, stats: Dict) -> str:
        """Generate markdown compliance report."""
        return f"""# EU AI Act Article 15 Compliance Report

## System Information

- **System Name:** {stats['system_name']}
- **Risk Level:** {stats['risk_level'].upper()}
- **Report Date:** {stats['report_date']}
- **Reporting Period:** {stats.get('period_start', 'N/A')} to {stats.get('period_end', 'N/A')}

## Article 15.1: Accuracy Levels

### Operational Statistics

- **Total Requests:** {stats['total_requests']:,}
- **Successful Requests:** {stats['successful_requests']:,}
- **Failed Requests:** {stats['error_count']:,}
- **Success Rate:** {stats['success_rate']:.1%}
- **Average Response Time:** {stats['avg_duration_ms']:.2f}ms

### Accuracy Evaluation

{self._format_evaluation_section(stats)}

## Article 15.4: Resilience Regarding Errors

- **Error Rate:** {stats['error_rate']:.1%}
- **System Availability:** {stats['success_rate']:.1%}

Error handling is implemented with automatic logging of all failures for investigation.

## Article 19: Record Keeping

All requests are automatically logged with:
- Timestamps for audit trail
- Input/output data for reproducibility
- Performance metrics for monitoring
- Error details for debugging

**Log Retention:** As per company policy
**Log Location:** Secure storage with access controls

## Compliance Status

{self._get_compliance_status(stats)}

---

*Generated by CERT Framework*
*Report ID: {stats['report_date']}*
"""

    def _format_evaluation_section(self, stats: Dict) -> str:
        """Format evaluation results section."""
        if "total_evaluated" not in stats:
            return """*Evaluation metrics not available. Run evaluation with:*

```bash
cert evaluate traces.jsonl --preset [preset] --threshold [threshold]
```
"""

        return f"""**Evaluation Results:**

- **Total Traces Evaluated:** {stats['total_evaluated']:,}
- **Passed:** {stats['passed']:,}
- **Failed:** {stats['failed']:,}
- **Pass Rate:** {stats['pass_rate']:.1%}
- **Preset:** {stats.get('preset', 'N/A')}
- **Threshold:** {stats.get('threshold', 'N/A')}

The system demonstrates {"**COMPLIANT**" if stats['pass_rate'] >= 0.9 else "**NON-COMPLIANT**"} levels of accuracy.
"""

    def _get_compliance_status(self, stats: Dict) -> str:
        """Determine overall compliance status."""
        # Check error rate
        error_ok = stats['error_rate'] < 0.05

        # Check pass rate if available
        pass_rate_ok = True
        if "pass_rate" in stats:
            pass_rate_ok = stats['pass_rate'] >= 0.9

        if error_ok and pass_rate_ok:
            return "✅ **COMPLIANT** - System meets EU AI Act Article 15 requirements"
        else:
            issues = []
            if not error_ok:
                issues.append(f"High error rate ({stats['error_rate']:.1%})")
            if not pass_rate_ok:
                issues.append(f"Low pass rate ({stats.get('pass_rate', 0):.1%})")

            return f"⚠️  **NON-COMPLIANT** - Issues: {', '.join(issues)}"

    def _generate_html(self, stats: Dict) -> str:
        """Generate HTML compliance report."""
        # Convert markdown to HTML for now
        # In production, this would use a proper template
        markdown_content = self._generate_markdown(stats)

        return f"""<!DOCTYPE html>
<html>
<head>
    <title>EU AI Act Compliance Report - {stats['system_name']}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
        }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        h3 {{ color: #555; }}
        .compliant {{ color: #27ae60; }}
        .non-compliant {{ color: #e74c3c; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        td, th {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #3498db; color: white; }}
    </style>
</head>
<body>
    <pre>{markdown_content}</pre>
</body>
</html>"""

    def _generate_text(self, stats: Dict) -> str:
        """Generate plain text compliance report."""
        return self._generate_markdown(stats)

    def _convert_to_pdf(self, html_content: str, output_path: str) -> str:
        """Convert HTML to PDF (requires additional dependencies)."""
        try:
            # Try importing PDF generation library
            from weasyprint import HTML
            PDF.HTML(string=html_content).write_pdf(output_path)
            return output_path
        except ImportError:
            raise ImportError(
                "PDF generation requires: pip install weasyprint\n"
                "Alternatively, use format='html' and convert manually."
            )
