"""CERT Framework Quickstart - RAG Hallucination Detection

This is the PRIMARY use case for CERT Framework:
Automatic hallucination detection for RAG systems (EU AI Act Article 15 compliance)

Time to setup: < 60 seconds
"""

import cert

# ============================================
# ZERO CONFIG - Just Works
# ============================================

@cert.monitor
def my_rag_system(query: str) -> str:
    """Your RAG function - wrapped with CERT monitoring.

    CERT automatically detects hallucinations and logs for compliance.
    """
    # Simulate RAG: retrieve context + generate answer

    # In production, this would be:
    # context = vector_db.retrieve(query)
    # answer = llm.generate(context=context, query=query)

    # For demo, return a dict with context and answer
    return {
        "context": "Apple reported Q4 2024 revenue of $94.9 billion, up 6% year over year.",
        "answer": "Apple's Q4 2024 revenue was $94.9 billion."
    }


# Run your function normally
result = my_rag_system("What was Apple's Q4 revenue?")
print(f"Answer: {result['answer']}")

# ============================================
# WITH PRESET - Industry-Specific Settings
# ============================================

@cert.monitor(preset="financial")  # Strict accuracy for finance
def financial_rag(query: str) -> dict:
    """Financial RAG with strict compliance requirements.

    Preset "financial":
    - Accuracy threshold: 95%
    - Hallucination tolerance: <1%
    - Audit retention: 7 years
    """
    return {
        "context": "Q4 net income was $24.2 billion per 10-K filing page 23",
        "answer": "Q4 net income was $24.2 billion"
    }


result = financial_rag("What was Q4 net income?")
print(f"Financial answer: {result['answer']}")

# ============================================
# WITH CUSTOM SETTINGS - Advanced Users
# ============================================

@cert.monitor(
    accuracy_threshold=0.95,
    alert_on_hallucination=True,
    explain=True
)
def custom_rag(query: str) -> dict:
    """RAG with custom monitoring settings."""
    return {
        "context": "Product X costs $99 per month according to pricing page",
        "answer": "Product X costs $99 per month"
    }


result = custom_rag("What does Product X cost?")
print(f"Custom answer: {result['answer']}")

# ============================================
# VIEW COMPLIANCE STATUS
# ============================================

# After running 100+ requests, you can export a compliance report:
# cert.export_report("compliance_report.pdf")

# Or view statistics programmatically:
# stats = cert.get_statistics()
# print(f"Hallucination rate: {stats['hallucination_rate']:.1%}")
# print(f"Compliance rate: {stats['compliance_rate']:.1%}")

print("\n✓ Quickstart complete!")
print("✓ Audit log created: cert_audit.jsonl")
print("✓ Ready for EU AI Act Article 15 compliance")
