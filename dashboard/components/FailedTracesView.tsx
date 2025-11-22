'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Info, XCircle, HelpCircle, Download } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import { cn } from '@/lib/utils';
import { EvaluationResult } from '@/types/cert';
import { classifyFailure, PATTERNS } from '@/utils/patternClassifier';

interface FailedTracesViewProps {
  results: EvaluationResult[];
  threshold: number;
}

// Map icon names to Lucide icons
const ICON_MAP: Record<string, React.ElementType> = {
  MdWarning: AlertTriangle,
  MdInfo: Info,
  MdRemoveCircle: XCircle,
  MdHelp: HelpCircle,
};

// Pattern color classes
const PATTERN_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string; active: string }> = {
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 hover:border-orange-400',
    text: 'text-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    active: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 hover:border-blue-400',
    text: 'text-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    active: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 hover:border-red-400',
    text: 'text-red-500',
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    active: 'border-red-300 bg-red-50 dark:bg-red-900/20',
  },
  gray: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    border: 'border-zinc-300 hover:border-zinc-400',
    text: 'text-zinc-500',
    iconBg: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400',
    active: 'border-zinc-300 bg-zinc-100 dark:bg-zinc-800',
  },
};

export default function FailedTracesView({ results, threshold }: FailedTracesViewProps) {
  const [filterPattern, setFilterPattern] = useState<string | null>(null);

  const failedResults = useMemo(() => {
    return results
      .filter(r => !r.passed)
      .map(r => ({
        ...r,
        pattern: classifyFailure(
          r.query,
          r.response || '',
          r.measurement.confidence
        )
      }));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!filterPattern) return failedResults;
    return failedResults.filter(r => r.pattern.type === filterPattern);
  }, [failedResults, filterPattern]);

  const patternCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(PATTERNS).forEach(key => {
      counts[key] = 0;
    });
    failedResults.forEach(r => {
      counts[r.pattern.type]++;
    });
    return counts;
  }, [failedResults]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Score', 'Pattern', 'Query', 'Response'];
    const rows = filteredResults.map(r => [
      r.timestamp,
      r.measurement.confidence.toFixed(3),
      r.pattern.label,
      `"${r.query.replace(/"/g, '""')}"`,
      `"${(r.response || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_traces_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const exportData = filteredResults.map(r => ({
      timestamp: r.timestamp,
      score: r.measurement.confidence,
      pattern: r.pattern.label,
      pattern_type: r.pattern.type,
      query: r.query,
      response: r.response || '',
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_traces_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePatternClick = (patternType: string) => {
    setFilterPattern(filterPattern === patternType ? null : patternType);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Pattern Cards */}
      <Card>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Failure Pattern Classification
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
          {failedResults.length} failed traces grouped by failure type. Click a pattern to filter results.
        </p>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(PATTERNS).map(([key, pattern]) => {
            const Icon = ICON_MAP[pattern.icon as keyof typeof ICON_MAP];
            const count = patternCounts[key];
            const percentage = failedResults.length > 0
              ? ((count / failedResults.length) * 100).toFixed(1)
              : '0.0';
            const isActive = filterPattern === key;
            const colorConfig = PATTERN_COLORS[pattern.color] || PATTERN_COLORS.gray;

            return (
              <div
                key={key}
                onClick={() => handlePatternClick(key)}
                className={cn(
                  'p-5 border-2 rounded-lg flex-1 min-w-[200px] cursor-pointer transition-all hover:-translate-y-0.5',
                  isActive ? colorConfig.active : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900',
                  colorConfig.border
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-10 h-10 flex items-center justify-center rounded-lg', colorConfig.iconBg)}>
                    <Icon size={20} />
                  </div>
                  <span className="text-base font-semibold text-zinc-900 dark:text-white">
                    {pattern.label}
                  </span>
                </div>
                <p className={cn('text-3xl font-bold leading-none', colorConfig.text)}>
                  {count}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {percentage}% of failures
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Export Buttons & Table */}
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {filterPattern
              ? `${PATTERNS[filterPattern].label} Traces (${filteredResults.length})`
              : `Failed Traces (${failedResults.length})`
            }
          </h2>
          <div className="flex gap-3">
            <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={<Download size={18} />}>
              Export CSV
            </Button>
            <Button onClick={handleExportJSON} variant="secondary" size="sm" icon={<Download size={18} />}>
              Export JSON
            </Button>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <p className="text-zinc-400 text-base text-center py-16">
            No traces match the selected filter
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-3 px-2">Score</th>
                  <th className="text-left text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-3 px-2">Pattern</th>
                  <th className="text-left text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-3 px-2">Query</th>
                  <th className="text-left text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-3 px-2">Response</th>
                  <th className="text-left text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-3 px-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, idx) => {
                  const Icon = ICON_MAP[result.pattern.icon as keyof typeof ICON_MAP];
                  const colorConfig = PATTERN_COLORS[result.pattern.color] || PATTERN_COLORS.gray;
                  return (
                    <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-2">
                        <span className="text-sm font-bold text-red-500">
                          {result.measurement.confidence.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Icon size={18} className={colorConfig.text} />
                          <Badge variant={result.pattern.color === 'orange' ? 'warning' : result.pattern.color === 'red' ? 'error' : 'default'} size="sm">
                            {result.pattern.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-2 max-w-[250px]">
                        <span
                          className="text-sm truncate block"
                          title={result.query}
                        >
                          {result.query}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-[350px]">
                        <span
                          className="text-sm text-zinc-500 truncate block"
                          title={result.response || ''}
                        >
                          {result.response || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs text-zinc-400">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
