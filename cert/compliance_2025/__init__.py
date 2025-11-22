"""
CERT Framework - EU AI Act 2025 Compliance Module

Comprehensive compliance support for the EU AI Act with August 2025 deadlines.
Provides automatic risk classification, high-risk system requirements,
GPAI model documentation, and audit preparation.

Key Components:
- Risk Classifier: Automatic risk level classification per Annex III
- High-Risk Module: Requirements, documentation, human oversight
- GPAI Module: Model cards, systemic risk assessment, transparency
- Audit Module: Conformity assessment, EU database registration
"""

from cert.compliance_2025.risk_classifier import (
    AIActRiskClassifier,
    RiskLevel,
    RiskAssessment,
    UseCase,
)
from cert.compliance_2025.high_risk import (
    HighRiskRequirements,
    HighRiskDocumentation,
    HumanOversight,
    requires_human_oversight,
)
from cert.compliance_2025.gpai import (
    ModelCard,
    ModelCardGenerator,
    SystemicRiskAssessment,
    TransparencyRequirements,
)
from cert.compliance_2025.audit import (
    ConformityAssessment,
    EUDatabaseRegistration,
    AuditReport,
)

__all__ = [
    # Risk Classification
    "AIActRiskClassifier",
    "RiskLevel",
    "RiskAssessment",
    "UseCase",
    # High-Risk
    "HighRiskRequirements",
    "HighRiskDocumentation",
    "HumanOversight",
    "requires_human_oversight",
    # GPAI
    "ModelCard",
    "ModelCardGenerator",
    "SystemicRiskAssessment",
    "TransparencyRequirements",
    # Audit
    "ConformityAssessment",
    "EUDatabaseRegistration",
    "AuditReport",
]
