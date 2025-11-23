"""
WebSocket Streaming for CERT Framework
========================================

Real-time trace streaming via WebSocket for live dashboard updates.

Usage:
    # Server-side (Python)
    from cert.observability.websocket import WebSocketTraceServer, WebSocketTracer

    # Start streaming server
    server = WebSocketTraceServer(host="localhost", port=8765)
    server.start()

    # Use WebSocket-enabled tracer
    tracer = WebSocketTracer(ws_server=server)

    # Client-side (JavaScript/TypeScript)
    const ws = new WebSocket('ws://localhost:8765');
    ws.onmessage = (event) => {
        const trace = JSON.parse(event.data);
        console.log('New trace:', trace);
    };
"""

import asyncio
import json
import logging
import threading
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Set
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# Check for websockets library
try:
    import websockets
    from websockets.server import serve as websockets_serve
    from websockets.exceptions import ConnectionClosed
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    websockets = None


@dataclass
class TraceEvent:
    """Real-time trace event for WebSocket streaming."""
    event_type: str  # "trace", "metric", "alert", "heartbeat"
    timestamp: str
    data: Dict[str, Any]
    source: str = "cert"


class WebSocketTraceServer:
    """
    WebSocket server for streaming traces in real-time.

    Features:
    - Broadcasts traces to all connected clients
    - Supports multiple concurrent connections
    - Auto-reconnection handling
    - Heartbeat for connection health

    Usage:
        server = WebSocketTraceServer(host="localhost", port=8765)
        server.start()  # Starts in background thread

        # Broadcast a trace
        server.broadcast({"timestamp": "...", "model": "gpt-4", ...})

        # Stop server
        server.stop()
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 8765,
        heartbeat_interval: int = 30
    ):
        """
        Initialize WebSocket trace server.

        Args:
            host: Server host address
            port: Server port
            heartbeat_interval: Seconds between heartbeat messages
        """
        if not WEBSOCKETS_AVAILABLE:
            raise ImportError(
                "WebSocket support requires 'websockets' package. "
                "Install with: pip install websockets"
            )

        self.host = host
        self.port = port
        self.heartbeat_interval = heartbeat_interval
        self.clients: Set = set()
        self._server = None
        self._loop = None
        self._thread = None
        self._running = False

    async def _handler(self, websocket) -> None:
        """Handle a WebSocket connection."""
        self.clients.add(websocket)
        client_id = id(websocket)
        logger.info(f"Client connected: {client_id}. Total clients: {len(self.clients)}")

        try:
            # Send welcome message
            await websocket.send(json.dumps({
                "event_type": "connected",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "data": {"message": "Connected to CERT trace stream", "client_id": client_id},
                "source": "cert"
            }))

            # Keep connection alive and handle incoming messages
            async for message in websocket:
                # Handle client messages (e.g., subscriptions, filters)
                try:
                    data = json.loads(message)
                    if data.get("type") == "ping":
                        await websocket.send(json.dumps({
                            "event_type": "pong",
                            "timestamp": datetime.utcnow().isoformat() + "Z",
                            "data": {},
                            "source": "cert"
                        }))
                except json.JSONDecodeError:
                    pass

        except ConnectionClosed:
            pass
        finally:
            self.clients.discard(websocket)
            logger.info(f"Client disconnected: {client_id}. Total clients: {len(self.clients)}")

    async def _heartbeat(self) -> None:
        """Send periodic heartbeat to all clients."""
        while self._running:
            if self.clients:
                message = json.dumps({
                    "event_type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "data": {"clients": len(self.clients)},
                    "source": "cert"
                })
                await self._broadcast_async(message)

            await asyncio.sleep(self.heartbeat_interval)

    async def _broadcast_async(self, message: str) -> None:
        """Broadcast message to all connected clients."""
        if not self.clients:
            return

        # Send to all clients, ignore failures
        disconnected = set()
        for client in self.clients:
            try:
                await client.send(message)
            except ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                logger.warning(f"Error sending to client: {e}")
                disconnected.add(client)

        # Remove disconnected clients
        self.clients -= disconnected

    def broadcast(self, trace_data: Dict[str, Any]) -> None:
        """
        Broadcast a trace to all connected clients.

        Args:
            trace_data: Trace dictionary to broadcast

        Thread-safe: Can be called from any thread.
        """
        if not self._running or not self._loop:
            return

        event = TraceEvent(
            event_type="trace",
            timestamp=trace_data.get("timestamp", datetime.utcnow().isoformat() + "Z"),
            data=trace_data
        )

        message = json.dumps(asdict(event), default=str)

        # Schedule broadcast in event loop
        asyncio.run_coroutine_threadsafe(
            self._broadcast_async(message),
            self._loop
        )

    def broadcast_metric(self, metric_name: str, value: float, tags: Optional[Dict] = None) -> None:
        """
        Broadcast a metric update.

        Args:
            metric_name: Name of the metric
            value: Metric value
            tags: Optional tags/labels
        """
        if not self._running or not self._loop:
            return

        event = TraceEvent(
            event_type="metric",
            timestamp=datetime.utcnow().isoformat() + "Z",
            data={
                "metric": metric_name,
                "value": value,
                "tags": tags or {}
            }
        )

        message = json.dumps(asdict(event), default=str)

        asyncio.run_coroutine_threadsafe(
            self._broadcast_async(message),
            self._loop
        )

    def broadcast_alert(self, alert_type: str, message: str, severity: str = "info") -> None:
        """
        Broadcast an alert.

        Args:
            alert_type: Type of alert (e.g., "cost_spike", "latency_high")
            message: Alert message
            severity: Alert severity (info, warning, error, critical)
        """
        if not self._running or not self._loop:
            return

        event = TraceEvent(
            event_type="alert",
            timestamp=datetime.utcnow().isoformat() + "Z",
            data={
                "alert_type": alert_type,
                "message": message,
                "severity": severity
            }
        )

        message_str = json.dumps(asdict(event), default=str)

        asyncio.run_coroutine_threadsafe(
            self._broadcast_async(message_str),
            self._loop
        )

    async def _run_server(self) -> None:
        """Run the WebSocket server."""
        async with websockets_serve(self._handler, self.host, self.port):
            logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
            # Start heartbeat task
            heartbeat_task = asyncio.create_task(self._heartbeat())
            try:
                await asyncio.Future()  # Run forever
            finally:
                heartbeat_task.cancel()

    def _thread_target(self) -> None:
        """Thread target for running the event loop."""
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._running = True

        try:
            self._loop.run_until_complete(self._run_server())
        except Exception as e:
            logger.error(f"WebSocket server error: {e}")
        finally:
            self._running = False
            self._loop.close()

    def start(self) -> None:
        """Start the WebSocket server in a background thread."""
        if self._running:
            logger.warning("WebSocket server already running")
            return

        self._thread = threading.Thread(target=self._thread_target, daemon=True)
        self._thread.start()
        logger.info(f"WebSocket server starting on ws://{self.host}:{self.port}")

    def stop(self) -> None:
        """Stop the WebSocket server."""
        self._running = False
        if self._loop:
            self._loop.call_soon_threadsafe(self._loop.stop)

        if self._thread:
            self._thread.join(timeout=5)

        logger.info("WebSocket server stopped")

    @property
    def is_running(self) -> bool:
        """Check if server is running."""
        return self._running

    @property
    def client_count(self) -> int:
        """Get number of connected clients."""
        return len(self.clients)


class WebSocketTracer:
    """
    Tracer that streams traces via WebSocket in addition to file logging.

    Usage:
        server = WebSocketTraceServer()
        server.start()

        tracer = WebSocketTracer(
            log_path="cert_traces.jsonl",
            ws_server=server
        )

        # Use with @trace decorator
        from cert import trace

        @trace(tracer=tracer)
        def my_function():
            pass

    Or use as a standalone:
        tracer.log_trace({"model": "gpt-4", "latency_ms": 500})
    """

    def __init__(
        self,
        log_path: str = "cert_traces.jsonl",
        ws_server: Optional[WebSocketTraceServer] = None,
        on_trace: Optional[Callable[[Dict], None]] = None
    ):
        """
        Initialize WebSocket-enabled tracer.

        Args:
            log_path: Path for JSONL file logging
            ws_server: WebSocket server for streaming (optional)
            on_trace: Callback function called for each trace (optional)
        """
        from cert.core.tracer import CertTracer
        self._file_tracer = CertTracer(log_path)
        self._ws_server = ws_server
        self._on_trace = on_trace

    def log_trace(self, trace: Dict[str, Any]) -> None:
        """
        Log a trace to file and broadcast via WebSocket.

        Args:
            trace: Trace data dictionary
        """
        # Always log to file
        self._file_tracer.log_trace(trace)

        # Stream via WebSocket if server is available
        if self._ws_server and self._ws_server.is_running:
            self._ws_server.broadcast(trace)

        # Call custom callback if provided
        if self._on_trace:
            try:
                self._on_trace(trace)
            except Exception as e:
                logger.warning(f"Trace callback error: {e}")


# Convenience function for quick setup
def create_streaming_tracer(
    log_path: str = "cert_traces.jsonl",
    ws_host: str = "localhost",
    ws_port: int = 8765,
    auto_start: bool = True
) -> tuple:
    """
    Create a tracer with WebSocket streaming enabled.

    Args:
        log_path: Path for JSONL file logging
        ws_host: WebSocket server host
        ws_port: WebSocket server port
        auto_start: Automatically start the server

    Returns:
        Tuple of (tracer, server)

    Usage:
        tracer, server = create_streaming_tracer()

        # Use tracer for logging
        tracer.log_trace({"model": "gpt-4", ...})

        # Stop when done
        server.stop()
    """
    server = WebSocketTraceServer(host=ws_host, port=ws_port)

    if auto_start:
        server.start()

    tracer = WebSocketTracer(log_path=log_path, ws_server=server)

    return tracer, server
