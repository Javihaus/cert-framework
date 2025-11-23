/**
 * WebSocket Hook for Real-Time Trace Streaming
 *
 * Connects to CERT's WebSocket server for live trace updates.
 *
 * Usage:
 *   const { traces, metrics, isConnected, error } = useTraceStream({
 *     url: 'ws://localhost:8765',
 *     onTrace: (trace) => console.log('New trace:', trace),
 *   });
 *
 * Server setup (Python):
 *   from cert.observability.websocket import WebSocketTraceServer
 *   server = WebSocketTraceServer(host="localhost", port=8765)
 *   server.start()
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types for trace events
export interface TraceEvent {
  event_type: 'trace' | 'metric' | 'alert' | 'heartbeat' | 'connected' | 'pong';
  timestamp: string;
  data: Record<string, any>;
  source: string;
}

export interface Trace {
  timestamp: string;
  platform: string;
  model: string;
  input_preview?: string;
  output_preview?: string;
  latency_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  status: string;
  error?: string;
}

export interface StreamMetrics {
  totalTraces: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  totalTokens: number;
  errorCount: number;
  tracesPerSecond: number;
}

export interface UseTraceStreamOptions {
  /** WebSocket server URL (e.g., 'ws://localhost:8765') */
  url: string;
  /** Maximum number of traces to keep in memory */
  maxTraces?: number;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Callback for new traces */
  onTrace?: (trace: Trace) => void;
  /** Callback for alerts */
  onAlert?: (alert: { type: string; message: string; severity: string }) => void;
  /** Callback for connection status changes */
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseTraceStreamResult {
  /** List of received traces (newest first) */
  traces: Trace[];
  /** Aggregated metrics */
  metrics: StreamMetrics;
  /** Whether connected to the server */
  isConnected: boolean;
  /** Connection error if any */
  error: string | null;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Clear all traces */
  clearTraces: () => void;
}

export function useTraceStream(options: UseTraceStreamOptions): UseTraceStreamResult {
  const {
    url,
    maxTraces = 1000,
    autoReconnect = true,
    reconnectInterval = 5000,
    onTrace,
    onAlert,
    onConnectionChange,
  } = options;

  const [traces, setTraces] = useState<Trace[]>([]);
  const [metrics, setMetrics] = useState<StreamMetrics>({
    totalTraces: 0,
    totalLatencyMs: 0,
    avgLatencyMs: 0,
    totalTokens: 0,
    errorCount: 0,
    tracesPerSecond: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const traceCountRef = useRef(0);
  const lastTraceTimeRef = useRef(Date.now());

  // Calculate traces per second
  const updateTracesPerSecond = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - lastTraceTimeRef.current) / 1000;
    if (elapsed > 0) {
      setMetrics(prev => ({
        ...prev,
        tracesPerSecond: Math.round((traceCountRef.current / elapsed) * 10) / 10,
      }));
    }
    traceCountRef.current = 0;
    lastTraceTimeRef.current = now;
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: TraceEvent = JSON.parse(event.data);

      switch (data.event_type) {
        case 'trace':
          const trace = data.data as Trace;

          // Update traces list
          setTraces(prev => {
            const newTraces = [trace, ...prev];
            return newTraces.slice(0, maxTraces);
          });

          // Update metrics
          setMetrics(prev => {
            const totalTraces = prev.totalTraces + 1;
            const totalLatencyMs = prev.totalLatencyMs + (trace.latency_ms || 0);
            const tokens = (trace.input_tokens || 0) + (trace.output_tokens || 0);

            return {
              totalTraces,
              totalLatencyMs,
              avgLatencyMs: Math.round(totalLatencyMs / totalTraces),
              totalTokens: prev.totalTokens + tokens,
              errorCount: prev.errorCount + (trace.status === 'error' ? 1 : 0),
              tracesPerSecond: prev.tracesPerSecond,
            };
          });

          traceCountRef.current++;
          onTrace?.(trace);
          break;

        case 'alert':
          onAlert?.({
            type: data.data.alert_type,
            message: data.data.message,
            severity: data.data.severity,
          });
          break;

        case 'connected':
          console.log('Connected to CERT trace stream');
          break;

        case 'heartbeat':
          // Heartbeat received, connection is healthy
          break;

        case 'pong':
          // Pong response to our ping
          break;
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [maxTraces, onTrace, onAlert]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        onConnectionChange?.(true);
        console.log('WebSocket connected to:', url);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        onConnectionChange?.(false);
        console.log('WebSocket disconnected');

        // Auto-reconnect
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (event) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', event);
      };

      wsRef.current.onmessage = handleMessage;
    } catch (err) {
      setError(`Failed to connect: ${err}`);
      console.error('WebSocket connection failed:', err);
    }
  }, [url, autoReconnect, reconnectInterval, handleMessage, onConnectionChange]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Clear traces
  const clearTraces = useCallback(() => {
    setTraces([]);
    setMetrics({
      totalTraces: 0,
      totalLatencyMs: 0,
      avgLatencyMs: 0,
      totalTokens: 0,
      errorCount: 0,
      tracesPerSecond: 0,
    });
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    // Update traces per second every second
    const interval = setInterval(updateTracesPerSecond, 1000);

    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, [connect, disconnect, updateTracesPerSecond]);

  return {
    traces,
    metrics,
    isConnected,
    error,
    connect,
    disconnect,
    clearTraces,
  };
}

export default useTraceStream;
