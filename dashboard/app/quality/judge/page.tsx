'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Upload,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvaluationResult {
  id: string;
  input: string;
  output: string;
  expected?: string;
  score: number;
  status: 'pass' | 'review' | 'fail';
  breakdown: {
    accuracy: number;
    relevance: number;
    safety: number;
    coherence: number;
  };
  reasoning: string;
  timestamp: string;
}

interface JudgeConfig {
  provider: string;
  model: string;
  criteria: {
    accuracy: boolean;
    relevance: boolean;
    safety: boolean;
    coherence: boolean;
  };
  confidenceThreshold: number;
}

export default function LLMJudgePage() {
  const [mode, setMode] = useState<'manual' | 'batch'>('manual');
  const [judgeConfig, setJudgeConfig] = useState<JudgeConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Manual mode state
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [expected, setExpected] = useState('');

  // Batch mode state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [traces, setTraces] = useState<Array<{ input: string; output: string; expected?: string }>>([]);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('cert-judge-config');
    const savedConnections = localStorage.getItem('cert-api-connections');

    if (savedConfig && savedConnections) {
      const config = JSON.parse(savedConfig);
      const connections = JSON.parse(savedConnections);
      const activeConnection = connections.find(
        (c: { provider: string; status: string }) => c.provider === config.provider && c.status === 'connected'
      );

      if (activeConnection) {
        setJudgeConfig(config);
        setIsConfigured(true);
      }
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.trim().split('\n');
        const parsed = lines.map((line) => {
          const trace = JSON.parse(line);
          return {
            input: trace.input_data || trace.input || JSON.stringify(trace.input_data),
            output: trace.output_data || trace.output || JSON.stringify(trace.output_data),
            expected: trace.expected,
          };
        });
        setTraces(parsed);
      } catch (e) {
        setError('Failed to parse file. Please ensure it\'s a valid JSONL file with traces.');
        setTraces([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const runEvaluation = async () => {
    if (!judgeConfig) return;

    setIsEvaluating(true);
    setError(null);
    setResults([]);

    const itemsToEvaluate = mode === 'manual'
      ? [{ input, output, expected }]
      : traces;

    try {
      const response = await fetch('/api/quality/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToEvaluate,
          config: judgeConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const data = await response.json();
      setResults(data.results);

      // Save to localStorage for history
      const history = JSON.parse(localStorage.getItem('cert-evaluation-history') || '[]');
      history.unshift(...data.results);
      localStorage.setItem('cert-evaluation-history', JSON.stringify(history.slice(0, 100)));
    } catch (e) {
      setError('Failed to run evaluation. Please check your API configuration.');
    }

    setIsEvaluating(false);
  };

  const clearResults = () => {
    setResults([]);
    if (mode === 'manual') {
      setInput('');
      setOutput('');
      setExpected('');
    } else {
      setUploadedFile(null);
      setTraces([]);
    }
  };

  if (!isConfigured) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Configuration Required
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Please configure your API connections and LLM Judge settings before running evaluations.
          </p>
          <a
            href="/configuration"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Configuration
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
          <Zap className="w-7 h-7 text-purple-500" />
          LLM Judge
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Automated evaluation of LLM outputs using {judgeConfig?.model}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-1 inline-flex">
        <button
          onClick={() => setMode('manual')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === 'manual'
              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          Manual Evaluation
        </button>
        <button
          onClick={() => setMode('batch')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            mode === 'batch'
              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          )}
        >
          Batch Mode
        </button>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            {mode === 'manual' ? 'Manual Evaluation' : 'Batch Evaluation'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {mode === 'manual'
              ? 'Enter an input/output pair to evaluate'
              : 'Upload a JSONL file with traces to evaluate'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'manual' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Input (what was asked)
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What is the capital of France?"
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Output (LLM response)
                </label>
                <textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  placeholder="The capital of France is Paris."
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Expected (optional, for comparison)
                </label>
                <textarea
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  placeholder="Paris"
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </>
          ) : (
            <div>
              <label
                htmlFor="file-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  uploadedFile
                    ? "border-purple-300 bg-purple-50 dark:border-purple-500/50 dark:bg-purple-500/10"
                    : "border-zinc-300 dark:border-zinc-600 hover:border-purple-300 dark:hover:border-purple-500/50"
                )}
              >
                {uploadedFile ? (
                  <div className="text-center">
                    <FileText className="w-10 h-10 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {traces.length} traces loaded
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setUploadedFile(null);
                        setTraces([]);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        Click to upload
                      </span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      JSONL file with traces (cert_traces.jsonl format)
                    </p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept=".jsonl,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={runEvaluation}
              disabled={
                isEvaluating ||
                (mode === 'manual' && (!input.trim() || !output.trim())) ||
                (mode === 'batch' && traces.length === 0)
              }
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                isEvaluating ||
                  (mode === 'manual' && (!input.trim() || !output.trim())) ||
                  (mode === 'batch' && traces.length === 0)
                  ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              )}
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Evaluation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Results ({results.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const data = JSON.stringify(results, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evaluation-results-${Date.now()}.json`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={clearResults}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {results.map((result, index) => (
              <div key={result.id || index} className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        result.status === 'pass'
                          ? "bg-emerald-100 dark:bg-emerald-500/20"
                          : result.status === 'review'
                          ? "bg-amber-100 dark:bg-amber-500/20"
                          : "bg-red-100 dark:bg-red-500/20"
                      )}
                    >
                      {result.status === 'pass' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : result.status === 'review' ? (
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        Overall Score: {result.score.toFixed(2)}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {result.status === 'pass'
                          ? 'Passed all criteria'
                          : result.status === 'review'
                          ? 'Needs human review'
                          : 'Failed evaluation'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      result.status === 'pass'
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : result.status === 'review'
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                    )}
                  >
                    {result.status === 'pass' ? 'Pass' : result.status === 'review' ? 'Review' : 'Fail'}
                  </span>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {Object.entries(result.breakdown).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 text-center"
                    >
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                        {key}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          value >= 0.8
                            ? "text-emerald-600 dark:text-emerald-400"
                            : value >= 0.5
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {value.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reasoning */}
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Judge Reasoning
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {result.reasoning}
                  </p>
                </div>

                {/* Input/Output Preview */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Input
                    </p>
                    <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">
                      {result.input}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Output
                    </p>
                    <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">
                      {result.output}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
