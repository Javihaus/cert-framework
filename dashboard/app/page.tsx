'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Shield,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  FileText,
  Euro,
  Server,
  CheckCircle,
  XCircle,
  ArrowRight,
  Cpu,
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

// Mock data
const complianceTrendData = [
  { name: 'Jan', score: 78 },
  { name: 'Feb', score: 82 },
  { name: 'Mar', score: 85 },
  { name: 'Apr', score: 88 },
  { name: 'May', score: 91 },
  { name: 'Jun', score: 87 },
];

const aiSystems = [
  {
    id: 1,
    name: 'Customer Support Bot',
    provider: 'OpenAI',
    model: 'GPT-4o',
    status: 'compliant',
    riskLevel: 'High',
    complianceScore: 96,
    lastAudit: '2024-01-15',
  },
  {
    id: 2,
    name: 'Document Analyzer',
    provider: 'Anthropic',
    model: 'Claude 3.5',
    status: 'warning',
    riskLevel: 'Limited',
    complianceScore: 87,
    lastAudit: '2024-01-12',
  },
  {
    id: 3,
    name: 'Fraud Detection',
    provider: 'AWS Bedrock',
    model: 'Titan',
    status: 'compliant',
    riskLevel: 'High',
    complianceScore: 94,
    lastAudit: '2024-01-14',
  },
  {
    id: 4,
    name: 'Content Moderator',
    provider: 'OpenAI',
    model: 'GPT-4',
    status: 'non-compliant',
    riskLevel: 'High',
    complianceScore: 72,
    lastAudit: '2024-01-10',
  },
];

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState({
    activeTraces: 1247,
    avgLatency: 234,
    errorRate: 0.3,
    throughput: 847,
  });

  const complianceScore = 87;

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        activeTraces: prev.activeTraces + Math.floor(Math.random() * 10) - 3,
        avgLatency: Math.max(100, prev.avgLatency + Math.floor(Math.random() * 20) - 10),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() * 0.2 - 0.1))),
        throughput: Math.max(500, prev.throughput + Math.floor(Math.random() * 50) - 25),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Alert Banner */}
      <div className="bg-gradient-to-r from-coral to-orange-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              EU AI Act compliance deadline approaching: 2 systems require attention
            </span>
          </div>
          <Link
            href="/compliance"
            className="flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Review Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-heading text-midnight dark:text-white">Dashboard Overview</h1>
        <p className="text-body text-porpoise mt-1">
          EU AI Act Article 15 Compliance Monitoring
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Active Traces */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-50 dark:bg-planetarium/20 rounded-lg">
              <Zap className="w-5 h-5 text-planetarium" />
            </div>
            <span className="metric-change positive">
              <TrendingUp className="w-3 h-3" />
              +12%
            </span>
          </div>
          <div className="metric-value">{metrics.activeTraces.toLocaleString()}</div>
          <div className="metric-label">Active Traces</div>
        </div>

        {/* Avg Latency */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="metric-change positive">
              <TrendingDown className="w-3 h-3" />
              -8%
            </span>
          </div>
          <div className="metric-value">{metrics.avgLatency}ms</div>
          <div className="metric-label">Avg Latency</div>
        </div>

        {/* Error Rate */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-error-50 dark:bg-error-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-error-600" />
            </div>
            <span className="metric-change positive">
              <TrendingDown className="w-3 h-3" />
              -0.1%
            </span>
          </div>
          <div className="metric-value">{metrics.errorRate.toFixed(2)}%</div>
          <div className="metric-label">Error Rate</div>
        </div>

        {/* Throughput */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-success-50 dark:bg-success-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-success-600" />
            </div>
            <span className="metric-change positive">
              <TrendingUp className="w-3 h-3" />
              +24%
            </span>
          </div>
          <div className="metric-value">{metrics.throughput}/min</div>
          <div className="metric-label">Throughput</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Trend */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-title text-midnight dark:text-white mb-4">Compliance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceTrendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1C70AD" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1C70AD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#C8CBCD"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#C8CBCD"
                  fontSize={12}
                  domain={[60, 100]}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0C121B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F2F3F4',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#1C70AD"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Score */}
        <div className="card p-6">
          <h3 className="text-title text-midnight dark:text-white mb-4">Overall Compliance</h3>
          <div className="flex flex-col items-center justify-center h-48">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                  className="dark:stroke-white/10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={complianceScore >= 90 ? '#10B981' : complianceScore >= 70 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(complianceScore / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-midnight dark:text-white">{complianceScore}%</span>
                <span className="text-xs text-porpoise">Compliant</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Shield className="w-4 h-4 text-warning-500" />
              <span className="text-sm text-warning-600 dark:text-warning-500 font-medium">
                Below target (90%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Systems Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-title text-midnight dark:text-white">Registered AI Systems</h3>
          <Link href="/compliance" className="text-sm text-planetarium hover:underline flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>System</th>
                <th>Provider / Model</th>
                <th>Risk Level</th>
                <th>Compliance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {aiSystems.map((system) => (
                <tr key={system.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-white/10 rounded-lg">
                        <Cpu className="w-4 h-4 text-porpoise" />
                      </div>
                      <span className="font-medium">{system.name}</span>
                    </div>
                  </td>
                  <td className="text-porpoise">
                    {system.provider} / {system.model}
                  </td>
                  <td>
                    <span className={`badge ${
                      system.riskLevel === 'High' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {system.riskLevel}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-20 progress-bar">
                        <div
                          className={`progress-fill ${
                            system.complianceScore >= 90 ? 'success' :
                            system.complianceScore >= 80 ? 'warning' : 'error'
                          }`}
                          style={{ width: `${system.complianceScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-porpoise w-10">{system.complianceScore}%</span>
                    </div>
                  </td>
                  <td>
                    {system.status === 'compliant' && (
                      <span className="badge badge-success">
                        <CheckCircle className="w-3 h-3" />
                        Compliant
                      </span>
                    )}
                    {system.status === 'warning' && (
                      <span className="badge badge-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Review
                      </span>
                    )}
                    {system.status === 'non-compliant' && (
                      <span className="badge badge-error">
                        <XCircle className="w-3 h-3" />
                        Action Required
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/assessment" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-planetarium/20 rounded-xl group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-planetarium" />
            </div>
            <div>
              <h4 className="font-medium text-midnight dark:text-white">Run Assessment</h4>
              <p className="text-sm text-porpoise">EU AI Act risk classification</p>
            </div>
          </div>
        </Link>

        <Link href="/analytics" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success-50 dark:bg-success-500/20 rounded-xl group-hover:scale-105 transition-transform">
              <Euro className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h4 className="font-medium text-midnight dark:text-white">Cost Analytics</h4>
              <p className="text-sm text-porpoise">Track spending & optimize</p>
            </div>
          </div>
        </Link>

        <Link href="/monitoring" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/20 rounded-xl group-hover:scale-105 transition-transform">
              <Server className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-midnight dark:text-white">Live Monitoring</h4>
              <p className="text-sm text-porpoise">Real-time trace analysis</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
