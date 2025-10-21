"""
Example 4: pytest Integration Guide

Shows how to integrate CERT into your existing pytest test suite.

CERT provides two integration methods:
1. Direct API usage (shown in test_llm_consistency.py)
2. pytest-cert plugin (seamless pytest integration)
"""

if __name__ == "__main__":
    print("=" * 70)
    print("pytest INTEGRATION WITH CERT")
    print("=" * 70)
    print()
    print("Method 1: Direct API Usage")
    print("-" * 70)

from cert import compare

def test_llm_consistency():
    output1 = llm.generate("test prompt")
    output2 = llm.generate("test prompt")

    result = compare(output1, output2)
    assert result.matched, f"Inconsistent outputs: {result.confidence:.2f}"
    """)

    print("\nMethod 2: pytest-cert Plugin")
    print("-" * 70)
    print("""
# Install plugin: pip install pytest-cert

@pytest.mark.cert_consistency(threshold=0.80)
def test_llm_outputs():
    # Plugin automatically compares outputs marked with @cert
    output = llm.generate("test")
    return output  # Plugin validates across runs
    """)

    print("\n" + "=" * 70)
    print("RUNNING THE EXAMPLES")
    print("=" * 70)
    print()
    print("Run the test suite:")
    print("  $ pytest examples/test_llm_consistency.py -v")
    print()
    print("Expected output:")
    print("  test_summarization_consistency PASSED")
    print("  test_summarization_catches_hallucination PASSED")
    print("  test_retrieval_consistency_across_queries PASSED")
    print()
    print("To see the full test file:")
    print("  $ cat examples/test_llm_consistency.py")
