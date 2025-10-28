"""
Example 9: LlamaIndex Integration with CERT Monitoring
=======================================================

Purpose: Demonstrate how to use CERT with LlamaIndex query engines and agents.

This example shows:
- Wrapping LlamaIndex query engines
- Monitoring chat engines
- Agent monitoring

Run: python examples/09_llamaindex_integration.py
Time: < 5 seconds (mock mode, no actual LLM calls)
Dependencies: cert-framework

Note: This example uses mock objects to demonstrate the API.
For real usage, install: pip install llama-index
"""

from cert.integrations.llamaindex import (
    wrap_llamaindex_engine,
    wrap_llamaindex_chat_engine,
    wrap_llamaindex_agent,
)


def example_query_engine_wrapping():
    """Demonstrate query engine wrapping."""
    print("\n1. LlamaIndex Query Engine Wrapping")
    print("-" * 60)

    # Mock LlamaIndex query engine
    class MockNode:
        def __init__(self, text):
            self.text = text

    class MockSourceNode:
        def __init__(self, text):
            self.node = MockNode(text)

    class MockResponse:
        def __init__(self, query):
            self.response = f"Mock answer to: {query}"
            self.source_nodes = [
                MockSourceNode("Medical document about hypertension treatment."),
                MockSourceNode("Research paper on cardiovascular health."),
            ]

    class MockQueryEngine:
        def query(self, query_str):
            return MockResponse(query_str)

    # Create and wrap engine
    engine = MockQueryEngine()
    monitored_engine = wrap_llamaindex_engine(engine, preset="healthcare")

    print("  ✓ Query engine wrapped with healthcare preset")
    print("  ✓ All engine.query() calls will be monitored")
    print("  ✓ Source nodes automatically extracted as context")

    # Use normally
    response = monitored_engine.query("What are treatment options for hypertension?")

    print(f"\n  Query: {response['query'][:50]}...")
    print(f"  Answer: {response['answer'][:50]}...")
    print(f"  Context from {len(response['context'])} chars extracted from source nodes")
    print(f"  Original response: {response.get('_original_response') is not None}")


def example_chat_engine():
    """Demonstrate chat engine wrapping."""
    print("\n2. LlamaIndex Chat Engine Wrapping")
    print("-" * 60)

    class MockNode:
        def __init__(self, text):
            self.text = text

    class MockSourceNode:
        def __init__(self, text):
            self.node = MockNode(text)

    class MockChatResponse:
        def __init__(self, message):
            self.response = f"Mock chat response: {message}"
            self.source_nodes = [
                MockSourceNode("Context from conversation history."),
            ]

    class MockChatEngine:
        def chat(self, message, *args, **kwargs):
            return MockChatResponse(message)

    # Create and wrap chat engine
    chat_engine = MockChatEngine()
    monitored_chat = wrap_llamaindex_chat_engine(chat_engine, preset="general")

    print("  ✓ Chat engine wrapped")
    print("  ✓ Multi-turn conversations monitored")
    print("  ✓ Conversation history used as context")

    # Simulate conversation
    response = monitored_chat.chat("Hello, how are you?")
    print(f"\n  User: Hello, how are you?")
    print(f"  Assistant: {response['answer'][:50]}...")


def example_agent_wrapping():
    """Demonstrate agent wrapping."""
    print("\n3. LlamaIndex Agent Wrapping")
    print("-" * 60)

    class MockAgentResponse:
        def __init__(self, message):
            self.response = f"Mock agent response after reasoning: {message}"
            self.sources = []

    class MockAgent:
        def chat(self, message, *args, **kwargs):
            return MockAgentResponse(message)

    # Create and wrap agent
    agent = MockAgent()
    monitored_agent = wrap_llamaindex_agent(agent, preset="general")

    print("  ✓ Agent wrapped")
    print("  ✓ Agent reasoning steps captured as context")
    print("  ✓ Tool calls and outputs monitored")

    response = monitored_agent.chat("What is the weather in San Francisco?")
    print(f"\n  Query: What is the weather in San Francisco?")
    print(f"  Answer: {response['answer'][:50]}...")
    print(f"  Context: {response['context']}")


def example_different_presets():
    """Show different presets for different use cases."""
    print("\n4. Different Presets for Different Use Cases")
    print("-" * 60)

    class MockQueryEngine:
        def query(self, query_str):
            class Response:
                response = "Mock response"
                source_nodes = []

            return Response()

    use_cases = [
        ("healthcare", "Medical Q&A system"),
        ("financial", "Financial advisor chatbot"),
        ("legal", "Legal document analysis"),
        ("general", "General purpose RAG"),
    ]

    for preset, description in use_cases:
        engine = MockQueryEngine()
        monitored = wrap_llamaindex_engine(engine, preset=preset)
        print(f"  ✓ {description}: preset='{preset}'")

    print("\n  Presets determine:")
    print("    - Accuracy thresholds")
    print("    - EU AI Act compliance requirements")
    print("    - Risk levels and documentation needs")


def example_real_world_usage():
    """Show real-world usage pattern."""
    print("\n5. Real-World Usage Pattern")
    print("-" * 60)

    print("""
  # Real-world example (requires llama-index):

  from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
  from cert.integrations.llamaindex import wrap_llamaindex_engine

  # Load documents and create index
  documents = SimpleDirectoryReader("./medical_docs").load_data()
  index = VectorStoreIndex.from_documents(documents)

  # Create query engine
  engine = index.as_query_engine(
      similarity_top_k=3,
      response_mode="tree_summarize"
  )

  # Wrap with CERT monitoring
  monitored_engine = wrap_llamaindex_engine(engine, preset="healthcare")

  # Use normally - all queries monitored
  response = monitored_engine.query(
      "What are the contraindications for this medication?"
  )

  print(response.response)

  # Generate compliance report
  from cert import export_report
  export_report("data/audit.jsonl", "healthcare_compliance.html")
    """)


def example_custom_config():
    """Demonstrate custom configuration."""
    print("\n6. Custom Monitoring Configuration")
    print("-" * 60)

    class MockQueryEngine:
        def query(self, query_str):
            class Response:
                response = "Mock response"
                source_nodes = []

            return Response()

    # Custom config
    custom_config = {
        "audit_log_path": "data/llamaindex_audit.jsonl",
        "threshold": 0.80,
        "circuit_breaker": True,
    }

    engine = MockQueryEngine()
    monitored = wrap_llamaindex_engine(
        engine, preset="financial", monitor_config=custom_config
    )

    print("  ✓ Custom audit log: data/llamaindex_audit.jsonl")
    print("  ✓ Financial preset with 0.80 threshold")
    print("  ✓ Circuit breaker enabled for production safety")


if __name__ == "__main__":
    print("Example 9: LlamaIndex Integration")
    print("=" * 60)

    try:
        example_query_engine_wrapping()
        example_chat_engine()
        example_agent_wrapping()
        example_different_presets()
        example_custom_config()
        example_real_world_usage()

        print("\n✓ Example complete!")
        print("\n💡 Key Takeaways:")
        print("   - wrap_llamaindex_engine() for query engines")
        print("   - wrap_llamaindex_chat_engine() for chat")
        print("   - wrap_llamaindex_agent() for agents")
        print("   - Source nodes automatically extracted as context")
        print("   - Works with all LlamaIndex response modes")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
