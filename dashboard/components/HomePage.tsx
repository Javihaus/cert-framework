'use client';

import { BarChart3, FileText, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Card';

// Icon color palette - Stripe-inspired
const iconColors = {
  purple: '#635BFF',    // Primary brand
  blue: '#0570DE',      // Info
  teal: '#3ECFA8',      // Success, monitoring
  orange: '#F5A623',    // Warnings
  navy: '#0A2540',      // Default
};

export default function HomePage() {
  return (
    <div>
      {/* Hero Section - Stripe style */}
      <div className="mb-12 text-center">
        <h1 className="text-[28px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-4 tracking-tight leading-tight">
          AI systems you can deploy with confidence
        </h1>
        <p className="text-[17px] text-[#596780] dark:text-[#8792A2] leading-relaxed max-w-[700px] mx-auto">
          Built for the August 2025 EU AI Act deadline. Trace analysis that proves 90%+ accuracy. Documentation ready for conformity assessment.
        </p>
      </div>

      {/* Overview Card - Stripe style */}
      <Card className="mb-8 p-6">
        <h2 className="text-[20px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-4">
          What CERT Does
        </h2>
        <p className="text-[14px] leading-relaxed text-[#596780] dark:text-[#8792A2] mb-6">
          CERT combines production LLM monitoring with EU AI Act compliance automation.
          Track accuracy, analyze failures, and generate audit-ready documentation automatically.
        </p>
        <div className="bg-[#F6F9FC] dark:bg-[#1D2530] p-5 rounded-lg border border-[#E3E8EE] dark:border-[#252D3A]">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={20} style={{ color: iconColors.teal }} />
            <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
              Built for Compliance Consultants
            </h3>
          </div>
          <p className="text-[14px] leading-relaxed text-[#596780] dark:text-[#8792A2]">
            Turn weeks of manual documentation into hours. CERT analyzes your traces,
            classifies risk, and generates professional Word documents ready for expert review.
          </p>
        </div>
      </Card>

      {/* Features Grid - Stripe style cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Monitoring */}
        <Card className="p-5 card-interactive">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(62, 207, 168, 0.1)' }}>
              <BarChart3 size={20} style={{ color: iconColors.teal }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1">
                Production Monitoring
              </h3>
              <p className="text-[13px] leading-relaxed text-[#596780] dark:text-[#8792A2] mb-4">
                Upload LLM traces to analyze accuracy, identify failures, and track
                performance metrics required by Article 15.
              </p>
              <a href="/quality" className="text-[13px] font-medium text-[#635BFF] dark:text-[#A5A0FF] hover:text-[#5851DB] dark:hover:text-[#C5C1FF] inline-flex items-center gap-1">
                Go to Monitoring →
              </a>
            </div>
          </div>
        </Card>

        {/* Document Generation */}
        <Card className="p-5 card-interactive">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 166, 35, 0.1)' }}>
              <FileText size={20} style={{ color: iconColors.orange }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1">
                Compliance Documents
              </h3>
              <p className="text-[13px] leading-relaxed text-[#596780] dark:text-[#8792A2] mb-4">
                Generate 5 professional Word documents for EU AI Act compliance:
                Risk Classification, Annex IV Technical Documentation, and more.
              </p>
              <a href="/configuration" className="text-[13px] font-medium text-[#635BFF] dark:text-[#A5A0FF] hover:text-[#5851DB] dark:hover:text-[#C5C1FF] inline-flex items-center gap-1">
                Generate Documents →
              </a>
            </div>
          </div>
        </Card>
      </div>

      {/* Workflow Card - Stripe style */}
      <Card className="p-6 bg-[#F6F9FC] dark:bg-[#151B24] border-[#E3E8EE] dark:border-[#1D2530]">
        <h2 className="text-[17px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-6">
          Typical Workflow
        </h2>

        <div className="flex flex-col gap-5">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="min-w-[28px] h-7 text-white rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ backgroundColor: iconColors.purple }}>
              1
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1">
                Load Production Traces
              </h3>
              <p className="text-[13px] leading-relaxed text-[#596780] dark:text-[#8792A2]">
                Upload JSON file with LLM traces from your production system. CERT analyzes accuracy and failure patterns.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="min-w-[28px] h-7 text-white rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ backgroundColor: iconColors.purple }}>
              2
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1">
                Review Monitoring Dashboards
              </h3>
              <p className="text-[13px] leading-relaxed text-[#596780] dark:text-[#8792A2]">
                Explore overview metrics, failed traces, and distribution charts. Identify issues to address.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="min-w-[28px] h-7 text-white rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ backgroundColor: iconColors.purple }}>
              3
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1">
                Download Reports
              </h3>
              <p className="text-[13px] leading-relaxed text-[#596780] dark:text-[#8792A2]">
                Generate a professional PDF report directly in your browser or use the CERT CLI for Word documents.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4">
            <div className="min-w-[28px] h-7 text-white rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ backgroundColor: iconColors.purple }}>
              4
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1">
                Expert Review & Delivery
              </h3>
              <p className="text-[13px] leading-relaxed text-[#596780] dark:text-[#8792A2]">
                Documents include [EXPERT INPUT REQUIRED] markers. Add professional commentary (8-10 hours) and deliver.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer Info - Stripe style resource cards */}
      <div className="mt-10 pt-8 border-t border-[#E3E8EE] dark:border-[#1D2530]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="resource-card">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} style={{ color: iconColors.purple }} />
              <span className="resource-card-title">
                EU AI Act Focus
              </span>
            </div>
            <p className="resource-card-description">
              Risk classification (Annex III), Technical documentation (Annex IV), Accuracy & robustness (Article 15), Logging requirements (Article 19)
            </p>
            <a href="/help" className="resource-card-link">
              Learn more →
            </a>
          </div>
          <div className="resource-card">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} style={{ color: iconColors.orange }} />
              <span className="resource-card-title">
                Document Outputs
              </span>
            </div>
            <p className="resource-card-description">
              5 Microsoft Word documents, 32 pages total, auto-populated with trace data, expert sections marked for review
            </p>
            <a href="/configuration" className="resource-card-link">
              View templates →
            </a>
          </div>
          <div className="resource-card">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} style={{ color: iconColors.blue }} />
              <span className="resource-card-title">
                Time Savings
              </span>
            </div>
            <p className="resource-card-description">
              Traditional: 40-60 hours manual work. With CERT: 8-10 hours expert review. 80% time reduction with consistent, audit-ready output.
            </p>
            <a href="/quality" className="resource-card-link">
              Get started →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
