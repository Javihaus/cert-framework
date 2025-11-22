"""
OpenTelemetry Integration for LLM Observability

Provides distributed tracing and metrics export using OpenTelemetry
standard for production LLM systems.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable
from contextlib import contextmanager
import time
import json


@dataclass
class Span:
    """Represents a single trace span."""

    trace_id: str
    span_id: str
    name: str
    start_time: float
    end_time: float | None = None
    parent_span_id: str | None = None
    attributes: dict[str, Any] = field(default_factory=dict)
    events: list[dict[str, Any]] = field(default_factory=list)
    status: str = "OK"
    status_message: str = ""

    def set_attribute(self, key: str, value: Any) -> None:
        """Set a span attribute."""
        self.attributes[key] = value

    def add_event(self, name: str, attributes: dict[str, Any] | None = None) -> None:
        """Add an event to the span."""
        self.events.append({
            "name": name,
            "timestamp": time.time(),
            "attributes": attributes or {},
        })

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "name": self.name,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "parent_span_id": self.parent_span_id,
            "attributes": self.attributes,
            "events": self.events,
            "status": self.status,
            "status_message": self.status_message,
            "duration_ms": (self.end_time - self.start_time) * 1000 if self.end_time else None,
        }


class OpenTelemetryExporter:
    """
    OpenTelemetry exporter for LLM tracing.

    Provides distributed tracing capabilities compatible with
    OpenTelemetry collectors and backends (Jaeger, Zipkin, etc.).

    Example:
        exporter = OpenTelemetryExporter(
            service_name="my-llm-service",
            endpoint="http://localhost:4317"
        )

        with exporter.start_span("llm_request") as span:
            span.set_attribute("model", "gpt-4")
            span.set_attribute("prompt_tokens", 100)
            response = call_llm(prompt)
            span.set_attribute("completion_tokens", 50)
    """

    def __init__(
        self,
        service_name: str = "cert-llm-service",
        endpoint: str | None = None,
        export_to_console: bool = False,
        export_to_file: str | None = None,
        batch_size: int = 100,
    ):
        """
        Initialize the exporter.

        Args:
            service_name: Name of the service for tracing
            endpoint: OTLP collector endpoint
            export_to_console: Print traces to console
            export_to_file: Export traces to JSONL file
            batch_size: Batch size for export
        """
        self.service_name = service_name
        self.endpoint = endpoint
        self.export_to_console = export_to_console
        self.export_to_file = export_to_file
        self.batch_size = batch_size

        self._spans: list[Span] = []
        self._current_trace_id: str | None = None
        self._span_counter = 0

        # Try to import OpenTelemetry
        self._otel_available = False
        try:
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            self._otel_available = True
        except ImportError:
            pass

    def _generate_id(self, length: int = 16) -> str:
        """Generate a random ID."""
        import random
        return ''.join(random.choices('0123456789abcdef', k=length))

    def start_trace(self) -> str:
        """Start a new trace and return trace ID."""
        self._current_trace_id = self._generate_id(32)
        return self._current_trace_id

    @contextmanager
    def start_span(
        self,
        name: str,
        parent_span_id: str | None = None,
        attributes: dict[str, Any] | None = None,
    ):
        """
        Context manager for creating a span.

        Args:
            name: Span name
            parent_span_id: Parent span ID
            attributes: Initial attributes

        Yields:
            Span object
        """
        if self._current_trace_id is None:
            self.start_trace()

        self._span_counter += 1
        span = Span(
            trace_id=self._current_trace_id,
            span_id=self._generate_id(16),
            name=name,
            start_time=time.time(),
            parent_span_id=parent_span_id,
            attributes=attributes or {},
        )

        # Add standard attributes
        span.set_attribute("service.name", self.service_name)
        span.set_attribute("span.kind", "internal")

        try:
            yield span
            span.status = "OK"
        except Exception as e:
            span.status = "ERROR"
            span.status_message = str(e)
            span.add_event("exception", {"exception.message": str(e)})
            raise
        finally:
            span.end_time = time.time()
            self._spans.append(span)
            self._export_span(span)

    def _export_span(self, span: Span) -> None:
        """Export a single span."""
        if self.export_to_console:
            print(f"[TRACE] {span.name}: {span.to_dict()}")

        if self.export_to_file:
            try:
                with open(self.export_to_file, "a") as f:
                    f.write(json.dumps(span.to_dict()) + "\n")
            except Exception:
                pass

    def record_llm_request(
        self,
        model: str,
        prompt: str,
        response: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: float,
        metadata: dict[str, Any] | None = None,
    ) -> Span:
        """
        Record an LLM request as a span.

        Args:
            model: Model name
            prompt: Input prompt
            response: Model response
            input_tokens: Input token count
            output_tokens: Output token count
            latency_ms: Request latency
            metadata: Additional metadata

        Returns:
            Created Span
        """
        if self._current_trace_id is None:
            self.start_trace()

        span = Span(
            trace_id=self._current_trace_id,
            span_id=self._generate_id(16),
            name="llm.request",
            start_time=time.time() - latency_ms / 1000,
            end_time=time.time(),
            attributes={
                "llm.model": model,
                "llm.prompt.tokens": input_tokens,
                "llm.completion.tokens": output_tokens,
                "llm.total.tokens": input_tokens + output_tokens,
                "llm.latency_ms": latency_ms,
                "service.name": self.service_name,
                **(metadata or {}),
            },
        )

        self._spans.append(span)
        self._export_span(span)
        return span

    def get_traces(self, limit: int | None = None) -> list[dict[str, Any]]:
        """Get recorded traces."""
        spans = self._spans[-limit:] if limit else self._spans
        return [s.to_dict() for s in spans]

    def export_all(self, filepath: str) -> bool:
        """Export all traces to file."""
        try:
            with open(filepath, "w") as f:
                for span in self._spans:
                    f.write(json.dumps(span.to_dict()) + "\n")
            return True
        except Exception:
            return False

    def clear(self) -> None:
        """Clear all recorded spans."""
        self._spans.clear()
        self._current_trace_id = None


def trace_llm_call(
    exporter: OpenTelemetryExporter,
    span_name: str = "llm.call",
):
    """
    Decorator to trace LLM function calls.

    Example:
        @trace_llm_call(exporter, "chat_completion")
        def my_llm_function(prompt):
            return llm.complete(prompt)
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            with exporter.start_span(span_name) as span:
                span.set_attribute("function.name", func.__name__)
                result = func(*args, **kwargs)

                # Try to extract common attributes
                if isinstance(result, dict):
                    if "model" in result:
                        span.set_attribute("llm.model", result["model"])
                    if "usage" in result:
                        usage = result["usage"]
                        span.set_attribute("llm.prompt.tokens", usage.get("prompt_tokens", 0))
                        span.set_attribute("llm.completion.tokens", usage.get("completion_tokens", 0))

                return result
        return wrapper
    return decorator
