"""
Lightweight tracer with zero external dependencies.

This module provides minimal monitoring capabilities - just structured logging
of inputs, outputs, timing, and errors. No ML models, no evaluation.

For evaluation features, install: pip install cert-framework[evaluation]
"""

import functools
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, Optional


class CertTracer:
    """Minimal tracer - just structured logging to JSONL."""

    def __init__(self, log_path: str = "cert_traces.jsonl"):
        """Initialize tracer with log file path.

        Args:
            log_path: Path to JSONL log file (default: cert_traces.jsonl)
        """
        self.log_path = Path(log_path)
        # Ensure parent directory exists
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def log_trace(self, trace: Dict[str, Any]) -> None:
        """Write trace to JSONL file.

        Args:
            trace: Dictionary containing trace data
        """
        with open(self.log_path, "a") as f:
            f.write(json.dumps(trace, default=str) + "\n")


def trace(
    _func: Optional[Callable] = None,
    *,
    log_path: str = "cert_traces.jsonl",
    metadata: Optional[Dict] = None,
    input_key: Optional[str] = None,
    output_key: Optional[str] = None,
    context_key: Optional[str] = None,
) -> Callable:
    """Lightweight decorator for tracing LLM function calls.

    Zero dependencies - just logs inputs, outputs, timing, and errors to JSONL.

    Args:
        log_path: Path to JSONL log file (default: cert_traces.jsonl)
        metadata: Optional metadata to include in traces
        input_key: Explicit key name for input in kwargs or result dict (e.g., "query", "question")
        output_key: Explicit key name for output in result dict (e.g., "response", "answer")
        context_key: Explicit key name for context in result dict (e.g., "context", "retrieved_docs")

    Returns:
        Decorated function that logs all calls

    Examples:
        >>> from cert import trace
        >>>
        >>> @trace()
        ... def my_rag_pipeline(query):
        ...     context = retrieve_documents(query)
        ...     answer = llm.generate(context, query)
        ...     return {"context": context, "answer": answer}
        >>>
        >>> # With explicit key mapping for evaluator compatibility
        >>> @trace(input_key="query", output_key="response", context_key="docs")
        ... def my_rag_pipeline(query):
        ...     docs = retrieve_documents(query)
        ...     response = llm.generate(docs, query)
        ...     return {"docs": docs, "response": response}
        >>>
        >>> # With custom log path
        >>> @trace(log_path="production_traces.jsonl")
        ... def my_rag_pipeline(query):
        ...     return {"context": context, "answer": answer}
        >>>
        >>> # With metadata
        >>> @trace(metadata={"service": "rag", "version": "1.0"})
        ... def my_rag_pipeline(query):
        ...     return {"context": context, "answer": answer}

    Note:
        For evaluation features (semantic similarity, NLI, grounding analysis),
        install: pip install cert-framework[evaluation]
        Then use: from cert.evaluation import Evaluator
    """

    def decorator(func: Callable) -> Callable:
        tracer = CertTracer(log_path)

        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            timestamp = datetime.utcnow().isoformat() + "Z"

            # Call function
            result = None
            status = "success"
            error = None

            try:
                result = func(*args, **kwargs)
            except Exception as e:
                status = "error"
                error = str(e)
                # Re-raise after logging
                raise
            finally:
                # Calculate duration
                duration_ms = (time.time() - start_time) * 1000

                # Build trace data
                trace_data = {
                    "timestamp": timestamp,
                    "function": func.__name__,
                    "duration_ms": duration_ms,
                    "status": status,
                    "error": error,
                }

                # Add metadata if provided
                if metadata:
                    trace_data["metadata"] = metadata

                # Extract input from kwargs using explicit key or fallback
                if input_key and input_key in kwargs:
                    trace_data["input"] = kwargs[input_key]
                elif "input" not in trace_data:
                    # Fallback to common keys
                    for key in ["query", "question", "prompt", "input"]:
                        if key in kwargs:
                            trace_data["input"] = kwargs[key]
                            break

                # Extract context/answer if result is dict-like
                if result is not None and isinstance(result, dict):
                    # Use explicit keys if provided
                    if context_key and context_key in result:
                        trace_data["context"] = result[context_key]
                    elif "context" not in trace_data:
                        # Fallback to common keys
                        if "context" in result:
                            trace_data["context"] = result["context"]
                        elif "retrieved_docs" in result:
                            trace_data["context"] = result["retrieved_docs"]
                        elif "docs" in result:
                            trace_data["context"] = result["docs"]

                    if output_key and output_key in result:
                        trace_data["answer"] = result[output_key]
                    elif "answer" not in trace_data:
                        # Fallback to common keys
                        if "answer" in result:
                            trace_data["answer"] = result["answer"]
                        elif "response" in result:
                            trace_data["answer"] = result["response"]
                        elif "output" in result:
                            trace_data["answer"] = result["output"]

                    # Also try to get input from result if not already captured
                    if "input" not in trace_data:
                        if input_key and input_key in result:
                            trace_data["input"] = result[input_key]
                        elif "query" in result:
                            trace_data["input"] = result["query"]
                        elif "question" in result:
                            trace_data["input"] = result["question"]

                # Log the trace
                tracer.log_trace(trace_data)

            return result

        return wrapper

    # Support both @trace and @trace(...)
    return decorator if _func is None else decorator(_func)
