"""Industry presets for CERT monitoring.

Provides pre-configured settings for different regulatory environments.
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
        "accuracy_threshold": 0.95,  # Very strict for financial services
        "hallucination_tolerance": 0.01,  # <1% hallucination rate
        "audit_retention_months": 84,  # 7 years (regulatory requirement)
        "description": "Strict accuracy for financial services (95% threshold, <1% hallucination)",
    },
    "healthcare": {
        "accuracy_threshold": 0.98,  # Extremely strict for healthcare
        "hallucination_tolerance": 0.005,  # <0.5% hallucination rate
        "audit_retention_months": 120,  # 10 years (HIPAA/GDPR)
        "description": "Very strict accuracy for healthcare (98% threshold, <0.5% hallucination)",
    },
    "general": {
        "accuracy_threshold": 0.90,  # Balanced for general use
        "hallucination_tolerance": 0.05,  # <5% hallucination rate
        "audit_retention_months": 6,  # EU AI Act minimum
        "description": "Balanced accuracy for general use (90% threshold, <5% hallucination)",
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
        raise ValueError(
            f"Invalid preset '{preset}'. Valid presets: {valid_presets}"
        )

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
