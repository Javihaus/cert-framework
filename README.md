# CERT Framework

**Production-ready LLM monitoring with automated EU AI Act Article 15 compliance**

<div align="center">
  <img src="docs/CERT.png" alt="CERT Framework" width="1000">
</div>

\
[**Why CERT**](#why-cert)
| [**Installation**](#installation)
| [**Quick Start**](#quick-start)
| [**Architecture**](#architecture)
| [**Evaluation**](#evaluation)
| [**Compliance Reports**](#compliance-reports)
| [**Comparison**](#comparison)
| [**API Reference**](#api-reference)
| [**Production Deployment**](#production-deployment)
| [**Performance**](#performance)
| [**Migration from v2.x**](#migration-from-v2x)
| [**FAQ**](#faq)
| [**License**](#license)

\
[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## Why CERT

The EU AI Act mandates accuracy documentation for high-risk AI systems. Article 15 requires "appropriate levels of accuracy" with documented evidence. Article 19 requires audit trails. Enforcement begins August 2, 2025.

CERT combines production monitoring with compliance automation. Think Langfuse for observability, plus automated Article 15 report generation. The monitoring features establish developer trust. The compliance features drive purchasing decisions.

**Core Value:**
- Developers get lightweight LLM monitoring (traces, performance metrics, error tracking)
- Compliance teams get automated Article 15 documentation (accuracy reports, audit trails, transparency requirements)
- One platform, two buyer personas, clear upgrade path from free to enterprise

**Design Philosophy:**

Monitoring should be invisible until you need it. The core tracer is 5MB with zero ML dependencies. Evaluation happens offline when you choose. Compliance reports generate from trace logs via CLI tools. Each concern is separate, testable, and optional.

This matters because most LLM monitoring tools force you to run evaluation models on every request. That adds latency, increases costs, and couples concerns that should be independent. We split them deliberately.

---

## Installation

Choose your installation based on what you need:
```bash
# Core monitoring only (5MB, zero ML dependencies)
pip install cert-framework

# Core + evaluation engines (150MB with transformers, torch, embeddings)
pip install cert-framework[evaluation]

# Core + specific integrations
pip install cert-framework[langchain]
pip install cert-framework[anthropic]
pip install cert-framework[openai]

# Everything (for development/testing)
pip install cert-framework[all]
```

The core package gives you structured trace logging with <1ms overhead per request. Install evaluation features when you need accuracy measurement. Install integrations only for frameworks you use.

This dependency model means your production containers stay small and your monitoring layer stays fast.

---

## Quick Start

### Monitoring: Three Lines
```python
from cert import trace

@trace(log_path="traces.jsonl")
def your_rag_pipeline(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}

# Call your function normally
result = your_rag_pipeline("What was Q4 revenue?")
```

That's it. Every call logs to `traces.jsonl` with timestamp, inputs, outputs, duration, and status. Works with any LLM provider. No magic, no auto-detection, no hidden ML models.

**What gets logged:**
```json
{
  "timestamp": "2025-01-15T14:23:11.847Z",
  "function": "your_rag_pipeline",
  "duration_ms": 234.5,
  "status": "success",
  "context": "Q4 revenue was $500M according to earnings report",
  "answer": "Q4 revenue reached $500 million",
  "metadata": {}
}
```

### Evaluation: Run Offline

Once you have traces, evaluate them on your schedule:
```bash
# Requires: pip install cert-framework[evaluation]

cert evaluate traces.jsonl \
  --preset financial \
  --threshold 0.8 \
  --output evaluation.json
```

This runs semantic similarity, NLI contradiction detection, and term grounding analysis on your logged traces. Takes ~200ms per trace. Run it hourly, daily, or on-demand. Not per-request.

### Compliance: Generate Reports
```bash
cert report traces.jsonl \
  --output article15_report.pdf \
  --system-name "Production RAG System" \
  --risk-level high \
  --format pdf
```

Generates EU AI Act Article 15 compliance documentation from your trace logs. Includes accuracy statistics, audit trail summary, and Article 19 record-keeping evidence.

---

## Architecture

CERT separates three concerns that are usually coupled:

### 1. Runtime Monitoring (Core)

The `@trace` decorator logs inputs, outputs, timing, and errors. Zero ML dependencies. <1ms overhead. Works everywhere.

**Why separate:** Monitoring must be lightweight and reliable. Loading 500MB of ML models to log a timestamp is wrong.

### 2. Offline Evaluation (Optional)

The `cert evaluate` command processes traces in batch. Runs semantic similarity (embeddings), contradiction detection (NLI), and term grounding analysis. Configurable thresholds per industry preset.

**Why offline:** Evaluation adds 50-200ms latency and requires ML models. Run it when you need it, not on every request.

### 3. Compliance Reporting (CLI)

The `cert report` command generates Article 15 documentation from trace logs. Markdown, HTML, or PDF output. Includes accuracy statistics, error rates, and audit trail summaries.

**Why CLI:** Compliance reports are generated periodically for auditors. They operate on aggregate data, not individual requests. Separate tool, separate schedule.

**Architecture Diagram:**
```
Your LLM App
    ↓
[@trace decorator] → traces.jsonl (5MB overhead, <1ms latency)
                         ↓
                    [cert evaluate] → evaluation.json (offline, 200ms/trace)
                         ↓
                    [cert report] → article15_report.pdf (periodic, for auditors)
```

This design means:
- Production stays fast (monitoring adds <1ms)
- Evaluation scales independently (run when you have capacity)
- Compliance integrates with existing workflows (reports on demand)

---

## Evaluation

Evaluation measures accuracy using three methods:

### 1. Semantic Similarity (30% weight)

Embedding-based cosine similarity between answer and context. Uses sentence-transformers (all-MiniLM-L6-v2 by default). Measures: does the answer semantically match the source material?

### 2. NLI Contradiction Detection (50% weight)

Natural Language Inference model checks if answer contradicts context. Uses microsoft/deberta-v3-base. Detects logical inconsistencies and hallucinations.

### 3. Term Grounding (20% weight)

Checks if terms in the answer appear in the context. Identifies claims not present in source material. Flags ungrounded statements.

### Industry Presets
```python
# Healthcare (EU AI Act Annex III high-risk)
cert evaluate traces.jsonl --preset healthcare
# Threshold: 0.85, strict grounding

# Financial services (high-risk)
cert evaluate traces.jsonl --preset financial
# Threshold: 0.80, balanced

# Legal systems (high-risk)
cert evaluate traces.jsonl --preset legal
# Threshold: 0.80, emphasis on grounding

# General purpose (low-risk)
cert evaluate traces.jsonl --preset general
# Threshold: 0.70, standard monitoring
```

Presets adjust thresholds and weights based on regulatory risk levels. Healthcare systems need higher accuracy than general chatbots.

### Custom Configuration
```python
from cert.evaluation import Evaluator

evaluator = Evaluator(
    preset="custom",
    threshold=0.85,
    semantic_weight=0.4,
    nli_weight=0.4,
    grounding_weight=0.2
)

results = evaluator.evaluate_log_file("traces.jsonl")
```

---

## Compliance Reports

Generate EU AI Act documentation:
```bash
# Article 15 compliance report
cert report traces.jsonl \
  --output compliance/article15_2025_q1.pdf \
  --system-name "Clinical Decision Support System" \
  --risk-level high \
  --format pdf

# Include evaluation metrics
cert report traces.jsonl \
  --output compliance/full_report.html \
  --system-name "Production RAG System" \
  --risk-level high \
  --format html \
  --include-evaluation evaluation.json
```

### Report Contents

**Article 15.1 - Accuracy Levels:**
- Total requests processed
- Success rate and error rate
- Accuracy distribution (if evaluation included)
- Threshold compliance percentage

**Article 15.4 - Resilience to Errors:**
- Error categorization and frequency
- Performance degradation tracking
- Recovery time statistics

**Article 19 - Record Keeping:**
- Audit trail summary
- Data retention confirmation
- Traceability evidence

Reports include timestamps, system identification, and operator declarations required for audit submissions.

---

## Comparison

| Feature | CERT | Langfuse | LangSmith | Helicone |
|---------|------|----------|-----------|----------|
| License | Apache 2.0 | Proprietary | Proprietary | MIT |
| Self-Hosted | Unlimited | Limited tiers | Cloud only | Limited |
| Core Size | 5MB | ~50MB | N/A | ~20MB |
| EU AI Act Compliance | Native Article 15 | Manual | Manual | Manual |
| Offline Evaluation | Yes | No | No | No |
| Deployment | Library + CLI | Service | Service | Proxy |
| Latency Overhead | <1ms | ~5ms | ~10ms | ~5ms |
| Multi-Framework | Yes | Yes | LangChain focus | Yes |
| Pricing | Freemium | Freemium | Pay-per-trace | Freemium |

**Why CERT vs Langfuse:**

Langfuse excels at observability and debugging. CERT adds compliance automation. If you need Article 15 documentation for EU AI Act audits, CERT handles it natively. If you just need traces and dashboards, Langfuse works fine.

Use both if you want: Langfuse for real-time dashboards, CERT for compliance reporting. They read the same trace formats.

---

## API Reference

### trace()

Decorator for monitoring function execution.
```python
def trace(
    _func: Optional[Callable] = None,
    *,
    log_path: str = "traces.jsonl",
    metadata: Optional[Dict] = None
) -> Callable
```

**Parameters:**
- `log_path` - Path to JSONL trace log file
- `metadata` - Additional metadata to include in traces

**Returns:** Decorated function that logs execution

**Example:**
```python
from cert import trace

@trace(log_path="production_traces.jsonl", metadata={"env": "prod"})
def process_query(query: str) -> Dict[str, str]:
    return {"context": "...", "answer": "..."}
```

### Evaluator

Batch evaluation of trace logs.
```python
from cert.evaluation import Evaluator

evaluator = Evaluator(
    preset: str = "general",
    threshold: float = 0.7
)

results = evaluator.evaluate_log_file(log_path: str)
```

**Methods:**
- `evaluate_trace(context, answer)` - Evaluate single trace
- `evaluate_log_file(log_path)` - Batch evaluate all traces

**Returns:** Dictionary with evaluation statistics

### ComplianceReporter

Generate EU AI Act reports.
```python
from cert.compliance import ComplianceReporter

reporter = ComplianceReporter(
    system_name: str,
    risk_level: str = "high"
)

report_path = reporter.generate_report(
    log_path: str,
    output_path: str,
    format: str = "pdf"
)
```

**Formats:** markdown, html, pdf

---

## Production Deployment

### Docker
```dockerfile
FROM python:3.11-slim

# Install core only for production
RUN pip install cert-framework

# Your application code
COPY . /app
WORKDIR /app

# Traces persist to mounted volume
CMD ["python", "app.py"]
```

Mount `/app/traces.jsonl` to persistent storage for log retention.

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: llm-service
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: your-service:latest
        volumeMounts:
        - name: trace-logs
          mountPath: /app/traces
      volumes:
      - name: trace-logs
        persistentVolumeClaim:
          claimName: cert-traces-pvc
```

Run `cert evaluate` and `cert report` as CronJobs for periodic compliance checks.

### Log Rotation

For high-volume systems, rotate trace logs:
```bash
# logrotate config
/app/traces.jsonl {
    daily
    rotate 90
    compress
    missingok
    notifempty
    copytruncate
}
```

Run evaluation before rotation to preserve metrics.

---

## Performance

### Latency

- **Core tracer:** <1ms per request (just JSON logging)
- **Evaluation:** 50-200ms per trace (semantic + NLI + grounding)
- **Report generation:** 1-10 seconds (depends on log size, format)

### Memory

- **Core:** <10MB (no ML models loaded)
- **Evaluation:** ~600MB (transformers + embeddings models)
- **Peak:** ~1GB during batch evaluation

### Throughput

- **Tracing:** >10,000 requests/second (I/O bound)
- **Evaluation:** 5-20 traces/second (ML bound)
- **Scale:** Run evaluation distributed across workers for higher throughput

### Model Loading

First evaluation call loads ML models (2-5 seconds). Subsequent calls are fast. Use lazy loading to defer this cost until evaluation runs.

---

## Migration from v2.x

Breaking changes in v3.0:

### 1. Dependencies Now Optional

**Before:**
```bash
pip install cert-framework  # 1.5GB
```

**After:**
```bash
pip install cert-framework  # 5MB
pip install cert-framework[evaluation]  # 150MB
```

### 2. Decorator Renamed

**Before:**
```python
@monitor(preset="financial")
```

**After:**
```python
@trace()  # Just monitoring
```

### 3. Evaluation Moved Offline

**Before:** Evaluation happened automatically in decorator

**After:** Run `cert evaluate` on your schedule

### 4. Compliance via CLI

**Before:**
```python
from cert import export_report
export_report("audit.jsonl", "report.pdf")
```

**After:**
```bash
cert report traces.jsonl -o report.pdf
```

**Migration Checklist:**
- [ ] Update installation: `pip install cert-framework[evaluation]`
- [ ] Replace `@monitor` with `@trace`
- [ ] Add offline evaluation pipeline
- [ ] Update compliance reporting to CLI
- [ ] Test with production traces

See [docs/migration-v2-to-v3.md](docs/migration-v2-to-v3.md) for complete guide.

---

## FAQ

**Does this work with any LLM provider?**

Yes. CERT monitors your application code, not specific APIs. Works with OpenAI, Anthropic, Cohere, self-hosted models, or any provider.

**What's the performance impact?**

<1ms per request for tracing. Evaluation runs offline on your schedule, so it doesn't affect production latency.

**Do I need to change my existing code?**

Minimal changes. Add the `@trace` decorator and ensure your function returns a dict with "context" and "answer" keys.

**Is this GDPR compliant?**

CERT logs queries and answers locally. You control data retention and storage. Follow your organization's GDPR policies for log management.

**Can I use custom evaluation metrics?**

Yes. Use `Evaluator` directly with custom weights, or extend `MeasurementResult` for domain-specific metrics.

**What about multilingual support?**

Default models (all-MiniLM-L6-v2, deberta-v3) support 50+ languages. For specialized domains, specify custom models in evaluation config.

**How do I handle high-traffic systems?**

1. Tracing scales horizontally (just file writes)
2. Sample traces if needed (monitor 10% of traffic)
3. Run evaluation distributed across workers
4. Use log rotation for retention management

**What's the difference between CERT and evaluation frameworks?**

Most tools focus on pre-deployment testing (prompt optimization, dataset benchmarking). CERT focuses on production monitoring with compliance automation. Use both: test prompts with eval tools, monitor production with CERT.

**Is there a hosted/SaaS version?**

Yes. Self-hosted is free (Apache 2.0). Hosted tiers start at €49/month with managed infrastructure and advanced compliance features. See pricing at [cert-framework.com](https://cert-framework.com).

**Can I customize compliance reports?**

Yes. Reports generate from trace logs. Extend `ComplianceReporter` or create custom report templates using the JSONL data.

---

## License
```
Copyright 2025 Javier Marín

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

See [LICENSE](LICENSE) file for complete terms.

---

## Citation

If you use CERT Framework in research, please cite:
```bibtex
@software{cert_framework,
  title = {CERT Framework: LLM Monitoring with EU AI Act Compliance},
  author = {Javier Marín},
  year = {2025},
  url = {https://github.com/yourusername/cert-framework},
  license = {Apache-2.0}
}
```

---

**Built for developers. Sold to compliance teams. Open source forever.**

[Documentation](https://docs.cert-framework.com) | [Examples](examples/) | [Discussions](https://github.com/yourusername/cert-framework/discussions) | [Enterprise](mailto:enterprise@cert-framework.com)




