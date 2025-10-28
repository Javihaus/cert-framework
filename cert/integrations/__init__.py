"""
CERT Framework Integrations
============================

Integration modules for popular LLM frameworks and SDKs.

Available Integrations:
- langchain: LangChain chains and agents
- llamaindex: LlamaIndex query engines and agents
- anthropic: Anthropic SDK clients
- openai: OpenAI SDK clients

Usage:
    >>> from cert.integrations.langchain import wrap_langchain_chain
    >>> from cert.integrations.llamaindex import wrap_llamaindex_engine
    >>> from cert.integrations.anthropic import wrap_anthropic_client
    >>> from cert.integrations.openai import wrap_openai_client

Note: These integrations require the respective framework to be installed:
    pip install langchain
    pip install llama-index
    pip install anthropic
    pip install openai
"""

# LangChain
from cert.integrations.langchain import (
    wrap_langchain_chain,
    wrap_langchain_agent,
    create_monitored_callback,
)

# LlamaIndex
from cert.integrations.llamaindex import (
    wrap_llamaindex_engine,
    wrap_llamaindex_agent,
    wrap_llamaindex_chat_engine,
)

# Anthropic
from cert.integrations.anthropic import (
    wrap_anthropic_client,
    wrap_anthropic_completion,
    create_monitored_anthropic_stream,
)

# OpenAI
from cert.integrations.openai import (
    wrap_openai_client,
    wrap_openai_completion,
    create_monitored_openai_stream,
    wrap_openai_assistants,
)

__all__ = [
    # LangChain
    "wrap_langchain_chain",
    "wrap_langchain_agent",
    "create_monitored_callback",
    # LlamaIndex
    "wrap_llamaindex_engine",
    "wrap_llamaindex_agent",
    "wrap_llamaindex_chat_engine",
    # Anthropic
    "wrap_anthropic_client",
    "wrap_anthropic_completion",
    "create_monitored_anthropic_stream",
    # OpenAI
    "wrap_openai_client",
    "wrap_openai_completion",
    "create_monitored_openai_stream",
    "wrap_openai_assistants",
]
