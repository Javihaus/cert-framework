"""
Example 6: Multi-Agent Coordination Monitoring
===============================================

Purpose: Measure effectiveness of multi-agent coordination vs individual agents.

Run: python examples/06_coordination_monitor.py
Time: < 10 seconds
Dependencies: cert-framework
"""

try:
    from cert.coordination import CoordinationOrchestrator, QualityEvaluator, BaselineMeasurer
    COORDINATION_AVAILABLE = True
except ImportError:
    COORDINATION_AVAILABLE = False


def simulate_baseline_agents(task: str, num_agents: int = 3):
    """Simulate independent agents working on the same task."""
    responses = [
        "The project deadline is March 15th with 3 deliverables.",
        "Project due date: March 15. Three key deliverables required.",
        "Deadline: 3/15. Total deliverables: 3."
    ]
    return responses[:num_agents]


def simulate_coordinated_agents(task: str, num_agents: int = 3):
    """Simulate agents working together with coordination."""
    # Coordinated agents reach consensus and provide comprehensive answer
    return "The project deadline is March 15th. There are 3 key deliverables required: requirements document, implementation, and final report."


def calculate_mock_metrics(baseline_responses, coordinated_response):
    """Calculate mock coordination metrics."""
    # Simulate quality scores
    baseline_scores = [0.72, 0.70, 0.68]  # Individual agent quality
    coordinated_score = 0.85  # Coordinated quality

    mean_baseline = sum(baseline_scores) / len(baseline_scores)
    best_baseline = max(baseline_scores)

    gamma = coordinated_score / mean_baseline  # Coordination effect
    omega = coordinated_score - best_baseline  # Emergence

    return {
        "gamma": gamma,
        "omega": omega,
        "baseline_mean": mean_baseline,
        "coordinated": coordinated_score,
        "consensus_rate": 0.88
    }


def example_coordination_measurement():
    """Demonstrate coordination effectiveness measurement."""
    print("\n1. Baseline Measurement (Independent Agents)")
    print("-" * 40)

    task = "Summarize the project timeline and deliverables."
    baseline_responses = simulate_baseline_agents(task, num_agents=3)

    for i, response in enumerate(baseline_responses, 1):
        print(f"Agent {i}: {response}")

    print("\n2. Coordinated Agents")
    print("-" * 40)

    coordinated_response = simulate_coordinated_agents(task, num_agents=3)
    print(f"Coordinated: {coordinated_response}")

    print("\n3. Coordination Metrics")
    print("-" * 40)

    metrics = calculate_mock_metrics(baseline_responses, coordinated_response)

    print(f"Gamma (γ):        {metrics['gamma']:.3f}  (coordination effect)")
    print(f"Omega (Ω):        {metrics['omega']:.3f}  (emergence indicator)")
    print(f"Consensus rate:   {metrics['consensus_rate']:.1%}")
    print(f"Baseline quality: {metrics['baseline_mean']:.3f}")
    print(f"Coordinated:      {metrics['coordinated']:.3f}")

    if metrics['gamma'] > 1.0:
        print("\n✓ Coordination is EFFECTIVE (γ > 1.0)")
    else:
        print("\n✗ Coordination is INEFFECTIVE (γ < 1.0)")


def example_coordination_strategies():
    """Compare different coordination strategies."""
    print("\n4. Coordination Strategies Comparison")
    print("-" * 40)

    strategies = {
        "sequential": {"gamma": 1.18, "consensus": 0.85},
        "parallel": {"gamma": 1.12, "consensus": 0.78},
        "debate": {"gamma": 1.25, "consensus": 0.92}
    }

    for strategy, metrics in strategies.items():
        effective = "✓" if metrics["gamma"] > 1.0 else "✗"
        print(f"{strategy:12s} | γ={metrics['gamma']:.2f} | consensus={metrics['consensus']:.0%} | {effective}")

    print("\nBest strategy: debate (highest γ and consensus)")


def run_examples():
    """Run coordination monitoring examples."""
    if not COORDINATION_AVAILABLE:
        print("\n⚠️  Note: This example uses mock data")
        print("For production use, install full coordination dependencies")

    example_coordination_measurement()
    example_coordination_strategies()


if __name__ == "__main__":
    print("Example 6: Multi-Agent Coordination Monitoring")
    print("=" * 40)

    try:
        run_examples()
        print("\n✓ Example complete!")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
