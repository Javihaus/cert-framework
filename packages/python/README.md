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

Four production-ready examples showing real-world use cases:

### 1. Document Deduplication ([`01_deduplication.py`](examples/01_deduplication.py))
Find and remove near-duplicate documents:
```python
from cert import compare

documents = [
    "Apple reported strong iPhone sales in Q4 2024",
    "Apple's Q4 2024 results showed robust iPhone revenue",  # Near-duplicate
    "Microsoft Azure cloud revenue grew 30% year-over-year",
]

duplicates = []
for i in range(len(documents)):
    for j in range(i + 1, len(documents)):
        result = compare(documents[i], documents[j])
        if result.matched:
            duplicates.append((i, j, result.confidence))
```

### 2. Support Ticket Classification ([`02_ticket_classification.py`](examples/02_ticket_classification.py))
Route tickets by similarity to resolved tickets:
```python
resolved_tickets = [
    {"category": "billing", "text": "I was charged twice"},
    {"category": "technical", "text": "App crashes on export"},
]

new_ticket = "I see two charges on my credit card"

best_match = None
best_confidence = 0.0
for ticket in resolved_tickets:
    result = compare(new_ticket, ticket["text"])
    if result.confidence > best_confidence:
        best_match = ticket
        best_confidence = result.confidence
```

### 3. Content Similarity Search ([`03_content_similarity.py`](examples/03_content_similarity.py))
Find similar articles (suitable for datasets up to ~1000 items):
```python
query = "Introduction to Machine Learning"
corpus = [
    "Deep Learning Fundamentals",
    "Natural Language Processing Basics",
    "Getting Started with Python",
]

similarities = []
for article in corpus:
    result = compare(query, article)
    if result.matched:
        similarities.append((article, result.confidence))

# Sort by confidence
similarities.sort(key=lambda x: x[1], reverse=True)
```

### 4. Debugging Comparisons ([`04_debugging_inspector.py`](examples/04_debugging_inspector.py))
Understand why comparisons succeed or fail:
```python
result = compare("revenue up", "revenue down")
print(f"Matched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Threshold: 0.80")

if not result.matched:
    print("✗ FALSE NEGATIVE: Should have matched but didn't")
    print("→ Consider lowering threshold to 0.70-0.75")
```

**Performance note**: CERT does pairwise comparison (O(N²)). Good for deduplication and classification. For large-scale search (>10K documents), use vector databases (Pinecone, Weaviate, FAISS).

See full examples with sample data in [`examples/`](examples/) directory.

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

## Project Structure

```
cert-framework/packages/python/
├── cert/                       # Core library
│   ├── __init__.py            # Exports: compare, ComparisonResult, EmbeddingComparator
│   ├── compare.py             # Simple API: compare(text1, text2, threshold)
│   ├── embeddings.py          # EmbeddingComparator class
│   ├── validation.py          # User-facing validation functions
│   └── cli.py                 # CLI tools: cert-compare
├── examples/                   # Production-ready examples
│   ├── README.md              # Performance notes and scaling guidance
│   ├── 01_deduplication.py    # Find and remove duplicate documents
│   ├── 02_ticket_classification.py  # Route tickets by similarity
│   ├── 03_content_similarity.py     # Find similar articles
│   └── 04_debugging_inspector.py    # Debug and tune comparisons
├── tests/                      # Comprehensive test suite
│   ├── test_compare_api.py    # API tests (20+ test cases)
│   ├── test_benchmark_validation.py  # STS-Benchmark validation
│   └── test_domain_specific_quick.py # Domain terminology tests
└── setup.py                    # Package configuration
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
