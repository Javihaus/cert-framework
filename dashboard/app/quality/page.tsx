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
  Sparkles,
  Play,
  Loader2,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoEvalConfig {
  enabled: boolean;
  semanticWeight: number;
  nliWeight: number;
  passThreshold: number;
}

interface LLMTrace {
  id: string;
  llm?: {
    vendor: string;
    model: string;
    input?: string;
    output?: string;
    context?: string | string[];  // Source context for grounding check
  };
  evaluation?: {
    score?: number;
    status?: 'pass' | 'fail' | 'review';
    judgeModel?: string;
    evaluatedAt?: string;
    criteria?: {
      semantic?: number;
      nli?: number;
      grounding?: number;
    };
  };
  receivedAt: string;
  durationMs: number;
}

type StatusFilter = 'all' | 'pass' | 'fail' | 'review' | 'pending';
type MethodFilter = 'all' | 'auto' | 'llm' | 'human' | 'grounding';

export default function QualityOverview() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoEvalConfig, setAutoEvalConfig] = useState<AutoEvalConfig | null>(null);
  const [runningAutoEval, setRunningAutoEval] = useState(false);
  const [runningGrounding, setRunningGrounding] = useState(false);
  const [autoEvalProgress, setAutoEvalProgress] = useState({ current: 0, total: 0 });
  const [groundingProgress, setGroundingProgress] = useState({ current: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [selectedTrace, setSelectedTrace] = useState<LLMTrace | null>(null);

  const getEvalMethod = (trace: LLMTrace): 'auto' | 'llm' | 'human' | 'grounding' | 'pending' => {
    if (!trace.evaluation?.judgeModel && !trace.evaluation?.status) return 'pending';
    if (trace.evaluation?.judgeModel?.includes('cert-auto-eval')) return 'auto';
    if (trace.evaluation?.judgeModel?.includes('cert-grounding')) return 'grounding';
    if (trace.evaluation?.judgeModel) return 'llm';
    return 'human';
  };

  useEffect(() => {
    loadTraces();
    loadAutoEvalConfig();
  }, []);

  const loadAutoEvalConfig = () => {
    const saved = localStorage.getItem('cert-auto-eval-config');
    if (saved) {
      try {
        setAutoEvalConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load auto-eval config', e);
      }
    }
  };

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

  const runAutoEvaluation = async () => {
    const pending = traces.filter(t => !t.evaluation?.status && t.llm?.input && t.llm?.output);
    if (pending.length === 0) {
      alert('No pending traces to evaluate.');
      return;
    }

    setRunningAutoEval(true);
    setAutoEvalProgress({ current: 0, total: Math.min(pending.length, 10) });

    try {
      const toEvaluate = pending.slice(0, 10).map(t => ({
        id: t.id,
        input: t.llm?.input || '',
        output: t.llm?.output || '',
      }));

      const response = await fetch('/api/quality/auto-eval', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traces: toEvaluate,
          semanticWeight: autoEvalConfig?.semanticWeight ?? 30,
          nliWeight: autoEvalConfig?.nliWeight ?? 70,
          passThreshold: autoEvalConfig?.passThreshold ?? 7,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAutoEvalProgress({ current: result.evaluated, total: result.evaluated });
        await loadTraces();
      } else {
        const error = await response.json();
        alert(`Auto-evaluation failed: ${error.error}`);
      }
    } catch (e) {
      console.error('Auto-evaluation error:', e);
      alert('Auto-evaluation failed. Check the console for details.');
    }

    setRunningAutoEval(false);
  };

  const runGroundingCheck = async () => {
    // Get traces with context that haven't been evaluated with grounding
    const pendingWithContext = traces.filter(
      t => t.llm?.context && t.llm?.output && !t.evaluation?.criteria?.grounding
    );

    if (pendingWithContext.length === 0) {
      alert('No traces with source context available for grounding check.');
      return;
    }

    setRunningGrounding(true);
    setGroundingProgress({ current: 0, total: Math.min(pendingWithContext.length, 10) });

    try {
      const toEvaluate = pendingWithContext.slice(0, 10).map(t => ({
        id: t.id,
        output: t.llm?.output || '',
        context: t.llm?.context || '',
      }));

      const response = await fetch('/api/quality/grounding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traces: toEvaluate,
          passThreshold: autoEvalConfig?.passThreshold ?? 7,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGroundingProgress({ current: result.evaluated, total: result.evaluated });
        await loadTraces();
      } else {
        const error = await response.json();
        alert(`Grounding check failed: ${error.error}`);
      }
    } catch (e) {
      console.error('Grounding check error:', e);
      alert('Grounding check failed. Check the console for details.');
    }

    setRunningGrounding(false);
  };

  // Calculate metrics
  const evaluatedTraces = traces.filter(t => t.evaluation?.status);
  const passedTraces = traces.filter(t => t.evaluation?.status === 'pass');
  const failedTraces = traces.filter(t => t.evaluation?.status === 'fail');
  const reviewTraces = traces.filter(t => t.evaluation?.status === 'review');
  const pendingTraces = traces.filter(t => !t.evaluation?.status);

  // Breakdown by method
  const autoEvalTraces = traces.filter(t => getEvalMethod(t) === 'auto');
  const llmJudgeTraces = traces.filter(t => getEvalMethod(t) === 'llm');
  const humanReviewTraces = traces.filter(t => getEvalMethod(t) === 'human');
  const groundingTraces = traces.filter(t => getEvalMethod(t) === 'grounding');
  const tracesWithContext = traces.filter(t => t.llm?.context);

  const passRate = evaluatedTraces.length > 0
    ? (passedTraces.length / evaluatedTraces.length) * 100
    : 0;

  // Filtered traces
  const filteredTraces = traces.filter(t => {
    if (statusFilter === 'pending' && t.evaluation?.status) return false;
    if (statusFilter === 'pass' && t.evaluation?.status !== 'pass') return false;
    if (statusFilter === 'fail' && t.evaluation?.status !== 'fail') return false;
    if (statusFilter === 'review' && t.evaluation?.status !== 'review') return false;

    if (methodFilter !== 'all') {
      const method = getEvalMethod(t);
      if (methodFilter === 'auto' && method !== 'auto') return false;
      if (methodFilter === 'llm' && method !== 'llm') return false;
      if (methodFilter === 'human' && method !== 'human') return false;
      if (methodFilter === 'grounding' && method !== 'grounding') return false;
    }

    return true;
  });

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
          <h1 className="text-[22px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
            Quality Overview
          </h1>
          <p className="text-[15px] text-[#596780] dark:text-[#8792A2] mt-1">
            Evaluate LLM traces using automatic validation, LLM judge, or human review
          </p>
        </div>
        <button
          onClick={loadTraces}
          className="flex items-center gap-2 px-4 py-2 border border-[#E3E8EE] dark:border-[#1D2530] text-[#596780] dark:text-[#8792A2] rounded-lg hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Quick Actions - Evaluation Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Auto-Eval Card */}
        <button
          onClick={runAutoEvaluation}
          disabled={runningAutoEval || pendingTraces.length === 0}
          className={cn(
            "bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-5 text-left transition-colors group",
            pendingTraces.length > 0
              ? "hover:border-[#222d4a] hover:border-2 cursor-pointer"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-[#33436e]" />
            <div className="flex-1">
              <span className="font-medium text-[#0A2540] dark:text-[#E8ECF1]">Auto-Eval</span>
              {runningAutoEval ? (
                <div className="flex items-center gap-2 text-xs text-[#33436e] dark:text-[#7ea0bf]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Evaluating {autoEvalProgress.current}/{autoEvalProgress.total}...
                </div>
              ) : pendingTraces.length > 0 ? (
                <p className="text-xs text-[#33436e] dark:text-[#7ea0bf]">{pendingTraces.length} pending · {autoEvalTraces.length} evaluated</p>
              ) : (
                <p className="text-xs text-[#8792A2]">{autoEvalTraces.length} evaluated · No pending</p>
              )}
            </div>
            {pendingTraces.length > 0 && !runningAutoEval && (
              <Play className="w-5 h-5 text-[#33436e] group-hover:text-[#222d4a] transition-colors" />
            )}
          </div>
          <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
            Automatic validation using semantic similarity + NLI
          </p>
        </button>

        {/* LLM Judge Card */}
        <Link
          href="/quality/judge"
          className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-5 hover:border-[#222d4a] hover:border-2 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-[#33436e]" />
            <div className="flex-1">
              <span className="font-medium text-[#0A2540] dark:text-[#E8ECF1]">LLM Judge</span>
              <p className="text-xs text-[#33436e] dark:text-[#7ea0bf]">{llmJudgeTraces.length} evaluated</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#33436e] group-hover:text-[#222d4a] transition-colors" />
          </div>
          <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
            Use another model to check accuracy
          </p>
        </Link>

        {/* Human Review Card */}
        <Link
          href="/quality/review"
          className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-5 hover:border-[#222d4a] hover:border-2 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-[#33436e]" />
            <div className="flex-1">
              <span className="font-medium text-[#0A2540] dark:text-[#E8ECF1]">Human Review</span>
              <p className="text-xs text-[#33436e] dark:text-[#7ea0bf]">{humanReviewTraces.length} reviewed</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#33436e] group-hover:text-[#222d4a] transition-colors" />
          </div>
          <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
            Check accuracy manually
          </p>
        </Link>

        {/* Grounding Check Card */}
        <button
          onClick={runGroundingCheck}
          disabled={runningGrounding || tracesWithContext.length === 0}
          className={cn(
            "bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-5 text-left transition-colors group",
            tracesWithContext.length > 0
              ? "hover:border-[#222d4a] hover:border-2 cursor-pointer"
              : "opacity-60 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-5 h-5 text-[#33436e]" />
            <div className="flex-1">
              <span className="font-medium text-[#0A2540] dark:text-[#E8ECF1]">Grounding Check</span>
              {runningGrounding ? (
                <div className="flex items-center gap-2 text-xs text-[#33436e] dark:text-[#7ea0bf]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking {groundingProgress.current}/{groundingProgress.total}...
                </div>
              ) : tracesWithContext.length > 0 ? (
                <p className="text-xs text-[#33436e] dark:text-[#7ea0bf]">
                  {tracesWithContext.length} with context · {groundingTraces.length} checked
                </p>
              ) : (
                <p className="text-xs text-[#8792A2]">No traces with source context</p>
              )}
            </div>
            {tracesWithContext.length > 0 && !runningGrounding && (
              <Play className="w-5 h-5 text-[#33436e] group-hover:text-[#222d4a] transition-colors" />
            )}
          </div>
          <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
            Verify output is grounded in source documents
          </p>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-4">
          <span className="text-[13px] text-[#596780] dark:text-[#8792A2]">Total Traces</span>
          <p className="text-2xl font-semibold text-[#0A2540] dark:text-[#E8ECF1] mt-1">
            {traces.length}
          </p>
        </div>
        <div className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-4">
          <span className="text-[13px] text-[#596780] dark:text-[#8792A2]">Passed</span>
          <p className="text-2xl font-semibold text-[#0A2540] dark:text-[#E8ECF1] mt-1">
            {passedTraces.length}
          </p>
        </div>
        <div className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-4">
          <span className="text-[13px] text-[#596780] dark:text-[#8792A2]">Failed</span>
          <p className="text-2xl font-semibold text-[#0A2540] dark:text-[#E8ECF1] mt-1">
            {failedTraces.length}
          </p>
        </div>
        <div className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-4">
          <span className="text-[13px] text-[#596780] dark:text-[#8792A2]">Review</span>
          <p className="text-2xl font-semibold text-[#0A2540] dark:text-[#E8ECF1] mt-1">
            {reviewTraces.length}
          </p>
        </div>
        <div className="bg-[#c9d4d8] dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] p-4">
          <span className="text-[13px] text-[#596780] dark:text-[#8792A2]">Pass Rate</span>
          <p className="text-2xl font-semibold text-[#0A2540] dark:text-[#E8ECF1] mt-1">
            {evaluatedTraces.length > 0 ? `${passRate.toFixed(0)}%` : '-'}
          </p>
        </div>
      </div>

      {/* Evaluation Results */}
      <div className="bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
                Evaluation Results
              </h2>
              <div className="flex items-center gap-2">
                {(['all', 'pass', 'fail', 'review', 'pending'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      statusFilter === f
                        ? "bg-[#33436e] text-white"
                        : "text-[#596780] dark:text-[#8792A2] hover:bg-[#c9d4d8] dark:hover:bg-[#1D2530]"
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
              <span className="text-xs text-[#596780] dark:text-[#8792A2]">Method:</span>
              {([
                { key: 'all', label: 'All', icon: null, count: traces.length },
                { key: 'auto', label: 'Auto-Eval', icon: Sparkles, count: autoEvalTraces.length },
                { key: 'llm', label: 'LLM Judge', icon: Zap, count: llmJudgeTraces.length },
                { key: 'human', label: 'Human', icon: User, count: humanReviewTraces.length },
                { key: 'grounding', label: 'Grounding', icon: FileCheck, count: groundingTraces.length },
              ] as const).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethodFilter(m.key as MethodFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    methodFilter === m.key
                      ? "bg-[#F6F9FC] dark:bg-[#1D2530] text-[#33436e] dark:text-[#7ea0bf] border border-[#E3E8EE] dark:border-[#1D2530]"
                      : "text-[#596780] dark:text-[#8792A2] hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530]"
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
            <p className="text-[#596780] dark:text-[#8792A2]">No traces match the filter</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E3E8EE] dark:divide-[#1D2530]">
            {filteredTraces.slice(0, 50).map((trace) => (
              <div
                key={trace.id}
                className="px-6 py-4 hover:bg-[#F6F9FC] dark:hover:bg-[#1D2530]/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTrace(selectedTrace?.id === trace.id ? null : trace)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[#F6F9FC] dark:bg-[#1D2530] flex items-center justify-center flex-shrink-0">
                      {trace.evaluation?.status === 'pass' ? (
                        <CheckCircle className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
                      ) : trace.evaluation?.status === 'fail' ? (
                        <XCircle className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
                      ) : trace.evaluation?.status === 'review' ? (
                        <AlertCircle className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#8792A2]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1] truncate">
                        {trace.llm?.model || 'Unknown model'}
                      </p>
                      <p className="text-xs text-[#596780] dark:text-[#8792A2] truncate">
                        {trace.llm?.input?.slice(0, 80) || 'No input'}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {/* Evaluation Method Badge */}
                    {trace.evaluation?.judgeModel && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#F6F9FC] dark:bg-[#1D2530] text-[#596780] dark:text-[#8792A2]">
                        {getEvalMethod(trace) === 'auto' ? (
                          <><Sparkles className="w-3 h-3" /> Auto</>
                        ) : getEvalMethod(trace) === 'grounding' ? (
                          <><FileCheck className="w-3 h-3" /> Grounding</>
                        ) : (
                          <><Zap className="w-3 h-3" /> LLM</>
                        )}
                      </span>
                    )}
                    {trace.evaluation?.status && !trace.evaluation?.judgeModel && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#F6F9FC] dark:bg-[#1D2530] text-[#596780] dark:text-[#8792A2]">
                        <User className="w-3 h-3" /> Human
                      </span>
                    )}
                    {trace.evaluation?.score !== undefined && (
                      <span className="text-sm font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                        {trace.evaluation.score.toFixed(1)}/10
                      </span>
                    )}
                    <span className="text-xs text-[#8792A2]">
                      {trace.llm?.vendor}
                    </span>
                    <span className="text-xs text-[#8792A2]">
                      {trace.durationMs}ms
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTrace?.id === trace.id && (
                  <div className="mt-4 pt-4 border-t border-[#E3E8EE] dark:border-[#1D2530]">
                    {/* Auto-Eval Score Breakdown */}
                    {trace.evaluation?.criteria && (trace.evaluation.criteria.semantic !== undefined || trace.evaluation.criteria.nli !== undefined) && (
                      <div className="mb-4 p-3 bg-[#F6F9FC] dark:bg-[#1D2530] rounded-lg border border-[#E3E8EE] dark:border-[#252D3A]">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
                          <span className="text-xs font-medium text-[#0A2540] dark:text-[#E8ECF1]">Auto-Evaluation Breakdown</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-[#596780] dark:text-[#8792A2]">Semantic Similarity</span>
                              <span className="text-xs font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                                {((trace.evaluation.criteria.semantic || 0) * 10).toFixed(1)}/10
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#E3E8EE] dark:bg-[#252D3A] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#33436e] transition-all"
                                style={{ width: `${(trace.evaluation.criteria.semantic || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-[#596780] dark:text-[#8792A2]">NLI Score</span>
                              <span className="text-xs font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                                {((trace.evaluation.criteria.nli || 0) * 10).toFixed(1)}/10
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#E3E8EE] dark:bg-[#252D3A] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#33436e] transition-all"
                                style={{ width: `${(trace.evaluation.criteria.nli || 0) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grounding Check Breakdown */}
                    {trace.evaluation?.criteria?.grounding !== undefined && (
                      <div className="mb-4 p-3 bg-[#F6F9FC] dark:bg-[#1D2530] rounded-lg border border-[#E3E8EE] dark:border-[#252D3A]">
                        <div className="flex items-center gap-2 mb-3">
                          <FileCheck className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
                          <span className="text-xs font-medium text-[#0A2540] dark:text-[#E8ECF1]">Grounding Check Results</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#596780] dark:text-[#8792A2]">Claims Grounded in Source</span>
                            <span className="text-xs font-medium text-[#0A2540] dark:text-[#E8ECF1]">
                              {(trace.evaluation.criteria.grounding * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-[#E3E8EE] dark:bg-[#252D3A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#33436e] transition-all"
                              style={{ width: `${trace.evaluation.criteria.grounding * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-[#596780] dark:text-[#8792A2] mt-2">
                            Output claims verified against source context/documents
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#596780] dark:text-[#8792A2] mb-1">
                          Input
                        </label>
                        <div className="p-3 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded text-xs text-[#0A2540] dark:text-[#E8ECF1] max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {trace.llm?.input || 'No input'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#596780] dark:text-[#8792A2] mb-1">
                          Output
                        </label>
                        <div className="p-3 bg-[#F6F9FC] dark:bg-[#0A0E14] rounded text-xs text-[#0A2540] dark:text-[#E8ECF1] max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {trace.llm?.output || 'No output'}
                        </div>
                      </div>
                    </div>
                    {trace.evaluation?.judgeModel && (
                      <p className="text-xs text-[#8792A2] mt-2">
                        Evaluated by: {trace.evaluation.judgeModel === 'cert-auto-eval' ? 'Auto-Evaluation' : trace.evaluation.judgeModel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredTraces.length > 50 && (
          <div className="px-6 py-3 border-t border-[#E3E8EE] dark:border-[#1D2530] text-center">
            <p className="text-xs text-[#596780] dark:text-[#8792A2]">
              Showing 50 of {filteredTraces.length} traces
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
