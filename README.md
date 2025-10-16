# CERT Framework

**C**onsistency **E**valuation and **R**eliability **T**esting for LLM Systems

CERT is a comprehensive testing framework for evaluating the reliability of LLM-based systems, with a focus on consistency, accuracy, and failure diagnosis. Inspired by the need for better debugging tools (similar to MCP Inspector), CERT provides both a CLI tool and an interactive web interface.

## Features

- **Layer-Enforced Testing**: Ensures proper testing order (retrieval → accuracy → consistency)
- **Automatic Failure Localization**: Automatically identifies which agent in a pipeline is causing variance
- **Semantic Comparison**: Pluggable comparison rules handle numerical equivalence, unit conversions, and fuzzy matching
- **Time-Series Tracking**: Monitors metric degradation over time with SQLite storage
- **Interactive Inspector UI**: Web-based interface for debugging and visualizing test results
- **Multi-Language Support**: TypeScript core with Python bindings and pytest integration
- **CI/CD Ready**: Outputs JUnit XML and integrates with GitHub Actions

## Quick Start

### Installation

```bash
# Install CLI globally
npm install -g @cert/cli

# Or use in a project
npm install @cert/core @cert/semantic
```

### Your First Test

```bash
# Initialize configuration
cert init

# Run tests
cert test

# Open interactive inspector
cert inspect
```

## Project Structure

```
cert-framework/
├── packages/
│   ├── core/              # Core testing primitives
│   ├── semantic/          # Semantic comparison engine
│   ├── inspector/         # Web UI (Next.js + React)
│   ├── cli/               # CLI tool
│   ├── langchain/         # LangChain integration
│   ├── python/            # Python bindings
│   └── pytest-plugin/     # pytest plugin
├── examples/              # Example implementations
├── docs/                  # Documentation site
└── turbo.json            # Monorepo configuration
```

## Architecture

CERT is built as a TypeScript monorepo using Turbo, with the following design principles:

1. **TypeScript Core**: Fast, type-safe core implementation
2. **Python Bindings**: Subprocess-based bindings for Python ecosystem compatibility
3. **Layer Enforcement**: Prevents testing consistency before validating accuracy
4. **Automatic Diagnosis**: Replaces manual interpretation with actionable suggestions
5. **Time-Series Tracking**: Catches gradual degradation that single-run tests miss

## Development

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.9+ (for Python bindings)

### Setup

```bash
# Clone the repository
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development mode (watch all packages)
npm run dev
```

### Package Development

Each package can be developed independently:

```bash
cd packages/core
npm run build    # Build the package
npm test         # Run tests
npm run lint     # Type check
```

## Core Concepts

### Ground Truth

Define expected behavior for your tests:

```typescript
import { GroundTruth } from '@cert/core';

const groundTruth: GroundTruth = {
  id: 'revenue-test',
  question: 'What was Apple total revenue?',
  expected: '$391.035 billion',
  equivalents: ['391.035B', '$391035000000'],
  metadata: {
    correctPages: [25, 26, 32],
    source: 'apple-10k-2024.pdf'
  }
};
```

### Consistency Testing

Measure output stability across multiple runs:

```typescript
import { measureConsistency } from '@cert/core';

const result = await measureConsistency(
  () => agent.extract(query),
  {
    nTrials: 10,
    consistencyThreshold: 0.85,
    accuracyThreshold: 0.80,
    semanticComparison: true
  }
);

console.log(`Consistency: ${result.consistency}`);
console.log(`Unique outputs: ${result.uniqueCount}`);
```

### Semantic Comparison

Handle equivalent outputs with pluggable rules:

```typescript
import { SemanticComparator } from '@cert/semantic';

const comparator = new SemanticComparator();

// Add custom rule
comparator.addRule({
  name: 'custom-date-match',
  priority: 95,
  match: (expected, actual) => {
    // Custom matching logic
    return normalizeDate(expected) === normalizeDate(actual);
  }
});

const result = comparator.compare('$391.035 billion', '391.035B');
// { matched: true, rule: 'normalized-number', confidence: 1.0 }
```

## Integration Examples

### LangChain

```typescript
import { cert } from '@cert/langchain';
import { LLMChain } from 'langchain/chains';

const chain = new LLMChain({ llm, prompt });
const tested = cert.wrap(chain)
  .withAccuracy(groundTruth)
  .withConsistency(0.85);

await tested.call({ query: "..." });
```

### pytest

```python
import pytest
from cert import TestRunner

@pytest.mark.cert
def test_agent_consistency(cert_runner):
    result = cert_runner.test_consistency(
        'test-1',
        lambda: agent.extract(query),
        threshold=0.85
    )
    assert result['status'] == 'pass', result['diagnosis']
```

## Why CERT?

Traditional testing focuses on functional correctness, but LLM systems have unique failure modes:

1. **Non-determinism**: Same input → different outputs
2. **Semantic Equivalence**: "$391B" = "$391 billion" = "$391,000,000,000"
3. **Pipeline Failures**: Which agent in a multi-step system is causing variance?
4. **Gradual Degradation**: Metrics slowly declining over time

CERT addresses these challenges by providing:

- Consistency measurement across multiple trials
- Semantic comparison with pluggable rules
- Automatic failure localization in pipelines
- Time-series tracking for degradation detection
- Interactive debugging via Inspector UI

## Roadmap

- [x] Core testing primitives
- [x] Semantic comparison engine
- [ ] Test runner with layer enforcement
- [ ] Automatic pipeline failure localization
- [ ] CLI tool
- [ ] Web Inspector UI
- [ ] LangChain integration
- [ ] Python bindings
- [ ] pytest plugin
- [ ] Time-series tracking with SQLite
- [ ] Documentation site
- [ ] CI/CD examples

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

ISC License - see [LICENSE](./LICENSE) for details.

## Acknowledgments

CERT is inspired by:
- [MCP Inspector](https://modelcontextprotocol.io) for its excellent debugging UI
- The need for better LLM system testing tools
- Research on consistency and reliability in LLM applications
