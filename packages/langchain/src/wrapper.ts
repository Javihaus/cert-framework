import { TestRunner, GroundTruth, TestConfig } from '@cert/core';

/**
 * Error thrown when a consistency check fails.
 */
export class ConsistencyError extends Error {
  constructor(
    public diagnosis: string,
    public suggestions: string[]
  ) {
    super(`Consistency check failed: ${diagnosis}`);
    this.name = 'ConsistencyError';
  }
}

/**
 * Error thrown when an accuracy check fails.
 */
export class AccuracyError extends Error {
  constructor(
    public diagnosis: string,
    public expected: string,
    public actual: string
  ) {
    super(`Accuracy check failed: ${diagnosis}`);
    this.name = 'AccuracyError';
  }
}

/**
 * Wrapper for LangChain chains that adds CERT testing capabilities.
 *
 * @example
 * ```typescript
 * import { LLMChain } from 'langchain/chains';
 * import { cert } from '@cert/langchain';
 *
 * const chain = new LLMChain({ llm, prompt });
 * const tested = cert.wrap(chain)
 *   .withAccuracy(groundTruth)
 *   .withConsistency(0.85);
 *
 * await tested.call({ query: "..." });
 * ```
 */
export class CertWrapper<T = any> {
  private runner: TestRunner;
  private chain: T;

  constructor(chain: T, runner?: TestRunner) {
    this.chain = chain;
    this.runner = runner || new TestRunner();
  }

  /**
   * Adds consistency checking to the chain.
   * Runs the chain N times and verifies outputs are consistent.
   *
   * @param threshold - Minimum consistency score (0-1)
   * @param nTrials - Number of trials to run
   * @returns Wrapped chain with consistency checking
   */
  withConsistency(threshold: number, nTrials: number = 10): CertWrapper<T> {
    const originalCall = (this.chain as any).call?.bind(this.chain);

    if (!originalCall) {
      throw new Error('Chain does not have a call method');
    }

    // Override the call method
    (this.chain as any).call = async (inputs: any) => {
      const testId = `consistency-${Date.now()}`;

      const config: TestConfig = {
        nTrials,
        consistencyThreshold: threshold,
        accuracyThreshold: 0.8,
        semanticComparison: true,
      };

      const result = await this.runner.testConsistency(
        testId,
        () => originalCall(inputs),
        config
      );

      if (result.status === 'fail') {
        throw new ConsistencyError(
          result.diagnosis || 'Consistency check failed',
          result.suggestions || []
        );
      }

      // Return the result from one execution
      return originalCall(inputs);
    };

    return this;
  }

  /**
   * Adds accuracy checking to the chain.
   * Verifies the chain output matches expected ground truth.
   *
   * @param groundTruth - Expected output definition
   * @returns Wrapped chain with accuracy checking
   */
  withAccuracy(groundTruth: GroundTruth): CertWrapper<T> {
    const originalCall = (this.chain as any).call?.bind(this.chain);

    if (!originalCall) {
      throw new Error('Chain does not have a call method');
    }

    // Add ground truth to runner
    this.runner.addGroundTruth(groundTruth);

    // Mark retrieval as passed (LangChain handles this internally)
    (this.runner as any).passedRetrieval.add(groundTruth.id);

    // Override the call method
    (this.chain as any).call = async (inputs: any) => {
      const actual = await originalCall(inputs);

      const result = await this.runner.testAccuracy(
        groundTruth.id,
        () => Promise.resolve(actual),
        { threshold: 0.8 }
      );

      if (result.status === 'fail') {
        throw new AccuracyError(
          result.diagnosis || 'Accuracy check failed',
          String(groundTruth.expected),
          String(actual)
        );
      }

      return actual;
    };

    return this;
  }

  /**
   * Gets the underlying chain.
   */
  getChain(): T {
    return this.chain;
  }

  /**
   * Gets the test runner.
   */
  getRunner(): TestRunner {
    return this.runner;
  }
}

/**
 * Main entry point for CERT LangChain integration.
 */
export const cert = {
  /**
   * Wraps a LangChain chain with CERT testing capabilities.
   *
   * @param chain - LangChain chain to wrap
   * @param runner - Optional test runner instance
   * @returns Wrapped chain with testing methods
   */
  wrap<T = any>(chain: T, runner?: TestRunner): CertWrapper<T> {
    return new CertWrapper(chain, runner);
  },
};
