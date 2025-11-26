'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Card from '@/components/Card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navigation activeSection="documentation" onSectionChange={() => {}} />

      <div className="max-w-[900px] mx-auto px-8 py-12 flex-1">
        <Card>
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
                Privacy Policy
              </h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400">
                Effective Date: November 7, 2025
              </p>
            </div>

            {/* Data Processing */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Data Processing
              </h2>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4">
                When you use the CERT Framework dashboard, all file processing occurs locally in your web browser. We do not receive, store, or have access to your uploaded files or the data they contain.
              </p>
              <ul className="pl-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 list-disc">
                <li className="mb-2">Your trace files never leave your computer</li>
                <li className="mb-2">PDF reports are generated in your browser</li>
                <li className="mb-2">No data is sent to our servers</li>
                <li className="mb-2">No data is stored in databases or logs</li>
              </ul>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Information We Collect
              </h2>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4">
                The CERT Framework dashboard collects minimal operational data:
              </p>
              <ul className="pl-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4 list-disc">
                <li className="mb-2">Basic usage analytics (page views, feature usage)</li>
                <li className="mb-2">Technical error logs (for debugging purposes only)</li>
              </ul>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 font-semibold mb-2">
                We do NOT collect:
              </p>
              <ul className="pl-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 list-disc">
                <li className="mb-2">Uploaded file contents</li>
                <li className="mb-2">Evaluation results</li>
                <li className="mb-2">Any data from your AI systems</li>
              </ul>
            </div>

            {/* Third-Party Services */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Third-Party Services
              </h2>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                Our dashboard is hosted on Vercel. While we don't send your evaluation data to servers, Vercel may collect standard web hosting analytics (IP addresses, page load times) as part of their infrastructure.
              </p>
            </div>

            {/* GDPR Rights */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Your Rights (GDPR)
              </h2>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4">
                Under the General Data Protection Regulation, you have rights to:
              </p>
              <ul className="pl-6 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4 list-disc">
                <li className="mb-2">Access any personal data we hold</li>
                <li className="mb-2">Request deletion of your data</li>
                <li className="mb-2">Object to processing</li>
                <li className="mb-2">Lodge a complaint with your supervisory authority</li>
              </ul>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                Since we don't store your evaluation data, these rights are automatically fulfilled - we cannot access what we never collected.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
                Contact
              </h2>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-3">
                For privacy questions:{' '}
                <a href="mailto:javier@jmarin.info" className="text-[#3C6098] dark:text-[#3C6098] underline hover:text-[#3C6098]/80 dark:hover:text-[#3C6098]/80">
                  javier@jmarin.info
                </a>
              </p>
              <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                Data Controller:<br />
                CERT Framework<br />
                Madrid, Spain
              </p>
            </div>

            {/* Updates */}
            <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">
                Policy Updates
              </h3>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of the dashboard after such changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
