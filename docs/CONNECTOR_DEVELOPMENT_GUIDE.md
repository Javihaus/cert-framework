# Connector Development Guide

This guide shows you how to build a new connector for the CERT framework to automatically trace AI/LLM calls from any platform.

## Table of Contents

- [Quick Start](#quick-start)
- [Connector Patterns](#connector-patterns)
- [Step-by-Step Tutorial](#step-by-step-tutorial)
- [Testing Your Connector](#testing-your-connector)
- [Best Practices](#best-practices)
- [Submission Guidelines](#submission-guidelines)

---

## Quick Start

A CERT connector is a Python class that:
1. Inherits from `ConnectorAdapter`
2. Implements three abstract methods
3. Registers itself with `@register_connector`

**Minimal Example:**

```python
from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector
from datetime import datetime

@register_connector
class MyPlatformConnector(ConnectorAdapter):
    def activate(self):
        # Install hooks into your platform
        # (monkey-patch, callbacks, etc.)
        pass

    def extract_metadata(self, call_data):
        # Extract platform-specific metadata
        return {"tokens": call_data.usage.total_tokens}

    def calculate_cost(self, call_data):
        # Calculate API cost in USD
        return call_data.usage.total_tokens * 0.00002
```

---

## Connector Patterns

Choose the pattern that matches your platform's architecture:

### Pattern 1: API Intercept (Monkey-Patching)

**Use when:** Platform has a client SDK with callable methods

**Examples:** OpenAI, Anthropic, Cohere

```python
import functools

@register_connector
class APIConnector(ConnectorAdapter):
    def activate(self):
        import my_platform

        # Save original method
        original_method = my_platform.Client.chat

        # Create wrapper
        @functools.wraps(original_method)
        def wrapped_chat(self, *args, **kwargs):
            start_time = datetime.utcnow()

            try:
                response = original_method(self, *args, **kwargs)

                # Log the call
                traced_call = TracedCall(
                    timestamp=self.format_timestamp(start_time),
                    platform="my_platform",
                    model=kwargs.get("model"),
                    input_data=kwargs.get("messages"),
                    output_data=response.content,
                    metadata=self.extract_metadata(response),
                    cost=self.calculate_cost(response),
                )
                self.log_call(traced_call)

                return response
            except Exception as e:
                # Log error but don't break user's code
                traced_call = TracedCall(
                    timestamp=self.format_timestamp(start_time),
                    platform="my_platform",
                    model=kwargs.get("model"),
                    input_data=kwargs.get("messages"),
                    output_data=None,
                    metadata={},
                    error=str(e),
                )
                self.log_call(traced_call)
                raise  # Re-raise to preserve behavior

        # Replace method
        my_platform.Client.chat = wrapped_chat
```

### Pattern 2: Callback Hook

**Use when:** Platform exposes a callback or event system

**Examples:** LangChain, LlamaIndex

```python
@register_connector
class CallbackConnector(ConnectorAdapter):
    def activate(self):
        from my_platform import BaseCallback

        class CERTCallback(BaseCallback):
            def __init__(self, connector):
                self.connector = connector
                self.active_calls = {}

            def on_call_start(self, call_id, input_data):
                self.active_calls[call_id] = {
                    "start_time": datetime.utcnow(),
                    "input": input_data,
                }

            def on_call_end(self, call_id, output_data):
                call_info = self.active_calls.pop(call_id)

                traced_call = TracedCall(
                    timestamp=self.connector.format_timestamp(call_info["start_time"]),
                    platform="my_platform",
                    model="default",
                    input_data=call_info["input"],
                    output_data=output_data,
                    metadata={},
                )
                self.connector.log_call(traced_call)

        # Register callback globally
        self.callback = CERTCallback(self)
```

### Pattern 3: SDK Proxy

**Use when:** Platform uses cloud SDK (boto3, azure-sdk, gcp-sdk)

**Examples:** AWS Bedrock, Azure OpenAI, Google Vertex AI

```python
@register_connector
class SDKProxyConnector(ConnectorAdapter):
    def activate(self):
        import cloud_sdk

        # Wrap client factory
        original_client = cloud_sdk.client

        def wrapped_client(service_name, *args, **kwargs):
            client = original_client(service_name, *args, **kwargs)

            if service_name == "my-ai-service":
                self._wrap_client_methods(client)

            return client

        cloud_sdk.client = wrapped_client

    def _wrap_client_methods(self, client):
        original_invoke = client.invoke

        @functools.wraps(original_invoke)
        def wrapped_invoke(**kwargs):
            start_time = datetime.utcnow()
            response = original_invoke(**kwargs)

            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="my_platform",
                model=kwargs.get("modelId"),
                input_data=kwargs.get("input"),
                output_data=self._parse_response(response),
                metadata=self.extract_metadata(response),
                cost=self.calculate_cost(response),
            )
            self.log_call(traced_call)

            return response

        client.invoke = wrapped_invoke
```

---

## Step-by-Step Tutorial

Let's build a connector for a fictional platform "SuperAI".

### Step 1: Create the File

Create `cert/integrations/superai_connector.py`:

```python
"""
SuperAI Connector for CERT Framework
=====================================

Automatically traces calls to SuperAI API.
"""

import functools
from datetime import datetime
from typing import Any, Dict, Optional
import logging

try:
    import superai
    SUPERAI_AVAILABLE = True
except ImportError:
    SUPERAI_AVAILABLE = False

from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector

logger = logging.getLogger(__name__)
```

### Step 2: Define Pricing

```python
# SuperAI pricing per 1M tokens
SUPERAI_PRICING = {
    "superai-large": {"input": 5.0, "output": 15.0},
    "superai-small": {"input": 0.5, "output": 1.5},
}
```

### Step 3: Create Connector Class

```python
@register_connector
class SuperAIConnector(ConnectorAdapter):
    def __init__(self, tracer):
        if not SUPERAI_AVAILABLE:
            raise ImportError(
                "SuperAI not installed. Install with: pip install superai"
            )
        super().__init__(tracer)
        self._original_complete = None
```

### Step 4: Implement `activate()`

```python
    def activate(self) -> None:
        """Activate by monkey-patching SuperAI client."""
        self._original_complete = superai.Client.complete

        @functools.wraps(self._original_complete)
        def wrapped_complete(client_self, *args, **kwargs):
            return self._trace_completion(
                client_self,
                self._original_complete,
                *args,
                **kwargs
            )

        superai.Client.complete = wrapped_complete
        logger.info("SuperAI connector activated")
```

### Step 5: Implement Tracing Logic

```python
    def _trace_completion(self, client_self, original_method, *args, **kwargs):
        start_time = datetime.utcnow()

        try:
            response = original_method(client_self, *args, **kwargs)

            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="superai",
                model=kwargs.get("model", "unknown"),
                input_data=kwargs.get("prompt"),
                output_data=response.text,
                metadata=self.extract_metadata(response),
                cost=self.calculate_cost(response),
            )

            self.log_call(traced_call)
            return response

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="superai",
                model=kwargs.get("model", "unknown"),
                input_data=kwargs.get("prompt"),
                output_data=None,
                metadata={},
                error=str(e),
            )
            self.log_call(traced_call)
            raise
```

### Step 6: Implement `extract_metadata()`

```python
    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """Extract SuperAI-specific metadata."""
        metadata = {}

        if hasattr(call_data, "usage"):
            metadata["input_tokens"] = call_data.usage.input_tokens
            metadata["output_tokens"] = call_data.usage.output_tokens

        if hasattr(call_data, "finish_reason"):
            metadata["finish_reason"] = call_data.finish_reason

        if hasattr(call_data, "id"):
            metadata["request_id"] = call_data.id

        return metadata
```

### Step 7: Implement `calculate_cost()`

```python
    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """Calculate cost from SuperAI response."""
        if not hasattr(call_data, "model") or not hasattr(call_data, "usage"):
            return None

        model = call_data.model
        usage = call_data.usage

        # Find pricing
        pricing = SUPERAI_PRICING.get(model)
        if not pricing:
            return None

        # Calculate (pricing is per 1M tokens)
        input_cost = (usage.input_tokens / 1_000_000) * pricing["input"]
        output_cost = (usage.output_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost
```

---

## Testing Your Connector

### Step 1: Create Test File

Create `tests/integration/test_superai_connector.py`:

```python
import pytest
from unittest.mock import Mock
from tests.integration.connector_test_base import ConnectorTestBase
from cert.integrations.superai_connector import SuperAIConnector

class TestSuperAIConnector(ConnectorTestBase):
    def create_connector(self):
        return SuperAIConnector(self.tracer)

    def make_test_call(self):
        # Make a real or mocked SuperAI call
        from superai import Client
        client = Client(api_key="test-key")
        return client.complete(model="superai-small", prompt="Hello")

    def get_expected_platform_name(self):
        return "superai"
```

### Step 2: Run Tests

```bash
pytest tests/integration/test_superai_connector.py -v
```

All tests from `ConnectorTestBase` will run automatically:
- ✅ Basic call traced
- ✅ Streaming call traced (if applicable)
- ✅ Error isolation
- ✅ Overhead < 10ms
- ✅ Circuit breaker
- ✅ Metadata extraction
- ✅ Cost calculation

---

## Best Practices

### 1. Error Isolation

**CRITICAL:** Never let connector errors break user code.

```python
try:
    self.log_call(traced_call)
except Exception as e:
    # Log but don't raise
    logger.error(f"Failed to log trace: {e}")
```

### 2. Performance

Target: **< 5ms overhead per call**

```python
# ✅ Good - minimal processing
traced_call = TracedCall(...)
self.log_call(traced_call)

# ❌ Bad - expensive operations
for i in range(1000):
    self.process_data(trace)
```

### 3. Circuit Breaker

The base class handles this automatically. After 3 consecutive failures, the connector disables itself.

### 4. Pricing Tables

Keep pricing up-to-date:

```python
# Add comment with update date
# Pricing as of January 2025
# Source: https://superai.com/pricing
SUPERAI_PRICING = {
    "superai-large": {"input": 5.0, "output": 15.0},
}
```

### 5. Handle Multiple Response Formats

```python
def _extract_output(self, response, model):
    # Different models may have different formats
    if model.startswith("superai-v1"):
        return response.completion
    elif model.startswith("superai-v2"):
        return response.content[0].text
    else:
        return str(response)
```

### 6. Streaming Support

```python
def _wrap_stream(self, stream, request, start_time):
    """Accumulate stream chunks and log when done."""
    chunks = []

    for chunk in stream:
        chunks.append(chunk)
        yield chunk  # Pass through to user

    # Stream complete - log full response
    full_response = "".join(c.text for c in chunks)
    traced_call = TracedCall(...)
    self.log_call(traced_call)
```

---

## Submission Guidelines

### Before Submitting

1. ✅ All tests pass
2. ✅ Code is documented
3. ✅ Pricing is current
4. ✅ Error handling is robust
5. ✅ Performance is acceptable

### What to Include

Create a PR with:

1. **Connector file:** `cert/integrations/your_platform_connector.py`
2. **Test file:** `tests/integration/test_your_platform_connector.py`
3. **Documentation:** Update this guide with your platform
4. **Dependencies:** Update `requirements.txt` if needed (make optional)

### PR Template

```markdown
## New Connector: [Platform Name]

**Platform:** [Platform name and link]
**Pattern:** [API Intercept / Callback Hook / SDK Proxy]
**Coverage:** [What APIs/methods are traced]

### Features
- [ ] Basic call tracing
- [ ] Streaming support
- [ ] Async support
- [ ] Cost calculation
- [ ] Error handling
- [ ] Tests passing

### Testing
Tested with:
- [List platforms, versions, models tested]

### Additional Notes
[Any platform-specific considerations]
```

---

## Community Bounties

We maintain a list of wanted connectors with bounties:

| Platform | Priority | Bounty | Status |
|----------|----------|--------|--------|
| Google Vertex AI | High | $500 | Open |
| Cohere API | High | $300 | Open |
| HuggingFace Inference | Medium | $200 | Open |
| Together AI | Medium | $200 | Open |
| Replicate | Low | $100 | Open |

See [WANTED_CONNECTORS.md](./WANTED_CONNECTORS.md) for details.

---

## Getting Help

- **Questions:** Open a [GitHub Discussion](https://github.com/Javihaus/cert-framework/discussions)
- **Bug Reports:** Open an [Issue](https://github.com/Javihaus/cert-framework/issues)
- **Pull Requests:** We review within 48 hours

---

## Examples

See these reference implementations:

- **Simple:** [OpenAI Connector](../cert/integrations/openai_connector.py)
- **Callback-based:** [LangChain Connector](../cert/integrations/langchain_connector.py)
- **Multi-format:** [Bedrock Connector](../cert/integrations/bedrock_connector.py)

Happy building! 🚀
