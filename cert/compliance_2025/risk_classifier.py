"""
EU AI Act Risk Classification Engine

Automatic classification of AI systems according to EU AI Act risk tiers
based on Annex III use cases and system characteristics.

Risk Levels:
- Unacceptable: Prohibited practices (social scoring, emotion recognition at work, etc.)
- High-Risk: Systems in Annex III domains requiring full compliance
- Limited: Transparency-only obligations (chatbots, deep fakes, etc.)
- Minimal: No specific obligations (spam filters, AI in games, etc.)
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class RiskLevel(Enum):
    """EU AI Act risk classification levels."""

    UNACCEPTABLE = "unacceptable"
    HIGH = "high"
    LIMITED = "limited"
    MINIMAL = "minimal"


class UseCase(Enum):
    """Annex III use case categories for high-risk classification."""

    # Biometrics
    BIOMETRIC_ID_REMOTE = "biometric_identification_remote"
    BIOMETRIC_CATEGORIZATION = "biometric_categorization"
    EMOTION_RECOGNITION = "emotion_recognition"

    # Critical Infrastructure
    INFRASTRUCTURE_SAFETY = "critical_infrastructure_safety"
    INFRASTRUCTURE_MANAGEMENT = "critical_infrastructure_management"

    # Education
    EDUCATION_ACCESS = "educational_access_determination"
    EDUCATION_ASSESSMENT = "educational_assessment"
    EDUCATION_CHEATING = "cheating_detection"

    # Employment
    EMPLOYMENT_RECRUITMENT = "recruitment_selection"
    EMPLOYMENT_DECISIONS = "employment_decisions"
    EMPLOYMENT_MONITORING = "worker_monitoring"

    # Essential Services
    CREDIT_SCORING = "credit_scoring"
    INSURANCE_RISK = "insurance_risk_assessment"
    SOCIAL_SERVICES = "social_services_access"

    # Law Enforcement
    LAW_ENFORCEMENT_PROFILING = "law_enforcement_profiling"
    POLYGRAPH = "polygraph_ai"
    CRIME_PREDICTION = "predictive_policing"

    # Migration
    MIGRATION_RISK = "migration_risk_assessment"
    BORDER_CONTROL = "border_control"
    VISA_PROCESSING = "visa_application_processing"

    # Justice
    JUDICIAL_RESEARCH = "judicial_fact_research"
    SENTENCING = "sentencing_recommendation"

    # Electoral
    ELECTORAL_INFLUENCE = "electoral_influence"

    # General Purpose
    GPAI = "general_purpose_ai"
    GPAI_SYSTEMIC = "gpai_systemic_risk"


@dataclass
class RiskIndicator:
    """An indicator contributing to risk assessment."""

    indicator: str
    present: bool
    weight: float  # Contribution to risk score
    description: str


@dataclass
class RiskAssessment:
    """Complete risk assessment result."""

    system_name: str
    risk_level: RiskLevel
    confidence: float
    use_cases: list[UseCase]
    indicators: list[RiskIndicator]
    requirements: list[str]
    deadline: str
    assessment_date: datetime = field(default_factory=datetime.utcnow)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "system_name": self.system_name,
            "risk_level": self.risk_level.value,
            "confidence": self.confidence,
            "use_cases": [uc.value for uc in self.use_cases],
            "indicators": [
                {
                    "indicator": i.indicator,
                    "present": i.present,
                    "weight": i.weight,
                    "description": i.description,
                }
                for i in self.indicators
            ],
            "requirements": self.requirements,
            "deadline": self.deadline,
            "assessment_date": self.assessment_date.isoformat(),
            "notes": self.notes,
        }


# Annex III high-risk use cases mapping
ANNEX_III_CATEGORIES = {
    # Category 1: Biometrics
    "biometrics": {
        "use_cases": [
            UseCase.BIOMETRIC_ID_REMOTE,
            UseCase.BIOMETRIC_CATEGORIZATION,
            UseCase.EMOTION_RECOGNITION,
        ],
        "keywords": [
            "biometric",
            "facial recognition",
            "face detection",
            "fingerprint",
            "iris scan",
            "voice recognition",
            "emotion detection",
            "sentiment analysis",
        ],
        "requirements": [
            "Biometric data protection measures",
            "Human oversight for identification",
            "Accuracy validation across demographic groups",
            "Logging of all biometric processing",
        ],
    },
    # Category 2: Critical Infrastructure
    "critical_infrastructure": {
        "use_cases": [
            UseCase.INFRASTRUCTURE_SAFETY,
            UseCase.INFRASTRUCTURE_MANAGEMENT,
        ],
        "keywords": [
            "power grid",
            "energy",
            "water supply",
            "traffic",
            "transport",
            "digital infrastructure",
            "safety critical",
            "scada",
            "ics",
        ],
        "requirements": [
            "Safety impact assessment",
            "Redundancy and fallback systems",
            "Real-time monitoring capabilities",
            "Incident response procedures",
        ],
    },
    # Category 3: Education
    "education": {
        "use_cases": [
            UseCase.EDUCATION_ACCESS,
            UseCase.EDUCATION_ASSESSMENT,
            UseCase.EDUCATION_CHEATING,
        ],
        "keywords": [
            "student assessment",
            "admission",
            "exam",
            "grading",
            "learning",
            "educational evaluation",
            "proctoring",
            "cheating detection",
        ],
        "requirements": [
            "Fairness validation across student groups",
            "Appeal mechanisms",
            "Explanation of decisions",
            "Human review option",
        ],
    },
    # Category 4: Employment
    "employment": {
        "use_cases": [
            UseCase.EMPLOYMENT_RECRUITMENT,
            UseCase.EMPLOYMENT_DECISIONS,
            UseCase.EMPLOYMENT_MONITORING,
        ],
        "keywords": [
            "recruitment",
            "hiring",
            "cv screening",
            "resume",
            "interview",
            "promotion",
            "termination",
            "performance evaluation",
            "employee monitoring",
        ],
        "requirements": [
            "Non-discrimination validation",
            "Transparency to candidates/employees",
            "Human review of significant decisions",
            "Data minimization",
        ],
    },
    # Category 5: Essential Services
    "essential_services": {
        "use_cases": [
            UseCase.CREDIT_SCORING,
            UseCase.INSURANCE_RISK,
            UseCase.SOCIAL_SERVICES,
        ],
        "keywords": [
            "credit score",
            "loan",
            "mortgage",
            "insurance",
            "benefits",
            "social assistance",
            "welfare",
            "risk assessment",
            "financial",
        ],
        "requirements": [
            "Explainability of decisions",
            "Right to human review",
            "Non-discrimination testing",
            "Regular accuracy audits",
        ],
    },
    # Category 6: Law Enforcement
    "law_enforcement": {
        "use_cases": [
            UseCase.LAW_ENFORCEMENT_PROFILING,
            UseCase.POLYGRAPH,
            UseCase.CRIME_PREDICTION,
        ],
        "keywords": [
            "police",
            "law enforcement",
            "criminal",
            "profiling",
            "predictive policing",
            "risk assessment",
            "recidivism",
            "lie detection",
            "evidence",
        ],
        "requirements": [
            "Strict logging requirements",
            "Human decision-making authority",
            "Regular bias audits",
            "Fundamental rights impact assessment",
        ],
    },
    # Category 7: Migration
    "migration": {
        "use_cases": [
            UseCase.MIGRATION_RISK,
            UseCase.BORDER_CONTROL,
            UseCase.VISA_PROCESSING,
        ],
        "keywords": [
            "migration",
            "asylum",
            "visa",
            "border",
            "immigration",
            "refugee",
            "travel document",
            "entry",
            "deportation",
        ],
        "requirements": [
            "Human oversight mandatory",
            "Appeal mechanisms",
            "Non-discrimination safeguards",
            "Logging of all decisions",
        ],
    },
    # Category 8: Justice
    "justice": {
        "use_cases": [
            UseCase.JUDICIAL_RESEARCH,
            UseCase.SENTENCING,
        ],
        "keywords": [
            "court",
            "judicial",
            "legal",
            "sentencing",
            "verdict",
            "legal research",
            "case law",
            "judge",
            "prosecution",
        ],
        "requirements": [
            "Human judicial authority",
            "Transparency to affected parties",
            "Regular accuracy validation",
            "Fundamental rights compliance",
        ],
    },
}

# Prohibited (unacceptable risk) practices
PROHIBITED_PRACTICES = [
    {
        "name": "Social scoring by public authorities",
        "keywords": ["social score", "social credit", "citizen rating", "behavior score"],
        "description": "AI systems that evaluate or classify natural persons based on their social behavior",
    },
    {
        "name": "Exploitation of vulnerabilities",
        "keywords": [
            "exploit vulnerable",
            "target vulnerable",
            "manipulate children",
            "elderly manipulation",
        ],
        "description": "AI systems that exploit vulnerabilities of specific groups",
    },
    {
        "name": "Subliminal manipulation",
        "keywords": ["subliminal", "subconscious manipulation", "hidden influence"],
        "description": "AI systems using subliminal techniques beyond awareness",
    },
    {
        "name": "Real-time biometric identification in public",
        "keywords": ["real-time facial", "live biometric", "public surveillance biometric"],
        "description": "Real-time remote biometric identification in publicly accessible spaces",
    },
    {
        "name": "Emotion recognition in workplace/education",
        "keywords": ["workplace emotion", "employee emotion", "student emotion monitoring"],
        "description": "Emotion recognition systems in workplace or educational institutions",
    },
    {
        "name": "Biometric categorization (sensitive)",
        "keywords": ["race detection", "religion detection", "sexual orientation detection"],
        "description": "Biometric categorization inferring sensitive attributes",
    },
    {
        "name": "Untargeted facial recognition scraping",
        "keywords": ["facial scraping", "untargeted face collection", "mass facial database"],
        "description": "Creating facial recognition databases through untargeted scraping",
    },
]


class AIActRiskClassifier:
    """
    EU AI Act risk classification engine.

    Automatically classifies AI systems according to EU AI Act risk tiers
    based on system metadata, intended use, and domain characteristics.

    Example:
        classifier = AIActRiskClassifier()

        # Classify a system
        assessment = classifier.classify(
            system_name="HR Recruitment Assistant",
            description="AI system for screening job applications",
            domain="employment",
            keywords=["recruitment", "cv screening", "hiring"]
        )

        print(f"Risk Level: {assessment.risk_level.value}")
        for req in assessment.requirements:
            print(f"  - {req}")
    """

    def __init__(
        self,
        strict_mode: bool = True,
        include_gpai: bool = True,
    ):
        """
        Initialize the classifier.

        Args:
            strict_mode: Use conservative classification (default True)
            include_gpai: Consider GPAI classifications
        """
        self.strict_mode = strict_mode
        self.include_gpai = include_gpai

    def classify(
        self,
        system_name: str,
        description: str = "",
        domain: str = "",
        keywords: list[str] | None = None,
        is_gpai: bool = False,
        compute_flops: float | None = None,  # For GPAI systemic risk
        user_count: int | None = None,  # For GPAI systemic risk
        additional_metadata: dict[str, Any] | None = None,
    ) -> RiskAssessment:
        """
        Classify an AI system's risk level.

        Args:
            system_name: Name of the AI system
            description: System description
            domain: Primary domain (e.g., "employment", "healthcare")
            keywords: Relevant keywords describing functionality
            is_gpai: Whether this is a general-purpose AI model
            compute_flops: Training compute for GPAI (for systemic risk)
            user_count: Number of users for GPAI (for systemic risk)
            additional_metadata: Additional classification metadata

        Returns:
            RiskAssessment with full classification details
        """
        keywords = keywords or []
        all_text = f"{system_name} {description} {' '.join(keywords)}".lower()
        indicators: list[RiskIndicator] = []
        detected_use_cases: list[UseCase] = []
        notes: list[str] = []

        # Check for prohibited practices first
        for practice in PROHIBITED_PRACTICES:
            practice_detected = any(kw in all_text for kw in practice["keywords"])
            indicators.append(
                RiskIndicator(
                    indicator=f"Prohibited: {practice['name']}",
                    present=practice_detected,
                    weight=1.0 if practice_detected else 0.0,
                    description=practice["description"],
                )
            )

            if practice_detected:
                return RiskAssessment(
                    system_name=system_name,
                    risk_level=RiskLevel.UNACCEPTABLE,
                    confidence=0.95 if self.strict_mode else 0.85,
                    use_cases=[],
                    indicators=indicators,
                    requirements=["System use is prohibited under EU AI Act"],
                    deadline="Immediate - Prohibited Practice",
                    notes=[f"Detected prohibited practice: {practice['name']}"],
                )

        # Check Annex III high-risk categories
        requirements = []
        for category_name, category_data in ANNEX_III_CATEGORIES.items():
            category_match = domain.lower() == category_name
            keyword_matches = sum(1 for kw in category_data["keywords"] if kw in all_text)

            is_match = category_match or keyword_matches >= 2

            indicators.append(
                RiskIndicator(
                    indicator=f"Annex III: {category_name}",
                    present=is_match,
                    weight=0.8 if is_match else 0.0,
                    description=f"Category match: {category_match}, Keywords: {keyword_matches}",
                )
            )

            if is_match:
                detected_use_cases.extend(category_data["use_cases"])
                requirements.extend(category_data["requirements"])
                notes.append(f"Matched category: {category_name}")

        # Check GPAI
        if is_gpai and self.include_gpai:
            detected_use_cases.append(UseCase.GPAI)

            # Check for systemic risk (>10^25 FLOPs or other criteria)
            systemic_risk = False
            if compute_flops and compute_flops >= 1e25:
                systemic_risk = True
                notes.append(f"GPAI with systemic risk (compute: {compute_flops:.2e} FLOPs)")

            if user_count and user_count >= 10_000_000:
                systemic_risk = True
                notes.append(f"GPAI with systemic risk (users: {user_count:,})")

            if systemic_risk:
                detected_use_cases.append(UseCase.GPAI_SYSTEMIC)
                requirements.extend(
                    [
                        "Model evaluation and testing",
                        "Systemic risk assessment",
                        "Incident reporting",
                        "Cybersecurity measures",
                    ]
                )

            indicators.append(
                RiskIndicator(
                    indicator="GPAI System",
                    present=True,
                    weight=0.5,
                    description=f"General-purpose AI, systemic risk: {systemic_risk}",
                )
            )

        # Determine final risk level
        if detected_use_cases:
            risk_level = RiskLevel.HIGH
            confidence = 0.9
            deadline = "August 2, 2025 - High-Risk System Compliance"
        elif any(kw in all_text for kw in ["chatbot", "assistant", "conversational"]):
            risk_level = RiskLevel.LIMITED
            confidence = 0.75
            deadline = "August 2, 2025 - Transparency Requirements"
            requirements = [
                "Disclose AI nature to users",
                "Transparency for AI-generated content",
                "Information about capabilities and limitations",
            ]
            notes.append("Detected as interactive AI system (limited risk)")
        else:
            risk_level = RiskLevel.MINIMAL
            confidence = 0.6
            deadline = "No specific deadline - Voluntary best practices"
            requirements = [
                "Consider voluntary code of conduct",
                "Basic documentation recommended",
            ]

        # Remove duplicate requirements
        requirements = list(dict.fromkeys(requirements))

        return RiskAssessment(
            system_name=system_name,
            risk_level=risk_level,
            confidence=confidence,
            use_cases=list(set(detected_use_cases)),
            indicators=indicators,
            requirements=requirements,
            deadline=deadline,
            notes=notes,
        )

    def get_requirements_for_level(
        self,
        risk_level: RiskLevel,
    ) -> list[str]:
        """Get all requirements for a given risk level."""
        if risk_level == RiskLevel.UNACCEPTABLE:
            return ["Use is prohibited - discontinue immediately"]

        if risk_level == RiskLevel.HIGH:
            return [
                "Risk management system (Article 9)",
                "Data governance (Article 10)",
                "Technical documentation (Article 11)",
                "Record-keeping (Article 12)",
                "Transparency to users (Article 13)",
                "Human oversight provisions (Article 14)",
                "Accuracy, robustness, cybersecurity (Article 15)",
                "Quality management system (Article 17)",
                "Conformity assessment",
                "EU declaration of conformity",
                "CE marking",
                "Registration in EU database",
            ]

        if risk_level == RiskLevel.LIMITED:
            return [
                "Inform users of AI interaction",
                "Label AI-generated content",
                "Transparency about capabilities",
            ]

        return [
            "No mandatory requirements",
            "Voluntary codes of conduct encouraged",
        ]

    def get_deadline(self, risk_level: RiskLevel) -> str:
        """Get compliance deadline for risk level."""
        deadlines = {
            RiskLevel.UNACCEPTABLE: "February 2, 2025",
            RiskLevel.HIGH: "August 2, 2025",
            RiskLevel.LIMITED: "August 2, 2025",
            RiskLevel.MINIMAL: "No specific deadline",
        }
        return deadlines.get(risk_level, "Unknown")

    def export_assessment(
        self,
        assessment: RiskAssessment,
        filepath: str,
    ) -> bool:
        """Export assessment to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(assessment.to_dict(), f, indent=2)
            return True
        except Exception:
            return False
