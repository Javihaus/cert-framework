# CERT Framework

**EU AI Act Article 15 Compliance for LLM Systems**

# CERT Framework

<div align="center">
  <img src="docs/CERT.png" alt="" width="800">
</div>

\
[**What is CERT**](#what-is-cert)
| [**Quick Start**](#quick-start)
| [**Use cases**](#three-use-cases)
| [**Why CERT?**](#why-cert-framework)
| [**Installation**](#installation)
| [**Examples**](#examples)
| [**EU AI Act Compliance**](#eu-ai-act-compliance)
| [**Important Disclaimers**](#important-disclaimers)
| [**Advanced Features**](#advanced_feature)
| [**Development**](#development)
| [**Citation**](#citation)
| [**Contact**](#contact)


[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)
---



---

## What is CERT

CERT Framework provides:

- **Automatic accuracy measurement** - Monitor LLM accuracy with one decorator
- **Hallucination detection** - Catch RAG hallucinations before production
- **Audit trails** - Automatic logging for Article 19 compliance
- **Plain-English reports** - Explain your AI system to compliance teams
- **Industry presets** - Pre-configured for finance, healthcare, general use

---

## Quick Start 

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
✓ CERT Framework Monitoring Enabled
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
Status: ✓ COMPLIANT
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

@cert.monitor(preset="financial")  # Stricter thresholds for financial compliance
def financial_rag(query):
    context = vector_db.retrieve(query)
    answer = llm.generate(context=context, query=query, temperature=0.0)
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
@cert.monitor(preset="financial")   # Stricter thresholds, 7yr audit retention
@cert.monitor(preset="healthcare")  # Strictest thresholds, 10yr audit retention
@cert.monitor(preset="general")     # Balanced thresholds, 6mo audit retention
```

Preset thresholds are configurable starting points based on regulatory requirements.
Accuracy thresholds should be validated through testing on your specific use case.

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

**Problem:** Multi-agent systems (LangChain, AutoGen, CrewAI) behave unpredictably. Are 3 agents better than 1?

**Solution:** Measure coordination effectiveness

```python
import cert

# Coming in Phase 2
# Coordination monitoring with γ (gamma) metric
# Measures: coordinated_performance / independent_performance
```

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
cert.export_report("compliance_report.pdf")
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
✓ COMPLIANT (above 90% threshold)

ROBUSTNESS (Article 15.4)
- Error rate: 0.8%
- Timeout rate: 0.1%
✓ COMPLIANT (below 5% threshold)

AUDIT TRAIL (Article 19)
- 45,231 requests logged
- Retention: 6 months
✓ COMPLIANT
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

## Examples

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
    explain=True  # Shows what each metric means
)
def custom_rag(query):
    return rag_pipeline(query)
```

### View Statistics
```python
# Programmatic access (coming soon)
stats = cert.get_statistics()
print(f"Hallucination rate: {stats['hallucination_rate']:.1%}")
print(f"Compliance rate: {stats['compliance_rate']:.1%}")
```

---

## EU AI Act Compliance

CERT Framework aligns with EU AI Act requirements for high-risk AI systems:

### Article 15: Accuracy, Robustness, Cybersecurity

**Article 15.1** - "Appropriate levels of accuracy"
- ✓ CERT measures semantic accuracy, hallucination rate, grounding
- ✓ Configurable thresholds (90%, 95%, 98%)
- ✓ Automatic compliance status

**Article 15.3** - "Accuracy metrics declared in instructions"
- ✓ CERT generates plain-English accuracy reports
- ✓ Exportable for documentation

**Article 15.4** - "Resilient regarding errors, faults, inconsistencies"
- ✓ CERT tracks error rates, timeout rates
- ✓ Robustness monitoring




## EU AI Act Compliance

CERT provides technical capabilities aligned with EU AI Act requirements for high-risk AI systems.

**Regulation:** EU 2024/1689 (August 1, 2024 entry into force; August 2, 2026 compliance deadline for high-risk systems)


### [Article 15: Accuracy, Robustness, Cybersecurity](https://artificialintelligenceact.eu/article/15/)**
- Systems must achieve "appropriate levels of accuracy" (Art. 15.1)
- Accuracy metrics must be "declared in accompanying instructions" (Art. 15.3)
- Systems must be "resilient regarding errors, faults or inconsistencies" (Art. 15.4)

**Error Detection (Article 15.1)**
CERT's NLI contradiction detection and energy scoring provide systematic error detection. Creates audit trails supporting compliance documentation.

**Accuracy Documentation (Article 15.3)**
TestRunner and CERTAgentEngine generate reportable metrics: contradiction rate, consistency score, latency profiles. These metrics support accuracy declarations required by the regulation.

### [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)** / **[Article 19: Automatically Generated Logs](https://artificialintelligenceact.eu/article/19/)**
- "Automatic recording of events over the lifetime of the system" (Art. 12.1)
- Logs must enable "identifying situations that may result in risk" (Art. 12.2.a)
- Logs must "facilitate post-market monitoring" (Art. 12.2.b)
- Providers must retain logs for "at least six months" (Art. 19.1)

### Article 19: Automatically Generated Logs

**Article 19.1** - "Automatic recording of events"
* CERT logs every request to `cert_audit.jsonl`
* Timestamped, immutable records
* Minimum 6-month retention (configurable)

**Article 19.2** - "Enable identifying situations that may result in risk"
- ✓ CERT flags hallucinations, contradictions
- ✓ Alerts on non-compliance

**Audit Trails (Article 12 & 19)**
Test results create timestamped records for system verification. Export results to your logging infrastructure for 6+ month compliance retention.

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

### Cost Tracking (Coming Soon)
```python
@cert.cost_tracker
def my_llm_call(prompt):
    return openai.chat.completions.create(...)

# Automatic token/cost tracking
```

### Multi-Agent Coordination (Coming Soon)
```python
from cert import coordinate_agents

result = coordinate_agents(
    agents=[agent_a, agent_b, agent_c],
    task="Analyze business scenario"
)

print(f"Coordination effect (γ): {result.gamma}")
print(f"Emergence (Ω): {result.omega}")
```

---


Complete examples in `examples/v2/`:

- **quickstart_rag.py** - RAG monitoring quickstart
- **example_measure.py** - Direct accuracy measurement
- **example_cost_tracker.py** - Token usage tracking
- **example_agent_monitor.py** - Single model monitoring

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
