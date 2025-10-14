import { TestRunner } from '../runner.js';
import { SemanticComparator } from '@cert/semantic';
import { PipelineAnalyzer } from '../pipeline.js';

// Test 1: Can it detect actual inconsistency?
test('detects inconsistent outputs', async () => {
  let counter = 0;
  const result = await new TestRunner({
    groundTruths: [],
    comparisonFn: () => ({ matched: true, confidence: 1 }),
    trials: 3
  }).testConsistency(async () => {
    counter++;
    return counter % 2 === 0 ? 'even' : 'odd'; // Alternates
  });
  
  expect(result.consistency).toBeLessThan(1.0);
  expect(result.uniqueOutputs.length).toBe(2);
});

// Test 2: Semantic comparator handles financial formats
test('semantic comparison handles unit variations', () => {
  const comparator = new SemanticComparator();
  
  // The actual bug from your notebook
  const r1 = comparator.compare('$391.035 billion', '$391,035 million');
  expect(r1.matched).toBe(true);
  
  const r2 = comparator.compare('$391.035 billion', '$500 billion');
  expect(r2.matched).toBe(false);
});

// Test 3: Pipeline analyzer identifies the faulty stage
test('localizes variance to specific agent', async () => {
  const agents = [
    async (input: string) => 'consistent',  // Agent 1: always same
    async (input: string) => Math.random() > 0.5 ? 'A' : 'B',  // Agent 2: varies
    async (input: string) => input.toUpperCase(),  // Agent 3: deterministic
  ];
  
  const analyzer = new PipelineAnalyzer(agents);
  const result = await analyzer.analyze('test', 3);
  
  expect(result.failingStage).toBe(1);  // Should identify agent 2 (index 1)
  expect(result.gamma).toBeLessThan(1.0);
});
