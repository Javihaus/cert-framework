'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FileUpload from '@/components/FileUpload';
import { Upload, Play, Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditResult {
  timestamp: string;
  passed: boolean;
  confidence: number;
  input_query: string;
  answer: string;
  context?: string;
  reason?: string;
}

interface AuditReport {
  total_traces: number;
  passed_traces: number;
  failed_traces: number;
  pass_rate: number;
  threshold: number;
  evaluator_type: string;
  compliant: boolean;
  results: AuditResult[];
}

export default function AuditPage() {
  const [tracesData, setTracesData] = useState<any[] | null>(null);
  const [threshold, setThreshold] = useState(0.7);
  const [evaluator, setEvaluator] = useState<'semantic' | 'exact'>('semantic');
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoad = (data: any) => {
    setTracesData(Array.isArray(data) ? data : [data]);
    setError(null);
  };

  const handleRunAudit = async () => {
    if (!tracesData) {
      setError('Please upload a traces file first');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      // Convert traces data to JSONL format
      const fileContent = tracesData.map(trace => JSON.stringify(trace)).join('\n');

      // Call audit API
      const response = await fetch('/api/run-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traces: fileContent,
          threshold,
          evaluator
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Audit failed');
      }

      const auditData = await response.json();
      setReport(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Audit error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const reportData = JSON.stringify(report, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            EU AI Act Compliance Audit
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Evaluate system accuracy against Article 15 requirements
          </p>
        </div>

        {!report ? (
          <>
            {/* Configuration Card */}
            <Card className="mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Audit Configuration
              </h2>

              {/* File Upload */}
              <div className="mb-6">
                <FileUpload
                  onFileLoad={handleFileLoad}
                  accept=".jsonl,.json"
                  label="Upload Traces File (JSONL)"
                />
              </div>

              {/* Evaluator Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Evaluator Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setEvaluator('semantic')}
                    className={cn(
                      'p-4 border-2 rounded-lg cursor-pointer transition-all',
                      evaluator === 'semantic'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                    )}
                  >
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Semantic</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Evaluates meaning similarity using embeddings. Best for most use cases.
                    </p>
                  </div>
                  <div
                    onClick={() => setEvaluator('exact')}
                    className={cn(
                      'p-4 border-2 rounded-lg cursor-pointer transition-all',
                      evaluator === 'exact'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                    )}
                  >
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">Exact Match</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Requires exact string matches. Use for financial or legal domains.
                    </p>
                  </div>
                </div>
              </div>

              {/* Threshold Configuration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  Accuracy Threshold: {(threshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}

              {/* Run Button */}
              <Button
                onClick={handleRunAudit}
                disabled={!tracesData || isRunning}
                icon={isRunning ? undefined : <Play size={16} />}
                variant="primary"
                size="lg"
                fullWidth
              >
                {isRunning ? 'Running Audit...' : 'Run Compliance Audit'}
              </Button>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                EU AI Act Article 15 Requirements
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                High-risk AI systems must achieve appropriate levels of accuracy, robustness, and cybersecurity.
                This audit evaluates your system's accuracy based on production traces.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Article 15(1): Systems must achieve appropriate accuracy levels</li>
                <li>• Article 15(2): Robustness and reliability testing required</li>
                <li>• Typical compliance threshold: 90% accuracy rate</li>
              </ul>
            </Card>
          </>
        ) : (
          <>
            {/* Results Header */}
            <Card className={cn(
              'mb-6',
              report.compliant
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {report.compliant ? (
                    <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle size={48} className="text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <h2 className={cn(
                      'text-2xl font-bold mb-1',
                      report.compliant ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                    )}>
                      {report.compliant ? 'Compliant' : 'Non-Compliant'}
                    </h2>
                    <p className={cn(
                      'text-sm',
                      report.compliant ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    )}>
                      Article 15 Accuracy Assessment - {report.evaluator_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setReport(null)} variant="secondary">
                    New Audit
                  </Button>
                  <Button onClick={handleDownloadReport} icon={<Download size={16} />}>
                    Download Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Metrics Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Accuracy Rate</p>
                <p className={cn(
                  'text-3xl font-bold',
                  report.pass_rate >= 0.9 ? 'text-green-600' : 'text-red-600'
                )}>
                  {(report.pass_rate * 100).toFixed(1)}%
                </p>
              </Card>
              <Card>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Traces</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{report.total_traces}</p>
              </Card>
              <Card>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Passed</p>
                <p className="text-3xl font-bold text-green-600">{report.passed_traces}</p>
              </Card>
              <Card>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{report.failed_traces}</p>
              </Card>
            </div>

            {/* Failed Traces Table */}
            {report.results.filter(r => !r.passed).length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                  Failed Traces ({report.results.filter(r => !r.passed).length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-zinc-900 dark:text-white">Query</th>
                        <th className="text-left p-3 text-sm font-medium text-zinc-900 dark:text-white">Answer</th>
                        <th className="text-center p-3 text-sm font-medium text-zinc-900 dark:text-white">Confidence</th>
                        <th className="text-left p-3 text-sm font-medium text-zinc-900 dark:text-white">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.results.filter(r => !r.passed).slice(0, 10).map((result, idx) => (
                        <tr key={idx} className="border-b border-zinc-200 dark:border-zinc-700">
                          <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                            {result.input_query || 'N/A'}
                          </td>
                          <td className="p-3 text-sm text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                            {result.answer || 'N/A'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium rounded">
                              {(result.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                            {result.reason || 'Below threshold'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {report.results.filter(r => !r.passed).length > 10 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-3">
                      Showing 10 of {report.results.filter(r => !r.passed).length} failed traces. Download full report for all results.
                    </p>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
