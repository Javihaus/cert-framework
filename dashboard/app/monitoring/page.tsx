'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
  CpuChipIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

// Types
interface Trace {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  status: 'success' | 'error' | 'pending';
  latency: number;
  tokens: number;
  cost: number;
  endpoint: string;
}

// Mock trace generator
const generateMockTrace = (): Trace => {
  const providers = ['OpenAI', 'Anthropic', 'AWS Bedrock', 'Google AI'];
  const models = ['GPT-4o', 'Claude 3.5', 'Titan', 'Gemini Pro'];
  const endpoints = ['/api/chat', '/api/analyze', '/api/summarize', '/api/classify'];
  const statuses: Trace['status'][] = ['success', 'success', 'success', 'success', 'error', 'pending'];

  const providerIndex = Math.floor(Math.random() * providers.length);
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    provider: providers[providerIndex],
    model: models[providerIndex],
    status,
    latency: status === 'pending' ? 0 : Math.floor(Math.random() * 2000) + 100,
    tokens: Math.floor(Math.random() * 5000) + 100,
    cost: parseFloat((Math.random() * 0.1).toFixed(4)),
    endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
  };
};

export default function MonitoringDashboard() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    totalTraces: 0,
    avgLatency: 0,
    errorRate: 0,
    throughput: 0,
  });

  // Add new traces
  const addTrace = useCallback(() => {
    const newTrace = generateMockTrace();
    setTraces((prev) => {
      const updated = [newTrace, ...prev].slice(0, 50); // Keep last 50 traces
      return updated;
    });
  }, []);

  // Calculate metrics
  useEffect(() => {
    if (traces.length === 0) return;

    const completedTraces = traces.filter((t) => t.status !== 'pending');
    const errorTraces = traces.filter((t) => t.status === 'error');

    setMetrics({
      totalTraces: traces.length,
      avgLatency:
        completedTraces.length > 0
          ? Math.round(completedTraces.reduce((acc, t) => acc + t.latency, 0) / completedTraces.length)
          : 0,
      errorRate: traces.length > 0 ? parseFloat(((errorTraces.length / traces.length) * 100).toFixed(1)) : 0,
      throughput: Math.round(traces.length / ((Date.now() - traces[traces.length - 1]?.timestamp.getTime()) / 60000) || 0),
    });
  }, [traces]);

  // Live trace simulation
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      addTrace();
    }, Math.random() * 2000 + 500); // Random interval between 0.5-2.5 seconds

    return () => clearInterval(interval);
  }, [isLive, addTrace]);

  // Initialize with some traces
  useEffect(() => {
    const initialTraces = Array.from({ length: 10 }, () => generateMockTrace());
    setTraces(initialTraces);
  }, []);

  // Filter traces
  const filteredTraces = traces.filter((trace) => {
    if (filter !== 'all' && trace.status !== filter) return false;
    if (searchQuery && !trace.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trace.provider.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trace.model.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status: Trace['status']) => {
    switch (status) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'pending':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
    }
  };

  const getStatusIcon = (status: Trace['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Live Monitoring
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Real-time LLM trace monitoring and analysis
            </p>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isLive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {isLive ? (
              <>
                <PauseIcon className="h-5 w-5" />
                Live
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                Paused
              </>
            )}
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BoltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalTraces}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Traces</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.avgLatency}ms
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg Latency</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.errorRate}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <SignalIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.throughput}/min
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Throughput</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by endpoint, provider, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field pl-10 pr-10 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Traces Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Live Traces
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredTraces.length} traces)
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Provider / Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Latency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTraces.map((trace, index) => (
                  <tr
                    key={trace.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                      index === 0 && isLive ? 'animate-fade-in' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {formatTime(trace.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          trace.status
                        )}`}
                      >
                        {getStatusIcon(trace.status)}
                        {trace.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CpuChipIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {trace.provider}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          / {trace.model}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {trace.endpoint}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {trace.status === 'pending' ? (
                        <span className="text-gray-400">...</span>
                      ) : (
                        <span
                          className={
                            trace.latency > 1000
                              ? 'text-red-600 dark:text-red-400'
                              : trace.latency > 500
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {trace.latency}ms
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {trace.tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      €{trace.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTraces.length === 0 && (
            <div className="p-12 text-center">
              <BoltIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No traces found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || filter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Traces will appear here when your AI systems make API calls'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
