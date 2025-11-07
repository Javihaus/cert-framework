"""
Generate .docx reports from Article15Report data structure.

Uses python-docx and docxtpl for template-based document generation.
"""

from pathlib import Path
from typing import Optional

try:
    from docxtpl import DocxTemplate
except ImportError:
    raise ImportError(
        "docx generation requires: pip install cert-framework[compliance]\n"
        "This includes python-docx and docxtpl dependencies."
    )

from cert.compliance import content
from cert.compliance.schemas import Article15Report, MonitoringReport


class DocxReportGenerator:
    """Generates .docx reports from structured data."""

    def __init__(self, template_path: Optional[str] = None):
        """Initialize generator with template path.

        Args:
            template_path: Path to .docx template file. If None, uses default.
        """
        if template_path is None:
            # Default to templates directory in package
            pkg_dir = Path(__file__).parent.parent
            template_path = pkg_dir / "templates" / "Article_15_Template.docx"

        self.template_path = Path(template_path)
        if not self.template_path.exists():
            raise FileNotFoundError(
                f"Template not found: {template_path}\n"
                f"Please ensure .docx template exists at this path."
            )

    def generate_article15(self, report: Article15Report, output_path: str) -> str:
        """Generate Article 15 compliance report as .docx.

        Args:
            report: Article15Report data structure
            output_path: Where to save the .docx file

        Returns:
            Path to generated file
        """
        doc = DocxTemplate(self.template_path)

        # Convert dataclass to dict for template rendering
        context = {
            # Static compliance text (must match TypeScript version)
            "article15_definition": content.ARTICLE15_DEFINITION,
            "article15_requirements": content.ARTICLE15_REQUIREMENTS,
            "methodology_overview": content.METHODOLOGY_OVERVIEW,
            "evaluation_process": content.EVALUATION_PROCESS,
            "compliance_interpretation": content.COMPLIANCE_INTERPRETATION,
            "article15_detailed": content.ARTICLE15_DETAILED,
            "article19_detailed": content.ARTICLE19_DETAILED,
            "failed_trace_intro": content.FAILED_TRACE_INTRO,
            "score_distribution_intro": content.SCORE_DISTRIBUTION_INTRO,
            "footer_note": content.FOOTER_NOTE,
            # System metadata
            "system_name": report.metadata.system_name,
            "system_version": report.metadata.system_version,
            "provider_name": report.metadata.provider_name,
            "intended_purpose": report.metadata.intended_purpose,
            "report_date": report.metadata.report_date,
            "evaluator_name": report.metadata.evaluator_name or "Not specified",
            # Performance metrics
            "total_traces": report.performance.total_traces,
            "evaluated_traces": report.performance.evaluated_traces,
            "passed_traces": report.performance.passed_traces,
            "failed_traces_count": report.performance.failed_traces,
            "accuracy_percentage": f"{report.performance.accuracy_percentage:.1f}%",
            "mean_confidence": f"{report.performance.mean_confidence:.3f}",
            "median_confidence": f"{report.performance.median_confidence:.3f}",
            "threshold_used": f"{report.performance.threshold_used:.2f}",
            # Temporal
            "period_start": report.temporal.period_start,
            "period_end": report.temporal.period_end,
            "daily_accuracy": [
                {"date": day["date"], "accuracy": f"{day['accuracy'] * 100:.1f}%"}
                for day in report.temporal.daily_accuracy
            ],
            # Failed trace examples (for table in Word)
            "failed_traces": [
                {
                    "timestamp": ft.timestamp,
                    "query": ft.input_query or "N/A",
                    "confidence": f"{ft.confidence:.3f}",
                    "reason": ft.reason,
                }
                for ft in report.failed_traces[:10]  # Top 10 only
            ],
            # Text sections
            "evaluation_methodology": report.evaluation_methodology,
            "compliance_statement": report.compliance_statement,
        }

        doc.render(context)
        doc.save(output_path)

        return str(output_path)

    def generate_monitoring(self, report: MonitoringReport, output_path: str) -> str:
        """Generate monitoring report (Template 6) as .docx.

        Args:
            report: MonitoringReport data structure
            output_path: Where to save the .docx file

        Returns:
            Path to generated file
        """
        template_path = self.template_path.parent / "Template_6_Monitoring.docx"
        if not template_path.exists():
            raise FileNotFoundError(f"Monitoring template not found: {template_path}")

        doc = DocxTemplate(template_path)

        context = {
            # System metadata
            "system_name": report.metadata.system_name,
            "system_version": report.metadata.system_version,
            "provider_name": report.metadata.provider_name,
            "report_date": report.metadata.report_date,
            # Monitoring period
            "period_start": report.monitoring_period.period_start,
            "period_end": report.monitoring_period.period_end,
            # Trace statistics
            "total_traces": report.trace_statistics.total_traces,
            "avg_latency_ms": f"{report.trace_statistics.avg_latency_ms:.1f}",
            "p50_latency_ms": f"{report.trace_statistics.p50_latency_ms:.1f}",
            "p95_latency_ms": f"{report.trace_statistics.p95_latency_ms:.1f}",
            "p99_latency_ms": f"{report.trace_statistics.p99_latency_ms:.1f}",
            "error_count": report.trace_statistics.error_count,
            "error_rate": f"{report.trace_statistics.error_rate * 100:.2f}%",
            # Accuracy distribution (histogram)
            "accuracy_distribution": report.accuracy_distribution,
            # Anomalies
            "anomalies": [
                {
                    "type": a.type,
                    "description": a.description,
                    "severity": a.severity.upper(),
                    "timestamp": a.timestamp,
                    "affected_traces": a.affected_traces,
                }
                for a in report.anomalies
            ],
            # Recommendations
            "recommendations": report.recommendations,
        }

        doc.render(context)
        doc.save(output_path)

        return str(output_path)
