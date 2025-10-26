"""
Example 3: Model Output Comparison
===================================

Purpose: Compare outputs from different models for consistency.

Run: python examples/03_model_comparison.py
Time: < 10 seconds
Dependencies: cert-framework
"""

from cert import measure


def simulate_model_outputs(prompt: str):
    """Simulate outputs from 3 different models."""
    outputs = {
        "gpt-4": "The company reported Q4 revenue of $500M with 20% year-over-year growth.",
        "claude-3": "Q4 revenue reached $500 million, representing a 20% increase from the previous year.",
        "llama-3": "In Q4, the company's revenue was $500M, up 20% compared to last year."
    }
    return outputs


def compare_models(prompt: str, reference: str):
    """Compare model outputs against reference text."""
    outputs = simulate_model_outputs(prompt)

    print("\nModel Comparison Results")
    print("-" * 40)
    print(f"Reference: {reference}\n")

    scores = {}
    for model, output in outputs.items():
        result = measure(
            text1=output,
            text2=reference
        )
        scores[model] = result.confidence
        print(f"{model:12s} | {result.confidence:.3f} | {output[:60]}...")

    return scores


def find_most_consistent(scores: dict):
    """Find the most consistent model."""
    best_model = max(scores.items(), key=lambda x: x[1])
    return best_model


def run_example():
    prompt = "What was the company's Q4 performance?"
    reference = "The company reported Q4 revenue of $500M, up 20% year-over-year."

    print("\nComparing model outputs against reference:")
    print(f"Prompt: {prompt}")
    print(f"Reference: {reference}")

    scores = compare_models(prompt, reference)

    best_model, best_score = find_most_consistent(scores)
    print("\n" + "=" * 40)
    print(f"Most consistent: {best_model} (confidence: {best_score:.3f})")


if __name__ == "__main__":
    print("Example 3: Model Output Comparison")
    print("=" * 40)

    try:
        run_example()
        print("\n✓ Example complete!")
    except Exception as e:
        print(f"\n✗ Error: {e}")
