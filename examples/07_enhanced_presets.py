"""
Example 7: Enhanced Industry Presets with EU AI Act Compliance Mapping
=======================================================================

Purpose: Demonstrate enhanced presets with compliance requirement checking.

This example shows:
- Using IndustryPreset with compliance requirements
- Checking compliance against specific EU AI Act articles
- Mapping metrics to regulatory requirements

Run: python examples/07_enhanced_presets.py
Time: < 5 seconds
Dependencies: cert-framework
"""

from cert import (
    INDUSTRY_PRESETS,
    get_industry_preset,
    measure,
)


def example_basic_compliance_check():
    """Check compliance for a single measurement."""
    print("\n1. Basic Compliance Check")
    print("-" * 60)

    # Get healthcare preset (strictest requirements)
    preset = get_industry_preset("healthcare")

    print(f"Preset: {preset.name}")
    print(f"Risk Level: {preset.risk_level}")
    print(f"Compliance Requirements: {len(preset.compliance_requirements)}")

    # Show compliance requirements
    for req in preset.compliance_requirements:
        print(f"\n  {req.article}: {req.description}")
        print(f"    Metric: {req.metric}")
        print(f"    Threshold: {req.threshold:.2f}")
        print(f"    Severity: {req.severity}")

    # Measure some text
    context = "Patient has hypertension (BP 145/95). Currently on Lisinopril 10mg."
    answer = "The patient has high blood pressure and is taking Lisinopril medication."

    result = measure(answer, context)

    # Check compliance
    compliance = preset.check_compliance(result)

    print(f"\n  Measurement Confidence: {result.confidence:.3f}")
    print("\n  Compliance Status:")
    for article, status in compliance.items():
        status_symbol = "✓" if status else "✗"
        print(f"    {status_symbol} {article}: {'PASS' if status else 'FAIL'}")


def example_compare_presets():
    """Compare compliance requirements across different presets."""
    print("\n2. Compare Industry Presets")
    print("-" * 60)

    preset_names = ["general", "financial", "healthcare"]

    print(f"\n{'Preset':<15} {'Risk Level':<12} {'Requirements':<15} {'Threshold'}")
    print("-" * 60)

    for name in preset_names:
        preset = INDUSTRY_PRESETS[name]
        req_count = len(preset.compliance_requirements)
        threshold = preset.measure_config["threshold"]

        print(f"{name:<15} {preset.risk_level:<12} {req_count:<15} {threshold:.2f}")


def example_check_multiple_texts():
    """Check compliance for multiple text pairs."""
    print("\n3. Batch Compliance Checking")
    print("-" * 60)

    preset = get_industry_preset("financial")

    test_cases = [
        {
            "context": "Company revenue was $5M in Q4 2024.",
            "answer": "The company generated $5M in revenue during Q4 2024.",
            "label": "Accurate financial statement",
        },
        {
            "context": "Company revenue was $5M in Q4 2024.",
            "answer": "The company lost $5M in Q4 2024.",
            "label": "Contradictory statement",
        },
        {
            "context": "Company revenue was $5M in Q4 2024.",
            "answer": "The weather was nice yesterday.",
            "label": "Off-topic response",
        },
    ]

    for i, case in enumerate(test_cases, 1):
        print(f"\n  Test Case {i}: {case['label']}")
        print(f"  Context: {case['context'][:50]}...")
        print(f"  Answer: {case['answer'][:50]}...")

        result = measure(case["answer"], case["context"])
        compliance = preset.check_compliance(result)

        all_compliant = all(compliance.values())
        status_symbol = "✓" if all_compliant else "✗"

        print(f"  Confidence: {result.confidence:.3f}")
        print(f"  {status_symbol} {'COMPLIANT' if all_compliant else 'NON-COMPLIANT'}")


def example_preset_serialization():
    """Show how to serialize preset configuration."""
    print("\n4. Preset Serialization")
    print("-" * 60)

    preset = get_industry_preset("legal")
    preset_dict = preset.to_dict()

    print(f"\nPreset: {preset_dict['name']}")
    print(f"Description: {preset_dict['description']}")
    print(f"Risk Level: {preset_dict['risk_level']}")

    print("\nMeasurement Config:")
    for key, value in preset_dict["measure_config"].items():
        print(f"  {key}: {value}")

    print("\nCompliance Requirements:")
    for req in preset_dict["compliance_requirements"]:
        print(f"\n  {req['article']}")
        print(f"    {req['description']}")
        print(f"    Metric: {req['metric']} >= {req['threshold']}")
        print(f"    Severity: {req['severity']}")


if __name__ == "__main__":
    print("Example 7: Enhanced Industry Presets")
    print("=" * 60)

    try:
        example_basic_compliance_check()
        example_compare_presets()
        example_check_multiple_texts()
        example_preset_serialization()

        print("\n✓ Example complete!")
        print("\n💡 Key Takeaways:")
        print("   - IndustryPreset includes EU AI Act compliance requirements")
        print("   - check_compliance() maps metrics to regulatory articles")
        print("   - Each preset has specific risk level and thresholds")
        print("   - High-risk presets (healthcare, legal) have stricter requirements")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
