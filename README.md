# CERT Framework

**EU AI Act Article 15 Compliance for LLM Systems**

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## Table of Contents

- [Introduction](#introduction)
- [The Solution](#the-solution)
- [Quick Start](#quick-start-60-seconds)
- [Three Use Cases](#three-use-cases)
- [Why CERT Framework](#why-cert-framework)
- [Installation](#installation)
- [Usage Examples](#usage-examples)
- [EU AI Act Compliance](#eu-ai-act-compliance)
- [Important Disclaimers](#important-disclaimers)
- [Advanced Features](#advanced-features-power-users)
- [Examples](#examples)
- [Development](#development)
- [Citation](#citation)
- [License](#license)
- [Contact](#contact)

---

## Introduction

Organizations deploying large language models in regulated industries face a critical challenge: the EU AI Act mandates "appropriate levels of accuracy" for high-risk AI systems under Article 15, yet provides no standardized metrics or implementation guidance. Compliance teams require evidence of accuracy monitoring and audit trails, while engineering teams need practical tools to measure and document system performance.

CERT Framework bridges this gap by providing automated accuracy monitoring, hallucination detection, and compliance documentation specifically designed for LLM systems operating under EU AI Act regulations. The framework addresses three primary compliance requirements: demonstrating appropriate accuracy levels (Article 15.1), ensuring system resilience (Article 15.4), and maintaining automatic audit logs (Article 19).

---

## The Solution

CERT Framework provides:

- **Automatic accuracy measurement** - Monitor LLM accuracy with one decorator
- **Hallucination detection** - Catch RAG hallucinations before production
- **Audit trails** - Automatic logging for Article 19 compliance
- **Plain-English reports** - Explain your AI system to compliance teams
- **Industry presets** - Pre-configured for finance, healthcare, general use

**Time to setup: 60 seconds**

---

## Quick Start (60 Seconds)

### 1. Install
```bash
pip install cert-framework
```

### 2. Wrap Your RAG Function
```python
import cert

@cert.monitor
def my_rag(query):
    context = retrieve(query)
    answer = llm(context, query)
    return {"context": context, "answer": answer}
```

### 3. Run Normally
```python
result = my_rag("What was Q4 revenue?")
```

### 4. See Compliance Status Automatically
```
CERT Framework Monitoring Enabled
============================================================
Function: my_rag
Accuracy threshold: 90%
Hallucination tolerance: 5%
Audit log: cert_audit.jsonl
EU AI Act Article 15: Ready for compliance
============================================================

After 100 requests:
Status Update - my_rag
------------------------------------------------------------
Total requests: 100
Hallucination rate: 2.1%
Compliance rate: 97.9%
Status: COMPLIANT
------------------------------------------------------------
```

**That's it.** You're now monitoring accuracy and building an audit trail for EU AI Act compliance.

---

## Three Use Cases

### 1. RAG Hallucination Detection (PRIMARY)

**Problem:** RAG systems hallucinate. Article 15 requires "appropriate levels of accuracy."

**Solution:** Automatic hallucination detection with `@cert.monitor`

```python
import cert

@cert.monitor(preset="financial")  # Strict: 95% accuracy, <1% hallucinations
def financial_rag(query):
    context = vector_db.retrieve(query)
    answer = llm.generate(context=context, query=query)
    return {"context": context, "answer": answer}

# Automatic hallucination detection
# Automatic audit trail
# Alerts on non-compliance
```

**What it monitors:**
- Semantic accuracy - Does answer match context meaning?
- NLI contradiction - Does answer contradict context?
- Grounding - Is answer grounded in provided context?
- Hallucination rate - How often does model hallucinate?

**Industry Presets:**
```python
@cert.monitor(preset="financial")   # 95% accuracy, <1% hallucinations, 7yr retention
@cert.monitor(preset="healthcare")  # 98% accuracy, <0.5% hallucinations, 10yr retention
@cert.monitor(preset="general")     # 90% accuracy, <5% hallucinations, 6mo retention
```

---

### 2. Single Model Accuracy Verification

**Problem:** Article 15 requires you to measure and document model accuracy.

**Solution:** Verify expected vs actual outputs

```python
import cert

@cert.monitor
def customer_service_bot(user_message):
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": user_message}]
    )
    return response.choices[0].message.content

# Monitor accuracy against expected outputs
# Build audit trail for Article 15
```

---

### 3. Multi-Agent Coordination Monitoring

**Problem:** Multi-agent systems (LangChain, AutoGen, CrewAI) behave unpredictably. Are 2 agents better than 1?

**Solution:** Measure coordination effectiveness with gamma metric

```python
import cert

# Define your agents
def agent_a(prompt: str) -> str:
    return model_a.generate(prompt)

def agent_b(prompt: str) -> str:
    return model_b.generate(prompt)

# Define coordinated system
def coordinated_system(prompt: str) -> str:
    output_a = agent_a(prompt)
    return agent_b(f"Refine: {output_a}")

# Measure coordination effectiveness
result = cert.measure_coordination(
    agent_a=agent_a,
    agent_b=agent_b,
    coordinated_func=coordinated_system,
    test_prompts=["Analyze X", "Evaluate Y"],
    trials_per_agent=10
)

print(f"Gamma: {result.gamma:.3f}")
print(result.recommendation)
# Output: "Coordination is HELPING (+15% improvement)"
```

**Gamma (γ) Interpretation:**
- γ > 1.0: Coordination helps (keep multi-agent system)
- γ < 1.0: Coordination hurts (use single agent instead)
- γ ≈ 1.0: No coordination effect

---

## Why CERT Framework?

### For Engineers

**Before CERT:**
- Read 200-page EU AI Act regulation
- Guess what "appropriate accuracy" means
- Manually log every LLM call
- Build custom monitoring from scratch
- Explain technical metrics to compliance team

**After CERT:**
- Add one decorator: `@cert.monitor`
- Get compliance metrics automatically
- Export plain-English reports for compliance team
- Done in 60 seconds

### For Compliance Teams

**What you get:**
- Automatic audit trail (Article 19 requirement)
- Plain-English compliance reports
- Evidence of "appropriate accuracy" (Article 15.1)
- Evidence of error resilience (Article 15.4)
- 6-month minimum retention (configurable)

**Export compliance report:**
```python
cert.export_report("compliance_report.txt")
# Supported formats: .txt, .json, .csv
```

Generates:
```
EU AI ACT ARTICLE 15 COMPLIANCE REPORT
======================================
System: Customer Service RAG
Period: Jan 1 - Jan 31, 2025

ACCURACY METRICS (Article 15.1)
- Semantic accuracy: 94.2%
- Hallucination rate: 2.3%
- Grounding score: 96.1%
COMPLIANT (above 90% threshold)

ROBUSTNESS (Article 15.4)
- Error rate: 0.8%
- Timeout rate: 0.1%
COMPLIANT (below 5% threshold)

AUDIT TRAIL (Article 19)
- 45,231 requests logged
- Retention: 6 months
COMPLIANT
```

---

## Installation

```bash
pip install cert-framework
```

**Requirements:**
- Python 3.8+
- ~2GB RAM (embedding + NLI models)
- First run downloads models (~920MB), cached afterward

---

## Usage Examples

### Zero Config (Smart Defaults)
```python
@cert.monitor
def my_rag(query):
    return rag_pipeline(query)
```

### Industry Preset
```python
@cert.monitor(preset="financial")
def financial_rag(query):
    return rag_pipeline(query)
```

### Custom Configuration
```python
@cert.monitor(
    accuracy_threshold=0.95,
    hallucination_tolerance=0.01,
    alert_on_hallucination=True,
    audit_log="custom_audit.jsonl",
    explain=True  # Shows what each metric means
)
def custom_rag(query):
    return rag_pipeline(query)
```

### Generate Compliance Reports
```python
import cert

# Export compliance report (uses cert_audit.jsonl by default)
cert.export_report(
    output_path="compliance_report.txt",
    system_name="Customer Service RAG",
    format="txt"  # or "json", "csv"
)

# Show report in terminal
cert.show_report()
```

---

## EU AI Act Compliance

CERT Framework aligns with EU AI Act requirements for high-risk AI systems:

### Article 15: Accuracy, Robustness, Cybersecurity

**Article 15.1** - "Appropriate levels of accuracy"
- CERT measures semantic accuracy, hallucination rate, grounding
- Configurable thresholds (90%, 95%, 98%)
- Automatic compliance status

**Article 15.3** - "Accuracy metrics declared in instructions"
- CERT generates plain-English accuracy reports
- Exportable for documentation

**Article 15.4** - "Resilient regarding errors, faults, inconsistencies"
- CERT tracks error rates, timeout rates
- Robustness monitoring

### Article 19: Automatically Generated Logs

**Article 19.1** - "Automatic recording of events"
- CERT logs every request to `cert_audit.jsonl`
- Timestamped, immutable records
- Minimum 6-month retention (configurable)

**Article 19.2** - "Enable identifying situations that may result in risk"
- CERT flags hallucinations, contradictions
- Alerts on non-compliance

---

## Important Disclaimers

**CERT is a technical tool, not legal advice.**

- Using CERT does not guarantee EU AI Act compliance
- Compliance requires organizational processes beyond technical tools
- High-risk classification depends on your specific use case
- Seek professional legal advice for compliance strategy
- CERT supports compliance documentation but does not constitute legal compliance

**Official EU AI Act Resources:**
- [Article 15 Full Text](https://artificialintelligenceact.eu/article/15/)
- [Article 19 Full Text](https://artificialintelligenceact.eu/article/19/)
- [Compliance Checker](https://artificialintelligenceact.eu/assessment/eu-ai-act-compliance-checker/)

---

## Advanced Features (Power Users)

### Direct Accuracy Measurement
```python
from cert import measure

result = measure(
    text1="Expected output",
    text2="Actual output",
    use_semantic=True,
    use_nli=True,
    use_grounding=True
)

print(f"Match: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
```

### Cost Tracking
```python
import cert

@cert.cost_tracker
def my_llm_call(prompt):
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response

# Automatic token/cost extraction from response
summary = cert.get_cost_summary()
print(f"Total cost: ${summary['total_cost']:.4f}")
print(f"Total tokens: {summary['total_input_tokens'] + summary['total_output_tokens']}")
```

### Multi-Agent Coordination
```python
import cert

# Define individual agents
def agent_a(prompt: str) -> str:
    return model_a.generate(prompt)

def agent_b(prompt: str) -> str:
    return model_b.generate(prompt)

# Define coordinated system
def coordinated_system(prompt: str) -> str:
    output_a = agent_a(prompt)
    return agent_b(f"Improve this: {output_a}")

# Measure coordination effectiveness
result = cert.measure_coordination(
    agent_a=agent_a,
    agent_b=agent_b,
    coordinated_func=coordinated_system,
    test_prompts=["Analyze X", "Evaluate Y"],
    trials_per_agent=10
)

print(f"Gamma (γ): {result.gamma:.3f}")
print(result.recommendation)
```

---

## Examples

Complete runnable examples in `examples/v2/`:

- **quickstart_rag.py** - 60-second RAG monitoring quickstart
- **quickstart_cost_tracking.py** - Automatic cost tracking
- **quickstart_compliance_reports.py** - Generate compliance reports
- **quickstart_coordination.py** - Multi-agent coordination monitoring
- **example_measure.py** - Direct accuracy measurement API
- **example_cost_tracker.py** - Advanced cost tracking patterns
- **example_agent_monitor.py** - Single model monitoring patterns

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

---

## Citation

If you use CERT in research:

```bibtex
@software{cert_framework,
  author = {Marin, Javier},
  title = {CERT Framework: EU AI Act Compliance for LLM Systems},
  url = {https://github.com/Javihaus/cert-framework},
  version = {2.0.0},
  year = {2025}
}
```

---

## License

ISC License - see LICENSE file

---

## Contact

For inquiries or consulting: info@cert-framework.com

GitHub Issues: https://github.com/Javihaus/cert-framework/issues
