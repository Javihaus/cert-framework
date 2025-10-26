"""Template for updating presets.py with validated thresholds

This file shows what presets.py should look like AFTER running the validation study.

Replace the values below with actual results from:
validation_results/threshold_recommendations.json
"""

from enum import Enum
from typing import Dict, Union


class Preset(str, Enum):
    """Industry presets for compliance monitoring."""

    LEGAL = "legal"
    HEALTHCARE = "healthcare"
    GENERAL = "general"


# ============================================================================
# VALIDATED PRESETS (Evidence-Based)
# ============================================================================

PRESETS: Dict[str, Dict[str, Union[float, str, int]]] = {
    "legal": {
        # ===== VALIDATED THRESHOLDS =====
        "energy_threshold": 0.25,  # VALIDATED: Achieved 95.3% accuracy on 500 test cases
        "accuracy_target": 0.95,    # Target: 95% (Achieved: 95.3%)
        "hallucination_tolerance": 0.009,  # Target: <1% (Achieved: 0.9%)

        # ===== STATUTORY RETENTION (Evidence-Based) =====
        "audit_retention_months": 84,  # 7 years (SEC 17 CFR § 240.17a-4, FINRA Rule 4511)

        # ===== VALIDATION METADATA =====
        "validation_status": "VALIDATED",
        "validation_dataset": "LegalBench-RAG",
        "validation_paper": "https://arxiv.org/abs/2408.10343",
        "validation_date": "2025-10-24",
        "n_test_cases": 500,
        "achieved_accuracy": 0.953,
        "confidence_interval_95": [0.931, 0.975],
        "test_set_split": "80/20 train/test",

        # ===== DESCRIPTION =====
        "description": (
            "Validated energy threshold for legal domain with 95.3% accuracy "
            "(95% CI: [93.1%, 97.5%], n=500) on LegalBench-RAG benchmark. "
            "7-year audit retention per SEC/FINRA requirements."
        ),

        # ===== DEPLOYMENT NOTES =====
        "deployment_notes": (
            "This threshold was calibrated on legal contracts (NDAs, M&A, commercial agreements, "
            "privacy policies). For other legal document types, validate on domain-specific test set."
        ),
    },

    "healthcare": {
        # ===== VALIDATED THRESHOLDS =====
        "energy_threshold": 0.15,  # VALIDATED: Achieved 98.1% accuracy on 500 test cases
        "accuracy_target": 0.98,    # Target: 98% (Achieved: 98.1%)
        "hallucination_tolerance": 0.004,  # Target: <0.5% (Achieved: 0.4%)

        # ===== STATUTORY RETENTION (Evidence-Based) =====
        "audit_retention_months": 120,  # 10 years (45 CFR § 164.316 HIPAA)

        # ===== VALIDATION METADATA =====
        "validation_status": "VALIDATED",
        "validation_dataset": "MedQA (USMLE-style)",
        "validation_paper": "https://arxiv.org/abs/2009.13081",
        "validation_date": "2025-10-24",
        "n_test_cases": 500,
        "achieved_accuracy": 0.981,
        "confidence_interval_95": [0.968, 0.994],
        "test_set_split": "80/20 train/test",

        # ===== DESCRIPTION =====
        "description": (
            "Validated energy threshold for healthcare domain with 98.1% accuracy "
            "(95% CI: [96.8%, 99.4%], n=500) on MedQA benchmark. "
            "10-year audit retention per HIPAA requirements."
        ),

        # ===== DEPLOYMENT NOTES =====
        "deployment_notes": (
            "This threshold was calibrated on USMLE-style medical exam questions. "
            "For clinical decision support or patient-facing applications, "
            "additional validation with clinical experts is strongly recommended."
        ),
    },

    "general": {
        # ===== UNVALIDATED (Starting Point) =====
        "energy_threshold": 0.30,  # UNVALIDATED: Suggested starting point
        "accuracy_target": 0.90,    # Target: 90% (Not yet validated)
        "hallucination_tolerance": 0.05,  # Target: <5% (Not yet validated)

        # ===== STATUTORY RETENTION (Evidence-Based) =====
        "audit_retention_months": 6,  # 6 months (EU AI Act Article 19.1 minimum)

        # ===== VALIDATION METADATA =====
        "validation_status": "UNVALIDATED",
        "validation_dataset": "None",
        "validation_paper": "N/A",
        "validation_date": None,
        "n_test_cases": 0,
        "achieved_accuracy": None,
        "confidence_interval_95": None,
        "test_set_split": None,

        # ===== DESCRIPTION =====
        "description": (
            "UNVALIDATED starting point for general-purpose applications. "
            "This threshold should be validated on your specific use case before production deployment. "
            "6-month audit retention per EU AI Act Article 19 minimum."
        ),

        # ===== DEPLOYMENT NOTES =====
        "deployment_notes": (
            "This is a conservative starting point based on the principle that lower energy "
            "thresholds provide stricter consistency requirements. Validate on representative "
            "test cases from your domain before relying on this threshold for production decisions."
        ),
    },
}


# ============================================================================
# PRESET ACCESS FUNCTIONS
# ============================================================================


def get_preset(preset: Union[str, Preset]) -> Dict[str, Union[float, str, int]]:
    """Get preset configuration by name.

    Args:
        preset: Preset name or Preset enum value

    Returns:
        Configuration dictionary with energy_threshold, accuracy_target,
        hallucination_tolerance, audit_retention_months, and validation metadata

    Raises:
        ValueError: If preset name is invalid

    Examples:
        >>> config = get_preset("legal")
        >>> config["energy_threshold"]
        0.25
        >>> config["validation_status"]
        'VALIDATED'

        >>> config = get_preset(Preset.HEALTHCARE)
        >>> config["achieved_accuracy"]
        0.981
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
        legal: Validated energy threshold for legal domain with 95.3% accuracy...
        healthcare: Validated energy threshold for healthcare domain with 98.1% accuracy...
        general: UNVALIDATED starting point for general-purpose applications...
    """
    return {name: config["description"] for name, config in PRESETS.items()}


def get_validation_status(preset: Union[str, Preset]) -> Dict[str, Union[str, float, int]]:
    """Get validation metadata for a preset.

    Args:
        preset: Preset name or Preset enum value

    Returns:
        Dictionary with validation status, dataset, metrics, and confidence intervals

    Example:
        >>> status = get_validation_status("legal")
        >>> status["validation_status"]
        'VALIDATED'
        >>> status["achieved_accuracy"]
        0.953
        >>> status["confidence_interval_95"]
        [0.931, 0.975]
    """
    config = get_preset(preset)

    return {
        "validation_status": config.get("validation_status"),
        "validation_dataset": config.get("validation_dataset"),
        "validation_paper": config.get("validation_paper"),
        "validation_date": config.get("validation_date"),
        "n_test_cases": config.get("n_test_cases"),
        "achieved_accuracy": config.get("achieved_accuracy"),
        "confidence_interval_95": config.get("confidence_interval_95"),
    }


def is_validated(preset: Union[str, Preset]) -> bool:
    """Check if a preset has been validated.

    Args:
        preset: Preset name or Preset enum value

    Returns:
        True if preset has validation_status="VALIDATED", False otherwise

    Example:
        >>> is_validated("legal")
        True
        >>> is_validated("general")
        False
    """
    config = get_preset(preset)
    return config.get("validation_status") == "VALIDATED"


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    print("="*80)
    print("PRESET VALIDATION STATUS")
    print("="*80)

    for preset_name in ["legal", "healthcare", "general"]:
        config = get_preset(preset_name)
        status = get_validation_status(preset_name)

        print(f"\n{preset_name.upper()} PRESET:")
        print(f"  Energy Threshold:      {config['energy_threshold']:.3f}")
        print(f"  Target Accuracy:       {config['accuracy_target']*100:.1f}%")
        print(f"  Hallucination Tolerance: {config['hallucination_tolerance']*100:.2f}%")
        print(f"  Validation Status:     {status['validation_status']}")

        if status['validation_status'] == 'VALIDATED':
            print(f"  Achieved Accuracy:     {status['achieved_accuracy']*100:.1f}%")
            print(f"  95% CI:                [{status['confidence_interval_95'][0]*100:.1f}%, {status['confidence_interval_95'][1]*100:.1f}%]")
            print(f"  Dataset:               {status['validation_dataset']}")
            print(f"  Test Cases:            {status['n_test_cases']}")
            print(f"  Validation Date:       {status['validation_date']}")
        else:
            print(f"  ⚠️  NOT VALIDATED - validate on your use case before production")

        print(f"  Audit Retention:       {config['audit_retention_months']} months")

    print("\n" + "="*80)
    print("USAGE IN CODE")
    print("="*80)
    print("""
# Option 1: Use validated preset
import cert

@cert.monitor(preset="legal")
def legal_rag(query):
    # Automatically uses validated energy_threshold=0.25
    # Achieves 95.3% accuracy (validated on 500 test cases)
    return rag_pipeline(query)

# Option 2: Custom threshold (if you have domain-specific validation)
@cert.monitor(energy_threshold=0.20)
def custom_rag(query):
    # Use stricter threshold based on your validation
    return rag_pipeline(query)

# Option 3: Check validation status programmatically
from cert import get_preset, is_validated

if is_validated("healthcare"):
    config = get_preset("healthcare")
    print(f"Using validated threshold: {config['energy_threshold']}")
else:
    print("⚠️ Preset not validated - running validation study recommended")
""")
