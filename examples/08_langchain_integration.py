"""
Example 8: LangChain Integration with CERT Monitoring
======================================================

Purpose: Demonstrate how to use CERT with LangChain chains and agents.

This example shows:
- Wrapping LangChain RetrievalQA chains
- Automatic monitoring of RAG pipelines
- Compliance checking for chain outputs

Run: python examples/08_langchain_integration.py
Time: < 5 seconds (mock mode, no actual LLM calls)
Dependencies: cert-framework

Note: This example uses mock objects to demonstrate the API.
For real usage, install: pip install langchain langchain-openai faiss-cpu
"""

from cert.integrations.langchain import wrap_langchain_chain


def example_basic_chain_wrapping():
    """Demonstrate basic chain wrapping."""
    print("\n1. Basic LangChain Chain Wrapping")
    print("-" * 60)

    # Mock LangChain chain for demonstration
    class MockChain:
        def invoke(self, inputs):
            """Mock invoke method."""
            query = inputs.get("query", "")
            return {
                "query": query,
                "result": f"This is a mock answer to: {query}",
                "source_documents": [
                    type(
                        "MockDoc",
                        (),
                        {"page_content": "Mock context document 1 about medical procedures."},
                    )(),
                    type(
                        "MockDoc",
                        (),
                        {"page_content": "Mock context document 2 about patient care."},
                    )(),
                ],
            }

    # Create mock chain
    chain = MockChain()

    # Wrap with CERT monitoring
    monitored_chain = wrap_langchain_chain(chain, preset="healthcare")

    print("  ✓ Chain wrapped with healthcare preset")
    print("  ✓ All chain.invoke() calls will be monitored")
    print("  ✓ Context and answers automatically extracted")

    # Use the chain normally
    result = monitored_chain.invoke({"query": "What are the treatment options for hypertension?"})

    print(f"\n  Query: {result['query'][:50]}...")
    print(f"  Answer: {result['answer'][:50]}...")
    print(f"  Context extracted: {len(result['context'])} chars")
    print(f"  Original result preserved: {result.get('_original_result') is not None}")


def example_different_presets():
    """Show different industry presets."""
    print("\n2. Using Different Industry Presets")
    print("-" * 60)

    class MockChain:
        def invoke(self, inputs):
            query = inputs.get("query", "")
            return {
                "query": query,
                "result": f"Mock financial answer about {query}",
                "source_documents": [
                    type("MockDoc", (), {"page_content": "Financial report Q4 2024"})()
                ],
            }

    presets = ["general", "financial", "healthcare", "legal"]

    for preset in presets:
        chain = MockChain()
        wrap_langchain_chain(chain, preset=preset)
        print(f"  ✓ Chain wrapped with '{preset}' preset")

    print("\n  Each preset has different compliance requirements:")
    print("    - general: 0.70 accuracy threshold")
    print("    - financial: 0.80 accuracy threshold")
    print("    - healthcare: 0.85 accuracy threshold (high-risk)")
    print("    - legal: 0.85 accuracy threshold (high-risk)")


def example_custom_config():
    """Demonstrate custom monitoring configuration."""
    print("\n3. Custom Monitoring Configuration")
    print("-" * 60)

    class MockChain:
        def invoke(self, inputs):
            return {
                "query": inputs.get("query", ""),
                "result": "Mock answer",
                "source_documents": [],
            }

    # Custom configuration
    custom_config = {
        "audit_log_path": "data/langchain_audit.jsonl",
        "threshold": 0.75,
        "require_approval": False,
    }

    chain = MockChain()
    monitored_chain = wrap_langchain_chain(chain, preset="general", monitor_config=custom_config)

    print("  ✓ Custom audit log path: data/langchain_audit.jsonl")
    print("  ✓ Custom threshold: 0.75")
    print("  ✓ Approval disabled for automated pipelines")

    result = monitored_chain.invoke({"query": "What is the stock price?"})
    print(f"\n  Invocation complete: {result['answer']}")


def example_callback_handler():
    """Demonstrate LangChain callback handler."""
    print("\n4. LangChain Callback Handler")
    print("-" * 60)

    from cert.integrations.langchain import create_monitored_callback

    # Create callback handler
    create_monitored_callback(preset="healthcare")

    print("  ✓ Created CERTMonitoringCallback")
    print("  ✓ Add to any LangChain component:")
    print("    chain.invoke({'query': '...'}, callbacks=[callback])")
    print("\n  Benefits:")
    print("    - Non-invasive monitoring (no wrapping needed)")
    print("    - Works with any LangChain component")
    print("    - Automatic context extraction from retrievers")


def example_real_world_usage():
    """Show real-world usage pattern."""
    print("\n5. Real-World Usage Pattern")
    print("-" * 60)

    print("""
  # Real-world example (requires langchain, openai, faiss-cpu):

  from langchain.chains import RetrievalQA
  from langchain_openai import OpenAI
  from langchain.vectorstores import FAISS
  from langchain.embeddings import OpenAIEmbeddings
  from cert.integrations.langchain import wrap_langchain_chain

  # Create your RAG pipeline
  vectorstore = FAISS.from_texts(
      texts=["Patient has hypertension...", "Treatment involves..."],
      embedding=OpenAIEmbeddings()
  )

  chain = RetrievalQA.from_chain_type(
      llm=OpenAI(),
      retriever=vectorstore.as_retriever()
  )

  # Wrap with CERT monitoring
  monitored_chain = wrap_langchain_chain(chain, preset="healthcare")

  # Use normally - all calls are monitored
  result = monitored_chain.invoke({
      "query": "What is the treatment for hypertension?"
  })

  # Generate compliance report
  from cert import export_report
  export_report("data/audit.jsonl", "compliance_report.html")
    """)


if __name__ == "__main__":
    print("Example 8: LangChain Integration")
    print("=" * 60)

    try:
        example_basic_chain_wrapping()
        example_different_presets()
        example_custom_config()
        example_callback_handler()
        example_real_world_usage()

        print("\n✓ Example complete!")
        print("\n💡 Key Takeaways:")
        print("   - wrap_langchain_chain() adds monitoring with one line")
        print("   - Context automatically extracted from source_documents")
        print("   - Works with any LangChain chain or runnable")
        print("   - Use callbacks for non-invasive monitoring")
        print("   - Original chain behavior is preserved")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
