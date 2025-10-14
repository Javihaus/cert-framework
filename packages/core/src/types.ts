/**
 * Ground truth represents the expected behavior for a test case.
 * It defines what the system should output and how to validate it.
 */
export interface GroundTruth {
  /** Unique identifier for this test case */
  id: string;
  /** The input question or query to test */
  question: string;
  /** The expected output (can be string, number, or structured data) */
  expected: string | number | object;
  /** Alternative acceptable outputs that are semantically equivalent */
  equivalents?: string[];
  /** Additional metadata for validation */
  metadata?: {
    /** Page numbers where correct information can be found (for RAG systems) */
    correctPages?: number[];
    /** Source document or reference */
    source?: string;
    /** Category or type of test */
    category?: string;
    [key: string]: any;
  };
}

/**
 * Result of a test execution, capturing pass/fail status and diagnostic information.
 */
export interface TestResult {
  /** ID of the test that was run */
  testId: string;
  /** Test outcome */
  status: 'pass' | 'fail' | 'warn';
  /** Consistency score (0-1), measuring output stability across multiple runs */
  consistency?: number;
  /** Accuracy score (0-1), measuring correctness against ground truth */
  accuracy?: number;
  /** Evidence collected during the test */
  evidence?: {
    /** All outputs collected */
    outputs: string[];
    /** Number of unique outputs observed */
    uniqueCount: number;
    /** Representative examples of different outputs */
    examples: string[];
  };
  /** Human-readable explanation of why the test failed */
  diagnosis?: string;
  /** Actionable suggestions for fixing the issue */
  suggestions?: string[];
  /** When the test was executed */
  timestamp: Date;
}

/**
 * Configuration for test execution behavior.
 */
export interface TestConfig {
  /** Number of trials to run for consistency testing */
  nTrials: number;
  /** Minimum consistency score required to pass (0-1) */
  consistencyThreshold: number;
  /** Minimum accuracy score required to pass (0-1) */
  accuracyThreshold: number;
  /** Whether to use semantic comparison instead of exact matching */
  semanticComparison: boolean;
  /** Maximum time to wait for each trial (milliseconds) */
  timeout?: number;
}

/**
 * Result of a consistency measurement across multiple trials.
 */
export interface ConsistencyResult<T = any> {
  /** Consistency score (0-1), where 1 = all outputs identical */
  consistency: number;
  /** All outputs collected from trials */
  outputs: T[];
  /** Number of unique outputs observed */
  uniqueCount: number;
  /** Representative examples of different outputs */
  evidence: string[];
}

/**
 * Result of comparing actual output against expected output.
 */
export interface ComparisonResult {
  /** Whether the outputs match according to comparison rules */
  matched: boolean;
  /** Name of the rule that produced this result */
  rule?: string;
  /** Confidence score (0-1) for fuzzy matches */
  confidence: number;
}

/**
 * Result of analyzing a pipeline to locate failures.
 */
export interface FailureLocalization {
  /** Status of the analysis */
  status?: 'all-agents-consistent';
  /** Agent that is causing the failure (if any) */
  failingAgent?: string;
  /** Explanation of what the agent is doing wrong */
  diagnosis?: string;
  /** Evidence supporting the diagnosis */
  evidence?: string[];
  /** Recommendations for fixing the issue */
  suggestions?: string[];
}

/**
 * Result of testing a single agent in a pipeline.
 */
export interface AgentResult {
  /** Agent identifier */
  agent: string;
  /** Consistency score for this agent */
  consistency: number;
  /** Outputs produced by this agent */
  outputs: any[];
}

/**
 * Alert for metric degradation over time.
 */
export interface DegradationAlert {
  /** Test that is degrading */
  testId: string;
  /** Description of the degradation */
  message: string;
  /** Severity level */
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Represents an agent in a pipeline.
 */
export interface Agent {
  /** Agent name or identifier */
  name: string;
  /** Function to execute this agent */
  execute: (input: any) => Promise<any>;
}
