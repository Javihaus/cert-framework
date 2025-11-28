'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
  Upload,
  Copy,
  Check,
  Zap,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LLMData {
  vendor: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  input?: string;
  output?: string;
  temperature?: number;
}

interface CERTTrace {
  id: string;
  traceId: string;
  spanId: string;
  name: string;
  kind: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: 'ok' | 'error' | 'unset';
  llm?: LLMData;
  receivedAt: string;
  source: 'otlp' | 'sdk' | 'manual';
}

interface TraceStats {
  total: number;
  llmTraces: number;
  evaluated: number;
  byStatus: {
    pass: number;
    fail: number;
    review: number;
  };
  byVendor: Record<string, number>;
  totalTokens: number;
}

interface TraceResponse {
  traces: CERTTrace[];
  stats: TraceStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function ObservabilityPage() {
  const [traces, setTraces] = useState<CERTTrace[]>([]);
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showIntegration, setShowIntegration] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadTraces = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/traces?llm_only=true&limit=100');
      if (response.ok) {
        const data: TraceResponse = await response.json();
        setTraces(data.traces);
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load traces:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTraces();
  }, [loadTraces]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadTraces, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadTraces]);

  const clearTraces = async () => {
    try {
      await fetch('/api/v1/traces', { method: 'DELETE' });
      setTraces([]);
      setStats(null);
    } catch (e) {
      console.error('Failed to clear traces:', e);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const integrationCode = `# Install OpenLLMetry
pip install traceloop-sdk openai anthropic

# In your Python code:
import os
from traceloop.sdk import Traceloop

# Point to your CERT dashboard
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/v1/traces"

# Initialize - instruments ALL LLM calls automatically
Traceloop.init(app_name="my-app", disable_batch=True)

# Now all your LLM calls are traced!
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
# → Trace automatically sent to CERT`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#10069F] dark:text-[#9fc2e9]" />
            Observability
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Live traces from your LLM applications via OpenLLMetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => setShowIntegration(!showIntegration)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              showIntegration
                ? "bg-[#10069F] text-white"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            )}
          >
            <Server className="w-4 h-4" />
            Integration
          </button>
          <button
            onClick={loadTraces}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Integration Panel */}
      {showIntegration && (
        <div className="bg-zinc-900 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#10069F] dark:text-[#9fc2e9]" />
              <h2 className="font-semibold">Connect Your Application</h2>
            </div>
            <button
              onClick={() => copyCode(integrationCode)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-sm text-zinc-300 overflow-x-auto">
            <code>{integrationCode}</code>
          </pre>
          <p className="mt-4 text-sm text-zinc-400">
            Works with: OpenAI, Anthropic, Cohere, Gemini, Mistral, LangChain, LlamaIndex, and more.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Traces</span>
            <Activity className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {stats?.total || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">LLM Calls</span>
            <Zap className="w-4 h-4 text-[#10069F] dark:text-[#9fc2e9]" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {stats?.llmTraces || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Tokens</span>
            <BarChart3 className="w-4 h-4 text-[#10069F] dark:text-[#9fc2e9]" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {(stats?.totalTokens || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Providers</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats?.byVendor || {}).map(([vendor, count]) => (
              <span
                key={vendor}
                className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-full"
              >
                {vendor}: {count}
              </span>
            ))}
            {Object.keys(stats?.byVendor || {}).length === 0 && (
              <span className="text-zinc-400 text-sm">None yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Live Traces */}
      {traces.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-[#10069F]/10 dark:bg-[#10069F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-[#10069F] dark:text-[#7ea0bf]" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Waiting for traces...
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Connect your application using OpenLLMetry to see live LLM traces here.
          </p>
          <button
            onClick={() => setShowIntegration(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#10069F] text-white rounded-lg hover:bg-[#10069F]/90 transition-colors"
          >
            <Server className="w-4 h-4" />
            View Integration Code
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Live Traces</h2>
              {autoRefresh && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <button
              onClick={clearTraces}
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Latency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {formatTime(trace.receivedAt)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-white capitalize">
                      {trace.llm?.vendor || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {trace.llm?.model || trace.name}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {trace.llm?.totalTokens?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {trace.durationMs > 0 ? `${(trace.durationMs / 1000).toFixed(2)}s` : '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {trace.status === 'error' ? (
                        <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                          <XCircle className="w-4 h-4" />
                          Error
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4" />
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        trace.source === 'otlp' && "bg-[#10069F]/10 text-[#10069F] dark:bg-[#10069F]/20 dark:text-[#7ea0bf]",
                        trace.source === 'sdk' && "bg-[#10069F]/10 text-[#10069F] dark:bg-[#10069F]/20 dark:text-[#7ea0bf]",
                        trace.source === 'manual' && "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                      )}>
                        {trace.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
