'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Trace } from '@/types/trace';

interface HealthMetrics {
  successRate: number;
  errorRate: number;
  totalTraces: number;
  errors: {
    type: string;
    count: number;
    lastOccurred: string;
  }[];
  providerStatus: {
    provider: string;
    status: 'operational' | 'degraded' | 'down';
    latency: number;
    errorCount: number;
  }[];
}

export default function ObservabilityPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/operational/observability?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setTraces(data.traces || []);
        setMetrics(data.metrics);
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('cert-traces');
        if (stored) {
          const parsedTraces: Trace[] = JSON.parse(stored);
          setTraces(parsedTraces);
          calculateMetrics(parsedTraces);
        }
      }
    } catch (e) {
      const stored = localStorage.getItem('cert-traces');
      if (stored) {
        const parsedTraces: Trace[] = JSON.parse(stored);
        setTraces(parsedTraces);
        calculateMetrics(parsedTraces);
      }
    }
    setLoading(false);
  };

  const calculateMetrics = (allTraces: Trace[]) => {
    const errorTraces = allTraces.filter((t) => t.metadata?.error);
    const successTraces = allTraces.filter((t) => !t.metadata?.error);

    // Group errors by type
    const errorsByType: Record<string, { count: number; lastOccurred: string }> = {};
    errorTraces.forEach((t) => {
      const errorType = t.metadata?.error?.type || 'Unknown';
      if (!errorsByType[errorType]) {
        errorsByType[errorType] = { count: 0, lastOccurred: t.timestamp };
      }
      errorsByType[errorType].count++;
      if (t.timestamp > errorsByType[errorType].lastOccurred) {
        errorsByType[errorType].lastOccurred = t.timestamp;
      }
    });

    // Calculate provider status
    const providerGroups: Record<string, Trace[]> = {};
    allTraces.forEach((t) => {
      const provider = t.platform || 'unknown';
      if (!providerGroups[provider]) {
        providerGroups[provider] = [];
      }
      providerGroups[provider].push(t);
    });

    const providerStatus = Object.entries(providerGroups).map(([provider, traces]) => {
      const errorCount = traces.filter((t) => t.metadata?.error).length;
      const avgLatency =
        traces.reduce((sum, t) => sum + (t.metadata?.latency_ms || 0), 0) / traces.length;
      const errorRate = traces.length > 0 ? errorCount / traces.length : 0;

      return {
        provider,
        status: errorRate > 0.1 ? 'degraded' : 'operational' as const,
        latency: avgLatency,
        errorCount,
      };
    });

    setMetrics({
      successRate: allTraces.length > 0 ? (successTraces.length / allTraces.length) * 100 : 0,
      errorRate: allTraces.length > 0 ? (errorTraces.length / allTraces.length) * 100 : 0,
      totalTraces: allTraces.length,
      errors: Object.entries(errorsByType).map(([type, data]) => ({
        type,
        count: data.count,
        lastOccurred: data.lastOccurred,
      })),
      providerStatus,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let parsed: Trace[];

        if (file.name.endsWith('.jsonl')) {
          parsed = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line));
        } else {
          const data = JSON.parse(content);
          parsed = Array.isArray(data) ? data : [data];
        }

        setTraces(parsed);
        localStorage.setItem('cert-traces', JSON.stringify(parsed));
        calculateMetrics(parsed);
      } catch (e) {
        console.error('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

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
            <BarChart3 className="w-7 h-7 text-orange-500" />
            Observability
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Error rates, traces, and system monitoring
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
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          >
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
            <Upload className="w-4 h-4" />
            Upload
            <input
              type="file"
              accept=".json,.jsonl"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={loadMetrics}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!metrics || traces.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No observability data
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Upload trace files to monitor error rates and system health.
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg cursor-pointer hover:bg-orange-700 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Trace File
            <input
              type="file"
              accept=".json,.jsonl"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <>
          {/* Health Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Success Rate</span>
                {metrics.successRate >= 95 ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    Good
                  </span>
                ) : metrics.successRate >= 90 ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Warning
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <XCircle className="w-3 h-3" />
                    Critical
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {metrics.successRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Error Rate</span>
                {metrics.errorRate < 5 ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    &lt; 5%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    High
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {metrics.errorRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Traces</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {metrics.totalTraces.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Collected
              </p>
            </div>
          </div>

          {/* Error Breakdown */}
          {metrics.errors.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Error Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Error Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Last Occurred
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {metrics.errors.map((error) => (
                      <tr key={error.type}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                          {error.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {error.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {formatTimeAgo(error.lastOccurred)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trace Log */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Recent Traces</h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing last 50
              </span>
            </div>
            <div className="overflow-x-auto max-h-96">
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Latency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {traces
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 50)
                    .map((trace, i) => (
                      <tr key={i}>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {formatTime(trace.timestamp)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-white capitalize">
                          {trace.platform}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {trace.model}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {trace.metadata?.error ? (
                            <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" />
                              Error
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                              200
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {trace.metadata?.latency_ms
                            ? `${(trace.metadata.latency_ms / 1000).toFixed(1)}s`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Provider Status */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Provider Status</h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {metrics.providerStatus.map((provider) => (
                <div
                  key={provider.provider}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        provider.status === 'operational' && "bg-emerald-500",
                        provider.status === 'degraded' && "bg-amber-500",
                        provider.status === 'down' && "bg-red-500"
                      )}
                    />
                    <span className="font-medium text-zinc-900 dark:text-white capitalize">
                      {provider.provider}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        provider.status === 'operational' &&
                          "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                        provider.status === 'degraded' &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                        provider.status === 'down' &&
                          "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                      )}
                    >
                      {provider.status === 'operational'
                        ? 'Operational'
                        : provider.status === 'degraded'
                        ? 'Degraded'
                        : 'Down'}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>
                      Latency: {(provider.latency / 1000).toFixed(1)}s
                    </span>
                    <span>
                      Errors: {provider.errorCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
