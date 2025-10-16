'use client'

import { useState, useEffect } from 'react'
import { TestPanel } from './components/TestPanel'
import { ConfigPanel } from './components/ConfigPanel'
import { ResultPanel } from './components/ResultPanel'
import type { GroundTruth, TestResult } from '@cert/core'

export default function Inspector() {
  const [tests, setTests] = useState<GroundTruth[]>([
    {
      id: 'example-test',
      question: 'What is the answer?',
      expected: '42',
      equivalents: ['forty-two', 'forty two'],
      metadata: {
        source: 'example.txt',
        category: 'basic',
      },
    },
  ])

  const [selectedTest, setSelectedTest] = useState<string | null>('example-test')
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // Load real test results from API
  useEffect(() => {
    async function loadResults() {
      try {
        const response = await fetch('/api/results')
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Failed to load results:', error)
      }
    }

    loadResults()

    // Refresh results every 5 seconds
    const interval = setInterval(loadResults, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAddTest = () => {
    const newTest: GroundTruth = {
      id: `test-${Date.now()}`,
      question: 'New test question',
      expected: 'Expected output',
      metadata: {
        category: 'uncategorized',
      },
    }
    setTests([...tests, newTest])
    setSelectedTest(newTest.id)
  }

  const handleRunTest = async (testId: string) => {
    setIsRunning(true)

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockResult: TestResult = {
      testId,
      timestamp: new Date(),
      status: Math.random() > 0.5 ? 'pass' : 'fail',
      consistency: 0.85 + Math.random() * 0.15,
      accuracy: 0.90 + Math.random() * 0.10,
      evidence: {
        outputs: ['42', '42', '43'],
        uniqueCount: 2,
        examples: ['"42"', '"43"'],
      },
      diagnosis: 'Test completed with minor variance',
      suggestions: [
        'Set temperature=0 for consistency',
        'Review prompt for ambiguity',
      ],
    }

    setResults(prev => [mockResult, ...prev])
    setIsRunning(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel: Test Suite */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <TestPanel
          tests={tests}
          selectedTest={selectedTest}
          onSelectTest={setSelectedTest}
          onAddTest={handleAddTest}
        />
      </div>

      {/* Middle Panel: Test Configuration */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <ConfigPanel
          selectedTest={tests.find(t => t.id === selectedTest)}
          onRunTest={handleRunTest}
          isRunning={isRunning}
        />
      </div>

      {/* Right Panel: Results */}
      <div className="w-1/3 bg-white overflow-y-auto">
        <ResultPanel
          results={results}
          selectedTestId={selectedTest}
        />
      </div>
    </div>
  )
}
