"""LlamaIndex integration for CERT Framework.

Provides wrappers for LlamaIndex query engines and agents with automatic monitoring.

Usage:
    from llama_index.core import VectorStoreIndex
    from cert.integrations.llamaindex import wrap_llamaindex_engine

    index = VectorStoreIndex.from_documents(documents)
    engine = index.as_query_engine()
    monitored_engine = wrap_llamaindex_engine(engine, preset="healthcare")

    response = monitored_engine.query("What is the diagnosis?")
"""

from typing import Any, Optional, Dict

from cert import monitor


def wrap_llamaindex_engine(
    query_engine: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap LlamaIndex query engine with CERT monitoring.

    Args:
        query_engine: LlamaIndex query engine
        preset: CERT preset to use ("healthcare", "financial", "legal", "general")
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped query engine with monitoring enabled

    Example:
        >>> from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
        >>> from cert.integrations.llamaindex import wrap_llamaindex_engine
        >>>
        >>> # Create your index
        >>> documents = SimpleDirectoryReader("data").load_data()
        >>> index = VectorStoreIndex.from_documents(documents)
        >>> engine = index.as_query_engine()
        >>>
        >>> # Wrap with monitoring
        >>> monitored_engine = wrap_llamaindex_engine(engine, preset="healthcare")
        >>>
        >>> # Use normally
        >>> response = monitored_engine.query("Patient symptoms?")
    """
    try:
        import llama_index  # noqa: F401
    except ImportError:
        raise ImportError(
            "LlamaIndex is required for this integration. "
            "Install with: pip install llama-index"
        )

    # Store original query method
    original_query = query_engine.query

    # Create monitored version
    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_query(query_str: str) -> Any:
        """Monitored query that extracts context and answer."""
        # Call original query engine
        response = original_query(query_str)

        # Extract context from source nodes
        context = ""
        if hasattr(response, "source_nodes"):
            context_parts = []
            for node in response.source_nodes:
                if hasattr(node, "node") and hasattr(node.node, "text"):
                    context_parts.append(node.node.text)
                elif hasattr(node, "text"):
                    context_parts.append(node.text)
            context = "\n\n".join(context_parts)

        # Extract answer
        if hasattr(response, "response"):
            answer = response.response
        else:
            answer = str(response)

        # Return in CERT format for monitoring
        # But preserve the original response object
        response._cert_monitoring = {
            "query": query_str,
            "context": context if context else "(no context retrieved)",
            "answer": answer,
        }

        # Override the monitoring return
        return {
            "query": query_str,
            "context": context if context else "(no context retrieved)",
            "answer": answer,
            "_original_response": response,
        }

    # Replace query method
    query_engine.query = monitored_query

    return query_engine


def wrap_llamaindex_agent(
    agent: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap LlamaIndex agent with CERT monitoring.

    Args:
        agent: LlamaIndex agent
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped agent with monitoring enabled

    Example:
        >>> from llama_index.core.agent import ReActAgent
        >>> from cert.integrations.llamaindex import wrap_llamaindex_agent
        >>>
        >>> # Create your agent
        >>> agent = ReActAgent.from_tools(tools, llm=llm)
        >>>
        >>> # Wrap with monitoring
        >>> monitored_agent = wrap_llamaindex_agent(agent, preset="general")
        >>>
        >>> # Use normally
        >>> response = monitored_agent.chat("What's the weather?")
    """
    try:
        import llama_index  # noqa: F401
    except ImportError:
        raise ImportError(
            "LlamaIndex is required for this integration. "
            "Install with: pip install llama-index"
        )

    # Store original chat method
    original_chat = agent.chat

    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_chat(message: str, *args, **kwargs) -> Any:
        """Monitored chat that extracts reasoning and answer."""
        response = original_chat(message, *args, **kwargs)

        # Extract reasoning steps as context
        context = ""
        if hasattr(response, "sources") and response.sources:
            context_parts = []
            for source in response.sources:
                if hasattr(source, "content"):
                    context_parts.append(source.content)
            context = "\n".join(context_parts)

        # Extract answer
        if hasattr(response, "response"):
            answer = response.response
        else:
            answer = str(response)

        return {
            "query": message,
            "context": context if context else "(agent reasoning)",
            "answer": answer,
            "_original_response": response,
        }

    agent.chat = monitored_chat

    return agent


def wrap_llamaindex_chat_engine(
    chat_engine: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap LlamaIndex chat engine with CERT monitoring.

    Args:
        chat_engine: LlamaIndex chat engine
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped chat engine with monitoring enabled

    Example:
        >>> from llama_index.core import VectorStoreIndex
        >>> from cert.integrations.llamaindex import wrap_llamaindex_chat_engine
        >>>
        >>> index = VectorStoreIndex.from_documents(documents)
        >>> chat_engine = index.as_chat_engine()
        >>>
        >>> # Wrap with monitoring
        >>> monitored_chat = wrap_llamaindex_chat_engine(chat_engine, preset="healthcare")
        >>>
        >>> # Use normally
        >>> response = monitored_chat.chat("Tell me about the patient")
    """
    try:
        import llama_index  # noqa: F401
    except ImportError:
        raise ImportError(
            "LlamaIndex is required for this integration. "
            "Install with: pip install llama-index"
        )

    original_chat = chat_engine.chat
    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_chat(message: str, *args, **kwargs) -> Any:
        """Monitored chat with context extraction."""
        response = original_chat(message, *args, **kwargs)

        # Extract context from source nodes
        context = ""
        if hasattr(response, "source_nodes"):
            context_parts = []
            for node in response.source_nodes:
                if hasattr(node, "node") and hasattr(node.node, "text"):
                    context_parts.append(node.node.text)
                elif hasattr(node, "text"):
                    context_parts.append(node.text)
            context = "\n\n".join(context_parts)

        # Extract answer
        if hasattr(response, "response"):
            answer = response.response
        else:
            answer = str(response)

        return {
            "query": message,
            "context": context if context else "(conversation history)",
            "answer": answer,
            "_original_response": response,
        }

    chat_engine.chat = monitored_chat

    return chat_engine
