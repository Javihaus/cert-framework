"""
High-Risk AI System Requirements Checker

Validates compliance with EU AI Act Articles 9-15 requirements
for high-risk AI systems.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from enum import Enum


class RequirementStatus(Enum):
    """Compliance status for a requirement."""
    COMPLIANT = "compliant"
    PARTIAL = "partial"
    NON_COMPLIANT = "non_compliant"
    NOT_ASSESSED = "not_assessed"


@dataclass
class RequirementCheck:
    """Result of checking a single requirement."""

    article: str
    requirement: str
    status: RequirementStatus
    evidence: list[str] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "article": self.article,
            "requirement": self.requirement,
            "status": self.status.value,
            "evidence": self.evidence,
            "gaps": self.gaps,
            "recommendations": self.recommendations,
        }


@dataclass
class ComplianceReport:
    """Full compliance assessment report."""

    system_name: str
    overall_status: RequirementStatus
    compliance_score: float  # 0.0 to 1.0
    checks: list[RequirementCheck]
    summary: str
    assessment_date: datetime = field(default_factory=datetime.utcnow)
    next_review_date: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "system_name": self.system_name,
            "overall_status": self.overall_status.value,
            "compliance_score": self.compliance_score,
            "checks": [c.to_dict() for c in self.checks],
            "summary": self.summary,
            "assessment_date": self.assessment_date.isoformat(),
            "next_review_date": self.next_review_date.isoformat() if self.next_review_date else None,
        }


# EU AI Act High-Risk Requirements Structure
HIGH_RISK_REQUIREMENTS = {
    "Article 9": {
        "title": "Risk Management System",
        "requirements": [
            {
                "id": "9.1",
                "description": "Establish risk management system throughout lifecycle",
                "checks": ["risk_management_documented", "lifecycle_coverage"],
            },
            {
                "id": "9.2.a",
                "description": "Identify and analyze known and foreseeable risks",
                "checks": ["risk_identification", "risk_analysis"],
            },
            {
                "id": "9.2.b",
                "description": "Estimate and evaluate risks from intended use and misuse",
                "checks": ["intended_use_risks", "misuse_risks"],
            },
            {
                "id": "9.2.c",
                "description": "Evaluate risks from post-market monitoring data",
                "checks": ["post_market_monitoring"],
            },
            {
                "id": "9.2.d",
                "description": "Adopt suitable risk management measures",
                "checks": ["risk_mitigation_measures"],
            },
        ],
    },
    "Article 10": {
        "title": "Data and Data Governance",
        "requirements": [
            {
                "id": "10.2",
                "description": "Training data subject to appropriate governance",
                "checks": ["data_governance_practices", "data_documentation"],
            },
            {
                "id": "10.3",
                "description": "Data sets shall be relevant, representative, error-free",
                "checks": ["data_quality", "data_representativeness"],
            },
            {
                "id": "10.4",
                "description": "Consider characteristics of deployment context",
                "checks": ["deployment_context_analysis"],
            },
            {
                "id": "10.5",
                "description": "Special category data only with safeguards",
                "checks": ["special_category_data_handling"],
            },
        ],
    },
    "Article 11": {
        "title": "Technical Documentation",
        "requirements": [
            {
                "id": "11.1",
                "description": "Technical documentation before placing on market",
                "checks": ["documentation_exists", "documentation_complete"],
            },
            {
                "id": "11.2",
                "description": "Documentation demonstrates compliance",
                "checks": ["compliance_demonstration"],
            },
        ],
    },
    "Article 12": {
        "title": "Record-keeping",
        "requirements": [
            {
                "id": "12.1",
                "description": "Automatic recording of logs",
                "checks": ["logging_enabled", "log_retention"],
            },
            {
                "id": "12.2",
                "description": "Logs enable traceability",
                "checks": ["log_traceability"],
            },
        ],
    },
    "Article 13": {
        "title": "Transparency and Information to Deployers",
        "requirements": [
            {
                "id": "13.1",
                "description": "Designed for transparent operation",
                "checks": ["transparency_design"],
            },
            {
                "id": "13.2",
                "description": "Instructions for use provided",
                "checks": ["instructions_available"],
            },
            {
                "id": "13.3",
                "description": "Information about provider identity",
                "checks": ["provider_identity_disclosed"],
            },
        ],
    },
    "Article 14": {
        "title": "Human Oversight",
        "requirements": [
            {
                "id": "14.1",
                "description": "Designed for effective human oversight",
                "checks": ["human_oversight_design"],
            },
            {
                "id": "14.2",
                "description": "Oversight during use by natural persons",
                "checks": ["human_oversight_operational"],
            },
            {
                "id": "14.4",
                "description": "Ability to not use system output",
                "checks": ["override_capability"],
            },
        ],
    },
    "Article 15": {
        "title": "Accuracy, Robustness and Cybersecurity",
        "requirements": [
            {
                "id": "15.1",
                "description": "Appropriate levels of accuracy",
                "checks": ["accuracy_measured", "accuracy_documented"],
            },
            {
                "id": "15.2",
                "description": "Resilient to errors and inconsistencies",
                "checks": ["robustness_testing"],
            },
            {
                "id": "15.3",
                "description": "Resilient to malicious attempts",
                "checks": ["cybersecurity_measures"],
            },
        ],
    },
}


class HighRiskRequirements:
    """
    High-risk AI system requirements checker.

    Validates an AI system against EU AI Act requirements for high-risk
    systems (Articles 9-15) and generates compliance reports.

    Example:
        checker = HighRiskRequirements()

        # Provide system metadata
        metadata = {
            "risk_management_documented": True,
            "data_governance_practices": True,
            "logging_enabled": True,
            "human_oversight_design": True,
            "accuracy_measured": True,
        }

        report = checker.assess_compliance("My AI System", metadata)
        print(f"Compliance: {report.compliance_score:.0%}")
    """

    def __init__(self):
        """Initialize the requirements checker."""
        self.requirements = HIGH_RISK_REQUIREMENTS

    def assess_compliance(
        self,
        system_name: str,
        system_metadata: dict[str, Any],
    ) -> ComplianceReport:
        """
        Assess compliance with high-risk requirements.

        Args:
            system_name: Name of the AI system
            system_metadata: Dictionary with compliance evidence

        Returns:
            ComplianceReport with detailed assessment
        """
        checks = []
        total_checks = 0
        compliant_checks = 0

        for article, article_data in self.requirements.items():
            for req in article_data["requirements"]:
                total_checks += 1
                evidence = []
                gaps = []

                # Check each sub-check
                for check in req["checks"]:
                    if system_metadata.get(check, False):
                        evidence.append(f"{check}: Verified")
                    else:
                        gaps.append(f"{check}: Not verified")

                # Determine status
                if not gaps:
                    status = RequirementStatus.COMPLIANT
                    compliant_checks += 1
                elif evidence:
                    status = RequirementStatus.PARTIAL
                    compliant_checks += 0.5
                else:
                    status = RequirementStatus.NON_COMPLIANT

                # Generate recommendations
                recommendations = []
                for gap in gaps:
                    check_name = gap.split(":")[0]
                    recommendations.append(
                        f"Implement and document {check_name.replace('_', ' ')}"
                    )

                checks.append(RequirementCheck(
                    article=f"{article} ({article_data['title']})",
                    requirement=f"{req['id']}: {req['description']}",
                    status=status,
                    evidence=evidence,
                    gaps=gaps,
                    recommendations=recommendations,
                ))

        # Calculate overall compliance
        compliance_score = compliant_checks / total_checks if total_checks > 0 else 0

        if compliance_score >= 0.9:
            overall_status = RequirementStatus.COMPLIANT
        elif compliance_score >= 0.5:
            overall_status = RequirementStatus.PARTIAL
        else:
            overall_status = RequirementStatus.NON_COMPLIANT

        # Generate summary
        non_compliant_count = sum(
            1 for c in checks if c.status == RequirementStatus.NON_COMPLIANT
        )
        partial_count = sum(
            1 for c in checks if c.status == RequirementStatus.PARTIAL
        )

        summary = (
            f"Compliance assessment for {system_name}: "
            f"{compliance_score:.0%} compliant. "
            f"{non_compliant_count} non-compliant requirements, "
            f"{partial_count} partially compliant."
        )

        return ComplianceReport(
            system_name=system_name,
            overall_status=overall_status,
            compliance_score=compliance_score,
            checks=checks,
            summary=summary,
        )

    def get_all_requirements(self) -> list[dict[str, Any]]:
        """Get list of all requirements."""
        all_reqs = []
        for article, article_data in self.requirements.items():
            for req in article_data["requirements"]:
                all_reqs.append({
                    "article": article,
                    "title": article_data["title"],
                    "id": req["id"],
                    "description": req["description"],
                    "checks": req["checks"],
                })
        return all_reqs

    def get_compliance_checklist(self) -> list[str]:
        """Generate a compliance checklist."""
        checklist = []
        for article, article_data in self.requirements.items():
            checklist.append(f"\n{article}: {article_data['title']}")
            for req in article_data["requirements"]:
                checklist.append(f"  [ ] {req['id']}: {req['description']}")
                for check in req["checks"]:
                    checklist.append(f"      [ ] {check.replace('_', ' ').title()}")
        return checklist
