# CERT Framework

[**What CERT Solves**](#What_CERT_Solves)
| [**Core Capabilities**](#Core_Capabilities)
| [**Quickstart**](#quickstart)
| [**Installation**](#installation)
| [**Examples**](#examples)
| [**Configuration**](#configuration)
| [**Validation**](#validation)
| [**EU AI Act Compliance**](#EU_AI_Act_Compliance)
| [**Citation**](#citation)
| [**Contributing**](#contributing)

Production-grade AI system reliability testing for LLM applications and model evaluation.

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

## What CERT Solves

CERT is a framework to manage to critical friction in AI systems deployment that have no standarized tools:

**Problem 1: AI Systems Hallucinate and You Can't Measure It**

Your LLM generates text that contradicts source material. You can't measure hallucination rate systematically. Auditors want evidence. Compliance officers want metrics. CERT detects hallucinations through proven methods from regulated industries (financial, medical, legal): Natural Language Inference contradiction detection combined with semantic grounding verification.

**Problem 2: Agentic Pipeline Assesment**

You need to choose between Claude, GPT-4, Gemini or any SOTA model for production. Vendor benchmarks don't measure your actual use case. You run a few manual tests, results vary randomly, you make a guess. CERT provides statistical rigor—consistency metrics, latency percentiles (P95/P99), output diversity analysis—so your decision is data-driven, not intuition-driven.

---

## Core Capabilities

### 1. Context Entailment & RAG Testing

Detect hallucinations by verifying whether LLM outputs are logically entailed by source context. Combines Natural Language Inference (NLI), semantic embedding similarity, and grounding heuristics into a single confidence metric.

**Use cases:**
- RAG systems in compliance-sensitive domains (financial services, healthcare, legal tech)
- Accuracy claims validation (EU AI Act Article 15 compliance documentation)
- CI/CD quality gates for content-generation pipelines
- Pre-deployment verification for production systems

**Performance modes:**
- Fast mode (~50ms): Embedding-based similarity + grounding heuristics. For development and unit testing.
- NLI mode (~300ms): Adds transformer-based entailment detection. For production and audit trails.
- Unified energy scoring: Single confidence metric (lower = grounded, higher = potential hallucination).

**Validation:**
- 95% precision on financial RAG systems (500 manually-annotated examples from financial institutions)
- Outperformed learned models in comparative evaluation (50 legal examples from EU AI Act regulation text)
- Requires no fine-tuning; uses pre-trained models

### 2. Agentic Pipeline Accuracy

Systematically measures what actually matters for deployment: consistency, output stability, latency predictability, and robustness under load.

**Metrics:**
- **Consistency**: Output stability across identical prompts (20+ trials). Identifies models with erratic behavior.
- **Output Quality**: Semantic diversity, repetition patterns, length variance. Detects models stuck in loops.
- **Latency Profile**: Percentiles (P95, P99), standard deviation, coefficient of variation. Not just averages.
- **Robustness**: Error rates, timeout handling, exception frequency across providers.
- **Statistical Rigor**: Confidence intervals, Cohen's d effect sizes. Defensible for compliance documentation.

**Use cases:**
- Model selection before production commitment (wrong choice = 30-60% cost overrun)
- Performance regression testing after model version updates
- Compliance audit documentation (Article 15 accuracy claims)

---


## Quick Start

### Simple API: One-Line Verification

```python
from cert import compare

# Fast mode (~50ms) - development, unit tests, CI/CD
result = compare("revenue increased", "sales grew")
if result.matched:
    print(f"Match. Confidence: {result.confidence:.1%}")

# NLI mode (~300ms) - production RAG systems
context = "Apple's Q4 2024 revenue was $391.035 billion"
answer = "Apple's Q4 2024 revenue was $450 billion"

result = compare(context, answer, use_nli=True)
if not result.matched:
    print(f"Hallucination: {result.explanation}")
    # result.rule = "nli-contradiction" or "numeric-contradiction"
```

**When to use each mode:**
- Fast mode: Development, unit testing, regression testing during iteration
- NLI mode: Production RAG, audit trails, compliance documentation

### Advanced API: Statistical Testing

Test hallucination rate across multiple LLM calls with statistical analysis:

```python
from cert import TestRunner

runner = TestRunner()
runner.initialize_energy_scorer()

context = "Apple's Q4 2024 revenue was $391.035 billion."

def my_rag_system():
    # Your RAG pipeline
    return rag_pipeline(query="What was Apple's Q4 revenue?")

# Test with multiple trials (n=5 minimum, 20+ recommended)
result = runner.test_hallucination(
    'rag-test-1',
    context=context,
    agent_fn=my_rag_system,
    config={'n_trials': 20, 'energy_threshold': 0.3}
)

# Results for reporting
if result['contradiction_rate'] > 0:
    print(f"Contradiction rate: {result['contradiction_rate']:.0%}")
    print(f"Diagnosis: {result['diagnosis']}")
    print(f"Average energy: {result['avg_energy']:.3f}")
```

---
## Installation

### From PyPI (Recommended)

```bash
# Core installation
pip install cert-framework

# With development tools
pip install cert-framework[dev]

# With all optional features
pip install cert-framework[all]
```

### From Source

```bash
# Clone repository
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework

# Install all dependencies (includes LLM providers and agentic frameworks)
pip install -r requirements.txt

# OR install package in editable mode with all dependencies
pip install -e .
```

**Requirements:**
- Python 3.8 or higher
- ~2GB RAM (embedding + NLI models loaded)
- First run downloads models (~920MB total); subsequent runs use cache

**Dependencies included:**
- Core: sentence-transformers, transformers, torch, numpy, scipy
- LLM Providers: anthropic, openai, google-generativeai
- Agentic Frameworks: langchain, autogen, crewai
- Development: pytest, ruff, mypy
- Optional: flask (for inspector UI)

Automatic model downloads:
- Embeddings: sentence-transformers/all-mpnet-base-v2 (~420MB)
- NLI: microsoft/deberta-v3-base (~500MB)

---

### Features

- **Multi-component scoring**: NLI, embeddings, and grounding heuristics combined
- **Two performance modes**: 50ms (development) and 300ms (production) 
- **Proven accuracy**: 95% precision on financial RAG systems
- **No fine-tuning**: Works out-of-the-box with pre-trained models
- **Compliance-aligned**: Supports EU AI Act Article 15 documentation requirements
- **Energy threshold tuning**: Configure sensitivity for your risk profile

---

## How It Works

### Energy Scoring: Understanding the Confidence Metric

We use "energy" as a scoring metaphor (not physics-based; a mathematical scoring function).

CERT combines three independent evidence sources:

```
E(context, answer) = 1 - (α·s_semantic + β·s_nli + γ·s_grounding)
```

Where:
- **s_semantic**: Cosine similarity of embeddings (0-1)
- **s_nli**: Entailment score from NLI model (0-1)
- **s_grounding**: Term overlap ratio (0-1)
- **α, β, γ**: Weights summing to 1

Default weights (α=0.25, β=0.55, γ=0.20) optimized on 500 manually-annotated RAG examples.

**Interpretation:**
- E ≈ 0: Answer well-grounded, supported by context
- E ≈ 1: Answer contradicts or unsupported by context

Critical contradiction flag when NLI entailment < 0.3 (empirically chosen for high-risk systems).

### NLI Contradiction Detection

Uses `microsoft/deberta-v3-base` trained on MNLI dataset:
- 90%+ accuracy on contradiction detection
- Validated on financial, medical, and legal domains
- No fine-tuning required

---

## Examples

Complete working examples in `examples/` directory:

- **`single_model/llm_response_consistency.py`**: Chatbot consistency testing (fast/NLI modes)
- **`single_model/model_matching.py`**: Model version change regression testing
- **`single_model/pytest_integration.py`**: Pytest integration patterns
- **`single_model/real_llm_testing.py`**: Cross-provider LLM testing (Anthropic/OpenAI)
- **`rag/rag_retrieval.py`**: RAG retrieval consistency testing
- **`rag/rag_hallucination_detection.py`**: RAG system validation with NLI contradiction detection
- **`agents/assess_llm_providers.py`**: Agentic pipeline assessment across multiple providers

Run examples:
```bash
python examples/rag/rag_hallucination_detection.py
python examples/single_model/llm_response_consistency.py --nli
python examples/agents/assess_llm_providers.py
```

---

## Configuration

### Energy Threshold Tuning

```python
config = {
    'n_trials': 20,          # Statistical significance requires 20+ trials
    'energy_threshold': 0.3  # Lower = stricter detection
}
```

Recommended thresholds by context:
- High-stakes (financial, medical, legal): 0.3
- Standard RAG applications: 0.4
- Low-stakes (recommendations): 0.5

### Custom Component Weights

Calibrate for specific domains:

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

---

## Validation

CERT development included comparative testing of rule-based vs. learned approaches across regulated domains.

**Validation dataset:**
- 500 manually-annotated RAG examples (financial institutions)
- 50 examples from EU Regulation 2024/1689 (AI Act regulation text)
- 90+ MNLI accuracy (microsoft/deberta-v3-base)
- 87.6% STS-Benchmark (sentence-transformers/all-mpnet-base-v2)

**What CERT detects:**
- Numeric contradictions ($391B vs $450B)
- Unit errors ($391B vs $391M)
- Semantic contradictions (NLI entailment < 0.3)
- Ungrounded claims (low term overlap)

**Methodology note:**
Rule-based approach outperformed learned models in pilot study. Expanding to comprehensive benchmarks. Community contributions welcome.

---

## Performance Specifications

- **Embedding model**: 420MB download (cache on first run)
- **NLI model**: 500MB download (cache on first run)
- **Inference time**: 50ms fast mode, 300ms NLI mode (CPU)
- **Memory**: 2GB with both models loaded
- **Runtime**: Python 3.8+

---

## EU AI Act Compliance

CERT provides technical capabilities aligned with EU AI Act requirements for high-risk AI systems.

**Regulation:** EU 2024/1689 (August 1, 2024 entry into force; August 2, 2026 compliance deadline for high-risk systems)

### Relevant Requirements

**[Article 15: Accuracy, Robustness, Cybersecurity](https://artificialintelligenceact.eu/article/15/)**
- Systems must achieve "appropriate levels of accuracy" (Art. 15.1)
- Accuracy metrics must be "declared in accompanying instructions" (Art. 15.3)
- Systems must be "resilient regarding errors, faults or inconsistencies" (Art. 15.4)

**[Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)** / **[Article 19: Automatically Generated Logs](https://artificialintelligenceact.eu/article/19/)**
- "Automatic recording of events over the lifetime of the system" (Art. 12.1)
- Logs must enable "identifying situations that may result in risk" (Art. 12.2.a)
- Logs must "facilitate post-market monitoring" (Art. 12.2.b)
- Providers must retain logs for "at least six months" (Art. 19.1)

### How CERT Supports Compliance

**Error Detection (Article 15.1)**  
CERT's NLI contradiction detection and energy scoring provide systematic error detection. Creates audit trails supporting compliance documentation.

**Accuracy Documentation (Article 15.3)**  
TestRunner generates reportable metrics: contradiction rate, average energy, consistency score. These metrics support accuracy declarations required by the regulation.

**Audit Trails (Article 12 & 19)**  
Test results create timestamped records for system verification. Export results to your logging infrastructure for 6+ month compliance retention.

### Official Resources for Determining Obligations

- **[Compliance Checker](https://artificialintelligenceact.eu/assessment/eu-ai-act-compliance-checker/)** - 10-minute interactive tool to assess if your system is high-risk
- **[Article 15 Full Text](https://artificialintelligenceact.eu/article/15/)** - Accuracy, robustness, and cybersecurity requirements
- **[AI Act Explorer](https://artificialintelligenceact.eu/ai-act-explorer/)** - Searchable regulation text
- **[Implementation Timeline](https://artificialintelligenceact.eu/ai-act-implementation-next-steps/)** - Key dates and deadlines

### Important Disclaimers

**CERT is a technical testing tool, not a compliance solution.**

- Using CERT does not guarantee EU AI Act compliance
- Compliance requires organizational processes, documentation, and governance beyond technical testing
- High-risk classification depends on your specific use case; use the official Compliance Checker
- Seek professional legal advice for compliance strategy
- CERT supports compliance documentation but does not constitute legal compliance

---

## Development

### Run Tests

```bash
python -m pytest tests/
```

### Code Quality

```bash
ruff check cert/
ruff format cert/
```

---

## License

ISC License - see LICENSE file

---

## Citation

If you use CERT in research:

```bibtex
@software{cert_framework,
  author = {Marin, Javier},
  title = {CERT Framework: Context Entailment Reliability Testing for Production AI Systems},
  url = {https://github.com/Javihaus/cert-framework}
  version = {0.33.0}
  year = {2025}, 
}
```

In this bibtex entry, the version number is intended to be from cert/__init__.py, and the year corresponds to the project's open-source release.

---

## Contributing

- **Issues**: [GitHub Issues](https://github.com/Javihaus/cert-framework/issues)
- **Documentation**: See `examples/` for working examples
- **Contact**: info@cert-framework.com

CERT is under active development. Additional modules in development: agentic pipeline monitoring, advanced RAG systems for critical contexts, production observability dashboards.

## Contact

CERT is an ongoing and more ambitious project. Currently several modules are under development (agentic pipeline monitoring, advanced RAG sytems for critical contexts, etc.) You can contact me at info@cert-framework.com if you want a participate or need my service as a specialized consultant. 
