"""
Example 10: Anthropic SDK Integration with CERT Monitoring
===========================================================

Purpose: Demonstrate how to use CERT with Anthropic's Claude API.

This example shows:
- Wrapping Anthropic clients
- Monitoring message completions
- Streaming support
- Custom function wrapping

Run: python examples/10_anthropic_integration.py
Time: < 5 seconds (mock mode, no actual API calls)
Dependencies: cert-framework

Note: This example uses mock objects to demonstrate the API.
For real usage, install: pip install anthropic
"""

from cert.integrations.anthropic import (
    wrap_anthropic_client,
    wrap_anthropic_completion,
    create_monitored_anthropic_stream,
)


def example_basic_client_wrapping():
    """Demonstrate basic Anthropic client wrapping."""
    print("\n1. Basic Anthropic Client Wrapping")
    print("-" * 60)

    # Mock Anthropic client
    class MockContent:
        def __init__(self, text):
            self.text = text

    class MockResponse:
        def __init__(self, text):
            self.content = [MockContent(text)]

    class MockMessages:
        def create(self, *args, **kwargs):
            messages = kwargs.get("messages", [])
            last_msg = messages[-1]["content"] if messages else ""
            return MockResponse(f"Mock response to: {last_msg}")

    class MockClient:
        def __init__(self):
            self.messages = MockMessages()

    # Create and wrap client
    client = MockClient()
    monitored_client = wrap_anthropic_client(client, preset="healthcare")

    print("  ✓ Anthropic client wrapped with healthcare preset")
    print("  ✓ All messages.create() calls monitored")
    print("  ✓ System messages used as context")

    # Use normally
    response = monitored_client.messages.create(
        model="claude-3-opus-20240229",
        messages=[
            {"role": "user", "content": "What is the treatment for hypertension?"}
        ],
        system="You are a medical expert assistant.",
    )

    print(f"\n  Query extracted from last user message")
    print(f"  Context from system message")
    print(f"  Answer: {response['answer'][:50]}...")
    print(f"  Original response preserved")


def example_multi_turn_conversation():
    """Demonstrate multi-turn conversation monitoring."""
    print("\n2. Multi-Turn Conversation Monitoring")
    print("-" * 60)

    class MockContent:
        def __init__(self, text):
            self.text = text

    class MockResponse:
        def __init__(self, text):
            self.content = [MockContent(text)]

    class MockMessages:
        def create(self, *args, **kwargs):
            return MockResponse("Mock response")

    class MockClient:
        def __init__(self):
            self.messages = MockMessages()

    client = MockClient()
    monitored_client = wrap_anthropic_client(client, preset="general")

    print("  ✓ Client wrapped")
    print("  ✓ Previous messages used as context")

    # Simulate conversation
    messages = [
        {"role": "user", "content": "What's the capital of France?"},
        {"role": "assistant", "content": "Paris is the capital of France."},
        {"role": "user", "content": "What's its population?"},
    ]

    response = monitored_client.messages.create(
        model="claude-3-opus-20240229", messages=messages
    )

    print(f"\n  Conversation history:")
    for msg in messages:
        print(f"    {msg['role']}: {msg['content'][:40]}...")
    print(f"\n  ✓ All previous messages included as context")
    print(f"  ✓ Last user message extracted as query")


def example_custom_function_wrapping():
    """Demonstrate wrapping custom functions."""
    print("\n3. Custom Function Wrapping")
    print("-" * 60)

    # Simulate a RAG pipeline function
    def my_rag_pipeline(query):
        """Custom RAG pipeline using Anthropic."""
        # This would normally:
        # 1. Retrieve relevant documents
        # 2. Format prompt with context
        # 3. Call Anthropic API
        # 4. Return result

        context = "Mock retrieved context about the query"
        answer = f"Mock answer to: {query}"

        return {"query": query, "context": context, "answer": answer}

    # Wrap the function
    monitored_pipeline = wrap_anthropic_completion(my_rag_pipeline, preset="financial")

    print("  ✓ Custom function wrapped")
    print("  ✓ Return dict with query, context, answer")

    result = monitored_pipeline("What is the stock price?")
    print(f"\n  Result: {result['answer'][:50]}...")
    print(f"  ✓ Automatically monitored and logged")


def example_streaming_support():
    """Demonstrate streaming response monitoring."""
    print("\n4. Streaming Support")
    print("-" * 60)

    print("""
  # Streaming example (requires anthropic SDK):

  from anthropic import Anthropic
  from cert.integrations.anthropic import create_monitored_anthropic_stream

  client = Anthropic(api_key="your-api-key")
  monitored_client = create_monitored_anthropic_stream(
      client, preset="general"
  )

  # Use streaming normally
  with monitored_client.messages.stream(
      model="claude-3-opus-20240229",
      messages=[{"role": "user", "content": "Tell me a story"}]
  ) as stream:
      for text in stream.text_stream:
          print(text, end="", flush=True)

  # Complete response is monitored when stream finishes
  # Context and answer automatically extracted and logged
    """)

    print("  ✓ Streaming works normally")
    print("  ✓ Complete response monitored at end")
    print("  ✓ No blocking or latency added to streaming")


def example_different_presets():
    """Show different presets."""
    print("\n5. Different Presets for Different Use Cases")
    print("-" * 60)

    class MockMessages:
        def create(self, *args, **kwargs):
            class Response:
                content = [type("C", (), {"text": "Mock"})()]

            return Response()

    class MockClient:
        def __init__(self):
            self.messages = MockMessages()

    use_cases = [
        ("healthcare", "Medical diagnosis assistant"),
        ("financial", "Financial advisory chatbot"),
        ("legal", "Legal document analysis"),
        ("general", "Customer support bot"),
    ]

    for preset, description in use_cases:
        client = MockClient()
        monitored = wrap_anthropic_client(client, preset=preset)
        print(f"  ✓ {description}: preset='{preset}'")


def example_real_world_usage():
    """Show real-world usage pattern."""
    print("\n6. Real-World Usage Pattern")
    print("-" * 60)

    print("""
  # Complete real-world example:

  from anthropic import Anthropic
  from cert.integrations.anthropic import wrap_anthropic_client
  from cert import export_report

  # Initialize and wrap client
  client = Anthropic(api_key="your-api-key")
  monitored_client = wrap_anthropic_client(client, preset="healthcare")

  # Use in your application
  def diagnose_symptoms(symptoms: str) -> str:
      response = monitored_client.messages.create(
          model="claude-3-opus-20240229",
          max_tokens=1024,
          system="You are a medical expert. Analyze symptoms carefully.",
          messages=[{
              "role": "user",
              "content": f"Patient symptoms: {symptoms}"
          }]
      )
      return response['answer']

  # All calls are monitored
  diagnosis = diagnose_symptoms("Fever, cough, fatigue")

  # Generate compliance report
  export_report("data/audit.jsonl", "medical_compliance.html")

  # Report includes:
  # - All monitored interactions
  # - EU AI Act Article 15 compliance
  # - Accuracy metrics and failure analysis
  # - Ready for regulatory review
    """)


if __name__ == "__main__":
    print("Example 10: Anthropic SDK Integration")
    print("=" * 60)

    try:
        example_basic_client_wrapping()
        example_multi_turn_conversation()
        example_custom_function_wrapping()
        example_streaming_support()
        example_different_presets()
        example_real_world_usage()

        print("\n✓ Example complete!")
        print("\n💡 Key Takeaways:")
        print("   - wrap_anthropic_client() for automatic monitoring")
        print("   - System messages used as context")
        print("   - Multi-turn conversations fully supported")
        print("   - Streaming responses monitored without blocking")
        print("   - wrap_anthropic_completion() for custom pipelines")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
