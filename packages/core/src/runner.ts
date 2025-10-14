import {
  GroundTruth,
  TestResult,
  TestConfig,
} from './types.js';
import {
  measureConsistency,
  autodiagnoseVariance,
  intersection,
} from './consistency.js';
import { MetricsStorage, createStorage } from './storage.js';

/**
 * Test runner with layer enforcement to ensure proper testing order.
 * Prevents testing consistency before validating accuracy.
 */
export class TestRunner {
  private groundTruths = new Map<string, GroundTruth>();
  private testStatuses = new Map<string, Map<string, boolean>>(); // testId -> layer -> passed
  private storage: MetricsStorage;
  private comparator: any; // Will be SemanticComparator from @cert/semantic

  constructor(dbPath?: string) {
    this.storage = createStorage(dbPath);
  }

  /**
   * Registers a ground truth for testing.
   */
  addGroundTruth(gt: GroundTruth): void {
    this.groundTruths.set(gt.id, gt);
    this.testStatuses.set(
      gt.id,
      new Map([
        ['retrieval', false],
        ['accuracy', false],
        ['consistency', false],
      ])
    );
  }

  /**
   * Sets the semantic comparator for accuracy testing.
   */
  setComparator(comparator: any): void {
    this.comparator = comparator;
  }

  /**
   * Layer 1: Validate retrieval FIRST.
   * Tests that the retrieval system finds the correct documents/chunks.
   */
  async testRetrieval(
    testId: string,
    retrieveFn: (query: string) => Promise<any[]>,
    options: { precisionMin: number }
  ): Promise<TestResult> {
    const gt = this.mustHaveGroundTruth(testId);

    const retrieved = await retrieveFn(gt.question);
    const pages = retrieved.map((r) => r.pageNum || r.page || r.id);

    const correctPages = gt.metadata?.correctPages || [];
    const correctFound = intersection(pages, correctPages);
    const precision = correctFound.length / Math.max(pages.length, 1);

    const result: TestResult = {
      testId,
      timestamp: new Date(),
      status: precision >= options.precisionMin ? 'pass' : 'fail',
      accuracy: precision,
    };

    if (result.status === 'fail') {
      result.diagnosis = `Retrieval precision ${precision.toFixed(
        2
      )} below minimum ${options.precisionMin}`;
      result.suggestions = [
        'Check chunking strategy (semantic vs fixed-size)',
        'Verify embedding model captures domain concepts',
        `Increase retrieval k parameter (currently returning ${pages.length} results)`,
        `Expected pages: ${correctPages.join(', ')}`,
        `Found pages: ${pages.join(', ')}`,
      ];
    } else {
      // Mark retrieval as passed
      this.testStatuses.get(testId)?.set('retrieval', true);
    }

    this.storage.save(result);
    return result;
  }

  /**
   * Layer 2: Validate accuracy (requires Layer 1 to pass).
   * Tests that the agent produces the correct output given proper context.
   */
  async testAccuracy(
    testId: string,
    agentFn: () => Promise<string>,
    options: { threshold: number }
  ): Promise<TestResult> {
    this.mustHavePassedRetrieval(testId);

    const gt = this.groundTruths.get(testId)!;
    const actual = await agentFn();

    // If comparator is set, use it; otherwise do simple string comparison
    let matched = false;
    let confidence = 0;

    if (this.comparator) {
      const compareResult = this.comparator.compareWithEquivalents(
        String(gt.expected),
        gt.equivalents,
        actual
      );
      matched = compareResult.matched;
      confidence = compareResult.confidence;
    } else {
      // Simple exact match
      matched = String(gt.expected).toLowerCase().trim() === actual.toLowerCase().trim();
      confidence = matched ? 1.0 : 0;
    }

    const result: TestResult = {
      testId,
      timestamp: new Date(),
      status:
        matched && confidence >= options.threshold ? 'pass' : 'fail',
      accuracy: confidence,
    };

    if (result.status === 'fail') {
      result.diagnosis = `Output "${actual}" doesn't match expected "${gt.expected}" (confidence: ${confidence.toFixed(
        2
      )})`;
      result.suggestions = [
        'Review agent prompt for clarity and specificity',
        'Check if retrieval provided correct context',
        'Verify prompt includes output format instructions',
        'Consider adding this output as an equivalent if semantically correct',
      ];
    } else {
      // Mark accuracy as passed
      this.testStatuses.get(testId)?.set('accuracy', true);
    }

    this.storage.save(result);
    return result;
  }

  /**
   * Layer 3: Validate consistency (requires Layer 1+2 to pass).
   * Tests that the agent produces consistent outputs across multiple runs.
   */
  async testConsistency(
    testId: string,
    agentFn: () => Promise<string>,
    config: TestConfig
  ): Promise<TestResult> {
    this.mustHavePassedAccuracy(testId);

    const consistencyResult = await measureConsistency(agentFn, config);

    const result: TestResult = {
      testId,
      timestamp: new Date(),
      status:
        consistencyResult.consistency >= config.consistencyThreshold
          ? 'pass'
          : 'fail',
      consistency: consistencyResult.consistency,
      evidence: {
        outputs: consistencyResult.outputs.map((o) => String(o)),
        uniqueCount: consistencyResult.uniqueCount,
        examples: consistencyResult.evidence,
      },
    };

    if (result.status === 'fail') {
      result.diagnosis = autodiagnoseVariance(consistencyResult);
      result.suggestions = [
        'Set temperature=0 if not already',
        'Check for non-deterministic data sources (random sampling, timestamps, etc.)',
        'Review prompt for ambiguous instructions',
        'Consider if variance is acceptable for this use case',
      ];

      // Add specific suggestions based on variance pattern
      if (consistencyResult.uniqueCount === 2) {
        result.suggestions.push(
          'Binary variance detected - look for conditional logic or A/B tests'
        );
      } else if (consistencyResult.uniqueCount === consistencyResult.outputs.length) {
        result.suggestions.push(
          'Complete variance - likely high temperature or random input data'
        );
      }
    } else {
      // Mark consistency as passed
      this.testStatuses.get(testId)?.set('consistency', true);
    }

    this.storage.save(result);
    return result;
  }

  /**
   * Gets the history of test results for a specific test.
   */
  getHistory(testId: string, days: number = 30): TestResult[] {
    return this.storage.getHistory(testId, days);
  }

  /**
   * Checks for metric degradation over time.
   */
  checkDegradation(testId: string) {
    return this.storage.detectDegradation(testId);
  }

  /**
   * Ensures ground truth exists for the test.
   */
  private mustHaveGroundTruth(testId: string): GroundTruth {
    const gt = this.groundTruths.get(testId);
    if (!gt) {
      throw new Error(
        `No ground truth defined for test "${testId}". Call addGroundTruth() first.`
      );
    }
    return gt;
  }

  /**
   * Enforces that retrieval test has passed before running accuracy test.
   */
  private mustHavePassedRetrieval(testId: string): void {
    const statuses = this.testStatuses.get(testId);
    if (!statuses?.get('retrieval')) {
      throw new Error(
        `Cannot test accuracy for "${testId}" - retrieval test has not passed yet. ` +
          `Run testRetrieval() first and ensure it passes.`
      );
    }
  }

  /**
   * Enforces that accuracy test has passed before running consistency test.
   */
  private mustHavePassedAccuracy(testId: string): void {
    const statuses = this.testStatuses.get(testId);
    if (!statuses?.get('accuracy')) {
      throw new Error(
        `Cannot test consistency for "${testId}" - accuracy test has not passed yet. ` +
          `Run testAccuracy() first and ensure it passes.`
      );
    }
  }

  /**
   * Closes the storage connection.
   */
  close(): void {
    this.storage.close();
  }
}
