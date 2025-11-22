"""
Conformity Assessment for EU AI Act

Implements conformity assessment procedures for high-risk AI systems
as required by Article 43 of the EU AI Act.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from enum import Enum
import json


class AssessmentProcedure(Enum):
    """Conformity assessment procedures per Annex VI/VII."""
    INTERNAL_CONTROL = "internal_control"  # Annex VI
    QUALITY_MANAGEMENT = "quality_management"  # Annex VII
    NOTIFIED_BODY = "notified_body"  # Third-party assessment


class AssessmentStatus(Enum):
    """Assessment status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    FAILED = "failed"
    CONDITIONAL_PASS = "conditional_pass"


@dataclass
class AssessmentCriterion:
    """Individual assessment criterion."""

    criterion_id: str
    description: str
    article_reference: str
    status: AssessmentStatus = AssessmentStatus.NOT_STARTED
    evidence: list[str] = field(default_factory=list)
    findings: list[str] = field(default_factory=list)
    score: float | None = None  # 0.0 to 1.0


@dataclass
class AuditReport:
    """Conformity assessment audit report."""

    report_id: str
    system_name: str
    provider_name: str
    assessment_procedure: AssessmentProcedure
    overall_status: AssessmentStatus
    criteria: list[AssessmentCriterion]
    summary: str
    recommendations: list[str]
    ce_marking_eligible: bool
    assessment_date: datetime = field(default_factory=datetime.utcnow)
    assessor_name: str = ""
    next_audit_date: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "report_id": self.report_id,
            "system_name": self.system_name,
            "provider_name": self.provider_name,
            "assessment_procedure": self.assessment_procedure.value,
            "overall_status": self.overall_status.value,
            "criteria": [
                {
                    "criterion_id": c.criterion_id,
                    "description": c.description,
                    "article_reference": c.article_reference,
                    "status": c.status.value,
                    "evidence": c.evidence,
                    "findings": c.findings,
                    "score": c.score,
                }
                for c in self.criteria
            ],
            "summary": self.summary,
            "recommendations": self.recommendations,
            "ce_marking_eligible": self.ce_marking_eligible,
            "assessment_date": self.assessment_date.isoformat(),
            "assessor_name": self.assessor_name,
            "next_audit_date": self.next_audit_date.isoformat() if self.next_audit_date else None,
        }


# Conformity assessment criteria based on EU AI Act
ASSESSMENT_CRITERIA = [
    {
        "id": "CA-01",
        "description": "Risk management system established and maintained",
        "article": "Article 9",
        "category": "risk_management",
    },
    {
        "id": "CA-02",
        "description": "Data governance practices implemented",
        "article": "Article 10",
        "category": "data_governance",
    },
    {
        "id": "CA-03",
        "description": "Technical documentation complete and accurate",
        "article": "Article 11",
        "category": "documentation",
    },
    {
        "id": "CA-04",
        "description": "Automatic logging capabilities implemented",
        "article": "Article 12",
        "category": "logging",
    },
    {
        "id": "CA-05",
        "description": "Transparency requirements met",
        "article": "Article 13",
        "category": "transparency",
    },
    {
        "id": "CA-06",
        "description": "Human oversight measures in place",
        "article": "Article 14",
        "category": "human_oversight",
    },
    {
        "id": "CA-07",
        "description": "Accuracy requirements met",
        "article": "Article 15(1)",
        "category": "accuracy",
    },
    {
        "id": "CA-08",
        "description": "Robustness requirements met",
        "article": "Article 15(2)",
        "category": "robustness",
    },
    {
        "id": "CA-09",
        "description": "Cybersecurity requirements met",
        "article": "Article 15(3)",
        "category": "cybersecurity",
    },
    {
        "id": "CA-10",
        "description": "Quality management system in place",
        "article": "Article 17",
        "category": "quality",
    },
]


class ConformityAssessment:
    """
    Conformity assessment for EU AI Act compliance.

    Implements assessment procedures defined in Annex VI and VII
    for high-risk AI systems.

    Example:
        assessment = ConformityAssessment()

        # Perform assessment
        report = assessment.assess(
            system_name="HR Screening AI",
            provider_name="Acme Corp",
            evidence={
                "risk_management": ["risk_register.pdf", "mitigation_plan.docx"],
                "documentation": ["technical_doc.pdf"],
                "accuracy": ["validation_results.json"],
            }
        )

        if report.ce_marking_eligible:
            print("System eligible for CE marking!")
    """

    def __init__(
        self,
        procedure: AssessmentProcedure = AssessmentProcedure.INTERNAL_CONTROL,
    ):
        """
        Initialize conformity assessment.

        Args:
            procedure: Assessment procedure to use
        """
        self.procedure = procedure
        self._report_counter = 0

    def _generate_report_id(self) -> str:
        """Generate unique report ID."""
        self._report_counter += 1
        timestamp = int(datetime.utcnow().timestamp())
        return f"CA-{timestamp}-{self._report_counter:04d}"

    def assess(
        self,
        system_name: str,
        provider_name: str,
        evidence: dict[str, list[str]] | None = None,
        test_results: dict[str, float] | None = None,
        assessor_name: str = "",
    ) -> AuditReport:
        """
        Perform conformity assessment.

        Args:
            system_name: Name of the AI system
            provider_name: Provider/manufacturer name
            evidence: Evidence documents per category
            test_results: Test scores per category (0.0-1.0)
            assessor_name: Name of assessor

        Returns:
            AuditReport with assessment results
        """
        evidence = evidence or {}
        test_results = test_results or {}
        criteria = []
        recommendations = []
        passed_count = 0

        for criterion_def in ASSESSMENT_CRITERIA:
            category = criterion_def["category"]

            # Check evidence
            category_evidence = evidence.get(category, [])

            # Check test results
            score = test_results.get(category)

            # Determine status
            if category_evidence and (score is None or score >= 0.7):
                status = AssessmentStatus.PASSED
                passed_count += 1
            elif category_evidence or (score and score >= 0.5):
                status = AssessmentStatus.CONDITIONAL_PASS
                passed_count += 0.5
                recommendations.append(
                    f"Strengthen evidence for {criterion_def['description']}"
                )
            else:
                status = AssessmentStatus.FAILED
                recommendations.append(
                    f"Address gap: {criterion_def['description']} ({criterion_def['article']})"
                )

            findings = []
            if not category_evidence:
                findings.append("No evidence documents provided")
            if score is not None and score < 0.7:
                findings.append(f"Test score ({score:.1%}) below threshold")

            criteria.append(AssessmentCriterion(
                criterion_id=criterion_def["id"],
                description=criterion_def["description"],
                article_reference=criterion_def["article"],
                status=status,
                evidence=category_evidence,
                findings=findings,
                score=score,
            ))

        # Determine overall status
        compliance_rate = passed_count / len(ASSESSMENT_CRITERIA)

        if compliance_rate >= 0.9:
            overall_status = AssessmentStatus.PASSED
            ce_eligible = True
            summary = "System meets conformity requirements"
        elif compliance_rate >= 0.7:
            overall_status = AssessmentStatus.CONDITIONAL_PASS
            ce_eligible = False
            summary = "System partially meets requirements; improvements needed"
        else:
            overall_status = AssessmentStatus.FAILED
            ce_eligible = False
            summary = "System does not meet conformity requirements"

        return AuditReport(
            report_id=self._generate_report_id(),
            system_name=system_name,
            provider_name=provider_name,
            assessment_procedure=self.procedure,
            overall_status=overall_status,
            criteria=criteria,
            summary=summary,
            recommendations=recommendations,
            ce_marking_eligible=ce_eligible,
            assessor_name=assessor_name,
        )

    def generate_declaration(
        self,
        report: AuditReport,
    ) -> str:
        """
        Generate EU Declaration of Conformity.

        Args:
            report: Audit report to base declaration on

        Returns:
            Declaration text
        """
        if not report.ce_marking_eligible:
            return "Declaration cannot be issued: System does not meet conformity requirements"

        declaration = f"""
EU DECLARATION OF CONFORMITY
(EU AI Act - Regulation (EU) 2024/1689)

1. AI SYSTEM IDENTIFICATION
   Name: {report.system_name}
   Provider: {report.provider_name}

2. DECLARATION
   We declare under our sole responsibility that the AI system identified above
   is in conformity with the requirements of Regulation (EU) 2024/1689.

3. CONFORMITY ASSESSMENT
   Procedure: {report.assessment_procedure.value}
   Assessment Date: {report.assessment_date.isoformat()}
   Report ID: {report.report_id}

4. APPLICABLE REQUIREMENTS
   The AI system has been assessed against:
"""

        for criterion in report.criteria:
            status_symbol = "✓" if criterion.status == AssessmentStatus.PASSED else "○"
            declaration += f"   {status_symbol} {criterion.article_reference}: {criterion.description}\n"

        declaration += f"""
5. SIGNATORY
   This declaration is issued under the responsibility of the provider.

   Provider: {report.provider_name}
   Date: {datetime.utcnow().strftime('%Y-%m-%d')}

   [Signature Required]
"""
        return declaration

    def export_report(
        self,
        report: AuditReport,
        filepath: str,
    ) -> bool:
        """Export audit report to JSON."""
        try:
            with open(filepath, "w") as f:
                json.dump(report.to_dict(), f, indent=2)
            return True
        except Exception:
            return False
