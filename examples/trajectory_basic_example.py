"""
Basic Trajectory Monitoring Example
=====================================

This example demonstrates how to use CERT's trajectory monitoring
to analyze LLM generation quality in real-time.

Marketing: "Hamiltonian Trajectory Analysis"
Technical: Per-token perplexity and entropy tracking
"""

from cert import analyze_trajectory, load_model_for_monitoring
from cert.trajectory import TrajectoryConfig, HamiltonianVisualizer


def main():
    print("=" * 80)
    print("CERT Framework - Trajectory Monitoring Example")
    print("=" * 80)

    # Step 1: Configure monitoring thresholds
    print("\n[1/5] Configuring monitoring thresholds...")
    config = TrajectoryConfig(
        perplexity_threshold=50.0,  # Model confidence limit
        entropy_threshold=2.5,       # Distribution spread limit
        surprise_threshold=10.0,     # Unexpected token budget
        max_new_tokens=150,
        temperature=0.7
    )
    print(f"  ✓ Perplexity threshold: {config.perplexity_threshold}")
    print(f"  ✓ Entropy threshold: {config.entropy_threshold}")
    print(f"  ✓ Surprise threshold: {config.surprise_threshold}")

    # Step 2: Load model
    print("\n[2/5] Loading model...")
    print("  Note: Use small model for testing (e.g., 1-3B parameters)")
    print("  For production, use: Qwen/Qwen2.5-7B-Instruct, deepseek-ai/deepseek-coder-6.7b-instruct")

    # Example with smaller model (update with your preferred model)
    # model, tokenizer = load_model_for_monitoring(
    #     "Qwen/Qwen2.5-1.5B-Instruct",  # Smaller model for testing
    #     use_8bit=True,
    #     device="cuda"
    # )

    # For demo purposes (uncomment above and comment this)
    print("  [DEMO MODE: Skipping actual model loading]")
    print("  In production, uncomment the load_model_for_monitoring() call above")

    # Step 3: Analyze generation
    print("\n[3/5] Analyzing generation...")
    test_prompt = "Explain the concept of quantum entanglement in simple terms."

    print(f"  Prompt: {test_prompt}")

    # Example analysis (uncomment when model is loaded)
    # analysis = analyze_trajectory(
    #     model,
    #     tokenizer,
    #     test_prompt,
    #     config=config
    # )

    # For demo purposes
    print("  [DEMO MODE: Skipping actual analysis]")

    # Step 4: Display results
    print("\n[4/5] Quality Assessment Results:")
    print("  " + "-" * 76)

    # Example output (uncomment when model is loaded)
    # status = "✓ PASSED" if analysis.passed_quality_check else "✗ FAILED"
    # print(f"  Overall Status: {status}")
    # print(f"  Average Perplexity: {analysis.avg_perplexity:.2f} (threshold: {config.perplexity_threshold})")
    # print(f"  Maximum Entropy: {analysis.max_entropy:.2f} (threshold: {config.entropy_threshold})")
    # print(f"  Final Surprise: {analysis.final_surprise:.2f} (threshold: {config.surprise_threshold})")
    # print(f"  Tokens Generated: {analysis.generation_steps}")

    # For demo purposes
    print("  [DEMO MODE: Example output]")
    print("  Overall Status: ✓ PASSED")
    print("  Average Perplexity: 12.45 (threshold: 50.0)")
    print("  Maximum Entropy: 1.89 (threshold: 2.5)")
    print("  Final Surprise: 4.23 (threshold: 10.0)")
    print("  Tokens Generated: 87")

    # Step 5: Generate artifacts
    print("\n[5/5] Generating Output Artifacts:")

    # Visualization (uncomment when model is loaded)
    # HamiltonianVisualizer.plot_trajectory(
    #     analysis,
    #     save_path="trajectory_plot.png",
    #     show_plot=False
    # )
    # print("  ✓ Trajectory visualization: trajectory_plot.png")

    # Compliance report (uncomment when model is loaded)
    # report = HamiltonianVisualizer.generate_compliance_report(
    #     analysis,
    #     save_path="compliance_report.txt"
    # )
    # print("  ✓ Compliance report: compliance_report.txt")

    # For demo purposes
    print("  [DEMO MODE: Skipping artifact generation]")
    print("  When model is loaded, generates:")
    print("    - trajectory_plot.png (4-panel visualization)")
    print("    - compliance_report.txt (EU AI Act compliance)")

    # Cleanup (uncomment when model is loaded)
    # from cert import unload_model
    # unload_model(model, tokenizer)
    # print("\n  ✓ Model unloaded from memory")

    print("\n" + "=" * 80)
    print("Example complete!")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Uncomment model loading code above")
    print("2. Choose a model (smaller for testing, larger for production)")
    print("3. Run: python examples/trajectory_basic_example.py")
    print("4. Review generated trajectory_plot.png and compliance_report.txt")
    print("\nBusiness value:")
    print("- Catch hallucinations before production deployment")
    print("- Quantitative quality gates for automated systems")
    print("- Visual artifacts for stakeholder presentations")
    print("- EU AI Act compliance documentation")


if __name__ == "__main__":
    main()
