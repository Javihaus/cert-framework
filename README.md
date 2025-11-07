<div align="center">
<img src="docs/CERT_LOGO_NEW_1.png" alt="Logo" width="20%" />

# CERT Framework

### EU AI Act Article 15 Compliance from Production LLM Traces

<img src="docs/dashboard-hero.png" alt="CERT Dashboard" width="100%" />

---

[![PyPI](https://img.shields.io/pypi/v/cert-framework?color=4B8BBE&logo=python&logoColor=white)](https://pypi.org/project/cert-framework/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?logo=apache&logoColor=white)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue?logo=python&logoColor=white)](https://www.python.org)
[![Tests](https://img.shields.io/badge/tests-passing-success?logo=pytest&logoColor=white)](https://github.com/Javihaus/cert-framework/actions)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-000000.svg?logo=ruff&logoColor=white)](https://github.com/astral-sh/ruff)
[![Downloads](https://img.shields.io/pypi/dm/cert-framework?color=blue&logo=pypi&logoColor=white)](https://pypi.org/project/cert-framework/)

**[Quick Start](#quick-start)** • 
**[CLI Reference](#cli-reference)** • 
**[API Documentation](#api-documentation)** • 
**[Compliance Guide](#eu-ai-act-compliance)**

</div>

---

## What This Solves

EU AI Act Article 15 requires high-risk AI systems to demonstrate "appropriate levels of accuracy, robustness and cybersecurity." For LLM deployments, this means:

1. Continuous accuracy measurement of production outputs (not manual sampling)
2. Complete audit trails linking traces to accuracy metrics
3. Technical documentation demonstrating compliance methodology

CERT provides the measurement infrastructure. You run LLMs in production, CERT measures accuracy automatically, generates Article 15 compliance documentation from the same data your engineers use for debugging.

**The core insight:** Compliance documentation should be a side-effect of production monitoring, not a separate manual process.

---

## Architecture

CERT combines two measurement components validated on Stanford SQuAD v2.0:

| Component | Weight | What It Detects | Correlation with Ground Truth |
|-----------|--------|-----------------|-------------------------------|
| **Semantic Similarity** | 50% | Topic drift, paraphrase errors | r = 0.644 |
| **Term Grounding** | 50% | Factual hallucinations, numerical errors | r = 0.899 |

**Combined formula:** `accuracy = 0.5 × semantic_similarity + 0.5 × term_grounding`

This dual-component approach achieves:
- **ROC AUC: 0.961** (near-perfect discrimination between accurate and hallucinated outputs)
- **Accuracy: 95.3%** at optimal threshold (0.46)
- **Cohen's d: 0.247σ** (strong effect size)

Dataset: Stanford Question Answering Dataset v2.0 (Rajpurkar et al., 2018), CC BY-SA 4.0 license

**Why this works:** Semantic similarity alone misses factual errors (high similarity, wrong facts). Term grounding alone misses paraphrasing (low overlap, correct meaning). Together they provide robust accuracy measurement validated on academic benchmarks.

---

## Quick Start

### Installation Tiers

```bash
# Core (tracer only, zero dependencies)
pip install cert-framework

# Evaluation (adds semantic similarity + NLI models, ~500MB download)
pip install cert-framework[evaluation]

# CLI tools (adds click for command-line interface)
pip install cert-framework[cli]

# Everything
pip install cert-framework[all]
```

**What you get at each tier:**

| Tier | Features | Dependencies | Size |
|------|----------|--------------|------|
| Core | `@trace()` decorator, JSONL logging | 0 external | <100KB |
| Evaluation | Semantic + grounding measurement | sentence-transformers, torch | ~500MB |
| CLI | Command-line tools | click | <1MB |
| All | Complete toolkit | All above | ~500MB |

### Basic Usage

**Step 1: Trace your LLM calls**

```python
from cert import trace

@trace(log_path="production.jsonl")
def rag_pipeline(query: str) -> dict:
    # Retrieve context
    context = vector_db.search(query, top_k=5)
    
    # Generate answer
    answer = llm.generate(context=context, query=query)
    
    # Return with expected field names
    return {
        "context": context,  # Ground truth for evaluation
        "answer": answer,    # LLM output to verify
        "query": query       # Optional: original input
    }

# Function logs every call automatically
result = rag_pipeline("What was Apple's Q4 2024 revenue?")
```

**Important:** The evaluator expects traces with `context` (ground truth) and `answer` (LLM output) fields. The tracer automatically extracts these if your function returns a dict with these keys. For other structures, see the integration patterns below.

**Step 2: Evaluate accuracy**

```python
from cert.evaluation import Evaluator

# Initialize with preset configuration
evaluator = Evaluator(
    preset="general",    # or "financial", "healthcare", "legal"
    threshold=0.7        # Confidence threshold for pass/fail
)

# Evaluate all traces in log file
results = evaluator.evaluate_log_file("production.jsonl")

print(f"Total traces: {results['total_traces']}")
print(f"Pass rate: {results['pass_rate']:.1%}")
print(f"Mean confidence: {sum(r['confidence'] for r in results['results']) / len(results['results']):.2f}")
```

**Step 3: Generate compliance report**

```bash
cert report production.jsonl \
  --system-name "CustomerBot RAG System" \
  --system-version "v2.1.0" \
  --provider-name "Acme Corporation" \
  --format html \
  --output article15_report.html
```

This generates an Article 15 technical documentation report including:
- Accuracy metrics with evaluation methodology
- Complete audit trail (100% trace coverage)
- Temporal analysis showing accuracy over time
- Failed inference examples with confidence scores
- Compliance attestation

---

## Integration Patterns

CERT's tracer works with any LLM framework. The key requirement: your function must return or log data that includes both the LLM output and the ground truth context for comparison.

### Pattern 1: Direct Return (Recommended)

```python
from cert import trace

@trace()
def my_rag(query: str) -> dict:
    context = retrieve(query)
    answer = llm(context, query)
    
    # Tracer extracts context and answer automatically
    return {"context": context, "answer": answer}
```

This is the simplest pattern. The tracer looks for `context` and `answer` keys in the return value.

### Pattern 2: Explicit Metadata

```python
@trace(metadata={"service": "customer-bot", "version": "2.1"})
def my_function(query: str) -> str:
    # Your existing code
    return llm_response
```

For functions that don't return dicts, use the `metadata` parameter to add context. You'll need to structure your logs manually for evaluation.

### Pattern 3: Generic Adapter (for any framework)

```python
from cert.integrations import wrap_llm_call
from cert.core.tracer import CertTracer

tracer = CertTracer(log_path="traces.jsonl")

# Wrap any LLM call
def my_workflow(query: str):
    context = retrieve(query)
    
    # Manually log the trace
    trace_data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "function": "my_workflow",
        "input": query,
        "context": context,
        "answer": llm.generate(context, query),
        "duration_ms": 0  # Calculate if needed
    }
    
    tracer.log_trace(trace_data)
```

This pattern gives you full control over what gets logged. Use it when `@trace()` doesn't fit your architecture.

### Pattern 4: LangChain Integration

```python
from langchain.chains import RetrievalQA
from cert.core.tracer import CertTracer

tracer = CertTracer()

# Create your LangChain setup
qa_chain = RetrievalQA.from_chain_type(...)

# Wrap the chain call
def traced_qa(query: str) -> dict:
    # Get context from retriever
    docs = qa_chain.retriever.get_relevant_documents(query)
    context = "\n".join([d.page_content for d in docs])
    
    # Run chain
    answer = qa_chain.run(query)
    
    # Log manually
    tracer.log_trace({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "function": "langchain_qa",
        "input": query,
        "context": context,
        "answer": answer
    })
    
    return {"context": context, "answer": answer}
```

### Pattern 5: Batch Import from Existing Logs

If you already have LLM monitoring (Langfuse, Arize, custom), convert your traces to CERT's JSONL format:

```python
import json
from pathlib import Path

def convert_to_cert_format(your_traces):
    """Convert your trace format to CERT JSONL"""
    cert_traces = []
    
    for trace in your_traces:
        cert_trace = {
            "timestamp": trace["timestamp"],
            "function": trace.get("function_name", "unknown"),
            "input": trace.get("input_text"),
            "context": trace.get("retrieved_docs"),  # Ground truth
            "answer": trace.get("llm_output"),        # To verify
            "duration_ms": trace.get("latency_ms", 0)
        }
        cert_traces.append(cert_trace)
    
    # Write to JSONL
    with open("cert_traces.jsonl", "w") as f:
        for trace in cert_traces:
            f.write(json.dumps(trace) + "\n")

# Then evaluate
from cert.evaluation import Evaluator
evaluator = Evaluator()
results = evaluator.evaluate_log_file("cert_traces.jsonl")
```

**Required fields for evaluation:**
- `context`: Ground truth or source material (required)
- `answer`: LLM output to verify (required)
- `timestamp`: ISO 8601 format (recommended)
- `function`: Function name (optional)
- `input`: Original query (optional)
- `duration_ms`: Latency (optional)

---

## CLI Reference

### Classify System Risk

Determine if your AI system is high-risk under EU AI Act Annex III:

```bash
cert classify-system --output classification.json
```

Interactive questionnaire covering 10 high-risk categories:
- Biometric identification
- Critical infrastructure
- Education and employment  
- Law enforcement
- Migration and border control
- Justice and democratic processes
- Access to essential services

**Output:**
```json
{
  "classification": {
    "risk_level": "high",
    "title": "High-Risk AI System (Annex III)",
    "high_risk_indicators": 3,
    "total_questions": 10
  },
  "requirements": [
    "Article 9: Risk management system required",
    "Article 10: Data governance requirements",
    "Article 15: Accuracy, robustness, cybersecurity",
    "Annex IV: Technical documentation mandatory"
  ]
}
```

### Generate Compliance Data

Create structured data for compliance documentation:

```bash
cert generate-docs traces.jsonl \
  --system-name "CustomerBot" \
  --provider-name "Acme Corp" \
  --intended-purpose "Customer support automation" \
  --metadata system_metadata.json \
  --output compliance_data.json
```

**Metadata file structure** (`system_metadata.json`):

```json
{
  "system_name": "CustomerBot",
  "system_version": "v2.1.0",
  "provider_name": "Acme Corporation",
  "intended_purpose": "Automated customer support",
  "architecture": {
    "model_type": "gpt-4",
    "model_version": "gpt-4-0613",
    "infrastructure": "OpenAI API via REST"
  },
  "data_governance": {
    "training_data": "GPT-4 pre-trained by OpenAI",
    "validation_data": "Internal test set of 500 queries"
  },
  "risk_management": {
    "identified_risks": "Potential incorrect product information",
    "mitigation": "Human review of order-related responses"
  }
}
```

### Audit Compliance Status

Check completeness of compliance documentation:

```bash
cert audit-status traces.jsonl \
  --metadata system_metadata.json \
  --output audit_report.json
```

**Output format:**
```
Article 15: COMPLIANT (94.3% accuracy, threshold 85%)
Article 19: COMPLIANT (100% trace coverage)
Annex IV: INCOMPLETE (6/9 sections)
  Missing: risk_management, human_oversight, conformity_assessment
```

### Generate Reports

```bash
# HTML report (standalone file)
cert report traces.jsonl \
  --system-name "CustomerBot" \
  --format html \
  --output report.html

# JSON report (for programmatic access)
cert report traces.jsonl \
  --format json \
  --output report.json
```

### Measure Single Text Pair

Quick accuracy check without full evaluation:

```bash
# Basic score
cert measure "Apple's Q4 revenue was $89.5B" "Apple reported $89.5 billion Q4"
# Output: 0.943

# Detailed breakdown
cert measure "Apple's Q4 revenue was $450B" "Apple reported $89.5B Q4" --detailed
# Output:
# Confidence: 0.421
#   Semantic:  0.856
#   Grounding: 0.187
#   Status:    Inaccurate (below threshold)
```

---

## API Documentation

### Core Tracer

```python
from cert import trace

@trace(
    log_path: str = "cert_traces.jsonl",  # Output file
    metadata: dict = None                  # Optional metadata
)
def your_function():
    pass
```

The tracer has zero dependencies and logs to JSONL. Each log entry contains:

```json
{
  "timestamp": "2025-11-07T10:30:00Z",
  "function": "my_function",
  "duration_ms": 234,
  "status": "success",
  "context": "retrieved content...",
  "answer": "LLM output...",
  "metadata": {"key": "value"}
}
```

### Evaluator

```python
from cert.evaluation import Evaluator

evaluator = Evaluator(
    preset: str = "general",      # Industry preset
    threshold: float = 0.7,       # Confidence threshold
    tracer: CertTracer = None     # Optional custom tracer
)

# Evaluate single trace
result = evaluator.evaluate_trace(
    context: str,           # Ground truth
    answer: str,            # LLM output
    input_query: str = None # Optional input
)
# Returns: {
#   "matched": bool,
#   "confidence": float,
#   "semantic_score": float,
#   "nli_score": float,
#   "grounding_score": float
# }

# Evaluate log file
results = evaluator.evaluate_log_file(log_path: str)
# Returns: {
#   "total_traces": int,
#   "passed": int,
#   "failed": int,
#   "pass_rate": float,
#   "results": List[dict]
# }

# Evaluate in-memory traces
results = evaluator.evaluate_traces(traces: List[dict])
```

**Available presets:**

| Preset | Threshold | Use Case |
|--------|-----------|----------|
| `general` | 0.70 | General-purpose LLM applications |
| `financial` | 0.85 | Financial services (stricter) |
| `healthcare` | 0.80 | Healthcare applications |
| `legal` | 0.75 | Legal document processing |

Presets adjust the confidence threshold but use the same evaluation logic (semantic + grounding). Higher thresholds mean stricter accuracy requirements.

### Measurement Function

```python
from cert import measure

# Simple score
score = measure(
    text1: str,           # First text
    text2: str,           # Second text
    threshold: float = 0.7 # Optional threshold
)
# Returns: float (0.0 to 1.0)

# Detailed result
from cert.measure import measure_detailed

result = measure_detailed(text1: str, text2: str)
# Returns: MeasurementResult with:
#   .confidence: float
#   .semantic_score: float
#   .grounding_score: float
#   .nli_score: float
#   .matched: bool
#   .is_accurate() -> bool
```

### Compliance Reporter

```python
from cert.compliance import ComplianceReporter

reporter = ComplianceReporter(
    system_name: str,
    system_version: str,
    provider_name: str,
    intended_purpose: str = ""
)

# Generate report
report = reporter.generate_report(
    trace_file: str,
    format: str = "json"  # or "html"
)

# Save report
reporter.save_report(
    trace_file: str,
    output_path: str,
    format: str = "json"
)
```

---

## EU AI Act Compliance

### Coverage

<table>
<tr>
<td width="50%">

**Implemented**
- Article 15: Accuracy, robustness, cybersecurity measurements
- Article 19: Automatic logging requirements (100% coverage)
- Annex III: Risk classification questionnaire
- Annex IV: Technical documentation sections 1-6

</td>
<td width="50%">

**Generated Automatically**
- Accuracy metrics with methodology
- Complete audit trails
- Temporal analysis
- Failed inference examples
- Performance statistics

</td>
</tr>
</table>

### Compliance Timeline

| Requirement | Deadline | Status |
|-------------|----------|--------|
| Prohibited AI systems ban | August 2, 2025 | Active |
| GPAI transparency obligations | August 2, 2025 | Active |
| High-risk system requirements | August 2, 2026 | 9 months |

**Penalties:**
- Up to €35M or 7% global revenue for prohibited AI
- Up to €15M or 3% global revenue for high-risk non-compliance

### What Article 15 Requires

From EU AI Act Article 15(1):

> "High-risk AI systems shall be designed and developed in such a way that they achieve, in the light of their intended purpose, an appropriate level of accuracy, robustness and cybersecurity, and perform consistently in those respects throughout their lifecycle."

**CERT provides:**

1. **Accuracy measurement:** Continuous evaluation using validated methods (SQuAD v2.0)
2. **Methodology documentation:** Clear explanation of semantic + grounding approach
3. **Audit trail:** Complete record of all inferences with confidence scores
4. **Temporal consistency:** Analysis showing performance over time
5. **Failed case analysis:** Documentation of inaccurate outputs for risk assessment

### Article 15 Report Contents

Generated reports include:

**Section 1: System Description**
- System name, version, provider
- Intended purpose and use cases
- Architecture overview

**Section 2: Evaluation Methodology**
- Measurement approach (semantic similarity + term grounding)
- Validation on Stanford SQuAD v2.0
- Threshold selection and justification

**Section 3: Performance Metrics**
- Overall accuracy percentage
- Pass/fail rates at configured threshold
- Mean and median confidence scores
- Distribution analysis

**Section 4: Audit Trail**
- Total traces evaluated
- Date range coverage
- Complete inference log with scores

**Section 5: Temporal Analysis**
- Accuracy trends over time
- Performance consistency
- Degradation detection

**Section 6: Failed Inference Analysis**
- Examples of low-confidence outputs
- Confidence score distribution for failures
- Risk assessment

---

## Dashboard (Optional)

The dashboard is a separate Next.js application for visualizing compliance reports. It's optional - you can generate HTML reports via CLI without deploying the dashboard.

**Setup:**

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

**Features:**
- Upload evaluation JSON files
- Interactive accuracy distribution charts
- Failed trace browser
- Export PDF reports (uses @react-pdf/renderer)

**When to use the dashboard:**
- Multiple stakeholders need to review results
- You want professional PDF exports for auditors
- You need visual trend analysis (upcoming feature)

**When to skip it:**
- CLI HTML reports are sufficient
- You prefer static files over web applications
- You don't want to maintain a separate Node.js deployment

The dashboard adds convenience but isn't required for compliance. The CLI generates self-contained HTML reports with all necessary information.

---

## Comparison with Existing Tools

<table>
<thead>
<tr>
<th>Capability</th>
<th>Langfuse/Arize</th>
<th>OneTrust/Vanta</th>
<th>CERT</th>
</tr>
</thead>
<tbody>
<tr>
<td>Production LLM monitoring</td>
<td align="center">Yes (full-featured)</td>
<td align="center">No</td>
<td align="center">Yes (minimal)</td>
</tr>
<tr>
<td>Accuracy measurement</td>
<td align="center">Manual (LLM-as-judge)</td>
<td align="center">No</td>
<td align="center">Automatic (local models)</td>
</tr>
<tr>
<td>EU AI Act Article 15</td>
<td align="center">No</td>
<td align="center">Manual documentation</td>
<td align="center">Automatic reporting</td>
</tr>
<tr>
<td>Developer SDK</td>
<td align="center">Yes</td>
<td align="center">No</td>
<td align="center">Yes</td>
</tr>
<tr>
<td>Open source</td>
<td align="center">Yes (Langfuse)</td>
<td align="center">No</td>
<td align="center">Yes</td>
</tr>
<tr>
<td>Self-hosted cost</td>
<td align="center">Free</td>
<td align="center">€50K+/year</td>
<td align="center">Free</td>
</tr>
</tbody>
</table>

**Recommended architecture:**

- **Langfuse/Arize:** Full monitoring (traces, latency, costs, debugging)
- **CERT:** Accuracy measurement and EU AI Act compliance
- **OneTrust/Vanta:** Organization-wide policy management

CERT doesn't replace your monitoring stack. It adds the compliance layer your monitoring stack doesn't provide.

**Why CERT for compliance:**

1. **Local models:** No per-inference API costs (vs GPT-4-as-judge)
2. **Deterministic:** Same inputs produce same scores (vs LLM variability)
3. **Validated:** 95.3% accuracy on SQuAD v2.0 (academic benchmark)
4. **Fast:** Local inference 10-100x faster than API calls
5. **Article 15-specific:** Reports structured for regulatory requirements

---

## Validation Results

CERT's measurement system was validated on Stanford SQuAD v2.0:

<table>
<tr>
<td align="center" width="33%">
<img src="https://img.shields.io/badge/ROC%20AUC-0.961-success?style=for-the-badge" />
<br/>
<sub>Near-perfect discrimination</sub>
</td>
<td align="center" width="33%">
<img src="https://img.shields.io/badge/Accuracy-95.3%25-success?style=for-the-badge" />
<br/>
<sub>At optimal threshold</sub>
</td>
<td align="center" width="33%">
<img src="https://img.shields.io/badge/Cohen's%20d-0.247σ-success?style=for-the-badge" />
<br/>
<sub>Strong effect size</sub>
</td>
</tr>
</table>

**Test methodology:**
- 11,873 answerable questions from SQuAD v2.0
- Generated responses using GPT-3.5-turbo
- Measured accuracy using CERT's dual-component approach
- Compared against ground truth labels

**Component performance:**
- Semantic Similarity: r = 0.644 (moderate correlation)
- Term Grounding: r = 0.899 (strong correlation)
- Combined System: ROC AUC = 0.961 (excellent discrimination)

**Threshold analysis:**
- At threshold 0.46: 95.3% accuracy (optimal)
- At threshold 0.70: 89.2% accuracy (recommended for production)
- False positive rate: <5% at recommended threshold

**Dataset citation:** Rajpurkar et al., "Know What You Don't Know: Unanswerable Questions for SQuAD" (2018), CC BY-SA 4.0

---

## Roadmap

<table>
<tr>
<td width="25%">

**Q4 2025**
- Core measurement engine
- SQuAD v2.0 validation
- Article 15 reporting
- CLI tools
- Dashboard v1

</td>
<td width="25%">

**Q1 2026**
- Hosted evaluation API
- Framework-specific adapters
- Multi-language support
- Real-time streaming evaluation
- Prometheus exporters

</td>
<td width="25%">

**Q2 2026**
- Pluggable evaluator architecture
- Domain-specific benchmarks
- Multi-modal support (vision)
- Automated threshold tuning
- Grafana dashboards

</td>
<td width="25%">

**Q3 2026**
- Circuit breakers
- Drift detection
- A/B testing framework
- Enterprise SSO
- SaaS deployment

</td>
</tr>
</table>

---

## Examples

See the [`examples/`](examples/) directory for complete working examples:

- `01_basic_measurement.py` - Simple accuracy checking
- `02_production_monitoring.py` - Production tracing setup
- `03_compliance_workflow.py` - End-to-end compliance process

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Development setup:**

```bash
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework

# Install with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linting
ruff check .
```

**Areas for contribution:**
- Additional industry presets with validated thresholds
- Framework-specific integration adapters
- Multi-language support
- Documentation improvements
- Bug reports and feature requests

---

## License

Apache 2.0 - see [LICENSE](LICENSE)

Commercial use, modification, distribution, and private use permitted.

---

## FAQ

**Q: Do I need to download 500MB of models?**

A: The evaluation features require sentence-transformers and PyTorch (~500MB total). The core tracer has zero dependencies. Install only what you need:
- `pip install cert-framework` - tracer only
- `pip install cert-framework[evaluation]` - adds models

**Q: Can I use this with Langfuse/Arize?**

A: Yes. Export your traces and convert to CERT's JSONL format (see Integration Patterns section). CERT complements existing monitoring, doesn't replace it.

**Q: What if my accuracy definition is different?**

A: Current version uses semantic + grounding with configurable thresholds via presets. For fundamentally different evaluation logic, see Roadmap Q2 2026 for pluggable evaluator architecture.

**Q: Does this work in CI/CD?**

A: The tracer works in CI (zero dependencies). Skip evaluation in CI to avoid model downloads:

```python
if not os.getenv("CI"):
    evaluator.evaluate_log_file("traces.jsonl")
```

**Q: Is the dashboard required?**

A: No. Use `cert report` CLI to generate standalone HTML files. The dashboard adds convenience for PDF exports and multi-user access but isn't required for compliance.

---

## Contact

**Javier Marin**  
Email: javier@jmarin.info  
LinkedIn: [linkedin.com/in/javiermarinvalenzuela](https://linkedin.com/in/javiermarinvalenzuela)  
Twitter: [@jamarinval](https://x.com/jamarinval)

For consulting inquiries: EU AI Act compliance implementation, production LLM system design, responsible AI deployment.

---

<div align="center">

### Production LLM Compliance for EU AI Act Article 15

**Install:** `pip install cert-framework[all]`

[![Star on GitHub](https://img.shields.io/github/stars/Javihaus/cert-framework?style=social)](https://github.com/Javihaus/cert-framework)

</div>
