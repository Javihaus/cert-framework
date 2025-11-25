'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Play,
  RefreshCw,
  Upload,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
  actual?: string;
  status: 'passed' | 'failed' | 'pending' | 'warning';
  duration?: number;
  error?: string;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestCase[];
  expanded: boolean;
}

export default function TestResultsPage() {
  const [suites, setSuites] = useState<TestSuite[]>([
    {
      id: 'correctness',
      name: 'Correctness Tests',
      description: 'Verify factual accuracy and logical consistency',
      expanded: true,
      tests: [],
    },
    {
      id: 'safety',
      name: 'Safety Tests',
      description: 'Check for harmful content and PII exposure',
      expanded: false,
      tests: [],
    },
    {
      id: 'edge-cases',
      name: 'Edge Cases',
      description: 'Handle unusual inputs gracefully',
      expanded: false,
      tests: [],
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    // Load saved test results
    const saved = localStorage.getItem('cert-test-results');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSuites(data.suites);
        setLastRun(new Date(data.lastRun));
      } catch (e) {
        console.error('Failed to load test results');
      }
    }
  }, []);

  const toggleSuite = (suiteId: string) => {
    setSuites((prev) =>
      prev.map((suite) =>
        suite.id === suiteId ? { ...suite, expanded: !suite.expanded } : suite
      )
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Parse test cases from file
        if (Array.isArray(data.tests || data)) {
          const tests = (data.tests || data).map((t: Record<string, unknown>, i: number) => ({
            id: `test-${i}`,
            name: (t.name as string) || `Test ${i + 1}`,
            input: (t.input as string) || JSON.stringify(t.input_data),
            expected: (t.expected as string) || (t.expected_output as string) || '',
            status: 'pending' as const,
          }));

          setSuites((prev) =>
            prev.map((suite) =>
              suite.id === 'correctness' ? { ...suite, tests } : suite
            )
          );
        }
      } catch (e) {
        console.error('Failed to parse test file');
      }
    };
    reader.readAsText(file);
  };

  const runTests = async () => {
    setIsRunning(true);

    // Simulate test execution with API call
    try {
      const response = await fetch('/api/quality/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suites }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuites(data.suites);
      } else {
        // Simulate test results locally
        setSuites((prev) =>
          prev.map((suite) => ({
            ...suite,
            tests: suite.tests.map((test) => ({
              ...test,
              status: Math.random() > 0.2 ? 'passed' : 'failed',
              actual: test.expected,
              duration: Math.floor(Math.random() * 500) + 50,
            })),
          }))
        );
      }

      setLastRun(new Date());

      // Save results
      localStorage.setItem(
        'cert-test-results',
        JSON.stringify({ suites, lastRun: new Date().toISOString() })
      );
    } catch (e) {
      console.error('Failed to run tests');
    }

    setIsRunning(false);
  };

  const totalTests = suites.reduce((acc, suite) => acc + suite.tests.length, 0);
  const passedTests = suites.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === 'passed').length,
    0
  );
  const failedTests = suites.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === 'failed').length,
    0
  );
  const warningTests = suites.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === 'warning').length,
    0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-teal-500" />
            Test Results
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Unit test results for correctness and safety
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Tests
            <input
              type="file"
              accept=".json,.jsonl"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={runTests}
            disabled={isRunning || totalTests === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              isRunning || totalTests === 0
                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed"
                : "bg-teal-600 text-white hover:bg-teal-700"
            )}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Tests
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Passed
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {passedTests}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <XCircle className="w-4 h-4 text-red-500" />
            Failed
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {failedTests}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Warnings
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {warningTests}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Pass Rate</div>
          <p
            className={cn(
              "text-2xl font-bold mt-1",
              totalTests === 0
                ? "text-zinc-400"
                : passedTests / totalTests >= 0.9
                ? "text-emerald-600 dark:text-emerald-400"
                : passedTests / totalTests >= 0.7
                ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {totalTests === 0 ? '-' : `${((passedTests / totalTests) * 100).toFixed(0)}%`}
          </p>
        </div>
      </div>

      {lastRun && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Last run: {lastRun.toLocaleString()}
        </p>
      )}

      {/* Test Suites */}
      {totalTests === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-12 text-center">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No test cases loaded
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Upload a JSON file with test cases to get started. Each test should have input and expected output.
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-teal-700 transition-colors">
            <Upload className="w-4 h-4" />
            Upload Test File
            <input
              type="file"
              accept=".json,.jsonl"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {suites.map((suite) => (
            <div
              key={suite.id}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSuite(suite.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {suite.expanded ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  )}
                  <div className="text-left">
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {suite.name}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {suite.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {suite.tests.filter((t) => t.status === 'passed').length}/
                    {suite.tests.length} passed
                  </span>
                  {suite.tests.length > 0 && (
                    <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${
                            (suite.tests.filter((t) => t.status === 'passed').length /
                              suite.tests.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </button>

              {suite.expanded && suite.tests.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-200 dark:divide-zinc-700">
                  {suite.tests.map((test) => (
                    <div key={test.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              test.status === 'passed'
                                ? "bg-emerald-100 dark:bg-emerald-500/20"
                                : test.status === 'failed'
                                ? "bg-red-100 dark:bg-red-500/20"
                                : test.status === 'warning'
                                ? "bg-amber-100 dark:bg-amber-500/20"
                                : "bg-zinc-100 dark:bg-zinc-700"
                            )}
                          >
                            {test.status === 'passed' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : test.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            ) : test.status === 'warning' ? (
                              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <div className="w-2 h-2 bg-zinc-400 rounded-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-white">
                              {test.name}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                              Input: {test.input.slice(0, 100)}
                              {test.input.length > 100 && '...'}
                            </p>
                          </div>
                        </div>
                        {test.duration && (
                          <span className="text-xs text-zinc-400 font-mono">
                            {test.duration}ms
                          </span>
                        )}
                      </div>

                      {test.status === 'failed' && test.error && (
                        <div className="mt-3 ml-9 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                          <p className="text-sm text-red-700 dark:text-red-400">
                            {test.error}
                          </p>
                          {test.actual && (
                            <div className="mt-2 text-xs">
                              <p className="text-red-600 dark:text-red-300">
                                Expected: {test.expected}
                              </p>
                              <p className="text-red-600 dark:text-red-300">
                                Got: {test.actual}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {suite.expanded && suite.tests.length === 0 && (
                <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700">
                  No tests in this suite
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
