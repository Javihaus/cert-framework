"""
CERT v3.0 - Basic Usage Example
================================

Simple example showing the clean v3.0 API.
"""

from cert import measure, monitor, PRESETS

# ==============================================================================
# Example 1: Basic Consistency Measurement
# ==============================================================================

print("Example 1: Basic Measurement")
print("=" * 80)

result = measure(
    text1="The company's revenue was $5 million in Q4 2023",
    text2="Q4 revenue reached $5M in 2023"
)

print(f"Confidence: {result.confidence:.3f}")
print(f"Matched: {result.matched}")
print(f"Energy: {1.0 - result.confidence:.3f}")
print()

# ==============================================================================
# Example 2: RAG Hallucination Detection
# ==============================================================================

print("Example 2: RAG Hallucination Detection")
print("=" * 80)

context = """
Apple Inc. reported record revenue of $394.3 billion for fiscal year 2022,
representing 8% growth year-over-year. iPhone sales accounted for $205.5 billion.
"""

correct_answer = "Apple's 2022 revenue was $394.3 billion, up 8% YoY"
hallucinated_answer = "Apple's 2022 revenue exceeded $500 billion"

result_correct = measure(text1=context, text2=correct_answer)
result_hallucinated = measure(text1=context, text2=hallucinated_answer)

print(f"Correct answer confidence: {result_correct.confidence:.3f}")
print(f"Hallucinated answer confidence: {result_hallucinated.confidence:.3f}")
print(f"Energy difference: {(1-result_hallucinated.confidence) - (1-result_correct.confidence):.3f}")
print()

# ==============================================================================
# Example 3: Using Industry Presets
# ==============================================================================

print("Example 3: Industry Presets")
print("=" * 80)

# Show available presets
for preset_name, config in PRESETS.items():
    print(f"\n{preset_name.upper()}:")
    print(f"  Accuracy Threshold: {config['accuracy_threshold']}")
    print(f"  Hallucination Tolerance: {config['hallucination_tolerance']}")
    print(f"  Audit Retention: {config['audit_retention_days']} days")
    print(f"  Basis: {config['regulatory_basis']}")

# ==============================================================================
# Example 4: Monitoring with Preset
# ==============================================================================

print("\n\nExample 4: Monitoring Decorator")
print("=" * 80)

@monitor(preset="healthcare", alert_on_hallucination=True)
def medical_rag_pipeline(query: str) -> str:
    """Example RAG pipeline with healthcare monitoring."""
    # Simulated RAG pipeline
    context = "Patient has type 2 diabetes, taking metformin 500mg twice daily"
    answer = "Patient is on metformin for diabetes management"
    return answer

# Call monitored function
result = medical_rag_pipeline("What medication is the patient taking?")
print(f"Pipeline result: {result}")
print("✓ Monitoring active - all outputs logged to cert_audit.jsonl")
