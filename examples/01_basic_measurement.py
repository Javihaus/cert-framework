"""
Example 1: Basic Measurement

Shows the simplest way to use CERT for accuracy measurement.
Perfect for quick validation of LLM outputs.
"""

from cert.measure import measure, measure_detailed


def basic_example():
    """Simple accuracy check."""
    llm_output = "Apple's revenue in 2023 was approximately $450 billion"
    ground_truth = "Apple's revenue in 2023 was $89.5 billion"

    # Simple confidence score
    confidence = measure(llm_output, ground_truth)
    print(f"Confidence: {confidence:.2f}")

    if confidence < 0.5:
        print("⚠️  Low confidence - possible hallucination detected")


def detailed_example():
    """See breakdown of semantic vs grounding scores."""
    llm_output = "The capital of France is Paris"
    ground_truth = "Paris is the capital of France"

    # Get detailed breakdown
    result = measure_detailed(llm_output, ground_truth)

    print(f"Confidence:  {result.confidence:.2f}")
    print(f"Semantic:    {result.semantic_score:.2f}")
    print(f"Grounding:   {result.grounding_score:.2f}")

    if result.is_accurate(threshold=0.6):
        print("✓ Output is accurate")
    else:
        print("✗ Output may be inaccurate")


def batch_example():
    """Process multiple pairs efficiently."""
    from cert.measure import measure_batch, BatchOptions

    pairs = [
        ("The sky is blue", "Blue is the color of the sky"),
        ("Revenue was $100M", "Revenue was $100 million"),
        ("Capital of France is London", "Capital of France is Paris"),
    ]

    scores = measure_batch(pairs)

    for i, ((text1, text2), score) in enumerate(zip(pairs, scores), 1):
        print(f"Pair {i}: {score:.2f}")


if __name__ == "__main__":
    print("=" * 60)
    print("Example 1: Basic Measurement")
    print("=" * 60)
    print()

    print("Basic Example:")
    print("-" * 60)
    basic_example()
    print()

    print("Detailed Example:")
    print("-" * 60)
    detailed_example()
    print()

    print("Batch Example:")
    print("-" * 60)
    batch_example()
