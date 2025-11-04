"""
Compliance analysis - just logic, no formatting.
"""

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


@dataclass
class Article15Compliance:
    """Article 15: Accuracy, robustness, cybersecurity."""

    accuracy_score: float
    total_requests: int
    failed_requests: int
    error_rate: float
    avg_response_time_ms: float
    is_compliant: bool
    issues: List[str]


@dataclass
class AnnexIVCompliance:
    """Annex IV: Technical documentation requirements."""

    section_1_general_description: Dict[str, Any]
    section_2_system_elements: Dict[str, Any]
    section_3_monitoring: Dict[str, Any]
    section_4_data_governance: Dict[str, Any]
    is_complete: bool
    missing_sections: List[str]


@dataclass
class ComplianceReport:
    """Complete compliance analysis result."""

    system_name: str
    system_version: str
    report_date: str
    article_15: Article15Compliance
    annex_iv: AnnexIVCompliance
    overall_compliant: bool
    risk_score: float  # 0.0 = fully compliant, 1.0 = major issues


class ComplianceAnalyzer:
    """Analyzes compliance - returns pure data, no formatting."""

    def __init__(
        self,
        system_name: str,
        system_version: str,
        provider_name: str,
    ):
        self.system_name = system_name
        self.system_version = system_version
        self.provider_name = provider_name

    def analyze_from_traces(
        self,
        traces_path: str,
        system_metadata: Dict[str, Any],
    ) -> ComplianceReport:
        """
        Analyze compliance from trace file.

        Args:
            traces_path: Path to JSONL file with traces
            system_metadata: Dict with system info (architecture, security, etc)

        Returns:
            ComplianceReport with all analysis results

        Raises:
            FileNotFoundError: If traces_path doesn't exist
            ValueError: If traces are malformed
        """
        # Load traces
        traces = self._load_traces(traces_path)

        # Analyze Article 15 compliance
        article_15 = self._analyze_article_15(traces)

        # Analyze Annex IV compliance
        annex_iv = self._analyze_annex_iv(traces, system_metadata)

        # Compute overall compliance
        overall_compliant = article_15.is_compliant and annex_iv.is_complete
        risk_score = self._compute_risk_score(article_15, annex_iv)

        return ComplianceReport(
            system_name=self.system_name,
            system_version=self.system_version,
            report_date=datetime.utcnow().isoformat(),
            article_15=article_15,
            annex_iv=annex_iv,
            overall_compliant=overall_compliant,
            risk_score=risk_score,
        )

    def _load_traces(self, traces_path: str) -> List[Dict]:
        """Load and validate traces from JSONL file."""
        traces_file = Path(traces_path)

        if not traces_file.exists():
            raise FileNotFoundError(
                f"Traces file not found: {traces_path}\n"
                f"Make sure you've run your traced functions first to generate traces."
            )

        traces = []
        with open(traces_file) as f:
            for line_num, line in enumerate(f, 1):
                if not line.strip():
                    continue

                try:
                    trace = json.loads(line)
                    traces.append(trace)
                except json.JSONDecodeError as e:
                    # Log warning but continue - don't fail entire analysis
                    print(f"Warning: Skipping malformed trace at line {line_num}: {e}")

        if not traces:
            raise ValueError(
                f"No valid traces found in {traces_path}\n"
                f"File exists but contains no valid JSON lines."
            )

        return traces

    def _analyze_article_15(self, traces: List[Dict]) -> Article15Compliance:
        """Analyze Article 15 requirements: accuracy, robustness, cybersecurity."""
        total = len(traces)
        failed = sum(1 for t in traces if t.get("status") == "error")
        error_rate = failed / total if total > 0 else 0

        # Compute average response time
        durations = [t.get("duration_ms", 0) for t in traces if t.get("duration_ms")]
        avg_duration = sum(durations) / len(durations) if durations else 0

        # Compute accuracy score (if evaluation results exist)
        # This assumes traces have a "confidence" field from measurement
        confidences = [t.get("confidence", 1.0) for t in traces if "confidence" in t]
        accuracy_score = sum(confidences) / len(confidences) if confidences else 0

        # Determine compliance
        issues = []
        if error_rate > 0.05:  # >5% error rate
            issues.append(f"Error rate {error_rate:.1%} exceeds 5% threshold")
        if avg_duration > 5000:  # >5 seconds
            issues.append(f"Average response time {avg_duration:.0f}ms exceeds 5s threshold")
        if accuracy_score < 0.80:  # <80% accuracy
            issues.append(f"Accuracy score {accuracy_score:.1%} below 80% threshold")

        is_compliant = len(issues) == 0

        return Article15Compliance(
            accuracy_score=accuracy_score,
            total_requests=total,
            failed_requests=failed,
            error_rate=error_rate,
            avg_response_time_ms=avg_duration,
            is_compliant=is_compliant,
            issues=issues,
        )

    def _analyze_annex_iv(
        self, traces: List[Dict], system_metadata: Dict[str, Any]
    ) -> AnnexIVCompliance:
        """Analyze Annex IV requirements: technical documentation."""

        # Section 1: General description
        section_1 = {
            "intended_purpose": system_metadata.get("intended_purpose", ""),
            "provider_name": self.provider_name,
            "system_name": self.system_name,
        }

        # Section 2: System elements (simplified - just check keys exist)
        section_2 = {
            "architecture": system_metadata.get("architecture", ""),
            "training_data": system_metadata.get("training_data", ""),
            "model_type": system_metadata.get("model_type", ""),
        }

        # Section 3: Monitoring (from traces)
        section_3 = {
            "total_inferences": len(traces),
            "monitoring_period_days": self._compute_monitoring_period(traces),
            "logging_enabled": True,  # If we have traces, logging works
        }

        # Section 4: Data governance
        section_4 = {
            "data_retention_days": system_metadata.get("data_retention_days", 90),
            "data_security": system_metadata.get("data_security", ""),
        }

        # Check completeness
        missing = []
        if not section_1.get("intended_purpose"):
            missing.append("Section 1: intended_purpose not specified")
        if not section_2.get("architecture"):
            missing.append("Section 2: architecture not documented")
        if not section_4.get("data_security"):
            missing.append("Section 4: data security measures not documented")

        is_complete = len(missing) == 0

        return AnnexIVCompliance(
            section_1_general_description=section_1,
            section_2_system_elements=section_2,
            section_3_monitoring=section_3,
            section_4_data_governance=section_4,
            is_complete=is_complete,
            missing_sections=missing,
        )

    def _compute_monitoring_period(self, traces: List[Dict]) -> int:
        """Compute how many days of monitoring data we have."""
        if not traces:
            return 0

        timestamps = [t.get("timestamp") for t in traces if t.get("timestamp")]
        if not timestamps:
            return 0

        # Parse ISO timestamps and compute day range
        dates = [datetime.fromisoformat(ts.replace("Z", "+00:00")) for ts in timestamps]
        oldest = min(dates)
        newest = max(dates)
        return (newest - oldest).days

    def _compute_risk_score(
        self, article_15: Article15Compliance, annex_iv: AnnexIVCompliance
    ) -> float:
        """
        Compute overall risk score.

        0.0 = fully compliant
        1.0 = critical compliance issues
        """
        risk = 0.0

        # Article 15 risks
        if not article_15.is_compliant:
            risk += 0.3 * len(article_15.issues)

        # Annex IV risks
        if not annex_iv.is_complete:
            risk += 0.2 * len(annex_iv.missing_sections)

        # Cap at 1.0
        return min(risk, 1.0)
