'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { InfoBox } from '@/components/ui';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';
import { Article15Report } from '@/types/report-schema';
import { CERTReportPDF } from './CERTReportPDF';

interface DocumentsViewProps {
  summary: EvaluationSummary;
  results: EvaluationResult[];
}

export default function DocumentsView({ summary, results }: DocumentsViewProps) {
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('CERT Compliance Evaluation Report');
  const [organization, setOrganization] = useState('');
  const [evaluator, setEvaluator] = useState('');
  const [notes, setNotes] = useState('');

  // Load organization from sessionStorage if available
  useEffect(() => {
    const complianceDataStr = sessionStorage.getItem('compliance_data');
    if (complianceDataStr) {
      try {
        const complianceData = JSON.parse(complianceDataStr);
        setOrganization(complianceData.metadata?.provider_name || '');
      } catch (err) {
        // Ignore errors
      }
    }
  }, []);

  const handleDownloadReport = async () => {
    setLoading(true);

    try {
      const failedTraces = results
        .filter((r) => !r.passed)
        .map((r) => ({
          timestamp: r.timestamp,
          input_query: r.query,
          context: '',
          answer: r.response || '',
          confidence: r.measurement.confidence,
          reason: `Low confidence (${r.measurement.confidence.toFixed(3)})`,
        }));

      const report: Article15Report = {
        metadata: {
          system_name: reportTitle,
          system_version: 'v1.0',
          provider_name: organization || 'Not specified',
          intended_purpose: notes || 'AI system evaluation',
          report_date: new Date().toISOString(),
          evaluator_name: evaluator || undefined,
        },
        performance: {
          total_traces: summary.total_traces,
          evaluated_traces: summary.evaluated_traces,
          passed_traces: summary.passed_traces,
          failed_traces: summary.failed_traces,
          accuracy_percentage: summary.accuracy * 100,
          mean_confidence: summary.mean_confidence,
          median_confidence: summary.mean_confidence,
          threshold_used: summary.threshold_used,
        },
        temporal: {
          period_start: summary.date_range.start,
          period_end: summary.date_range.end,
          daily_accuracy: [
            {
              date: new Date(summary.date_range.start).toISOString().split('T')[0],
              accuracy: summary.accuracy,
            },
          ],
        },
        failed_traces: failedTraces,
        evaluation_methodology: `CERT Framework dual-component measurement approach. Threshold: ${summary.threshold_used}`,
        compliance_statement: `This system ${summary.accuracy >= 0.9 ? 'meets' : 'does not meet'} EU AI Act Article 15 requirements for accuracy monitoring. Evaluation conducted with ${summary.total_traces} traces. Pass rate of ${(summary.accuracy * 100).toFixed(1)}% ${summary.accuracy >= 0.9 ? 'exceeds' : 'is below'} the 90% compliance threshold.`,
      };

      // Generate PDF entirely in the browser - NO SERVER CALL
      const blob = await pdf(<CERTReportPDF report={report} />).toBlob();

      // Download directly
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cert_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCompliant = summary.accuracy >= 0.9;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* PDF Report Section */}
      <Card className="p-8 mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          Download PDF Compliance Report
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Generate a professional PDF report with comprehensive evaluation metrics, failure analysis, and compliance recommendations. Generated entirely in your browser - no data sent to servers.
        </p>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Report Title
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Organization
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your organization name"
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Evaluator
            </label>
            <input
              type="text"
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
              placeholder="Name of person conducting evaluation"
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context or notes for this report"
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-md border border-zinc-200 dark:border-zinc-700 mb-6">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
            Report Preview
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-zinc-400">Total Traces:</span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {summary.total_traces.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-400">Accuracy:</span>
              <p className={`text-sm font-semibold ${isCompliant ? 'text-green-600' : 'text-amber-500'}`}>
                {(summary.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-400">Passed:</span>
              <p className="text-sm font-semibold text-green-600">
                {summary.passed_traces.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-400">Failed:</span>
              <p className="text-sm font-semibold text-red-500">
                {summary.failed_traces.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleDownloadReport}
          variant="primary"
          fullWidth
          size="lg"
          icon={<Download size={20} />}
          disabled={loading}
        >
          {loading ? 'Generating Report...' : 'Download PDF Report'}
        </Button>
      </Card>

      {/* CLI Instructions for Word Documents */}
      <InfoBox type="info" title="Need Word Documents?">
        <div>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            For the full EU AI Act compliance package (5 Word documents, 32 pages), use the CERT CLI. All processing happens locally on your machine - your traces never leave your computer.
          </p>
          <pre className="block whitespace-pre p-4 rounded-md text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 leading-relaxed overflow-x-auto">
{`# Install CERT CLI
pip install cert-framework

# Generate compliance package
cert audit traces.jsonl --format docx --output report.docx

# Or use the Python API
from cert.compliance import ComplianceReporter
reporter = ComplianceReporter(
    system_name="My AI System",
    provider_name="My Company"
)
reporter.save_report("traces.jsonl", "package.docx")`}
          </pre>
          <p className="mt-2 text-xs text-zinc-400">
            The CLI generates: Risk Classification Report (2p), Annex IV Technical Documentation (20-25p), Audit Trail Guide (3p), Monitoring Framework (5p), and Conformity Checklist (2p).
          </p>
        </div>
      </InfoBox>
    </div>
  );
}
