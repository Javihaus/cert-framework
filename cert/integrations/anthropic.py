"""Anthropic SDK integration for CERT Framework.

Provides wrappers for Anthropic clients with automatic monitoring.

Usage:
    from anthropic import Anthropic
    from cert.integrations.anthropic import wrap_anthropic_client

    client = Anthropic(api_key="...")
    monitored_client = wrap_anthropic_client(client, preset="healthcare")

    response = monitored_client.messages.create(
        model="claude-3-opus-20240229",
        messages=[{"role": "user", "content": "What is the diagnosis?"}]
    )
"""

from typing import Any, Optional, Dict
import functools

from cert import monitor


def wrap_anthropic_client(
    client: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap Anthropic client with CERT monitoring.

    Args:
        client: Anthropic client instance
        preset: CERT preset to use ("healthcare", "financial", "legal", "general")
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped client with monitoring enabled

    Example:
        >>> from anthropic import Anthropic
        >>> from cert.integrations.anthropic import wrap_anthropic_client
        >>>
        >>> # Create your client
        >>> client = Anthropic(api_key="your-api-key")
        >>>
        >>> # Wrap with monitoring
        >>> monitored_client = wrap_anthropic_client(client, preset="healthcare")
        >>>
        >>> # Use normally
        >>> response = monitored_client.messages.create(
        ...     model="claude-3-opus-20240229",
        ...     messages=[{"role": "user", "content": "Patient symptoms?"}]
        ... )
    """
    try:
        import anthropic  # noqa: F401
    except ImportError:
        raise ImportError(
            "Anthropic SDK is required for this integration. "
            "Install with: pip install anthropic"
        )

    # Store original messages.create method
    original_create = client.messages.create

    # Create monitored version
    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_create(*args, **kwargs) -> Any:
        """Monitored messages.create that extracts context and answer."""
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
                        block.get("text", "")
                        for block in content
                        if block.get("type") == "text"
                    ]
                    query = " ".join(text_parts)
                break

        # Extract context from system message or earlier messages
        context_parts = []

        # Check for system parameter
        system = kwargs.get("system", "")
        if system:
            if isinstance(system, str):
                context_parts.append(system)
            elif isinstance(system, list):
                # System can be a list of text blocks
                for block in system:
                    if isinstance(block, dict) and block.get("type") == "text":
                        context_parts.append(block.get("text", ""))

        # Add previous messages as context (excluding the last user message)
        for msg in messages[:-1]:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if isinstance(content, str):
                context_parts.append(f"{role}: {content}")
            elif isinstance(content, list):
                text_parts = [
                    block.get("text", "")
                    for block in content
                    if block.get("type") == "text"
                ]
                if text_parts:
                    context_parts.append(f"{role}: {' '.join(text_parts)}")

        context = "\n\n".join(context_parts) if context_parts else "(no context)"

        # Extract answer from response
        answer = ""
        if hasattr(response, "content") and response.content:
            # Response.content is a list of content blocks
            text_blocks = [
                block.text for block in response.content if hasattr(block, "text")
            ]
            answer = " ".join(text_blocks)

        # Return in CERT format for monitoring
        return {
            "query": query,
            "context": context,
            "answer": answer,
            "_original_response": response,
        }

    # Replace messages.create method
    client.messages.create = monitored_create

    return client


def wrap_anthropic_completion(
    completion_function: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap a function that calls Anthropic with CERT monitoring.

    This is useful for wrapping custom functions that use the Anthropic SDK.

    Args:
        completion_function: Function that takes prompt and returns response
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped function with monitoring enabled

    Example:
        >>> from cert.integrations.anthropic import wrap_anthropic_completion
        >>>
        >>> def my_rag_pipeline(query):
        ...     context = retrieve_documents(query)
        ...     prompt = f"Context: {context}\\nQuery: {query}"
        ...     response = client.messages.create(
        ...         model="claude-3-opus-20240229",
        ...         messages=[{"role": "user", "content": prompt}]
        ...     )
        ...     return response.content[0].text
        >>>
        >>> monitored_pipeline = wrap_anthropic_completion(
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


def create_monitored_anthropic_stream(
    client: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Create monitored streaming handler for Anthropic.

    Args:
        client: Anthropic client instance
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped client with streaming support

    Example:
        >>> from cert.integrations.anthropic import create_monitored_anthropic_stream
        >>>
        >>> client = create_monitored_anthropic_stream(
        ...     anthropic_client, preset="general"
        ... )
        >>>
        >>> # Streaming still works, but final response is monitored
        >>> with client.messages.stream(
        ...     model="claude-3-opus-20240229",
        ...     messages=[{"role": "user", "content": "Hello"}]
        ... ) as stream:
        ...     for text in stream.text_stream:
        ...         print(text, end="", flush=True)
    """
    try:
        import anthropic  # noqa: F401
    except ImportError:
        raise ImportError(
            "Anthropic SDK is required for this integration. "
            "Install with: pip install anthropic"
        )

    # Store original stream method
    original_stream = client.messages.stream

    config = monitor_config or {}

    def monitored_stream(*args, **kwargs):
        """Monitored stream that collects full response for monitoring."""
        # Get the stream context manager
        stream_manager = original_stream(*args, **kwargs)

        class MonitoredStreamManager:
            def __init__(self, original_manager):
                self.original_manager = original_manager
                self.accumulated_text = []

            def __enter__(self):
                self.stream = self.original_manager.__enter__()
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                # On exit, monitor the complete response
                if not exc_type and self.accumulated_text:
                    # Extract messages for context
                    messages = kwargs.get("messages", [])
                    query = ""
                    for msg in reversed(messages):
                        if msg.get("role") == "user":
                            query = msg.get("content", "")
                            break

                    context = kwargs.get("system", "(streaming context)")
                    answer = "".join(self.accumulated_text)

                    # Monitor the complete response
                    @monitor(preset=preset, **config)
                    def _monitor_stream(query, context, answer):
                        return {"query": query, "context": context, "answer": answer}

                    _monitor_stream(query, context, answer)

                return self.original_manager.__exit__(exc_type, exc_val, exc_tb)

            @property
            def text_stream(self):
                """Yield text chunks and accumulate them."""
                for text in self.stream.text_stream:
                    self.accumulated_text.append(text)
                    yield text

            def __getattr__(self, name):
                """Delegate other attributes to original stream."""
                return getattr(self.stream, name)

        return MonitoredStreamManager(stream_manager)

    # Replace stream method
    client.messages.stream = monitored_stream

    return client
