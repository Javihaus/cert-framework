'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Save,
  Star,
  FileText,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CircularProgress from '@mui/material/CircularProgress';
import Slider from '@mui/material/Slider';

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
    context?: string | string[];  // Source context/retrieved chunks
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
    groundingScore?: number;  // How well output is grounded in context
  };
}

export default function HumanReviewPage() {
  const [traces, setTraces] = useState<LLMTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<LLMTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [score, setScore] = useState<number>(7);
  const [notes, setNotes] = useState('');
  const [passThreshold, setPassThreshold] = useState(7);
  const [contextExpanded, setContextExpanded] = useState(true);

  useEffect(() => {
    // Load pass threshold from config
    const storedConfig = localStorage.getItem('cert-judge-config-v2');
    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      setPassThreshold(config.passThreshold || 7);
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
    if (filter === 'pending') return !t.evaluation?.humanScore;
    if (filter === 'reviewed') return !!t.evaluation?.humanScore;
    return true;
  });

  const handleSelectTrace = (trace: LLMTrace) => {
    setSelectedTrace(trace);
    setScore(trace.evaluation?.humanScore || 7);
    setNotes(trace.evaluation?.humanNotes || '');
  };

  const handleSaveReview = async () => {
    if (!selectedTrace) return;

    setSaving(true);
    try {
      const status = score >= passThreshold ? 'pass' : score >= passThreshold * 0.6 ? 'review' : 'fail';

      const response = await fetch('/api/quality/human-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traceId: selectedTrace.id,
          score,
          notes,
          status,
        }),
      });

      if (response.ok) {
        // Update local state
        setTraces(prev => prev.map(t =>
          t.id === selectedTrace.id
            ? {
                ...t,
                evaluation: {
                  ...t.evaluation,
                  humanScore: score,
                  humanNotes: notes,
                  humanReviewedAt: new Date().toISOString(),
                  status,
                  score,
                },
              }
            : t
        ));

        // Update selected trace
        setSelectedTrace(prev => prev ? {
          ...prev,
          evaluation: {
            ...prev.evaluation,
            humanScore: score,
            humanNotes: notes,
            humanReviewedAt: new Date().toISOString(),
            status,
            score,
          },
        } : null);
      }
    } catch (e) {
      console.error('Failed to save review:', e);
    }
    setSaving(false);
  };

  const pendingCount = traces.filter(t => !t.evaluation?.humanScore).length;
  const reviewedCount = traces.filter(t => t.evaluation?.humanScore).length;
  const passedCount = traces.filter(t => t.evaluation?.status === 'pass').length;
  const failedCount = traces.filter(t => t.evaluation?.status === 'fail').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircularProgress size={32} sx={{ color: '#10069F' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <User className="w-7 h-7 text-[#10069F] dark:text-[#9fc2e9]" />
            Human Review
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Rate LLM traces on a 0-10 scale
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Pending Review</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Reviewed</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {reviewedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Passed</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {passedCount}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Failed</span>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {failedCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trace List */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Select Trace</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'reviewed')}
                className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded"
              >
                <option value="all">All ({traces.length})</option>
                <option value="pending">Pending ({pendingCount})</option>
                <option value="reviewed">Reviewed ({reviewedCount})</option>
              </select>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {filteredTraces.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-3" />
                <p className="text-zinc-500 dark:text-zinc-400">
                  {filter === 'pending' ? 'All traces reviewed!' : 'No traces found'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {filteredTraces.map((trace) => (
                  <button
                    key={trace.id}
                    onClick={() => handleSelectTrace(trace)}
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
                          {trace.llm?.input?.slice(0, 50) || 'No input'}...
                        </p>
                        {trace.llm?.context && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400">
                            <BookOpen className="w-3 h-3" />
                            Has source context
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {trace.evaluation?.humanScore !== undefined ? (
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
                            <Star className="w-3 h-3" />
                            {trace.evaluation.humanScore}/10
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            Not reviewed
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

        {/* Review Panel */}
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

                  {/* Source Context Section - for document extraction verification */}
                  {selectedTrace.llm?.context && (
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                      <button
                        onClick={() => setContextExpanded(!contextExpanded)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#10069F] dark:text-[#9fc2e9]" />
                          <label className="text-xs font-medium text-[#10069F] dark:text-[#7ea0bf]">
                            Source Context (Retrieved Chunks)
                          </label>
                          <span className="px-2 py-0.5 bg-[#10069F]/10 dark:bg-[#10069F]/20 text-[#10069F] dark:text-[#7ea0bf] text-xs rounded-full">
                            {Array.isArray(selectedTrace.llm.context)
                              ? `${selectedTrace.llm.context.length} chunks`
                              : '1 chunk'}
                          </span>
                        </div>
                        {contextExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>

                      {contextExpanded && (
                        <div className="mt-3 space-y-2">
                          {Array.isArray(selectedTrace.llm.context) ? (
                            selectedTrace.llm.context.map((chunk, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#10069F]/10 dark:bg-[#10069F]/10 border border-[#10069F]/30 dark:border-[#10069F]/30 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap"
                              >
                                <span className="text-xs font-medium text-[#10069F] dark:text-[#7ea0bf] block mb-1">
                                  Chunk {idx + 1}
                                </span>
                                {chunk}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 bg-[#10069F]/10 dark:bg-[#10069F]/10 border border-[#10069F]/30 dark:border-[#10069F]/30 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {selectedTrace.llm.context}
                            </div>
                          )}
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Use this source content to verify the accuracy of the output above
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Context Warning */}
                  {!selectedTrace.llm?.context && (
                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">
                          No source context available. Cannot verify output against source document.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Panel */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                  Rate this Response
                </h3>

                {/* Score Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-zinc-600 dark:text-zinc-400">
                      Quality Score
                    </label>
                    <span
                      className={cn(
                        "text-2xl font-bold",
                        score >= passThreshold
                          ? "text-emerald-600 dark:text-emerald-400"
                          : score >= passThreshold * 0.6
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {score}/10
                    </span>
                  </div>
                  <Slider
                    value={score}
                    onChange={(_, value) => setScore(value as number)}
                    min={0}
                    max={10}
                    step={0.5}
                    sx={{ color: '#10069F', '.dark &': { color: '#9fc2e9' } }}
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>Poor</span>
                    <span>Pass: {passThreshold}</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Quick Score Buttons */}
                <div className="flex gap-2 mb-6">
                  {[0, 2, 4, 6, 7, 8, 9, 10].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScore(s)}
                      className={cn(
                        "flex-1 py-2 rounded text-sm font-medium transition-colors",
                        score === s
                          ? "bg-[#10069F] text-white"
                          : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this response..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#10069F] resize-none"
                  />
                </div>

                {/* Status Preview */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Status:</span>
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        score >= passThreshold
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : score >= passThreshold * 0.6
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                      )}
                    >
                      {score >= passThreshold ? 'Pass' : score >= passThreshold * 0.6 ? 'Review' : 'Fail'}
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveReview}
                  disabled={saving}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                    saving
                      ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed"
                      : "bg-[#10069F] text-white hover:bg-[#0d0580]"
                  )}
                >
                  {saving ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
              <Star className="w-8 h-8 text-[#10069F] dark:text-[#9fc2e9] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Select a trace to review
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Choose a trace from the list to rate its quality.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
