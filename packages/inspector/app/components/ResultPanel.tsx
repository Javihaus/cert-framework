import type { TestResult } from '@cert/core'

interface ResultPanelProps {
  results: TestResult[]
  selectedTestId: string | null
}

export function ResultPanel({ results, selectedTestId }: ResultPanelProps) {
  const filteredResults = selectedTestId
    ? results.filter(r => r.testId === selectedTestId)
    : results

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Results</h2>

      {filteredResults.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No results yet. Run a test to see results here.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result, idx) => (
            <ResultCard key={idx} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultCard({ result }: { result: TestResult }) {
  const statusColor = {
    pass: 'border-green-500 bg-green-50',
    fail: 'border-red-500 bg-red-50',
    warn: 'border-yellow-500 bg-yellow-50',
  }[result.status]

  const statusIcon = {
    pass: '✓',
    fail: '✗',
    warn: '⚠',
  }[result.status]

  return (
    <div className={`p-4 border rounded ${statusColor}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{statusIcon}</span>
          <span className="font-bold">{result.testId}</span>
        </div>
        <span className="text-xs text-gray-600">
          {result.timestamp.toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {result.consistency !== undefined && (
          <div className="flex justify-between">
            <span>Consistency:</span>
            <span className="font-mono font-bold">
              {(result.consistency * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {result.accuracy !== undefined && (
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span className="font-mono font-bold">
              {(result.accuracy * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {result.status === 'fail' && (
        <>
          {result.diagnosis && (
            <div className="mt-3 p-2 bg-white rounded text-sm">
              <div className="font-medium mb-1">Diagnosis:</div>
              <div className="text-gray-700">{result.diagnosis}</div>
            </div>
          )}

          {result.evidence && (
            <div className="mt-3 p-2 bg-white rounded text-sm">
              <div className="font-medium mb-1">
                Outputs ({result.evidence.uniqueCount} unique):
              </div>
              {result.evidence.examples.slice(0, 3).map((ex, i) => (
                <div key={i} className="font-mono text-xs bg-gray-50 p-1 mt-1 rounded">
                  {ex}
                </div>
              ))}
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="mt-3 p-2 bg-white rounded text-sm">
              <div className="font-medium mb-1">Suggestions:</div>
              <ul className="list-disc list-inside space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-gray-700">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
