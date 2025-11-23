# Sample Trace Files

This directory contains sample trace files for testing CERT CLI commands without making actual API calls.

## Files

| File | Description | Records |
|------|-------------|---------|
| `openai_traces.jsonl` | Sample OpenAI GPT-4/3.5 traces with costs | 8 |
| `anthropic_traces.jsonl` | Sample Anthropic Claude traces with costs | 7 |

## Usage

Test CLI commands with these sample files:

```bash
# Cost analysis
cert costs examples/sample_traces/openai_traces.jsonl
cert costs examples/sample_traces/anthropic_traces.jsonl

# Optimization recommendations
cert optimize examples/sample_traces/openai_traces.jsonl

# Combine files for analysis
cat examples/sample_traces/*.jsonl > combined_traces.jsonl
cert costs combined_traces.jsonl
```

## Trace Format

Each line is a JSON object with the following fields:

```json
{
  "timestamp": "2025-11-23T10:00:00.000Z",
  "platform": "openai|anthropic|bedrock|langchain",
  "model": "gpt-4|claude-sonnet-4-20250514|...",
  "input_data": [...],
  "output_data": "...",
  "metadata": {
    "input_tokens": 15,
    "output_tokens": 8,
    "finish_reason": "stop"
  },
  "cost": 0.00069,
  "latency_ms": 342.5
}
```

## Creating Your Own Traces

Use the CERT tracer to automatically generate traces:

```python
from cert import trace

@trace(log_path="my_traces.jsonl")
def my_llm_function(query):
    # Your LLM call here
    return {"answer": "..."}
```

Or use auto-instrumentation for automatic tracing:

```python
# Add at the top of your script
from cert.integrations.auto import *

# All OpenAI/Anthropic calls are now traced automatically
```
