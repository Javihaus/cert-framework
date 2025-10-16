/**
 * @cert/core - Core testing primitives for CERT framework
 *
 * This package provides the foundational types and functions for testing
 * LLM system reliability, focusing on consistency, accuracy, and failure diagnosis.
 */

// Export all types
export type {
  GroundTruth,
  TestResult,
  TestConfig,
  ConsistencyResult,
  ComparisonResult,
  FailureLocalization,
  AgentResult,
  DegradationAlert,
  Agent,
} from './types.js';

// Export consistency measurement functions
export {
  measureConsistency,
  autodiagnoseVariance,
  hasPromptVariance,
  mean,
  intersection,
} from './consistency.js';

// Export test runner
export { TestRunner } from './runner.js';

// Export pipeline analyzer
export { PipelineAnalyzer } from './pipeline.js';

// Export storage
export type { MetricsStorage } from './storage.js';
export { InMemoryStorage, SQLiteStorage, createStorage } from './storage.js';
export { JSONStorage } from './json-storage.js';
