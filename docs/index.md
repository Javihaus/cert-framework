---
layout: home

hero:
  name: CERT Framework
  text: LLM System Reliability Testing
  tagline: Measure consistency, validate accuracy, and diagnose failures in LLM applications
  actions:
    - theme: brand
      text: Get Started
      link: /guide/quick-start
    - theme: alt
      text: View on GitHub
      link: https://github.com/yourusername/cert-framework
  image:
    src: /logo.svg
    alt: CERT Framework

features:
  - icon: 🎯
    title: Consistency Testing
    details: Measure how reliably your LLM produces the same output across multiple runs. Automatically diagnose variance causes.

  - icon: ✅
    title: Accuracy Validation
    details: Verify outputs match expected ground truth with built-in semantic comparison for equivalent answers.

  - icon: 🔍
    title: Pipeline Analysis
    details: Automatically locate which agent in a multi-step pipeline is causing inconsistencies using binary search.

  - icon: 🛡️
    title: Layer Enforcement
    details: Prevents testing consistency before accuracy, avoiding the common mistake of accepting consistent but wrong answers.

  - icon: 🔌
    title: Framework Integrations
    details: Native support for LangChain, Python, pytest, and more. Works with any LLM framework.

  - icon: 📊
    title: Inspector UI
    details: Visual debugging interface with three-panel layout showing tests, configuration, and results in real-time.

  - icon: 🧠
    title: Semantic Comparison
    details: Pluggable rules handle equivalent outputs automatically ($391B = $391 billion = $391,000,000,000).

  - icon: 📈
    title: Time-Series Metrics
    details: Track performance over time with SQLite storage. Detect degradation automatically with alerts.

  - icon: 🚀
    title: Production Ready
    details: Built for scale with caching, parallel execution, and comprehensive TypeScript types.
---

## Quick Example

::: code-group

```typescript [TypeScript]
import { TestRunner, GroundTruth, TestConfig } from '@cert/core';

const runner = new TestRunner();

// Define expected output
runner.addGroundTruth({
  id: 'capital-france',
  question: 'What is the capital of France?',
  expected: 'Paris',
});

// Test accuracy first
const accuracyResult = await runner.testAccuracy(
  'capital-france',
  () => myAgent('What is the capital of France?')
);

// Then test consistency
const config: TestConfig = {
  nTrials: 10,
  consistencyThreshold: 0.9,
};

const consistencyResult = await runner.testConsistency(
  'capital-france',
  () => myAgent('What is the capital of France?'),
  config
);

console.log(`Consistency: ${consistencyResult.consistency}`);
```

```python [Python]
from cert import TestRunner, GroundTruth, TestConfig

runner = TestRunner()

# Define expected output
runner.add_ground_truth(GroundTruth(
    id='capital-france',
    question='What is the capital of France?',
    expected='Paris'
))

# Test accuracy first
accuracy_result = await runner.test_accuracy(
    'capital-france',
    lambda: my_agent('What is the capital of France?')
)

# Then test consistency
config = TestConfig(
    n_trials=10,
    consistency_threshold=0.9
)

consistency_result = await runner.test_consistency(
    'capital-france',
    lambda: my_agent('What is the capital of France?'),
    config
)

print(f"Consistency: {consistency_result.consistency}")
```

```typescript [LangChain]
import { LLMChain } from 'langchain/chains';
import { cert } from '@cert/langchain';

const chain = new LLMChain({ llm, prompt });

// Wrap with CERT testing
const tested = cert.wrap(chain)
  .withAccuracy(groundTruth)
  .withConsistency(0.9, 10);

// Use normally - tests run automatically
const result = await chain.call({ query: '...' });
```

:::

## Why CERT?

Traditional testing approaches fall short for LLM systems:

- **Non-deterministic outputs**: Same input can produce different outputs
- **Semantic equivalence**: "391B" and "$391 billion" mean the same thing
- **Complex pipelines**: Multi-step systems with retrieval, reasoning, and generation
- **Silent failures**: Consistent but wrong answers go undetected

CERT solves these problems with:

1. **Layer Enforcement**: Test accuracy before consistency
2. **Semantic Comparison**: Built-in rules for equivalent outputs
3. **Automatic Diagnosis**: Identify why consistency fails
4. **Pipeline Localization**: Find exactly which step causes variance

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

## Learn More

- [Quick Start Guide](/guide/quick-start) - Get up and running in 5 minutes
- [Core Concepts](/guide/concepts) - Understand consistency, accuracy, and layer enforcement
- [LangChain Integration](/guide/langchain) - Use with LangChain chains
- [Inspector UI](/guide/inspector) - Visual debugging interface
- [API Reference](/api/core) - Complete API documentation

## Community

- [GitHub Discussions](https://github.com/yourusername/cert-framework/discussions) - Ask questions and share ideas
- [Issue Tracker](https://github.com/yourusername/cert-framework/issues) - Report bugs
- [Contributing Guide](https://github.com/yourusername/cert-framework/blob/main/CONTRIBUTING.md) - Help improve CERT
