"""
CERT Framework - High-Risk AI System Compliance Module

Implements EU AI Act requirements for high-risk AI systems:
- Article 9: Risk Management System
- Article 10: Data Governance
- Article 11: Technical Documentation
- Article 14: Human Oversight
- Article 15: Accuracy, Robustness, Cybersecurity
"""

from cert.compliance_2025.high_risk.requirements import HighRiskRequirements
from cert.compliance_2025.high_risk.documentation import HighRiskDocumentation
from cert.compliance_2025.high_risk.human_oversight import HumanOversight, requires_human_oversight

__all__ = [
    "HighRiskRequirements",
    "HighRiskDocumentation",
    "HumanOversight",
    "requires_human_oversight",
]
