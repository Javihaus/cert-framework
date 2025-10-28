# OpenAI SDK Integration Guide

Complete guide for integrating CERT Framework with OpenAI's GPT API and Assistants.

## Overview

CERT Framework provides seamless integration with OpenAI's SDK through wrapper functions that automatically monitor accuracy and compliance for chat completions and assistants.

## Installation

```bash
pip install cert-framework openai
```

## Quick Start

```python
from openai import OpenAI
from cert.integrations.openai import wrap_openai_client

# Initialize OpenAI client
client = OpenAI(api_key="your-api-key")

# Wrap with CERT monitoring (one line!)
monitored_client = wrap_openai_client(client, preset="healthcare")

# Use normally - all calls are monitored
response = monitored_client.chat.completions.create(
    model="gpt-4",
    messages=[{
        "role": "user",
        "content": "What is the treatment for hypertension?"
    }]
)

# Generate compliance report
from cert import export_report
export_report("data/audit.jsonl", "compliance_report.html")
```

## Chat Completions

### Basic Wrapping

```python
from cert.integrations.openai import wrap_openai_client

# Wrap client
monitored_client = wrap_openai_client(client, preset="general")

# All chat.completions.create() calls are monitored
response = monitored_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Industry Presets

```python
# Healthcare (high-risk, 0.85 threshold)
monitored = wrap_openai_client(client, preset="healthcare")

# Financial (0.80 threshold)
monitored = wrap_openai_client(client, preset="financial")

# Legal (high-risk, 0.85 threshold)
monitored = wrap_openai_client(client, preset="legal")

# General purpose (0.70 threshold)
monitored = wrap_openai_client(client, preset="general")
```

## System Messages

System messages are automatically extracted as context:

```python
response = monitored_client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a medical expert."},
        {"role": "user", "content": "What is hypertension?"}
    ]
)

# CERT extracts:
# - query: "What is hypertension?"
# - context: "System: You are a medical expert."
# - answer: response.choices[0].message.content
```

## Multi-Turn Conversations

Conversation history is automatically tracked:

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What's 2+2?"},
    {"role": "assistant", "content": "2+2 equals 4."},
    {"role": "user", "content": "What about 3+3?"}
]

response = monitored_client.chat.completions.create(
    model="gpt-4",
    messages=messages
)

# CERT extracts:
# - query: "What about 3+3?" (last user message)
# - context: System message and conversation history
# - answer: GPT's response
```

## Function Calling

Function calls are tracked for compliance:

```python
functions = [{
    "name": "get_weather",
    "description": "Get weather for a location",
    "parameters": {
        "type": "object",
        "properties": {
            "location": {"type": "string"}
        }
    }
}]

response = monitored_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "What's the weather in SF?"}],
    functions=functions
)

# Function calls captured in context
# Tool use tracked for compliance
```

## Streaming Support

Streaming responses are monitored:

```python
from cert.integrations.openai import create_monitored_openai_stream

# Create streaming client
monitored_client = create_monitored_openai_stream(
    client,
    preset="general"
)

# Stream normally
stream = monitored_client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")

# Complete response monitored after streaming
# Zero latency impact on streaming
```

## Assistants API

Monitor the Assistants API:

```python
from cert.integrations.openai import wrap_openai_assistants

# Wrap for assistants
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

# All interactions logged for compliance
```

## Custom Function Wrapping

Wrap custom RAG pipelines:

```python
from cert.integrations.openai import wrap_openai_completion

def my_rag_pipeline(query):
    # Retrieve relevant documents
    context = retrieve_documents(query)
    
    # Call OpenAI
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": f"Context: {context}"},
            {"role": "user", "content": query}
        ]
    )
    
    return {
        "query": query,
        "context": context,
        "answer": response.choices[0].message.content
    }

# Wrap function
monitored_pipeline = wrap_openai_completion(
    my_rag_pipeline,
    preset="healthcare"
)

# Use normally
result = monitored_pipeline("Patient symptoms?")
```

## Custom Configuration

```python
custom_config = {
    "audit_log_path": "data/openai_audit.jsonl",
    "threshold": 0.80,
    "require_approval": False,
    "circuit_breaker": True
}

monitored_client = wrap_openai_client(
    client,
    preset="healthcare",
    monitor_config=custom_config
)
```

## Production Deployment

### Circuit Breaker

```python
# Enable circuit breaker
monitored_client = wrap_openai_client(
    client,
    preset="healthcare",
    monitor_config={
        "circuit_breaker": True,
        "failure_threshold": 0.7
    }
)
```

### Automated Systems

```python
# Disable approval for automated pipelines
monitored_client = wrap_openai_client(
    client,
    preset="financial",
    monitor_config={"require_approval": False}
)
```

### Rate Limiting

```python
# Use OpenAI's rate limiting
from openai import AsyncOpenAI

async_client = AsyncOpenAI(
    api_key="your-api-key",
    max_retries=3
)

monitored_client = wrap_openai_client(async_client, preset="general")
```

## Examples

### Medical Record Analysis

```python
from openai import OpenAI
from cert.integrations.openai import wrap_openai_client

client = OpenAI(api_key="your-api-key")
monitored = wrap_openai_client(client, preset="healthcare")

def analyze_medical_record(record: dict) -> str:
    response = monitored.chat.completions.create(
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

analysis = analyze_medical_record({
    "patient_id": "12345",
    "symptoms": ["fever", "cough"],
    "history": "..."
})
```

### Investment Advisor Bot

```python
monitored = wrap_openai_client(client, preset="financial")

conversation = []

def chat(user_message):
    conversation.append({"role": "user", "content": user_message})
    
    response = monitored.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a financial advisor."}
        ] + conversation
    )
    
    assistant_message = response['answer']
    conversation.append({"role": "assistant", "content": assistant_message})
    
    return assistant_message

# Multi-turn conversation
chat("What stocks should I invest in?")
chat("What about bonds?")
```

### Code Review Assistant

```python
def review_code(code: str) -> str:
    response = monitored.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a code reviewer."},
            {"role": "user", "content": f"Review this code:\n\n{code}"}
        ]
    )
    return response['answer']

review = review_code("""
def calculate_total(items):
    return sum(item.price for item in items)
""")
```

## Best Practices

1. **Temperature**: Use 0 for deterministic responses in sensitive applications
2. **Max Tokens**: Set appropriate limits for cost control
3. **System Messages**: Provide clear context and instructions
4. **Error Handling**: Handle API errors gracefully
5. **Rate Limiting**: Respect OpenAI's rate limits
6. **Audit Logs**: Keep separate logs per system

## Troubleshooting

### API Key Issues

```python
import os

# Use environment variables
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
```

### Import Errors

```bash
# Install OpenAI SDK
pip install openai

# Update to latest
pip install --upgrade openai
```

### Low Accuracy

```python
# Use deterministic temperature
response = monitored.chat.completions.create(
    model="gpt-4",
    temperature=0,  # More deterministic
    messages=[...]
)
```

### Model Selection

```python
# Use GPT-4 for better accuracy
model = "gpt-4"  # Higher accuracy

# Or GPT-3.5 for lower cost
model = "gpt-3.5-turbo"  # Lower cost
```

## See Also

- [Anthropic Integration](anthropic.md)
- [LangChain Integration](langchain.md)
- [LlamaIndex Integration](llamaindex.md)
- [EU AI Act Compliance Guide](../compliance/eu-ai-act.md)
