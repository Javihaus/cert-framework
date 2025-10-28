# CERT Framework

Production-ready accuracy monitoring for LLM systems. Automated compliance documentation for EU AI Act Article 15.

<div align="center">
  <img src="docs/CERT.png" alt="CERT Framework" width="1000">
</div>

\
[**Why CERT**](#why-cert)
| [**Installation & Quickstart**](#iInstallation-&-quickstart)
| [**Run the Examples**](#run-the-examples)
| [**How It Works**](#how-it-works)
| [**API Reference**](#api-reference)
| [**Compliance Mapping**](#compliance-mapping)
| [**Framework Integrations**](#framework-integrations)
| [**Advanced Features**](#advanced-features)
| [**Production Deployment**](#production-deployment)
| [**Troubleshooting**](#troubleshooting)
| [**Performance Characteristics**](#performance-characteristics)
| [**Development**](#development)
| [**FAQ**](#faq)
| [**License**](#license)
| [**Citation**](#citation)

\
[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## Why CERT

The EU AI Act requires high-risk AI systems to demonstrate "appropriate levels of accuracy" (Article 15) with documented evidence for auditors. Compliance deadlines begin August 2026.

Most evaluation tools help you test prompts before deployment. CERT monitors accuracy **in production** and generates the compliance documentation auditors will request.

**The problem:** Your RAG system is answering customer questions right now. You need continuous proof it's meeting accuracy requirements. Manual spot-checking doesn't scale. Generic logging doesn't prove compliance.

**This solution:** Three lines of code give you per-request accuracy measurement, automatic audit trails (Article 19), and ready-to-submit compliance reports (Article 15).

---

## Installation & Quickstart

### Installation
```bash
# Basic installation
pip install cert-framework

# With advanced features (trajectory analysis)
pip install cert-framework[trajectory]

# From source
git clone https://github.com/Javihaus/cert-framework
cd cert-framework
pip install -e .
```

### Three-Line Integration

Add accuracy monitoring to any LLM pipeline:
```python
from cert import monitor

@monitor(preset="healthcare")  # or "financial", "legal", "general"
def your_rag_pipeline(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}

result = your_rag_pipeline("What was Q4 revenue?")
# Automatically generates audit log in cert_audit.jsonl
```

The decorator measures semantic similarity between `answer` and `context`, checking for hallucinations and factual grounding. Results are logged automatically for compliance reporting.

### Generate Compliance Reports

Create EU AI Act documentation from your audit logs:
```python
from cert import export_report

export_report(
    audit_log_path="cert_audit.jsonl",
    system_name="Production RAG System",
    format="pdf"  # or "txt", "json", "markdown", "html"
)
```

**That's it.** You now have production monitoring and compliance documentation.

---

## Run the Examples

All examples work out-of-the-box with zero configuration:
```bash
# Basic examples (no setup required)
python examples/01_quickstart.py              # Basic monitoring
python examples/02_rag_monitoring.py          # RAG-specific patterns
python examples/03_model_comparison.py        # A/B test models
python examples/04_compliance_reports.py      # Generate EU AI Act reports

# Advanced examples (require cert-framework[trajectory])
python examples/05_trajectory_analysis.py     # Reasoning trajectory analysis
python examples/06_coordination_monitor.py    # Multi-agent coordination
```

Each example runs in < 10 seconds with zero setup.

---

## How It Works

### Measurement Approach

CERT uses three complementary methods to assess answer accuracy:

1. **Semantic Similarity** (30% weight): Embedding-based similarity between answer and source context
2. **Natural Language Inference** (50% weight): Detects logical contradictions using NLI models
3. **Term Grounding** (20% weight): Identifies claims in the answer not present in source material

These combine into a confidence score. Answers below the threshold (default: 0.7) are flagged for review.

### Industry Presets

Pre-configured for regulatory requirements:
```python
# Healthcare (EU AI Act Annex III, high-risk)
@monitor(preset="healthcare")  # Threshold: 0.85, strict grounding
def diagnose_patient(symptoms):
    pass

# Financial services (EU AI Act Annex III, high-risk)
@monitor(preset="financial")   # Threshold: 0.80, balanced
def assess_creditworthiness(application):
    pass

# Legal systems (EU AI Act Annex III, high-risk)
@monitor(preset="legal")        # Threshold: 0.80, emphasis on grounding
def analyze_contract(document):
    pass

# General purpose (low-risk)
@monitor(preset="general")      # Threshold: 0.70, standard monitoring
def answer_question(query):
    pass
```

Each preset maps to specific EU AI Act requirements and adjusts measurement sensitivity accordingly.

### Audit Trail

Every monitored request generates a structured log entry:
```json
{
  "timestamp": "2025-10-28T14:32:11Z",
  "preset": "healthcare",
  "risk_level": "high",
  "query": "What medications is the patient taking?",
  "context": "Patient medications: Metformin 1000mg bid, Lisinopril 10mg qd",
  "answer": "The patient takes Metformin and Lisinopril",
  "measurement": {
    "matched": true,
    "confidence": 0.87,
    "semantic_score": 0.82,
    "nli_label": "entailment",
    "nli_score": 0.91,
    "grounding_score": 0.89,
    "ungrounded_terms": []
  },
  "compliance": {
    "Article 15.1": true,
    "Article 15.4": true
  }
}
```

This log format satisfies Article 19 (record-keeping requirements) and provides evidence for Article 15 (accuracy requirements).

---

## API Reference

### `monitor()`

Decorator for monitoring function outputs.

**Signature:**
```python
def monitor(
    preset: str = "general",
    threshold: float = None,
    use_semantic: bool = True,
    semantic_weight: float = None,
    use_nli: bool = True,
    nli_weight: float = None,
    use_grounding: bool = True,
    grounding_weight: float = None,
    embedding_model: str = "all-MiniLM-L6-v2",
    nli_model: str = "microsoft/deberta-v3-base"
) -> Callable
```

**Parameters:**

- `preset` (str): Industry preset - "healthcare", "financial", "legal", or "general"
- `threshold` (float): Override preset threshold (0.0-1.0)
- `use_semantic` (bool): Enable semantic similarity measurement
- `semantic_weight` (float): Override semantic component weight
- `use_nli` (bool): Enable NLI contradiction detection
- `nli_weight` (float): Override NLI component weight
- `use_grounding` (bool): Enable term grounding analysis
- `grounding_weight` (float): Override grounding component weight
- `embedding_model` (str): Sentence transformer model name
- `nli_model` (str): Natural language inference model name

**Returns:**
Decorator that wraps the function with monitoring

**Expected Function Signature:**

Your monitored function should return a dict with these keys:
```python
{
    "context": str,  # Source material (documents, database results, etc.)
    "answer": str,   # Model-generated response
    "query": str     # Optional: original user query
}
```

**Examples:**
```python
# Use preset defaults
@monitor(preset="healthcare")
def process_query(query):
    return {"context": context, "answer": answer}

# Override threshold
@monitor(preset="financial", threshold=0.85)
def risk_assessment(data):
    return {"context": context, "answer": answer}

# Custom weights
@monitor(
    preset="legal",
    semantic_weight=0.2,
    nli_weight=0.5,
    grounding_weight=0.3
)
def analyze_contract(text):
    return {"context": context, "answer": answer}
```

---

### `measure()`

Direct measurement function for comparing two texts.

**Signature:**
```python
def measure(
    text1: str,
    text2: str,
    *,
    use_semantic: bool = True,
    semantic_weight: float = 0.3,
    use_nli: bool = True,
    nli_weight: float = 0.5,
    use_grounding: bool = True,
    grounding_weight: float = 0.2,
    threshold: float = 0.7,
    embedding_model: str = "all-MiniLM-L6-v2",
    nli_model: str = "microsoft/deberta-v3-base"
) -> MeasurementResult
```

**Purpose:**
Measures semantic similarity, detects contradictions, and checks grounding between two texts. Use this for one-off evaluations or custom workflows.

**Parameters:**

- `text1` (str): First text, typically model output or answer
- `text2` (str): Second text, typically context or ground truth
- `use_semantic` (bool): Enable embedding-based similarity
- `semantic_weight` (float): Weight for semantic component (0.0-1.0)
- `use_nli` (bool): Enable NLI contradiction detection
- `nli_weight` (float): Weight for NLI component (0.0-1.0)
- `use_grounding` (bool): Enable term grounding analysis
- `grounding_weight` (float): Weight for grounding component (0.0-1.0)
- `threshold` (float): Confidence threshold for match (0.0-1.0)
- `embedding_model` (str): Sentence transformer model name
- `nli_model` (str): NLI model name

**Returns:**

`MeasurementResult` object with:
```python
@dataclass
class MeasurementResult:
    matched: bool              # True if confidence >= threshold
    confidence: float          # Overall confidence score (0.0-1.0)
    semantic_score: float      # Embedding similarity (0.0-1.0)
    nli_label: str            # "entailment", "neutral", or "contradiction"
    nli_score: float          # NLI confidence (0.0-1.0)
    grounding_score: float    # Term coverage (0.0-1.0)
    ungrounded_terms: List[str]  # Terms in text1 not in text2
```

**Examples:**
```python
from cert import measure

# Basic comparison
result = measure(
    "The patient has diabetes",
    "Patient diagnosed with Type 2 diabetes mellitus"
)
print(result.matched)      # True
print(result.confidence)   # 0.89

# Check for hallucination
result = measure(
    "The patient is allergic to penicillin",
    "Patient has no known drug allergies"
)
print(result.nli_label)    # "contradiction"
print(result.matched)      # False

# Identify ungrounded claims
result = measure(
    "Revenue increased 50% due to new product launch",
    "Q4 revenue was $1.2M"
)
print(result.ungrounded_terms)  # ["50%", "new product launch"]
```

---

### `export_report()`

Generate compliance reports from audit logs.

**Signature:**
```python
def export_report(
    audit_log_path: str = "cert_audit.jsonl",
    system_name: str = "LLM System",
    system_version: str = "1.0.0",
    risk_level: str = "high",
    format: str = "txt",
    output_path: str = None
) -> str
```

**Purpose:**
Generates EU AI Act Article 15 compliance documentation showing accuracy metrics, robustness measures, and audit trail status.

**Parameters:**

- `audit_log_path` (str): Path to cert audit log (default: "cert_audit.jsonl")
- `system_name` (str): Your AI system name
- `system_version` (str): System version identifier
- `risk_level` (str): "high", "limited", or "minimal" per EU AI Act classification
- `format` (str): Report format - "txt", "json", "markdown", "html", or "pdf"
- `output_path` (str): Custom output path (auto-generated if None)

**Returns:**
Path to generated report file

**Examples:**
```python
from cert import export_report

# Text report for internal review
export_report(
    audit_log_path="cert_audit.jsonl",
    system_name="Customer Service RAG",
    system_version="2.1.0",
    risk_level="high",
    format="txt"
)

# PDF for external audit
export_report(
    system_name="Healthcare Diagnosis Assistant",
    risk_level="high",
    format="pdf",
    output_path="compliance/audit_2025_q4.pdf"
)

# JSON for programmatic analysis
export_report(
    system_name="Credit Risk Assessment",
    format="json",
    output_path="metrics/compliance_metrics.json"
)
```

**Report Contents:**

Reports include:

- **System Overview**: Name, version, risk classification, evaluation period
- **Article 15.1 Compliance**: Accuracy metrics and pass rates
- **Article 15.4 Compliance**: Robustness measures and error rates
- **Article 19 Compliance**: Audit trail status and data retention
- **Failure Analysis**: Top failure modes with explanations and recommendations
- **Recommendations**: Specific actions to improve compliance

---

## Compliance Mapping

### EU AI Act Article 15

**Article 15.1 - Accuracy:**
> "High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness and cybersecurity."

**How CERT satisfies this:**
- Per-request accuracy measurement with configurable thresholds
- Industry-specific presets calibrated to regulatory expectations
- Automated reporting showing sustained accuracy over time

**Article 15.4 - Robustness:**
> "High-risk AI systems shall be resilient as regards errors, faults or inconsistencies."

**How CERT satisfies this:**
- NLI-based contradiction detection catches factual errors
- Grounding analysis identifies unsupported claims (hallucinations)
- Failure explanations pinpoint specific robustness issues

### EU AI Act Article 19

**Article 19 - Record-keeping:**
> "Providers of high-risk AI systems shall keep logs automatically generated by their systems."

**How CERT satisfies this:**
- Automatic JSONL audit logs for every evaluated request
- Immutable append-only format prevents tampering
- Structured format enables programmatic audit preparation

---

## Framework Integrations

### LangChain
```python
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
from langchain.vectorstores import Chroma
from cert import monitor

# Create your chain
llm = OpenAI(temperature=0)
vectorstore = Chroma.from_documents(documents, embeddings)
chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever()
)

# Wrap with monitoring
@monitor(preset="general")
def monitored_query(question):
    result = chain({"query": question})
    return {
        "query": question,
        "context": result.get("source_documents", ""),
        "answer": result["result"]
    }

# Use normally
answer = monitored_query("What is the capital of France?")
```

### LlamaIndex
```python
from llama_index import VectorStoreIndex, SimpleDirectoryReader
from cert import monitor

# Create your index
documents = SimpleDirectoryReader('data').load_data()
index = VectorStoreIndex.from_documents(documents)

# Wrap query engine with monitoring
@monitor(preset="general")
def monitored_query(question):
    query_engine = index.as_query_engine()
    response = query_engine.query(question)
    
    return {
        "query": question,
        "context": str(response.source_nodes),
        "answer": str(response)
    }

# Use normally
answer = monitored_query("Summarize the document")
```

### Anthropic SDK (Raw API)
```python
import anthropic
from cert import monitor

client = anthropic.Anthropic(api_key="your-key")

@monitor(preset="financial")
def analyze_with_claude(prompt, context):
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"Context: {context}\n\nQuestion: {prompt}"
        }]
    )
    
    return {
        "query": prompt,
        "context": context,
        "answer": message.content[0].text
    }

# Use normally
result = analyze_with_claude(
    "What's the revenue trend?",
    "Q1: $1.2M, Q2: $1.5M, Q3: $1.8M"
)
```

### OpenAI SDK (Raw API)
```python
from openai import OpenAI
from cert import monitor

client = OpenAI(api_key="your-key")

@monitor(preset="legal")
def analyze_with_gpt(prompt, context):
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": f"Context: {context}"},
            {"role": "user", "content": prompt}
        ]
    )
    
    return {
        "query": prompt,
        "context": context,
        "answer": response.choices[0].message.content
    }

# Use normally
result = analyze_with_gpt(
    "Is this contract enforceable?",
    contract_text
)
```

---

## Advanced Features

### Experiment Tracking

Compare model performance across iterations:
```python
from cert.compliance import create_dataset_from_audit_log, run_experiment

# Create evaluation dataset from production logs
dataset = create_dataset_from_audit_log(
    audit_log_path="cert_audit.jsonl",
    name="q4_production_sample",
    version="1.0",
    sample_size=100
)

# Save for reproducibility
dataset.save("datasets/q4_eval_v1.json")

# Run experiment with your model
def eval_function(query, context):
    # Your model inference here
    return model.generate(query, context)

run = run_experiment(
    name="gpt4_baseline",
    dataset=dataset,
    eval_function=eval_function,
    config={"model": "gpt-4", "temperature": 0}
)

# Results include pass rate, confidence, and failure analysis
print(f"Pass rate: {run.results['passed'] / run.results['total'] * 100}%")
print(f"Avg confidence: {run.results['avg_confidence']}")
```

Compare experiments over time:
```python
from cert.compliance import compare_experiments

# Load previous runs
run1 = ExperimentRun.load("experiments/baseline_2025_10_01.json")
run2 = ExperimentRun.load("experiments/optimized_2025_10_15.json")
run3 = ExperimentRun.load("experiments/final_2025_10_28.json")

# Generate comparison report
compare_experiments(
    experiments=[run1, run2, run3],
    output_path="reports/experiment_comparison.html"
)
# Opens interactive HTML dashboard showing metrics over time
```

### Prometheus Metrics

Export metrics for alerting and dashboards:
```python
from cert.observability.prometheus import export_metrics_from_audit_log

# Start metrics server
export_metrics_from_audit_log(
    audit_log_path="cert_audit.jsonl",
    system_name="production_rag",
    port=8000
)
# Metrics available at http://localhost:8000/metrics
```

**Available metrics:**

| Metric | Type | Description | Labels |
|--------|------|-------------|---------|
| `cert_accuracy_score` | Gauge | Current accuracy score (0.0-1.0) | `system_name`, `preset` |
| `cert_evaluations_total` | Counter | Total evaluations performed | `system_name`, `preset`, `result` (pass/fail) |
| `cert_compliance_status` | Gauge | Compliance status per article (1=compliant, 0=non-compliant) | `system_name`, `article` |

**Example output from `/metrics` endpoint:**
```
cert_accuracy_score{system_name="production_rag",preset="general"} 0.87
cert_evaluations_total{system_name="production_rag",preset="general",result="pass"} 847
cert_evaluations_total{system_name="production_rag",preset="general",result="fail"} 53
cert_compliance_status{system_name="production_rag",article="Article 15.1"} 1
```

Set up Grafana alerts:
```yaml
# Example alert rule
- alert: AccuracyBelowThreshold
  expr: cert_accuracy_score < 0.7
  for: 30m
  labels:
    severity: critical
  annotations:
    summary: "AI system accuracy dropped below threshold"
    description: "System {{ $labels.system_name }} accuracy is {{ $value }}"
```

### Trajectory Analysis (Advanced)

Analyze reasoning patterns in multi-step inference:
```python
from cert.advanced.trajectory import analyze_trajectory

# Analyze reasoning trajectory
analysis = analyze_trajectory(
    prompt="What is the treatment for hypertension?",
    response="First-line treatment is lifestyle modification...",
    config=TrajectoryConfig(
        capture_hidden_states=True,
        analyze_attention_patterns=True
    )
)

# Results include reasoning metrics
print(analysis.coherence_score)      # How consistent is reasoning
print(analysis.divergence_points)    # Where reasoning changes direction
print(analysis.attention_entropy)    # Information distribution
```

**Note:** Trajectory analysis is experimental and requires `cert-framework[trajectory]` installation. It's useful for debugging complex reasoning failures but not required for compliance monitoring.

---

## Production Deployment

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install cert-framework

# Copy your application
COPY . .

# Your application runs normally
# CERT logs are written to cert_audit.jsonl
CMD ["python", "app.py"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-system
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: your-rag-system:latest
        volumeMounts:
        - name: audit-logs
          mountPath: /app/logs
      volumes:
      - name: audit-logs
        persistentVolumeClaim:
          claimName: cert-audit-logs

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-metrics
spec:
  selector:
    app: rag-system
  ports:
  - port: 8000
    targetPort: 8000
    name: metrics
```

### Monitoring Stack

Complete observability setup:
```yaml
# docker-compose.yml
version: '3'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./logs:/app/logs
  
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
```

---

## Troubleshooting

### Common Issues

**"No module named 'sentence_transformers'"**

Install the embedding library:
```bash
pip install sentence-transformers
```

**"CUDA out of memory" errors**

CERT runs fine on CPU. Disable GPU:
```python
import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""
```

**Slow measurement times (> 1 second)**

First measurement is slow (model loading). Subsequent requests are fast (~50-200ms). If still slow:

1. Use smaller embedding model: `embedding_model="all-MiniLM-L6-v2"` (default, 80MB)
2. Disable NLI if not needed: `use_nli=False`
3. Reduce batch size for production deployments

**Audit log file permissions**

CERT writes to `cert_audit.jsonl` in current directory. Ensure write permissions:
```python
import os
os.chmod("cert_audit.jsonl", 0o666)
```

**Compliance reports show "insufficient data"**

Reports require at least 10 audit log entries. Run more monitored requests:
```python
for query in test_queries:
    result = monitored_function(query)
```

---

## Performance Characteristics

**Measurement latency:**
- First call: 2-5 seconds (model loading)
- Subsequent calls: 50-200ms per measurement (CPU)
- GPU acceleration: 20-50ms per measurement

**Memory footprint:**
- Embedding model: ~100MB RAM
- NLI model: ~500MB RAM
- Total: ~600MB RAM per process

**Throughput:**
- Single process: 5-20 requests/second
- Multi-process: Scales linearly with CPU cores

**Audit log size:**
- ~1KB per logged request
- 1M requests = ~1GB log file
- Use log rotation for high-volume systems

---

## Development

### Running Tests
```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run with coverage
pytest --cov=cert --cov-report=html

# Run specific test
pytest tests/test_measure.py::test_semantic_similarity
```

### Code Quality
```bash
# Format code
ruff format cert/

# Lint
ruff check cert/

# Type check
mypy cert/
```

### Support

- **Documentation**: [docs/](docs/)
- **Examples**: [examples/](examples/)
- **Issues**: [GitHub Issues](https://github.com/Javihaus/cert-framework/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Javihaus/cert-framework/discussions)


### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Ensure all tests pass: `pytest`
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## FAQ

**Q: Does this work with any LLM provider?**

Yes. CERT monitors your application code, not specific LLM APIs. Works with OpenAI, Anthropic, Cohere, self-hosted models, or any other provider.

**Q: What's the performance impact?**

~50-200ms per request on CPU. This is negligible compared to typical LLM inference times (1-10 seconds). The decorator is non-blocking and logs asynchronously.

**Q: Do I need to change my existing code?**

Minimal changes. Add the `@monitor()` decorator and ensure your function returns `{"context": str, "answer": str}`. That's it.

**Q: Is this GDPR compliant?**

CERT logs queries and answers locally. You control data retention and storage. The framework doesn't send data externally. Follow your organization's GDPR policies for log management.

**Q: Can I use custom evaluation metrics?**

Yes. Use `measure()` directly with custom weights, or extend `MeasurementResult` for domain-specific metrics. See [examples/custom_metrics.py](examples/custom_metrics.py).

**Q: What about multilingual support?**

Default models (all-MiniLM-L6-v2, deberta-v3) support 50+ languages. For specialized domains, specify custom models:
```python
@monitor(
    embedding_model="distiluse-base-multilingual-cased-v2",
    nli_model="joeddav/xlm-roberta-large-xnli"
)
```

**Q: How do I handle high-traffic production systems?**

1. Use async logging (built-in)
2. Sample requests: Monitor 10% of traffic for statistics
3. Use external monitoring: Export to Prometheus, alert on aggregate metrics
4. Rotate logs: Use logrotate or similar for multi-GB log files

**Q: What's the difference between CERT and [other tool]?**

Most tools focus on pre-deployment evaluation (prompt testing, dataset benchmarking). CERT focuses on production monitoring with automatic compliance reporting. Use both: Test prompts with eval tools, monitor production with CERT.

**Q: Is there a hosted/SaaS version?**

No. CERT runs in your infrastructure. This gives you full data control and satisfies regulatory requirements for data residency.

**Q: Can I customize compliance reports?**

Yes. Reports are generated from audit logs. Create custom report templates using the log data:
```python
# Read audit log
import json
with open("cert_audit.jsonl") as f:
    entries = [json.loads(line) for line in f]

# Generate custom report
# Your custom logic here
```

---

## License

```
Copyright 2025 Javier Marín
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language.
```
See [LICENSE](LICENSE) file for details.

---

## Citation

If you use CERT Framework in research, please cite:
```bibtex
@software{cert_framework,
  title = {CERT Framework: Production Accuracy Monitoring for LLM Systems},
  author = {Javier Haus},
  year = {2025},
  url = {https://github.com/Javihaus/cert-framework}
}
```

---





