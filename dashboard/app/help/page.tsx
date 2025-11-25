'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Settings,
  Zap,
  User,
  AlertTriangle,
  Activity,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description: string;
  link?: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  description: string;
  steps: Step[];
  expanded: boolean;
}

export default function HelpPage() {
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: HelpCircle,
      iconColor: '#2563EB',
      description: 'Set up CERT Framework in 4 easy steps',
      expanded: true,
      steps: [
        {
          title: '1. Configure API Connections',
          description:
            'Go to Configuration and add your API keys for Claude, OpenAI, or Gemini. You need at least one active connection to use the evaluation features.',
          link: '/configuration',
        },
        {
          title: '2. Set Up the LLM Judge',
          description:
            'Choose which LLM model will evaluate your outputs. We recommend Claude for best results. Configure the evaluation criteria and confidence threshold.',
          link: '/configuration',
        },
        {
          title: '3. Run Your First Evaluation',
          description:
            'Go to LLM Judge and either enter a manual input/output pair or upload a JSONL trace file for batch evaluation.',
          link: '/quality/judge',
        },
        {
          title: '4. Review Results',
          description:
            'Check the Quality Dashboard for scores. Items below your confidence threshold will appear in the Human Review Queue for manual verification.',
          link: '/quality',
        },
      ],
    },
    {
      id: 'quality-evals',
      title: 'Quality Evals: Is the output good?',
      icon: Zap,
      iconColor: '#8B5CF6',
      description: 'Evaluate the quality of your LLM outputs',
      expanded: false,
      steps: [
        {
          title: 'LLM Judge',
          description:
            'Automated evaluation using AI. The judge model scores each output on accuracy, relevance, safety, and coherence. Supports both manual single evaluations and batch processing of trace files.',
          link: '/quality/judge',
        },
        {
          title: 'Human Review Queue',
          description:
            'When the LLM judge is uncertain (score below threshold), items go to the Human Review Queue. You can approve, reject, or add notes to each item.',
          link: '/quality/review',
        },
        {
          title: 'Test Results',
          description:
            'Run unit tests against your LLM outputs. Upload test cases in JSON format and verify correctness, safety, and edge case handling.',
          link: '/quality/tests',
        },
      ],
    },
    {
      id: 'operational-evals',
      title: 'Operational Evals: Can we run this in production?',
      icon: Activity,
      iconColor: '#14B8A6',
      description: 'Monitor performance, costs, and system health',
      expanded: false,
      steps: [
        {
          title: 'Performance',
          description:
            'Track latency metrics (P50, P95, P99) and throughput. The target is P95 latency under 30 seconds. View latency by model and trend over time.',
          link: '/operational/performance',
        },
        {
          title: 'Cost Analysis',
          description:
            'Monitor token usage and API costs. Track costs by provider, model, and daily trends. Get optimization suggestions to reduce spending. Target: under $0.25 per query.',
          link: '/operational/costs',
        },
        {
          title: 'Observability',
          description:
            'Monitor error rates, trace logs, and provider status. Target: over 95% success rate and under 5% error rate. View real-time trace logs and error breakdowns.',
          link: '/operational/observability',
        },
      ],
    },
    {
      id: 'configuration',
      title: 'Configuration',
      icon: Settings,
      iconColor: '#2563EB',
      description: 'Set up API connections and judge settings',
      expanded: false,
      steps: [
        {
          title: 'API Connections',
          description:
            'Add your API keys for Claude (Anthropic), OpenAI, and Gemini (Google). Each connection can be tested before saving. Keys are stored locally in your browser.',
          link: '/configuration',
        },
        {
          title: 'LLM Judge Settings',
          description:
            'Choose which provider and model will evaluate outputs. Select evaluation criteria (accuracy, relevance, safety, coherence) and set the confidence threshold.',
          link: '/configuration',
        },
        {
          title: 'Confidence Threshold',
          description:
            'Set the minimum score for automatic approval. Items below this threshold go to Human Review. Default is 0.8 (80%).',
          link: '/configuration',
        },
      ],
    },
  ]);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, expanded: !section.expanded } : section
      )
    );
  };

  const setupProgress = {
    configured: false, // Would check localStorage
    firstEval: false,
    reviewed: false,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-yellow-500" />
          Help & Getting Started
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Learn how to use CERT Framework for LLM evaluation
        </p>
      </div>

      {/* Quick Setup Checklist */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Setup Checklist</h2>
        <div className="space-y-3">
          <Link
            href="/configuration"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                setupProgress.configured
                  ? "bg-emerald-100 dark:bg-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-700"
              )}
            >
              {setupProgress.configured ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-xs font-medium text-zinc-500">1</span>
              )}
            </div>
            <span className="flex-1 text-sm text-zinc-900 dark:text-white">
              Configure at least one API connection
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </Link>

          <Link
            href="/configuration"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                setupProgress.configured
                  ? "bg-emerald-100 dark:bg-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-700"
              )}
            >
              {setupProgress.configured ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-xs font-medium text-zinc-500">2</span>
              )}
            </div>
            <span className="flex-1 text-sm text-zinc-900 dark:text-white">
              Set up LLM Judge configuration
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </Link>

          <Link
            href="/quality/judge"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                setupProgress.firstEval
                  ? "bg-emerald-100 dark:bg-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-700"
              )}
            >
              {setupProgress.firstEval ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-xs font-medium text-zinc-500">3</span>
              )}
            </div>
            <span className="flex-1 text-sm text-zinc-900 dark:text-white">
              Run your first evaluation
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </Link>

          <Link
            href="/quality"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors group"
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                setupProgress.reviewed
                  ? "bg-emerald-100 dark:bg-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-700"
              )}
            >
              {setupProgress.reviewed ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-xs font-medium text-zinc-500">4</span>
              )}
            </div>
            <span className="flex-1 text-sm text-zinc-900 dark:text-white">
              Review the results
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
          </Link>
        </div>
      </div>

      {/* The Two Questions */}
      <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-500/10 dark:to-teal-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20 p-6">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">
          The Two Core Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-purple-200 dark:border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="font-medium text-zinc-900 dark:text-white">Quality Evals</h3>
            </div>
            <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
              Is the output good?
            </p>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>LLM Judge - Automated AI evaluation</li>
              <li>Human Review - Manual verification</li>
              <li>Test Results - Unit tests</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-teal-200 dark:border-teal-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-teal-500" />
              <h3 className="font-medium text-zinc-900 dark:text-white">Operational Evals</h3>
            </div>
            <p className="text-lg font-semibold text-teal-600 dark:text-teal-400 mb-2">
              Can we run this in production?
            </p>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>Performance - Latency P95 &lt; 30s</li>
              <li>Cost - API costs &lt; $0.25/query</li>
              <li>Observability - Error rates, traces</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${section.iconColor}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: section.iconColor }} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-zinc-900 dark:text-white">{section.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{section.description}</p>
                </div>
                {section.expanded ? (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-zinc-400" />
                )}
              </button>

              {section.expanded && (
                <div className="px-6 pb-6 space-y-4">
                  {section.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-zinc-900 dark:text-white mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {step.description}
                        </p>
                      </div>
                      {step.link && (
                        <Link
                          href={step.link}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 whitespace-nowrap"
                        >
                          Go <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Resources */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-6">
        <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">Additional Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://github.com/anthropics/cert-framework"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">GitHub Repository</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                View source code and documentation
              </p>
            </div>
          </a>
          <a
            href="https://docs.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-white">Anthropic Docs</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Learn about Claude API
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
