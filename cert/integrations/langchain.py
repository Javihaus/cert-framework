"""LangChain integration for CERT Framework.

Provides wrappers for LangChain chains and agents with automatic monitoring.

Usage:
    from langchain.chains import RetrievalQA
    from cert.integrations.langchain import wrap_langchain_chain

    chain = RetrievalQA.from_chain_type(llm, retriever=retriever)
    monitored_chain = wrap_langchain_chain(chain, preset="healthcare")

    result = monitored_chain.invoke({"query": "What is the diagnosis?"})
"""

from typing import Any, Dict, Optional, Union

from cert import monitor


def wrap_langchain_chain(
    chain: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap LangChain chain with CERT monitoring.

    Args:
        chain: LangChain chain or runnable
        preset: CERT preset to use ("healthcare", "financial", "legal", "general")
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped chain with monitoring enabled

    Example:
        >>> from langchain.chains import RetrievalQA
        >>> from langchain.llms import OpenAI
        >>> from langchain.vectorstores import FAISS
        >>> from cert.integrations.langchain import wrap_langchain_chain
        >>>
        >>> # Create your chain
        >>> chain = RetrievalQA.from_chain_type(
        ...     llm=OpenAI(),
        ...     retriever=vectorstore.as_retriever()
        ... )
        >>>
        >>> # Wrap with monitoring
        >>> monitored_chain = wrap_langchain_chain(chain, preset="healthcare")
        >>>
        >>> # Use normally
        >>> result = monitored_chain.invoke({"query": "Patient symptoms?"})
    """
    try:
        # Check if LangChain is installed
        import langchain  # noqa: F401
    except ImportError:
        raise ImportError(
            "LangChain is required for this integration. "
            "Install with: pip install langchain"
        )

    # Store original invoke method
    original_invoke = chain.invoke

    # Create monitored version
    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_invoke(inputs: Dict) -> Dict:
        """Monitored invoke that extracts context and answer."""
        # Call original chain
        result = original_invoke(inputs)

        # Extract query
        query = inputs.get("query") or inputs.get("question") or inputs.get("input", "")

        # Extract context from source documents if available
        context = ""
        if isinstance(result, dict):
            source_docs = result.get("source_documents", [])
            if source_docs:
                context = "\n\n".join(doc.page_content for doc in source_docs)

        # Extract answer
        if isinstance(result, dict):
            answer = result.get("result") or result.get("answer") or result.get("output", "")
        else:
            answer = str(result)

        # Return in CERT format for monitoring
        return {
            "query": query,
            "context": context if context else "(no context retrieved)",
            "answer": answer,
            "_original_result": result,  # Preserve original result
        }

    # Replace invoke method
    chain.invoke = monitored_invoke

    # Also wrap __call__ if it exists (older LangChain versions)
    if hasattr(chain, "__call__"):
        original_call = chain.__call__

        @monitor(preset=preset, **config)
        def monitored_call(inputs: Union[Dict, str], *args, **kwargs) -> Any:
            """Monitored __call__ for backward compatibility."""
            # Normalize inputs to dict
            if isinstance(inputs, str):
                inputs = {"query": inputs}

            result = original_call(inputs, *args, **kwargs)

            # Extract components
            query = inputs.get("query") or inputs.get("question", "")

            context = ""
            if isinstance(result, dict):
                source_docs = result.get("source_documents", [])
                if source_docs:
                    context = "\n\n".join(doc.page_content for doc in source_docs)

            if isinstance(result, dict):
                answer = result.get("result") or result.get("answer", "")
            else:
                answer = str(result)

            return {
                "query": query,
                "context": context if context else "(no context retrieved)",
                "answer": answer,
                "_original_result": result,
            }

        chain.__call__ = monitored_call

    return chain


def wrap_langchain_agent(
    agent: Any,
    preset: str = "general",
    monitor_config: Optional[Dict] = None,
):
    """Wrap LangChain agent with CERT monitoring.

    Args:
        agent: LangChain agent executor
        preset: CERT preset to use
        monitor_config: Optional custom monitor configuration

    Returns:
        Wrapped agent with monitoring enabled

    Example:
        >>> from langchain.agents import create_react_agent, AgentExecutor
        >>> from cert.integrations.langchain import wrap_langchain_agent
        >>>
        >>> # Create your agent
        >>> agent_executor = AgentExecutor(agent=agent, tools=tools)
        >>>
        >>> # Wrap with monitoring
        >>> monitored_agent = wrap_langchain_agent(agent_executor, preset="general")
        >>>
        >>> # Use normally
        >>> result = monitored_agent.invoke({"input": "What's the weather?"})
    """
    try:
        import langchain  # noqa: F401
    except ImportError:
        raise ImportError(
            "LangChain is required for this integration. "
            "Install with: pip install langchain"
        )

    original_invoke = agent.invoke
    config = monitor_config or {}

    @monitor(preset=preset, **config)
    def monitored_invoke(inputs: Dict) -> Dict:
        """Monitored agent invoke."""
        result = original_invoke(inputs)

        # Extract query
        query = inputs.get("input") or inputs.get("query", "")

        # For agents, the intermediate steps are the context
        context = ""
        if isinstance(result, dict) and "intermediate_steps" in result:
            steps = result["intermediate_steps"]
            context = "\n".join(f"Step {i+1}: {step}" for i, step in enumerate(steps))

        # Extract answer
        if isinstance(result, dict):
            answer = result.get("output") or result.get("result", "")
        else:
            answer = str(result)

        return {
            "query": query,
            "context": context if context else "(agent reasoning steps)",
            "answer": answer,
            "_original_result": result,
        }

    agent.invoke = monitored_invoke

    return agent


def create_monitored_callback(preset: str = "general") -> Any:
    """Create a LangChain callback handler for CERT monitoring.

    This callback can be added to any LangChain component to monitor
    its execution.

    Args:
        preset: CERT preset to use

    Returns:
        LangChain callback handler

    Example:
        >>> from cert.integrations.langchain import create_monitored_callback
        >>>
        >>> callback = create_monitored_callback("healthcare")
        >>> chain.invoke({"query": "..."}, callbacks=[callback])
    """
    try:
        from langchain.callbacks.base import BaseCallbackHandler
    except ImportError:
        raise ImportError(
            "LangChain is required for this integration. "
            "Install with: pip install langchain"
        )

    class CERTMonitoringCallback(BaseCallbackHandler):
        """Callback handler for CERT monitoring."""

        def __init__(self, preset: str = "general"):
            self.preset = preset
            self.current_context = []
            self.current_query = ""

        def on_retriever_end(self, documents, **kwargs):
            """Called when retriever finishes."""
            self.current_context = [doc.page_content for doc in documents]

        def on_chain_start(self, serialized, inputs, **kwargs):
            """Called when chain starts."""
            self.current_query = inputs.get("query") or inputs.get("question", "")

        def on_chain_end(self, outputs, **kwargs):
            """Called when chain ends - perform monitoring."""
            context = "\n\n".join(self.current_context) if self.current_context else ""
            answer = outputs.get("result") or outputs.get("answer", "")

            # Create monitored function
            @monitor(preset=self.preset)
            def _monitor_result(query, context, answer):
                return {"query": query, "context": context, "answer": answer}

            # Log the interaction
            if context and answer:
                _monitor_result(self.current_query, context, answer)

    return CERTMonitoringCallback(preset=preset)
