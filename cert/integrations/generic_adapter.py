"""
Generic LLM Integration Adapter
================================

A simple, universal adapter for wrapping any LLM via callback pattern.
This replaces 1400+ lines of provider-specific code with a single flexible interface.

Usage:
    >>> from cert.integrations.generic_adapter import wrap_llm_call
    >>> from cert import start_trace, end_trace
    >>>
    >>> # Wrap any LLM call
    >>> trace_id = start_trace(query="What is the capital of France?")
    >>>
    >>> def my_llm_call():
    >>>     # Your LLM call here (OpenAI, Anthropic, LangChain, etc.)
    >>>     return client.chat.completions.create(...)
    >>>
    >>> result = wrap_llm_call(trace_id, my_llm_call, expected="Paris")
    >>> end_trace(trace_id)
"""

from typing import Any, Callable, Dict, Optional

from cert.core.api import get_tracer


def wrap_llm_call(
    trace_id: str,
    llm_callable: Callable[[], Any],
    expected: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Any:
    """
    Wrap any LLM call with CERT tracing.

    Args:
        trace_id: Active trace ID from start_trace()
        llm_callable: Function that executes the LLM call
        expected: Expected output for evaluation (optional)
        metadata: Additional metadata to attach (optional)

    Returns:
        The result from llm_callable()

    Example:
        >>> trace_id = start_trace(query="Translate 'hello' to Spanish")
        >>> result = wrap_llm_call(
        ...     trace_id,
        ...     lambda: openai_client.chat.completions.create(...),
        ...     expected="hola"
        ... )
    """
    tracer = get_tracer()

    try:
        # Execute the LLM call
        result = llm_callable()

        # Extract response text (handle common response formats)
        response_text = _extract_response_text(result)

        # Update trace with response
        if response_text:
            tracer.add_response(trace_id, response_text)

        # Add expected output if provided
        if expected:
            tracer.add_expected(trace_id, expected)

        # Add metadata if provided
        if metadata:
            for key, value in metadata.items():
                tracer.add_metadata(trace_id, key, value)

        return result

    except Exception as e:
        # Log error and re-raise
        tracer.add_metadata(trace_id, "error", str(e))
        tracer.add_metadata(trace_id, "error_type", type(e).__name__)
        raise


def _extract_response_text(result: Any) -> Optional[str]:
    """
    Extract response text from various LLM response formats.
    Handles OpenAI, Anthropic, LangChain, and plain string responses.
    """
    # Handle string responses
    if isinstance(result, str):
        return result

    # Handle dict responses
    if isinstance(result, dict):
        # LangChain format
        if "output" in result:
            return str(result["output"])
        # Generic content field
        if "content" in result:
            return str(result["content"])
        if "text" in result:
            return str(result["text"])

    # Handle object responses with attributes
    try:
        # OpenAI format: result.choices[0].message.content
        if hasattr(result, "choices") and len(result.choices) > 0:
            choice = result.choices[0]
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                return choice.message.content

        # Anthropic format: result.content[0].text
        if hasattr(result, "content") and len(result.content) > 0:
            content = result.content[0]
            if hasattr(content, "text"):
                return content.text

        # LlamaIndex format
        if hasattr(result, "response"):
            return str(result.response)

    except (AttributeError, IndexError, TypeError):
        pass

    # If we can't extract text, return None
    # User can manually add response via tracer.add_response()
    return None


def create_context_wrapper(trace_id: str):
    """
    Create a context manager for wrapping LLM calls.

    Usage:
        >>> with create_context_wrapper(trace_id) as wrapper:
        >>>     result = wrapper(lambda: client.chat.completions.create(...))
    """

    class LLMWrapper:
        def __init__(self, trace_id: str):
            self.trace_id = trace_id

        def __call__(self, llm_callable: Callable[[], Any], **kwargs) -> Any:
            return wrap_llm_call(self.trace_id, llm_callable, **kwargs)

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

    return LLMWrapper(trace_id)
