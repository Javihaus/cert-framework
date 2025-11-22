'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Euro,
  Cpu,
  Zap,
  Clock,
  Calendar,
} from 'lucide-react';

// Icon mapping for compatibility
const ChartBarIcon = BarChart3;
const ArrowTrendingUpIcon = TrendingUp;
const ArrowTrendingDownIcon = TrendingDown;
const CurrencyEuroIcon = Euro;
const CpuChipIcon = Cpu;
const BoltIcon = Zap;
const ClockIcon = Clock;
const CalendarIcon = Calendar;
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data
const costTrendData = [
  { name: 'Mon', cost: 245 },
  { name: 'Tue', cost: 312 },
  { name: 'Wed', cost: 287 },
  { name: 'Thu', cost: 398 },
  { name: 'Fri', cost: 356 },
  { name: 'Sat', cost: 189 },
  { name: 'Sun', cost: 156 },
];

const usageByProvider = [
  { name: 'OpenAI', value: 45, color: '#10B981' },
  { name: 'Anthropic', value: 30, color: '#3B82F6' },
  { name: 'AWS Bedrock', value: 15, color: '#8B5CF6' },
  { name: 'Google AI', value: 10, color: '#F59E0B' },
];

const tokensByModel = [
  { model: 'GPT-4o', tokens: 1250000 },
  { model: 'Claude 3.5', tokens: 890000 },
  { model: 'Titan', tokens: 450000 },
  { model: 'Gemini Pro', tokens: 320000 },
];

const hourlyUsage = [
  { hour: '00', requests: 120 },
  { hour: '02', requests: 80 },
  { hour: '04', requests: 45 },
  { hour: '06', requests: 95 },
  { hour: '08', requests: 340 },
  { hour: '10', requests: 520 },
  { hour: '12', requests: 480 },
  { hour: '14', requests: 560 },
  { hour: '16', requests: 490 },
  { hour: '18', requests: 380 },
  { hour: '20', requests: 280 },
  { hour: '22', requests: 180 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  const metrics = {
    totalCost: 2847,
    costChange: 12.5,
    totalRequests: 47832,
    requestChange: 8.3,
    avgLatency: 234,
    latencyChange: -5.2,
    totalTokens: 2910000,
    tokenChange: 15.7,
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Monitor AI system usage, costs, and performance metrics
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Cost */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CurrencyEuroIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span
                className={`flex items-center text-sm ${
                  metrics.costChange > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {metrics.costChange > 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(metrics.costChange)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.totalCost.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost (This Month)</div>
          </div>

          {/* Total Requests */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BoltIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                {metrics.requestChange}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.totalRequests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Requests</div>
          </div>

          {/* Avg Latency */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                {Math.abs(metrics.latencyChange)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.avgLatency}ms
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Latency</div>
          </div>

          {/* Total Tokens */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <CpuChipIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                {metrics.tokenChange}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(metrics.totalTokens / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cost Trend */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cost Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrendData}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                    formatter={(value: number) => [`€${value}`, 'Cost']}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Usage by Provider */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Usage by Provider
            </h3>
            <div className="h-64 flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={usageByProvider}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {usageByProvider.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {usageByProvider.map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: provider.color }}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {provider.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {provider.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tokens by Model */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tokens by Model
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokensByModel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis dataKey="model" type="category" stroke="#6B7280" fontSize={12} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'Tokens']}
                  />
                  <Bar dataKey="tokens" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Usage */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hourly Request Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="hour" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                    labelFormatter={(label) => `${label}:00`}
                    formatter={(value: number) => [value, 'Requests']}
                  />
                  <Bar dataKey="requests" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
