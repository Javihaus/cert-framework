# CERT Framework - Python

Consistency Evaluation and Reliability Testing for LLM systems in Python.

**Validated:** 85%+ accuracy on STS-Benchmark (8,628 human-annotated pairs). [See validation →](tests/test_benchmark_validation.py)

## Installation

```bash
pip install cert-framework
```

**Note:** Sentence transformer embeddings (~420MB model) are **required** for semantic comparison and will be downloaded on first use.

## Quick Start

Compare two texts for semantic similarity in 3 lines:

```python
from cert import compare

result = compare("revenue increased", "sales grew")
print(f"Match: {result.matched}, Confidence: {result.confidence:.1%}")
```

**That's it!** Uses optimal defaults (all-mpnet-base-v2 model, 0.80 threshold).

### More Examples

```python
# Boolean usage
if compare("profit up", "earnings rose"):
    print("These mean the same thing!")

# Batch processing
pairs = [
    ("EBITDA", "earnings before interest, taxes, depreciation, and amortization"),
    ("YoY growth", "year-over-year increase"),
    ("market cap", "market capitalization"),
]

for text1, text2 in pairs:
    result = compare(text1, text2)
    status = "✓" if result else "✗"
    print(f"{status} '{text1}' ↔ '{text2}' ({result.confidence:.1%})")

# Custom threshold
result = compare("good product", "great item", threshold=0.90)  # Stricter
```

**See [examples/basic_usage.py](examples/basic_usage.py) for complete examples.**

## How It Works

CERT uses sentence embeddings to measure semantic similarity:

1. **First call:** Downloads all-mpnet-base-v2 model (~420MB, one-time)
2. **Each comparison:** Computes embeddings and cosine similarity (~50-100ms)
3. **Returns:** Boolean match + confidence score

**Default threshold (0.80):** Achieves 87.6% accuracy on STS-Benchmark with balanced precision/recall.

## Advanced: Full Testing Framework

For comprehensive LLM testing (consistency, accuracy, diagnostics):

```python
import asyncio
from cert import TestRunner, GroundTruth, TestConfig

# Define ground truth
ground_truth = GroundTruth(
    id="capital-france",
    question="What is the capital of France?",
    expected="Paris"
)

# Create test runner
runner = TestRunner()
runner.add_ground_truth(ground_truth)

# Your LLM agent function
async def my_agent():
    # Your LLM call here
    return "Paris"

async def main():
    # Test accuracy first (required)
    accuracy_result = await runner.test_accuracy(
        "capital-france",
        my_agent
    )
    print(f"Accuracy: {accuracy_result.accuracy:.2%}")

    # Then test consistency
    config = TestConfig(n_trials=10, consistency_threshold=0.9)
    consistency_result = await runner.test_consistency(
        "capital-france",
        my_agent,
        config
    )
    print(f"Consistency: {consistency_result.consistency:.2%}")

asyncio.run(main())
```

## Features

### Layer Enforcement

CERT enforces proper testing order to prevent accepting consistent but incorrect answers:

```python
runner = TestRunner()
runner.add_ground_truth(ground_truth)

# This will raise ValueError - must test accuracy first!
# await runner.test_consistency("test-1", agent, config)

# Correct order:
await runner.test_accuracy("test-1", agent)  # First verify correctness
await runner.test_consistency("test-1", agent, config)  # Then check consistency
```

### Consistency Testing

Measure how consistently your LLM produces the same output:

```python
config = TestConfig(
    n_trials=10,
    consistency_threshold=0.9,
    timeout=30000  # milliseconds
)

result = await runner.test_consistency("test-id", agent, config)

if result.status == "fail":
    print(f"Diagnosis: {result.diagnosis}")
    print(f"Suggestions: {result.suggestions}")
    print(f"Unique outputs: {result.evidence.unique_count}")
```

### Accuracy Testing

Verify outputs match expected values with semantic comparison:

```python
ground_truth = GroundTruth(
    id="revenue-q4",
    question="What was Q4 revenue?",
    expected="$391 billion",
    equivalents=["391B", "$391,000,000,000"]  # Alternative valid formats
)

result = await runner.test_accuracy("revenue-q4", agent)
```

### Semantic Comparison

Built-in rules handle equivalent outputs automatically:

```python
from cert import SemanticComparator

comparator = SemanticComparator()

# These all match:
comparator.compare("$391 billion", "391B")  # ✓
comparator.compare("$391 billion", "$391,000,000,000")  # ✓
comparator.compare("Paris", "paris")  # ✓ (case insensitive)
```

## Intelligent Comparator (Recommended)

The `IntelligentComparator` automatically detects input types and routes to the optimal comparison strategy. **Embeddings are always used** for semantic text comparison.

```python
from cert import IntelligentComparator

# Default: automatic routing with embeddings
comparator = IntelligentComparator()

# With domain hint for domain-specific routing
comparator = IntelligentComparator(domain='medical')

# Adjust embedding threshold for stricter/looser matching
comparator = IntelligentComparator(embedding_threshold=0.80)

# Use with TestRunner
from cert import TestRunner
runner = TestRunner(semantic_comparator=comparator)

# Automatically uses number normalization for numerical inputs
result = comparator.compare('$391 billion', '391B')
# → matched=True, rule='normalized-number', confidence=1.0

# Automatically uses semantic comparison for text
result = comparator.compare('reduced latency', 'faster response times')
# → matched=True, rule='fuzzy-text' or 'embedding-similarity'

# Explain routing decisions
explanation = comparator.explain('$391 billion', '391B', result)
print(explanation)
# Detected input type: numerical (confidence: 0.95)
# Comparison result: ✓ MATCHED (confidence: 1.00)
# Rule used: normalized-number
# Used rule-based number normalization...
```

### Routing Logic

| Input Type | Detection Criteria | Strategy Used |
|------------|-------------------|---------------|
| **Numerical** | Numbers with units/currency ($391B, 42%, 100kg) | Rule-based normalization |
| **Dates** | Date formats (MM/DD/YYYY, ISO-8601, Q4 2024) | Date parsing + comparison |
| **Domain-Specific** | User-specified domain hint | Fine-tuned model or fallback |
| **General Text** | Everything else | Embeddings or fuzzy matching |

### Why Embeddings Are Required

Embeddings are essential for semantic comparison of LLM outputs:

```python
# These should match (vocabulary substitutions):
comparator.compare("revenue increased", "sales grew")  # ✓ with embeddings
comparator.compare("smartphones", "phones")  # ✓ with embeddings
comparator.compare("faster response", "reduced latency")  # ✓ with embeddings

# Without embeddings, you'd need manual equivalents for EVERY variation
# The ~420MB model download is the cost of doing business
```

## Choosing a Comparator

CERT provides multiple comparison strategies:

### Rule-Based (Default) - Fast & Deterministic

```python
runner = TestRunner()  # Uses SemanticComparator
```

**Use for:**
- Extracting specific facts (revenue numbers, dates, names)
- Classification tasks with known categories
- Fast CI/CD tests

**Limitations:**
- Requires manual equivalents lists
- May fail on semantic shifts ("speed" vs "fast")

### Embedding-Based - Semantic Similarity (Included by Default)

**Embeddings are now required** and included with the base installation.

```python
from cert.embeddings import EmbeddingComparator

runner = TestRunner(semantic_comparator=EmbeddingComparator(threshold=0.75))
```

**Use for:**
- Open-ended questions ("Name a benefit...")
- Abstract concepts
- Multiple valid phrasings
- Vocabulary substitutions

**Tradeoffs:**
- ~420MB model download (one-time, required)
- 50-100ms per comparison
- May require threshold tuning

**Validation:** See `tests/test_benchmark_validation.py` for STS-Benchmark validation (8,628 human-annotated sentence pairs). Expected accuracy: 82-86%.

### LLM-as-Judge - Most Robust

```bash
pip install cert-framework[llm-judge]
```

```python
import anthropic
from cert.llm_judge import LLMJudgeComparator

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
comparator = LLMJudgeComparator(client)

runner = TestRunner(semantic_comparator=comparator)
```

**Use for:**
- Complex semantic equivalence
- Domain-specific terminology
- High-stakes validation

**Tradeoffs:**
- ~500-1000ms per comparison
- ~$0.00005 per comparison
- Requires API key

### Custom Comparison Rules

Add your own semantic rules to any comparator:

```python
from cert import ComparisonRule

def date_match(expected: str, actual: str) -> float:
    # Custom logic to compare dates in different formats
    # "2024-01-15" == "January 15, 2024"
    return 1.0 if parse_date(expected) == parse_date(actual) else 0.0

custom_rule = ComparisonRule(
    name="date-format",
    priority=95,  # Higher priority = checked first
    match=date_match
)

comparator = SemanticComparator()
comparator.add_rule(custom_rule)

runner = TestRunner(semantic_comparator=comparator)
```

### Automatic Diagnosis

When tests fail, CERT automatically diagnoses the cause:

```python
result = await runner.test_consistency("test-id", agent, config)

if result.status == "fail":
    # Automatic diagnosis:
    # "High variance: All 10 outputs were unique.
    #  Likely causes: high temperature, non-deterministic retrieval"
    print(result.diagnosis)

    # Actionable suggestions:
    # - Set temperature=0 if not already
    # - Check for non-deterministic data sources
    # - Review prompt for ambiguous instructions
    for suggestion in result.suggestions:
        print(f"  - {suggestion}")
```

## Error Handling

```python
from cert import ConsistencyError, AccuracyError

try:
    result = await runner.test_accuracy("test-1", agent)
    if result.status == "fail":
        raise AccuracyError(
            result.diagnosis,
            str(ground_truth.expected),
            str(actual_output)
        )
except AccuracyError as e:
    print(f"Expected: {e.expected}")
    print(f"Got: {e.actual}")
    print(f"Why: {e.diagnosis}")
```

## Integration with pytest

See `@cert/pytest-plugin` for pytest integration.

## API Reference

### `TestRunner`

Main test runner with layer enforcement.

**Methods:**
- `add_ground_truth(ground_truth: GroundTruth)`: Register ground truth
- `test_accuracy(test_id, agent_fn, config?) -> TestResult`: Test accuracy
- `test_consistency(test_id, agent_fn, config) -> TestResult`: Test consistency
- `get_results(test_id?) -> List[TestResult]`: Get test results

### `GroundTruth`

Definition of expected output.

**Fields:**
- `id: str`: Unique identifier
- `question: str`: Input question
- `expected: Union[str, int, float, dict]`: Expected output
- `equivalents: List[str]`: Alternative valid outputs
- `metadata: dict`: Additional metadata

### `TestConfig`

Test configuration.

**Fields:**
- `n_trials: int = 10`: Number of trials for consistency
- `consistency_threshold: float = 0.9`: Minimum acceptable consistency
- `accuracy_threshold: float = 0.8`: Minimum acceptable accuracy
- `semantic_comparison: bool = True`: Use semantic comparison
- `timeout: int = 30000`: Timeout in milliseconds

### `TestResult`

Test execution result.

**Fields:**
- `test_id: str`: Test identifier
- `status: TestStatus`: "pass", "fail", or "warn"
- `timestamp: datetime`: When test ran
- `consistency: float`: Consistency score (0-1)
- `accuracy: float`: Accuracy score (0-1)
- `evidence: Evidence`: Evidence of variance
- `diagnosis: str`: Failure diagnosis
- `suggestions: List[str]`: Fix suggestions

## Examples

### LangChain Integration

```python
from langchain.chains import LLMChain
from langchain.llms import OpenAI
from cert import TestRunner, GroundTruth, TestConfig

llm = OpenAI(temperature=0)
chain = LLMChain(llm=llm, prompt=prompt)

async def agent():
    return await chain.arun(input="What is the capital of France?")

runner = TestRunner()
runner.add_ground_truth(GroundTruth(
    id="test-1",
    question="Capital of France?",
    expected="Paris"
))

# Test it
await runner.test_accuracy("test-1", agent)
await runner.test_consistency("test-1", agent, TestConfig(n_trials=5))
```

### RAG Pipeline

```python
async def rag_agent(query: str):
    # Retrieve
    docs = await retriever.retrieve(query)
    # Generate
    response = await llm.generate(query, docs)
    return response

result = await runner.test_consistency(
    "rag-test",
    lambda: rag_agent("What was Q4 revenue?"),
    TestConfig(n_trials=10)
)
```

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black cert/

# Type check
mypy cert/
```

## License

MIT
