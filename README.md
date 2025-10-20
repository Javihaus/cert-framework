# CERT Framework

Context Entailment Reliability Testing

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## What is CERT?

CERT (Context Entailment Reliability Testing) provides context entailment reliability testing for LLM systems. We use NLI models to verify that generated outputs are logically entailed by their source context, combined with semantic similarity and grounding heuristics. 

## Why CERT?
We didn't start with an acronym. We started with a problem.
Companies deploying AI systems under EU AI Act regulations need to demonstrate due diligence. They need audit trails. They need risk assessments. They need to show they've taken reasonable steps to prevent harm.
But how do you demonstrate due diligence with systems that are fundamentally non-deterministic?
You can't make autoregressive models certain. The architecture - sampling from probability distributions over discrete tokens - doesn't permit guaranteed correctness. Temperature isn't zero. Context windows are finite. The models don't learn world models or logical constraints.
But you can measure certainty. You can ask:

- Is this output entailed by the source context? (NLI)
- Is it semantically similar to verified information? (Embeddings)
- Are its claims grounded in provided evidence? (Citation checking)

These measurements don't make the system certain. They quantify degrees of certainty - reliability scores you can use for risk-based decision making.
That's what I needed. A framework for measuring certainty in systems that can't be made certain.

**CERT: Context Entailment Reliability Testing**
The name came later. I needed something deployable - infrastructure that:

Measures entailment (does context support this conclusion?)
Assesses reliability (how confident should we be?)
Enables testing (continuous monitoring, not one-time validation)

CERT doesn't provide certainty. It provides certainty metrics for risk management in inherently uncertain systems.
## Installation

```bash
pip install cert-framework
```

## Quick Start

### Simple API: One-Line Verification

```python
from cert import compare

# Fast mode (~50ms) - Development, unit tests, CI/CD
result = compare("revenue increased", "sales grew")
if result.matched:
    print(f"✓ Match! Confidence: {result.confidence:.1%}")

# NLI mode (~300ms) - Production RAG verification
context = "Apple's Q4 2024 revenue was $391.035 billion"
answer = "Apple's Q4 2024 revenue was $450 billion"

result = compare(context, answer, use_nli=True)
if not result.matched:
    print(f"✗ Hallucination detected: {result.explanation}")
    # result.rule = "nli-contradiction" or "numeric-contradiction"
```

**Fast mode** (default): Regex contradictions + embeddings (~50ms)
- Use for: Development, unit tests, model regression testing

**NLI mode** (`use_nli=True`): Transformer-based detection (~300ms)
- Use for: Production RAG, audit trails, compliance
- Catches semantic contradictions fast mode misses

### Advanced API: Batch Testing

For statistical analysis across multiple LLM calls:

```python
from cert import TestRunner

runner = TestRunner()
runner.initialize_energy_scorer()

# Your RAG system
context = "Apple's Q4 2024 revenue was $391.035 billion."

def my_rag_agent():
    return rag_pipeline(query="What was Apple's Q4 revenue?")

# Test for hallucinations (5 trials)
result = runner.test_hallucination(
    'rag-test-1',
    context=context,
    agent_fn=my_rag_agent,
    config={'n_trials': 5, 'energy_threshold': 0.3}
)

# Check results
if result['contradiction_rate'] > 0:
    print(f"{result['diagnosis']}")
    print(f"Average energy: {result['avg_energy']:.3f}")
    print(f"Contradiction rate: {result['contradiction_rate']:.0%}")
```


## Features

- **Multi-component scoring**: Combines NLI, embeddings, and grounding heuristics
- **Fast and NLI modes**: ~50ms for development, ~300ms for production verification
- **Proven accuracy**: 95% precision on financial RAG contradiction detection
- **Energy threshold tuning**: Configure sensitivity for your use case
- **No fine-tuning required**: Works out-of-the-box with pre-trained models
- **EU AI Act compliant**: Provides "appropriate measures to detect errors" (Article 15)

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

We use "energy" as an intuitive metaphor: high energy = system is "working hard" 
to reconcile contradictions. This is NOT physics-based energy conservation - it's 
a weighted scoring function (lower scores = more confident matches).

CERT uses a three-component "energy" function:
- **Semantic**: Cosine similarity of embeddings (catches paraphrases)
- **NLI**: Entailment score from transformer (catches contradictions)
- **Grounding**: Term overlap ratio (catches invented terminology)


$E(c,a)=1−(\alpha⋅s_{semantic}​(c,a)+\beta⋅s_{nli}​(c,a)+\gamma⋅s_{grounding}​(c,a))$

with weights $\alpha + \beta + \gamma = 1$. Our default weights (semantic=0.25, 
nli=0.55, grounding=0.20) were optimized  on a validation set of 500 RAG 
examples (legal and financial contexts) with human annotated hallucinations.

$E(\mathbf{c}, \mathbf{a}) \approx 0$ → well grounded, consistent with context

$E(\mathbf{c}, \mathbf{a}) \approx 1$ → answer contradicts or unsupported by context


### NLI Contradiction Detection

Uses `microsoft/deberta-v3-base` trained on MNLI:
- 90%+ accuracy on contradiction detection
- Proven on financial, medical, and legal domains
- No fine-tuning required

We flag critical contradictions when:

$s_{\text{nli}}(\mathbf{c}, \mathbf{a}) < \tau_{\text{critical}}$

with $\tau_{\text{critical}} = 0.3$ empirically chosen for high-risk systems. This threshold can be adjusted based on domain requirements and risk tolerance.


## Examples

See `examples/` for complete working examples:

- **`financial_rag_hallucination.py`**: Financial RAG with NLI contradiction detection
- **`01_chatbot_consistency.py`**: Chatbot consistency testing with fast/NLI modes
- **`02_rag_retrieval.py`**: RAG retrieval consistency testing
- **`03_model_regression.py`**: Testing model changes don't break responses
- **`04_pytest_integration.py`**: Pytest integration patterns
- **`05_real_llm_testing.py`**: Live OpenAI/LLM testing

Run any example:
```bash
python examples/financial_rag_hallucination.py
python examples/01_chatbot_consistency.py --nli
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
- **Inference time**:
  - Fast mode: ~50ms per comparison (CPU)
  - NLI mode: ~300ms per comparison (CPU)
- **Memory**: ~2GB RAM with both models loaded
- **First run**: Downloads models automatically, subsequent runs load from cache

## EU AI Act Compliance

CERT helps satisfy Article 15 requirements for high-risk AI systems:

- Appropriate measures to detect errors"
- Audit trail of verification
- Documented testing methodology
- Production-ready validation

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

## Architecture

CERT provides two APIs for different use cases:

1. **Simple API** (`compare()`): One-line verification for single comparisons
   - Ideal for: Production RAG pipelines, real-time verification
   - Returns: `ComparisonResult` with matched status and explanation

2. **Batch API** (`TestRunner`): Statistical analysis across multiple trials
   - Ideal for: Testing, regression detection, quality monitoring
   - Returns: Aggregate metrics (contradiction rate, average energy)
