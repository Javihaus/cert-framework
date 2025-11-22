'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  CurrencyEuroIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChevronRightIcon,
  PlayIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserGroupIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

// Sample data for charts
const complianceData = [
  { date: 'Nov 1', accuracy: 82, confidence: 0.78, threshold: 90 },
  { date: 'Nov 5', accuracy: 84, confidence: 0.80, threshold: 90 },
  { date: 'Nov 10', accuracy: 83, confidence: 0.79, threshold: 90 },
  { date: 'Nov 15', accuracy: 85, confidence: 0.81, threshold: 90 },
  { date: 'Nov 20', accuracy: 85, confidence: 0.812, threshold: 90 },
  { date: 'Nov 22', accuracy: 85, confidence: 0.812, threshold: 90 },
];

const systemsData = [
  { name: 'Customer Support Bot', risk: 'High', compliance: 92, traces: 4520, status: 'compliant' },
  { name: 'Document Classifier', risk: 'Medium', compliance: 88, traces: 3210, status: 'warning' },
  { name: 'Fraud Detection', risk: 'High', compliance: 85, traces: 8930, status: 'critical' },
  { name: 'Content Moderator', risk: 'High', compliance: 94, traces: 5670, status: 'compliant' },
  { name: 'Price Optimizer', risk: 'Low', compliance: 96, traces: 2340, status: 'compliant' },
];

const costBreakdown = [
  { category: 'Model API Calls', value: 1847, percentage: 65 },
  { category: 'Monitoring', value: 428, percentage: 15 },
  { category: 'Storage', value: 285, percentage: 10 },
  { category: 'Compliance Tools', value: 287, percentage: 10 },
];

const riskMatrix = [
  { impact: 'High', likelihood: 'High', count: 2, color: '#EF4444' },
  { impact: 'High', likelihood: 'Medium', count: 3, color: '#F97316' },
  { impact: 'High', likelihood: 'Low', count: 1, color: '#FCD34D' },
  { impact: 'Medium', likelihood: 'High', count: 1, color: '#F97316' },
  { impact: 'Medium', likelihood: 'Medium', count: 4, color: '#FCD34D' },
  { impact: 'Medium', likelihood: 'Low', count: 2, color: '#84CC16' },
  { impact: 'Low', likelihood: 'High', count: 0, color: '#FCD34D' },
  { impact: 'Low', likelihood: 'Medium', count: 1, color: '#84CC16' },
  { impact: 'Low', likelihood: 'Low', count: 5, color: '#22C55E' },
];

export default function OverviewDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState({
    activeTraces: 234,
    avgLatency: 142,
    errorRate: 0.3,
    throughput: 1823
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeTraces: prev.activeTraces + Math.floor(Math.random() * 10 - 5),
        avgLatency: prev.avgLatency + Math.floor(Math.random() * 20 - 10),
        errorRate: Math.max(0, prev.errorRate + (Math.random() * 0.2 - 0.1)),
        throughput: prev.throughput + Math.floor(Math.random() * 100 - 50)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const ActionCard = ({ title, description, icon: Icon, action, color }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={action}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${color} mb-4`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-gray-400 mt-1" />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            EU AI Act Compliance Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor your AI systems' compliance with Article 15 requirements in real-time
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export Report</span>
          </button>
          <button className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Compliance Alert Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Compliance Threshold Alert
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your system accuracy is at 85.0% (target: 90%). Review 3 failed traces to identify systematic issues before the next compliance audit.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
                <PlayIcon className="h-4 w-4" />
                <span>Investigate Failed Traces</span>
              </button>
              <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                View Compliance Guide
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BoltIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">LIVE</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Traces</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{liveMetrics.activeTraces}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Processing now</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={`text-xs font-medium ${liveMetrics.avgLatency < 150 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {liveMetrics.avgLatency < 150 ? '↓ 12%' : '↑ 5%'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Latency</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{liveMetrics.avgLatency}ms</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">P95: 203ms</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <span className={`text-xs font-medium ${liveMetrics.errorRate < 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {liveMetrics.errorRate < 1 ? 'NORMAL' : 'HIGH'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Error Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{liveMetrics.errorRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">3 errors today</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">↑ 8%</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Throughput</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{liveMetrics.throughput}/hr</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Peak: 2,341/hr</p>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance Trend</h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Confidence</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">Threshold</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={complianceData}>
              <defs>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[70, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorAccuracy)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="threshold" 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Score Radial */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Overall Compliance</h2>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: 85, fill: '#3B82F6' }]}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#3B82F6" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-32">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">85%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Compliant</p>
            </div>
            <div className="mt-16 space-y-2 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Target</span>
                <span className="font-medium text-gray-900 dark:text-white">90%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Gap</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">-5%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Trend</span>
                <span className="font-medium text-green-600 dark:text-green-400">+2.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Systems Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Systems Overview</h2>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all systems →</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  System Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Traces (24h)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {systemsData.map((system, index) => (
                <motion.tr
                  key={system.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => setSelectedSystem(system.name)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <CpuChipIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {system.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      system.risk === 'High' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : system.risk === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {system.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                        {system.compliance}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            system.compliance >= 90 ? 'bg-green-500' :
                            system.compliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${system.compliance}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {system.traces.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {system.status === 'compliant' && (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm text-green-600 dark:text-green-400">Compliant</span>
                        </>
                      )}
                      {system.status === 'warning' && (
                        <>
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                          <span className="text-sm text-yellow-600 dark:text-yellow-400">Warning</span>
                        </>
                      )}
                      {system.status === 'critical' && (
                        <>
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-sm text-red-600 dark:text-red-400">Critical</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300">
                      Details →
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid - Cost & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Cost</h2>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">€2,847</span>
          </div>
          <div className="space-y-4">
            {costBreakdown.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">{item.category}</span>
                  <span className="font-medium text-gray-900 dark:text-white">€{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Generate Compliance Report"
            description="Create Article 15 documentation for auditors"
            icon={DocumentTextIcon}
            color="bg-gradient-to-r from-blue-500 to-indigo-600"
            action={() => console.log('Generate report')}
          />
          <ActionCard
            title="Run Risk Assessment"
            description="Evaluate system classification and requirements"
            icon={ShieldCheckIcon}
            color="bg-gradient-to-r from-green-500 to-emerald-600"
            action={() => console.log('Run assessment')}
          />
          <ActionCard
            title="Schedule Audit"
            description="Book compliance review with certified auditor"
            icon={CalendarIcon}
            color="bg-gradient-to-r from-purple-500 to-pink-600"
            action={() => console.log('Schedule audit')}
          />
          <ActionCard
            title="Team Training"
            description="Access EU AI Act compliance resources"
            icon={UserGroupIcon}
            color="bg-gradient-to-r from-orange-500 to-red-600"
            action={() => console.log('Training')}
          />
        </div>
      </div>
    </div>
  );
}