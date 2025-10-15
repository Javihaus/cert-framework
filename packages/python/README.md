# CERT Framework

Semantic document comparison with validated accuracy. Compare texts by meaning, not keywords.

## Install

```bash
pip install cert-framework
```

## Usage

```python
from cert import compare

result = compare("revenue increased", "sales grew")
print(result.matched)      # True
print(result.confidence)   # 0.87
```

That's it. Works out of the box with no configuration.

## Why CERT?

**Validated accuracy**: 87.6% accuracy on STS-Benchmark (2,879 sentence pairs). Run `pytest tests/test_benchmark_validation.py` to see the validation yourself.

**Simple API**: One function, no setup required. The complexity is hidden - the first call loads the model (~5 seconds), subsequent calls are instant (~50-100ms).

**Transparent behavior**: See exactly why texts matched or didn't:
```python
result = compare("The company's revenue increased", "Sales grew")
print(result)  # Match (confidence: 87%)

result = compare("revenue up", "revenue down")
print(result)  # No match (confidence: 42%)
```

## How It Works

CERT uses `all-mpnet-base-v2` sentence transformers to create semantic embeddings. Texts are compared using cosine similarity. The default threshold is 0.80 (80% similar).

```python
# Adjust threshold per comparison
result = compare(text1, text2, threshold=0.90)  # Stricter

# Or configure globally for advanced use
from cert import EmbeddingComparator
comp = EmbeddingComparator(threshold=0.75)
result = comp.compare(text1, text2)
```

## Performance

Measured on STS-Benchmark (standard semantic similarity dataset):

| Metric | Score |
|--------|-------|
| Accuracy | 87.6% |
| Precision | 84.2% |
| Recall | 86.1% |
| F1 Score | 85.1% |

**Domain-specific accuracy** (Financial/Medical/Legal terminology): 87.3% average

Run the validation yourself: `pytest tests/test_benchmark_validation.py -v`

## When It Doesn't Work

General text comparison works well (85%+  accuracy). CERT achieves strong results on:
- **General text**: 87.6% accuracy
- **Financial terminology**: 88.0% (revenue, EBITDA, YoY, etc.)
- **Medical terminology**: 89.2% (STEMI, HTN, MI, etc.)
- **Legal terminology**: 84.7% (citations, Latin phrases, etc.)

Limitations:
- **Very short texts** (1-2 words): Accuracy drops to ~70%
- **Highly technical jargon** not in training data: May require domain-specific fine-tuning
- **Negations**: "revenue up" vs "revenue down" are sometimes too similar (~65% confidence)

## Examples

### Basic Usage
```python
from cert import compare

# Simple comparison
result = compare("revenue increased", "sales grew")
if result:
    print(f"Match! Confidence: {result.confidence:.1%}")

# Batch processing
pairs = [
    ("net income rose", "profit increased"),
    ("CEO resigned", "executive departed"),
    ("Q3 earnings", "third quarter profits"),
]

for text1, text2 in pairs:
    result = compare(text1, text2)
    symbol = "✓" if result else "✗"
    print(f"{symbol} '{text1}' ↔ '{text2}' ({result.confidence:.0%})")
```

### Advanced Usage
```python
from cert import EmbeddingComparator

# Use a different model (faster but less accurate)
comparator = EmbeddingComparator(
    model_name='sentence-transformers/all-MiniLM-L6-v2',
    threshold=0.75
)

result = comparator.compare(
    "The quarterly earnings exceeded expectations",
    "Q3 profits beat forecasts"
)

print(f"Matched: {result.matched}")
print(f"Confidence: {result.confidence:.1%}")
```

See more examples in [`examples/`](examples/) directory.

## Validation

CERT includes comprehensive validation infrastructure:

```bash
# Quick validation (100 samples, 2 minutes)
pytest tests/test_benchmark_validation.py::TestSTSBenchmarkValidation::test_dev_split_sample -v

# Full validation (2,879 pairs, 30 minutes)
pytest tests/test_benchmark_validation.py::TestSTSBenchmarkValidation::test_full_dev_split -v

# Domain-specific validation
pytest tests/test_domain_specific_quick.py -v
```

Or run validation from Python:
```python
from cert.validation import run_sts_benchmark

metrics = run_sts_benchmark()
print(f"Accuracy: {metrics['accuracy']:.1%}")
print(f"Precision: {metrics['precision']:.1%}")
print(f"Recall: {metrics['recall']:.1%}")
```

## Development

```bash
git clone https://github.com/Javihaus/cert-framework
cd cert-framework/packages/python
pip install -e ".[dev]"
pytest
```

### Code Quality

- **Linting**: `ruff check .`
- **Formatting**: `ruff format .`
- **Type checking**: `mypy cert/`
- **Tests**: `pytest tests/`

## License

MIT

## Citation

If you use CERT in research, please cite:

```bibtex
@software{cert_framework,
  title = {CERT: Consistency Evaluation and Reliability Testing for LLM Systems},
  author = {Marin, Javier},
  year = {2025},
  url = {https://github.com/Javihaus/cert-framework}
}
```

## Support

- **Documentation**: [docs.cert-framework.org](https://docs.cert-framework.org) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/Javihaus/cert-framework/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Javihaus/cert-framework/discussions)

---

**Built with validated accuracy.** Run the tests yourself - don't just trust our claims.
