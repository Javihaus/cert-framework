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

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Union


class Preset(str, Enum):
    """Industry presets for compliance monitoring."""

    HEALTHCARE = "healthcare"
    FINANCIAL = "financial"
    LEGAL = "legal"
    GENERAL = "general"


@dataclass
class ComplianceRequirement:
    """Single compliance requirement mapped to regulatory article.

    Attributes:
        article: Regulatory article reference (e.g., "Article 15.1")
        description: What this requirement ensures
        metric: Which measurement metric satisfies this requirement
        threshold: Required threshold value
        severity: Importance level ('mandatory', 'recommended')
    """

    article: str
    description: str
    metric: str
    threshold: float
    severity: str  # 'mandatory', 'recommended'


@dataclass
class IndustryPreset:
    """Enhanced industry preset with EU AI Act compliance mapping.

    Attributes:
        name: Preset name
        description: Industry description
        measure_config: Measurement configuration dict
        compliance_requirements: List of compliance requirements
        risk_level: EU AI Act risk level ('high', 'limited', 'minimal')
    """

    name: str
    description: str
    measure_config: Dict[str, Any]
    compliance_requirements: List[ComplianceRequirement]
    risk_level: str

    def check_compliance(self, measurement_result) -> Dict[str, bool]:
        """Check if measurement meets compliance requirements.

        Args:
            measurement_result: Result from measure() call

        Returns:
            Dictionary mapping article to compliance status (True/False)

        Example:
            >>> preset = get_industry_preset("healthcare")
            >>> result = measure(text1, text2)
            >>> compliance = preset.check_compliance(result)
            >>> compliance["Article 15.1"]
            True
        """
        compliance_status = {}

        for req in self.compliance_requirements:
            if req.metric == "accuracy":
                met = measurement_result.confidence >= req.threshold
            elif req.metric == "grounding":
                ungrounded = getattr(measurement_result, "ungrounded_terms", [])
                met = len(ungrounded) == 0
            elif req.metric == "nli":
                nli_score = getattr(measurement_result, "nli_score", 0.0)
                met = nli_score >= req.threshold
            elif req.metric == "semantic":
                semantic = getattr(measurement_result, "semantic_score", 0.0)
                met = semantic >= req.threshold
            else:
                met = False

            compliance_status[req.article] = met

        return compliance_status

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "name": self.name,
            "description": self.description,
            "measure_config": self.measure_config,
            "compliance_requirements": [
                {
                    "article": req.article,
                    "description": req.description,
                    "metric": req.metric,
                    "threshold": req.threshold,
                    "severity": req.severity,
                }
                for req in self.compliance_requirements
            ],
            "risk_level": self.risk_level,
        }


# Enhanced Industry Presets with EU AI Act Compliance Mapping

HEALTHCARE_PRESET = IndustryPreset(
    name="healthcare",
    description="Healthcare AI systems (EU AI Act High-Risk)",
    measure_config={
        "use_semantic": True,
        "semantic_weight": 0.3,
        "use_nli": True,
        "nli_weight": 0.5,
        "use_grounding": True,
        "grounding_weight": 0.2,
        "threshold": 0.85,
    },
    compliance_requirements=[
        ComplianceRequirement(
            article="Article 15.1",
            description="High level of accuracy for patient safety",
            metric="accuracy",
            threshold=0.85,
            severity="mandatory",
        ),
        ComplianceRequirement(
            article="Article 15.4",
            description="Resilience against errors and hallucinations",
            metric="grounding",
            threshold=1.0,
            severity="mandatory",
        ),
    ],
    risk_level="high",
)

FINANCIAL_PRESET = IndustryPreset(
    name="financial",
    description="Financial services AI (EU AI Act High-Risk)",
    measure_config={
        "use_semantic": True,
        "semantic_weight": 0.4,
        "use_nli": True,
        "nli_weight": 0.4,
        "use_grounding": True,
        "grounding_weight": 0.2,
        "threshold": 0.80,
    },
    compliance_requirements=[
        ComplianceRequirement(
            article="Article 15.1",
            description="Appropriate level of accuracy for financial decisions",
            metric="accuracy",
            threshold=0.80,
            severity="mandatory",
        ),
    ],
    risk_level="high",
)

LEGAL_PRESET = IndustryPreset(
    name="legal",
    description="Legal AI systems (EU AI Act High-Risk)",
    measure_config={
        "use_semantic": True,
        "semantic_weight": 0.3,
        "use_nli": True,
        "nli_weight": 0.4,
        "use_grounding": True,
        "grounding_weight": 0.3,
        "threshold": 0.80,
    },
    compliance_requirements=[
        ComplianceRequirement(
            article="Article 15.1",
            description="Appropriate level of accuracy for legal advice",
            metric="accuracy",
            threshold=0.80,
            severity="mandatory",
        ),
        ComplianceRequirement(
            article="Article 15.4",
            description="Resilience against manipulation and errors",
            metric="grounding",
            threshold=1.0,
            severity="mandatory",
        ),
    ],
    risk_level="high",
)

GENERAL_PRESET = IndustryPreset(
    name="general",
    description="General-purpose AI systems (Low-Risk)",
    measure_config={
        "use_semantic": True,
        "semantic_weight": 0.4,
        "use_nli": True,
        "nli_weight": 0.4,
        "use_grounding": True,
        "grounding_weight": 0.2,
        "threshold": 0.70,
    },
    compliance_requirements=[
        ComplianceRequirement(
            article="Article 52",
            description="Transparency obligations for general AI",
            metric="accuracy",
            threshold=0.70,
            severity="recommended",
        ),
    ],
    risk_level="minimal",
)

# Main presets dictionary mapping names to IndustryPreset objects
INDUSTRY_PRESETS: Dict[str, IndustryPreset] = {
    "healthcare": HEALTHCARE_PRESET,
    "financial": FINANCIAL_PRESET,
    "legal": LEGAL_PRESET,
    "general": GENERAL_PRESET,
}

# Legacy PRESETS dict for backward compatibility (simple config dicts)
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


def get_industry_preset(preset: Union[str, Preset]) -> IndustryPreset:
    """Get enhanced industry preset with compliance requirements.

    Args:
        preset: Preset name or Preset enum value

    Returns:
        IndustryPreset object with compliance mapping

    Raises:
        ValueError: If preset name is invalid

    Examples:
        >>> preset = get_industry_preset("healthcare")
        >>> preset.risk_level
        'high'
        >>> len(preset.compliance_requirements)
        2
    """
    if isinstance(preset, Preset):
        preset = preset.value

    if preset not in INDUSTRY_PRESETS:
        valid = ", ".join(INDUSTRY_PRESETS.keys())
        raise ValueError(f"Invalid preset '{preset}'. Valid presets: {valid}")

    return INDUSTRY_PRESETS[preset]


def get_preset(preset: Union[str, Preset]) -> Dict[str, float]:
    """Get legacy preset configuration by name.

    Note: For new code, prefer get_industry_preset() which includes
    compliance requirements. This function maintained for backward compatibility.

    Args:
        preset: Preset name or Preset enum value

    Returns:
        Configuration dictionary with accuracy_threshold, hallucination_tolerance,
        audit_retention_days

    Raises:
        ValueError: If preset name is invalid

    Examples:
        >>> config = get_preset("financial")
        >>> config["accuracy_threshold"]
        0.90

        >>> config = get_preset(Preset.HEALTHCARE)
        >>> config["hallucination_tolerance"]
        0.02
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
        financial: Financial services AI (EU AI Act High-Risk)
        healthcare: Healthcare AI systems (EU AI Act High-Risk)
        ...
    """
    return {name: preset.description for name, preset in INDUSTRY_PRESETS.items()}
