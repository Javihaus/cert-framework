'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  latencyByModel: Array<{
    model: string;
    p50: number;
    p95: number;
    calls: number;
  }>;
  latencyTrend: Array<{
    date: string;
    p50: number;
    p95: number;
  }>;
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/operational/performance?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        // Load from localStorage or show empty state
        const stored = localStorage.getItem('cert-performance-metrics');
        if (stored) {
          setMetrics(JSON.parse(stored));
        } else {
          setMetrics(null);
        }
      }
    } catch (e) {
      const stored = localStorage.getItem('cert-performance-metrics');
      if (stored) {
        setMetrics(JSON.parse(stored));
      }
    }
    setLoading(false);
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getLatencyStatus = (p95: number) => {
    if (p95 < 3000) return { label: 'Excellent', color: 'emerald' };
    if (p95 < 10000) return { label: 'Good', color: 'blue' };
    if (p95 < 30000) return { label: 'Acceptable', color: 'amber' };
    return { label: 'Slow', color: 'red' };
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
            <Activity className="w-7 h-7 text-teal-500" />
            Performance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Latency metrics and throughput monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          >
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={loadMetrics}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!metrics ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No performance data yet
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Performance metrics will appear here once you start collecting traces from your LLM calls.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">P50 Latency</span>
                <Clock className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {formatLatency(metrics.p50Latency)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Median response time
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">P95 Latency</span>
                {(() => {
                  const status = getLatencyStatus(metrics.p95Latency);
                  return (
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        status.color === 'emerald' && "text-emerald-600",
                        status.color === 'blue' && "text-blue-600",
                        status.color === 'amber' && "text-amber-600",
                        status.color === 'red' && "text-red-600"
                      )}
                    >
                      {metrics.p95Latency < 30000 ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {status.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {formatLatency(metrics.p95Latency)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Target: &lt; 30s
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Throughput</span>
                <Zap className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {metrics.throughput.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                requests/hour
              </p>
            </div>
          </div>

          {/* Latency Distribution */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">
              Latency Distribution
            </h2>
            <div className="h-32 flex items-end justify-center gap-1">
              {/* Simple bar chart visualization */}
              {Array.from({ length: 20 }).map((_, i) => {
                const height = Math.max(10, Math.random() * 100);
                return (
                  <div
                    key={i}
                    className="w-4 bg-teal-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span>0s</span>
              <span className="text-center">
                P50: {formatLatency(metrics.p50Latency)} | P95: {formatLatency(metrics.p95Latency)} | P99: {formatLatency(metrics.p99Latency)}
              </span>
              <span>10s</span>
            </div>
          </div>

          {/* Latency by Model */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                Latency by Model
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      P50
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      P95
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Calls
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {metrics.latencyByModel.map((model) => (
                    <tr key={model.model}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                        {model.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {formatLatency(model.p50)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {formatLatency(model.p95)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {model.calls.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latency Trend */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">
              Latency Trend (Last 7 Days)
            </h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {metrics.latencyTrend.map((point, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-1">
                    <div
                      className="w-full bg-teal-500 rounded-t"
                      style={{ height: `${(point.p95 / 5000) * 100}px` }}
                      title={`P95: ${formatLatency(point.p95)}`}
                    />
                    <div
                      className="w-full bg-teal-300 rounded-t"
                      style={{ height: `${(point.p50 / 5000) * 100}px` }}
                      title={`P50: ${formatLatency(point.p50)}`}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {point.date}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-300 rounded" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">P50</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">P95</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
