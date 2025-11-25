'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Zap,
  Activity,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Add Connection Button */}
      <div className="flex flex-col items-center justify-center py-16">
        <Link
          href="/configuration"
          className="group flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-700 transition-colors">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <span className="text-zinc-600 dark:text-zinc-400 text-sm">
            Add a new connection
          </span>
        </Link>
      </div>

      {/* Two Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/quality"
          className="bg-white dark:bg-zinc-800 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
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
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
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
  );
}
