# Anthropic SDK Integration Guide

Complete guide for integrating CERT Framework with Anthropic's Claude API.

## Overview

CERT Framework provides seamless integration with Anthropic's SDK through wrapper functions that automatically monitor accuracy and compliance for Claude API calls.

## Installation

```bash
pip install cert-framework anthropic
```

## Quick Start

```python
from anthropic import Anthropic
from cert.integrations.anthropic import wrap_anthropic_client

# Initialize Anthropic client
client = Anthropic(api_key="your-api-key")

# Wrap with CERT monitoring (one line!)
monitored_client = wrap_anthropic_client(client, preset="healthcare")

# Use normally - all calls are monitored
response = monitored_client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": "What is the treatment for hypertension?"
    }]
)

# Generate compliance report
from cert import export_report
export_report("data/audit.jsonl", "compliance_report.html")
```

## Client Wrapping

### Basic Wrapping

```python
from cert.integrations.anthropic import wrap_anthropic_client

# Wrap client
monitored_client = wrap_anthropic_client(client, preset="general")

# All messages.create() calls are monitored
response = monitored_client.messages.create(
    model="claude-3-opus-20240229",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Industry Presets

```python
# Healthcare (high-risk, 0.85 threshold)
monitored = wrap_anthropic_client(client, preset="healthcare")

# Financial (0.80 threshold)
monitored = wrap_anthropic_client(client, preset="financial")

# Legal (high-risk, 0.85 threshold)
monitored = wrap_anthropic_client(client, preset="legal")

# General purpose (0.70 threshold)
monitored = wrap_anthropic_client(client, preset="general")
```

## System Messages

System messages are automatically extracted as context:

```python
response = monitored_client.messages.create(
    model="claude-3-opus-20240229",
    system="You are a medical expert assistant.",
    messages=[{
        "role": "user",
        "content": "What is hypertension?"
    }]
)

# CERT extracts:
# - query: "What is hypertension?"
# - context: "You are a medical expert assistant."
# - answer: response.content[0].text
```

## Multi-Turn Conversations

Conversation history is automatically tracked:

```python
messages = [
    {"role": "user", "content": "What is the capital of France?"},
    {"role": "assistant", "content": "Paris is the capital."},
    {"role": "user", "content": "What's its population?"}
]

response = monitored_client.messages.create(
    model="claude-3-opus-20240229",
    messages=messages
)

# CERT extracts:
# - query: "What's its population?" (last user message)
# - context: Previous messages
# - answer: Claude's response
```

## Multimodal Content

Image and text content is supported:

```python
response = monitored_client.messages.create(
    model="claude-3-opus-20240229",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What is in this image?"},
            {"type": "image", "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": base64_image
            }}
        ]
    }]
)

# Text content extracted as query
# Image description in response monitored
```

## Custom Function Wrapping

Wrap custom RAG pipelines:

```python
from cert.integrations.anthropic import wrap_anthropic_completion

def my_rag_pipeline(query):
    # Retrieve relevant documents
    context = retrieve_documents(query)
    
    # Call Claude
    response = client.messages.create(
        model="claude-3-opus-20240229",
        messages=[{
            "role": "user",
            "content": f"Context: {context}\n\nQuestion: {query}"
        }]
    )
    
    return {
        "query": query,
        "context": context,
        "answer": response.content[0].text
    }

# Wrap function
monitored_pipeline = wrap_anthropic_completion(
    my_rag_pipeline,
    preset="healthcare"
)

# Use normally
result = monitored_pipeline("Patient symptoms?")
```

## Streaming Support

Streaming responses are monitored:

```python
from cert.integrations.anthropic import create_monitored_anthropic_stream

# Create streaming client
monitored_client = create_monitored_anthropic_stream(
    client,
    preset="general"
)

# Stream normally
with monitored_client.messages.stream(
    model="claude-3-opus-20240229",
    messages=[{"role": "user", "content": "Tell me a story"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

# Complete response monitored after streaming
# No blocking or latency during streaming
```

## Custom Configuration

```python
custom_config = {
    "audit_log_path": "data/anthropic_audit.jsonl",
    "threshold": 0.80,
    "require_approval": False,
    "circuit_breaker": True
}

monitored_client = wrap_anthropic_client(
    client,
    preset="healthcare",
    monitor_config=custom_config
)
```

## Production Deployment

### Circuit Breaker

```python
# Enable circuit breaker
monitored_client = wrap_anthropic_client(
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
monitored_client = wrap_anthropic_client(
    client,
    preset="financial",
    monitor_config={"require_approval": False}
)
```

### Rate Limiting

```python
# Use Anthropic's rate limiting
from anthropic import AsyncAnthropic

async_client = AsyncAnthropic(
    api_key="your-api-key",
    max_retries=3
)

monitored_client = wrap_anthropic_client(async_client, preset="general")
```

## Examples

### Medical Diagnosis Assistant

```python
from anthropic import Anthropic
from cert.integrations.anthropic import wrap_anthropic_client

client = Anthropic(api_key="your-api-key")
monitored = wrap_anthropic_client(client, preset="healthcare")

def diagnose_symptoms(symptoms: str) -> str:
    response = monitored.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        temperature=0,  # Deterministic for medical use
        system="You are a medical expert. Analyze symptoms carefully.",
        messages=[{
            "role": "user",
            "content": f"Patient symptoms: {symptoms}"
        }]
    )
    return response['answer']

diagnosis = diagnose_symptoms("Fever, cough, fatigue")
```

### Financial Advisory Chatbot

```python
monitored = wrap_anthropic_client(client, preset="financial")

conversation = []

def chat(user_message):
    conversation.append({"role": "user", "content": user_message})
    
    response = monitored.messages.create(
        model="claude-3-opus-20240229",
        messages=conversation
    )
    
    assistant_message = response['answer']
    conversation.append({"role": "assistant", "content": assistant_message})
    
    return assistant_message

# Multi-turn conversation
chat("What was our Q4 revenue?")
chat("How does that compare to last year?")
```

### Document Analysis

```python
def analyze_document(document_text, question):
    response = monitored.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=2048,
        system=f"Document to analyze:\n\n{document_text}",
        messages=[{
            "role": "user",
            "content": question
        }]
    )
    return response['answer']

answer = analyze_document(legal_doc, "What are the key terms?")
```

## Best Practices

1. **Temperature**: Use 0 for deterministic responses in sensitive applications
2. **Max Tokens**: Set appropriate limits for your use case
3. **System Messages**: Provide clear context and instructions
4. **Error Handling**: Handle API errors gracefully
5. **Rate Limiting**: Respect Anthropic's rate limits
6. **Audit Logs**: Keep separate logs per system

## Troubleshooting

### API Key Issues

```python
import os

# Use environment variables
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
```

### Import Errors

```bash
# Install Anthropic SDK
pip install anthropic

# Update to latest
pip install --upgrade anthropic
```

### Low Accuracy

```python
# Use deterministic temperature
response = monitored.messages.create(
    model="claude-3-opus-20240229",
    temperature=0,  # More deterministic
    messages=[...]
)
```

## See Also

- [OpenAI Integration](openai.md)
- [LangChain Integration](langchain.md)
- [LlamaIndex Integration](llamaindex.md)
- [EU AI Act Compliance Guide](../compliance/eu-ai-act.md)
