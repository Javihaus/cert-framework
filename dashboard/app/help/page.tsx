'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Settings,
  Zap,
  User,
  Activity,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  BookOpen,
  FileText,
  Play,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

function HelpItem({ icon: Icon, title, description, href, onClick }: HelpItemProps) {
  const content = (
    <div className="flex items-start gap-3 group cursor-pointer">
      <Icon className="w-5 h-5 text-[#471424] dark:text-[#d4a4b0] mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] group-hover:text-[#5a1a2e] dark:group-hover:text-[#e8c8d0] transition-colors">
          {title}
        </h3>
        <p className="text-[13px] text-black dark:text-white leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick} className="text-left w-full">{content}</button>;
}

interface HelpPanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function HelpPanel({ title, onClose, children }: HelpPanelProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-[#151B24] shadow-lg z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#151B24] border-b border-[#471424] dark:border-[#d4a4b0] px-6 py-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#471424] dark:text-[#d4a4b0]">{title}</h3>
          <button onClick={onClose} className="text-[#471424] dark:text-[#d4a4b0] hover:text-[#5a1a2e] dark:hover:text-[#e8c8d0]">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

export default function HelpPage() {
  const [showGettingStartedPanel, setShowGettingStartedPanel] = useState(false);
  const [showQualityEvalsPanel, setShowQualityEvalsPanel] = useState(false);
  const [showOperationalEvalsPanel, setShowOperationalEvalsPanel] = useState(false);
  const [showConfigurationPanel, setShowConfigurationPanel] = useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold text-[#471424] dark:text-[#d4a4b0]">
          Help & Documentation
        </h1>
        <p className="text-[15px] text-black dark:text-white mt-1">
          Learn how to use CERT Framework for LLM evaluation and EU AI Act compliance
        </p>
      </div>

      {/* Getting Started */}
      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#471424] dark:text-[#d4a4b0] uppercase tracking-wider mb-4">
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HelpItem
            icon={Play}
            title="Quick Start Guide"
            description="Set up CERT Framework in 4 easy steps. Configure connections, set up the LLM judge, and run your first evaluation."
            onClick={() => setShowGettingStartedPanel(true)}
          />
          <HelpItem
            icon={Settings}
            title="Configuration"
            description="Learn how to configure API connections, LLM judge settings, and evaluation thresholds."
            href="/configuration"
          />
          <HelpItem
            icon={BookOpen}
            title="Documentation"
            description="Complete reference documentation for all CERT Framework features and capabilities."
            href="https://github.com/anthropics/cert-framework"
          />
        </div>
      </section>

      {/* Core Concepts */}
      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#471424] dark:text-[#d4a4b0] uppercase tracking-wider mb-4">
          Core Concepts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HelpItem
            icon={Zap}
            title="Quality Evals"
            description="Is the output good? Learn about LLM Judge, Human Review, and automatic evaluation methods."
            onClick={() => setShowQualityEvalsPanel(true)}
          />
          <HelpItem
            icon={Activity}
            title="Operational Evals"
            description="Can we run this in production? Understand performance, cost, and observability metrics."
            onClick={() => setShowOperationalEvalsPanel(true)}
          />
          <HelpItem
            icon={CheckSquare}
            title="Evaluation Methods"
            description="Compare Auto-Eval, LLM Judge, Human Review, and Grounding Check evaluation approaches."
            onClick={() => setShowConfigurationPanel(true)}
          />
        </div>
      </section>

      {/* Resources */}
      <section className="mb-10">
        <h2 className="text-[13px] font-semibold text-[#471424] dark:text-[#d4a4b0] uppercase tracking-wider mb-4">
          Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HelpItem
            icon={ExternalLink}
            title="GitHub Repository"
            description="View source code, report issues, and contribute to the CERT Framework project."
            href="https://github.com/anthropics/cert-framework"
          />
          <HelpItem
            icon={FileText}
            title="EU AI Act Reference"
            description="Official documentation on Article 15 accuracy requirements and compliance guidelines."
            href="https://artificialintelligenceact.eu/"
          />
          <HelpItem
            icon={ExternalLink}
            title="Anthropic Docs"
            description="Learn about Claude API and best practices for LLM integration."
            href="https://docs.anthropic.com"
          />
        </div>
      </section>

      {/* Contact & Support */}
      <section>
        <h2 className="text-[13px] font-semibold text-[#471424] dark:text-[#d4a4b0] uppercase tracking-wider mb-4">
          Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HelpItem
            icon={HelpCircle}
            title="FAQ"
            description="Frequently asked questions about CERT Framework setup and usage."
            href="#"
          />
        </div>
      </section>

      {/* Getting Started Panel */}
      {showGettingStartedPanel && (
        <HelpPanel title="Quick Start Guide" onClose={() => setShowGettingStartedPanel(false)}>
          <div className="space-y-6">
            <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
              <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Step 1: Configure API Connections</h4>
              <p className="text-[13px] text-black dark:text-white">
                Go to Configuration and add your API keys for Claude, OpenAI, or Gemini. You need at least one active connection to use the evaluation features.
              </p>
              <Link href="/configuration" className="text-[13px] text-[#471424] dark:text-[#d4a4b0] mt-2 inline-flex items-center gap-1">
                Go to Configuration <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
              <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Step 2: Set Up the LLM Judge</h4>
              <p className="text-[13px] text-black dark:text-white">
                Choose which LLM model will evaluate your outputs. We recommend Claude for best results. Configure the evaluation criteria and confidence threshold.
              </p>
            </div>

            <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
              <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Step 3: Run Your First Evaluation</h4>
              <p className="text-[13px] text-black dark:text-white">
                Go to LLM Judge and either enter a manual input/output pair or upload a JSONL trace file for batch evaluation.
              </p>
              <Link href="/quality/judge" className="text-[13px] text-[#471424] dark:text-[#d4a4b0] mt-2 inline-flex items-center gap-1">
                Go to LLM Judge <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
              <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Step 4: Review Results</h4>
              <p className="text-[13px] text-black dark:text-white">
                Check the Quality Dashboard for scores. Items below your confidence threshold will appear in the Human Review Queue for manual verification.
              </p>
              <Link href="/quality" className="text-[13px] text-[#471424] dark:text-[#d4a4b0] mt-2 inline-flex items-center gap-1">
                Go to Quality Overview <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </HelpPanel>
      )}

      {/* Quality Evals Panel */}
      {showQualityEvalsPanel && (
        <HelpPanel title="Quality Evals" onClose={() => setShowQualityEvalsPanel(false)}>
          <div className="space-y-5">
            <p className="text-[14px] text-[#471424] dark:text-[#d4a4b0] font-medium">
              Is the output good?
            </p>
            <p className="text-[13px] text-black dark:text-white">
              Quality evaluations help you determine if LLM outputs meet your accuracy and quality standards.
            </p>

            <div className="space-y-4 mt-6">
              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">LLM Judge</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Automated evaluation using AI. The judge model scores each output on accuracy, relevance, safety, and coherence.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Human Review Queue</h4>
                <p className="text-[13px] text-black dark:text-white">
                  When the LLM judge is uncertain (score below threshold), items go to the Human Review Queue. You can approve, reject, or add notes.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Auto-Evaluation</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Automatic validation using semantic similarity and NLI (Natural Language Inference) to compare outputs against expected results.
                </p>
              </div>
            </div>
          </div>
        </HelpPanel>
      )}

      {/* Operational Evals Panel */}
      {showOperationalEvalsPanel && (
        <HelpPanel title="Operational Evals" onClose={() => setShowOperationalEvalsPanel(false)}>
          <div className="space-y-5">
            <p className="text-[14px] text-[#471424] dark:text-[#d4a4b0] font-medium">
              Can we run this in production?
            </p>
            <p className="text-[13px] text-black dark:text-white">
              Operational evaluations help you assess if your LLM system is ready for production deployment.
            </p>

            <div className="space-y-4 mt-6">
              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Performance</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Track latency metrics (P50, P95, P99) and throughput. Target: P95 latency under 30 seconds.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Cost Analysis</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Monitor token usage and API costs. Target: under $0.25 per query. Get optimization suggestions.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Observability</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Monitor error rates, trace logs, and provider status. Target: over 95% success rate and under 5% error rate.
                </p>
              </div>
            </div>
          </div>
        </HelpPanel>
      )}

      {/* Configuration Panel */}
      {showConfigurationPanel && (
        <HelpPanel title="Evaluation Methods" onClose={() => setShowConfigurationPanel(false)}>
          <div className="space-y-5">
            <p className="text-[13px] text-black dark:text-white">
              CERT Framework offers multiple evaluation methods to suit different needs.
            </p>

            <div className="space-y-4 mt-4">
              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Auto-Eval</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Fast, automated evaluation using semantic similarity and NLI. Best for high-volume batch processing.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">LLM Judge</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Use a powerful LLM to evaluate outputs. More accurate but slower and more expensive.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Human Review</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Manual verification for critical decisions. Highest accuracy but slowest.
                </p>
              </div>

              <div className="p-4 bg-[#c9d4d8] dark:bg-[#1D2530] rounded-lg border border-[#471424] dark:border-[#d4a4b0]">
                <h4 className="text-[14px] font-medium text-[#471424] dark:text-[#d4a4b0] mb-2">Grounding Check</h4>
                <p className="text-[13px] text-black dark:text-white">
                  Verify that outputs are grounded in source documents. Essential for RAG systems.
                </p>
              </div>
            </div>
          </div>
        </HelpPanel>
      )}
    </div>
  );
}
