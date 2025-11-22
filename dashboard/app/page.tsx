'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  DocumentChartBarIcon,
  CurrencyEuroIcon,
  ServerStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';

// Mock data for charts
const complianceTrendData = [
  { name: 'Jan', score: 78 },
  { name: 'Feb', score: 82 },
  { name: 'Mar', score: 85 },
  { name: 'Apr', score: 88 },
  { name: 'May', score: 91 },
  { name: 'Jun', score: 94 },
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

  const [complianceScore] = useState(94);

  // Simulate live metrics updates
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

  const radialData = [
    { name: 'Compliance', value: complianceScore, fill: '#10B981' },
  ];

  return (
    <div className="min-h-screen">
      {/* Compliance Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              EU AI Act compliance deadline approaching: 2 systems require attention
            </span>
          </div>
          <Link
            href="/compliance"
            className="text-sm font-semibold hover:underline flex items-center gap-1"
          >
            Review Now
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            EU AI Act Article 15 Compliance Monitoring
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Traces */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BoltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +12%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.activeTraces.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Traces</div>
          </div>

          {/* Avg Latency */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                -8%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.avgLatency}ms
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Latency</div>
          </div>

          {/* Error Rate */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                -0.1%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.errorRate.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
          </div>

          {/* Throughput */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +24%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.throughput}/min
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Throughput</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Compliance Trend Chart */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compliance Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceTrendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Score Gauge */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Overall Compliance
            </h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  barSize={12}
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    background={{ fill: '#374151' }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {complianceScore}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Compliant</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                Above target (90%)
              </span>
            </div>
          </div>
        </div>

        {/* AI Systems Table */}
        <div className="card mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registered AI Systems
              </h3>
              <Link
                href="/compliance"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Provider / Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Compliance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {aiSystems.map((system) => (
                  <tr key={system.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <CpuChipIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {system.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {system.provider} / {system.model}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          system.riskLevel === 'High'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {system.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              system.complianceScore >= 90
                                ? 'bg-emerald-500'
                                : system.complianceScore >= 80
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${system.complianceScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {system.complianceScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {system.status === 'compliant' && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Compliant</span>
                        </span>
                      )}
                      {system.status === 'warning' && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Review</span>
                        </span>
                      )}
                      {system.status === 'non-compliant' && (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Action Required</span>
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
          <Link href="/assessments" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <DocumentChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Run Assessment</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  EU AI Act risk classification
                </p>
              </div>
            </div>
          </Link>

          <Link href="/analytics" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <CurrencyEuroIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Cost Analytics</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track spending & optimize
                </p>
              </div>
            </div>
          </Link>

          <Link href="/monitoring" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <ServerStackIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Live Monitoring</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time trace analysis
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
