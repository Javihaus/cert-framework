"""
Generic LLM Integration Adapter
================================

DEPRECATED: This module is deprecated. Use the automatic connector system instead:
    >>> import cert.integrations.auto  # Auto-activates all connectors

A simple, universal adapter for wrapping any LLM via callback pattern.
This replaces 1400+ lines of provider-specific code with a single flexible interface.

Legacy Usage (deprecated):
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

import warnings
from typing import Any, Callable, Dict, Optional


def wrap_llm_call(
    trace_id: str,
    llm_callable: Callable[[], Any],
    expected: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Any:
    """
    Wrap any LLM call with CERT tracing.

    DEPRECATED: This function is deprecated. Use the automatic connector system instead:
        >>> import cert.integrations.auto  # Auto-activates all connectors

    Args:
        trace_id: Active trace ID from start_trace() (ignored)
        llm_callable: Function that executes the LLM call
        expected: Expected output for evaluation (ignored)
        metadata: Additional metadata to attach (ignored)

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
    warnings.warn(
        "wrap_llm_call() is deprecated. Use the automatic connector system instead: "
        "import cert.integrations.auto",
        DeprecationWarning,
        stacklevel=2,
    )

    # Simply execute the callable and return result
    # The automatic connectors will handle tracing if activated
    return llm_callable()


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
