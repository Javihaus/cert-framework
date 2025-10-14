import type { GroundTruth } from '@cert/core'

interface ConfigPanelProps {
  selectedTest: GroundTruth | undefined
  onRunTest: (testId: string) => void
  isRunning: boolean
}

export function ConfigPanel({ selectedTest, onRunTest, isRunning }: ConfigPanelProps) {
  if (!selectedTest) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a test to configure
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test ID</label>
          <input
            type="text"
            value={selectedTest.id}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <textarea
            value={selectedTest.question}
            readOnly
            rows={3}
            className="w-full px-3 py-2 border rounded bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expected Output</label>
          <input
            type="text"
            value={String(selectedTest.expected)}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-50"
          />
        </div>

        {selectedTest.equivalents && selectedTest.equivalents.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Equivalents</label>
            <div className="space-y-1">
              {selectedTest.equivalents.map((eq, i) => (
                <div key={i} className="px-3 py-2 border rounded bg-gray-50 text-sm">
                  {eq}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <h3 className="font-medium mb-2">Test Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Consistency Threshold:</span>
              <span className="font-mono">0.85</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy Threshold:</span>
              <span className="font-mono">0.80</span>
            </div>
            <div className="flex justify-between">
              <span>Number of Trials:</span>
              <span className="font-mono">10</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onRunTest(selectedTest.id)}
          disabled={isRunning}
          className={`w-full px-4 py-2 rounded font-medium ${
            isRunning
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Test'}
        </button>
      </div>
    </div>
  )
}
