'use client';

import { BarChart3, FileText, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Card';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight leading-tight">
          AI systems you can deploy with confidence
        </h1>
        <p className="text-2xl text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[800px] mx-auto">
          Built for the August 2025 EU AI Act deadline. Trace analysis that proves 90%+ accuracy. Documentation ready for conformity assessment.
        </p>
      </div>

      {/* Overview Card */}
      <Card className="mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
          What CERT Does
        </h2>
        <p className="text-lg leading-loose text-zinc-900 dark:text-zinc-100 mb-6">
          CERT combines production LLM monitoring with EU AI Act compliance automation.
          Track accuracy, analyze failures, and generate audit-ready documentation automatically.
        </p>
        <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={28} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Built for Compliance Consultants
            </h3>
          </div>
          <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
            Turn weeks of manual documentation into hours. CERT analyzes your traces,
            classifies risk, and generates professional Word documents ready for expert review.
          </p>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        {/* Monitoring */}
        <Card className="p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <BarChart3 size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Production Monitoring
              </h3>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                Upload LLM traces to analyze accuracy, identify failures, and track
                performance metrics required by Article 15 (accuracy, robustness).
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Use <strong>Monitoring</strong> tab to load trace data
            </p>
          </div>
        </Card>

        {/* Document Generation */}
        <Card className="p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-amber-500 rounded-lg flex items-center justify-center text-white">
              <FileText size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Compliance Documents
              </h3>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                Generate 5 professional Word documents for EU AI Act compliance:
                Risk Classification, Annex IV Technical Documentation, and more.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Use <strong>Document Generation</strong> tab to create package
            </p>
          </div>
        </Card>
      </div>

      {/* Workflow Card */}
      <Card className="p-12 bg-zinc-50 dark:bg-zinc-900/50">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Typical Workflow
        </h2>

        <div className="flex flex-col gap-6">
          {/* Step 1 */}
          <div className="flex items-start gap-6">
            <div className="min-w-[44px] h-11 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                Load Production Traces
              </h3>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                Upload JSON file with LLM traces from your production system (via OpenTelemetry,
                LangSmith, or custom logging). CERT analyzes accuracy and failure patterns.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-6">
            <div className="min-w-[44px] h-11 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                Review Monitoring Dashboards
              </h3>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                Explore overview metrics, failed traces, and distribution charts. Identify
                issues to address before generating compliance documentation.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-6">
            <div className="min-w-[44px] h-11 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                Download Reports
              </h3>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                Generate a professional PDF report directly in your browser. For Word documents,
                use the CERT CLI to generate the full compliance package locally.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-6">
            <div className="min-w-[44px] h-11 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              4
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                Expert Review & Delivery
              </h3>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                Documents include [EXPERT INPUT REQUIRED] markers for manual sections.
                Add professional commentary (8-10 hours), convert to PDF, deliver to client.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer Info */}
      <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex gap-16">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              <ShieldCheck size={20} className="text-blue-600" />
              <span className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
                EU AI Act Focus
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-loose">
              Risk classification (Annex III)<br/>
              Technical documentation (Annex IV)<br/>
              Accuracy & robustness (Article 15)<br/>
              Logging requirements (Article 19)
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              <FileText size={20} className="text-blue-600" />
              <span className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
                Document Outputs
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-loose">
              5 Microsoft Word documents<br/>
              32 pages total<br/>
              Auto-populated with trace data<br/>
              Expert sections marked for review
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-2">
              <Clock size={20} className="text-blue-600" />
              <span className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
                Time Savings
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-loose">
              Traditional: 40-60 hours manual work<br/>
              With CERT: 8-10 hours expert review<br/>
              Automation: 80% time reduction<br/>
              Quality: Consistent, audit-ready output
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
