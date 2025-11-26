'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Clock,
  Zap,
  User,
  Eye,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LLMTrace {
  id: string;
  traceId: string;
  name: string;
  durationMs: number;
  receivedAt: string;
  llm?: {
    vendor: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    input?: string;
    output?: string;
  };
  evaluation?: {
    score?: number;
    status?: 'pass' | 'fail' | 'review';
    judgeModel?: string;
    evaluatedAt?: string;
    reasoning?: string;
    humanScore?: number;
    humanNotes?: string;
    humanReviewedAt?: string;
    criteria?: {
      semantic?: number;
      nli?: number;
    };
  };
}

type EvalMethod = 'all' | 'auto' | 'llm' | 'human';

export default function TestResultsPage() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrace, setSelectedTrace] = useState<LLMTrace | null>(null);
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'review' | 'pending'>('all');
  const [methodFilter, setMethodFilter] = useState<EvalMethod>('all');

  const getEvalMethod = (trace: LLMTrace): 'auto' | 'llm' | 'human' | 'pending' => {
    if (!trace.evaluation?.judgeModel && !trace.evaluation?.status) return 'pending';
    if (trace.evaluation?.judgeModel === 'cert-auto-eval') return 'auto';
    if (trace.evaluation?.judgeModel) return 'llm';
    return 'human';
  };

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

  const evaluatedTraces = traces.filter(t => t.evaluation?.status);
  const pendingTraces = traces.filter(t => !t.evaluation?.status);
  const passedTraces = traces.filter(t => t.evaluation?.status === 'pass');
  const failedTraces = traces.filter(t => t.evaluation?.status === 'fail');
  const reviewTraces = traces.filter(t => t.evaluation?.status === 'review');

  // Count by method
  const autoEvalTraces = traces.filter(t => getEvalMethod(t) === 'auto');
  const llmJudgeTraces = traces.filter(t => getEvalMethod(t) === 'llm');
  const humanReviewTraces = traces.filter(t => getEvalMethod(t) === 'human');

  const filteredTraces = traces.filter(t => {
    // Status filter
    if (filter === 'pending' && t.evaluation?.status) return false;
    if (filter === 'pass' && t.evaluation?.status !== 'pass') return false;
    if (filter === 'fail' && t.evaluation?.status !== 'fail') return false;
    if (filter === 'review' && t.evaluation?.status !== 'review') return false;

    // Method filter
    if (methodFilter !== 'all') {
      const method = getEvalMethod(t);
      if (methodFilter === 'auto' && method !== 'auto') return false;
      if (methodFilter === 'llm' && method !== 'llm') return false;
      if (methodFilter === 'human' && method !== 'human') return false;
    }

    return true;
  });

  const passRate = evaluatedTraces.length > 0
    ? (passedTraces.length / evaluatedTraces.length) * 100
    : 0;

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
            <CheckCircle className="w-7 h-7 text-teal-500" />
            Test Results
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            View evaluation results for all LLM traces
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Traces</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {traces.length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Passed</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {passedTraces.length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {failedTraces.length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Review</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {reviewTraces.length}
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
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/quality/judge"
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">LLM Judge</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {pendingTraces.length} traces pending
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400" />
        </Link>

        <Link
          href="/quality/review"
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Human Review</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Rate traces manually
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400" />
        </Link>

        <Link
          href="/quality"
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Quality Overview</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Summary dashboard
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-400" />
        </Link>
      </div>

      {/* Filter & Results Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                Evaluation Results
              </h2>
              <div className="flex items-center gap-2">
                {(['all', 'pass', 'fail', 'review', 'pending'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                      filter === f
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    )}
                  >
                    {f === 'all' ? `All (${traces.length})` :
                     f === 'pass' ? `Pass (${passedTraces.length})` :
                     f === 'fail' ? `Fail (${failedTraces.length})` :
                     f === 'review' ? `Review (${reviewTraces.length})` :
                     `Pending (${pendingTraces.length})`}
                  </button>
                ))}
              </div>
            </div>
            {/* Method Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Method:</span>
              {([
                { key: 'all', label: 'All', icon: null, count: traces.length },
                { key: 'auto', label: 'Auto-Eval', icon: Sparkles, count: autoEvalTraces.length, color: 'teal' },
                { key: 'llm', label: 'LLM Judge', icon: Zap, count: llmJudgeTraces.length, color: 'purple' },
                { key: 'human', label: 'Human', icon: User, count: humanReviewTraces.length, color: 'orange' },
              ] as const).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethodFilter(m.key as EvalMethod)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    methodFilter === m.key
                      ? m.key === 'auto' ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400"
                      : m.key === 'llm' ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                      : m.key === 'human' ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  {m.icon && <m.icon className="w-3 h-3" />}
                  {m.label} ({m.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTraces.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No traces match the filter</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {filteredTraces.slice(0, 50).map((trace) => (
              <div
                key={trace.id}
                className="px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTrace(selectedTrace?.id === trace.id ? null : trace)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        trace.evaluation?.status === 'pass'
                          ? "bg-emerald-100 dark:bg-emerald-500/20"
                          : trace.evaluation?.status === 'fail'
                          ? "bg-red-100 dark:bg-red-500/20"
                          : trace.evaluation?.status === 'review'
                          ? "bg-amber-100 dark:bg-amber-500/20"
                          : "bg-zinc-100 dark:bg-zinc-700"
                      )}
                    >
                      {trace.evaluation?.status === 'pass' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : trace.evaluation?.status === 'fail' ? (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      ) : trace.evaluation?.status === 'review' ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {trace.llm?.model || 'Unknown model'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {trace.llm?.input?.slice(0, 80) || 'No input'}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {/* Evaluation Method Badge */}
                    {trace.evaluation?.judgeModel && (
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                        getEvalMethod(trace) === 'auto'
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
                      )}>
                        {getEvalMethod(trace) === 'auto' ? (
                          <><Sparkles className="w-3 h-3" /> Auto</>
                        ) : (
                          <><Zap className="w-3 h-3" /> LLM</>
                        )}
                      </span>
                    )}
                    {trace.evaluation?.status && !trace.evaluation?.judgeModel && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                        <User className="w-3 h-3" /> Human
                      </span>
                    )}
                    {trace.evaluation?.score !== undefined && (
                      <span className={cn(
                        "text-sm font-medium",
                        trace.evaluation.status === 'pass'
                          ? "text-emerald-600 dark:text-emerald-400"
                          : trace.evaluation.status === 'fail'
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}>
                        {trace.evaluation.score.toFixed(1)}/10
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {trace.llm?.vendor}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {trace.durationMs}ms
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTrace?.id === trace.id && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    {/* Auto-Eval Score Breakdown */}
                    {trace.evaluation?.criteria && (
                      <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-500/10 rounded-lg border border-teal-200 dark:border-teal-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-xs font-medium text-teal-800 dark:text-teal-300">CERT Auto-Evaluation Breakdown</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-teal-700 dark:text-teal-400">Semantic Similarity</span>
                              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                                {((trace.evaluation.criteria.semantic || 0) * 10).toFixed(1)}/10
                              </span>
                            </div>
                            <div className="h-1.5 bg-teal-200 dark:bg-teal-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 transition-all"
                                style={{ width: `${(trace.evaluation.criteria.semantic || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-teal-700 dark:text-teal-400">NLI Score</span>
                              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                                {((trace.evaluation.criteria.nli || 0) * 10).toFixed(1)}/10
                              </span>
                            </div>
                            <div className="h-1.5 bg-teal-200 dark:bg-teal-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 transition-all"
                                style={{ width: `${(trace.evaluation.criteria.nli || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Input
                        </label>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded text-xs text-zinc-700 dark:text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {trace.llm?.input || 'No input'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Output
                        </label>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded text-xs text-zinc-700 dark:text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {trace.llm?.output || 'No output'}
                        </div>
                      </div>
                    </div>
                    {trace.evaluation?.reasoning && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                          Evaluation Reasoning
                        </label>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300">
                          {trace.evaluation.reasoning}
                        </p>
                      </div>
                    )}
                    {trace.evaluation?.judgeModel && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                        Evaluated by: {trace.evaluation.judgeModel === 'cert-auto-eval' ? 'CERT Auto-Evaluation' : trace.evaluation.judgeModel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredTraces.length > 50 && (
          <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-700 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing 50 of {filteredTraces.length} traces
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
