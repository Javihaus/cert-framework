import { describe, it, expect } from 'vitest';
import {
  SemanticComparator,
  exactMatch,
  normalizedNumberMatch,
  fuzzyTextMatch,
} from './comparator.js';

describe('SemanticComparator', () => {
  it('performs exact match', () => {
    const comparator = new SemanticComparator();
    const result = comparator.compare('hello world', 'Hello World');

    expect(result.matched).toBe(true);
    expect(result.rule).toBe('exact-match');
    expect(result.confidence).toBe(1.0);
  });

  it('normalizes numbers with units', () => {
    const comparator = new SemanticComparator();

    // Test billion conversion
    const result1 = comparator.compare('$391.035 billion', '391.035 billion');
    expect(result1.matched).toBe(true);
    expect(result1.rule).toBe('normalized-number');

    // Test full number with commas
    const result2 = comparator.compare('$391.035 billion', '$391,035,000,000');
    expect(result2.matched).toBe(true);
    expect(result2.rule).toBe('normalized-number');
  });

  it('handles fuzzy text matching', () => {
    const comparator = new SemanticComparator();
    const result = comparator.compare('hello world', 'hello wrld');

    expect(result.matched).toBe(true);
    expect(result.rule).toBe('fuzzy-text');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('returns false for completely different strings', () => {
    const comparator = new SemanticComparator();
    const result = comparator.compare('apple', 'orange');

    expect(result.matched).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('checks equivalents', () => {
    const comparator = new SemanticComparator();
    const result = comparator.compareWithEquivalents(
      '$391 billion',
      ['391B', '$391,000,000,000'],
      '391B'
    );

    expect(result.matched).toBe(true);
    expect(result.rule).toContain('equivalent');
  });

  it('allows custom rules', () => {
    const comparator = new SemanticComparator();

    comparator.addRule({
      name: 'custom-test',
      priority: 99,
      match: (expected, actual) => {
        return expected.includes('test') && actual.includes('test');
      },
    });

    const result = comparator.compare('test123', 'test456');
    expect(result.matched).toBe(true);
    expect(result.rule).toBe('custom-test');
  });
});

describe('exactMatch', () => {
  it('matches identical strings', () => {
    expect(exactMatch.match('hello', 'hello')).toBe(true);
  });

  it('ignores case', () => {
    expect(exactMatch.match('Hello', 'hello')).toBe(true);
  });

  it('normalizes whitespace', () => {
    expect(exactMatch.match('hello  world', 'hello world')).toBe(true);
  });
});

describe('normalizedNumberMatch', () => {
  it('matches numbers with different units', () => {
    expect(normalizedNumberMatch.match('1 billion', '1000000000')).toBe(1.0);
    expect(normalizedNumberMatch.match('1 million', '1000000')).toBe(1.0);
    expect(normalizedNumberMatch.match('50%', '0.5')).toBe(1.0);
  });

  it('returns false for non-numbers', () => {
    expect(normalizedNumberMatch.match('hello', 'world')).toBe(false);
  });

  it('handles different formats of same number', () => {
    expect(normalizedNumberMatch.match('$391.035 billion', '391035000000')).toBe(
      1.0
    );
  });
});

describe('fuzzyTextMatch', () => {
  it('matches similar strings', () => {
    const result = fuzzyTextMatch.match('hello world', 'hello wrld');
    expect(result).toBeGreaterThan(0.8);
  });

  it('returns false for very different strings', () => {
    expect(fuzzyTextMatch.match('apple', 'orange')).toBe(false);
  });

  it('handles punctuation differences', () => {
    const result = fuzzyTextMatch.match('hello, world!', 'hello world');
    expect(result).toBeGreaterThan(0.8);
  });
});
