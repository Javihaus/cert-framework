"""
Example 5: Hamiltonian Trajectory Analysis
===========================================

Purpose: Real-time monitoring of LLM generation quality.

Run: python examples/05_trajectory_analysis.py
Time: < 10 seconds
Dependencies: cert-framework[trajectory]
"""

try:
    from cert.advanced.trajectory import (
        TrajectoryConfig,
        analyze_trajectory,
        load_model_for_monitoring,
        unload_model,
    )

    TRAJECTORY_AVAILABLE = True
except ImportError:
    TRAJECTORY_AVAILABLE = False


def example_basic_analysis():
    """Basic trajectory analysis with small model."""
    print("\n1. Loading Model")
    print("-" * 40)

    # Load a small model for demo (gpt2)
    model, tokenizer = load_model_for_monitoring("gpt2")
    print("✓ Model loaded: gpt2")

    print("\n2. Analyzing Generation")
    print("-" * 40)

    prompt = "The capital of France is"

    # Configure analysis thresholds
    config = TrajectoryConfig(perplexity_threshold=50.0, entropy_threshold=2.5, max_new_tokens=20)

    # Analyze generation
    analysis = analyze_trajectory(model, tokenizer, prompt, config)

    print(f"Generated text: {analysis.generated_text}")
    print(f"Mean perplexity: {analysis.mean_perplexity:.2f}")
    print(f"Mean entropy: {analysis.mean_entropy:.2f}")
    print(f"Quality check: {'PASSED' if analysis.passed_quality_check else 'FAILED'}")

    # Cleanup
    unload_model(model)


def example_quality_detection():
    """Demonstrate quality threshold detection."""
    print("\n3. Quality Threshold Detection")
    print("-" * 40)

    model, tokenizer = load_model_for_monitoring("gpt2")

    # High-quality prompt (clear, specific)
    good_prompt = "Explain photosynthesis:"
    good_analysis = analyze_trajectory(
        model, tokenizer, good_prompt, TrajectoryConfig(max_new_tokens=15)
    )

    print(f"\nGood prompt: {good_prompt}")
    print(f"Perplexity: {good_analysis.mean_perplexity:.2f}")
    print(f"Quality: {'✓ PASSED' if good_analysis.passed_quality_check else '✗ FAILED'}")

    # Low-quality prompt (nonsensical)
    bad_prompt = "The color number elephant music"
    bad_analysis = analyze_trajectory(
        model, tokenizer, bad_prompt, TrajectoryConfig(max_new_tokens=15)
    )

    print(f"\nBad prompt: {bad_prompt}")
    print(f"Perplexity: {bad_analysis.mean_perplexity:.2f}")
    print(f"Quality: {'✓ PASSED' if bad_analysis.passed_quality_check else '✗ FAILED'}")

    unload_model(model)


def run_examples():
    """Run all trajectory examples."""
    if not TRAJECTORY_AVAILABLE:
        print("\n✗ Trajectory analysis not available")
        print("\nInstall with: pip install cert-framework[trajectory]")
        print("\nRequired dependencies:")
        print("  - torch")
        print("  - transformers")
        return

    example_basic_analysis()
    example_quality_detection()


if __name__ == "__main__":
    print("Example 5: Hamiltonian Trajectory Analysis")
    print("=" * 40)

    try:
        run_examples()
        print("\n✓ Example complete!")
    except ImportError as e:
        print(f"\n✗ Missing dependency: {e}")
        print("Install: pip install cert-framework[trajectory]")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
