'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Eye,
  ArrowDownToLine,
  BarChart3,
  Shield,
  Clock,
} from 'lucide-react';

// Icon mapping for compatibility
const DocumentTextIcon = FileText;
const DocumentArrowDownIcon = Download;
const CalendarIcon = Calendar;
const FunnelIcon = Filter;
const MagnifyingGlassIcon = Search;
const EyeIcon = Eye;
const ArrowDownTrayIcon = ArrowDownToLine;
const ChartBarIcon = BarChart3;
const ShieldCheckIcon = Shield;
const ClockIcon = Clock;

// Mock reports data
const reports = [
  {
    id: 1,
    name: 'Q4 2024 Compliance Summary',
    type: 'Compliance',
    date: '2024-01-15',
    status: 'completed',
    size: '2.4 MB',
    format: 'PDF',
  },
  {
    id: 2,
    name: 'Customer Support Bot Audit',
    type: 'Audit',
    date: '2024-01-14',
    status: 'completed',
    size: '1.8 MB',
    format: 'PDF',
  },
  {
    id: 3,
    name: 'Monthly Trace Analysis - January',
    type: 'Analytics',
    date: '2024-01-12',
    status: 'completed',
    size: '3.2 MB',
    format: 'PDF',
  },
  {
    id: 4,
    name: 'Risk Assessment - Fraud Detection',
    type: 'Risk',
    date: '2024-01-10',
    status: 'completed',
    size: '1.1 MB',
    format: 'PDF',
  },
  {
    id: 5,
    name: 'EU AI Act Article 15 Report',
    type: 'Compliance',
    date: '2024-01-08',
    status: 'completed',
    size: '4.5 MB',
    format: 'PDF',
  },
  {
    id: 6,
    name: 'Weekly Performance Report',
    type: 'Analytics',
    date: '2024-01-07',
    status: 'generating',
    size: '-',
    format: 'PDF',
  },
];

const reportTemplates = [
  {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'Full EU AI Act compliance status report',
    icon: ShieldCheckIcon,
    color: 'blue',
  },
  {
    id: 'audit',
    name: 'System Audit',
    description: 'Detailed audit trail for specific AI system',
    icon: DocumentTextIcon,
    color: 'emerald',
  },
  {
    id: 'analytics',
    name: 'Analytics Report',
    description: 'Performance metrics and usage analytics',
    icon: ChartBarIcon,
    color: 'purple',
  },
  {
    id: 'risk',
    name: 'Risk Assessment',
    description: 'Risk classification and mitigation report',
    icon: ClockIcon,
    color: 'amber',
  },
];

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredReports = reports.filter((report) => {
    if (typeFilter !== 'all' && report.type.toLowerCase() !== typeFilter) return false;
    if (searchQuery && !report.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'compliance':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'audit':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'analytics':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'risk':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Generate and manage compliance reports for your AI systems
            </p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Generate Report
          </button>
        </div>

        {/* Report Templates */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Generate
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {reportTemplates.map((template) => (
              <button
                key={template.id}
                className="card p-6 hover:shadow-lg transition-shadow text-left group"
              >
                <div
                  className={`p-3 rounded-xl w-fit mb-4 ${
                    template.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : template.color === 'emerald'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : template.color === 'purple'
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  } group-hover:scale-110 transition-transform`}
                >
                  <template.icon
                    className={`h-6 w-6 ${
                      template.color === 'blue'
                        ? 'text-blue-600 dark:text-blue-400'
                        : template.color === 'emerald'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : template.color === 'purple'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>

            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field pl-10 pr-10 appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="compliance">Compliance</option>
                <option value="audit">Audit</option>
                <option value="analytics">Analytics</option>
                <option value="risk">Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Reports
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredReports.length} reports)
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {report.name}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {report.format}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                          report.type
                        )}`}
                      >
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="h-4 w-4" />
                        {report.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {report.size}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <span className="animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />
                          Generating
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Download"
                          disabled={report.status !== 'completed'}
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No reports found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
