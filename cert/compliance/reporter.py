"""
Orchestrates analysis and formatting.
This is what external code calls.
"""

from pathlib import Path
from typing import Any, Dict, Optional

from .analyzer import ComplianceAnalyzer
from .formatter import to_html, to_json


class ComplianceReporter:
    """Main entry point for compliance reporting."""

    def __init__(
        self,
        system_name: str,
        system_version: str,
        provider_name: str,
    ):
        """
        Initialize compliance reporter.

        Args:
            system_name: Name of the AI system
            system_version: System version (e.g., v1.0.0)
            provider_name: Legal name of provider organization
        """
        self.system_name = system_name
        self.system_version = system_version
        self.provider_name = provider_name

    def generate_report(
        self,
        traces_path: str,
        system_metadata: Optional[Dict[str, Any]] = None,
        format: str = "json",
    ):
        """
        Generate compliance report in specified format.

        Args:
            traces_path: Path to JSONL file with traces
            system_metadata: Optional metadata about the system
            format: Output format ('json' or 'html')

        Returns:
            Report as dict (if json) or string (if html)

        Raises:
            FileNotFoundError: If traces_path doesn't exist
            ValueError: If format is unsupported

        Example:
            >>> reporter = ComplianceReporter(
            ...     system_name="My RAG System",
            ...     system_version="v1.0",
            ...     provider_name="ACME Corp"
            ... )
            >>> report = reporter.generate_report(
            ...     traces_path="traces.jsonl",
            ...     system_metadata={
            ...         "intended_purpose": "Customer support Q&A",
            ...         "architecture": "RAG with GPT-4",
            ...         "data_security": "Encrypted at rest and in transit"
            ...     },
            ...     format="json"
            ... )
        """
        # Use empty dict if no metadata provided
        metadata = system_metadata or {}

        # Create analyzer and run analysis
        analyzer = ComplianceAnalyzer(
            system_name=self.system_name,
            system_version=self.system_version,
            provider_name=self.provider_name,
        )

        result = analyzer.analyze_from_traces(traces_path, metadata)

        # Format output
        if format == "json":
            return to_json(result)
        elif format == "html":
            return to_html(result)
        else:
            raise ValueError(f"Unsupported format: {format}. Use 'json' or 'html'.")

    def save_report(
        self,
        traces_path: str,
        output_path: str,
        system_metadata: Optional[Dict[str, Any]] = None,
        format: str = "json",
    ):
        """
        Generate and save report to file.

        Args:
            traces_path: Path to JSONL file with traces
            output_path: Where to save the report
            system_metadata: Optional metadata about the system
            format: Output format ('json' or 'html')

        Example:
            >>> reporter = ComplianceReporter("My System", "v1.0", "ACME Corp")
            >>> reporter.save_report(
            ...     traces_path="traces.jsonl",
            ...     output_path="compliance_report.html",
            ...     format="html"
            ... )
        """
        report = self.generate_report(traces_path, system_metadata, format)

        # Create output directory if needed
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # Write report
        if format == "json":
            import json

            with open(output_path, "w") as f:
                json.dump(report, f, indent=2)
        elif format == "html":
            with open(output_path, "w") as f:
                f.write(report)

        print(f"Compliance report saved to {output_path}")
