'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelPricing {
  id: string;
  vendor: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

interface LLMTrace {
  id: string;
  llm?: {
    vendor: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  receivedAt: string;
  durationMs: number;
}

interface CostData {
  totalCost: number;
  byModel: Record<string, { cost: number; calls: number; tokens: number }>;
  byVendor: Record<string, number>;
  dailyCosts: Record<string, number>;
  avgCostPerQuery: number;
  projectedMonthlyCost: number;
}

export default function CostAnalysisPage() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [pricing, setPricing] = useState<ModelPricing[]>([]);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);
  const [hasPricing, setHasPricing] = useState(false);

  useEffect(() => {
    // Load pricing from localStorage
    const storedPricing = localStorage.getItem('cert-model-pricing');
    if (storedPricing) {
      const parsed = JSON.parse(storedPricing);
      setPricing(parsed);
      setHasPricing(parsed.length > 0);
    }
    loadTraces();
  }, []);

  useEffect(() => {
    if (traces.length > 0 && pricing.length > 0) {
      calculateCosts();
    }
  }, [traces, pricing, timeRange]);

  const loadTraces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/traces?llmOnly=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        setTraces(data.traces || []);
      }
    } catch (e) {
      console.error('Failed to load traces:', e);
    }
    setLoading(false);
  };

  const getPriceForModel = (vendor: string, model: string): { input: number; output: number } => {
    // Try exact match first
    let priceConfig = pricing.find(
      p => p.vendor.toLowerCase() === vendor.toLowerCase() &&
           p.model.toLowerCase() === model.toLowerCase()
    );

    // Try partial match
    if (!priceConfig) {
      priceConfig = pricing.find(
        p => p.vendor.toLowerCase() === vendor.toLowerCase() &&
             model.toLowerCase().includes(p.model.toLowerCase())
      );
    }

    // Try just model name match
    if (!priceConfig) {
      priceConfig = pricing.find(
        p => model.toLowerCase().includes(p.model.toLowerCase())
      );
    }

    if (priceConfig) {
      return {
        input: priceConfig.inputPricePerMillion,
        output: priceConfig.outputPricePerMillion,
      };
    }

    // Default fallback
    return { input: 1, output: 2 };
  };

  const calculateCosts = () => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);

    const filteredTraces = timeRange === 'all'
      ? traces
      : traces.filter(t => new Date(t.receivedAt) >= cutoff);

    const llmTraces = filteredTraces.filter(t => t.llm);

    if (llmTraces.length === 0) {
      setCostData(null);
      return;
    }

    let totalCost = 0;
    const byModel: Record<string, { cost: number; calls: number; tokens: number }> = {};
    const byVendor: Record<string, number> = {};
    const dailyCosts: Record<string, number> = {};

    for (const trace of llmTraces) {
      const vendor = trace.llm?.vendor || 'unknown';
      const model = trace.llm?.model || 'unknown';
      const promptTokens = trace.llm?.promptTokens || 0;
      const completionTokens = trace.llm?.completionTokens || 0;
      const totalTokens = promptTokens + completionTokens;

      const priceInfo = getPriceForModel(vendor, model);
      const cost = (promptTokens * priceInfo.input + completionTokens * priceInfo.output) / 1_000_000;

      totalCost += cost;

      if (!byModel[model]) {
        byModel[model] = { cost: 0, calls: 0, tokens: 0 };
      }
      byModel[model].cost += cost;
      byModel[model].calls += 1;
      byModel[model].tokens += totalTokens;

      byVendor[vendor] = (byVendor[vendor] || 0) + cost;

      const date = new Date(trace.receivedAt).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + cost;
    }

    const days = Object.keys(dailyCosts).length || 1;
    const dailyAvg = totalCost / days;

    setCostData({
      totalCost,
      byModel,
      byVendor,
      dailyCosts,
      avgCostPerQuery: totalCost / llmTraces.length,
      projectedMonthlyCost: dailyAvg * 30,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const costStatus = costData
    ? costData.avgCostPerQuery < 0.01 ? 'good'
    : costData.avgCostPerQuery < 0.05 ? 'warning'
    : 'high'
    : 'good';

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
            <DollarSign className="w-7 h-7 text-[#10069F]" />
            Cost Analysis
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Token usage and API costs based on configured pricing
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
          <button
            onClick={loadTraces}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* No pricing configured */}
      {!hasPricing && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">
                No pricing configured
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Configure model pricing in the{' '}
                <Link href="/configuration" className="underline font-medium">
                  Configuration page
                </Link>{' '}
                to see accurate cost calculations.
              </p>
            </div>
          </div>
        </div>
      )}

      {!costData || traces.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-[#10069F]/10 dark:bg-[#10069F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-[#10069F] dark:text-[#7ea0bf]" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No trace data available
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Run your LLM application with the CERT tracer to start collecting cost data.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Cost</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {formatCurrencyShort(costData.totalCost)}
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
                {formatCurrency(costData.avgCostPerQuery)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Target: &lt; $0.01
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Projected Monthly</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {formatCurrencyShort(costData.projectedMonthlyCost)}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Based on current usage
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Calls</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {traces.filter(t => t.llm).length.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                LLM API calls
              </p>
            </div>
          </div>

          {/* Cost by Vendor */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Cost by Provider</h2>
            <div className="space-y-3">
              {Object.entries(costData.byVendor)
                .sort((a, b) => b[1] - a[1])
                .map(([vendor, cost]) => {
                  const percentage = costData.totalCost > 0 ? (cost / costData.totalCost) * 100 : 0;
                  return (
                    <div key={vendor} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                        {vendor}
                      </span>
                      <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            vendor === 'anthropic' && "bg-orange-500",
                            vendor === 'openai' && "bg-emerald-500",
                            vendor === 'google' && "bg-blue-500",
                            !['anthropic', 'openai', 'google'].includes(vendor) && "bg-purple-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-32 text-sm font-medium text-zinc-900 dark:text-white text-right">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Avg/Call
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {Object.entries(costData.byModel)
                    .sort((a, b) => b[1].cost - a[1].cost)
                    .map(([model, data]) => (
                      <tr key={model}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                          {model}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {data.calls.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {data.tokens > 1000000
                            ? `${(data.tokens / 1000000).toFixed(1)}M`
                            : data.tokens > 1000
                            ? `${(data.tokens / 1000).toFixed(0)}K`
                            : data.tokens.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                          {formatCurrency(data.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                          {formatCurrency(data.cost / data.calls)}
                        </td>
                      </tr>
                    ))}
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
                        className="w-full bg-[#10069F] rounded-t min-h-[4px]"
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

          {/* Pricing Info */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#10069F]" />
                <h2 className="font-semibold text-zinc-900 dark:text-white">Pricing Configuration</h2>
              </div>
              <Link
                href="/configuration"
                className="text-sm text-[#10069F] dark:text-[#7ea0bf] hover:underline"
              >
                Edit Pricing →
              </Link>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Costs are calculated based on your configured model pricing ({pricing.length} models configured).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pricing.slice(0, 4).map((p) => (
                <div key={p.id} className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{p.vendor}</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{p.model}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    ${p.inputPricePerMillion} / ${p.outputPricePerMillion} per 1M
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
