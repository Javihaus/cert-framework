'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  Play,
  Pause,
  Cpu,
  Signal,
} from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';

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

export default function MonitoringPage() {
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

  const addTrace = useCallback(() => {
    const newTrace = generateMockTrace();
    setTraces((prev) => [newTrace, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (traces.length === 0) return;

    const completedTraces = traces.filter((t) => t.status !== 'pending');
    const errorTraces = traces.filter((t) => t.status === 'error');

    setMetrics({
      totalTraces: traces.length,
      avgLatency: completedTraces.length > 0
        ? Math.round(completedTraces.reduce((acc, t) => acc + t.latency, 0) / completedTraces.length)
        : 0,
      errorRate: traces.length > 0 ? parseFloat(((errorTraces.length / traces.length) * 100).toFixed(1)) : 0,
      throughput: Math.round(traces.length / ((Date.now() - traces[traces.length - 1]?.timestamp.getTime()) / 60000) || 0),
    });
  }, [traces]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      addTrace();
    }, Math.random() * 2000 + 500);
    return () => clearInterval(interval);
  }, [isLive, addTrace]);

  useEffect(() => {
    const initialTraces = Array.from({ length: 10 }, () => generateMockTrace());
    setTraces(initialTraces);
  }, []);

  const filteredTraces = traces.filter((trace) => {
    if (filter !== 'all' && trace.status !== filter) return false;
    if (searchQuery && !trace.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trace.provider.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !trace.model.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading text-midnight dark:text-white">Live Monitoring</h1>
          <p className="text-body text-porpoise mt-1">Real-time LLM trace monitoring and analysis</p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`btn ${isLive ? 'bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-400' : 'btn-secondary'}`}
        >
          {isLive ? (
            <>
              <Pause className="w-4 h-4" />
              Live
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
              </span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Paused
            </>
          )}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-planetarium/20 rounded-lg">
              <Zap className="w-5 h-5 text-planetarium" />
            </div>
            <div>
              <div className="metric-value">{metrics.totalTraces}</div>
              <div className="metric-label">Total Traces</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="metric-value">{metrics.avgLatency}ms</div>
              <div className="metric-label">Avg Latency</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error-50 dark:bg-error-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-error-600" />
            </div>
            <div>
              <div className="metric-value">{metrics.errorRate}%</div>
              <div className="metric-label">Error Rate</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-50 dark:bg-success-500/20 rounded-lg">
              <Signal className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <div className="metric-value">{metrics.throughput}/min</div>
              <div className="metric-label">Throughput</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-porpoise" />
            <input
              type="text"
              placeholder="Search by endpoint, provider, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-porpoise" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="select pl-10"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Traces Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h3 className="text-title text-midnight dark:text-white">
            Live Traces
            <span className="ml-2 text-sm font-normal text-porpoise">
              ({filteredTraces.length} traces)
            </span>
          </h3>
        </div>

        <div className="table-container max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="table">
            <thead className="sticky top-0 bg-gray-50 dark:bg-midnight z-10">
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Provider / Model</th>
                <th>Endpoint</th>
                <th>Latency</th>
                <th>Tokens</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraces.map((trace, index) => (
                <tr
                  key={trace.id}
                  className={index === 0 && isLive ? 'animate-fade-in' : ''}
                >
                  <td className="font-mono text-sm text-porpoise">
                    {formatTime(trace.timestamp)}
                  </td>
                  <td>
                    {trace.status === 'success' && (
                      <span className="badge badge-success">
                        <CheckCircle className="w-3 h-3" />
                        success
                      </span>
                    )}
                    {trace.status === 'error' && (
                      <span className="badge badge-error">
                        <XCircle className="w-3 h-3" />
                        error
                      </span>
                    )}
                    {trace.status === 'pending' && (
                      <span className="badge badge-warning">
                        <CircularProgress size={12} sx={{ color: '#F59E0B' }} />
                        pending
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-porpoise" />
                      <span className="text-midnight dark:text-white">{trace.provider}</span>
                      <span className="text-porpoise">/ {trace.model}</span>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-porpoise">{trace.endpoint}</td>
                  <td>
                    {trace.status === 'pending' ? (
                      <span className="text-porpoise">...</span>
                    ) : (
                      <span className={
                        trace.latency > 1000 ? 'text-error-600' :
                        trace.latency > 500 ? 'text-warning-600' : 'text-success-600'
                      }>
                        {trace.latency}ms
                      </span>
                    )}
                  </td>
                  <td className="text-porpoise">{trace.tokens.toLocaleString()}</td>
                  <td className="text-porpoise">{trace.cost.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTraces.length === 0 && (
          <div className="p-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-title text-midnight dark:text-white mb-2">No traces found</h3>
            <p className="text-porpoise">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Traces will appear here when your AI systems make API calls'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
