import { describe, it, expect } from 'vitest';
import { measureConsistency, autodiagnoseVariance, hasPromptVariance, mean, intersection } from './consistency.js';
import { TestConfig } from './types.js';

describe('measureConsistency', () => {
  const defaultConfig: TestConfig = {
    nTrials: 5,
    consistencyThreshold: 0.85,
    accuracyThreshold: 0.80,
    semanticComparison: true,
    timeout: 5000,
  };

  it('returns 1.0 consistency for identical outputs', async () => {
    const result = await measureConsistency(
      async () => '42',
      defaultConfig
    );

    expect(result.consistency).toBe(1.0);
    expect(result.uniqueCount).toBe(1);
    expect(result.outputs.length).toBe(5);
  });

  it('calculates consistency correctly for varied outputs', async () => {
    let counter = 0;
    const result = await measureConsistency(
      async () => (counter++ % 2 === 0 ? 'A' : 'B'),
      defaultConfig
    );

    expect(result.consistency).toBeCloseTo(0.8); // 2 unique out of 5 = 1 - (2-1)/5 = 0.8
    expect(result.uniqueCount).toBe(2);
  });

  it('handles errors as outputs', async () => {
    const result = await measureConsistency(
      async () => {
        throw new Error('Test error');
      },
      defaultConfig
    );

    expect(result.outputs.length).toBe(5);
    expect(result.uniqueCount).toBe(1);
    expect(result.outputs[0]).toHaveProperty('error');
  });
});

describe('autodiagnoseVariance', () => {
  it('diagnoses high consistency', () => {
    const result = {
      consistency: 0.98,
      outputs: ['42', '42', '42'],
      uniqueCount: 1,
      evidence: ['"42"'],
    };

    const diagnosis = autodiagnoseVariance(result);
    expect(diagnosis).toContain('highly consistent');
  });

  it('diagnoses complete variance', () => {
    const result = {
      consistency: 0,
      outputs: ['A', 'B', 'C'],
      uniqueCount: 3,
      evidence: ['"A"', '"B"', '"C"'],
    };

    const diagnosis = autodiagnoseVariance(result);
    expect(diagnosis).toContain('Every trial produced a different output');
  });

  it('diagnoses binary variance', () => {
    const result = {
      consistency: 0.5,
      outputs: ['A', 'B', 'A'],
      uniqueCount: 2,
      evidence: ['"A"', '"B"'],
    };

    const diagnosis = autodiagnoseVariance(result);
    expect(diagnosis).toContain('alternates between two values');
  });
});

describe('hasPromptVariance', () => {
  it('detects high variance in output lengths', () => {
    const outputs = [
      'short',
      'this is a much longer output that indicates variance',
      'medium length output',
    ];

    expect(hasPromptVariance(outputs)).toBe(true);
  });

  it('returns false for consistent lengths', () => {
    const outputs = ['hello', 'world', 'tests'];

    expect(hasPromptVariance(outputs)).toBe(false);
  });
});

describe('mean', () => {
  it('calculates average of numbers', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('filters out undefined values', () => {
    expect(mean([1, undefined, 3, undefined, 5])).toBe(3);
  });

  it('returns 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });
});

describe('intersection', () => {
  it('returns common elements', () => {
    const result = intersection([1, 2, 3, 4], [3, 4, 5, 6]);
    expect(result).toEqual([3, 4]);
  });

  it('returns empty array when no overlap', () => {
    const result = intersection([1, 2], [3, 4]);
    expect(result).toEqual([]);
  });
});
