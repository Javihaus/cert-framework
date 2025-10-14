import { describe, it, expect } from 'vitest';
import { CertWrapper, cert, ConsistencyError, AccuracyError } from './wrapper.js';
import { TestRunner } from '@cert/core';

describe('CertWrapper', () => {
  it('wraps a chain without modifying it initially', () => {
    const mockChain = { call: async () => 'test' };
    const wrapped = cert.wrap(mockChain);
    expect(wrapped).toBeInstanceOf(CertWrapper);
    expect(wrapped.getChain()).toBe(mockChain);
  });

  it('returns the test runner', () => {
    const mockChain = { call: async () => 'test' };
    const wrapped = cert.wrap(mockChain);
    expect(wrapped.getRunner()).toBeInstanceOf(TestRunner);
  });

  it('uses custom test runner when provided', () => {
    const mockChain = { call: async () => 'test' };
    const customRunner = new TestRunner();
    const wrapped = cert.wrap(mockChain, customRunner);
    expect(wrapped.getRunner()).toBe(customRunner);
  });

  it('has withConsistency method', () => {
    const mockChain = { call: async () => 'test' };
    const wrapped = cert.wrap(mockChain);
    expect(typeof wrapped.withConsistency).toBe('function');
  });

  it('has withAccuracy method', () => {
    const mockChain = { call: async () => 'test' };
    const wrapped = cert.wrap(mockChain);
    expect(typeof wrapped.withAccuracy).toBe('function');
  });

  it('returns self for method chaining', () => {
    const mockChain = { call: async () => 'test' };
    const wrapped = cert.wrap(mockChain);
    const withConsistency = wrapped.withConsistency(0.9, 10);
    expect(withConsistency).toBe(wrapped);
  });
});

describe('ConsistencyError', () => {
  it('contains diagnosis and suggestions', () => {
    const error = new ConsistencyError('High variance', ['Set temperature=0']);

    expect(error.diagnosis).toBe('High variance');
    expect(error.suggestions).toEqual(['Set temperature=0']);
    expect(error.message).toContain('High variance');
  });
});

describe('AccuracyError', () => {
  it('contains expected, actual, and diagnosis', () => {
    const error = new AccuracyError('Mismatch', 'Expected', 'Actual');

    expect(error.expected).toBe('Expected');
    expect(error.actual).toBe('Actual');
    expect(error.diagnosis).toBe('Mismatch');
    expect(error.message).toContain('Mismatch');
  });
});
