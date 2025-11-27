'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Activity,
  ArrowRight,
  CheckCircle,
  Shield,
} from 'lucide-react';

export default function HomePage() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        <div className="animate-spin w-8 h-8 border-2 border-[#3C6098] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-120px)]">
      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {/* Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/quality"
            className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-[#10069F]" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Quality Evals</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Is the output good?
                </p>
              </div>
            </div>
            <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1.5 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                LLM Judge - Automated AI evaluation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                Human Review - Manual verification
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                Test Results - Unit tests
              </li>
            </ul>
            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 text-sm font-medium group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              Explore
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/operational/performance"
            className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-6 h-6 text-[#10069F]" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Operational Evals</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Can we run this in production?
                </p>
              </div>
            </div>
            <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1.5 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                Performance - Latency P95 &lt; 30s
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                Cost - API costs &lt; $0.25/query
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                Observability - Error rates, traces
              </li>
            </ul>
            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 text-sm font-medium group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              Explore
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-700">
        <div className="space-y-6">
          {/* Security Notice */}
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#10069F] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-white mb-1">
                  Security & Privacy Notice
                </p>
                <p className="text-zinc-500 dark:text-zinc-400">
                  API keys and credentials are sensitive information. This application is designed to be
                  self-hosted on your own infrastructure. All data remains on your premises and is never
                  transmitted to external servers. We recommend deploying this application within your
                  organization&apos;s secure network environment in compliance with your data protection
                  policies and applicable regulations (GDPR, CCPA, and other data protection laws).
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 pb-4">
            <p>&copy; 2025 CERT Framework. All rights reserved.</p>
            <p className="mt-1 text-xs">
              This software is provided for evaluation and monitoring of LLM systems.
              Users are responsible for ensuring compliance with all applicable laws and regulations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
