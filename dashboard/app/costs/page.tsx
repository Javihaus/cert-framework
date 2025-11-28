'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import MetricCard from '@/components/MetricCard';
import CostTrendChart from '@/components/CostTrendChart';
import Card from '@/components/Card';
import { LuDollarSign, LuTrendingUp, LuTrendingDown, LuCalendar, LuPackage } from 'react-icons/lu';
import { Trace, CostSummary } from '@/types/trace';
import { TraceAnalyzer } from '@/lib/trace-analyzer';

export default function CostsPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [costData, setCostData] = useState<CostSummary | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  const handleFileLoad = (data: Trace[] | Trace) => {
    // FileUpload component already parses the JSON/JSONL file
    const parsed = Array.isArray(data) ? data : [data];
    setTraces(parsed);
    analyzeCosts(parsed);
  };

  const analyzeCosts = (allTraces: Trace[]) => {
    // LuFilter by time range
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
  };

  // Convert daily costs to chart format
  const chartData = costData
    ? Object.entries(costData.dailyCosts)
        .map(([date, cost]) => ({
          date,
          cost,
          count: traces.filter((t) => t.timestamp.split('T')[0] === date).length,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  // Calculate trend
  const costTrend = costData && chartData.length >= 2
    ? chartData[chartData.length - 1].cost > chartData[0].cost
      ? 'up'
      : 'down'
    : undefined;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            Cost Analysis
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Track and analyze AI API costs across platforms
          </p>
        </div>

        {costData && (
          <div className="w-[150px]">
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as '7d' | '30d' | 'all');
                analyzeCosts(traces);
              }}
              className="w-full px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm cursor-pointer text-zinc-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        )}
      </div>

      {/* LuFile upload */}
      {!costData && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8">
            <LuDollarSign size={48} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              LuUpload trace file to analyze costs
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-[500px]">
              LuUpload your cert_traces.jsonl file to see detailed cost breakdowns, trends, and projections
            </p>
            <div className="w-full max-w-[500px]">
              <FileUpload onFileLoad={handleFileLoad} accept=".jsonl,.json" label="LuUpload Trace LuFile" />
            </div>
          </div>
        </Card>
      )}

      {/* Metrics */}
      {costData && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Total Cost"
              value={`$${costData.totalCost.toFixed(2)}`}
              icon={LuDollarSign}
              variant="default"
            />
            <MetricCard
              label="Projected Monthly"
              value={`$${costData.projectedMonthlyCost.toFixed(2)}`}
              icon={LuTrendingUp}
              variant={costTrend === 'up' ? 'warning' : 'success'}
            />
            <MetricCard
              label="Avg per Task"
              value={`$${costData.avgPerTask.toFixed(4)}`}
              icon={LuCalendar}
              variant="default"
            />
            <MetricCard
              label="Platforms Used"
              value={Object.keys(costData.byPlatform).length.toString()}
              icon={LuPackage}
              variant="default"
            />
          </div>

          {/* Cost trend chart */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              Cost Trend
            </h2>
            <div className="h-[300px]">
              <CostTrendChart data={chartData} height={300} showCount={true} />
            </div>
          </Card>

          {/* Cost by Model */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Cost by Model
              </h2>
              <div className="overflow-x-auto">
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-2 border-b border-zinc-300 dark:border-zinc-600 font-medium">
                  <div className="flex-[2]">Model</div>
                  <div className="flex-1 text-right">Cost</div>
                  <div className="flex-1 text-right">%</div>
                </div>
                {Object.entries(costData.byModel)
                  .sort((a, b) => b[1] - a[1])
                  .map(([model, cost], idx) => (
                    <div
                      key={model}
                      className={`flex p-2 border-b border-zinc-200 dark:border-zinc-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'
                      }`}
                    >
                      <div className="flex-[2] text-sm">{model}</div>
                      <div className="flex-1 text-right text-sm font-medium">
                        ${cost.toFixed(2)}
                      </div>
                      <div className="flex-1 text-right text-sm text-zinc-500 dark:text-zinc-400">
                        {((cost / costData.totalCost) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Cost by Platform */}
            <Card>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Cost by Platform
              </h2>
              <div className="overflow-x-auto">
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-2 border-b border-zinc-300 dark:border-zinc-600 font-medium">
                  <div className="flex-[2]">Platform</div>
                  <div className="flex-1 text-right">Cost</div>
                  <div className="flex-1 text-right">%</div>
                </div>
                {Object.entries(costData.byPlatform)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, cost], idx) => (
                    <div
                      key={platform}
                      className={`flex p-2 border-b border-zinc-200 dark:border-zinc-700 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800'
                      }`}
                    >
                      <div className="flex-[2] text-sm">{platform}</div>
                      <div className="flex-1 text-right text-sm font-medium">
                        ${cost.toFixed(2)}
                      </div>
                      <div className="flex-1 text-right text-sm text-zinc-500 dark:text-zinc-400">
                        {((cost / costData.totalCost) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
