'use client';

import { BarChart3, FileText, ArrowRight, Upload, Download, CheckCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * HomePage - Stripe-inspired minimalist design
 * Two prominent cards highlighting the backbone of the application:
 * 1. Quality Monitoring (trace analysis)
 * 2. Document Generation (compliance docs)
 *
 * Design principles:
 * - No colored icon backgrounds
 * - Gray icons, purple only for interactive elements
 * - Clean, professional, minimal
 */
export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header - Clean and simple */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-2">
          Welcome to CERT
        </h1>
        <p className="text-[15px] text-[#596780] dark:text-[#8792A2]">
          EU AI Act compliance monitoring and documentation for your AI systems.
        </p>
      </div>

      {/* Two Main Feature Cards - The backbone of the application */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {/* Quality Monitoring Card */}
        <Link href="/quality" className="group">
          <div className="h-full p-6 bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] hover:border-[#C1C9D2] dark:hover:border-[#30405A] transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F6F9FC] dark:bg-[#1D2530] flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-[#596780] dark:text-[#8792A2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1 group-hover:text-[#635BFF] dark:group-hover:text-[#A5A0FF] transition-colors">
                  Quality Monitoring
                </h2>
                <p className="text-[13px] text-[#596780] dark:text-[#8792A2] leading-relaxed mb-4">
                  Upload LLM traces to analyze accuracy, identify failures, and track performance metrics required by Article 15.
                </p>
                <span className="text-[13px] font-medium text-[#635BFF] dark:text-[#A5A0FF] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Go to Monitoring
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Document Generation Card */}
        <Link href="/configuration" className="group">
          <div className="h-full p-6 bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] hover:border-[#C1C9D2] dark:hover:border-[#30405A] transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#F6F9FC] dark:bg-[#1D2530] flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#596780] dark:text-[#8792A2]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-1 group-hover:text-[#635BFF] dark:group-hover:text-[#A5A0FF] transition-colors">
                  Compliance Documents
                </h2>
                <p className="text-[13px] text-[#596780] dark:text-[#8792A2] leading-relaxed mb-4">
                  Generate professional Word documents for EU AI Act compliance: Risk Classification, Annex IV Technical Documentation, and more.
                </p>
                <span className="text-[13px] font-medium text-[#635BFF] dark:text-[#A5A0FF] inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Generate Documents
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Getting Started Section */}
      <div className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#596780] dark:text-[#8792A2] uppercase tracking-wider mb-4">
          Getting Started
        </h2>

        <div className="bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530] overflow-hidden">
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 border-b border-[#E3E8EE] dark:border-[#1D2530]">
            <div className="w-8 h-8 rounded-full bg-[#F6F9FC] dark:bg-[#1D2530] flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-0.5">
                Upload your traces
              </h3>
              <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
                Import JSON files with LLM traces from your production system.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 border-b border-[#E3E8EE] dark:border-[#1D2530]">
            <div className="w-8 h-8 rounded-full bg-[#F6F9FC] dark:bg-[#1D2530] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-0.5">
                Review metrics
              </h3>
              <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
                Analyze accuracy, failed traces, and distribution charts automatically.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-4">
            <div className="w-8 h-8 rounded-full bg-[#F6F9FC] dark:bg-[#1D2530] flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#0A2540] dark:text-[#E8ECF1] mb-0.5">
                Export reports
              </h3>
              <p className="text-[13px] text-[#596780] dark:text-[#8792A2]">
                Generate PDF or Word documents ready for compliance review.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section - Subtle, no colored backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
            <span className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1]">
              EU AI Act Ready
            </span>
          </div>
          <p className="text-[12px] text-[#596780] dark:text-[#8792A2] leading-relaxed">
            Built for August 2025 deadline. Article 15 accuracy requirements.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
            <span className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1]">
              5 Document Types
            </span>
          </div>
          <p className="text-[12px] text-[#596780] dark:text-[#8792A2] leading-relaxed">
            Risk Classification, Annex IV Technical Documentation, and more.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#151B24] rounded-lg border border-[#E3E8EE] dark:border-[#1D2530]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#596780] dark:text-[#8792A2]" />
            <span className="text-[13px] font-medium text-[#0A2540] dark:text-[#E8ECF1]">
              80% Time Savings
            </span>
          </div>
          <p className="text-[12px] text-[#596780] dark:text-[#8792A2] leading-relaxed">
            From 40-60 hours manual work to 8-10 hours expert review.
          </p>
        </div>
      </div>
    </div>
  );
}
