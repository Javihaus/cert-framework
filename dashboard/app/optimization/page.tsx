'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import RecommendationCard from '@/components/RecommendationCard';
import MetricCard from '@/components/MetricCard';
import Card from '@/components/Card';
import { LuRepeat2, LuDollarSign, LuTrendingDown, LuTarget, LuPackage } from 'react-icons/lu';
import { Trace, OptimizationOpportunity } from '@/types/trace';
import { TraceAnalyzer } from '@/lib/trace-analyzer';

export default function OptimizationPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationOpportunity[]>([]);
  const [sortBy, setSortBy] = useState<'savings' | 'impact'>('savings');

  const handleFileLoad = (data: Trace[] | Trace) => {
    // FileUpload already parses JSONL/JSON, so data is already an array or object
    const parsed = Array.isArray(data) ? data : [data];
    setTraces(parsed);
    analyzeOptimizations(parsed);
  };

  const analyzeOptimizations = (allTraces: Trace[]) => {
    const analyzer = new TraceAnalyzer(allTraces);
    const opportunities = analyzer.findOptimizations();
    setRecommendations(opportunities);
  };

  // Sort recommendations
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (sortBy === 'savings') {
      return b.potentialSavings - a.potentialSavings;
    } else {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    }
  });

  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
  const highImpactCount = recommendations.filter((r) => r.impact === 'high').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            Optimization Opportunities
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Discover opportunities to reduce AI costs
          </p>
        </div>

        {recommendations.length > 0 && (
          <div className="w-[200px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'savings' | 'impact')}
              className="w-full px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm cursor-pointer text-zinc-900 dark:text-white"
            >
              <option value="savings">Sort by Savings</option>
              <option value="impact">Sort by Impact</option>
            </select>
          </div>
        )}
      </div>

      {/* LuFile upload */}
      {recommendations.length === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8">
            <LuRepeat2 size={48} className="text-amber-500" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              LuUpload trace file to find optimization opportunities
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-[500px]">
              LuUpload your cert_traces.jsonl file to discover ways to reduce costs
            </p>
            <div className="w-full max-w-[500px]">
              <FileUpload onFileLoad={handleFileLoad} accept=".jsonl,.json" label="LuUpload Trace LuFile" />
            </div>
          </div>
        </Card>
      )}

      {/* Summary Metrics */}
      {recommendations.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MetricCard
              label="Potential Savings"
              value={`$${totalSavings.toFixed(2)}`}
              icon={LuDollarSign}
              variant="success"
            />
            <MetricCard
              label="Opportunities Found"
              value={recommendations.length.toString()}
              icon={LuTarget}
              variant="default"
            />
            <MetricCard
              label="Traces Analyzed"
              value={traces.length.toString()}
              icon={LuPackage}
              variant="default"
            />
          </div>

          {/* Recommendations List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Recommendations
              </h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {sortedRecommendations.length} optimization{sortedRecommendations.length !== 1 ? 's' : ''} available
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {sortedRecommendations.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  type={rec.type === 'batch_processing' ? 'batching' : rec.type}
                  description={rec.description}
                  savings={`$${rec.potentialSavings.toFixed(2)}`}
                  impact={rec.impact}
                  details={rec.details}
                  onApply={() => {
                    // TODO: Implement apply logic (e.g., generate code snippet)
                    alert(`Apply ${rec.type}: ${rec.description}`);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Implementation Guide */}
          <Card className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              How to Implement These Optimizations
            </h2>
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Model Downgrades:
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Change your model parameter in API calls. Test with a sample of production prompts to verify quality remains acceptable.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Caching:
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Implement semantic caching with Redis or use prompt caching features from Anthropic (Claude) or OpenAI.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Prompt Optimization:
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Remove redundant context, use system messages effectively, and compress verbose instructions.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Batch Processing:
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Group similar API calls together and process them in batches to reduce overhead.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
