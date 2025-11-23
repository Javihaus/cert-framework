'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Euro,
  Heart,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Zap,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  Cpu,
  Settings,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// API base URL - configurable for different environments
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for metrics
interface CostMetric {
  value: number;
  trend: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_display: string;
  currency: string;
  by_model: Record<string, number>;
  by_platform: Record<string, number>;
  daily_average: number;
  monthly_projection: number;
  budget: number | null;
  budget_utilization: number | null;
  time_window: string;
  trace_count: number;
}

interface HealthMetric {
  value: number;
  trend: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_display: string;
  status: 'healthy' | 'degraded' | 'critical';
  error_rate: number;
  p95_latency: number;
  latency_penalty: number;
  sla_compliance: number;
  total_requests: number;
  error_count: number;
  slow_request_count: number;
  issues: string[];
  time_window: string;
}

interface QualityMetric {
  value: number;
  trend: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_display: string;
  method: string;
  method_display: string;
  accuracy_rate: number;
  consistency_score: number;
  evaluated_count: number;
  passed_count: number;
  failed_count: number;
  by_model: Record<string, number>;
  time_window: string;
}

interface MetricsSnapshot {
  cost: CostMetric;
  health: HealthMetric;
  quality: QualityMetric;
  timestamp: string;
  time_window: string;
}

// Time window options
const TIME_WINDOWS = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

// Trend icon component
function TrendIcon({ direction, className }: { direction: string; className?: string }) {
  if (direction === 'up') return <TrendingUp className={className || 'w-3 h-3'} />;
  if (direction === 'down') return <TrendingDown className={className || 'w-3 h-3'} />;
  return <Minus className={className || 'w-3 h-3'} />;
}

// Primary metric card component
function PrimaryMetricCard({
  title,
  value,
  trend,
  trendDirection,
  icon: Icon,
  subtitle,
  status,
  colorClass,
  onClick,
}: {
  title: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  subtitle: string;
  status?: 'healthy' | 'degraded' | 'critical';
  colorClass: string;
  onClick?: () => void;
}) {
  // For cost, down is good. For health/quality, up is good
  const isPositiveTrend = title === 'Cost'
    ? trendDirection === 'down'
    : trendDirection === 'up';

  const trendColorClass = trendDirection === 'stable'
    ? 'text-porpoise'
    : isPositiveTrend
      ? 'text-success-600'
      : 'text-error-600';

  return (
    <div
      className={`card p-6 cursor-pointer hover:shadow-lg transition-all duration-200 ${onClick ? 'hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {status && (
          <span className={`badge ${
            status === 'healthy' ? 'badge-success' :
            status === 'degraded' ? 'badge-warning' : 'badge-error'
          }`}>
            {status === 'healthy' && <CheckCircle className="w-3 h-3" />}
            {status === 'degraded' && <AlertTriangle className="w-3 h-3" />}
            {status === 'critical' && <XCircle className="w-3 h-3" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
        {!status && (
          <span className={`flex items-center gap-1 text-sm font-medium ${trendColorClass}`}>
            <TrendIcon direction={trendDirection} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-midnight dark:text-white mb-1">
        {value}
      </div>
      <div className="text-sm text-porpoise">{title}</div>
      <div className="text-xs text-porpoise/70 mt-2">{subtitle}</div>
      {status && (
        <div className={`flex items-center gap-1 text-sm font-medium mt-3 ${trendColorClass}`}>
          <TrendIcon direction={trendDirection} />
          {trend}
        </div>
      )}
    </div>
  );
}

// Detail section for breakdown
function BreakdownSection({
  title,
  data,
  formatValue
}: {
  title: string;
  data: Record<string, number>;
  formatValue: (v: number) => string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-midnight dark:text-white">{title}</h4>
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between text-sm">
          <span className="text-porpoise truncate max-w-[60%]">{key}</span>
          <div className="flex items-center gap-2">
            <div className="w-20 progress-bar h-1.5">
              <div
                className="progress-fill primary"
                style={{ width: `${(value / total) * 100}%` }}
              />
            </div>
            <span className="text-midnight dark:text-white font-medium w-16 text-right">
              {formatValue(value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState('week');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/metrics?time_window=${timeWindow}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      // Use mock data for demo/development
      setMetrics(getMockMetrics());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Mock data for development/demo
  function getMockMetrics(): MetricsSnapshot {
    return {
      cost: {
        value: 2847.32,
        trend: -12.3,
        trend_direction: 'down',
        trend_display: '-12.3%',
        currency: 'EUR',
        by_model: {
          'gpt-4': 1420.50,
          'claude-3': 890.22,
          'gpt-3.5-turbo': 536.60,
        },
        by_platform: {
          'openai': 1957.10,
          'anthropic': 890.22,
        },
        daily_average: 406.76,
        monthly_projection: 12202.80,
        budget: 5000,
        budget_utilization: 56.9,
        time_window: 'week',
        trace_count: 1247,
      },
      health: {
        value: 98.2,
        trend: 0.8,
        trend_direction: 'up',
        trend_display: '+0.8%',
        status: 'healthy',
        error_rate: 0.3,
        p95_latency: 234,
        latency_penalty: 1.5,
        sla_compliance: 99.1,
        total_requests: 1247,
        error_count: 4,
        slow_request_count: 19,
        issues: [],
        time_window: 'week',
      },
      quality: {
        value: 94.1,
        trend: -2.1,
        trend_direction: 'down',
        trend_display: '-2.1%',
        method: 'semantic_consistency',
        method_display: 'Semantic consistency',
        accuracy_rate: 94.1,
        consistency_score: 91.3,
        evaluated_count: 1089,
        passed_count: 1024,
        failed_count: 65,
        by_model: {
          'gpt-4': 96.2,
          'claude-3': 93.8,
          'gpt-3.5-turbo': 89.4,
        },
        time_window: 'week',
      },
      timestamp: new Date().toISOString(),
      time_window: 'week',
    };
  }

  const timeWindowLabel = TIME_WINDOWS.find(tw => tw.value === timeWindow)?.label || 'This Week';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with time controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading text-midnight dark:text-white">System Metrics</h1>
          <p className="text-body text-porpoise mt-1">
            {timeWindowLabel} overview of your AI system performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-midnight border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-planetarium"
          >
            {TIME_WINDOWS.map((tw) => (
              <option key={tw.value} value={tw.value}>{tw.label}</option>
            ))}
          </select>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2 bg-white dark:bg-midnight border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-porpoise ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/settings"
            className="p-2 bg-white dark:bg-midnight border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5 text-porpoise" />
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <div>
              <span className="text-sm font-medium text-warning-800 dark:text-warning-200">
                Using demo data - {error}
              </span>
              <p className="text-xs text-warning-600 dark:text-warning-300 mt-1">
                Connect to the API server to see real metrics
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics - The Three Numbers */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cost Metric */}
          <PrimaryMetricCard
            title="Cost"
            value={`${metrics.cost.currency}${metrics.cost.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            trend={metrics.cost.trend_display}
            trendDirection={metrics.cost.trend_direction}
            icon={Euro}
            subtitle={`${timeWindowLabel} • ${metrics.cost.trace_count.toLocaleString()} requests`}
            colorClass="bg-success-50 dark:bg-success-500/20 text-success-600"
          />

          {/* Health Metric */}
          <PrimaryMetricCard
            title="Health"
            value={`${metrics.health.value.toFixed(1)}%`}
            trend={metrics.health.trend_display}
            trendDirection={metrics.health.trend_direction}
            icon={Heart}
            subtitle={`${metrics.health.error_rate.toFixed(2)}% errors • ${Math.round(metrics.health.p95_latency)}ms p95`}
            status={metrics.health.status}
            colorClass="bg-error-50 dark:bg-error-500/20 text-error-600"
          />

          {/* Quality Metric */}
          <PrimaryMetricCard
            title="Quality"
            value={`${metrics.quality.value.toFixed(1)}%`}
            trend={metrics.quality.trend_display}
            trendDirection={metrics.quality.trend_direction}
            icon={Sparkles}
            subtitle={metrics.quality.method_display}
            colorClass="bg-purple-50 dark:bg-purple-500/20 text-purple-600"
          />
        </div>
      )}

      {/* Detail Panels */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Details */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title text-midnight dark:text-white">Cost Breakdown</h3>
              <Link href="/costs" className="text-sm text-planetarium hover:underline flex items-center gap-1">
                Details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
                <div>
                  <div className="text-xs text-porpoise mb-1">Daily Average</div>
                  <div className="text-lg font-semibold text-midnight dark:text-white">
                    {metrics.cost.currency}{metrics.cost.daily_average.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-porpoise mb-1">Monthly Projection</div>
                  <div className="text-lg font-semibold text-midnight dark:text-white">
                    {metrics.cost.currency}{metrics.cost.monthly_projection.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <BreakdownSection
                title="By Model"
                data={metrics.cost.by_model}
                formatValue={(v) => `${metrics.cost.currency}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              />
              {metrics.cost.budget && (
                <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-porpoise">Budget</span>
                    <span className="text-midnight dark:text-white font-medium">
                      {metrics.cost.budget_utilization?.toFixed(1)}% used
                    </span>
                  </div>
                  <div className="progress-bar h-2">
                    <div
                      className={`progress-fill ${
                        (metrics.cost.budget_utilization || 0) > 90 ? 'error' :
                        (metrics.cost.budget_utilization || 0) > 75 ? 'warning' : 'success'
                      }`}
                      style={{ width: `${Math.min(100, metrics.cost.budget_utilization || 0)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health Details */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title text-midnight dark:text-white">Health Details</h3>
              <Link href="/monitoring" className="text-sm text-planetarium hover:underline flex items-center gap-1">
                Details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
                <div>
                  <div className="text-xs text-porpoise mb-1">Total Requests</div>
                  <div className="text-lg font-semibold text-midnight dark:text-white">
                    {metrics.health.total_requests.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-porpoise mb-1">SLA Compliance</div>
                  <div className="text-lg font-semibold text-midnight dark:text-white">
                    {metrics.health.sla_compliance.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-error-500" />
                    <span className="text-sm text-porpoise">Errors</span>
                  </div>
                  <span className="text-sm font-medium text-midnight dark:text-white">
                    {metrics.health.error_count} ({metrics.health.error_rate.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning-500" />
                    <span className="text-sm text-porpoise">Slow Requests</span>
                  </div>
                  <span className="text-sm font-medium text-midnight dark:text-white">
                    {metrics.health.slow_request_count} ({metrics.health.latency_penalty.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-porpoise" />
                    <span className="text-sm text-porpoise">P95 Latency</span>
                  </div>
                  <span className="text-sm font-medium text-midnight dark:text-white">
                    {Math.round(metrics.health.p95_latency)}ms
                  </span>
                </div>
              </div>
              {metrics.health.issues.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                  <div className="text-xs text-porpoise mb-2">Active Issues</div>
                  <div className="space-y-2">
                    {metrics.health.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />
                        <span className="text-porpoise">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quality Details */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title text-midnight dark:text-white">Quality Details</h3>
              <Link href="/analytics" className="text-sm text-planetarium hover:underline flex items-center gap-1">
                Details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 dark:border-white/10">
                <div>
                  <div className="text-xs text-porpoise mb-1">Evaluated</div>
                  <div className="text-lg font-semibold text-midnight dark:text-white">
                    {metrics.quality.evaluated_count.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-porpoise mb-1">Pass Rate</div>
                  <div className="text-lg font-semibold text-midnight dark:text-white">
                    {metrics.quality.accuracy_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <span className="text-sm text-porpoise">Passed</span>
                  </div>
                  <span className="text-sm font-medium text-midnight dark:text-white">
                    {metrics.quality.passed_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-error-500" />
                    <span className="text-sm text-porpoise">Failed</span>
                  </div>
                  <span className="text-sm font-medium text-midnight dark:text-white">
                    {metrics.quality.failed_count.toLocaleString()}
                  </span>
                </div>
              </div>
              <BreakdownSection
                title="By Model"
                data={metrics.quality.by_model}
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/monitoring" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-planetarium/20 rounded-xl group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-planetarium" />
            </div>
            <div>
              <h4 className="font-medium text-midnight dark:text-white">Live Monitoring</h4>
              <p className="text-sm text-porpoise">Real-time trace analysis</p>
            </div>
          </div>
        </Link>

        <Link href="/optimization" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success-50 dark:bg-success-500/20 rounded-xl group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h4 className="font-medium text-midnight dark:text-white">Optimization</h4>
              <p className="text-sm text-porpoise">Cost saving recommendations</p>
            </div>
          </div>
        </Link>

        <Link href="/compliance" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/20 rounded-xl group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-midnight dark:text-white">Compliance</h4>
              <p className="text-sm text-porpoise">EU AI Act status</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-xs text-porpoise">
          Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 30s
        </div>
      )}
    </div>
  );
}
