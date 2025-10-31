'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import EvaluationDashboard from '@/components/EvaluationDashboard';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';

export default function Home() {
  const [evaluationData, setEvaluationData] = useState<{
    summary: EvaluationSummary;
    results: EvaluationResult[];
  } | null>(null);

  const handleEvaluationFileLoad = (data: any) => {
    // cert-framework evaluation results have this structure:
    // { summary: {...}, results: [...] }
    if (data.summary && data.results) {
      setEvaluationData(data);
    } else {
      alert('Invalid evaluation file format');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            cert-framework Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            EU AI Act Article 15 Compliance Monitoring
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!evaluationData ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-6">Upload Evaluation Results</h2>

            <FileUpload
              onFileLoad={handleEvaluationFileLoad}
              accept=".json"
              label="Evaluation Results (JSON)"
            />

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                How to generate evaluation results:
              </h3>
              <pre className="text-xs text-blue-800 bg-blue-100 p-3 rounded overflow-x-auto">
{`from cert.evaluation import Evaluator

evaluator = Evaluator(threshold=0.7)
results = evaluator.evaluate_log_file(
    log_file="production_traces.jsonl",
    output="evaluation_results.json"
)`}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setEvaluationData(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ← Load Different File
            </button>

            <EvaluationDashboard
              summary={evaluationData.summary}
              results={evaluationData.results}
            />
          </div>
        )}
      </div>
    </main>
  );
}
