"""
Example 2: RAG Hallucination Detection
=======================================

Purpose: Detect hallucinations in RAG systems using continuous monitoring.

Run: python examples/02_rag_monitoring.py
Time: < 10 seconds
Dependencies: cert-framework
"""

from cert import monitor, Preset


# Healthcare RAG with strict accuracy requirements
@monitor(preset="healthcare")
def healthcare_rag(query: str):
    """Simulated healthcare RAG system."""
    context = "Patient reports chest pain and shortness of breath. Blood pressure 140/90. EKG shows ST elevation."
    answer = "The patient presents with symptoms consistent with acute myocardial infarction based on chest pain, dyspnea, and ST elevation on EKG."
    return {"context": context, "answer": answer}


# Financial RAG with compliance requirements
@monitor(preset="financial")
def financial_rag(query: str):
    """Simulated financial RAG system."""
    context = "Q4 2024 revenue was $500M, up 20% YoY. Operating margin improved to 25% from 22%."
    answer = "The company reported Q4 2024 revenue of $500 million with 20% year-over-year growth and operating margins of 25%."
    return {"context": context, "answer": answer}


# Example with hallucination
@monitor(preset="general")
def hallucinating_rag(query: str):
    """Simulated RAG with hallucinated details."""
    context = "The product launch is scheduled for March 2025."
    answer = "The product will launch in March 2025 with an initial production of 10,000 units."  # Hallucinated quantity
    return {"context": context, "answer": answer}


def run_examples():
    print("\n1. Healthcare RAG (Compliant)")
    print("-" * 40)
    result1 = healthcare_rag("What are the patient's symptoms?")
    print(f"Answer: {result1['answer'][:80]}...")

    print("\n2. Financial RAG (Compliant)")
    print("-" * 40)
    result2 = financial_rag("What was Q4 revenue?")
    print(f"Answer: {result2['answer'][:80]}...")

    print("\n3. RAG with Hallucination (Non-compliant)")
    print("-" * 40)
    result3 = hallucinating_rag("When is the launch?")
    print(f"Answer: {result3['answer']}")
    print("⚠️  Note: '10,000 units' not present in context")

    print("\n📊 Audit logs written to: cert_audit.jsonl")


if __name__ == "__main__":
    print("Example 2: RAG Hallucination Detection")
    print("=" * 40)

    try:
        run_examples()
        print("\n✓ Example complete!")
    except Exception as e:
        print(f"\n✗ Error: {e}")
