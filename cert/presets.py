"""Industry presets for CERT monitoring.

Provides pre-configured settings for different regulatory environments.

NOTE: Accuracy thresholds are configurable starting points based on regulatory
strictness requirements. These values should be validated through testing on
your specific use case and adjusted as needed.

Audit retention periods are based on actual regulatory requirements:
- Financial: 7 years (SEC, FINRA requirements)
- Healthcare: 10 years (HIPAA minimum for medical records)
- General: 6 months (EU AI Act Article 19 minimum)
"""

from enum import Enum
from typing import Dict, Union


class Preset(str, Enum):
    """Industry presets for compliance monitoring."""

    FINANCIAL = "financial"
    HEALTHCARE = "healthcare"
    GENERAL = "general"


PRESETS: Dict[str, Dict[str, float]] = {
    "financial": {
        "accuracy_threshold": 0.95,  # Stricter threshold for financial services
        "hallucination_tolerance": 0.01,  # Lower tolerance for financial compliance
        "audit_retention_months": 84,  # 7 years (SEC, FINRA requirements)
        "description": "Stricter thresholds for financial services with 7-year audit retention (SEC/FINRA)",
    },
    "healthcare": {
        "accuracy_threshold": 0.98,  # Strictest threshold for healthcare
        "hallucination_tolerance": 0.005,  # Lowest tolerance for patient safety
        "audit_retention_months": 120,  # 10 years (HIPAA minimum)
        "description": "Strictest thresholds for healthcare with 10-year audit retention (HIPAA)",
    },
    "general": {
        "accuracy_threshold": 0.90,  # Balanced threshold for general use
        "hallucination_tolerance": 0.05,  # Standard tolerance for general applications
        "audit_retention_months": 6,  # 6 months (EU AI Act Article 19 minimum)
        "description": "Balanced thresholds for general use with 6-month audit retention (EU AI Act)",
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
