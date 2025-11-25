'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Zap,
  Activity,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the user has configured API connections
    const checkConfiguration = () => {
      const connections = localStorage.getItem('cert-api-connections');
      const judgeConfig = localStorage.getItem('cert-judge-config');

      if (connections && judgeConfig) {
        try {
          const parsedConnections = JSON.parse(connections);
          const hasActiveConnection = parsedConnections.some(
            (c: { status: string }) => c.status === 'connected'
          );
          setIsConfigured(hasActiveConnection);
        } catch (e) {
          setIsConfigured(false);
        }
      } else {
        setIsConfigured(false);
      }
      setLoading(false);
    };

    checkConfiguration();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          CERT Framework
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          LLM Evaluation & Monitoring Dashboard
        </p>
      </div>

      {/* Configuration Status */}
      {!isConfigured && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Get Started
              </h2>
              <p className="text-amber-700 dark:text-amber-400 text-sm mb-4">
                Configure your API connections to start evaluating LLM outputs. Add at least one provider (Claude, OpenAI, or Gemini) to enable all features.
              </p>
              <Link
                href="/configuration"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configure Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* The Two Questions */}
      <div className="bg-gradient-to-r from-purple-50 to-teal-50 dark:from-purple-500/10 dark:to-teal-500/10 rounded-xl border border-purple-200/50 dark:border-purple-500/20 p-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white text-center mb-6">
          The Two Core Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/quality"
            className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Quality Evals</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  Is the output good?
                </p>
              </div>
            </div>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                LLM Judge - Automated AI evaluation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                Human Review - Manual verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                Test Results - Unit tests
              </li>
            </ul>
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
              Explore Quality
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/operational/performance"
            className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-teal-200 dark:border-teal-500/30 hover:border-teal-400 dark:hover:border-teal-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Operational Evals</h3>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  Can we run this in production?
                </p>
              </div>
            </div>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                Performance - Latency P95 &lt; 30s
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                Cost - API costs &lt; $0.25/query
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500" />
                Observability - Error rates, traces
              </li>
            </ul>
            <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
              Explore Operations
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/configuration"
          className={cn(
            "bg-white dark:bg-zinc-800 rounded-xl border p-6 transition-colors group",
            isConfigured
              ? "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              : "border-blue-300 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500/50"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isConfigured
                  ? "bg-emerald-100 dark:bg-emerald-500/20"
                  : "bg-blue-100 dark:bg-blue-500/20"
              )}
            >
              {isConfigured ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <span className="font-medium text-zinc-900 dark:text-white">Configuration</span>
            <ArrowRight className="w-4 h-4 text-zinc-400 ml-auto group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isConfigured
              ? 'API connections configured'
              : 'Set up API connections'}
          </p>
        </Link>

        <Link
          href="/quality/judge"
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium text-zinc-900 dark:text-white">LLM Judge</span>
            <ArrowRight className="w-4 h-4 text-zinc-400 ml-auto group-hover:text-purple-500 transition-colors" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Run automated evaluations
          </p>
        </Link>

        <Link
          href="/help"
          className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 hover:border-yellow-300 dark:hover:border-yellow-500/50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="font-medium text-zinc-900 dark:text-white">Help</span>
            <ArrowRight className="w-4 h-4 text-zinc-400 ml-auto group-hover:text-yellow-500 transition-colors" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Getting started guide
          </p>
        </Link>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          Based on the{' '}
          <a
            href="https://www.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Anthropic
          </a>{' '}
          evaluation framework for production LLM systems
        </p>
      </div>
    </div>
  );
}
