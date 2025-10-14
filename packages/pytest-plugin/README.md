# pytest-cert

pytest plugin for CERT framework - seamlessly integrate LLM reliability testing into your pytest suite.

## Installation

```bash
pip install pytest-cert
```

## Quick Start

```python
import pytest
from cert import GroundTruth

@pytest.mark.cert_accuracy(
    id="test-capital",
    question="What is the capital of France?",
    expected="Paris"
)
async def test_my_llm_agent(cert_test_accuracy):
    async def agent():
        # Your LLM call here
        return "Paris"

    result = await cert_test_accuracy(agent)
    assert result.status == "pass"
```

## Features

### Accuracy Testing with Markers

Use the `@pytest.mark.cert_accuracy` decorator to define ground truth:

```python
@pytest.mark.cert_accuracy(
    id="revenue-q4",
    question="What was Q4 2023 revenue?",
    expected="$391 billion",
    equivalents=["391B", "$391,000,000,000"]
)
async def test_revenue_extraction(cert_test_accuracy):
    async def agent():
        # Your RAG pipeline
        docs = await retriever.get("Q4 2023 revenue")
        return await llm.generate(docs)

    result = await cert_test_accuracy(agent)
    assert result.status == "pass"
    assert result.accuracy >= 0.8
```

### Consistency Testing

Test that your agent produces consistent outputs:

```python
@pytest.mark.cert_consistency(threshold=0.9, n_trials=10)
async def test_agent_consistency(cert_test_consistency):
    async def agent():
        return await my_llm_chain.run("Tell me a fact")

    result = await cert_test_consistency("consistency-test", agent)
    assert result.consistency >= 0.9
```

### Combined Testing

Test both accuracy and consistency in one test:

```python
@pytest.mark.cert_accuracy(
    id="fact-check",
    question="Who invented the telephone?",
    expected="Alexander Graham Bell"
)
@pytest.mark.cert_consistency(threshold=0.95, n_trials=5)
async def test_fact_checking(cert_test_accuracy, cert_test_consistency):
    async def agent():
        return await fact_checker.check("Who invented the telephone?")

    # First, verify accuracy
    accuracy_result = await cert_test_accuracy(agent)
    assert accuracy_result.status == "pass"

    # Then check consistency
    consistency_result = await cert_test_consistency("fact-check", agent)
    assert consistency_result.consistency >= 0.95
```

## Fixtures

### `cert_runner`

Shared `TestRunner` instance for the entire test session:

```python
def test_something(cert_runner):
    # Access runner directly
    cert_runner.add_ground_truth(my_ground_truth)
    results = cert_runner.get_results()
```

### `cert_ground_truth`

Automatically extracts ground truth from test markers:

```python
@pytest.mark.cert_accuracy(
    id="test-1",
    question="What is 2+2?",
    expected="4"
)
def test_math(cert_ground_truth):
    # cert_ground_truth is automatically populated
    assert cert_ground_truth.expected == "4"
```

### `cert_test_accuracy`

Runs accuracy validation against ground truth:

```python
async def test_accuracy(cert_test_accuracy):
    async def my_agent():
        return "expected output"

    result = await cert_test_accuracy(my_agent)
    assert result.status == "pass"
```

### `cert_test_consistency`

Runs consistency testing:

```python
@pytest.mark.cert_consistency(threshold=0.9, n_trials=10)
async def test_consistency(cert_test_consistency):
    async def my_agent():
        return "output"

    result = await cert_test_consistency("test-id", my_agent)
    assert result.consistency >= 0.9
```

## Test Markers

### `@pytest.mark.cert_accuracy(**kwargs)`

Define ground truth for accuracy testing.

**Parameters:**
- `id` (str): Unique test identifier
- `question` (str): Input question/prompt
- `expected` (str|int|float|dict): Expected output
- `equivalents` (List[str], optional): Alternative valid outputs
- `metadata` (dict, optional): Additional metadata

**Example:**
```python
@pytest.mark.cert_accuracy(
    id="capital-test",
    question="Capital of France?",
    expected="Paris",
    equivalents=["paris", "PARIS"],
    metadata={"category": "geography"}
)
```

### `@pytest.mark.cert_consistency(**kwargs)`

Configure consistency testing.

**Parameters:**
- `threshold` (float): Minimum consistency score (0-1)
- `n_trials` (int): Number of trials to run
- `timeout` (int): Timeout per trial in milliseconds

**Example:**
```python
@pytest.mark.cert_consistency(
    threshold=0.95,
    n_trials=20,
    timeout=10000
)
```

## Test Reports

The plugin automatically generates a CERT test summary at the end of your pytest run:

```
======================== CERT Test Results ========================
✓ test-capital
  Consistency: 95.0%
  Accuracy: 100.0%

✗ test-revenue
  Consistency: 60.0%
  Accuracy: 100.0%
  Diagnosis: Moderate variance: 4/10 unique outputs
  Suggestions:
    - Set temperature=0 if not already
    - Check for non-deterministic data sources
    - Review prompt for ambiguous instructions
```

## Configuration

### pytest.ini

Configure CERT behavior in your `pytest.ini`:

```ini
[pytest]
markers =
    cert_accuracy: Mark test for accuracy validation
    cert_consistency: Mark test for consistency checking

# Require explicit opt-in for CERT tests
addopts = -m "not cert_accuracy and not cert_consistency"
```

### Running Only CERT Tests

```bash
# Run only accuracy tests
pytest -m cert_accuracy

# Run only consistency tests
pytest -m cert_consistency

# Run all CERT tests
pytest -m "cert_accuracy or cert_consistency"
```

## Examples

### Testing a LangChain Agent

```python
import pytest
from langchain.chains import LLMChain
from langchain.llms import OpenAI

llm = OpenAI(temperature=0)

@pytest.mark.cert_accuracy(
    id="langchain-test",
    question="What is 2+2?",
    expected="4"
)
async def test_langchain_agent(cert_test_accuracy):
    chain = LLMChain(llm=llm, prompt=prompt)

    async def agent():
        return await chain.arun(input="What is 2+2?")

    result = await cert_test_accuracy(agent)
    assert result.status == "pass"
```

### Testing a RAG Pipeline

```python
@pytest.mark.cert_accuracy(
    id="rag-test",
    question="What was Apple's revenue in Q4 2023?",
    expected="$119.6 billion",
    equivalents=["119.6B", "$119,600,000,000"]
)
@pytest.mark.cert_consistency(threshold=0.85, n_trials=5)
async def test_rag_pipeline(cert_test_accuracy, cert_test_consistency):
    async def rag_agent():
        docs = await retriever.retrieve("Apple Q4 2023 revenue")
        return await llm.generate(query, docs)

    # Test accuracy
    acc_result = await cert_test_accuracy(rag_agent)
    assert acc_result.status == "pass"

    # Test consistency
    cons_result = await cert_test_consistency("rag-test", rag_agent)
    assert cons_result.consistency >= 0.85
```

### Parameterized Tests

```python
@pytest.mark.parametrize("question,expected", [
    ("Capital of France?", "Paris"),
    ("Capital of Spain?", "Madrid"),
    ("Capital of Italy?", "Rome"),
])
async def test_capitals(question, expected, cert_runner):
    # Dynamically create ground truth
    gt = GroundTruth(
        id=f"capital-{expected.lower()}",
        question=question,
        expected=expected
    )
    cert_runner.add_ground_truth(gt)

    async def agent():
        return await geography_agent.answer(question)

    result = await cert_runner.test_accuracy(gt.id, agent)
    assert result.status == "pass"
```

## Advanced Usage

### Custom Semantic Comparator

```python
from cert import SemanticComparator, ComparisonRule

def custom_date_rule(expected: str, actual: str) -> bool:
    # Compare dates in different formats
    return parse_date(expected) == parse_date(actual)

@pytest.fixture(scope="session")
def cert_runner():
    comparator = SemanticComparator()
    comparator.add_rule(ComparisonRule(
        name="date-format",
        priority=95,
        match=custom_date_rule
    ))
    return TestRunner(semantic_comparator=comparator)
```

### Test Hooks

```python
def pytest_runtest_makereport(item, call):
    """Hook to save CERT results."""
    if call.when == "call":
        runner = item.funcargs.get("cert_runner")
        if runner:
            results = runner.get_results()
            # Save to database, send to monitoring, etc.
            save_results(results)
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: CERT Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: |
          pip install pytest pytest-cert
      - name: Run CERT tests
        run: pytest -v -m "cert_accuracy or cert_consistency"
```

## Troubleshooting

### Async Test Not Running

Make sure you have `pytest-asyncio` installed:

```bash
pip install pytest-asyncio
```

### Layer Enforcement Error

If you get a layer enforcement error, ensure you test accuracy before consistency:

```python
# Wrong order:
await cert_test_consistency("test-1", agent)  # Error!

# Correct order:
await cert_test_accuracy(agent)  # First
await cert_test_consistency("test-1", agent)  # Then
```

## License

MIT
