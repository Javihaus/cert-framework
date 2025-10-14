# CERT LangChain Integration

Seamlessly add consistency and accuracy testing to your LangChain chains.

## Installation

```bash
npm install @cert/langchain langchain
```

## Quick Start

```typescript
import { LLMChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { cert } from '@cert/langchain';

// Create your LangChain chain
const llm = new OpenAI({ temperature: 0.7 });
const prompt = PromptTemplate.fromTemplate('Tell me a {adjective} joke');
const chain = new LLMChain({ llm, prompt });

// Wrap with CERT testing
const tested = cert.wrap(chain)
  .withConsistency(0.85, 10);  // 85% consistency across 10 trials

// Use normally - consistency check happens automatically
try {
  const result = await chain.call({ adjective: 'funny' });
  console.log(result);
} catch (error) {
  if (error instanceof ConsistencyError) {
    console.error('Consistency check failed:', error.diagnosis);
    console.log('Suggestions:', error.suggestions);
  }
}
```

## Usage

### Consistency Testing

Test that your chain produces consistent outputs across multiple runs:

```typescript
const tested = cert.wrap(chain)
  .withConsistency(
    0.85,  // threshold (0-1)
    10     // number of trials
  );
```

If consistency falls below the threshold, a `ConsistencyError` is thrown with:
- Automatic diagnosis of variance causes
- Actionable suggestions for fixes
- Evidence showing unique outputs

### Accuracy Testing

Verify outputs match expected ground truth:

```typescript
import type { GroundTruth } from '@cert/langchain';

const groundTruth: GroundTruth = {
  id: 'capital-france',
  question: 'What is the capital of France?',
  expected: 'Paris',
  equivalents: ['paris', 'Paris, France']
};

const tested = cert.wrap(chain)
  .withAccuracy(groundTruth);

try {
  const result = await chain.call({ question: groundTruth.question });
  console.log('Accuracy check passed:', result);
} catch (error) {
  if (error instanceof AccuracyError) {
    console.error('Expected:', error.expected);
    console.error('Got:', error.actual);
    console.error('Diagnosis:', error.diagnosis);
  }
}
```

### Combined Testing

Chain both consistency and accuracy checks with layer enforcement:

```typescript
const tested = cert.wrap(chain)
  .withAccuracy(groundTruth)    // Must pass first
  .withConsistency(0.85, 10);   // Then test consistency

await chain.call({ question: groundTruth.question });
```

**Layer Enforcement**: You cannot test consistency before accuracy is validated. This prevents the common mistake of accepting consistent but wrong answers.

### Custom Test Runner

Share a test runner across multiple chains to track all results:

```typescript
import { TestRunner } from '@cert/langchain';

const runner = new TestRunner();

const chain1 = cert.wrap(summaryChain, runner)
  .withConsistency(0.9, 5);

const chain2 = cert.wrap(translationChain, runner)
  .withConsistency(0.95, 10);

// Both chains report to the same runner
```

## Error Types

### ConsistencyError

Thrown when consistency falls below threshold:

```typescript
class ConsistencyError extends Error {
  diagnosis: string;        // Why consistency failed
  suggestions: string[];    // How to fix it
}
```

### AccuracyError

Thrown when output doesn't match ground truth:

```typescript
class AccuracyError extends Error {
  diagnosis: string;        // Why accuracy failed
  expected: string;         // Expected output
  actual: string;          // Actual output
}
```

## Advanced Features

### Semantic Comparison

Accuracy testing uses semantic comparison by default:

```typescript
// These are all considered equivalent:
'$391 billion'
'$391B'
'$391,000,000,000'
'391 billion dollars'
```

Custom comparison rules can be added via the `@cert/semantic` package.

### Automatic Diagnosis

When consistency fails, CERT automatically diagnoses the cause:

- **High Temperature**: Too much randomness in LLM
- **Non-deterministic Retrieval**: RAG components returning different results
- **Ambiguous Prompts**: Instructions allowing multiple valid interpretations
- **Tool Variance**: External API calls with changing results

## Integration with CERT CLI

View results in the CERT Inspector UI:

```bash
cert inspect --port 3000
```

Or analyze test history:

```bash
cert analyze <test-id>
```

## API Reference

### `cert.wrap(chain, runner?)`

Wraps a LangChain chain with CERT testing capabilities.

**Parameters:**
- `chain`: Any LangChain chain with a `call()` method
- `runner`: Optional `TestRunner` instance for shared test tracking

**Returns:** `CertWrapper<T>`

### `CertWrapper.withConsistency(threshold, nTrials?)`

Adds consistency checking to the chain.

**Parameters:**
- `threshold`: Minimum consistency score (0-1)
- `nTrials`: Number of trials to run (default: 10)

**Returns:** `CertWrapper<T>`

### `CertWrapper.withAccuracy(groundTruth)`

Adds accuracy checking to the chain.

**Parameters:**
- `groundTruth`: Expected output definition

**Returns:** `CertWrapper<T>`

### `CertWrapper.getChain()`

Returns the underlying chain.

### `CertWrapper.getRunner()`

Returns the test runner instance.

## Examples

See `examples/langchain/` for complete examples:
- RAG pipeline with consistency testing
- Multi-step chain with accuracy validation
- Custom comparison rules
- Pipeline failure localization

## License

MIT
