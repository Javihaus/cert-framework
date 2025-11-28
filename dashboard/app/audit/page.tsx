'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FileUpload from '@/components/FileUpload';
import { LuUpload, LuPlay, LuDownload, LuCircleCheckBig, LuCircleX, LuTriangleAlert, LuShield, LuChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { typographyClasses } from '@/theme/typography';
import Slider from '@mui/material/Slider';

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
          <h1 className={cn(typographyClasses.pageTitle, "mb-2")}>
            Accuracy Testing
          </h1>
          <p className={typographyClasses.body}>
            Test your AI system's response quality against expected outputs
          </p>
        </div>

        {!report ? (
          <>
            {/* Configuration Card */}
            <Card className="mb-6">
              <h2 className={cn(typographyClasses.sectionTitle, "mb-4")}>
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
                <label className={cn(typographyClasses.label, "block mb-2")}>
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
                    <h3 className={cn(typographyClasses.subsectionTitle, "mb-1")}>Semantic</h3>
                    <p className={typographyClasses.body}>
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
                    <h3 className={cn(typographyClasses.subsectionTitle, "mb-1")}>Exact Match</h3>
                    <p className={typographyClasses.body}>
                      Requires exact string matches. Use for financial or legal domains.
                    </p>
                  </div>
                </div>
              </div>

              {/* Threshold Configuration */}
              <div className="mb-6">
                <label className={cn(typographyClasses.label, "block mb-2")}>
                  Accuracy Threshold: {(threshold * 100).toFixed(0)}%
                </label>
                <Slider
                  value={threshold}
                  onChange={(_, value) => setThreshold(value as number)}
                  min={0}
                  max={1}
                  step={0.05}
                  sx={{ color: '#10069F', '.dark &': { color: '#9fc2e9' } }}
                />
                <div className={cn(typographyClasses.caption, "flex justify-between mt-1")}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {error && (
                <div className={cn(typographyClasses.body, "mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200")}>
                  {error}
                </div>
              )}

              {/* Run Button */}
              <Button
                onClick={handleRunAudit}
                disabled={!tracesData || isRunning}
                icon={isRunning ? undefined : <LuPlay size={16} />}
                variant="primary"
                size="lg"
                fullWidth
              >
                {isRunning ? 'Running Test...' : 'Run Accuracy Test'}
              </Button>
            </Card>

            {/* Info Card - General Value */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className={cn(typographyClasses.subsectionTitle, "text-blue-900 dark:text-blue-100 mb-2")}>
                Why Accuracy Testing Matters
              </h3>
              <p className={cn(typographyClasses.body, "text-blue-800 dark:text-blue-200 mb-3")}>
                Regular accuracy testing helps you catch quality issues before they reach users.
              </p>
              <ul className={cn(typographyClasses.body, "text-blue-700 dark:text-blue-300 space-y-1")}>
                <li>• Detect quality degradation over time</li>
                <li>• Compare performance across models (GPT-4 vs Claude vs alternatives)</li>
                <li>• Validate changes before production deployment</li>
                <li>• Meet regulatory accuracy requirements when needed</li>
              </ul>
            </Card>

            {/* Expandable: For Regulated Industries */}
            <Card className="mt-4">
              <details className="group">
                <summary className={cn(typographyClasses.subsectionTitle, "cursor-pointer list-none flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors")}>
                  <span className="flex items-center gap-2">
                    <LuShield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    For Regulated Industries
                  </span>
                  <LuChevronDown className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-2 space-y-3">
                  <div>
                    <h4 className={cn(typographyClasses.label, "mb-1")}>EU AI Act (Article 15)</h4>
                    <p className={cn(typographyClasses.body, "text-zinc-600 dark:text-zinc-400")}>
                      High-risk AI systems must achieve appropriate levels of accuracy, robustness, and cybersecurity.
                      Use semantic evaluation with 90% threshold to meet Article 15 requirements.
                    </p>
                  </div>
                  <div>
                    <h4 className={cn(typographyClasses.label, "mb-1")}>FDA Software Validation</h4>
                    <p className={cn(typographyClasses.body, "text-zinc-600 dark:text-zinc-400")}>
                      Medical AI systems require documented accuracy testing. Configure thresholds based on your risk classification.
                    </p>
                  </div>
                  <div>
                    <h4 className={cn(typographyClasses.label, "mb-1")}>Financial Services</h4>
                    <p className={cn(typographyClasses.body, "text-zinc-600 dark:text-zinc-400")}>
                      Banking and insurance AI often requires exact match evaluation for regulatory compliance.
                    </p>
                  </div>
                </div>
              </details>
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
                    <LuCircleCheckBig size={48} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <LuCircleX size={48} className="text-red-600 dark:text-red-400" />
                  )}
                  <div>
                    <h2 className={cn(
                      typographyClasses.sectionTitle, 'mb-1',
                      report.compliant ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                    )}>
                      {report.compliant ? 'Compliant' : 'Non-Compliant'}
                    </h2>
                    <p className={cn(
                      typographyClasses.body,
                      report.compliant ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    )}>
                      Accuracy Test Results - {report.evaluator_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setReport(null)} variant="secondary">
                    New Audit
                  </Button>
                  <Button onClick={handleDownloadReport} icon={<LuDownload size={16} />}>
                    Download Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Metrics Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <p className={cn(typographyClasses.body, "mb-1")}>Accuracy Rate</p>
                <p className={cn(
                  'text-3xl font-bold',
                  report.pass_rate >= 0.9 ? 'text-green-600' : 'text-red-600'
                )}>
                  {(report.pass_rate * 100).toFixed(1)}%
                </p>
              </Card>
              <Card>
                <p className={cn(typographyClasses.body, "mb-1")}>Total Traces</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{report.total_traces}</p>
              </Card>
              <Card>
                <p className={cn(typographyClasses.body, "mb-1")}>Passed</p>
                <p className="text-3xl font-bold text-green-600">{report.passed_traces}</p>
              </Card>
              <Card>
                <p className={cn(typographyClasses.body, "mb-1")}>Failed</p>
                <p className="text-3xl font-bold text-red-600">{report.failed_traces}</p>
              </Card>
            </div>

            {/* Failed Traces Table */}
            {report.results.filter(r => !r.passed).length > 0 && (
              <Card>
                <h3 className={cn(typographyClasses.cardTitle, "mb-4")}>
                  Failed Traces ({report.results.filter(r => !r.passed).length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className={cn(typographyClasses.label, "text-left p-3")}>Query</th>
                        <th className={cn(typographyClasses.label, "text-left p-3")}>Answer</th>
                        <th className={cn(typographyClasses.label, "text-center p-3")}>Confidence</th>
                        <th className={cn(typographyClasses.label, "text-left p-3")}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.results.filter(r => !r.passed).slice(0, 10).map((result, idx) => (
                        <tr key={idx} className="border-b border-zinc-200 dark:border-zinc-700">
                          <td className={cn(typographyClasses.body, "p-3 max-w-xs truncate")}>
                            {result.input_query || 'N/A'}
                          </td>
                          <td className={cn(typographyClasses.body, "p-3 max-w-xs truncate")}>
                            {result.answer || 'N/A'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={cn(typographyClasses.body, "inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium rounded")}>
                              {(result.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className={cn(typographyClasses.body, "p-3 max-w-xs truncate")}>
                            {result.reason || 'Below threshold'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {report.results.filter(r => !r.passed).length > 10 && (
                    <p className={cn(typographyClasses.body, "text-center py-3")}>
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
