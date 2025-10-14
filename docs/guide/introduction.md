# Introduction

CERT (Consistency Evaluation and Reliability Testing) is a comprehensive framework for testing LLM system reliability. It focuses on three core pillars:

1. **Consistency**: How reliably does your system produce the same output?
2. **Accuracy**: Does the output match expected ground truth?
3. **Diagnosis**: Why did the test fail and how to fix it?

## The Problem

LLM systems are fundamentally different from traditional software:

### Non-Deterministic Outputs

```typescript
// Traditional code
function add(a: number, b: number): number {
  return a + b; // Always returns 4 for add(2, 2)
}

// LLM system
async function summarize(text: string): Promise<string> {
  return await llm.generate(text); // Might return different summaries each time
}
```

### Semantic Equivalence

Different outputs can mean the same thing:

- "$391 billion"
- "391B"
- "$391,000,000,000"
- "three hundred ninety-one billion dollars"

Traditional equality checks (`expected === actual`) fail for semantically equivalent answers.

### Complex Pipelines

Multi-step systems introduce multiple failure points:

```
User Query → Retrieval → Context Selection → LLM Generation → Post-processing → Response
               ↓              ↓                    ↓                ↓
            Variance?      Variance?          Variance?        Variance?
```

Which step is causing inconsistency?

### Silent Failures

The most dangerous failure mode:

```typescript
// All outputs are consistent...
["The capital of France is London",
 "The capital of France is London",
 "The capital of France is London"]

// ...but all are WRONG!
```

## The Solution

CERT addresses these challenges with a systematic approach:

### 1. Layer Enforcement

Test in the correct order to catch silent failures:

```typescript
// ❌ Wrong: Testing consistency first
const result = await runner.testConsistency('test-1', agent, config);
// Might accept consistent but wrong answers!

// ✅ Correct: Test accuracy first
await runner.testAccuracy('test-1', agent);  // Verify correctness
await runner.testConsistency('test-1', agent, config);  // Then check consistency
```

CERT enforces this order automatically - you cannot test consistency before passing accuracy validation.

### 2. Semantic Comparison

Built-in rules handle equivalent outputs:

```typescript
const comparator = new SemanticComparator();

// All return true
comparator.compare("$391 billion", "391B");
comparator.compare("$391 billion", "$391,000,000,000");
comparator.compare("Paris", "paris");
```

Add custom rules for your domain:

```typescript
comparator.addRule({
  name: 'date-format',
  priority: 95,
  match: (expected, actual) => {
    return parseDate(expected).equals(parseDate(actual));
  }
});
```

### 3. Automatic Diagnosis

When tests fail, CERT tells you why:

```typescript
{
  status: 'fail',
  consistency: 0.3,
  diagnosis: 'High variance: All 10 outputs were unique. Likely causes: high temperature, non-deterministic retrieval',
  suggestions: [
    'Set temperature=0 if not already',
    'Check for non-deterministic data sources',
    'Review prompt for ambiguous instructions'
  ],
  evidence: {
    uniqueCount: 10,
    examples: ['Output 1...', 'Output 2...', 'Output 3...']
  }
}
```

### 4. Pipeline Localization

Automatically find which agent is failing:

```typescript
const analyzer = new PipelineAnalyzer(runner);

const localization = await analyzer.localizeFailure(
  [retriever, selector, generator, postprocessor],
  userQuery,
  config
);

console.log(localization.failingAgent);  // "generator"
console.log(localization.diagnosis);     // "High temperature in LLM"
console.log(localization.suggestions);   // ["Set temperature=0", ...]
```

## Core Concepts

### Consistency

How often does your system produce the same output for the same input?

**Formula**: `consistency = 1 - (uniqueCount - 1) / nTrials`

**Example**:
- 10 trials produce 2 unique outputs
- Consistency = 1 - (2-1)/10 = 0.9 (90%)

### Accuracy

Does the output match expected ground truth?

```typescript
const groundTruth: GroundTruth = {
  id: 'test-1',
  question: 'What was Apple Q4 2023 revenue?',
  expected: '$119.6 billion',
  equivalents: ['119.6B', '$119,600,000,000']
};
```

### Layer Enforcement

Testing order matters:

1. **Retrieval** (if applicable): Is correct context retrieved?
2. **Accuracy**: Is output correct?
3. **Consistency**: Is output stable?

You cannot skip to consistency without validating accuracy first.

## Use Cases

### 1. RAG Systems

Test that your retrieval-augmented generation produces consistent, accurate answers:

```typescript
await runner.testAccuracy('rag-test', () => ragPipeline(query));
await runner.testConsistency('rag-test', () => ragPipeline(query), config);
```

### 2. Multi-Agent Systems

Locate which agent in a pipeline causes variance:

```typescript
const localization = await analyzer.localizeFailure(
  [researcher, planner, executor, reviewer],
  userTask,
  config
);
```

### 3. Prompt Engineering

Test if prompt changes improve consistency:

```typescript
const beforeResult = await runner.testConsistency('test', () => oldPrompt(), config);
const afterResult = await runner.testConsistency('test', () => newPrompt(), config);

console.log(`Improvement: ${afterResult.consistency - beforeResult.consistency}`);
```

### 4. Model Comparison

Compare consistency across different models:

```typescript
const gpt4Result = await runner.testConsistency('test', () => gpt4(query), config);
const claudeResult = await runner.testConsistency('test', () => claude(query), config);
```

### 5. Production Monitoring

Track reliability over time:

```typescript
const storage = createStorage('./metrics.db');
const runner = new TestRunner(storage);

// Test runs are automatically saved
await runner.testConsistency('prod-test', agent, config);

// Check for degradation
const alert = storage.detectDegradation('prod-test');
if (alert) {
  console.error(`⚠️ ${alert.message}`);
  sendAlert(alert);
}
```

## Architecture

CERT is built as a monorepo with multiple packages:

```
cert-framework/
├── packages/
│   ├── core/          # Core testing primitives
│   ├── semantic/      # Semantic comparison engine
│   ├── cli/           # Command-line interface
│   ├── inspector/     # Web UI for debugging
│   ├── langchain/     # LangChain integration
│   ├── python/        # Python bindings
│   └── pytest-plugin/ # pytest integration
├── examples/
│   ├── basic/         # Basic usage examples
│   ├── langchain/     # LangChain examples
│   └── rag/           # RAG pipeline examples
└── docs/              # Documentation site
```

## Next Steps

- [Quick Start](/guide/quick-start) - Get started in 5 minutes
- [Consistency Testing](/guide/consistency) - Deep dive into consistency measurement
- [Accuracy Testing](/guide/accuracy) - Learn about ground truth validation
- [LangChain Integration](/guide/langchain) - Use with LangChain
- [API Reference](/api/core) - Complete API documentation
