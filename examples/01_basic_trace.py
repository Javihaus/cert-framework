#!/usr/bin/env python3
"""
Basic example: Using @trace decorator with zero dependencies.

This example demonstrates the minimal tracing functionality without
requiring any external ML dependencies.
"""

from cert import trace


# Example 1: Simple RAG function with trace
@trace(log_path="example_traces.jsonl")
def simple_rag_pipeline(query: str) -> dict:
    """Simple RAG pipeline that returns context and answer."""

    # Simulate document retrieval
    context = "The company's revenue in Q4 2024 was $500 million, up 25% from Q3."

    # Simulate LLM generation (replace with actual LLM call)
    answer = f"Based on the financial data, Q4 2024 revenue reached $500M."

    return {
        "query": query,
        "context": context,
        "answer": answer
    }


# Example 2: With metadata
@trace(
    log_path="example_traces.jsonl",
    metadata={"service": "rag", "version": "1.0", "environment": "development"}
)
def rag_with_metadata(query: str) -> dict:
    """RAG pipeline with custom metadata in traces."""

    context = "Patient was prescribed Metformin 1000mg twice daily."
    answer = "The patient's medication is Metformin, dosage 1000mg bid."

    return {"context": context, "answer": answer}


# Example 3: Error handling
@trace(log_path="example_traces.jsonl")
def rag_with_errors(query: str) -> dict:
    """RAG pipeline that might fail - errors are logged automatically."""

    if not query:
        raise ValueError("Query cannot be empty")

    return {"context": "...", "answer": "..."}


if __name__ == "__main__":
    print("="*60)
    print("CERT Framework - Basic Trace Example")
    print("="*60)

    # Example 1: Normal usage
    print("\n1. Basic tracing:")
    result = simple_rag_pipeline("What was Q4 revenue?")
    print(f"   Answer: {result['answer']}")

    # Example 2: With metadata
    print("\n2. Tracing with metadata:")
    result = rag_with_metadata("What is the patient's medication?")
    print(f"   Answer: {result['answer']}")

    # Example 3: Error handling
    print("\n3. Error handling:")
    try:
        result = rag_with_errors("")
    except ValueError as e:
        print(f"   Error caught and logged: {e}")

    # Show log file
    print("\n" + "="*60)
    print("✓ Traces logged to: example_traces.jsonl")
    print("="*60)

    print("\nView traces with:")
    print("  cert logs example_traces.jsonl")

    print("\nEvaluate traces with:")
    print("  cert evaluate example_traces.jsonl --preset general")

    print("\nGenerate report with:")
    print("  cert report example_traces.jsonl -o report.md --system-name 'Example RAG'")
