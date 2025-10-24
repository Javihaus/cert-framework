"""Example: Using agent_monitor() for comprehensive LLM monitoring.

The agent_monitor() function runs multiple trials to measure:
- Consistency: Behavioral reliability
- Performance: Output quality across diverse prompts
- Latency: Response time distribution
- Output Quality: Length, diversity, repetition
- Robustness: Error handling and success rate
"""

import cert
import os

# Check API keys
if not os.getenv("OPENAI_API_KEY"):
    print("Warning: OPENAI_API_KEY not set. Set it to run this example.")
    print("export OPENAI_API_KEY=your_key_here")
    print()

# Example 1: Quick consistency check
print("=" * 60)
print("Example 1: Quick Consistency Check")
print("=" * 60)

result = cert.agent_monitor(
    provider="openai",
    model="gpt-4o-mini",
    consistency_trials=10,  # Minimum for statistical significance
    temperature=0.0,
    enabled_metrics=["consistency", "latency"]
)

print(f"Provider: {result.provider}")
print(f"Model: {result.model}")
print(f"\nConsistency Score: {result.consistency.score:.3f}")
print(f"  - Coefficient of Variation: {result.consistency.coefficient_of_variation:.3f}")
print(f"  - Number of Trials: {result.consistency.num_trials}")
print(f"\nLatency:")
print(f"  - Mean: {result.latency.mean_ms:.1f}ms")
print(f"  - Median: {result.latency.median_ms:.1f}ms")
print(f"  - P95: {result.latency.p95_ms:.1f}ms")
print(f"\nMonitoring Duration: {result.duration_seconds:.1f}s")
print()


# Example 2: Full monitoring suite
print("=" * 60)
print("Example 2: Full Monitoring Suite")
print("=" * 60)

result = cert.agent_monitor(
    provider="openai",
    model="gpt-4o",
    consistency_trials=20,
    performance_trials=15,
    temperature=0.0,
    max_tokens=1024,
    timeout=30,
    enabled_metrics=["consistency", "performance", "latency", "output_quality", "robustness"]
)

print(f"Model: {result.provider}/{result.model}")
print(f"\n1. CONSISTENCY (Behavioral Reliability)")
print(f"   Score: {result.consistency.score:.3f}")
print(f"   Mean Similarity: {result.consistency.mean_similarity:.3f}")
print(f"   Std Similarity: {result.consistency.std_similarity:.3f}")

print(f"\n2. PERFORMANCE (Output Quality)")
print(f"   Mean Score: {result.performance.mean_score:.3f}")
print(f"   Std Score: {result.performance.std_score:.3f}")
print(f"   Trials: {result.performance.num_trials}")

print(f"\n3. LATENCY (Response Time)")
print(f"   Mean: {result.latency.mean_ms:.1f}ms")
print(f"   P95: {result.latency.p95_ms:.1f}ms")
print(f"   P99: {result.latency.p99_ms:.1f}ms")

print(f"\n4. OUTPUT QUALITY (Content Analysis)")
print(f"   Mean Length: {result.output_quality.mean_length:.0f} chars")
print(f"   Semantic Diversity: {result.output_quality.semantic_diversity:.3f}")
print(f"   Repetition Score: {result.output_quality.repetition_score:.3f}")

print(f"\n5. ROBUSTNESS (Error Handling)")
print(f"   Success Rate: {result.robustness.success_rate:.1%}")
print(f"   Error Rate: {result.robustness.error_rate:.1%}")
print(f"   Timeout Rate: {result.robustness.timeout_rate:.1%}")

print(f"\nTotal Duration: {result.duration_seconds:.1f}s")
print()


# Example 3: Custom prompts for domain-specific testing
print("=" * 60)
print("Example 3: Custom Prompts - Financial Analysis")
print("=" * 60)

custom_consistency_prompt = """
Analyze the impact of interest rate changes on mortgage markets.
Provide a structured response covering key economic factors.
"""

custom_performance_prompts = [
    "Evaluate the risks in commercial real estate investment",
    "Assess the impact of inflation on bond portfolios",
    "Analyze diversification strategies for retirement accounts",
]

result = cert.agent_monitor(
    provider="openai",
    model="gpt-4o-mini",
    consistency_trials=15,
    performance_trials=10,
    temperature=0.0,
    consistency_prompt=custom_consistency_prompt,
    performance_prompts=custom_performance_prompts,
    enabled_metrics=["consistency", "performance"]
)

print(f"Consistency Score: {result.consistency.score:.3f}")
print(f"Performance Score: {result.performance.mean_score:.3f}")
print()


# Example 4: Comparing multiple models
print("=" * 60)
print("Example 4: Multi-Model Comparison")
print("=" * 60)

models_to_test = [
    ("openai", "gpt-4o-mini"),
    ("openai", "gpt-4o"),
]

results = []

for provider, model in models_to_test:
    print(f"\nTesting {provider}/{model}...")

    result = cert.agent_monitor(
        provider=provider,
        model=model,
        consistency_trials=10,
        performance_trials=5,
        temperature=0.0,
        enabled_metrics=["consistency", "latency", "robustness"]
    )

    results.append((provider, model, result))

print("\n--- Comparison Results ---\n")
print(f"{'Model':<30} {'Consistency':<15} {'Latency (ms)':<15} {'Success Rate':<15}")
print("-" * 75)

for provider, model, result in results:
    model_name = f"{provider}/{model}"
    consistency = f"{result.consistency.score:.3f}"
    latency = f"{result.latency.mean_ms:.1f}"
    success_rate = f"{result.robustness.success_rate:.1%}"

    print(f"{model_name:<30} {consistency:<15} {latency:<15} {success_rate:<15}")

print()


# Example 5: Export results to DataFrame
print("=" * 60)
print("Example 5: Export to DataFrame")
print("=" * 60)

result = cert.agent_monitor(
    provider="openai",
    model="gpt-4o-mini",
    consistency_trials=10,
    temperature=0.0,
    enabled_metrics=["consistency", "latency"]
)

# Convert to DataFrame
df = result.to_dataframe()

print("DataFrame columns:")
print(df.columns.tolist())
print(f"\nDataFrame shape: {df.shape}")
print(f"\nFirst row:")
print(df.iloc[0].to_dict())
print()

# Can save to CSV
# df.to_csv("monitoring_results.csv", index=False)


# Example 6: Temperature testing (NOT for benchmarking)
print("=" * 60)
print("Example 6: Temperature Impact on Consistency")
print("=" * 60)

temperatures = [0.0, 0.5, 1.0]

print("Testing how temperature affects consistency:\n")

for temp in temperatures:
    result = cert.agent_monitor(
        provider="openai",
        model="gpt-4o-mini",
        consistency_trials=10,
        temperature=temp,
        enabled_metrics=["consistency"]
    )

    print(f"Temperature {temp:.1f}: Consistency = {result.consistency.score:.3f}")

print("\nNote: For fair benchmarking, always use temperature=0.0")
print()


print("\nKey Takeaways:")
print("- agent_monitor() provides comprehensive LLM assessment")
print("- 5 metrics: consistency, performance, latency, output_quality, robustness")
print("- Configurable trials and prompts for different use cases")
print("- Results exportable to DataFrame for analysis")
print("- Essential for model selection and reliability testing")
print("- Use temperature=0.0 for reproducible benchmarking")
