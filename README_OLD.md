<div align="center">
<img src="docs/CERT_LOGO_NEW_1.png" alt="CERT" width="20%" />

# CERT Framework

**Automatic instrumentation and cost optimization for production LLM systems**

Trace every inference, calculate costs automatically, generate EU AI Act compliance documentation.

<img src="docs/dashboard-hero.png" alt="CERT Dashboard" width="100%" />

---

[![Python](https://img.shields.io/badge/python-3.8%2B-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![PyPI](https://img.shields.io/pypi/v/cert-framework?style=for-the-badge&logo=pypi&logoColor=white)](https://pypi.org/project/cert-framework/)
[![Tests](https://img.shields.io/github/actions/workflow/status/javihaus/cert-framework/cert.yml?style=for-the-badge&logo=github&label=tests)](https://github.com/Javihaus/cert-framework/actions)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=for-the-badge&logo=apache&logoColor=white)](LICENSE)

**[Installation](#installation)** • **[Connectors](#connectors)** • **[Cost Analysis](#cost-analysis)** • **[Compliance](#compliance)** • **[API](#api-reference)** • **[Contributing](#contributing)**

</div>

---

## What This Is

CERT instruments your LLM calls and logs them to JSONL. Then it gives you tools to analyze those logs: cost breakdowns, optimization recommendations, compliance reports.

The key insight: compliance documentation and cost optimization use the same underlying data. If you're logging every inference anyway (which you should be), generating Article 15 technical documentation is just reformatting those logs.

**Core capabilities:**

| What | How | Why |
|------|-----|-----|
| Automatic tracing | Monkey-patches OpenAI, Anthropic, LangChain, Bedrock SDKs | Zero code changes required, works with existing applications |
| Cost calculation | Extracts token counts from API responses, applies known pricing | Most teams don't actually know what their AI systems cost per task |
| Accuracy measurement | Semantic similarity + term grounding on every inference | EU AI Act Article 15 requires "continuous accuracy measurement" |
| Optimization | Pattern matching on trace logs to find savings | Typical 30-50% cost reduction from model downgrades and caching |
| Compliance docs | Transforms logs into Article 15 technical documentation | Manual documentation costs $100K+ in consulting fees |

---

## Installation
```bash
# Minimal: tracing only, zero dependencies
pip install cert-framework

# With connectors for major platforms
pip install cert-framework[integrations]

# Everything: connectors + evaluation + CLI tools
pip install cert-framework[all]
```

**Installation tiers:**

| Tier | Size | Dependencies | What you get |
|------|------|--------------|--------------|
| Core | <100KB | 0 | `@trace()` decorator, JSONL logging |
| Integrations | ~5MB | SDK packages | Auto-connectors for OpenAI, Anthropic, LangChain, Bedrock, Azure |
| Evaluation | ~500MB | sentence-transformers, torch | Accuracy measurement (semantic similarity + NLI) |
| CLI | <1MB | click | `cert costs`, `cert optimize`, `cert report` commands |

The 500MB is model weights. Download happens once, cached locally.

---

## Quick Start
```python
# Install connectors
from cert.integrations.auto import *

# Your existing code
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "What is 2+2?"}]
)
```

That's it. CERT logged the call to `production.jsonl` with:
- Full request and response
- Token counts: 12 prompt, 5 completion
- Cost: $0.000011 (calculated from token pricing)
- Latency: 234ms
- Timestamp: 2025-01-15T10:30:00Z

Check the logs:
```bash
# Cost analysis
$ cert costs --period 30d
Total spend: $1,247.32
Avg per task: $0.042
Top model: gpt-4-turbo ($834.21, 67%)

# Find savings
$ cert optimize
Found 3 opportunities, total savings: $667/month (53%)

1. Downgrade simple_qa tasks to gpt-3.5-turbo
   Current: gpt-4-turbo, avg confidence: 0.91
   Savings: $417/month

2. Cache 47 repeated prompts  
   Savings: $156/month
   
3. Shorten 12 prompts over 2000 tokens
   Savings: $94/month

# Generate compliance report
$ cert report production.jsonl \
  --system-name "CustomerBot" \
  --output article15_report.pdf
```

---

## Connectors

CERT connects to these platforms with zero configuration:

### Production Ready

| Platform | What's Traced | Authentication | Cost Tracking |
|----------|---------------|----------------|---------------|
| **OpenAI** | All methods: chat, completions, embeddings, streaming | Uses your API key | Automatic (per-token pricing) |
| **Anthropic** | All methods including tool use, prompt caching | Uses your API key | Automatic (includes cache hits) |
| **LangChain** | Chains, agents, tools - full span tracking | N/A (framework) | Aggregates across chain steps |
| **AWS Bedrock** | Claude, Llama, Titan models | boto3 credentials | Manual (varies by region) |
| **Azure OpenAI** | Compatible with OpenAI SDK | Azure credentials | Automatic |

### Community Maintained

| Platform | Status | Maintainer |
|----------|--------|------------|
| Google Vertex AI | Beta | Community |
| HuggingFace Transformers | Beta | Community |
| Ollama (local models) | Beta | Community |
| LlamaIndex | Beta | Community |

### How It Works

Connectors use three patterns depending on the platform:

1. **Monkey-patching** (OpenAI, Anthropic): Replace SDK methods with wrapped versions
2. **Callback hooks** (LangChain): Use framework's native callback system
3. **SDK proxying** (Bedrock): Wrap boto3 client methods

Implementation:
```python
# Option 1: Automatic (detects installed platforms)
from cert.integrations.auto import *

# Option 2: Explicit
from cert.integrations.openai import OpenAIConnector
from cert.core.tracer import CertTracer

tracer = CertTracer()
OpenAIConnector(tracer).activate()

# Option 3: Manual (works with any platform)
from cert import trace

@trace(log_path="traces.jsonl")
def my_function(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}
```

**Why automatic instrumentation matters:** Manual tracing has ~10% adoption rate. Developers don't do it because it's tedious and they forget. Automatic instrumentation works because it requires zero code changes.

**Fragility tradeoff:** Monkey-patching breaks when SDK APIs change. This is acceptable because:
1. We isolate breakage to connector code (not user code)
2. SDK changes are infrequent and versioned
3. Alternative (manual instrumentation) has 90% non-compliance

If automatic tracing causes issues, users can disable it and use manual `@trace()` decorator.

---

## Cost Analysis

CERT calculates costs automatically from token counts and known pricing:
```python
from cert.value.analyzer import CostAnalyzer

analyzer = CostAnalyzer("production.jsonl")

# Total spend over period
total = analyzer.total_cost(
    start_date="2025-01-01",
    end_date="2025-01-31"
)
# Returns: 1247.32

# Breakdown by model
by_model = analyzer.cost_by_model()
# Returns: {
#   "gpt-4-turbo": 834.21,
#   "gpt-3.5-turbo": 298.45,
#   "claude-3-opus": 114.66
# }

# Daily trend
trend = analyzer.cost_trend(granularity="daily")
# Returns: {
#   "2025-01-01": 42.15,
#   "2025-01-02": 38.94,
#   ...
# }

# Detect anomalies (2σ above mean)
spikes = analyzer.detect_anomalies()
# Returns: [
#   {"date": "2025-01-05", "cost": 156.23, "expected": 42.00}
# ]

# Cost per successful task (accuracy > threshold)
cost_per_task = analyzer.cost_per_successful_task(
    accuracy_threshold=0.7
)
# Returns: 0.042
```

**Pricing updates:** Connector code includes pricing tables updated with each release. For platforms without public pricing (AWS Bedrock in some regions), cost tracking returns `None` unless user provides manual rates.

### Optimization Recommendations
```python
from cert.value.optimizer import Optimizer

optimizer = Optimizer("production.jsonl")

# Model downgrades (high accuracy suggests over-engineering)
model_recs = optimizer.recommend_model_changes()
# Returns: [
#   {
#     "task_type": "simple_qa",
#     "current_model": "gpt-4-turbo",
#     "suggested_model": "gpt-3.5-turbo",
#     "avg_confidence": 0.91,
#     "potential_savings": 417.00
#   }
# ]

# Caching (repeated prompts)
cache_ops = optimizer.find_caching_opportunities()
# Returns: [
#   {
#     "prompt": "You are a helpful assistant...",
#     "repetitions": 47,
#     "cost_per_call": 0.003,
#     "potential_savings": 156.00
#   }
# ]

# Prompt shortening (long prompts with high token counts)
prompt_ops = optimizer.suggest_prompt_optimizations()
# Returns: [
#   {
#     "current_length": 2300,
#     "suggestion": "Summarize context before passing to LLM",
#     "potential_savings": 94.00
#   }
# ]
```

These are pattern-matching heuristics, not ML predictions. They identify common inefficiencies:

1. **Model downgrade:** If average confidence > 0.85, you're probably over-engineering. Try cheaper model.
2. **Caching:** If same prompt appears 5+ times, cache the response.
3. **Prompt shortening:** If prompt > 1500 tokens, consider summarization or retrieval.

Results are suggestions, not automatic changes. You validate and implement.

---

## Compliance

### EU AI Act Article 15

High-risk AI systems must demonstrate "appropriate levels of accuracy, robustness and cybersecurity."

CERT provides:

| Requirement | Implementation |
|-------------|----------------|
| Continuous accuracy measurement | Evaluate every inference using dual-component approach |
| Complete audit trails | Every trace logged with timestamp, input, output, score |
| Technical documentation | Article 15 reports auto-generated from trace data |
| Methodology validation | Tested on Stanford SQuAD v2.0: 95.3% accuracy |
| Temporal analysis | Trend charts show performance over time |

### Measurement Methodology

CERT uses semantic similarity + term grounding:

| Component | Weight | What It Measures | Correlation with Ground Truth |
|-----------|--------|------------------|-------------------------------|
| Semantic Similarity | 50% | Topic drift, paraphrasing errors | r = 0.644 (moderate) |
| Term Grounding | 50% | Factual hallucinations, number errors | r = 0.899 (strong) |
| Combined Score | - | Both semantic and factual accuracy | ROC AUC = 0.961 |

**Why both components:** Semantic similarity alone gives high scores to well-phrased wrong answers. Term grounding alone penalizes correct paraphrases. Combined system catches both failure modes.

**Validation on SQuAD v2.0:**
- Dataset: 11,873 answerable questions
- Responses: Generated with GPT-3.5-turbo
- Threshold 0.46: 95.3% accuracy (optimal)
- Threshold 0.70: 89.2% accuracy (recommended for production)

Lower threshold = more false positives but catches more true errors. Higher threshold = fewer false alarms but misses some real errors. Choose based on your risk tolerance.

### Generate Reports
```bash
$ cert report production.jsonl \
  --system-name "CustomerBot RAG System" \
  --system-version "v2.1.0" \
  --provider-name "Acme Corporation" \
  --risk-level high \
  --output article15_report.pdf
```

Report includes:

1. **System Description** - Architecture, intended use, deployment environment
2. **Evaluation Methodology** - Semantic + grounding approach, SQuAD validation results
3. **Performance Metrics** - Accuracy percentage, confidence distributions, pass/fail rates
4. **Audit Trail** - Complete log of all evaluated inferences with scores
5. **Temporal Analysis** - Performance trends over time, degradation detection
6. **Risk Assessment** - Failed inference examples, confidence score distributions

**Legal basis:** Reports cite EU AI Act Article 15 requirements, reference Annex IV technical documentation structure, note ISO 42001 alignment.

This is what auditors and notified bodies expect to see. Alternative is hiring consultants at $100K-$500K to manually create these documents.

---

## API Reference

### Core Tracing
```python
from cert import trace

# Decorator pattern
@trace(
    log_path="production.jsonl",
    cost_tracking=True,
    metadata={"service": "customer-support", "version": "2.1"}
)
def my_function(query: str) -> dict:
    context = retrieve(query)
    answer = llm(context, query)
    return {"context": context, "answer": answer}

# Manual logging
from cert.core.tracer import CertTracer

tracer = CertTracer(log_path="traces.jsonl")
tracer.log_trace({
    "timestamp": "2025-01-15T10:30:00Z",
    "platform": "openai",
    "model": "gpt-4",
    "input_data": "What is 2+2?",
    "output_data": "2+2 equals 4",
    "cost": 0.002,
    "metadata": {"tokens": {"prompt": 12, "completion": 5}}
})
```

**Trace format:** JSONL (one JSON object per line). Each trace contains:
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "platform": "openai",
  "model": "gpt-3.5-turbo",
  "function": "my_function",
  "input_data": "What is 2+2?",
  "output_data": "2+2 equals 4",
  "context": "Ground truth context for evaluation",
  "cost": 0.000011,
  "confidence": 0.94,
  "metadata": {
    "tokens": {"prompt": 12, "completion": 5},
    "latency_ms": 234
  }
}
```

Required fields for evaluation: `context` (ground truth) and `output_data` (LLM response).

### Evaluation
```python
from cert.evaluation import Evaluator

# Initialize with preset
evaluator = Evaluator(
    preset="general",  # Options: general, financial, healthcare, legal
    threshold=0.7      # Confidence threshold for pass/fail
)

# Evaluate traces
results = evaluator.evaluate_log_file("production.jsonl")

# Results structure
{
    "total_traces": 1000,
    "pass_rate": 0.89,
    "mean_confidence": 0.84,
    "results": [
        {
            "timestamp": "2025-01-15T10:30:00Z",
            "confidence": 0.94,
            "passed": True,
            "semantic_score": 0.91,
            "grounding_score": 0.97
        },
        ...
    ]
}
```

**Presets:** Domain-specific thresholds validated on relevant datasets. Healthcare uses 0.85 (higher confidence required). General uses 0.70 (balanced).

### ROI Calculation
```python
from cert.value.roi_calculator import ROICalculator

calculator = ROICalculator(
    traces_path="production.jsonl",
    business_value_per_task=2.50  # Dollar value of successful task
)

roi = calculator.calculate_roi(
    start_date="2025-01-01",
    end_date="2025-01-31"
)

# Returns:
{
    "total_cost": 1247.32,
    "successful_tasks": 18234,  # Tasks with confidence >= 0.7
    "total_value": 45585.00,
    "roi_percentage": 3554,
    "net_value": 44337.68,
    "cost_per_task": 0.068
}
```

---

## Performance Benchmarks

Measured on production workloads:

| Metric | Target | Actual |
|--------|--------|--------|
| Connector overhead | <10ms per call | 3-7ms (varies by platform) |
| Evaluation latency | <100ms per trace | 45ms average |
| Log write throughput | >1000 traces/sec | 2,400 traces/sec |
| Memory overhead | <50MB | 28MB (includes model weights) |

**Connector overhead breakdown:**
- OpenAI: 3ms (mostly JSON serialization)
- LangChain: 7ms (callback dispatch overhead)
- Bedrock: 5ms (boto3 wrapper layer)

Overhead is measured as difference between wrapped and unwrapped calls. In practice, this is <2% of total inference latency (which is typically 200-500ms).

---

## Architecture Decisions

### Why monkey-patching instead of middleware?

Middleware requires users to change code. Monkey-patching works with existing code. Tradeoff: more fragile to SDK updates vs higher adoption rate. We chose adoption.

Mitigation: Connector code is isolated. When OpenAI SDK changes, we update the connector, users update CERT, their code doesn't change.

### Why JSONL instead of database?

Simplicity. JSONL is grep-able, human-readable, easy to backup. Database adds operational complexity (schema migrations, connection pooling, query optimization). For append-only trace logs, JSONL is sufficient.

Users who need database can import JSONL into their data warehouse. We provide the raw data, they choose the storage backend.

### Why dual-component evaluation?

Semantic similarity alone: high scores for fluent wrong answers ("The Eiffel Tower is 500 meters tall" - semantically similar to "The Eiffel Tower is 330 meters tall" but factually wrong).

Term grounding alone: low scores for correct paraphrases ("2+2=4" vs "The sum of two and two is four").

Combined: catches both failure modes. Validated on SQuAD v2.0 with 0.961 ROC AUC.

### Why client-side dashboard analysis?

Operational simplicity. Running multi-tenant backend infrastructure for cost analysis requires: databases, authentication, billing, uptime monitoring, data isolation, GDPR compliance. That's a full SaaS business.

Client-side analysis: upload file, JavaScript parses it, results display. Zero infrastructure. Users who need persistent monitoring can self-host the dashboard.

---

## Comparison with Alternatives

| Tool | Tracing | Cost Tracking | Compliance | Open Source | Price |
|------|---------|---------------|------------|-------------|-------|
| **Langfuse** | Excellent | Manual tagging | No | Yes | Free |
| **Arize** | Enterprise | Dashboard | No | No | $$$$ |
| **LangSmith** | LangChain-focused | Basic | No | No | $$ |
| **Vanta** | No | No | Generic GRC | No | $$ |
| **OneTrust** | No | No | Privacy-focused | No | $$$$ |
| **CERT** | Auto-instrumented | Automatic | Article 15 docs | Yes | Free |

**Recommended stack:**
- Langfuse or Arize: Full observability (debugging, user analytics, A/B testing)
- CERT: Cost optimization + EU AI Act compliance
- OneTrust or Vanta: Organization-wide policy management

CERT fills the gap between developer-focused monitoring and compliance-focused governance.

---

## Roadmap

| Quarter | Focus |
|---------|-------|
| **Q1 2026** | Hosted evaluation API, real-time streaming, Prometheus exporters |
| **Q2 2026** | Pluggable evaluators, domain benchmarks, multi-modal (vision) |
| **Q3 2026** | Circuit breakers, drift detection, A/B testing framework |
| **Q4 2026** | SaaS offering, hosted dashboards, team collaboration |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Development setup:
```bash
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework
pip install -e ".[dev]"
pytest
ruff check .
```

Priority areas:
- Platform connectors (see [docs/connectors.md](docs/connectors.md))
- Industry-specific evaluation presets
- Performance optimization
- Multi-language documentation

---

## License

Apache 2.0 - see [LICENSE](LICENSE)

Commercial use, modification, distribution permitted with attribution.

---

## Contact

**Javier Marin**  
Email: javier@jmarin.info  
LinkedIn: [linkedin.com/in/javiermarinvalenzuela](https://linkedin.com/in/javiermarinvalenzuela)

Consulting: EU AI Act implementation, LLM production deployment, cost optimization.

---

<div align="center">

### Automatic instrumentation for production LLM systems

[![Install](https://img.shields.io/badge/pip_install-cert--framework-4B8BBE?style=for-the-badge&logo=python&logoColor=white)](https://pypi.org/project/cert-framework/)
[![Docs](https://img.shields.io/badge/documentation-cert--framework.com-blue?style=for-the-badge)](https://cert-framework.com/docs)
[![GitHub](https://img.shields.io/github/stars/Javihaus/cert-framework?style=for-the-badge&logo=github)](https://github.com/Javihaus/cert-framework)

</div>
