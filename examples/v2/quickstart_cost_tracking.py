"""CERT Framework Quickstart - Automatic Cost Tracking

The NEW decorator-based cost tracking:
- Automatically extracts tokens from API responses
- No manual token counting
- Accumulates costs across calls
- Works with OpenAI, Anthropic, Google, xAI

Time to setup: 30 seconds
"""

import cert

# ============================================
# AUTOMATIC COST TRACKING (NEW)
# ============================================


@cert.cost_tracker
def call_openai(prompt):
    """OpenAI call with automatic cost tracking.

    CERT automatically:
    - Extracts tokens from response.usage
    - Looks up pricing for gpt-4o
    - Calculates cost
    - Accumulates across calls
    """
    # In production:
    # return client.chat.completions.create(
    #     model="gpt-4o",
    #     messages=[{"role": "user", "content": prompt}]
    # )

    # For demo, simulate response
    class MockUsage:
        prompt_tokens = 10
        completion_tokens = 20

    class MockResponse:
        usage = MockUsage()
        model = "gpt-4o"

    return MockResponse()


# Call function normally - cost tracked automatically
result = call_openai("What is 2+2?")
# Output: 💰 Cost: $0.000350 (10 in, 20 out) - openai/gpt-4o

result = call_openai("Explain quantum computing")
# Output: 💰 Cost: $0.000350 (10 in, 20 out) - openai/gpt-4o

# ============================================
# VIEW ACCUMULATED COSTS
# ============================================

summary = cert.get_cost_summary()
print("\n" + "=" * 60)
print("💰 Cost Summary")
print("=" * 60)
print(f"Total API calls: {summary['total_calls']}")
print(f"Total tokens: {summary['total_tokens']:,}")
print(f"Total cost: ${summary['total_cost']:.6f}")
print(f"Average cost per call: ${summary['average_cost_per_call']:.6f}")
print("=" * 60)

# ============================================
# EXPLICIT PROVIDER/MODEL (OPTIONAL)
# ============================================


@cert.cost_tracker(provider="anthropic", model="claude-3-5-sonnet-20241022")
def call_claude(prompt):
    """Claude call with explicit provider/model.

    Useful if response doesn't include model info.
    """
    # Simulate Claude response
    class MockUsage:
        input_tokens = 15
        output_tokens = 30

    class MockResponse:
        usage = MockUsage()

    return MockResponse()


result = call_claude("Analyze this data")
# Output: 💰 Cost: $0.000135 (15 in, 30 out) - anthropic/claude-3-5-sonnet-20241022

# ============================================
# VIEW DETAILED HISTORY
# ============================================

history = cert.get_cost_history()
print("\n" + "=" * 60)
print("📊 Call History")
print("=" * 60)
for i, call in enumerate(history, 1):
    print(
        f"{i}. {call['provider']}/{call['model']}: "
        f"${call['cost']:.6f} "
        f"({call['input_tokens']} in, {call['output_tokens']} out)"
    )
print("=" * 60)

# ============================================
# RESET TRACKER (FOR NEW MEASUREMENT)
# ============================================

cert.reset_cost_tracker()
print("\n✓ Cost tracker reset")

# New calls start from $0
result = call_openai("New measurement period")
summary = cert.get_cost_summary()
print(f"Cost after reset: ${summary['total_cost']:.6f}")

print("\n✓ Quickstart complete!")
print("\nKey Takeaways:")
print("- No manual token counting (automatic extraction)")
print("- Works with all major providers (OpenAI, Anthropic, Google, xAI)")
print("- Accumulates across calls automatically")
print("- View summary anytime with cert.get_cost_summary()")
print("- View detailed history with cert.get_cost_history()")
