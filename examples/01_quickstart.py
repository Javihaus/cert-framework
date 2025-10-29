"""
CERT Framework Quickstart
=========================

Demonstrates basic measure() and monitor() usage.
Run: python examples/01_quickstart.py
Time: < 5 seconds
"""

from cert import measure, monitor


# Example 1: Direct text comparison
def example_measure():
    print("\n1. Basic Measurement")
    print("-" * 40)

    result = measure(text1="Revenue was $500M in Q4", text2="Q4 revenue reached $500M")

    print(f"Confidence: {result.confidence:.3f}")
    print(f"Matched: {result.matched}")
    print(f"Components: {result.components_used}")


# Example 2: RAG monitoring
@monitor(preset="general")
def example_rag_pipeline(query: str):
    """Mock RAG pipeline for demonstration."""
    # Simulated retrieval
    context = "The company reported Q4 revenue of $500M, up 20% YoY."

    # Simulated LLM response
    answer = "Q4 revenue was $500M with 20% year-over-year growth."

    return {"context": context, "answer": answer}


def example_monitor():
    print("\n2. Continuous Monitoring")
    print("-" * 40)

    # Monitor automatically measures accuracy
    result = example_rag_pipeline("What was Q4 revenue?")
    print(f"Answer: {result['answer']}")


if __name__ == "__main__":
    print("CERT Framework Quickstart")
    print("=" * 40)
    example_measure()
    example_monitor()
    print("\n✓ Quickstart complete!")
