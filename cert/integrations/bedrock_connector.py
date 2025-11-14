"""
AWS Bedrock Connector for CERT Framework
=========================================

This connector automatically traces calls to AWS Bedrock by wrapping boto3
client methods. It supports multiple model families including:
- Anthropic Claude
- Meta Llama
- Amazon Titan
- AI21 Jurassic
- Cohere Command

Usage:
    >>> import cert.integrations.auto  # Auto-activates this connector
    >>> # Or manually:
    >>> from cert.integrations.bedrock_connector import BedrockConnector
    >>> from cert.core.api import get_tracer
    >>> connector = BedrockConnector(get_tracer())
    >>> connector.activate()
"""

import json
import functools
from datetime import datetime
from typing import Any, Dict, Optional
import logging
import io

try:
    import boto3
    from botocore.response import StreamingBody
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

from cert.integrations.base import ConnectorAdapter, TracedCall
from cert.integrations.registry import register_connector

logger = logging.getLogger(__name__)


@register_connector
class BedrockConnector(ConnectorAdapter):
    """
    Connector for AWS Bedrock.

    This connector intercepts calls to boto3's bedrock-runtime client
    to automatically trace all Bedrock inference calls.

    Features:
    - Support for multiple model families (Claude, Llama, Titan, etc.)
    - Handles different request/response formats per model
    - Streaming support
    - Region-aware pricing (where available)
    """

    def __init__(self, tracer):
        if not BOTO3_AVAILABLE:
            raise ImportError(
                "boto3 not installed. Install with: pip install boto3"
            )
        super().__init__(tracer)
        self._original_client = None

    def activate(self) -> None:
        """
        Activate the connector by monkey-patching boto3.client().

        We wrap the client factory to intercept bedrock-runtime clients.
        """
        self._original_client = boto3.client

        @functools.wraps(self._original_client)
        def wrapped_client(service_name, *args, **kwargs):
            client = self._original_client(service_name, *args, **kwargs)

            if service_name == "bedrock-runtime":
                self._wrap_client_methods(client)

            return client

        boto3.client = wrapped_client

        logger.info("Bedrock connector activated")

    def _wrap_client_methods(self, client):
        """
        Wrap bedrock-runtime client methods.

        Args:
            client: boto3 bedrock-runtime client
        """
        # Wrap invoke_model
        original_invoke = client.invoke_model

        @functools.wraps(original_invoke)
        def wrapped_invoke(**kwargs):
            return self._trace_invoke(original_invoke, **kwargs)

        client.invoke_model = wrapped_invoke

        # Wrap invoke_model_with_response_stream
        original_invoke_stream = client.invoke_model_with_response_stream

        @functools.wraps(original_invoke_stream)
        def wrapped_invoke_stream(**kwargs):
            return self._trace_invoke_stream(original_invoke_stream, **kwargs)

        client.invoke_model_with_response_stream = wrapped_invoke_stream

    def _trace_invoke(self, original_method, **kwargs):
        """
        Trace a non-streaming invoke_model call.

        Args:
            original_method: The original invoke_model method
            **kwargs: Arguments to invoke_model

        Returns:
            The response from the original method
        """
        start_time = datetime.utcnow()

        try:
            # Call the original method
            response = original_method(**kwargs)

            # Parse request and response
            traced_call = self._build_traced_call(kwargs, response, start_time)

            # Log the trace
            self.log_call(traced_call)

            return response

        except Exception as e:
            # Log error
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="bedrock",
                model=kwargs.get("modelId", "unknown"),
                input_data=self._parse_request_body(kwargs.get("body")),
                output_data=None,
                metadata={},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _trace_invoke_stream(self, original_method, **kwargs):
        """
        Trace a streaming invoke_model_with_response_stream call.

        Args:
            original_method: The original invoke_model_with_response_stream method
            **kwargs: Arguments to the method

        Returns:
            The response from the original method (with wrapped stream)
        """
        start_time = datetime.utcnow()

        try:
            # Call the original method
            response = original_method(**kwargs)

            # Wrap the stream to accumulate chunks
            response["body"] = self._wrap_stream(
                response["body"], kwargs, response, start_time
            )

            return response

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="bedrock",
                model=kwargs.get("modelId", "unknown"),
                input_data=self._parse_request_body(kwargs.get("body")),
                output_data=None,
                metadata={"streaming": True},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _wrap_stream(self, stream, request_kwargs, response_metadata, start_time):
        """
        Wrap a streaming response to accumulate and log when complete.

        Args:
            stream: The streaming body
            request_kwargs: Original request parameters
            response_metadata: Response metadata
            start_time: When the request started

        Yields:
            Stream chunks
        """
        chunks = []

        try:
            for event in stream:
                chunks.append(event)
                yield event

            # Stream complete, log it
            traced_call = self._build_streaming_traced_call(
                request_kwargs, chunks, response_metadata, start_time
            )
            self.log_call(traced_call)

        except Exception as e:
            traced_call = TracedCall(
                timestamp=self.format_timestamp(start_time),
                platform="bedrock",
                model=request_kwargs.get("modelId", "unknown"),
                input_data=self._parse_request_body(request_kwargs.get("body")),
                output_data=None,
                metadata={"streaming": True},
                error=str(e),
            )
            self.log_call(traced_call)
            raise

    def _build_traced_call(
        self, request: Dict, response: Dict, start_time: datetime
    ) -> TracedCall:
        """
        Build a TracedCall from a Bedrock request/response.

        Args:
            request: Request parameters
            response: Bedrock API response
            start_time: When the request started

        Returns:
            TracedCall object
        """
        model_id = request.get("modelId", "unknown")

        # Parse request body
        request_body = self._parse_request_body(request.get("body"))

        # Parse response body
        response_body_bytes = response["body"].read()
        response_body = json.loads(response_body_bytes.decode("utf-8"))

        # Extract output based on model family
        output_data = self._extract_output(response_body, model_id)

        # Build metadata
        metadata = self.extract_metadata(response)

        # Calculate cost (if possible)
        cost = self._calculate_bedrock_cost(model_id, request_body, response_body)

        return TracedCall(
            timestamp=self.format_timestamp(start_time),
            platform="bedrock",
            model=model_id,
            input_data=request_body,
            output_data=output_data,
            metadata=metadata,
            cost=cost,
        )

    def _build_streaming_traced_call(
        self,
        request: Dict,
        chunks: list,
        response_metadata: Dict,
        start_time: datetime,
    ) -> TracedCall:
        """
        Build a TracedCall from streaming Bedrock response.

        Args:
            request: Request parameters
            chunks: List of stream chunks
            response_metadata: Response metadata
            start_time: When the request started

        Returns:
            TracedCall object
        """
        model_id = request.get("modelId", "unknown")
        request_body = self._parse_request_body(request.get("body"))

        # Accumulate chunks
        accumulated_text = []
        for chunk in chunks:
            chunk_data = chunk.get("chunk", {})
            if chunk_data:
                chunk_bytes = chunk_data.get("bytes", b"")
                chunk_json = json.loads(chunk_bytes.decode("utf-8"))

                # Extract text based on model family
                text = self._extract_streaming_text(chunk_json, model_id)
                if text:
                    accumulated_text.append(text)

        output_data = "".join(accumulated_text)

        metadata = {
            "streaming": True,
            "chunk_count": len(chunks),
        }

        cost = self._calculate_bedrock_cost(model_id, request_body, None)

        return TracedCall(
            timestamp=self.format_timestamp(start_time),
            platform="bedrock",
            model=model_id,
            input_data=request_body,
            output_data=output_data,
            metadata=metadata,
            cost=cost,
        )

    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """
        Extract metadata from Bedrock response.

        Args:
            call_data: Bedrock API response

        Returns:
            Dictionary of metadata
        """
        metadata = {}

        if isinstance(call_data, dict):
            # Extract response metadata
            response_metadata = call_data.get("ResponseMetadata", {})
            if response_metadata:
                metadata["request_id"] = response_metadata.get("RequestId")
                metadata["http_status_code"] = response_metadata.get("HTTPStatusCode")

            # Extract content type
            metadata["content_type"] = call_data.get("contentType")

        return metadata

    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """
        Calculate cost from Bedrock call data.

        Note: Bedrock pricing is complex and varies by model, region,
        and pricing tier. We return None for most cases and recommend
        users check AWS billing for accurate costs.

        Args:
            call_data: Bedrock response data

        Returns:
            Cost in USD, or None
        """
        # Bedrock pricing is too complex to calculate accurately
        # Different models, regions, and pricing models
        return None

    def _calculate_bedrock_cost(
        self, model_id: str, request_body: Dict, response_body: Optional[Dict]
    ) -> Optional[float]:
        """
        Attempt to calculate Bedrock cost.

        This is a best-effort estimation. Actual costs may vary.

        Args:
            model_id: Bedrock model ID
            request_body: Request body
            response_body: Response body (None for streaming)

        Returns:
            Estimated cost in USD, or None
        """
        # For now, return None
        # In the future, we could add pricing tables for common models/regions
        return None

    def _parse_request_body(self, body_bytes) -> Any:
        """
        Parse Bedrock request body.

        Args:
            body_bytes: Request body bytes

        Returns:
            Parsed request data
        """
        if body_bytes is None:
            return None

        if isinstance(body_bytes, (str, bytes)):
            try:
                if isinstance(body_bytes, bytes):
                    body_str = body_bytes.decode("utf-8")
                else:
                    body_str = body_bytes
                return json.loads(body_str)
            except (json.JSONDecodeError, UnicodeDecodeError):
                return str(body_bytes)

        return body_bytes

    def _extract_output(self, response_body: Dict, model_id: str) -> Optional[str]:
        """
        Extract output text from Bedrock response based on model family.

        Different Bedrock models return responses in different formats.

        Args:
            response_body: Parsed response body
            model_id: Model identifier

        Returns:
            Output text or None
        """
        # Anthropic Claude models
        if "anthropic.claude" in model_id:
            if "content" in response_body:
                # Claude 3+ format
                content = response_body["content"]
                if isinstance(content, list) and len(content) > 0:
                    return content[0].get("text", "")
            elif "completion" in response_body:
                # Claude 2 format
                return response_body["completion"]

        # Meta Llama models
        elif "meta.llama" in model_id:
            return response_body.get("generation", "")

        # Amazon Titan models
        elif "amazon.titan" in model_id:
            results = response_body.get("results", [])
            if results and len(results) > 0:
                return results[0].get("outputText", "")

        # AI21 Jurassic models
        elif "ai21.j2" in model_id:
            completions = response_body.get("completions", [])
            if completions and len(completions) > 0:
                return completions[0].get("data", {}).get("text", "")

        # Cohere Command models
        elif "cohere.command" in model_id:
            generations = response_body.get("generations", [])
            if generations and len(generations) > 0:
                return generations[0].get("text", "")

        # Unknown format - return entire response as string
        return str(response_body)

    def _extract_streaming_text(self, chunk_data: Dict, model_id: str) -> Optional[str]:
        """
        Extract text from a streaming chunk based on model family.

        Args:
            chunk_data: Parsed chunk data
            model_id: Model identifier

        Returns:
            Text from this chunk, or None
        """
        # Anthropic Claude streaming format
        if "anthropic.claude" in model_id:
            if "delta" in chunk_data:
                delta = chunk_data["delta"]
                if "text" in delta:
                    return delta["text"]
            elif "completion" in chunk_data:
                return chunk_data["completion"]

        # Meta Llama streaming format
        elif "meta.llama" in model_id:
            return chunk_data.get("generation", "")

        # Amazon Titan streaming format
        elif "amazon.titan" in model_id:
            return chunk_data.get("outputText", "")

        # For unknown formats, try to find text-like fields
        for key in ["text", "content", "output", "generation"]:
            if key in chunk_data:
                return str(chunk_data[key])

        return None
