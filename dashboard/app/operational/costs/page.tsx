'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Upload,
  FileText,
  Lightbulb,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Trace, CostSummary } from '@/types/trace';
import { TraceAnalyzer } from '@/lib/trace-analyzer';

interface OptimizationSuggestion {
  type: string;
  title: string;
  description: string;
  potentialSavings: number;
  confidence: number;
}

export default function CostAnalysisPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [costData, setCostData] = useState<CostSummary | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

  useEffect(() => {
    loadCostData();
  }, [timeRange]);

  const loadCostData = async () => {
    setLoading(true);
    try {
      // Try to get from API
      const response = await fetch(`/api/operational/costs?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setCostData(data.costs);
        setSuggestions(data.suggestions || []);
      } else {
        // Load from localStorage
        const stored = localStorage.getItem('cert-traces');
        if (stored) {
          const parsedTraces = JSON.parse(stored);
          setTraces(parsedTraces);
          analyzeCosts(parsedTraces);
        }
      }
    } catch (e) {
      const stored = localStorage.getItem('cert-traces');
      if (stored) {
        const parsedTraces = JSON.parse(stored);
        setTraces(parsedTraces);
        analyzeCosts(parsedTraces);
      }
    }
    setLoading(false);
  };

  const analyzeCosts = (allTraces: Trace[]) => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);

    const filteredTraces =
      timeRange === 'all'
        ? allTraces
        : allTraces.filter((t) => {
            const traceDate = new Date(t.timestamp);
            return traceDate >= cutoff;
          });

    const analyzer = new TraceAnalyzer(filteredTraces);
    const costs = analyzer.calculateCosts();
    setCostData(costs);

    // Generate optimization suggestions
    const newSuggestions: OptimizationSuggestion[] = [];

    // Check for model downgrade opportunities
    const expensiveModels = Object.entries(costs.byModel)
      .filter(([model]) => model.includes('opus') || model.includes('gpt-4'))
      .sort((a, b) => b[1] - a[1]);

    if (expensiveModels.length > 0) {
      const [model, cost] = expensiveModels[0];
      newSuggestions.push({
        type: 'model_downgrade',
        title: `Consider using a smaller model for some ${model} calls`,
        description: `${Math.round(cost * 0.3)} of your ${model} calls could potentially use a smaller model.`,
        potentialSavings: cost * 0.3 * 0.6,
        confidence: 0.7,
      });
    }

    setSuggestions(newSuggestions);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let parsed: Trace[];

        if (file.name.endsWith('.jsonl')) {
          parsed = content
            .trim()
            .split('\n')
            .map((line) => JSON.parse(line));
        } else {
          const data = JSON.parse(content);
          parsed = Array.isArray(data) ? data : [data];
        }

        setTraces(parsed);
        localStorage.setItem('cert-traces', JSON.stringify(parsed));
        analyzeCosts(parsed);
      } catch (e) {
        console.error('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const costPerQuery = costData && traces.length > 0
    ? costData.totalCost / traces.length
    : 0;

  const costStatus = costPerQuery < 0.25 ? 'good' : costPerQuery < 0.50 ? 'warning' : 'high';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-yellow-500" />
            Cost Analysis
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Token usage and API costs tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | 'all')}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Traces
            <input
              type="file"
              accept=".json,.jsonl"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {!costData || traces.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No cost data available
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Upload a trace file (JSONL format) to analyze your LLM API costs.
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Trace File
            <input
              type="file"
              accept=".json,.jsonl"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Cost</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {formatCurrency(costData.totalCost)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {timeRange === '7d' ? 'This week' : timeRange === '30d' ? 'This month' : 'All time'}
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Avg Cost/Query</span>
                {costStatus === 'good' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    Good
                  </span>
                ) : costStatus === 'warning' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    High
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    Very High
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {formatCurrency(costPerQuery)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Target: &lt; $0.25
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Projected Monthly</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {formatCurrency(costData.projectedMonthlyCost)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Based on current usage
              </p>
            </div>
          </div>

          {/* Cost by Provider */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Cost by Provider</h2>
            <div className="space-y-3">
              {Object.entries(costData.byPlatform)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, cost]) => {
                  const percentage = (cost / costData.totalCost) * 100;
                  return (
                    <div key={platform} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                        {platform}
                      </span>
                      <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            platform === 'anthropic' && "bg-orange-500",
                            platform === 'openai' && "bg-emerald-500",
                            platform === 'google' && "bg-blue-500",
                            !['anthropic', 'openai', 'google'].includes(platform) && "bg-purple-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-24 text-sm font-medium text-zinc-900 dark:text-white text-right">
                        {formatCurrency(cost)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Cost by Model */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Cost by Model</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {Object.entries(costData.byModel)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, cost]) => {
                      const modelTraces = traces.filter((t) => t.model === model);
                      const totalTokens = modelTraces.reduce(
                        (sum, t) => sum + ((t.metadata?.tokens?.prompt || 0) + (t.metadata?.tokens?.completion || 0)),
                        0
                      );
                      return (
                        <tr key={model}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                            {model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {modelTraces.length.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                            {totalTokens > 1000000
                              ? `${(totalTokens / 1000000).toFixed(1)}M`
                              : totalTokens > 1000
                              ? `${(totalTokens / 1000).toFixed(0)}K`
                              : totalTokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                            {formatCurrency(cost)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Cost Trend */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Daily Cost Trend</h2>
            <div className="h-48 flex items-end justify-between gap-1">
              {Object.entries(costData.dailyCosts)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .slice(-14)
                .map(([date, cost]) => {
                  const maxCost = Math.max(...Object.values(costData.dailyCosts));
                  const height = maxCost > 0 ? (cost / maxCost) * 100 : 0;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-yellow-500 rounded-t min-h-[4px]"
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${date}: ${formatCurrency(cost)}`}
                      />
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 -rotate-45 origin-left">
                        {date.slice(5)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">
                  Optimization Suggestions
                </h2>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {suggestions.map((suggestion, i) => (
                  <div key={i} className="p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Save {formatCurrency(suggestion.potentialSavings)}/mo
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
