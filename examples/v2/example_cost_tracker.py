"""Example: Using cost_tracker() for token usage and cost tracking.

The cost_tracker() function tracks token usage and calculates costs for LLM API calls.
Supports auto-pricing from database or manual override.
"""

import cert

# Example 1: Basic cost tracking with auto-pricing
print("=" * 60)
print("Example 1: Auto-Pricing from Database")
print("=" * 60)

cost_result = cert.cost_tracker(
    tokens_input=1000,
    tokens_output=500,
    provider="openai",
    model="gpt-4o"
)

print(f"Provider: {cost_result.provider}")
print(f"Model: {cost_result.model}")
print(f"Tokens Input: {cost_result.tokens_input:,}")
print(f"Tokens Output: {cost_result.tokens_output:,}")
print(f"Tokens Total: {cost_result.tokens_total:,}")
print(f"Cost Input: ${cost_result.cost_input:.6f}")
print(f"Cost Output: ${cost_result.cost_output:.6f}")
print(f"Cost Total: ${cost_result.cost_total:.6f}")
print()


# Example 2: Manual pricing override
print("=" * 60)
print("Example 2: Manual Pricing Override")
print("=" * 60)

cost_result = cert.cost_tracker(
    tokens_input=2000,
    tokens_output=1500,
    provider="custom-provider",
    model="custom-model",
    cost_per_input_token=0.00001,  # $0.01 per 1K tokens
    cost_per_output_token=0.00003,  # $0.03 per 1K tokens
)

print(f"Provider: {cost_result.provider}")
print(f"Model: {cost_result.model}")
print(f"Cost Total: ${cost_result.cost_total:.6f}")
print()


# Example 3: Tracking costs across multiple API calls
print("=" * 60)
print("Example 3: Batch Cost Tracking")
print("=" * 60)

costs = []

# Simulate multiple API calls
api_calls = [
    {"tokens_input": 500, "tokens_output": 300},
    {"tokens_input": 800, "tokens_output": 600},
    {"tokens_input": 1200, "tokens_output": 900},
]

for i, call in enumerate(api_calls, 1):
    cost = cert.cost_tracker(
        tokens_input=call["tokens_input"],
        tokens_output=call["tokens_output"],
        provider="anthropic",
        model="claude-3-5-sonnet-20241022"
    )
    costs.append(cost)
    print(f"Call {i}: {call['tokens_input']} in, {call['tokens_output']} out -> ${cost.cost_total:.6f}")

# Aggregate costs
total_cost = cert.track_batch_costs(costs)

print(f"\nTotal Tokens: {total_cost.tokens_total:,}")
print(f"Total Cost: ${total_cost.cost_total:.6f}")
print()


# Example 4: Cost tracking with metadata
print("=" * 60)
print("Example 4: Cost Tracking with Metadata")
print("=" * 60)

cost_result = cert.cost_tracker(
    tokens_input=1500,
    tokens_output=800,
    provider="openai",
    model="gpt-4o-mini",
    metadata={
        "user_id": "user_12345",
        "request_id": "req_abc123",
        "task": "summarization",
        "timestamp": "2024-10-24T10:30:00Z"
    }
)

print(f"Cost: ${cost_result.cost_total:.6f}")
print(f"Metadata: {cost_result.metadata}")
print()


# Example 5: Comparing costs across providers
print("=" * 60)
print("Example 5: Cost Comparison Across Providers")
print("=" * 60)

tokens_in = 10000
tokens_out = 5000

models = [
    ("openai", "gpt-4o"),
    ("openai", "gpt-4o-mini"),
    ("anthropic", "claude-3-5-sonnet-20241022"),
    ("anthropic", "claude-3-5-haiku-20241022"),
    ("google", "gemini-2.0-flash-exp"),
]

print(f"Comparing costs for {tokens_in:,} input + {tokens_out:,} output tokens:\n")

for provider, model in models:
    cost = cert.cost_tracker(
        tokens_input=tokens_in,
        tokens_output=tokens_out,
        provider=provider,
        model=model
    )
    print(f"{provider:12} {model:35} ${cost.cost_total:.6f}")

print()


# Example 6: Using CostTrackerAccumulator for session tracking
print("=" * 60)
print("Example 6: Session Cost Accumulator")
print("=" * 60)

accumulator = cert.CostTrackerAccumulator()

# Add multiple costs
accumulator.add(cert.cost_tracker(
    tokens_input=1000, tokens_output=500,
    provider="openai", model="gpt-4o"
))

accumulator.add(cert.cost_tracker(
    tokens_input=800, tokens_output=400,
    provider="openai", model="gpt-4o"
))

accumulator.add(cert.cost_tracker(
    tokens_input=1200, tokens_output=600,
    provider="openai", model="gpt-4o"
))

summary = accumulator.get_summary()

print(f"Total API Calls: {summary['num_calls']}")
print(f"Total Tokens: {summary['total_tokens']:,}")
print(f"Total Cost: ${summary['total_cost']:.6f}")
print(f"Average Cost per Call: ${summary['average_cost_per_call']:.6f}")
print()


print("\nKey Takeaways:")
print("- cost_tracker() tracks tokens and calculates costs")
print("- Auto-pricing from database for all major providers")
print("- Manual override for custom models or pricing")
print("- track_batch_costs() aggregates multiple results")
print("- CostTrackerAccumulator for session-level tracking")
print("- Metadata support for detailed tracking")
