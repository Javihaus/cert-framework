"""Industry Presets for CERT Monitoring
=====================================

Provides recommended monitoring thresholds for different industries based on
regulatory requirements and risk tolerance.

IMPORTANT: These are starting point recommendations, NOT empirically validated
thresholds. They are based on:
- Regulatory compliance requirements (HIPAA, SOX, EU AI Act, etc.)
- Industry-standard risk tolerance levels
- Common audit retention policies

You should adjust these based on your specific:
- Use case criticality
- Regulatory environment
- Risk appetite
- Internal testing results

Audit Retention Periods (Regulatory Basis):
-------------------------------------------
- Healthcare: 10 years (HIPAA § 164.530(j)(2) - medical records retention)
- Financial: 7 years (SEC Rule 17a-4, SOX requirements)
- Legal: 7 years (State bar ethics rules, varies by jurisdiction)
- General: 6 months (EU AI Act Article 19 minimum logging requirement)

Threshold Guidelines:
--------------------
These thresholds represent suggested starting points:
- accuracy_threshold: Minimum accuracy before alerting
- hallucination_tolerance: Maximum hallucination rate before alerting
- Higher values = More strict (reject more outputs)
- Lower values = More permissive (accept more outputs)
"""

from enum import Enum
from typing import Dict, Union


class Preset(str, Enum):
    """Industry presets for compliance monitoring."""

    HEALTHCARE = "healthcare"
    FINANCIAL = "financial"
    LEGAL = "legal"
    GENERAL = "general"


PRESETS: Dict[str, Dict[str, float]] = {
    "healthcare": {
        "accuracy_threshold": 0.95,
        "hallucination_tolerance": 0.02,
        "audit_retention_days": 3650,  # 10 years
        "description": "Patient safety critical - strictest monitoring thresholds",
        "regulatory_basis": "HIPAA § 164.530(j)(2), FDA 21 CFR Part 11",
        "rationale": "Patient safety requires highest accuracy, minimal hallucination tolerance",
    },
    "financial": {
        "accuracy_threshold": 0.90,
        "hallucination_tolerance": 0.05,
        "audit_retention_days": 2555,  # 7 years
        "description": "Financial accuracy and compliance requirements",
        "regulatory_basis": "SEC Rule 17a-4, SOX Section 802, FINRA Rule 4511",
        "rationale": "Financial accuracy critical, moderate hallucination tolerance for market data",
    },
    "legal": {
        "accuracy_threshold": 0.92,
        "hallucination_tolerance": 0.03,
        "audit_retention_days": 2555,  # 7 years
        "description": "Legal accuracy critical with moderate risk tolerance",
        "regulatory_basis": "State bar ethics rules, ABA Model Rules 1.1 & 1.6",
        "rationale": "Legal accuracy essential, low hallucination tolerance for client advice",
    },
    "general": {
        "accuracy_threshold": 0.80,
        "hallucination_tolerance": 0.10,
        "audit_retention_days": 180,  # 6 months
        "description": "Balanced thresholds for general-purpose applications",
        "regulatory_basis": "EU AI Act Article 19 minimum logging requirements",
        "rationale": "Balanced approach suitable for non-critical applications",
    },
}


def get_preset(preset: Union[str, Preset]) -> Dict[str, float]:
    """Get preset configuration by name.

    Args:
        preset: Preset name or Preset enum value

    Returns:
        Configuration dictionary with accuracy_threshold, hallucination_tolerance,
        audit_retention_months

    Raises:
        ValueError: If preset name is invalid

    Examples:
        >>> config = get_preset("financial")
        >>> config["accuracy_threshold"]
        0.95

        >>> config = get_preset(Preset.HEALTHCARE)
        >>> config["hallucination_tolerance"]
        0.005
    """
    if isinstance(preset, Preset):
        preset = preset.value

    if preset not in PRESETS:
        valid_presets = ", ".join(PRESETS.keys())
        raise ValueError(f"Invalid preset '{preset}'. Valid presets: {valid_presets}")

    return PRESETS[preset]


def list_presets() -> Dict[str, str]:
    """List all available presets with descriptions.

    Returns:
        Dictionary mapping preset names to descriptions

    Example:
        >>> presets = list_presets()
        >>> for name, desc in presets.items():
        ...     print(f"{name}: {desc}")
        financial: Strict accuracy for financial services...
        healthcare: Very strict accuracy for healthcare...
        general: Balanced accuracy for general use...
    """
    return {name: config["description"] for name, config in PRESETS.items()}
