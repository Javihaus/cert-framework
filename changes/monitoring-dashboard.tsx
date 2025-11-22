'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ServerStackIcon,
  SignalIcon,
  BoltIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Types
interface Trace {
  id: string;
  system: string;
  timestamp: string;
  status: 'success' | 'warning' | 'failed';
  latency: number;
  confidence: number;
  input: string;
  output: string;
  expectedOutput?: string;
  tokens: number;
  cost: number;
  errorMessage?: string;
  metadata: {
    model: string;
    version: string;
    region: string;
    userId?: string;
  };
}

interface System {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  health: number;
  traces24h: number;
  errorRate: number;
  avgLatency: number;
}

// Sample live data
const generateLiveData = () => {
  const systems = ['Customer Support Bot', 'Document Classifier', 'Fraud Detection', 'Content Moderator'];
  const statuses: ('success' | 'warning' | 'failed')[] = ['success', 'success', 'success', 'warning', 'failed'];
  
  return {
    id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    system: systems[Math.floor(Math.random() * systems.length)],
    timestamp: new Date().toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length * Math.random())], // Weighted towards success
    latency: Math.floor(Math.random() * 300) + 50,
    confidence: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
    input: `User query #${Math.floor(Math.random() * 10000)}`,
    output: `AI response for query processing...`,
    tokens: Math.floor(Math.random() * 500) + 100,
    cost: Math.random() * 0.05 + 0.01,
    metadata: {
      model: 'gpt-4-turbo',
      version: '2024.1',
      region: 'eu-west-1',
      userId: `user-${Math.floor(Math.random() * 1000)}`
    }
  };
};

export default function MonitoringDashboard() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('1h');
  const [systems, setSystems] = useState<System[]>([
    { name: 'Customer Support Bot', status: 'online', health: 98, traces24h: 4520, errorRate: 0.3, avgLatency: 142 },
    { name: 'Document Classifier', status: 'degraded', health: 88, traces24h: 3210, errorRate: 2.1, avgLatency: 203 },
    { name: 'Fraud Detection', status: 'online', health: 95, traces24h: 8930, errorRate: 0.8, avgLatency: 89 },
    { name: 'Content Moderator', status: 'online', health: 99, traces24h: 5670, errorRate: 0.1, avgLatency: 67 },
  ]);

  // Generate time series data for chart
  const [chartData, setChartData] = useState(() => {
    const data = [];
    for (let i = 59; i >= 0; i--) {
      data.push({
        time: `${i}m`,
        success: Math.floor(Math.random() * 50 + 150),
        warning: Math.floor(Math.random() * 10 + 5),
        failed: Math.floor(Math.random() * 5 + 2),
        latency: Math.floor(Math.random() * 50 + 100)
      });
    }
    return data;
  });

  // Simulate live traces
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      const newTrace = generateLiveData();
      setTraces(prev => [newTrace, ...prev].slice(0, 100)); // Keep last 100 traces
      
      // Update chart data
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: '0m',
          success: Math.floor(Math.random() * 50 + 150),
          warning: Math.floor(Math.random() * 10 + 5),
          failed: Math.floor(Math.random() * 5 + 2),
          latency: Math.floor(Math.random() * 50 + 100)
        });
        return newData;
      });
    }, 2000); // New trace every 2 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  // Calculate stats
  const stats = {
    totalTraces: traces.length,
    successRate: traces.length ? (traces.filter(t => t.status === 'success').length / traces.length * 100).toFixed(1) : 0,
    avgLatency: traces.length ? Math.floor(traces.reduce((acc, t) => acc + t.latency, 0) / traces.length) : 0,
    totalCost: traces.reduce((acc, t) => acc + t.cost, 0).toFixed(2),
  };

  const StatusIndicator = ({ status }: { status: string }) => {
    if (status === 'success') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (status === 'warning') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    } else if (status === 'failed') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    } else if (status === 'online') {
      return <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />;
    } else if (status === 'degraded') {
      return <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />;
    } else {
      return <div className="h-3 w-3 bg-red-500 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <ServerStackIcon className="h-8 w-8 text-blue-600" />
            <span>Live Monitoring</span>
            {isLive && (
              <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-time monitoring of AI system traces, performance metrics, and compliance status
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              isLive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLive ? (
              <>
                <PauseIcon className="h-5 w-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                <span>Resume</span>
              </>
            )}
          </button>
          
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2">
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export</span>
          </button>
          
          <button className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systems.map((system) => (
          <motion.div
            key={system.name}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{system.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <StatusIndicator status={system.status} />
                  <span className={`text-xs font-medium ${
                    system.status === 'online' ? 'text-green-600 dark:text-green-400' :
                    system.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {system.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                system.health >= 95 ? 'text-green-600 dark:text-green-400' :
                system.health >= 85 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {system.health}%
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Traces</p>
                <p className="font-medium text-gray-900 dark:text-white">{system.traces24h.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Errors</p>
                <p className="font-medium text-gray-900 dark:text-white">{system.errorRate}%</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Latency</p>
                <p className="font-medium text-gray-900 dark:text-white">{system.avgLatency}ms</p>
              </div>
            </div>
            
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <motion.div
                className={`h-1.5 rounded-full ${
                  system.health >= 95 ? 'bg-green-500' :
                  system.health >= 85 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${system.health}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowsPointingOutIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Area type="monotone" dataKey="success" stackId="1" stroke="#10B981" fillOpacity={1} fill="url(#colorSuccess)" />
            <Area type="monotone" dataKey="warning" stackId="1" stroke="#F59E0B" fillOpacity={1} fill="url(#colorWarning)" />
            <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fillOpacity={1} fill="url(#colorFailed)" />
          </AreaChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTraces}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Traces</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.successRate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgLatency}ms</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Latency</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">€{stats.totalCost}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Cost</p>
          </div>
        </div>
      </div>

      {/* Traces Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Traces</h2>
            
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search traces..."
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                />
              </div>
              
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="failed">Failed</option>
              </select>
              
              <button className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trace ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence mode="popLayout">
                {traces
                  .filter(trace => filter === 'all' || trace.status === filter)
                  .filter(trace => searchQuery === '' || 
                    trace.id.includes(searchQuery) || 
                    trace.system.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((trace) => (
                    <motion.tr
                      key={trace.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedTrace(trace)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusIndicator status={trace.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900 dark:text-white">
                          {trace.id.substring(0, 16)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {trace.system}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          trace.latency < 100 ? 'text-green-600 dark:text-green-400' :
                          trace.latency < 200 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {trace.latency}ms
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 dark:text-white mr-2">
                            {(trace.confidence * 100).toFixed(1)}%
                          </span>
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                trace.confidence >= 0.9 ? 'bg-green-500' :
                                trace.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${trace.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        €{trace.cost.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrace(trace);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {traces.length === 0 && (
          <div className="text-center py-12">
            <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Waiting for traces...
            </p>
          </div>
        )}
      </div>

      {/* Trace Detail Modal */}
      <AnimatePresence>
        {selectedTrace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTrace(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trace Details</h3>
                  <button
                    onClick={() => setSelectedTrace(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Trace ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedTrace.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <div className="flex items-center space-x-2">
                      <StatusIndicator status={selectedTrace.status} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedTrace.status.charAt(0).toUpperCase() + selectedTrace.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">System</p>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedTrace.system}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Timestamp</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedTrace.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Latency</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedTrace.latency}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Confidence</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {(selectedTrace.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tokens</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedTrace.tokens}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cost</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">€{selectedTrace.cost.toFixed(3)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Input</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedTrace.input}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Output</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedTrace.output}</p>
                  </div>
                </div>
                
                {selectedTrace.errorMessage && (
                  <div>
                    <p className="text-sm font-medium text-red-500 dark:text-red-400 mb-2">Error</p>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <p className="text-sm text-red-900 dark:text-red-300 font-mono">
                        {selectedTrace.errorMessage}
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">Model</dt>
                        <dd className="text-gray-900 dark:text-white">{selectedTrace.metadata.model}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">Version</dt>
                        <dd className="text-gray-900 dark:text-white">{selectedTrace.metadata.version}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">Region</dt>
                        <dd className="text-gray-900 dark:text-white">{selectedTrace.metadata.region}</dd>
                      </div>
                      {selectedTrace.metadata.userId && (
                        <div>
                          <dt className="text-gray-500 dark:text-gray-400">User ID</dt>
                          <dd className="text-gray-900 dark:text-white">{selectedTrace.metadata.userId}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedTrace(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Export Trace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}