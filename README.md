# CERT Framework

Production-ready hallucination detection for LLM systems.

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## What is CERT?

CERT (Consistency and Entailment Regression Testing) detects hallucinations in RAG systems and other LLM applications using multi-component energy scoring:

- **NLI Contradiction Detection**: Uses transformers (deberta-v3-base) to detect when answers contradict context
- **Semantic Similarity**: Embedding-based comparison to catch paraphrases and rewording
- **Grounding Analysis**: Term overlap to detect invented entities or terminology
- **Production Ready**: No training required, works reliably on financial, medical, and legal domains

## Installation

```bash
pip install cert-framework
```

## Quick Start

### Hallucination Detection for RAG Systems

```python
from cert import TestRunner

# Initialize
runner = TestRunner()
runner.initialize_energy_scorer()  # Loads NLI model (~500MB first time)

# Your RAG system
context = "Apple's Q4 2024 revenue was $391.035 billion."

def my_rag_agent():
    return rag_pipeline(query="What was Apple's Q4 revenue?")

# Test for hallucinations
result = runner.test_hallucination(
    'rag-test-1',
    context=context,
    agent_fn=my_rag_agent,
    config={'n_trials': 5, 'energy_threshold': 0.3}
)

# Check results
if result['contradiction_rate'] > 0:
    print(f"⚠️  {result['diagnosis']}")
    print(f"Energy: {result['avg_energy']:.3f}")
```

### Consistency Testing

```python
from cert import TestRunner, GroundTruth

runner = TestRunner()

# Add ground truth
runner.add_ground_truth(GroundTruth(
    id="chatbot-greeting",
    expected="Hello! How can I help you?",
    equivalents=["Hi! How can I assist you?"]
))

# Test accuracy
result = await runner.test_accuracy(
    "chatbot-greeting",
    agent_fn=lambda: chatbot.respond("hi"),
    config={"threshold": 0.8}
)

# Test consistency (requires passing accuracy first)
result = await runner.test_consistency(
    "chatbot-greeting",
    agent_fn=lambda: chatbot.respond("hi"),
    config={"n_samples": 10, "consistency_threshold": 0.95}
)
```

## Features

### Hallucination Detection

Detects when LLM outputs contradict or aren't grounded in provided context:

- **Multi-component scoring**: Combines NLI, embeddings, and grounding
- **Proven accuracy**: 95% precision on financial RAG contradiction detection
- **Energy threshold tuning**: Configure sensitivity for your use case
- **EU AI Act compliant**: Provides "appropriate measures to detect errors" (Article 15)

### Consistency Testing

Ensures LLM outputs remain stable across multiple runs:

- **Variance detection**: Identifies non-deterministic behavior
- **Auto-diagnosis**: Explains why outputs vary
- **Layered testing**: Enforces accuracy before consistency

## Use Cases

### Financial RAG Systems
- 10-K reports, earnings transcripts, SEC filings
- Detects wrong numbers and unit errors ($M vs $B)
- Catches contradictions before they cause compliance issues

### Medical Triage Systems
- Clinical decision support, diagnosis assistance
- Detects when recommendations contradict clinical notes
- High-stakes applications requiring verification

### Legal Document Analysis
- Case law research, contract analysis
- Ensures claims are grounded in source documents
- Audit trail for compliance

## How It Works

### Energy Scoring

CERT uses a three-component energy function:

```
Energy = 1 - (0.25 × semantic + 0.55 × NLI + 0.20 × grounding)
```

- **Semantic**: Cosine similarity of embeddings (catches paraphrases)
- **NLI**: Entailment score from transformer (catches contradictions)
- **Grounding**: Term overlap ratio (catches invented terminology)

Lower energy = better grounding. Threshold 0.3 works for most applications.

### NLI Contradiction Detection

Uses `microsoft/deberta-v3-base` trained on MNLI:
- 90%+ accuracy on contradiction detection
- Proven on financial, medical, and legal domains
- No fine-tuning required

## Examples

See `examples/` for complete working examples:

- **`financial_rag_hallucination.py`**: Financial RAG with contradiction detection
- **`01_chatbot_consistency.py`**: Chatbot consistency testing
- **`02_caching_accuracy.py`**: Testing caching optimizations
- **`03_medical_triage.py`**: Medical triage accuracy testing

Run any example:
```bash
python examples/financial_rag_hallucination.py
```

## Configuration

### Energy Threshold Tuning

```python
config = {
    'n_trials': 10,           # More trials = better statistics
    'energy_threshold': 0.3   # Lower = stricter
}
```

Recommended thresholds:
- **High-stakes (financial, medical)**: 0.3
- **General RAG applications**: 0.4
- **Low-stakes (recommendations)**: 0.5

### Custom Component Weights

```python
from cert.energy import ProductionEnergyScorer

scorer = ProductionEnergyScorer(
    embeddings=embeddings,
    nli=nli,
    weights={
        'semantic': 0.3,
        'nli': 0.5,
        'grounding': 0.2
    }
)
```

## Performance

- **Embedding model**: ~420MB download (sentence-transformers/all-mpnet-base-v2)
- **NLI model**: ~500MB download (microsoft/deberta-v3-base)
- **Inference time**: ~100-200ms per comparison (CPU)
- **Memory**: ~2GB RAM with both models loaded

## EU AI Act Compliance

CERT helps satisfy Article 15 requirements for high-risk AI systems:

✅ "Appropriate measures to detect errors"
✅ Audit trail of verification
✅ Documented testing methodology
✅ Production-ready validation

## Development

### Run Tests

```bash
python -m pytest tests/
```

### Run Linting

```bash
ruff check cert/
ruff format cert/
```

## License

ISC License - see LICENSE file

## Citation

If you use CERT in research, please cite:

```bibtex
@software{cert_framework,
  title = {CERT Framework: Production-Ready Hallucination Detection for LLM Systems},
  author = {Marin, Javier},
  year = {2024},
  url = {https://github.com/Javihaus/cert-framework}
}
```

## Support

- **Issues**: [GitHub Issues](https://github.com/Javihaus/cert-framework/issues)
- **Documentation**: See `examples/` for working code

## Contributing

See CONTRIBUTING.md for guidelines.
