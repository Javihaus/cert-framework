"""OpenAI SDK integration for CERT Framework.

Provides wrappers for OpenAI clients with automatic monitoring.

Usage:
    from openai import OpenAI
    from cert.integrations.openai import wrap_openai_client

    client = OpenAI(api_key="...")
    monitored_client = wrap_openai_client(client, preset="healthcare")

    response = monitored_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": "What is the diagnosis?"}]
    )
"""

import functools
from typing import Any, Dict, Optional

from cert import monitor


def wrap_openai_client(
    client: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap OpenAI client with CERT monitoring.

    Args:
        client: OpenAI client instance
        preset: CERT preset to use ("healthcare", "financial", "legal", "general")
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped client with monitoring enabled

    Example:
        >>> from openai import OpenAI
        >>> from cert.integrations.openai import wrap_openai_client
        >>>
        >>> # Create your client
        >>> client = OpenAI(api_key="your-api-key")
        >>>
        >>> # Wrap with monitoring
        >>> monitored_client = wrap_openai_client(client, preset="healthcare")
        >>>
        >>> # Use normally
        >>> response = monitored_client.chat.completions.create(
        ...     model="gpt-4",
        ...     messages=[{"role": "user", "content": "Patient symptoms?"}]
        ... )
    """
    try:
        import openai  # noqa: F401
    except ImportError:
        raise ImportError(
            "OpenAI SDK is required for this integration. Install with: pip install openai"
        )

    # Store original chat.completions.create method
    original_create = client.chat.completions.create

    # Create monitored version
    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_create(*args, **kwargs) -> Any:
        """Monitored chat.completions.create that extracts context and answer."""
        # Call original method
        response = original_create(*args, **kwargs)

        # Extract messages from kwargs
        messages = kwargs.get("messages", [])

        # Extract query (last user message)
        query = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                if isinstance(content, str):
                    query = content
                elif isinstance(content, list):
                    # Handle multi-modal content
                    text_parts = [
                        part.get("text", "")
                        for part in content
                        if isinstance(part, dict) and part.get("type") == "text"
                    ]
                    query = " ".join(text_parts)
                break

        # Extract context from system message and earlier messages
        context_parts = []

        # Add all non-user messages and previous user messages as context
        for _i, msg in enumerate(messages[:-1]):  # Exclude last user message
            role = msg.get("role", "")
            content = msg.get("content", "")

            if isinstance(content, str):
                if role == "system":
                    context_parts.append(f"System: {content}")
                else:
                    context_parts.append(f"{role}: {content}")
            elif isinstance(content, list):
                # Handle multi-modal content
                text_parts = [
                    part.get("text", "")
                    for part in content
                    if isinstance(part, dict) and part.get("type") == "text"
                ]
                if text_parts:
                    text = " ".join(text_parts)
                    if role == "system":
                        context_parts.append(f"System: {text}")
                    else:
                        context_parts.append(f"{role}: {text}")

        context = "\n\n".join(context_parts) if context_parts else "(no context)"

        # Extract answer from response
        answer = ""
        if hasattr(response, "choices") and response.choices:
            first_choice = response.choices[0]
            if hasattr(first_choice, "message"):
                answer = first_choice.message.content or ""

        # Return in CERT format for monitoring
        return {
            "query": query,
            "context": context,
            "answer": answer,
            "_original_response": response,
        }

    # Replace chat.completions.create method
    client.chat.completions.create = monitored_create

    return client


def wrap_openai_completion(
    completion_function: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap a function that calls OpenAI with CERT monitoring.

    This is useful for wrapping custom functions that use the OpenAI SDK.

    Args:
        completion_function: Function that takes prompt and returns response
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped function with monitoring enabled

    Example:
        >>> from cert.integrations.openai import wrap_openai_completion
        >>>
        >>> def my_rag_pipeline(query):
        ...     context = retrieve_documents(query)
        ...     messages = [
        ...         {"role": "system", "content": f"Context: {context}"},
        ...         {"role": "user", "content": query}
        ...     ]
        ...     response = client.chat.completions.create(
        ...         model="gpt-4",
        ...         messages=messages
        ...     )
        ...     return response.choices[0].message.content
        >>>
        >>> monitored_pipeline = wrap_openai_completion(
        ...     my_rag_pipeline, preset="healthcare"
        ... )
    """
    config = monitor_config or {}

    @functools.wraps(completion_function)
    @monitor(preset=preset, **config)
    def monitored_function(*args, **kwargs) -> Any:
        """Monitored function that expects context and answer in return."""
        result = completion_function(*args, **kwargs)

        # If result is a dict with the expected format, return it
        if isinstance(result, dict) and "answer" in result:
            return result

        # Otherwise, treat result as answer and construct minimal format
        # The user's function should return a dict with context and answer
        # for proper monitoring
        return {
            "query": str(args[0]) if args else "",
            "context": "(context not provided)",
            "answer": str(result),
            "_original_result": result,
        }

    return monitored_function


def create_monitored_openai_stream(
    client: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Create monitored streaming handler for OpenAI.

    Args:
        client: OpenAI client instance
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped client with streaming support

    Example:
        >>> from cert.integrations.openai import create_monitored_openai_stream
        >>>
        >>> client = create_monitored_openai_stream(
        ...     openai_client, preset="general"
        ... )
        >>>
        >>> # Streaming still works, but final response is monitored
        >>> stream = client.chat.completions.create(
        ...     model="gpt-4",
        ...     messages=[{"role": "user", "content": "Hello"}],
        ...     stream=True
        ... )
        >>> for chunk in stream:
        ...     if chunk.choices[0].delta.content:
        ...         print(chunk.choices[0].delta.content, end="")
    """
    try:
        import openai  # noqa: F401
    except ImportError:
        raise ImportError(
            "OpenAI SDK is required for this integration. Install with: pip install openai"
        )

    # Store original create method
    original_create = client.chat.completions.create

    config = monitor_config or {}

    def monitored_create(*args, **kwargs):
        """Monitored create that handles both streaming and non-streaming."""
        is_streaming = kwargs.get("stream", False)

        if not is_streaming:
            # Non-streaming case - use regular monitored create
            @monitor(preset=preset, **config)
            def _monitor_completion():
                response = original_create(*args, **kwargs)

                messages = kwargs.get("messages", [])
                query = ""
                for msg in reversed(messages):
                    if msg.get("role") == "user":
                        query = msg.get("content", "")
                        break

                context_parts = []
                for msg in messages[:-1]:
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                    if isinstance(content, str):
                        context_parts.append(f"{role}: {content}")

                context = "\n\n".join(context_parts) if context_parts else "(no context)"

                answer = ""
                if hasattr(response, "choices") and response.choices:
                    answer = response.choices[0].message.content or ""

                return {
                    "query": query,
                    "context": context,
                    "answer": answer,
                    "_original_response": response,
                }

            return _monitor_completion()

        # Streaming case - accumulate chunks and monitor at the end
        stream = original_create(*args, **kwargs)

        class MonitoredStream:
            def __init__(self, original_stream, messages, preset, config):
                self.original_stream = original_stream
                self.messages = messages
                self.preset = preset
                self.config = config
                self.accumulated_content = []

            def __iter__(self):
                return self

            def __next__(self):
                try:
                    chunk = next(self.original_stream)

                    # Accumulate content
                    if (
                        hasattr(chunk, "choices")
                        and chunk.choices
                        and hasattr(chunk.choices[0], "delta")
                    ):
                        delta = chunk.choices[0].delta
                        if hasattr(delta, "content") and delta.content:
                            self.accumulated_content.append(delta.content)

                    return chunk
                except StopIteration:
                    # Stream finished - monitor the complete response
                    if self.accumulated_content:
                        query = ""
                        for msg in reversed(self.messages):
                            if msg.get("role") == "user":
                                query = msg.get("content", "")
                                break

                        context_parts = []
                        for msg in self.messages[:-1]:
                            role = msg.get("role", "")
                            content = msg.get("content", "")
                            if isinstance(content, str):
                                context_parts.append(f"{role}: {content}")

                        context = (
                            "\n\n".join(context_parts) if context_parts else "(streaming context)"
                        )
                        answer = "".join(self.accumulated_content)

                        @monitor(preset=self.preset, **self.config)
                        def _monitor_stream(query, context, answer):
                            return {
                                "query": query,
                                "context": context,
                                "answer": answer,
                            }

                        _monitor_stream(query, context, answer)

                    raise

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                if hasattr(self.original_stream, "__exit__"):
                    return self.original_stream.__exit__(exc_type, exc_val, exc_tb)
                return False

        messages = kwargs.get("messages", [])
        return MonitoredStream(stream, messages, preset, config)

    # Replace create method
    client.chat.completions.create = monitored_create

    return client


def wrap_openai_assistants(
    client: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap OpenAI Assistants API with CERT monitoring.

    Args:
        client: OpenAI client instance
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped client with monitoring for assistants

    Example:
        >>> from openai import OpenAI
        >>> from cert.integrations.openai import wrap_openai_assistants
        >>>
        >>> client = OpenAI(api_key="your-api-key")
        >>> monitored_client = wrap_openai_assistants(client, preset="general")
        >>>
        >>> # Create assistant and thread
        >>> assistant = monitored_client.beta.assistants.create(...)
        >>> thread = monitored_client.beta.threads.create()
        >>>
        >>> # Messages are monitored automatically
        >>> monitored_client.beta.threads.messages.create(
        ...     thread_id=thread.id,
        ...     role="user",
        ...     content="What is the weather?"
        ... )
    """
    try:
        import openai  # noqa: F401
    except ImportError:
        raise ImportError(
            "OpenAI SDK is required for this integration. Install with: pip install openai"
        )

    # Store original messages create method
    original_messages_create = client.beta.threads.messages.create

    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_messages_create(*args, **kwargs):
        """Monitored messages.create for assistants."""
        # Call original method
        response = original_messages_create(*args, **kwargs)

        # Extract content
        content = kwargs.get("content", "")
        role = kwargs.get("role", "")

        # For user messages, log the query
        if role == "user":
            query = content if isinstance(content, str) else str(content)

            # Try to get thread context
            thread_id = kwargs.get("thread_id")
            context = f"(thread: {thread_id})" if thread_id else "(assistant thread)"

            return {
                "query": query,
                "context": context,
                "answer": "(awaiting assistant response)",
                "_original_response": response,
            }

        return {"_original_response": response}

    # Replace messages.create method
    client.beta.threads.messages.create = monitored_messages_create

    return client
