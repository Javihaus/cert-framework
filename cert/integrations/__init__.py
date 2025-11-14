"""
CERT Framework Integrations
============================

This module provides both generic and automatic integration with AI/LLM platforms.

Two integration approaches:

1. Generic Adapter (Manual):
    >>> from cert.integrations import wrap_llm_call
    >>> from cert import start_trace, end_trace
    >>> trace_id = start_trace(query="What is the capital of France?")
    >>> result = wrap_llm_call(trace_id, lambda: client.chat.completions.create(...))
    >>> end_trace(trace_id)

2. Automatic Connectors (Zero-config):
    >>> import cert.integrations.auto  # Auto-activates all connectors
    >>> # Your LLM calls are now automatically traced!

The automatic connector system works with:
- OpenAI SDK
- Anthropic SDK
- LangChain
- AWS Bedrock
- Azure OpenAI
- And more...

For building custom connectors:
    >>> from cert.integrations.base import ConnectorAdapter, TracedCall
    >>> from cert.integrations.registry import register_connector
"""

from cert.integrations.generic_adapter import create_context_wrapper, wrap_llm_call
from cert.integrations.base import ConnectorAdapter, TracedCall, AsyncConnectorAdapter
from cert.integrations.registry import (
    register_connector,
    activate_all,
    get_active_connectors,
    get_connector_status,
    check_connector_health,
)

__all__ = [
    # Generic adapter (manual integration)
    "wrap_llm_call",
    "create_context_wrapper",
    # Connector framework (automatic integration)
    "ConnectorAdapter",
    "AsyncConnectorAdapter",
    "TracedCall",
    "register_connector",
    "activate_all",
    "get_active_connectors",
    "get_connector_status",
    "check_connector_health",
]
