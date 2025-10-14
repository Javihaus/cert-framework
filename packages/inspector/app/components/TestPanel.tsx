import type { GroundTruth } from '@cert/core'

interface TestPanelProps {
  tests: GroundTruth[]
  selectedTest: string | null
  onSelectTest: (id: string) => void
  onAddTest: () => void
}

export function TestPanel({ tests, selectedTest, onSelectTest, onAddTest }: TestPanelProps) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tests</h2>
        <button
          onClick={onAddTest}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New Test
        </button>
      </div>

      <div className="space-y-2">
        {tests.map((test) => (
          <div
            key={test.id}
            onClick={() => onSelectTest(test.id)}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedTest === test.id
                ? 'bg-blue-50 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">{test.id}</div>
            <div className="text-sm text-gray-600 truncate">{test.question}</div>
            {test.metadata?.category && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-200 rounded">
                {test.metadata.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
