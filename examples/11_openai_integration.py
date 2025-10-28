"""
Example 11: OpenAI SDK Integration with CERT Monitoring
========================================================

Purpose: Demonstrate how to use CERT with OpenAI's GPT API.

This example shows:
- Wrapping OpenAI clients
- Monitoring chat completions
- Streaming support
- Assistants API monitoring

Run: python examples/11_openai_integration.py
Time: < 5 seconds (mock mode, no actual API calls)
Dependencies: cert-framework

Note: This example uses mock objects to demonstrate the API.
For real usage, install: pip install openai
"""

from cert.integrations.openai import (
    wrap_openai_client,
    wrap_openai_completion,
    create_monitored_openai_stream,
    wrap_openai_assistants,
)


def example_basic_client_wrapping():
    """Demonstrate basic OpenAI client wrapping."""
    print("\n1. Basic OpenAI Client Wrapping")
    print("-" * 60)

    # Mock OpenAI client
    class MockMessage:
        def __init__(self, content):
            self.content = content

    class MockChoice:
        def __init__(self, content):
            self.message = MockMessage(content)

    class MockResponse:
        def __init__(self, content):
            self.choices = [MockChoice(content)]

    class MockCompletions:
        def create(self, *args, **kwargs):
            messages = kwargs.get("messages", [])
            last_msg = messages[-1]["content"] if messages else ""
            return MockResponse(f"Mock response to: {last_msg}")

    class MockChat:
        def __init__(self):
            self.completions = MockCompletions()

    class MockClient:
        def __init__(self):
            self.chat = MockChat()

    # Create and wrap client
    client = MockClient()
    monitored_client = wrap_openai_client(client, preset="healthcare")

    print("  ✓ OpenAI client wrapped with healthcare preset")
    print("  ✓ All chat.completions.create() calls monitored")
    print("  ✓ System messages used as context")

    # Use normally
    response = monitored_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a medical expert."},
            {"role": "user", "content": "What is hypertension?"},
        ],
    )

    print(f"\n  Query: extracted from last user message")
    print(f"  Context: from system message and history")
    print(f"  Answer: {response['answer'][:50]}...")
    print(f"  Original response: preserved")


def example_multi_turn_conversation():
    """Demonstrate conversation monitoring."""
    print("\n2. Multi-Turn Conversation Monitoring")
    print("-" * 60)

    class MockMessage:
        def __init__(self, content):
            self.content = content

    class MockChoice:
        def __init__(self, content):
            self.message = MockMessage(content)

    class MockResponse:
        def __init__(self, content):
            self.choices = [MockChoice(content)]

    class MockCompletions:
        def create(self, *args, **kwargs):
            return MockResponse("Mock response")

    class MockChat:
        def __init__(self):
            self.completions = MockCompletions()

    class MockClient:
        def __init__(self):
            self.chat = MockChat()

    client = MockClient()
    monitored_client = wrap_openai_client(client, preset="general")

    print("  ✓ Client wrapped")
    print("  ✓ Full conversation history used as context")

    # Simulate conversation
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What's 2+2?"},
        {"role": "assistant", "content": "2+2 equals 4."},
        {"role": "user", "content": "What about 3+3?"},
    ]

    response = monitored_client.chat.completions.create(model="gpt-4", messages=messages)

    print(f"\n  Conversation with {len(messages)} messages")
    print(f"  ✓ System message and history extracted as context")
    print(f"  ✓ Last user message extracted as query")


def example_function_calling():
    """Demonstrate function calling monitoring."""
    print("\n3. Function Calling Monitoring")
    print("-" * 60)

    print("""
  # Function calling example:

  from openai import OpenAI
  from cert.integrations.openai import wrap_openai_client

  client = OpenAI(api_key="your-api-key")
  monitored_client = wrap_openai_client(client, preset="general")

  # Define functions
  functions = [
      {
          "name": "get_weather",
          "description": "Get weather for a location",
          "parameters": {
              "type": "object",
              "properties": {
                  "location": {"type": "string"}
              }
          }
      }
  ]

  # Use function calling - all monitored
  response = monitored_client.chat.completions.create(
      model="gpt-4",
      messages=[{"role": "user", "content": "What's the weather in SF?"}],
      functions=functions
  )

  # Function calls and responses are captured in context
    """)

    print("  ✓ Function calls captured in monitoring")
    print("  ✓ Tool use tracked for compliance")


def example_streaming_support():
    """Demonstrate streaming monitoring."""
    print("\n4. Streaming Support")
    print("-" * 60)

    print("""
  # Streaming example:

  from openai import OpenAI
  from cert.integrations.openai import create_monitored_openai_stream

  client = OpenAI(api_key="your-api-key")
  monitored_client = create_monitored_openai_stream(
      client, preset="general"
  )

  # Stream responses normally
  stream = monitored_client.chat.completions.create(
      model="gpt-4",
      messages=[{"role": "user", "content": "Write a story"}],
      stream=True
  )

  for chunk in stream:
      if chunk.choices[0].delta.content:
          print(chunk.choices[0].delta.content, end="")

  # Complete response monitored when streaming finishes
  # No latency added to streaming experience
    """)

    print("  ✓ Streaming works without modification")
    print("  ✓ Complete response monitored at end")
    print("  ✓ Zero latency impact on streaming")


def example_assistants_api():
    """Demonstrate Assistants API monitoring."""
    print("\n5. Assistants API Monitoring")
    print("-" * 60)

    print("""
  # Assistants API example:

  from openai import OpenAI
  from cert.integrations.openai import wrap_openai_assistants

  client = OpenAI(api_key="your-api-key")
  monitored_client = wrap_openai_assistants(client, preset="general")

  # Create assistant
  assistant = monitored_client.beta.assistants.create(
      name="Math Tutor",
      instructions="You help with math problems",
      model="gpt-4"
  )

  # Create thread
  thread = monitored_client.beta.threads.create()

  # Add messages - automatically monitored
  monitored_client.beta.threads.messages.create(
      thread_id=thread.id,
      role="user",
      content="Solve: x^2 + 5x + 6 = 0"
  )

  # Run assistant
  run = monitored_client.beta.threads.runs.create(
      thread_id=thread.id,
      assistant_id=assistant.id
  )

  # All interactions logged for compliance
    """)

    print("  ✓ Assistants API fully supported")
    print("  ✓ Thread messages monitored")
    print("  ✓ Long-running conversations tracked")


def example_custom_function_wrapping():
    """Demonstrate custom function wrapping."""
    print("\n6. Custom Function Wrapping")
    print("-" * 60)

    def my_rag_pipeline(query):
        """Custom RAG pipeline using OpenAI."""
        # This would normally:
        # 1. Retrieve documents
        # 2. Format prompt
        # 3. Call OpenAI
        # 4. Return result

        context = "Mock retrieved documents"
        answer = f"Mock answer to: {query}"

        return {"query": query, "context": context, "answer": answer}

    # Wrap the function
    monitored_pipeline = wrap_openai_completion(my_rag_pipeline, preset="financial")

    print("  ✓ Custom function wrapped")
    print("  ✓ Return dict with query, context, answer")

    result = monitored_pipeline("What is the revenue?")
    print(f"\n  Result: {result['answer'][:50]}...")
    print(f"  ✓ Automatically monitored")


def example_different_presets():
    """Show different presets."""
    print("\n7. Different Presets for Different Use Cases")
    print("-" * 60)

    class MockCompletions:
        def create(self, *args, **kwargs):
            class Response:
                choices = [type("C", (), {"message": type("M", (), {"content": "Mock"})()})()]

            return Response()

    class MockChat:
        def __init__(self):
            self.completions = MockCompletions()

    class MockClient:
        def __init__(self):
            self.chat = MockChat()

    use_cases = [
        ("healthcare", "Medical chatbot"),
        ("financial", "Investment advisor"),
        ("legal", "Legal research assistant"),
        ("general", "Customer support"),
    ]

    for preset, description in use_cases:
        client = MockClient()
        monitored = wrap_openai_client(client, preset=preset)
        print(f"  ✓ {description}: preset='{preset}'")


def example_real_world_usage():
    """Show real-world usage pattern."""
    print("\n8. Real-World Usage Pattern")
    print("-" * 60)

    print("""
  # Complete production example:

  from openai import OpenAI
  from cert.integrations.openai import wrap_openai_client
  from cert import export_report

  # Initialize and wrap client
  client = OpenAI(api_key="your-api-key")
  monitored_client = wrap_openai_client(client, preset="healthcare")

  # Use in production
  def analyze_medical_record(record: dict) -> str:
      response = monitored_client.chat.completions.create(
          model="gpt-4",
          temperature=0,  # Deterministic for medical use
          messages=[
              {
                  "role": "system",
                  "content": "Analyze medical records professionally."
              },
              {
                  "role": "user",
                  "content": f"Patient record: {record}"
              }
          ]
      )
      return response['answer']

  # All calls monitored automatically
  analysis = analyze_medical_record({
      "patient_id": "12345",
      "symptoms": ["fever", "cough"],
      "history": "..."
  })

  # Generate EU AI Act compliance report
  export_report("data/audit.jsonl", "compliance_report.html")
    """)


if __name__ == "__main__":
    print("Example 11: OpenAI SDK Integration")
    print("=" * 60)

    try:
        example_basic_client_wrapping()
        example_multi_turn_conversation()
        example_function_calling()
        example_streaming_support()
        example_assistants_api()
        example_custom_function_wrapping()
        example_different_presets()
        example_real_world_usage()

        print("\n✓ Example complete!")
        print("\n💡 Key Takeaways:")
        print("   - wrap_openai_client() for chat completions")
        print("   - wrap_openai_assistants() for Assistants API")
        print("   - System messages and history used as context")
        print("   - Streaming fully supported without latency")
        print("   - Function calling tracked for compliance")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
