"""
CERT Framework Integrations
============================

Generic integration module for any LLM framework or SDK.

Usage:
    >>> from cert.integrations import wrap_llm_call, create_context_wrapper
    >>> from cert import start_trace, end_trace
    >>>
    >>> # Wrap any LLM call
    >>> trace_id = start_trace(query="What is the capital of France?")
    >>> result = wrap_llm_call(trace_id, lambda: client.chat.completions.create(...))
    >>> end_trace(trace_id)

The generic adapter works with any LLM provider:
- OpenAI
- Anthropic
- LangChain
- LlamaIndex
- Any custom LLM implementation
"""

from cert.integrations.generic_adapter import create_context_wrapper, wrap_llm_call

__all__ = [
    "wrap_llm_call",
    "create_context_wrapper",
]
