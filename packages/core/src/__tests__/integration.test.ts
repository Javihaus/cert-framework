import { describe, it, expect } from 'vitest';
import { TestRunner } from '../runner.js';
import { PipelineAnalyzer } from '../pipeline.js';
import { SemanticComparator } from '@cert/semantic';
import { Agent, TestConfig } from '../types.js';

describe('CERT Integration Tests', () => {
  it('detects consistency failures', async () => {
    const runner = new TestRunner();
    let counter = 0;

    runner.addGroundTruth({
      id: 'test-1',
      question: 'Test question',
      expected: 'consistent output',
      metadata: {
        correctPages: [1]
      }
    });

    runner.setComparator(new SemanticComparator());

    // Follow layer enforcement: retrieval -> accuracy -> consistency

    // 1. Test retrieval
    await runner.testRetrieval(
      'test-1',
      async () => [{ pageNum: 1, content: 'test' }],
      { precisionMin: 0.8 }
    );

    // 2. Test accuracy
    await runner.testAccuracy(
      'test-1',
      async () => 'consistent output',
      { threshold: 0.8 }
    );

    // 3. Test consistency (with varying output)
    const result = await runner.testConsistency(
      'test-1',
      async () => {
        counter++;
        return counter % 2 === 0 ? 'output A' : 'output B';
      },
      { nTrials: 4, consistencyThreshold: 0.9, accuracyThreshold: 0.8, semanticComparison: true }
    );

    expect(result.consistency).toBeLessThan(0.9);
    expect(result.status).toBe('fail');
  });
  
  it('pipeline analyzer localizes failing agent', async () => {
    const agents: Agent[] = [
      {
        name: 'ConsistentAgent',
        execute: async () => 'same output every time'
      },
      {
        name: 'VariantAgent',
        execute: async () => Math.random() > 0.5 ? 'A' : 'B'
      },
      {
        name: 'DeterministicAgent',
        execute: async (input: any) => input.toUpperCase()
      }
    ];
    
    const analyzer = new PipelineAnalyzer();
    const config: TestConfig = {
      nTrials: 5,
      consistencyThreshold: 0.85,
      accuracyThreshold: 0.8,
      semanticComparison: true
    };
    
    const result = await analyzer.localizeFailure(agents, 'test input', config);
    
    expect(result.failingAgent).toBe('VariantAgent');
    expect(result.diagnosis).toContain('variance');
  });
});
