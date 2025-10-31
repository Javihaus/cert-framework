'use client';

import { useState } from 'react';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';

interface EvaluationDashboardProps {
  summary: EvaluationSummary;
  results: EvaluationResult[];
}

export default function EvaluationDashboard({ summary, results }: EvaluationDashboardProps) {
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Accuracy"
          value={`${(summary.accuracy * 100).toFixed(1)}%`}
          color={summary.accuracy >= 0.9 ? 'green' : summary.accuracy >= 0.8 ? 'yellow' : 'red'}
        />

        <MetricCard
          label="Total Traces"
          value={summary.total_traces.toString()}
          color="blue"
        />

        <MetricCard
          label="Passed"
          value={summary.passed_traces.toString()}
          color="green"
        />

        <MetricCard
          label="Failed"
          value={summary.failed_traces.toString()}
          color="red"
        />
      </div>

      {/* Confidence Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Mean Confidence</h3>
        <div className="text-3xl font-bold text-blue-600">
          {summary.mean_confidence.toFixed(3)}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Threshold: {summary.threshold_used.toFixed(2)}
        </p>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Evaluation Results</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {result.query}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      result.measurement.confidence >= summary.threshold_used
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {result.measurement.confidence.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.passed ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Passed
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedResult && (
        <ResultDetailsModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  color: 'green' | 'yellow' | 'red' | 'blue';
}

function MetricCard({ label, value, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ResultDetailsModal({ result, onClose }: { result: EvaluationResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Evaluation Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{result.query}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Score</label>
            <p className="text-2xl font-bold text-blue-600">{result.measurement.confidence.toFixed(3)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Components</label>
            <div className="flex gap-2">
              {result.measurement.components_used.map((component, idx) => (
                <span key={idx} className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                  {component}
                </span>
              ))}
            </div>
          </div>

          {result.measurement.semantic_score !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semantic Score</label>
              <p className="text-lg font-semibold">{result.measurement.semantic_score.toFixed(3)}</p>
            </div>
          )}

          {result.measurement.grounding_score !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grounding Score</label>
              <p className="text-lg font-semibold">{result.measurement.grounding_score.toFixed(3)}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule</label>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{result.measurement.rule}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
