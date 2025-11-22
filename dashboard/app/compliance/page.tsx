'use client';

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Icon mapping for compatibility
const ShieldCheckIcon = Shield;
const ExclamationTriangleIcon = AlertTriangle;
const CheckCircleIcon = CheckCircle;
const XCircleIcon = XCircle;
const DocumentTextIcon = FileText;
const ArrowRightIcon = ArrowRight;
const ChevronDownIcon = ChevronDown;
const ChevronUpIcon = ChevronUp;

// EU AI Act Articles with compliance status
const complianceArticles = [
  {
    id: 'art-6',
    article: 'Article 6',
    title: 'Classification Rules for High-Risk AI Systems',
    description: 'AI systems that fall under Annex III categories must be classified as high-risk.',
    status: 'compliant',
    score: 95,
    requirements: 4,
    fulfilled: 4,
    lastReview: '2024-01-15',
  },
  {
    id: 'art-9',
    article: 'Article 9',
    title: 'Risk Management System',
    description: 'High-risk AI systems must have a risk management system in place throughout their lifecycle.',
    status: 'warning',
    score: 78,
    requirements: 6,
    fulfilled: 5,
    lastReview: '2024-01-12',
  },
  {
    id: 'art-10',
    article: 'Article 10',
    title: 'Data and Data Governance',
    description: 'Training, validation, and testing data sets must meet quality criteria.',
    status: 'compliant',
    score: 92,
    requirements: 5,
    fulfilled: 5,
    lastReview: '2024-01-14',
  },
  {
    id: 'art-11',
    article: 'Article 11',
    title: 'Technical Documentation',
    description: 'Detailed technical documentation must be maintained and kept up to date.',
    status: 'non-compliant',
    score: 65,
    requirements: 8,
    fulfilled: 5,
    lastReview: '2024-01-10',
  },
  {
    id: 'art-12',
    article: 'Article 12',
    title: 'Record-Keeping',
    description: 'Automatic logging capabilities to ensure traceability of AI system functioning.',
    status: 'compliant',
    score: 98,
    requirements: 3,
    fulfilled: 3,
    lastReview: '2024-01-15',
  },
  {
    id: 'art-13',
    article: 'Article 13',
    title: 'Transparency and Provision of Information',
    description: 'High-risk AI systems must be designed to enable users to understand outputs.',
    status: 'warning',
    score: 82,
    requirements: 4,
    fulfilled: 3,
    lastReview: '2024-01-13',
  },
  {
    id: 'art-14',
    article: 'Article 14',
    title: 'Human Oversight',
    description: 'AI systems must enable effective human oversight during use.',
    status: 'compliant',
    score: 90,
    requirements: 5,
    fulfilled: 5,
    lastReview: '2024-01-14',
  },
  {
    id: 'art-15',
    article: 'Article 15',
    title: 'Accuracy, Robustness, and Cybersecurity',
    description: 'High-risk AI systems must achieve appropriate levels of accuracy and robustness.',
    status: 'compliant',
    score: 88,
    requirements: 6,
    fulfilled: 5,
    lastReview: '2024-01-15',
  },
];

export default function CompliancePage() {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'non-compliant':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'non-compliant':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const overallScore = Math.round(
    complianceArticles.reduce((acc, art) => acc + art.score, 0) / complianceArticles.length
  );

  const compliantCount = complianceArticles.filter((a) => a.status === 'compliant').length;
  const warningCount = complianceArticles.filter((a) => a.status === 'warning').length;
  const nonCompliantCount = complianceArticles.filter((a) => a.status === 'non-compliant').length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              EU AI Act Compliance Center
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Track and manage compliance with EU AI Act requirements across all articles
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Overall Score */}
          <div className="card p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall Score</div>
            <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(overallScore)}`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </div>

          {/* Compliant */}
          <div className="card p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
              Compliant
            </div>
            <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              {compliantCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">articles</div>
          </div>

          {/* Needs Review */}
          <div className="card p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              Needs Review
            </div>
            <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {warningCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">articles</div>
          </div>

          {/* Action Required */}
          <div className="card p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <XCircleIcon className="h-4 w-4 text-red-500" />
              Action Required
            </div>
            <div className="text-4xl font-bold text-red-600 dark:text-red-400">
              {nonCompliantCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">articles</div>
          </div>
        </div>

        {/* Compliance Articles List */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Article Compliance Status
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {complianceArticles.map((article) => (
              <div key={article.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedArticle(expandedArticle === article.id ? null : article.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(article.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {article.article}:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">{article.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {article.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getScoreColor(article.score)}`}>
                        {article.score}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {article.fulfilled}/{article.requirements} requirements
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        article.status
                      )}`}
                    >
                      {article.status === 'compliant'
                        ? 'Compliant'
                        : article.status === 'warning'
                        ? 'Review'
                        : 'Action Required'}
                    </span>
                    {expandedArticle === article.id ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedArticle === article.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Last Review
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {article.lastReview}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Requirements Met
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {article.fulfilled} of {article.requirements}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Next Action
                        </div>
                        <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          View Details <ArrowRightIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="card p-6 hover:shadow-lg transition-shadow text-left group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Generate Compliance Report</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create a detailed compliance report for stakeholders
                </p>
              </div>
            </div>
          </button>

          <button className="card p-6 hover:shadow-lg transition-shadow text-left group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Run Compliance Audit</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start a new automated compliance audit
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
