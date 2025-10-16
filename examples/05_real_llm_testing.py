"""
Example 5: Testing with Real LLM APIs

This example uses actual OpenAI/Anthropic APIs to demonstrate CERT
with real non-deterministic LLM outputs.

Setup required:
  - OpenAI: export OPENAI_API_KEY="your-key"
  - Anthropic: export ANTHROPIC_API_KEY="your-key"

Cost: ~$0.001-0.002 for 4 API calls (minimal)
Runtime: ~3-5 seconds (API latency)
"""

import os
import sys
from cert import compare

# Try OpenAI first, fall back to Anthropic
try:
    import openai

    LLM_PROVIDER = "openai"
    API_KEY = os.getenv("OPENAI_API_KEY")
except ImportError:
    try:
        import anthropic

        LLM_PROVIDER = "anthropic"
        API_KEY = os.getenv("ANTHROPIC_API_KEY")
    except ImportError:
        print("Error: Install either openai or anthropic package:")
        print("  pip install openai")
        print("  pip install anthropic")
        sys.exit(1)

if not API_KEY:
    print(f"Error: {LLM_PROVIDER.upper()}_API_KEY not set")
    print(f"\nSetup instructions:")
    if LLM_PROVIDER == "openai":
        print("  export OPENAI_API_KEY='your-key-here'")
        print("  Get key: https://platform.openai.com/api-keys")
    else:
        print("  export ANTHROPIC_API_KEY='your-key-here'")
        print("  Get key: https://console.anthropic.com/")
    sys.exit(1)


def call_llm(prompt: str, temperature: float = 0.7) -> str:
    """Call LLM API and return response.

    Args:
        prompt: Input prompt
        temperature: Sampling temperature (0.7 = moderate variation)

    Returns:
        LLM response text
    """
    if LLM_PROVIDER == "openai":
        client = openai.OpenAI(api_key=API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Cheap, fast, good enough
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=100,
        )
        return response.choices[0].message.content.strip()

    else:  # anthropic
        client = anthropic.Anthropic(api_key=API_KEY)
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",  # Fast, cheap
            max_tokens=100,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()


def test_consistency_with_real_llm():
    """Test that LLM produces semantically consistent outputs."""

    prompt = "Explain what machine learning is in one sentence."

    print("=" * 70)
    print("REAL LLM CONSISTENCY TEST")
    print("=" * 70)
    print(f"\nProvider: {LLM_PROVIDER.upper()}")
    print(f"Prompt: '{prompt}'")
    print(f"Temperature: 0.7 (moderate variation)\n")
    print("Running 3 times to test consistency...\n")

    # Run same prompt 3 times - will get different wordings
    outputs = []
    for i in range(3):
        print(f"Run {i + 1}: Calling {LLM_PROVIDER}...", end=" ")
        output = call_llm(prompt, temperature=0.7)
        outputs.append(output)
        print("✓")
        print(f"  Response: '{output}'\n")

    # Test consistency between runs
    print("=" * 70)
    print("CONSISTENCY VALIDATION")
    print("=" * 70)

    baseline = outputs[0]
    all_consistent = True

    for i, output in enumerate(outputs[1:], 2):
        result = compare(baseline, output, threshold=0.75)

        status = "✓" if result.matched else "✗"
        print(f"\n{status} Run 1 vs Run {i}:")
        print(f"  Confidence: {result.confidence:.0%}")

        if result.matched:
            print(f"  Verdict: Semantically equivalent")
        else:
            print(f"  Verdict: INCONSISTENT - different meaning")
            all_consistent = False

    print("\n" + "=" * 70)

    if all_consistent:
        print("✓ PASS: All outputs are semantically consistent")
        print("  → LLM produces reliable outputs for this prompt")
    else:
        print("✗ FAIL: Outputs are inconsistent")
        print("  → Adjust prompt or temperature to improve consistency")

    return all_consistent


def test_hallucination_detection():
    """Test that CERT catches completely wrong outputs."""

    print("\n" + "=" * 70)
    print("HALLUCINATION DETECTION TEST")
    print("=" * 70)

    correct_prompt = "What is the capital of France?"
    wrong_prompt = "What is the capital of Spain?"

    print(f"\nCorrect prompt: '{correct_prompt}'")
    print(f"Wrong prompt:   '{wrong_prompt}'")
    print("\nThese should NOT match...\n")

    print("Calling LLM with correct prompt...", end=" ")
    correct_output = call_llm(correct_prompt, temperature=0.3)
    print("✓")
    print(f"  Response: '{correct_output}'")

    print("\nCalling LLM with wrong prompt...", end=" ")
    wrong_output = call_llm(wrong_prompt, temperature=0.3)
    print("✓")
    print(f"  Response: '{wrong_output}'")

    result = compare(correct_output, wrong_output, threshold=0.75)

    print(f"\n" + "=" * 70)
    print("VALIDATION")
    print("=" * 70)
    print(f"\nConfidence: {result.confidence:.0%}")

    if not result.matched:
        print("✓ PASS: CERT correctly identified different answers")
        print("  → Framework catches hallucinations/wrong outputs")
        return True
    else:
        print("✗ FAIL: CERT thinks these are equivalent")
        print("  → This shouldn't happen - outputs are clearly different")
        return False


if __name__ == "__main__":
    print("\nNOTE: This will make 5 API calls")
    print(f"Estimated cost: $0.001-0.002")
    print(f"Runtime: ~5 seconds\n")

    input("Press Enter to continue...")

    try:
        # Test 1: Consistency across runs
        test1_passed = test_consistency_with_real_llm()

        # Test 2: Hallucination detection
        test2_passed = test_hallucination_detection()

        # Summary
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"\nConsistency Test: {'✓ PASSED' if test1_passed else '✗ FAILED'}")
        print(f"Hallucination Test: {'✓ PASSED' if test2_passed else '✗ FAILED'}")

        if test1_passed and test2_passed:
            print("\n✓ CERT successfully validates real LLM outputs")
            print("  → Ready to integrate into your testing pipeline")
        else:
            print("\n✗ Some tests failed - review outputs above")

    except Exception as e:
        print(f"\nError: {e}")
        print("\nTroubleshooting:")
        print("  - Check API key is valid")
        print("  - Verify you have API credits")
        print("  - Check internet connection")
        sys.exit(1)
