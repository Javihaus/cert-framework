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
    <>
      {/* Hero - Full width */}
      <section className="relative bg-[#F6F9FC] dark:bg-[#0A0E14] overflow-hidden">
        {/* Radial gradient background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[140%] h-full bg-[radial-gradient(ellipse_at_center,rgba(16,6,159,0.08)_0%,transparent_70%)]" />
        </div>

        {/* Content */}
        <div className="relative max-w-[1200px] mx-auto px-6 py-32 text-center">
          <h1 className="text-[40px] md:text-[64px] font-bold leading-[1.1] tracking-[-0.03em] text-[#0A2540] dark:text-[#E8ECF1] mb-6">
            Deploy AI systems<br />with confidence
          </h1>

          <p className="text-[20px] leading-[1.6] text-[#596780] dark:text-[#8792A2] max-w-[680px] mx-auto mb-10">
            CERT monitors quality and operational metrics across your LLM infrastructure. Know your systems are production-ready before they fail.
          </p>

          <Link
            href="/quality"
            className="inline-flex items-center gap-2 bg-[#10069F] text-white px-8 py-3.5 rounded-lg font-semibold text-base border border-[#10069F] hover:bg-[#2a3759] hover:border-[#2a3759] transition-all hover:-translate-y-0.5"
          >
            Start monitoring
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Main content - Contained */}
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Quality Evals Card */}
          <Link href="/quality" className="group block">
            <div className="h-full bg-[#FFFFFF] dark:bg-[#151B24] border border-[#E3E8EE] dark:border-[#1D2530] rounded-xl p-10 transition-all hover:border-2 hover:border-[#10069F] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,6,159,0.12)]">
              {/* Icon */}
              <div className="text-[#10069F] dark:text-[#9fc2e9] mb-6">
                <Zap className="w-8 h-8" strokeWidth={2} />
              </div>

              {/* Title */}
              <h2 className="text-[24px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Quality Evals
              </h2>

              {/* Subtitle */}
              <p className="text-[15px] text-[#596780] dark:text-[#8792A2] mb-6">
                Is the output good?
              </p>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-3 text-[14px] text-[#596780] dark:text-[#8792A2] leading-[1.6]">
                  <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#7b8f45]" strokeWidth={2.5} />
                  <span>LLM Judge - Automated AI evaluation</span>
                </li>
                <li className="flex items-start gap-3 text-[14px] text-[#596780] dark:text-[#8792A2] leading-[1.6]">
                  <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#7b8f45]" strokeWidth={2.5} />
                  <span>Human Review - Manual verification</span>
                </li>
                <li className="flex items-start gap-3 text-[14px] text-[#596780] dark:text-[#8792A2] leading-[1.6]">
                  <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#7b8f45]" strokeWidth={2.5} />
                  <span>Test Results - Unit tests</span>
                </li>
              </ul>

              {/* Explore link */}
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#10069F] dark:text-[#7ea0bf] group-hover:gap-3 transition-all">
                Explore
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Operational Evals Card */}
          <Link href="/operational/performance" className="group block">
            <div className="h-full bg-[#FFFFFF] dark:bg-[#151B24] border border-[#E3E8EE] dark:border-[#1D2530] rounded-xl p-10 transition-all hover:border-2 hover:border-[#10069F] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,6,159,0.12)]">
              {/* Icon */}
              <div className="text-[#10069F] dark:text-[#9fc2e9] mb-6">
                <Activity className="w-8 h-8" strokeWidth={2} />
              </div>

              {/* Title */}
              <h2 className="text-[24px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-2">
                Operational Evals
              </h2>

              {/* Subtitle */}
              <p className="text-[15px] text-[#596780] dark:text-[#8792A2] mb-6">
                Can we run this in production?
              </p>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-3 text-[14px] text-[#596780] dark:text-[#8792A2] leading-[1.6]">
                  <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#7b8f45]" strokeWidth={2.5} />
                  <span>Performance - Latency P95 &lt; 30s</span>
                </li>
                <li className="flex items-start gap-3 text-[14px] text-[#596780] dark:text-[#8792A2] leading-[1.6]">
                  <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#7b8f45]" strokeWidth={2.5} />
                  <span>Cost - API costs &lt; $0.25/query</span>
                </li>
                <li className="flex items-start gap-3 text-[14px] text-[#596780] dark:text-[#8792A2] leading-[1.6]">
                  <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 mt-0.5 text-[#7b8f45]" strokeWidth={2.5} />
                  <span>Observability - Error rates, traces</span>
                </li>
              </ul>

              {/* Explore link */}
              <span className="inline-flex items-center gap-2 text-[14px] font-medium text-[#10069F] dark:text-[#7ea0bf] group-hover:gap-3 transition-all">
                Explore
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>

        {/* Trust Section */}
        <div className="mb-20">
          {/* Section label */}
          <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8792A2] mb-6">
            Why CERT
          </div>

          {/* Trust grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Self-hosted */}
            <div className="bg-[#FFFFFF] dark:bg-[#151B24] border border-[#10069F] rounded-xl p-8">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-[#10069F] dark:text-[#9fc2e9]" strokeWidth={2} />
                <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
                  Self-Hosted
                </h3>
              </div>
              <p className="text-[13px] leading-[1.6] text-[#596780] dark:text-[#8792A2]">
                All data stays on your infrastructure. GDPR compliant by design.
              </p>
            </div>

            {/* Production Grade */}
            <div className="bg-[#FFFFFF] dark:bg-[#151B24] border border-[#10069F] rounded-xl p-8">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-[#10069F] dark:text-[#9fc2e9]" strokeWidth={2} />
                <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
                  Production Grade
                </h3>
              </div>
              <p className="text-[13px] leading-[1.6] text-[#596780] dark:text-[#8792A2]">
                Built for scale. Monitor thousands of queries with sub-second latency.
              </p>
            </div>

            {/* Framework Agnostic */}
            <div className="bg-[#FFFFFF] dark:bg-[#151B24] border border-[#10069F] rounded-xl p-8">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-[#10069F] dark:text-[#9fc2e9]" strokeWidth={2} />
                <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1]">
                  Framework Agnostic
                </h3>
              </div>
              <p className="text-[13px] leading-[1.6] text-[#596780] dark:text-[#8792A2]">
                Works with OpenAI, Anthropic, LangChain, LlamaIndex, and custom systems.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8">
          <div className="space-y-6">
            {/* Security Notice */}
            <div className="bg-[#FFFFFF] dark:bg-[#151B24] border border-[#10069F] rounded-xl p-8">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#10069F] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0A2540] dark:text-[#E8ECF1] mb-3">
                    Security & Privacy Notice
                  </h3>
                  <p className="text-[13px] leading-[1.6] text-[#596780] dark:text-[#8792A2]">
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
    </>
  );
}
