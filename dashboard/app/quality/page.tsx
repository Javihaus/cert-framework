'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Zap,
  User,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityMetrics {
  passRate: number;
  passRateTrend: number;
  tracesEvaluated: number;
  pendingReview: number;
  criteriaScores: {
    accuracy: number;
    relevance: number;
    safety: number;
    coherence: number;
  };
  recentEvaluations: {
    id: string;
    time: string;
    model: string;
    score: number;
    status: 'pass' | 'review' | 'fail';
  }[];
}

export default function QualityDashboard() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    // Load real metrics from API or localStorage
    const loadMetrics = async () => {
      setLoading(true);
      try {
        // Try to get from API first
        const response = await fetch(`/api/quality/summary?range=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          // Fall back to empty state
          setMetrics({
            passRate: 0,
            passRateTrend: 0,
            tracesEvaluated: 0,
            pendingReview: 0,
            criteriaScores: {
              accuracy: 0,
              relevance: 0,
              safety: 0,
              coherence: 0,
            },
            recentEvaluations: [],
          });
        }
      } catch (e) {
        // No evaluations yet - show empty state
        setMetrics({
          passRate: 0,
          passRateTrend: 0,
          tracesEvaluated: 0,
          pendingReview: 0,
          criteriaScores: {
            accuracy: 0,
            relevance: 0,
            safety: 0,
            coherence: 0,
          },
          recentEvaluations: [],
        });
      }
      setLoading(false);
    };

    loadMetrics();
  }, [timeRange]);

  const hasData = metrics && metrics.tracesEvaluated > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-purple-500" />
            Quality Overview
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Is the output good? Track evaluation quality metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
          >
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
        </div>
      ) : !hasData ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No evaluations yet
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Run your first LLM evaluation to see quality metrics here. You can evaluate traces manually or in batch mode.
          </p>
          <Link
            href="/quality/judge"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Run First Evaluation
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Pass Rate</span>
                {metrics.passRateTrend !== 0 && (
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    metrics.passRateTrend > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {metrics.passRateTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(metrics.passRateTrend).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {metrics.passRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Traces Evaluated</span>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                {metrics.tracesEvaluated.toLocaleString()}
              </p>
            </div>

            <Link
              href="/quality/review"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Need Review</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {metrics.pendingReview}
                {metrics.pendingReview > 0 && (
                  <span className="ml-2 text-sm font-normal text-orange-600 dark:text-orange-400">
                    Pending
                  </span>
                )}
              </p>
            </Link>
          </div>

          {/* Quality by Criteria */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Quality by Criteria</h2>
            <div className="space-y-4">
              {[
                { key: 'accuracy', label: 'Accuracy', score: metrics.criteriaScores.accuracy },
                { key: 'relevance', label: 'Relevance', score: metrics.criteriaScores.relevance },
                { key: 'safety', label: 'Safety', score: metrics.criteriaScores.safety },
                { key: 'coherence', label: 'Coherence', score: metrics.criteriaScores.coherence },
              ].map((criterion) => (
                <div key={criterion.key} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400">
                    {criterion.label}
                  </span>
                  <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        criterion.score >= 90 ? "bg-emerald-500" :
                        criterion.score >= 70 ? "bg-blue-500" :
                        criterion.score >= 50 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${criterion.score}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm font-medium text-zinc-900 dark:text-white text-right">
                    {criterion.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Evaluations */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Recent Evaluations</h2>
              <Link
                href="/quality/judge"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {metrics.recentEvaluations.length === 0 ? (
                <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  No recent evaluations
                </div>
              ) : (
                metrics.recentEvaluations.map((evaluation) => (
                  <div key={evaluation.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        evaluation.status === 'pass' ? "bg-emerald-100 dark:bg-emerald-500/20" :
                        evaluation.status === 'review' ? "bg-amber-100 dark:bg-amber-500/20" :
                        "bg-red-100 dark:bg-red-500/20"
                      )}>
                        {evaluation.status === 'pass' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : evaluation.status === 'review' ? (
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {evaluation.model}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {evaluation.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "text-sm font-mono font-medium",
                        evaluation.score >= 0.8 ? "text-emerald-600 dark:text-emerald-400" :
                        evaluation.score >= 0.5 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-600 dark:text-red-400"
                      )}>
                        {evaluation.score.toFixed(2)}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        evaluation.status === 'pass' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                        evaluation.status === 'review' ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                      )}>
                        {evaluation.status === 'pass' ? 'Pass' : evaluation.status === 'review' ? 'Review' : 'Fail'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/quality/judge"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-zinc-900 dark:text-white">LLM Judge</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 ml-auto transition-colors" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Run automated evaluations using AI
              </p>
            </Link>

            <Link
              href="/quality/review"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-zinc-900 dark:text-white">Human Review</span>
                {metrics.pendingReview > 0 && (
                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full">
                    {metrics.pendingReview}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 ml-auto transition-colors" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Review flagged outputs manually
              </p>
            </Link>

            <Link
              href="/quality/tests"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-teal-300 dark:hover:border-teal-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-teal-500" />
                <span className="font-medium text-zinc-900 dark:text-white">Test Results</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-500 ml-auto transition-colors" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                View unit test results
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
