import { TestConfig, ConsistencyResult } from './types.js';

/**
 * Creates a promise that rejects after the specified timeout.
 */
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  );
}

/**
 * Selects representative examples from unique outputs.
 */
function selectEvidence<T>(outputs: T[], uniqueSet: Set<string>): string[] {
  const evidence: string[] = [];
  const seen = new Set<string>();

  for (const output of outputs) {
    const serialized = JSON.stringify(output);
    if (!seen.has(serialized) && seen.size < 5) {
      // Show up to 5 unique examples
      evidence.push(serialized);
      seen.add(serialized);
    }
  }

  return evidence;
}

/**
 * Measures consistency by running a function N times and comparing outputs.
 *
 * Consistency is calculated as: 1 - (unique_outputs - 1) / max(n_trials, 1)
 * - If all outputs are identical, consistency = 1.0
 * - If all outputs are different, consistency approaches 0.0
 *
 * @param fn - Function to test for consistency
 * @param config - Test configuration including number of trials and timeout
 * @returns Consistency measurement with all collected outputs and evidence
 *
 * @example
 * ```typescript
 * const result = await measureConsistency(
 *   () => llm.generate("What is 2+2?"),
 *   { nTrials: 10, timeout: 5000 }
 * );
 * console.log(`Consistency: ${result.consistency}`);
 * console.log(`Unique outputs: ${result.uniqueCount}`);
 * ```
 */
export async function measureConsistency<T>(
  fn: () => Promise<T>,
  config: TestConfig
): Promise<ConsistencyResult<T>> {
  const outputs: T[] = [];

  // Run the function N times
  for (let i = 0; i < config.nTrials; i++) {
    try {
      const result = await Promise.race([
        fn(),
        timeout(config.timeout || 30000),
      ]);
      outputs.push(result);
    } catch (error: any) {
      // Errors count as outputs - this shows how robust the system is
      outputs.push({ error: error.message } as T);
    }
  }

  // Count unique outputs by serializing to JSON
  const unique = new Set(outputs.map((o) => JSON.stringify(o)));

  // Calculate consistency: 1 = all same, 0 = all different
  const consistency =
    1 - (unique.size - 1) / Math.max(config.nTrials, 1);

  return {
    consistency,
    outputs,
    uniqueCount: unique.size,
    evidence: selectEvidence(outputs, unique),
  };
}

/**
 * Automatically diagnoses the cause of variance in outputs.
 *
 * @param result - Consistency measurement result
 * @returns Human-readable diagnosis
 */
export function autodiagnoseVariance<T>(
  result: ConsistencyResult<T>
): string {
  if (result.consistency >= 0.95) {
    return 'System is highly consistent';
  }

  if (result.uniqueCount === result.outputs.length) {
    return 'Every trial produced a different output - likely caused by high temperature or non-deterministic data sources';
  }

  if (result.uniqueCount === 2) {
    return 'Output alternates between two values - check for conditional logic or A/B test variations';
  }

  // Check if variance is in formatting only
  const normalizedOutputs = result.outputs.map((o) =>
    JSON.stringify(o).replace(/\s+/g, ' ').toLowerCase()
  );
  const uniqueNormalized = new Set(normalizedOutputs);

  if (uniqueNormalized.size < result.uniqueCount) {
    return 'Variance is primarily in formatting (whitespace, capitalization) - the semantic content is consistent';
  }

  return `System produces ${result.uniqueCount} different outputs across ${result.outputs.length} trials - review prompt for ambiguity`;
}

/**
 * Checks if outputs have variance in prompt interpretation.
 */
export function hasPromptVariance(outputs: any[]): boolean {
  // Simple heuristic: if outputs have different lengths or structures,
  // it suggests the prompt is being interpreted differently
  const lengths = outputs.map((o) => JSON.stringify(o).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
    lengths.length;
  const stdDev = Math.sqrt(variance);

  // If standard deviation is more than 20% of average, likely prompt variance
  return stdDev / avgLength > 0.2;
}

/**
 * Calculates mean of an array of numbers.
 */
export function mean(numbers: (number | undefined)[]): number {
  const filtered = numbers.filter((n): n is number => n !== undefined);
  if (filtered.length === 0) return 0;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

/**
 * Calculates intersection of two arrays.
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}
