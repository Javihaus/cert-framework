"""
CERT Readiness Assessment Module
=================================

This module provides AI readiness assessment tools based on the EU AI Act
and industry best practices. It helps organizations:

1. Classify their AI systems by risk level
2. Assess their compliance readiness
3. Identify gaps in their current setup
4. Generate actionable remediation plans

Usage:
    >>> from cert.assessment import run_assessment
    >>> report = run_assessment(interactive=True)
    >>> print(report['risk_classification']['level'])
    'HIGH_RISK'
"""

from cert.assessment.questionnaire import (
    Question,
    ANNEX_III_QUESTIONS,
    READINESS_QUESTIONS,
    run_interactive_questionnaire,
)
from cert.assessment.classifier import (
    classify_risk,
    get_compliance_requirements,
    get_legal_basis,
)
from cert.assessment.readiness import (
    assess_readiness,
    identify_gaps,
    get_remediation_actions,
)
from cert.assessment.report_generator import (
    generate_report,
    estimate_timeline,
    estimate_cost,
)

__all__ = [
    "Question",
    "ANNEX_III_QUESTIONS",
    "READINESS_QUESTIONS",
    "run_interactive_questionnaire",
    "classify_risk",
    "get_compliance_requirements",
    "get_legal_basis",
    "assess_readiness",
    "identify_gaps",
    "get_remediation_actions",
    "generate_report",
    "estimate_timeline",
    "estimate_cost",
]
