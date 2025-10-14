import { describe, test, expect } from 'vitest';
import { SemanticComparator } from '../comparator.js';

describe('Financial format handling', () => {
  const comparator = new SemanticComparator();
  
  test('handles billion-million conversion with commas', () => {
    // Your actual bug from the notebook
    const result = comparator.compare('$391.035 billion', '$391,035 million');
    expect(result.matched).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.95);
  });
  
  test('rejects mismatched values', () => {
    const result = comparator.compare('$391.035 billion', '$500 billion');
    expect(result.matched).toBe(false);
  });
  
  test('handles B suffix', () => {
    const result = comparator.compare('$391.035 billion', '$391B');
    expect(result.matched).toBe(true);
  });
});
