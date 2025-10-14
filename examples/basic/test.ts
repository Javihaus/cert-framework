/**
 * Basic example demonstrating CERT framework usage
 *
 * This example shows how to:
 * 1. Set up a test runner with ground truth
 * 2. Test consistency of a simple agent
 * 3. Use semantic comparison
 * 4. Analyze pipeline failures
 */

import {
  TestRunner,
  PipelineAnalyzer,
  Agent,
  TestConfig,
} from '@cert/core';
import { SemanticComparator } from '@cert/semantic';

// Simulate a simple LLM agent that extracts information
class SimpleAgent {
  private temperature: number;

  constructor(temperature: number = 0) {
    this.temperature = temperature;
  }

  async extract(query: string): Promise<string> {
    // Simulate LLM behavior with controlled randomness
    if (query.includes('revenue')) {
      // With temperature > 0, introduce variance
      if (this.temperature > 0 && Math.random() < this.temperature) {
        const variations = [
          '$391.035 billion',
          '391.035B',
          '$391,035,000,000',
          '391.035 billion dollars',
        ];
        return variations[Math.floor(Math.random() * variations.length)];
      }
      return '$391.035 billion';
    }

    return 'Unknown';
  }
}

async function runBasicExample() {
  console.log('=== CERT Framework Basic Example ===\n');

  // 1. Set up test runner
  console.log('1. Setting up test runner...');
  const runner = new TestRunner();

  // Add ground truth
  runner.addGroundTruth({
    id: 'revenue-test',
    question: 'What was Apple total revenue?',
    expected: '$391.035 billion',
    equivalents: ['391.035B', '$391,035,000,000', '391.035 billion dollars'],
    metadata: {
      source: 'example',
      category: 'financial',
    },
  });

  // Set up semantic comparator
  const comparator = new SemanticComparator();
  runner.setComparator(comparator);

  console.log('✓ Test runner configured\n');

  // 2. Test consistency with temperature=0 (should be perfect)
  console.log('2. Testing consistency (temperature=0)...');
  const agent = new SimpleAgent(0);

  const config: TestConfig = {
    nTrials: 5,
    consistencyThreshold: 0.95,
    accuracyThreshold: 0.80,
    semanticComparison: true,
    timeout: 5000,
  };

  try {
    // Simulate retrieval (would normally query vector DB)
    const retrievalResult = await runner.testRetrieval(
      'revenue-test',
      async () => [{ pageNum: 25 }, { pageNum: 26 }],
      { precisionMin: 0.7 }
    );
    console.log(`   Retrieval: ${retrievalResult.status}`);

    // Test accuracy
    const accuracyResult = await runner.testAccuracy(
      'revenue-test',
      () => agent.extract('What was Apple total revenue?'),
      { threshold: 0.8 }
    );
    console.log(`   Accuracy: ${accuracyResult.status}`);

    // Test consistency
    const consistencyResult = await runner.testConsistency(
      'revenue-test',
      () => agent.extract('What was Apple total revenue?'),
      config
    );
    console.log(
      `   Consistency: ${consistencyResult.status} (${(
        consistencyResult.consistency! * 100
      ).toFixed(1)}%)`
    );

    if (consistencyResult.status === 'pass') {
      console.log('   ✓ All tests passed!\n');
    }
  } catch (error: any) {
    console.log(`   ✗ Error: ${error.message}\n`);
  }

  // 3. Test with temperature=0.5 (should show variance)
  console.log('3. Testing with temperature=0.5 (demonstrating variance)...');
  const variantAgent = new SimpleAgent(0.5);

  // Need to create new test to bypass layer enforcement
  runner.addGroundTruth({
    id: 'revenue-test-variant',
    question: 'What was Apple total revenue?',
    expected: '$391.035 billion',
    equivalents: ['391.035B', '$391,035,000,000', '391.035 billion dollars'],
    metadata: {
      source: 'example',
      category: 'financial',
    },
  });

  try {
    await runner.testRetrieval(
      'revenue-test-variant',
      async () => [{ pageNum: 25 }],
      { precisionMin: 0.7 }
    );

    await runner.testAccuracy(
      'revenue-test-variant',
      () => variantAgent.extract('What was Apple total revenue?'),
      { threshold: 0.8 }
    );

    const variantResult = await runner.testConsistency(
      'revenue-test-variant',
      () => variantAgent.extract('What was Apple total revenue?'),
      config
    );

    console.log(
      `   Consistency: ${variantResult.status} (${(
        variantResult.consistency! * 100
      ).toFixed(1)}%)`
    );

    if (variantResult.status === 'fail') {
      console.log(`   Diagnosis: ${variantResult.diagnosis}`);
      console.log(`   Unique outputs: ${variantResult.evidence?.uniqueCount}`);
      console.log('   Suggestions:');
      variantResult.suggestions?.forEach((s) => console.log(`     - ${s}`));
    }
  } catch (error: any) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n4. Pipeline Analysis...');
  const analyzer = new PipelineAnalyzer();

  // Create a simple pipeline
  const pipeline: Agent[] = [
    {
      name: 'Retriever',
      execute: async (input: string) => `Context: ${input}`,
    },
    {
      name: 'Extractor',
      execute: async (input: string) => {
        // Deterministic
        return '$391.035 billion';
      },
    },
    {
      name: 'Formatter',
      execute: async (input: string) => {
        // Non-deterministic - adds variance
        const formats = [input, input.replace('$', 'USD '), input + ' dollars'];
        return formats[Math.floor(Math.random() * formats.length)];
      },
    },
  ];

  const localization = await analyzer.localizeFailure(
    pipeline,
    'What was Apple total revenue?',
    config
  );

  if (localization.failingAgent) {
    console.log(`   ✗ Failing agent: ${localization.failingAgent}`);
    console.log(`   Diagnosis: ${localization.diagnosis}`);
    console.log('   Suggestions:');
    localization.suggestions?.forEach((s) => console.log(`     - ${s}`));
  } else {
    console.log('   ✓ All agents consistent');
  }

  console.log('\n=== Example Complete ===');
  runner.close();
}

// Run the example
runBasicExample().catch(console.error);
