'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Zap,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LLMTrace {
  id: string;
  llm?: {
    vendor: string;
    model: string;
    input?: string;
    output?: string;
  };
  evaluation?: {
    score?: number;
    status?: 'pass' | 'fail' | 'review';
    judgeModel?: string;
    evaluatedAt?: string;
  };
  receivedAt: string;
  durationMs: number;
}

export default function QualityDashboard() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraces();
  }, []);

  const loadTraces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/traces?llmOnly=true&limit=200');
      if (response.ok) {
        const data = await response.json();
        setTraces(data.traces || []);
      }
    } catch (e) {
      console.error('Failed to load traces:', e);
    }
    setLoading(false);
  };

  // Calculate metrics from traces
  const totalTraces = traces.length;
  const evaluatedTraces = traces.filter(t => t.evaluation?.status);
  const passedTraces = traces.filter(t => t.evaluation?.status === 'pass');
  const failedTraces = traces.filter(t => t.evaluation?.status === 'fail');
  const reviewTraces = traces.filter(t => t.evaluation?.status === 'review');
  const pendingTraces = traces.filter(t => !t.evaluation?.status);

  const passRate = evaluatedTraces.length > 0
    ? (passedTraces.length / evaluatedTraces.length) * 100
    : 0;

  const avgScore = evaluatedTraces.length > 0
    ? evaluatedTraces.reduce((sum, t) => sum + (t.evaluation?.score || 0), 0) / evaluatedTraces.length
    : 0;

  // Get recent evaluations
  const recentEvaluations = evaluatedTraces
    .sort((a, b) => {
      const dateA = a.evaluation?.evaluatedAt || a.receivedAt;
      const dateB = b.evaluation?.evaluatedAt || b.receivedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 5);

  // Get traces by model
  const tracesByModel = traces.reduce((acc, t) => {
    const model = t.llm?.model || 'unknown';
    if (!acc[model]) {
      acc[model] = { total: 0, passed: 0, failed: 0, review: 0 };
    }
    acc[model].total++;
    if (t.evaluation?.status === 'pass') acc[model].passed++;
    if (t.evaluation?.status === 'fail') acc[model].failed++;
    if (t.evaluation?.status === 'review') acc[model].review++;
    return acc;
  }, {} as Record<string, { total: number; passed: number; failed: number; review: number }>);

  const hasData = totalTraces > 0;

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
            <LayoutDashboard className="w-7 h-7 text-[#3C6098]" />
            Quality Overview
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Track evaluation quality metrics across all LLM traces
          </p>
        </div>
        <button
          onClick={loadTraces}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-[#3C6098]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-[#3C6098]" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No traces yet
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Run your LLM application with the CERT tracer to start collecting traces. Then evaluate them using LLM Judge or Human Review.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/observability"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
            >
              View Traces
            </Link>
            <Link
              href="/quality/judge"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3C6098] text-white rounded-lg hover:bg-[#3C6098]/90 transition-colors"
            >
              <Zap className="w-4 h-4" />
              LLM Judge
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Traces</span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {totalTraces}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Evaluated</span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {evaluatedTraces.length}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Pass Rate</span>
              <p className={cn(
                "text-2xl font-bold mt-1",
                passRate >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                passRate >= 50 ? "text-amber-600 dark:text-amber-400" :
                "text-red-600 dark:text-red-400"
              )}>
                {evaluatedTraces.length > 0 ? `${passRate.toFixed(0)}%` : '-'}
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Avg Score</span>
              <p className={cn(
                "text-2xl font-bold mt-1",
                avgScore >= 7 ? "text-emerald-600 dark:text-emerald-400" :
                avgScore >= 5 ? "text-amber-600 dark:text-amber-400" :
                "text-red-600 dark:text-red-400"
              )}>
                {evaluatedTraces.length > 0 ? avgScore.toFixed(1) : '-'}
              </p>
            </div>
            <Link
              href="/quality/review"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors"
            >
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Pending Review</span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {pendingTraces.length}
                {pendingTraces.length > 0 && (
                  <ArrowRight className="w-4 h-4 inline ml-2 text-orange-500" />
                )}
              </p>
            </Link>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Evaluation Status</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {passedTraces.length}
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Passed</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {failedTraces.length}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">Failed</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {reviewTraces.length}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">Review</p>
              </div>
              <div className="text-center p-4 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
                <Clock className="w-8 h-8 text-zinc-500 dark:text-zinc-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-300">
                  {pendingTraces.length}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending</p>
              </div>
            </div>
          </div>

          {/* Quality by Model */}
          {Object.keys(tracesByModel).length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Quality by Model</h2>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {Object.entries(tracesByModel)
                  .sort((a, b) => b[1].total - a[1].total)
                  .slice(0, 5)
                  .map(([model, stats]) => {
                    const modelPassRate = stats.total > 0 && (stats.passed + stats.failed + stats.review) > 0
                      ? (stats.passed / (stats.passed + stats.failed + stats.review)) * 100
                      : null;
                    return (
                      <div key={model} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {model}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {stats.total} traces
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400">{stats.passed} pass</span>
                            <span className="text-red-600 dark:text-red-400">{stats.failed} fail</span>
                            <span className="text-amber-600 dark:text-amber-400">{stats.review} review</span>
                          </div>
                          {modelPassRate !== null && (
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              modelPassRate >= 80
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : modelPassRate >= 50
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            )}>
                              {modelPassRate.toFixed(0)}% pass
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent Evaluations */}
          {recentEvaluations.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-900 dark:text-white">Recent Evaluations</h2>
                <Link
                  href="/quality/tests"
                  className="text-sm text-[#3C6098] hover:text-[#3C6098]/80"
                >
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {recentEvaluations.map((trace) => (
                  <div key={trace.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        trace.evaluation?.status === 'pass'
                          ? "bg-emerald-100 dark:bg-emerald-500/20"
                          : trace.evaluation?.status === 'fail'
                          ? "bg-red-100 dark:bg-red-500/20"
                          : "bg-amber-100 dark:bg-amber-500/20"
                      )}>
                        {trace.evaluation?.status === 'pass' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : trace.evaluation?.status === 'fail' ? (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {trace.llm?.model || 'Unknown model'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {trace.llm?.vendor} • {trace.durationMs}ms
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-medium",
                        (trace.evaluation?.score || 0) >= 7
                          ? "text-emerald-600 dark:text-emerald-400"
                          : (trace.evaluation?.score || 0) >= 5
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {trace.evaluation?.score?.toFixed(1) || '-'}/10
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        trace.evaluation?.status === 'pass'
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : trace.evaluation?.status === 'fail'
                          ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      )}>
                        {trace.evaluation?.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {pendingTraces.length > 0 && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  {pendingTraces.length} traces pending evaluation
                </p>
              )}
            </Link>

            <Link
              href="/quality/review"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-zinc-900 dark:text-white">Human Review</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 ml-auto transition-colors" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Rate traces manually on a 0-10 scale
              </p>
            </Link>

            <Link
              href="/quality/tests"
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-teal-300 dark:hover:border-teal-500/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <span className="font-medium text-zinc-900 dark:text-white">Test Results</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-500 ml-auto transition-colors" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                View all evaluation results
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
