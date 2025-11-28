'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Settings,
  Eye,
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
  };
}

interface JudgeConfig {
  apiKey: string;
  provider: string;
  model: string;
  passThreshold: number;
}

export default function LLMJudgePage() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<LLMTrace | null>(null);
  const [judgeConfig, setJudgeConfig] = useState<JudgeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    status: 'pass' | 'fail' | 'review';
    reasoning: string;
    judgeResponse?: string;
  } | null>(null);
  const [showTraceSelector, setShowTraceSelector] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('pending');

  useEffect(() => {
    // Load judge config
    const storedConfig = localStorage.getItem('cert-judge-config-v2');
    if (storedConfig) {
      setJudgeConfig(JSON.parse(storedConfig));
    }
    loadTraces();
  }, []);

  const loadTraces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/traces?llmOnly=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        setTraces(data.traces || []);
      }
    } catch (e) {
      console.error('Failed to load traces:', e);
    }
    setLoading(false);
  };

  const filteredTraces = traces.filter(t => {
    if (filter === 'pending') return !t.evaluation;
    if (filter === 'evaluated') return !!t.evaluation;
    return true;
  });

  const runEvaluation = async () => {
    if (!selectedTrace || !judgeConfig || !judgeConfig.apiKey) return;

    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const response = await fetch('/api/quality/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traceId: selectedTrace.id,
          input: selectedTrace.llm?.input || '',
          output: selectedTrace.llm?.output || '',
          config: judgeConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluationResult(data);

        // Update the trace in local state
        setTraces(prev => prev.map(t =>
          t.id === selectedTrace.id
            ? {
                ...t,
                evaluation: {
                  score: data.score,
                  status: data.status,
                  judgeModel: judgeConfig.model,
                  evaluatedAt: new Date().toISOString(),
                  reasoning: data.reasoning,
                },
              }
            : t
        ));

        // Update selected trace
        setSelectedTrace(prev => prev ? {
          ...prev,
          evaluation: {
            score: data.score,
            status: data.status,
            judgeModel: judgeConfig.model,
            evaluatedAt: new Date().toISOString(),
            reasoning: data.reasoning,
          },
        } : null);
      } else {
        const error = await response.json();
        setEvaluationResult({
          score: 0,
          status: 'review',
          reasoning: error.error || 'Evaluation failed',
        });
      }
    } catch (e) {
      setEvaluationResult({
        score: 0,
        status: 'review',
        reasoning: 'Failed to run evaluation. Check your API configuration.',
      });
    }

    setEvaluating(false);
  };

  const isConfigured = judgeConfig && judgeConfig.apiKey && judgeConfig.model;

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
            <Zap className="w-7 h-7 text-[#10069F] dark:text-[#9fc2e9]" />
            LLM Judge
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Evaluate LLM traces using an AI judge model
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

      {/* Current Judge Config */}
      {isConfigured && (
        <div className="bg-[#10069F]/10 dark:bg-[#10069F]/10 border border-[#10069F]/30 dark:border-[#10069F]/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#10069F] dark:text-[#7ea0bf]" />
              <div>
                <p className="text-sm font-medium text-[#10069F] dark:text-[#7ea0bf]">
                  Judge Model: {judgeConfig.provider}/{judgeConfig.model}
                </p>
                <p className="text-xs text-[#10069F] dark:text-[#7ea0bf]">
                  Pass threshold: {judgeConfig.passThreshold}/10
                </p>
              </div>
            </div>
            <Link
              href="/configuration"
              className="text-sm text-[#10069F] dark:text-[#7ea0bf] hover:underline"
            >
              Change →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trace Selection */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Select Trace</h2>
              <div className="flex items-center gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'evaluated')}
                  className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="evaluated">Evaluated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {filteredTraces.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">No traces found</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredTraces.map((trace) => (
                  <button
                    key={trace.id}
                    onClick={() => {
                      setSelectedTrace(trace);
                      setEvaluationResult(null);
                    }}
                    className={cn(
                      "w-full px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors",
                      selectedTrace?.id === trace.id && "bg-[#10069F]/10 dark:bg-[#10069F]/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {trace.llm?.model || 'Unknown model'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {trace.llm?.vendor} • {trace.durationMs}ms
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate">
                          {trace.llm?.input?.slice(0, 60) || 'No input'}...
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {trace.evaluation ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                              trace.evaluation.status === 'pass'
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : trace.evaluation.status === 'fail'
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            )}
                          >
                            {trace.evaluation.status === 'pass' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : trace.evaluation.status === 'fail' ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {trace.evaluation.score?.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            Not evaluated
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trace Details & Evaluation */}
        <div className="space-y-6">
          {selectedTrace ? (
            <>
              {/* Trace Details */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="font-semibold text-zinc-900 dark:text-white">Trace Details</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {selectedTrace.llm?.vendor}/{selectedTrace.llm?.model}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Input (Prompt)
                    </label>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {selectedTrace.llm?.input || 'No input data'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Output (Response)
                    </label>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {selectedTrace.llm?.output || 'No output data'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Tokens:</span>{' '}
                      <span className="text-zinc-900 dark:text-white">
                        {selectedTrace.llm?.promptTokens || 0} / {selectedTrace.llm?.completionTokens || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Duration:</span>{' '}
                      <span className="text-zinc-900 dark:text-white">
                        {selectedTrace.durationMs}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evaluation Actions */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                  Run Evaluation
                </h3>

                <button
                  onClick={runEvaluation}
                  disabled={!isConfigured || evaluating}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                    !isConfigured || evaluating
                      ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed"
                      : "bg-[#10069F] text-white hover:bg-[#0d0580]"
                  )}
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating with {judgeConfig?.model}...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Evaluate with {judgeConfig?.provider}/{judgeConfig?.model}
                    </>
                  )}
                </button>

                {/* Previous Evaluation */}
                {selectedTrace.evaluation && !evaluationResult && (
                  <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Previous Evaluation
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          selectedTrace.evaluation.status === 'pass'
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : selectedTrace.evaluation.status === 'fail'
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        )}
                      >
                        {selectedTrace.evaluation.status}: {selectedTrace.evaluation.score?.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Judged by: {selectedTrace.evaluation.judgeModel}
                    </p>
                    {selectedTrace.evaluation.reasoning && (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
                        {selectedTrace.evaluation.reasoning}
                      </p>
                    )}
                  </div>
                )}

                {/* Evaluation Result */}
                {evaluationResult && (
                  <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        Evaluation Result
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                          evaluationResult.status === 'pass'
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : evaluationResult.status === 'fail'
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        )}
                      >
                        {evaluationResult.status === 'pass' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : evaluationResult.status === 'fail' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        Score: {evaluationResult.score.toFixed(1)}/10
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {evaluationResult.reasoning}
                    </p>
                    {evaluationResult.judgeResponse && (
                      <details className="mt-3">
                        <summary className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                          View full judge response
                        </summary>
                        <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {evaluationResult.judgeResponse}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
              <Eye className="w-8 h-8 text-[#10069F] dark:text-[#9fc2e9] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Select a trace to evaluate
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Choose a trace from the list to view its details and run an AI evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Traces</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {traces.length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Evaluated</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {traces.filter(t => t.evaluation).length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Passed</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {traces.filter(t => t.evaluation?.status === 'pass').length}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Failed</span>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {traces.filter(t => t.evaluation?.status === 'fail').length}
          </p>
        </div>
      </div>
    </div>
  );
}
