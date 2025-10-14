# Quick Start

Get up and running with CERT in 5 minutes.

## Installation

::: code-group

```bash [npm]
npm install @cert/core @cert/semantic
```

```bash [Python]
pip install cert-framework
```

```bash [CLI]
npm install -g @cert/cli
```

:::

## Basic Usage

### 1. Test Accuracy

First, verify your agent produces the correct output:

```typescript
import { TestRunner, GroundTruth } from '@cert/core';

// Create test runner
const runner = new TestRunner();

// Define what the correct answer is
const groundTruth: GroundTruth = {
  id: 'capital-france',
  question: 'What is the capital of France?',
  expected: 'Paris'
};

runner.addGroundTruth(groundTruth);

// Test your agent
const result = await runner.testAccuracy(
  'capital-france',
  async () => {
    return await myAgent('What is the capital of France?');
  }
);

console.log(result.status);  // 'pass' or 'fail'
console.log(result.accuracy);  // 0.0 to 1.0
```

### 2. Test Consistency

After accuracy passes, test consistency:

```typescript
import { TestConfig } from '@cert/core';

const config: TestConfig = {
  nTrials: 10,  // Run 10 times
  consistencyThreshold: 0.9,  // Require 90% consistency
  timeout: 30000  // 30 second timeout
};

const result = await runner.testConsistency(
  'capital-france',
  async () => {
    return await myAgent('What is the capital of France?');
  },
  config
);

console.log(result.consistency);  // 0.0 to 1.0

if (result.status === 'fail') {
  console.log(result.diagnosis);  // Why it failed
  console.log(result.suggestions);  // How to fix
  console.log(result.evidence);  // Example outputs
}
```

## Real-World Example

### Testing a RAG Pipeline

```typescript
import { TestRunner, GroundTruth, TestConfig } from '@cert/core';
import { createStorage } from '@cert/core';

// Use SQLite for persistence
const storage = createStorage('./cert-metrics.db');
const runner = new TestRunner(storage);

// Define ground truth
runner.addGroundTruth({
  id: 'apple-revenue',
  question: 'What was Apple Q4 2023 revenue?',
  expected: '$119.6 billion',
  equivalents: ['119.6B', '$119,600,000,000'],
  metadata: {
    correctPages: [1, 3],
    source: 'Apple Q4 2023 Earnings Report'
  }
});

// Your RAG pipeline
async function ragPipeline(query: string) {
  const docs = await retriever.retrieve(query);
  const context = selector.select(docs, query);
  const response = await llm.generate(query, context);
  return response;
}

// Test accuracy
const accuracyResult = await runner.testAccuracy(
  'apple-revenue',
  () => ragPipeline('What was Apple Q4 2023 revenue?')
);

if (accuracyResult.status === 'fail') {
  console.error('❌ Agent is not producing correct output');
  console.error(`Expected: ${groundTruth.expected}`);
  console.error(`Got: ${actualOutput}`);
  process.exit(1);
}

console.log('✅ Accuracy test passed');

// Test consistency
const config: TestConfig = {
  nTrials: 10,
  consistencyThreshold: 0.85,
  semanticComparison: true
};

const consistencyResult = await runner.testConsistency(
  'apple-revenue',
  () => ragPipeline('What was Apple Q4 2023 revenue?'),
  config
);

console.log(`Consistency: ${(consistencyResult.consistency * 100).toFixed(1)}%`);

if (consistencyResult.status === 'fail') {
  console.error('❌ Consistency below threshold');
  console.error(`Diagnosis: ${consistencyResult.diagnosis}`);
  console.error('Suggestions:');
  consistencyResult.suggestions?.forEach(s => console.error(`  - ${s}`));
}

// Check for degradation over time
const alert = storage.detectDegradation('apple-revenue');
if (alert) {
  console.warn(`⚠️ ${alert.message}`);
}
```

## Using the CLI

Initialize a new test suite:

```bash
cert init
```

This creates a `cert.config.json` file:

```json
{
  "groundTruths": [
    {
      "id": "test-1",
      "question": "What is 2+2?",
      "expected": "4"
    }
  ],
  "config": {
    "nTrials": 10,
    "consistencyThreshold": 0.9,
    "accuracyThreshold": 0.8
  }
}
```

Run tests:

```bash
cert test ./my-agent.js
```

View results in the Inspector UI:

```bash
cert inspect --port 3000
```

Analyze test history:

```bash
cert analyze test-1 --days 30
```

## Using with LangChain

```typescript
import { LLMChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { cert } from '@cert/langchain';

// Create your chain
const llm = new OpenAI({ temperature: 0 });
const chain = new LLMChain({ llm, prompt });

// Wrap with CERT
const tested = cert.wrap(chain)
  .withAccuracy({
    id: 'test-1',
    question: 'What is the capital of France?',
    expected: 'Paris'
  })
  .withConsistency(0.9, 10);

// Use normally - tests run automatically
try {
  const result = await chain.call({ query: 'What is the capital of France?' });
  console.log('✅ All tests passed');
  console.log(result);
} catch (error) {
  if (error instanceof ConsistencyError) {
    console.error('❌ Consistency check failed');
    console.error(error.diagnosis);
    console.error(error.suggestions);
  }
}
```

## Using with Python

```python
import asyncio
from cert import TestRunner, GroundTruth, TestConfig

# Create runner
runner = TestRunner()

# Define ground truth
runner.add_ground_truth(GroundTruth(
    id='capital-france',
    question='What is the capital of France?',
    expected='Paris'
))

# Your agent function
async def my_agent(query: str) -> str:
    # Your LLM call here
    return "Paris"

async def main():
    # Test accuracy
    accuracy_result = await runner.test_accuracy(
        'capital-france',
        lambda: my_agent('What is the capital of France?')
    )

    print(f"Accuracy: {accuracy_result.accuracy:.2%}")

    # Test consistency
    config = TestConfig(
        n_trials=10,
        consistency_threshold=0.9
    )

    consistency_result = await runner.test_consistency(
        'capital-france',
        lambda: my_agent('What is the capital of France?'),
        config
    )

    print(f"Consistency: {consistency_result.consistency:.2%}")

asyncio.run(main())
```

## Using with pytest

```python
import pytest
from cert import GroundTruth

@pytest.mark.cert_accuracy(
    id='capital-france',
    question='What is the capital of France?',
    expected='Paris'
)
@pytest.mark.cert_consistency(threshold=0.9, n_trials=10)
async def test_my_agent(cert_test_accuracy, cert_test_consistency):
    async def agent():
        return await my_llm_agent('What is the capital of France?')

    # Test accuracy
    acc_result = await cert_test_accuracy(agent)
    assert acc_result.status == 'pass'

    # Test consistency
    cons_result = await cert_test_consistency('capital-france', agent)
    assert cons_result.consistency >= 0.9
```

Run with pytest:

```bash
pytest tests/ -v
```

## Next Steps

- [Core Concepts](/guide/concepts) - Understand the fundamentals
- [Consistency Testing](/guide/consistency) - Deep dive into consistency
- [Accuracy Testing](/guide/accuracy) - Learn about ground truth
- [Pipeline Analysis](/guide/pipeline) - Debug multi-step systems
- [Inspector UI](/guide/inspector) - Visual debugging
- [Examples](/guide/examples) - More real-world examples
