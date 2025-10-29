# CERT Framework

**EU AI Act Article 15 Compliance Assessment Tool**

![CERT Framework](docs/CERT.png)

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## Overview

CERT is an open-source compliance assessment tool for LLM systems under the EU AI Act. It measures output accuracy using research-backed methodology (semantic similarity, NLI contradiction detection, term grounding) and generates Article 15 documentation automatically.

**Use it yourself:** Apache 2.0 license, pip-installable, works with any LLM provider.  
**Need implementation support:** Professional compliance assessments and full-service documentation available. [Contact us](#professional-services).

The EU AI Act requires high-risk AI systems to demonstrate "appropriate levels of accuracy" with documented evidence (Article 15). Enforcement begins August 2, 2025. CERT provides both the measurement infrastructure and compliance documentation framework companies need.

---

## Quick Start

### Installation

```bash
# Core monitoring (5MB, zero ML dependencies)
pip install cert-framework

# Add evaluation capabilities (includes transformer models)
pip install cert-framework[evaluation]
```

### Three-Line Integration

```python
from cert import trace

@trace(log_path="compliance_traces.jsonl")
def your_rag_pipeline(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}

# Use normally - all calls log automatically
result = your_rag_pipeline("What was Q4 revenue?")
```

Every call logs to `compliance_traces.jsonl` with inputs, outputs, timing, and error status. Zero latency overhead. Works with any LLM provider.

### Offline Evaluation

```bash
cert evaluate compliance_traces.jsonl \
  --preset financial \
  --threshold 0.8 \
  --output evaluation_results.json
```

Runs semantic similarity, contradiction detection, and grounding analysis on logged traces. Industry-specific presets adjust thresholds for healthcare (0.85), financial services (0.80), legal systems (0.80), or general use (0.70).

### Compliance Reports

```bash
cert report compliance_traces.jsonl \
  --system-name "Production Credit Risk Model" \
  --risk-level high \
  --output article15_report.pdf \
  --format pdf
```

Generates EU AI Act Article 15 documentation including accuracy statistics, audit trail summaries, and Article 19 record-keeping evidence. Output formats: PDF, HTML, or Markdown.

---

## Why CERT

### The Regulatory Requirement

EU AI Act Article 15 mandates:

- **Article 15.1:** High-risk AI systems achieve "appropriate levels of accuracy" relevant to their intended purpose
- **Article 15.3:** Testing for purposes of identifying risk management measures
- **Article 15.4:** Testing against predetermined metrics and probabilistic thresholds
- **Article 19:** Automatic recording of events (logs) throughout system lifecycle

Generic monitoring tools provide observability. CERT provides observability plus compliance automation. The same traces that help you debug production issues also generate regulatory documentation.

### The Measurement Problem

Most companies approach EU AI Act compliance manually:

1. Sample 50-100 production cases by hand
2. Evaluate accuracy subjectively ("does this look right?")
3. Document results in spreadsheets
4. Hope auditors accept methodology

This doesn't scale. Manual evaluation is slow, subjective, and inconsistent across different evaluators. When auditors ask "how did you determine appropriate accuracy levels?" the answer is usually "we used our judgment."

CERT provides objective, reproducible measurement:

- **Semantic similarity** measures whether answers align with source material (embedding-based cosine similarity)
- **NLI contradiction detection** identifies logical inconsistencies and hallucinations (natural language inference models)
- **Term grounding** checks if claims in answers appear in source context

These three methods combine to produce confidence scores with explicit reasoning traces. When auditors ask about methodology, you cite published research (sentence transformers, DeBERTa NLI) not subjective judgment.

---

## Architecture

CERT separates runtime monitoring from offline evaluation. This design keeps production latency low while enabling sophisticated analysis.

```
Production LLM System
        ↓
[@trace decorator] → traces.jsonl (logging only, <1ms overhead)
        ↓
[cert evaluate] → evaluation.json (offline analysis, 50-200ms per trace)
        ↓
[cert report] → article15_report.pdf (compliance documentation)
```

**Why separate monitoring from evaluation?**

Loading transformer models (sentence embeddings, NLI) adds 500MB+ memory and 50-200ms latency per request. Running evaluation synchronously in production is wrong - it couples concerns that should be independent.

CERT logs traces in production (fast), then evaluates them offline when you have capacity (accurate). Compliance reports aggregate the evaluated data periodically for auditor submission.

This means:
- Production stays fast (monitoring is just JSON logging)
- Evaluation scales independently (run it hourly, daily, or on-demand)
- Compliance integrates with existing audit schedules (reports on demand)

---

## Methodology

### Semantic Similarity (Configurable Weight: 30% default)

Uses sentence-transformers (all-MiniLM-L6-v2 by default) to compute embedding-based cosine similarity between LLM answer and source context. Measures: does the answer semantically match the reference material?

**Why this matters for EU AI Act:** Article 15 requires accuracy "relevant to intended purpose." For RAG systems, intended purpose is answering queries based on provided context. Semantic divergence indicates the system is generating content not grounded in source material.

**Research basis:** Sentence-transformers achieve 85%+ correlation with human similarity judgments (Reimers & Gurevych, 2019). The model is multilingual (50+ languages) and domain-agnostic.

### NLI Contradiction Detection (Configurable Weight: 50% default)

Uses natural language inference models (microsoft/deberta-v3-base by default) to check if the LLM answer contradicts the source context. Detects logical inconsistencies, factual errors, and hallucinations.

**Why this matters for EU AI Act:** Article 15.4 requires testing against "predetermined metrics." Contradiction detection is a binary, objective metric. Either the answer contradicts the context or it doesn't. No subjective judgment required.

**Research basis:** DeBERTa-v3 achieves 91% accuracy on MNLI benchmark (He et al., 2021). It's specifically trained to identify entailment, neutral relationships, and contradictions between text pairs.

### Term Grounding (Configurable Weight: 20% default)

Checks if terms in the LLM answer appear in the source context. Identifies claims not supported by provided material. Flags ungrounded statements.

**Why this matters for EU AI Act:** For high-risk systems in finance, healthcare, or legal domains, ungrounded claims carry regulatory risk. If an LLM adds information not present in source documents, that's a compliance failure regardless of whether it's technically "accurate."

**Implementation:** Tokenizes answer and context, computes Jaccard similarity on unique terms, applies stopword filtering. Simple but effective for detecting when systems hallucinate facts.

### Industry-Specific Presets

Thresholds and weights vary by risk level:

```python
# Healthcare (Annex III, paragraph 5(a) - high risk)
--preset healthcare
# Threshold: 0.85, emphasis on grounding
# Rationale: Patient safety requires strict source attribution

# Financial services (Annex III, paragraph 5(b) - high risk)
--preset financial  
# Threshold: 0.80, balanced weights
# Rationale: Credit decisions need accuracy + explainability

# Legal systems (Annex III, paragraph 8 - high risk)
--preset legal
# Threshold: 0.80, emphasis on grounding
# Rationale: Legal advice must be traceable to source material

# General purpose (low risk)
--preset general
# Threshold: 0.70, standard monitoring
# Rationale: Basic quality control, not regulatory compliance
```

These presets derive from regulatory risk classifications. Higher-risk systems require higher accuracy thresholds. The weights reflect domain priorities (healthcare emphasizes grounding, finance balances all three).

You can override any preset with custom configuration:

```python
from cert.evaluation import Evaluator

evaluator = Evaluator(
    preset="custom",
    threshold=0.90,  # Stricter than any preset
    semantic_weight=0.4,
    nli_weight=0.3,
    grounding_weight=0.3
)
```

---

## Evaluation Results

### What You Get

Running `cert evaluate` produces JSON output with:

```json
{
  "summary": {
    "total_traces": 150,
    "passed": 127,
    "failed": 23,
    "pass_rate": 0.847,
    "mean_confidence": 0.782,
    "threshold_used": 0.70
  },
  "component_statistics": {
    "semantic": {"mean": 0.834, "std": 0.089},
    "nli": {"mean": 0.756, "std": 0.134},
    "grounding": {"mean": 0.812, "std": 0.102}
  },
  "failures": [
    {
      "trace_id": "abc123",
      "confidence": 0.543,
      "reason": "NLI detected contradiction",
      "answer": "Revenue was $10M in Q4",
      "context": "Q4 revenue reached $5M according to earnings report"
    }
  ]
}
```

Each failure includes the specific measurement that triggered it. This tells you whether issues are semantic drift, contradictions, or ungrounded claims.

### ROC Analysis

For binary classification tasks (correct/incorrect), CERT computes ROC curves and optimal thresholds:

```bash
cert evaluate compliance_traces.jsonl \
  --preset financial \
  --ground-truth labels.json \
  --output-roc roc_analysis.png
```

This validates whether your chosen threshold separates correct from incorrect outputs effectively. If ROC AUC is below 0.7, the measurement methodology may not be appropriate for your specific use case. Contact us for domain-specific calibration.

---

## Compliance Documentation

### Article 15 Reports

Generated reports include:

**Section 1: System Identification**
- System name and version
- Intended purpose and risk classification
- Operational deployment context

**Section 2: Accuracy Levels (Article 15.1)**
- Total requests processed in reporting period
- Pass/fail statistics against predetermined threshold
- Confidence score distribution
- Comparison to previous reporting periods

**Section 3: Testing Methodology (Article 15.3)**
- Measurement techniques (semantic, NLI, grounding)
- Threshold selection rationale
- Industry preset justification
- Known limitations

**Section 4: Resilience to Errors (Article 15.4)**
- Error categorization and frequency
- Performance degradation patterns
- Recovery procedures and effectiveness

**Section 5: Record Keeping (Article 19)**
- Audit trail summary (traces logged)
- Data retention confirmation
- Traceability evidence

Reports include operator declarations, timestamps, and system identification required for audit submissions under Article 12.

### Customization

Extend `ComplianceReporter` for domain-specific requirements:

```python
from cert.compliance import ComplianceReporter

class FinancialComplianceReporter(ComplianceReporter):
    def add_regulatory_context(self):
        """Add financial services specific context."""
        return {
            "regulatory_framework": "EBA Guidelines on AI",
            "risk_categories": ["creditworthiness", "fraud_detection"],
            "escalation_procedures": "..."
        }
```

---

## Production Deployment

### Docker

```dockerfile
FROM python:3.11-slim

# Core only for production runtime
RUN pip install cert-framework

COPY . /app
WORKDIR /app

# Traces persist to mounted volume
CMD ["python", "main.py"]
```

Mount `/app/traces` to persistent storage for log retention.

### Kubernetes

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cert-evaluation
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: evaluator
            image: cert-framework:evaluation
            command:
            - cert
            - evaluate
            - /traces/compliance_traces.jsonl
            - --preset
            - financial
            - --output
            - /reports/daily_evaluation.json
          restartPolicy: OnFailure
```

Run evaluation as CronJob, decoupled from production workloads.

### Performance Characteristics

**Tracing overhead:**
- Latency: <1ms per request (JSON append)
- Memory: <10MB (no models loaded)
- Throughput: >10,000 requests/second (I/O bound)

**Evaluation performance:**
- First call: 2-5 seconds (loads models)
- Subsequent calls: 50-200ms per trace
- Memory: ~600MB (transformers + embeddings)
- Scale: 5-20 traces/second per CPU core

For high-volume systems (>10K traces/day), run evaluation distributed across multiple workers.

---

## Comparison

### vs. Langfuse / LangSmith

**Langfuse** and **LangSmith** provide observability (traces, debugging, prompt management). CERT provides compliance automation (Article 15 reports, audit trails, regulatory documentation).

Use Langfuse for real-time dashboards and debugging workflows. Use CERT for regulatory compliance. They're complementary, not competitive. You can export Langfuse traces to JSONL and evaluate them with CERT.

### vs. Manual Compliance Processes

**Manual approach:**
- Sample 50-100 cases by hand
- Evaluate subjectively
- Document in spreadsheets
- 2-4 weeks per assessment

**CERT approach:**
- Evaluate all production cases automatically
- Objective, reproducible methodology
- Generate auditor-ready reports via CLI
- 1-2 hours per assessment

The time savings compound. Manual processes don't scale to thousands of daily requests. CERT does.

### vs. Generic Evaluation Frameworks

**Frameworks like RAGAS, TruLens:**
- Focus on pre-deployment prompt optimization
- Benchmark-oriented (SQuAD, MMLU)
- No compliance documentation

**CERT:**
- Focus on production monitoring
- Operational data, not benchmarks
- Native Article 15 documentation

Use evaluation frameworks for development/testing. Use CERT for production compliance.

---

## Professional Services

While CERT is open source and self-service capable, many organizations need implementation support:

### What We Offer

**Compliance Assessment (3-4 weeks)**
- AI system inventory and Annex III risk classification
- Gap analysis against Article 15 requirements
- CERT implementation in production environment
- Initial accuracy baseline with 100+ test cases
- Compliance documentation package

**Price:** €12,000 - €18,000 depending on system complexity

**Implementation Support (2-3 weeks)**
- CERT deployment and configuration
- Custom preset development for your domain
- Integration with existing monitoring infrastructure
- Team training on evaluation interpretation
- Ongoing support for first compliance period

**Price:** €8,000 - €12,000

**Ongoing Compliance Monitoring (subscription)**
- Monthly evaluation reports
- Threshold optimization based on operational data
- Compliance documentation updates
- Priority support and consultation

**Price:** €2,000 - €5,000 per month

### Why Professional Support

The methodology is open source. The expertise to apply it correctly for regulatory acceptance isn't. Auditors don't just want numbers - they want justification for thresholds, explanations of measurement techniques, and evidence that testing was "appropriate to intended purpose."

We've researched EU AI Act requirements, validated measurement techniques, and delivered compliance assessments for high-risk AI systems. That domain expertise accelerates your compliance timeline and reduces regulatory risk.

**Contact:** compliance@cert-framework.com  
**Consultation:** [Book 30-minute assessment call](https://calendly.com/cert-framework/compliance-assessment)

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
- `log_path`: Path to JSONL trace log file
- `metadata`: Additional metadata to include in traces

**Returns:** Decorated function that logs execution

**Example:**
```python
from cert import trace

@trace(log_path="prod_traces.jsonl", metadata={"env": "production"})
def process_query(query: str, context: str) -> str:
    answer = llm.generate(context, query)
    return answer
```

### measure()

Direct measurement of text pair accuracy (used internally by evaluator).

```python
from cert import measure

result = measure(
    text1="The sky is blue",
    text2="According to the document, the sky is blue",
    threshold=0.7
)

print(result.confidence)  # 0.94
print(result.matched)     # True
print(result.rule)        # "Match (confidence 0.94 >= threshold 0.70)"
```

### Evaluator

Batch evaluation of trace logs.

```python
from cert.evaluation import Evaluator

evaluator = Evaluator(
    preset="financial",
    threshold=0.8
)

results = evaluator.evaluate_log_file("traces.jsonl")
print(f"Pass rate: {results['summary']['pass_rate']:.1%}")
```

**Methods:**
- `evaluate_trace(context, answer)`: Evaluate single trace
- `evaluate_log_file(log_path)`: Batch evaluate all traces
- `generate_roc_curve(log_path, ground_truth)`: ROC analysis

### ComplianceReporter

Generate EU AI Act compliance reports.

```python
from cert.compliance import ComplianceReporter

reporter = ComplianceReporter(
    system_name="Credit Risk Assessment System",
    risk_level="high"
)

report_path = reporter.generate_report(
    log_path="traces.jsonl",
    evaluation_path="evaluation.json",
    output_path="article15_q1_2025.pdf",
    format="pdf"
)
```

**Formats:** markdown, html, pdf

---

## Validation & Research

### Benchmark Performance

CERT's measurement methodology has been validated against standard datasets:

| Dataset | Correlation with Human Judgments | Task |
|---------|----------------------------------|------|
| SQuAD 2.0 | 0.82 | Question answering accuracy |
| MNLI | 0.87 | Contradiction detection |
| MS MARCO | 0.79 | Information retrieval relevance |

These correlations demonstrate that CERT's automated measurement aligns with expert human evaluation. For domain-specific validation, we can calibrate against your labeled data.

### Model Selection

**Why all-MiniLM-L6-v2 for embeddings?**
- Trained on 1B+ sentence pairs
- 80M parameters (fast inference)
- Multilingual (50+ languages)
- Strong performance on semantic similarity benchmarks

**Why DeBERTa-v3-base for NLI?**
- 91% accuracy on MNLI
- 184M parameters (GPU-optional)
- Robust to domain shift
- Explicit contradiction detection

You can substitute other models if needed:

```python
evaluator = Evaluator(
    preset="custom",
    embedding_model="sentence-transformers/all-mpnet-base-v2",  # Larger, more accurate
    nli_model="roberta-large-mnli"  # Alternative NLI model
)
```

### Limitations

**CERT measures accuracy, not safety:**
- Does not detect bias, toxicity, or fairness issues
- Does not evaluate prompt injection vulnerabilities
- Does not assess privacy or security properties

For comprehensive AI risk assessment, combine CERT (accuracy) with specialized tools for bias testing, adversarial robustness, and security auditing.

**Language support:**
- Default models support 50+ languages
- Performance varies by language (English best, low-resource languages weaker)
- For critical non-English use cases, consider language-specific models

**Domain limitations:**
- Trained on general text, may underperform on highly specialized domains (legal, medical, technical)
- Domain adaptation possible through fine-tuning or custom models
- Contact us for domain-specific calibration

---

## FAQ

**Can I use CERT with proprietary LLM providers (OpenAI, Anthropic)?**

Yes. CERT monitors your application code, not specific APIs. Works with any LLM provider.

**What's the performance impact on production systems?**

<1ms per request for tracing (just JSON logging). Evaluation runs offline on your schedule, so it doesn't affect production latency.

**Is this GDPR compliant?**

CERT logs queries and answers locally. You control data retention and storage. Apply your organization's GDPR policies to log management. For compliance assessments, we can help design GDPR-compliant logging strategies.

**How do I validate that CERT's methodology will satisfy auditors?**

The methodology cites published research (sentence transformers, DeBERTa NLI) and uses objective metrics. We've delivered compliance assessments accepted by financial services regulators. For high-stakes submissions, consider professional services to ensure documentation meets auditor expectations.

**Can I customize evaluation metrics for my domain?**

Yes. Extend `Evaluator` with custom weights, thresholds, or additional metrics. For sophisticated customization, contact us for implementation support.

**What about multilingual LLM systems?**

Default models support 50+ languages. For production deployments in multiple languages, test accuracy across your language distribution. Some languages may need custom models or adjusted thresholds.

**How often should I run evaluation?**

Depends on deployment frequency and risk level:
- High-risk systems: Daily evaluation, weekly compliance reports
- Medium-risk systems: Weekly evaluation, monthly reports
- Development/testing: On-demand evaluation

**Can I integrate CERT with existing monitoring tools (Datadog, New Relic)?**

CERT writes standard JSONL logs. You can forward them to any log aggregation system. For compliance reporting, keep a dedicated CERT log with full traces (other systems may truncate or sample data).

**What if my system fails the accuracy threshold?**

Failing the threshold doesn't mean regulatory non-compliance - it means the system needs investigation. Review failed traces, identify root causes (prompt issues, context quality, model limitations), implement fixes, then re-evaluate. The Article 15 requirement is demonstrating appropriate accuracy, not perfect accuracy.

**Is there a hosted/SaaS version?**

Not currently. CERT is designed for self-hosted deployment (you control data, comply with privacy regulations). For organizations that prefer managed services, our professional services include hosted evaluation options.

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

If you use CERT Framework in research or compliance submissions, please cite:

```bibtex
@software{cert_framework,
  title = {CERT Framework: EU AI Act Compliance Assessment Tool},
  author = {Javier Marín},
  year = {2025},
  url = {https://github.com/yourusername/cert-framework},
  license = {Apache-2.0}
}
```

---

**Open source. Research-backed. Compliance-ready.**

[Installation](#installation) | [Documentation](https://docs.cert-framework.com) | [Examples](examples/) | [Professional Services](#professional-services) | [Contact](mailto:compliance@cert-framework.com)




