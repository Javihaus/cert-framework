"""
Systemic Risk Assessment for GPAI Models

Implements EU AI Act Article 51 requirements for assessing
systemic risks of general-purpose AI models.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class SystemicRiskLevel(Enum):
    """Systemic risk classification levels."""

    NOT_APPLICABLE = "not_applicable"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class RiskCategory(Enum):
    """Categories of systemic risk."""

    CAPABILITY_RISK = "capability_risk"
    MISUSE_RISK = "misuse_risk"
    SOCIETAL_RISK = "societal_risk"
    SAFETY_RISK = "safety_risk"
    SECURITY_RISK = "security_risk"
    ECONOMIC_RISK = "economic_risk"


@dataclass
class RiskFactor:
    """Individual risk factor assessment."""

    category: RiskCategory
    name: str
    description: str
    severity: float  # 0.0 to 1.0
    likelihood: float  # 0.0 to 1.0
    mitigations: list[str] = field(default_factory=list)
    residual_risk: float | None = None


@dataclass
class SystemicRiskAssessmentResult:
    """Complete systemic risk assessment result."""

    model_name: str
    overall_risk_level: SystemicRiskLevel
    is_systemic_risk_model: bool
    risk_score: float  # 0.0 to 1.0
    risk_factors: list[RiskFactor]
    thresholds_exceeded: list[str]
    required_measures: list[str]
    assessment_date: datetime = field(default_factory=datetime.utcnow)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "model_name": self.model_name,
            "overall_risk_level": self.overall_risk_level.value,
            "is_systemic_risk_model": self.is_systemic_risk_model,
            "risk_score": self.risk_score,
            "risk_factors": [
                {
                    "category": rf.category.value,
                    "name": rf.name,
                    "description": rf.description,
                    "severity": rf.severity,
                    "likelihood": rf.likelihood,
                    "mitigations": rf.mitigations,
                    "residual_risk": rf.residual_risk,
                }
                for rf in self.risk_factors
            ],
            "thresholds_exceeded": self.thresholds_exceeded,
            "required_measures": self.required_measures,
            "assessment_date": self.assessment_date.isoformat(),
            "notes": self.notes,
        }


# EU AI Act Systemic Risk Thresholds
SYSTEMIC_RISK_THRESHOLDS = {
    "compute_flops": 1e25,  # 10^25 FLOPs threshold from Article 51
    "user_count": 10_000_000,  # 10 million users as indicator
    "market_reach": 0.5,  # 50% market penetration indicator
}

# Required measures for systemic risk models (Article 55)
SYSTEMIC_RISK_MEASURES = [
    "Perform model evaluation including adversarial testing",
    "Assess and mitigate systemic risks, including through external testing",
    "Track, document, and report serious incidents without undue delay",
    "Ensure adequate cybersecurity protection",
    "Document and report energy consumption",
    "Cooperate with AI Office and national authorities",
    "Maintain crisis response procedures",
]


class SystemicRiskAssessment:
    """
    Systemic risk assessment for GPAI models.

    Implements EU AI Act Article 51-55 requirements for identifying
    and managing systemic risks in general-purpose AI models.

    Example:
        assessor = SystemicRiskAssessment()

        result = assessor.assess(
            model_name="MyLargeModel",
            compute_flops=5e25,
            user_count=50_000_000,
            capabilities=["code_generation", "content_creation"],
            deployment_scale="global"
        )

        if result.is_systemic_risk_model:
            print("Model classified as systemic risk")
            for measure in result.required_measures:
                print(f"  Required: {measure}")
    """

    def __init__(
        self,
        custom_thresholds: dict[str, float] | None = None,
    ):
        """
        Initialize the assessor.

        Args:
            custom_thresholds: Override default thresholds
        """
        self.thresholds = SYSTEMIC_RISK_THRESHOLDS.copy()
        if custom_thresholds:
            self.thresholds.update(custom_thresholds)

    def assess(
        self,
        model_name: str,
        compute_flops: float | None = None,
        user_count: int | None = None,
        capabilities: list[str] | None = None,
        deployment_scale: str = "limited",
        has_agency_capabilities: bool = False,
        can_generate_harmful_content: bool = False,
        can_influence_elections: bool = False,
        additional_factors: dict[str, Any] | None = None,
    ) -> SystemicRiskAssessmentResult:
        """
        Perform systemic risk assessment.

        Args:
            model_name: Name of the model
            compute_flops: Training compute in FLOPs
            user_count: Number of users/deployments
            capabilities: List of model capabilities
            deployment_scale: "limited", "regional", "national", "global"
            has_agency_capabilities: Can the model take autonomous actions
            can_generate_harmful_content: Can generate harmful content at scale
            can_influence_elections: Can be used for electoral manipulation
            additional_factors: Additional risk factors

        Returns:
            SystemicRiskAssessmentResult
        """
        capabilities = capabilities or []
        additional_factors = additional_factors or {}
        risk_factors = []
        thresholds_exceeded = []
        notes = []

        # Check compute threshold (primary indicator per Article 51)
        compute_risk = 0.0
        if compute_flops:
            if compute_flops >= self.thresholds["compute_flops"]:
                thresholds_exceeded.append(
                    f"Training compute ({compute_flops:.2e}) exceeds threshold ({self.thresholds['compute_flops']:.0e})"
                )
                compute_risk = 0.9
                notes.append("Model exceeds compute threshold - presumed systemic risk")
            elif compute_flops >= self.thresholds["compute_flops"] * 0.5:
                compute_risk = 0.6
                notes.append("Model approaching compute threshold")

        # Check user count
        user_risk = 0.0
        if user_count:
            if user_count >= self.thresholds["user_count"]:
                thresholds_exceeded.append(
                    f"User count ({user_count:,}) exceeds indicator threshold"
                )
                user_risk = 0.7
            elif user_count >= self.thresholds["user_count"] * 0.5:
                user_risk = 0.4

        # Assess capability risks
        capability_risks = self._assess_capability_risks(capabilities, has_agency_capabilities)
        risk_factors.extend(capability_risks)

        # Assess misuse risks
        misuse_risks = self._assess_misuse_risks(
            can_generate_harmful_content,
            can_influence_elections,
        )
        risk_factors.extend(misuse_risks)

        # Assess deployment scale risk
        scale_risk = self._assess_scale_risk(deployment_scale)
        if scale_risk:
            risk_factors.append(scale_risk)

        # Calculate overall risk score
        factor_scores = [rf.severity * rf.likelihood for rf in risk_factors]
        capability_score = max(factor_scores) if factor_scores else 0.0

        # Weighted combination
        risk_score = max(
            compute_risk * 0.4 + user_risk * 0.3 + capability_score * 0.3,
            compute_risk,  # Compute alone can trigger systemic risk
        )

        # Determine risk level
        if risk_score >= 0.8 or compute_flops and compute_flops >= self.thresholds["compute_flops"]:
            risk_level = SystemicRiskLevel.VERY_HIGH
            is_systemic = True
        elif risk_score >= 0.6:
            risk_level = SystemicRiskLevel.HIGH
            is_systemic = True
        elif risk_score >= 0.4:
            risk_level = SystemicRiskLevel.MEDIUM
            is_systemic = False
        elif risk_score >= 0.2:
            risk_level = SystemicRiskLevel.LOW
            is_systemic = False
        else:
            risk_level = SystemicRiskLevel.NOT_APPLICABLE
            is_systemic = False

        # Determine required measures
        required_measures = []
        if is_systemic:
            required_measures = SYSTEMIC_RISK_MEASURES.copy()

        return SystemicRiskAssessmentResult(
            model_name=model_name,
            overall_risk_level=risk_level,
            is_systemic_risk_model=is_systemic,
            risk_score=risk_score,
            risk_factors=risk_factors,
            thresholds_exceeded=thresholds_exceeded,
            required_measures=required_measures,
            notes=notes,
        )

    def _assess_capability_risks(
        self,
        capabilities: list[str],
        has_agency: bool,
    ) -> list[RiskFactor]:
        """Assess capability-related risks."""
        risks = []

        high_risk_capabilities = {
            "code_generation": ("Code generation at scale", 0.6, 0.7),
            "autonomous_agents": ("Autonomous agent capabilities", 0.8, 0.6),
            "persuasion": ("Advanced persuasion capabilities", 0.7, 0.5),
            "scientific_research": ("Scientific research assistance", 0.5, 0.6),
            "cybersecurity": ("Cybersecurity tool generation", 0.7, 0.5),
            "bioweapon": ("Bioweapon knowledge synthesis", 0.9, 0.3),
            "self_replication": ("Self-replication capabilities", 0.9, 0.2),
        }

        for cap in capabilities:
            cap_lower = cap.lower()
            for key, (name, severity, likelihood) in high_risk_capabilities.items():
                if key in cap_lower:
                    risks.append(
                        RiskFactor(
                            category=RiskCategory.CAPABILITY_RISK,
                            name=name,
                            description=f"Model has {cap} capability",
                            severity=severity,
                            likelihood=likelihood,
                        )
                    )

        if has_agency:
            risks.append(
                RiskFactor(
                    category=RiskCategory.CAPABILITY_RISK,
                    name="Agency capabilities",
                    description="Model can take autonomous actions in the world",
                    severity=0.8,
                    likelihood=0.7,
                )
            )

        return risks

    def _assess_misuse_risks(
        self,
        can_generate_harmful: bool,
        can_influence_elections: bool,
    ) -> list[RiskFactor]:
        """Assess misuse-related risks."""
        risks = []

        if can_generate_harmful:
            risks.append(
                RiskFactor(
                    category=RiskCategory.MISUSE_RISK,
                    name="Harmful content generation",
                    description="Model can generate harmful content at scale",
                    severity=0.7,
                    likelihood=0.6,
                    mitigations=["Content filtering", "Output monitoring", "Use policies"],
                )
            )

        if can_influence_elections:
            risks.append(
                RiskFactor(
                    category=RiskCategory.SOCIETAL_RISK,
                    name="Electoral influence",
                    description="Model could be used for electoral manipulation",
                    severity=0.9,
                    likelihood=0.4,
                    mitigations=[
                        "Political content policies",
                        "Provenance marking",
                        "Usage monitoring",
                    ],
                )
            )

        return risks

    def _assess_scale_risk(self, deployment_scale: str) -> RiskFactor | None:
        """Assess deployment scale risk."""
        scale_severity = {
            "limited": 0.2,
            "regional": 0.4,
            "national": 0.6,
            "global": 0.8,
        }

        severity = scale_severity.get(deployment_scale.lower(), 0.3)
        if severity >= 0.5:
            return RiskFactor(
                category=RiskCategory.SOCIETAL_RISK,
                name="Deployment scale",
                description=f"{deployment_scale.title()} deployment scale",
                severity=severity,
                likelihood=0.8,
            )
        return None

    def export_assessment(
        self,
        result: SystemicRiskAssessmentResult,
        filepath: str,
    ) -> bool:
        """Export assessment to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(result.to_dict(), f, indent=2)
            return True
        except Exception:
            return False
