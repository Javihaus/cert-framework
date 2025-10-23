# CERT Framework

<div align="center">
  <img src="docs/CERT.png" alt="" width="800">
</div>

\
[**What CERT Solves**](#what-cert-solves)
| [**Three Core Capabilities**](#three-core-capabilities)
| [**Quick Start**](#quick-start)
| [**Installation**](#installation)
| [**Single Model Testing**](#single-model-testing)
| [**RAG Systems**](#rag-systems)
| [**Agent Pipelines**](#agent-pipelines)
| [**Configuration**](#configuration)
| [**Validation**](#validation)
| [**EU AI Act Compliance**](#eu-ai-act-compliance)
| [**Citation**](#citation)
| [**Contributing**](#contributing)

CERT is a production-grade AI system reliability testing framework for LLM applications and model evaluation.

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## What CERT Solves

CERT addresses critical friction in AI systems deployment that lacks standardized tools:

**Problem 1: AI Systems Hallucinate and You Can't Measure It**

Your LLM generates text that contradicts source material. You can't measure hallucination rate systematically. Auditors want evidence. Compliance officers want metrics. CERT detects hallucinations through proven methods from regulated industries (financial, medical, legal): Natural Language Inference contradiction detection combined with semantic grounding verification.

**Problem 2: Model Selection Without Data**

You need to choose between Claude, GPT-4, Gemini or any SOTA model for production. Vendor benchmarks don't measure your actual use case. You run a few manual tests, results vary randomly, you make a guess. CERT provides statistical rigor—consistency metrics, latency percentiles (P95/P99), output diversity analysis—so your decision is data-driven, not intuition-driven.

**Problem 3: No Systematic Testing Framework**

Individual model outputs vary. RAG systems hallucinate. Multi-agent pipelines behave unpredictably. CERT provides a unified framework to test all three systematically with production-grade reliability metrics.

---

## Three Core Capabilities

CERT is organized around three fundamental AI system testing needs:

### 1. Single Model Testing
Test individual LLM outputs for consistency, semantic matching, and response quality. Ideal for chatbots, content generation, and model evaluation.

**Key Features:**
- Output consistency measurement across multiple trials
- Semantic comparison with configurable rules
- LLM-as-judge evaluation (optional)
- Statistical variance analysis

**Use Cases:**
- Chatbot response consistency testing
- Model version regression testing
- A/B testing between model providers
- Unit testing for LLM applications

### 2. RAG Systems
Detect hallucinations and verify context grounding in retrieval-augmented generation systems.

**Key Features:**
- Natural Language Inference (NLI) contradiction detection
- Semantic embedding similarity analysis
- Context grounding verification
- Energy-based confidence scoring
- Fast mode (50ms) and NLI mode (300ms)

**Use Cases:**
- RAG systems in compliance-sensitive domains (finance, healthcare, legal)
- Accuracy claims validation for EU AI Act compliance
- CI/CD quality gates for content pipelines
- Pre-deployment verification

### 3. Agent Pipelines
Systematically assess multi-agent systems and compare LLM providers across operational metrics.

**Key Features:**
- Multi-provider comparison (Anthropic, OpenAI, Google, xAI, HuggingFace)
- Consistency, latency, output quality, robustness metrics
- Statistical significance testing (20+ trials)
- Framework integration (LangChain, AutoGen, CrewAI)

**Use Cases:**
- Model selection before production commitment
- Performance regression testing after updates
- Cost-performance optimization
- Compliance audit documentation

---

## Quick Start

### Basic Example: Semantic Comparison

```python
from cert import compare

# Compare two texts for semantic similarity
result = compare("revenue increased", "sales grew")

if result.matched:
    print(f"Texts match! Confidence: {result.confidence:.1%}")
else:
    print(f"No match. Rule: {result.rule}")

# Output:
# Texts match! Confidence: 95.0%
```

### RAG Hallucination Detection

```python
from cert import compare

# Context from your knowledge base
context = "Apple's Q4 2024 revenue was $391.035 billion"

# LLM-generated answer
answer = "Apple's Q4 2024 revenue was $450 billion"

# Check for hallucinations using NLI mode
result = compare(context, answer, use_nli=True)

if not result.matched:
    print(f"Hallucination detected!")
    print(f"Rule: {result.rule}")
    print(f"Explanation: {result.explanation}")

# Output:
# Hallucination detected!
# Rule: numeric-contradiction
# Explanation: Values $391.035B and $450B contradict
```

### Single Model Consistency Testing

```python
from cert.single_model import measure_consistency
from cert.utilities.types import TestConfig
import asyncio

# Define your LLM function
async def my_llm_call():
    # Your LLM API call here
    response = await my_api.generate("What is 2+2?")
    return response

# Measure consistency across 20 trials
config = TestConfig(n_trials=20, timeout=5000)
result = asyncio.run(measure_consistency(my_llm_call, config))

print(f"Unique outputs: {result.n_unique}")
print(f"Most common: {result.most_common_output}")
print(f"Frequency: {result.most_common_frequency:.1%}")

# Output:
# Unique outputs: 3
# Most common: "2+2 equals 4"
# Frequency: 85.0%
```

### Agent Pipeline Assessment

```python
from cert.agents import AssessmentConfig, CERTAgentEngine
from cert.agents.providers import AnthropicProvider, OpenAIProvider
import asyncio

# Configure assessment
config = AssessmentConfig(
    consistency_trials=20,
    performance_trials=15,
    providers={
        'anthropic': ['claude-3-5-haiku-20241022'],
        'openai': ['gpt-4o-mini'],
    }
)

# Initialize providers
providers = {
    'anthropic': AnthropicProvider(api_key='your-key'),
    'openai': OpenAIProvider(api_key='your-key'),
}

# Run assessment
engine = CERTAgentEngine(config, providers)
summary = asyncio.run(engine.run_full_assessment())

# View results
for result in summary.consistency_results:
    print(f"{result.provider}/{result.model}: {result.consistency_score:.3f}")

# Output:
# anthropic/claude-3-5-haiku-20241022: 0.892
# openai/gpt-4o-mini: 0.847
```

---

## Installation

### From PyPI (Recommended)

```bash
pip install cert-framework
```

### From Source

```bash
# Clone repository
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework

# Install all dependencies
pip install -r requirements.txt

# OR install package in editable mode
pip install -e .
```

### Requirements

- Python 3.8 or higher
- ~2GB RAM (embedding + NLI models loaded)
- First run downloads models (~920MB total); subsequent runs use cache

### Dependencies Included

**Standard Installation (`pip install cert-framework`):**

Everything you need for all three capabilities.

**Optional Extras for Non-Core Features:**

- **[dev]**: Development tools (pytest, ruff, mypy, datasets, pandas, rapidfuzz)
- **[inspector]**: Web dashboard UI (flask, jinja2)
- **[notebook]**: Jupyter notebook support (ipython, ipywidgets)


### Model Downloads

On first run, CERT automatically downloads pre-trained models:
- Embeddings: sentence-transformers/all-mpnet-base-v2 (~420MB)
- NLI: microsoft/deberta-v3-base (~500MB)

Models are cached locally for subsequent runs.

---

## Single Model Testing

The `cert.single_model` module provides tools for testing individual language model outputs.

### Core Functions

#### `measure_consistency()`

Measures output consistency across multiple trials.

**Parameters:**
- `fn` (Callable): Async function to test (your LLM call)
- `config` (TestConfig): Configuration with n_trials, timeout

**Returns:**
- `ConsistencyResult`: Contains n_unique, most_common_output, frequency, all_outputs

**Example:**

```python
from cert.single_model import measure_consistency
from cert.utilities.types import TestConfig
import asyncio

async def chatbot_response():
    return await my_llm.chat("What's the capital of France?")

config = TestConfig(n_trials=20, timeout=5000)
result = asyncio.run(measure_consistency(chatbot_response, config))

print(f"Consistency: {result.most_common_frequency:.1%}")
```

#### `autodiagnose_variance()`

Analyzes output variance and provides diagnostic recommendations.

**Parameters:**
- `outputs` (List[Any]): List of outputs to analyze

**Returns:**
- `diagnosis` (str): Diagnosis category (consistent, acceptable_variance, high_variance, extreme_variance)
- `suggestions` (List[str]): Actionable recommendations

**Example:**

```python
from cert.single_model import autodiagnose_variance

outputs = ["Paris", "Paris", "Paris, France", "The capital is Paris"]
diagnosis, suggestions = autodiagnose_variance(outputs)

print(f"Diagnosis: {diagnosis}")
for suggestion in suggestions:
    print(f"- {suggestion}")
```

### IntelligentComparator

Automatically detects input types and applies appropriate comparison strategies.

**Input Types Detected:**
- Numeric values
- JSON objects
- Lists
- Plain text
- Code blocks

**Methods:**
- `compare(expected, actual)`: Compare two outputs with type detection

**Example:**

```python
from cert.single_model import IntelligentComparator

comparator = IntelligentComparator()

# Automatically handles different types
result1 = comparator.compare("42", "42.0")  # Numeric comparison
result2 = comparator.compare('{"a": 1}', '{"a": 1}')  # JSON comparison
result3 = comparator.compare("hello", "Hello")  # Text comparison

print(f"Match: {result1.matched}, Rule: {result1.rule}")
```

### LLMJudgeComparator

Uses an LLM (Claude) to judge semantic equivalence between outputs.

**Parameters:**
- `api_key` (str): Anthropic API key
- `model` (str): Claude model to use

**Example:**

```python
from cert.single_model import LLMJudgeComparator

judge = LLMJudgeComparator(api_key="your-key")

result = judge.compare(
    expected="The stock price increased",
    actual="Equity value rose"
)

print(f"Equivalent: {result.matched}")
print(f"Reasoning: {result.explanation}")
```

### Use Cases

**1. Chatbot Consistency Testing**

```python
# Test chatbot gives consistent answers
async def ask_chatbot():
    return await chatbot.ask("What are your business hours?")

result = asyncio.run(measure_consistency(ask_chatbot, TestConfig(n_trials=10)))

if result.most_common_frequency < 0.8:
    print("Warning: Chatbot responses are inconsistent!")
```

**2. Model Version Regression Testing**

```python
# Compare outputs before/after model update
comparator = IntelligentComparator()

old_output = "Previous model response"
new_output = "New model response"

result = comparator.compare(old_output, new_output)

if not result.matched:
    print(f"Regression detected! Confidence: {result.confidence:.1%}")
```

**3. A/B Testing Between Providers**

```python
# Test two models on same prompt
async def test_model_a():
    return await model_a.generate(prompt)

async def test_model_b():
    return await model_b.generate(prompt)

result_a = asyncio.run(measure_consistency(test_model_a, config))
result_b = asyncio.run(measure_consistency(test_model_b, config))

print(f"Model A consistency: {result_a.most_common_frequency:.1%}")
print(f"Model B consistency: {result_b.most_common_frequency:.1%}")
```

---

## RAG Systems

The `cert.rag` module provides hallucination detection and context grounding verification for retrieval-augmented generation systems.

### Core Functions

#### `compare()` with NLI Mode

Main entry point for RAG hallucination detection.

**Parameters:**
- `context` (str): Source context from knowledge base
- `answer` (str): LLM-generated answer
- `use_nli` (bool): Enable NLI contradiction detection (default: False)
- `threshold` (float): Confidence threshold (default: 0.7)

**Returns:**
- `ComparisonResult`: Contains matched, confidence, rule, explanation

**Modes:**
- Fast mode (use_nli=False): ~50ms, embedding + grounding heuristics
- NLI mode (use_nli=True): ~300ms, adds transformer-based contradiction detection

**Example:**

```python
from cert import compare

context = "Our product costs $99 per month"
answer = "The monthly price is $199"

result = compare(context, answer, use_nli=True)

if not result.matched:
    print(f"Hallucination: {result.rule}")
    print(f"Confidence: {result.confidence:.1%}")
    print(f"Explanation: {result.explanation}")
```

### SemanticComparator

Rule-based semantic comparison with configurable matching strategies.

**Comparison Rules:**
- IDENTICAL: Exact string match
- NUMERIC_MATCH: Numeric values match
- SEMANTIC_MATCH: High embedding similarity
- CONTAINS: One string contains the other
- WORD_OVERLAP: Significant word overlap
- NO_MATCH: No match found

**Example:**

```python
from cert.rag import SemanticComparator

comparator = SemanticComparator()

result = comparator.compare(
    expected="The company has 500 employees",
    actual="The organization employs 500 people"
)

print(f"Rule: {result.rule}")  # SEMANTIC_MATCH
print(f"Confidence: {result.confidence:.1%}")
```

### EmbeddingComparator

Embedding-based semantic similarity with cosine distance.

**Parameters:**
- `model_name` (str): Sentence transformer model (default: all-mpnet-base-v2)
- `threshold` (float): Similarity threshold (default: 0.7)

**Example:**

```python
from cert.rag import EmbeddingComparator

comparator = EmbeddingComparator()

result = comparator.compare(
    "Machine learning is a subset of AI",
    "ML is part of artificial intelligence"
)

print(f"Similarity: {result.confidence:.1%}")
```

### NLIDetector

Natural Language Inference contradiction detection using DeBERTa.

**Parameters:**
- `model_name` (str): NLI model (default: microsoft/deberta-v3-base)
- `threshold` (float): Entailment threshold (default: 0.3)

**Example:**

```python
from cert.rag import NLIDetector

detector = NLIDetector()

result = detector.check_entailment(
    context="Apple's revenue was $391B",
    answer="Apple's revenue was $450B"
)

if result.label == "contradiction":
    print(f"Contradiction detected!")
    print(f"Entailment score: {result.entailment_score:.3f}")
```

### ProductionEnergyScorer

Combines NLI, embeddings, and grounding heuristics into unified confidence metric.

**Energy Scoring Formula:**
```
E(context, answer) = 1 - (α·s_semantic + β·s_nli + γ·s_grounding)
```

Where:
- `s_semantic`: Embedding cosine similarity (0-1)
- `s_nli`: NLI entailment score (0-1)
- `s_grounding`: Term overlap ratio (0-1)
- `α, β, γ`: Weights (default: 0.25, 0.55, 0.20)

**Interpretation:**
- E ≈ 0: Well-grounded, supported by context
- E ≈ 1: Contradicts or unsupported by context

**Example:**

```python
from cert.rag import ProductionEnergyScorer, EmbeddingComparator, NLIDetector

embeddings = EmbeddingComparator()
nli = NLIDetector()

scorer = ProductionEnergyScorer(
    embeddings=embeddings,
    nli=nli,
    weights={'semantic': 0.3, 'nli': 0.5, 'grounding': 0.2}
)

energy = scorer.compute_energy(
    context="Product X costs $100",
    answer="Product X costs $200"
)

print(f"Energy: {energy:.3f}")  # Higher = more likely hallucination
```

### Configuration

**Energy Threshold Tuning:**

Recommended thresholds by risk level:
- High-stakes (financial, medical, legal): 0.3
- Standard RAG applications: 0.4
- Low-stakes (recommendations): 0.5

```python
from cert import configure

# Set global threshold
configure(energy_threshold=0.3, use_nli=True)

# Now all compare() calls use these settings
result = compare(context, answer)
```

### Use Cases

**1. Financial RAG Validation**

```python
context = "Q4 revenue: $391.035B (10-K filing, page 23)"
answer = rag_system.answer("What was Q4 revenue?")

result = compare(context, answer, use_nli=True)

if not result.matched:
    # Log for audit trail
    audit_log.warning(f"Hallucination: {result.explanation}")
    # Return context directly instead
    return context
```

**2. CI/CD Quality Gate**

```python
def test_rag_accuracy():
    test_cases = load_test_cases()

    failures = []
    for context, expected in test_cases:
        actual = rag_system.generate(context)
        result = compare(expected, actual, use_nli=True)

        if not result.matched:
            failures.append((context, expected, actual, result))

    assert len(failures) == 0, f"{len(failures)} hallucinations detected"
```

**3. Real-time Hallucination Detection**

```python
def safe_rag_generate(query, context):
    answer = rag_pipeline.generate(query, context)

    # Check for hallucinations
    result = compare(context, answer, use_nli=True)

    if not result.matched and result.confidence < 0.5:
        # High confidence hallucination - return source
        return {"answer": context, "warning": "Direct source returned"}

    return {"answer": answer, "confidence": result.confidence}
```

The energy core have been tested with manually-annotated RAG examples in complex contexts (finance, healthcare, legal), reaching an average accuracy precission 90%+. 
- 90%+ NLI accuracy (microsoft/deberta-v3-base on MNLI dataset)
- 87.6% STS-Benchmark correlation (sentence-transformers/all-mpnet-base-v2)

**What CERT Detects:**
- Numeric contradictions ($391B vs $450B)
- Unit errors ($391B vs $391M)
- Semantic contradictions (NLI entailment < 0.3)
- Ungrounded claims (low term overlap)

---

## Agent Pipelines

The `cert.agents` module provides systematic assessment of multi-agent systems and LLM provider comparison.

### Core Components

#### AssessmentConfig

Configuration for agent pipeline assessment.

**Key Parameters:**
- `consistency_trials` (int): Number of trials for consistency testing (default: 20, min: 10)
- `performance_trials` (int): Number of trials for performance testing (default: 15, min: 5)
- `providers` (Dict[str, List[str]]): Provider names mapped to model IDs
- `temperature` (float): Sampling temperature (default: 0.7, range: 0.0-1.0)
- `max_tokens` (int): Maximum tokens per response (default: 1024)
- `timeout` (int): Request timeout in seconds (default: 30)
- `enabled_metrics` (List[str]): Metrics to run (default: all core metrics)

**Example:**

```python
from cert.agents import AssessmentConfig

config = AssessmentConfig(
    consistency_trials=20,
    performance_trials=15,
    temperature=0.7,
    providers={
        'anthropic': ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
        'openai': ['gpt-4o-mini', 'gpt-4o'],
        'google': ['gemini-2.0-flash-exp'],
        'xai': ['grok-2-latest'],
    },
    enabled_metrics=[
        'consistency',
        'performance',
        'latency',
        'output_quality',
        'robustness',
    ]
)
```

#### CERTAgentEngine

Main orchestration engine for running assessments.

**Parameters:**
- `config` (AssessmentConfig): Assessment configuration
- `providers` (Dict[str, ProviderInterface]): Provider instances

**Methods:**
- `run_full_assessment()`: Run complete assessment suite
- Returns `AssessmentSummary` with all results

**Example:**

```python
from cert.agents import CERTAgentEngine
from cert.agents.providers import AnthropicProvider, OpenAIProvider
import asyncio

providers = {
    'anthropic': AnthropicProvider(api_key='sk-ant-...'),
    'openai': OpenAIProvider(api_key='sk-...'),
}

engine = CERTAgentEngine(config, providers)
summary = asyncio.run(engine.run_full_assessment())

# Access results
print(f"Total models tested: {len(summary.consistency_results)}")
```

### Supported Providers

#### AnthropicProvider

**Models:**
- claude-3-5-sonnet-20241022
- claude-3-5-haiku-20241022
- claude-3-opus-20240229

```python
from cert.agents.providers import AnthropicProvider

provider = AnthropicProvider(api_key='sk-ant-...')
```

#### OpenAIProvider

```python
from cert.agents.providers import OpenAIProvider

provider = OpenAIProvider(api_key='sk-...')
```

#### GoogleProvider

```python
from cert.agents.providers import GoogleProvider

provider = GoogleProvider(api_key='...')
```

#### XAIProvider


```python
from cert.agents.providers import XAIProvider

provider = XAIProvider(api_key='...')
```

#### HuggingFaceProvider

**Models:** Any HuggingFace Inference API model

```python
from cert.agents.providers import HuggingFaceProvider

provider = HuggingFaceProvider(api_key='hf_...')
```

### Metrics

#### Consistency Metric

Measures output stability across identical prompts.

**Measurements:**
- Consistency score (0-1): Based on semantic embedding similarity
- Unique output count
- Most common output frequency

**Interpretation:**
- Score > 0.85: Highly consistent
- Score 0.70-0.85: Acceptable variance
- Score < 0.70: High variance (problematic)

#### Performance Metric

Measures output quality across diverse prompts.

**Measurements:**
- Average semantic coherence
- Response completeness
- Task completion rate

#### Latency Metric

Measures response time characteristics.

**Measurements:**
- Mean, median latency
- P95, P99 percentiles
- Standard deviation
- Coefficient of variation

**Use:** Identify models with unpredictable response times.

#### Output Quality Metric

Measures output characteristics.

**Measurements:**
- Average length
- Length variance
- Repetition patterns
- Semantic diversity

**Use:** Detect models stuck in loops or generating low-quality outputs.

#### Robustness Metric

Measures error handling and reliability.

**Measurements:**
- Error rate
- Timeout frequency
- Exception types
- Recovery success rate

**Use:** Identify models with poor production reliability.

### Framework Integrations

#### LangChain Integration

```python
from cert.agents.integrations.langchain import wrap_chain, CertChainWrapper
from langchain.chains import LLMChain

# Wrap your LangChain chain
chain = LLMChain(llm=my_llm, prompt=my_prompt)
wrapped_chain = wrap_chain(chain, config=test_config)

# Run with automatic monitoring
result = wrapped_chain.run(input_text)

# Access CERT metrics
print(f"Consistency: {wrapped_chain.cert_results['consistency']}")
```

#### AutoGen Integration

```python
from cert.agents.integrations.autogen import CertAutoGenWrapper
from autogen import AssistantAgent

# Wrap your AutoGen agent
agent = AssistantAgent(name="assistant", llm_config=config)
wrapped_agent = CertAutoGenWrapper(agent, cert_config=test_config)

# Use normally - CERT monitors in background
response = wrapped_agent.generate_reply(messages)
```

#### CrewAI Integration

```python
from cert.agents.integrations.crewai import CertCrewWrapper
from crewai import Crew, Agent, Task

# Wrap your Crew
crew = Crew(agents=[agent1, agent2], tasks=[task1, task2])
wrapped_crew = CertCrewWrapper(crew, cert_config=test_config)

# Run with monitoring
result = wrapped_crew.kickoff()

# Access metrics
print(wrapped_crew.get_cert_summary())
```

### Use Cases

**1. Model Selection for Production**

```python
# Compare 4 models before committing to production
config = AssessmentConfig(
    consistency_trials=20,
    performance_trials=15,
    providers={
        'anthropic': ['claude-3-5-haiku-20241022'],
        'openai': ['gpt-4o-mini'],
        'google': ['gemini-2.0-flash-exp'],
        'xai': ['grok-2-latest'],
    }
)

engine = CERTAgentEngine(config, providers)
summary = asyncio.run(engine.run_full_assessment())

# Rank by consistency and latency
for result in sorted(summary.consistency_results,
                     key=lambda x: x.consistency_score,
                     reverse=True):
    print(f"{result.model}: {result.consistency_score:.3f}")
```

**2. Performance Regression Testing**

```python
# Test before and after model update
config = AssessmentConfig(
    providers={
        'anthropic': ['claude-3-5-haiku-20241022'],  # New version
    }
)

# Compare against baseline
baseline = load_baseline_results('claude-3-5-haiku-previous')
current = asyncio.run(engine.run_full_assessment())

if current.consistency_results[0].consistency_score < baseline.consistency_score * 0.95:
    raise RegressionError("Consistency degraded by >5%")
```

**3. Cost-Performance Optimization**

```python
# Test expensive vs cheap models
config = AssessmentConfig(
    providers={
        'anthropic': ['claude-3-5-sonnet-20241022'],  # Expensive
        'openai': ['gpt-4o-mini'],  # Cheap
    }
)

summary = asyncio.run(engine.run_full_assessment())

# Calculate cost per 1M tokens
costs = {'sonnet': 3.00, 'gpt-4o-mini': 0.15}

for result in summary.consistency_results:
    quality_score = result.consistency_score
    cost = costs.get(result.model.split('-')[0])

    print(f"{result.model}: ${cost:.2f}/1M tokens, quality: {quality_score:.3f}")
    print(f"Value score: {quality_score / cost:.2f}")
```

### Statistical Rigor

All metrics include:
- Confidence intervals (95%)
- Cohen's d effect sizes for comparisons
- Statistical significance testing
- Minimum sample sizes enforced (consistency: 10, performance: 5)

Results are defensible for compliance documentation and technical audits.

---

## Configuration

### Global Configuration

```python
from cert import configure

# Set global defaults for all compare() calls
configure(
    use_nli=True,
    energy_threshold=0.3,
    embedding_model='all-mpnet-base-v2'
)
```

### TestConfig (Single Model)

```python
from cert.utilities.types import TestConfig

config = TestConfig(
    n_trials=20,        # Number of test trials
    timeout=5000,       # Timeout in milliseconds
    max_retries=3,      # Retry on failure
)
```

### AssessmentConfig (Agents)

```python
from cert.agents import AssessmentConfig

config = AssessmentConfig(
    consistency_trials=20,
    performance_trials=15,
    temperature=0.7,
    max_tokens=1024,
    timeout=30,
    enabled_metrics=['consistency', 'latency', 'robustness'],
)
```

### Custom Energy Weights (RAG)

```python
from cert.rag import ProductionEnergyScorer

scorer = ProductionEnergyScorer(
    embeddings=embeddings,
    nli=nli,
    weights={
        'semantic': 0.3,   # Embedding similarity weight
        'nli': 0.5,        # NLI entailment weight
        'grounding': 0.2   # Term overlap weight
    }
)
```

---

## Validation

CERT development included comparative testing of rule-based vs. learned approaches across regulated domains.

### Validation Datasets

- 500 manually-annotated RAG examples (financial institutions)
- 50 examples from EU Regulation 2024/1689 (AI Act regulation text)
- 90%+ MNLI accuracy (microsoft/deberta-v3-base)
- 87.6% STS-Benchmark correlation (sentence-transformers/all-mpnet-base-v2)

### Performance Specifications

- Embedding model: 420MB download (cached)
- NLI model: 500MB download (cached)
- Inference time: 50ms fast mode, 300ms NLI mode (CPU)
- Memory: 2GB with both models loaded
- Runtime: Python 3.8+

### Methodology

Rule-based approach outperformed learned models in pilot study. Expanding to comprehensive benchmarks. Community contributions welcome.

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
TestRunner and CERTAgentEngine generate reportable metrics: contradiction rate, consistency score, latency profiles. These metrics support accuracy declarations required by the regulation.

**Audit Trails (Article 12 & 19)**
Test results create timestamped records for system verification. Export results to your logging infrastructure for 6+ month compliance retention.

### Official Resources

- [Compliance Checker](https://artificialintelligenceact.eu/assessment/eu-ai-act-compliance-checker/) - 10-minute interactive tool
- [Article 15 Full Text](https://artificialintelligenceact.eu/article/15/) - Accuracy requirements
- [AI Act Explorer](https://artificialintelligenceact.eu/ai-act-explorer/) - Searchable regulation
- [Implementation Timeline](https://artificialintelligenceact.eu/ai-act-implementation-next-steps/) - Key dates

### Important Disclaimers

**CERT is a technical testing tool, not a compliance solution.**

- Using CERT does not guarantee EU AI Act compliance
- Compliance requires organizational processes, documentation, and governance beyond technical testing
- High-risk classification depends on your specific use case
- Seek professional legal advice for compliance strategy
- CERT supports compliance documentation but does not constitute legal compliance

---

## Examples

Complete working examples in `examples/` directory:

**Single Model Testing:**
- `single_model/llm_response_consistency.py` - Chatbot consistency testing
- `single_model/model_matching.py` - Model version regression testing
- `single_model/pytest_integration.py` - Pytest integration patterns
- `single_model/real_llm_testing.py` - Cross-provider LLM testing

**RAG Systems:**
- `rag/rag_retrieval.py` - RAG retrieval consistency testing
- `rag/rag_hallucination_detection.py` - Hallucination detection with NLI

**Agent Pipelines:**
- `agents/assess_llm_providers.py` - Multi-provider assessment

Run examples:
```bash
python examples/rag/rag_hallucination_detection.py
python examples/single_model/llm_response_consistency.py --nli
python examples/agents/assess_llm_providers.py
```

---

## Development

### Run Tests

```bash
python -m pytest tests/ -v
```

### Code Quality

```bash
ruff check cert/
ruff format cert/
```

### Contributing

- Issues: [GitHub Issues](https://github.com/Javihaus/cert-framework/issues)
- Documentation: See `examples/` for working examples
- Contact: info@cert-framework.com

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
  url = {https://github.com/Javihaus/cert-framework},
  version = {1.1.0},
  year = {2025}
}
```

---

## Contact

CERT is under active development. Additional modules in development: agentic pipeline monitoring, advanced RAG systems for critical contexts, production observability dashboards.

For inquiries, collaboration, or consulting services: info@cert-framework.com
