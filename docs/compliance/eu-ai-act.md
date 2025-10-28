# EU AI Act Compliance Guide

Complete guide for achieving EU AI Act Article 15 compliance using CERT Framework.

## Overview

The EU AI Act (Regulation 2024/1689) establishes comprehensive requirements for high-risk AI systems. CERT Framework helps organizations achieve compliance with Article 15 (Accuracy) and related provisions.

## Relevant Articles

### Article 15: Accuracy, Robustness and Cybersecurity

> High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness, and cybersecurity, and perform consistently in those respects throughout their lifecycle.

**CERT Framework Coverage:**
- ✅ Accuracy measurement and monitoring
- ✅ Robustness testing against errors
- ✅ Consistent performance tracking
- ✅ Lifecycle documentation

### Article 19: Logging Capabilities

> High-risk AI systems shall be designed and developed with capabilities enabling the automatic recording of events (logs) while the high-risk AI systems are operating.

**CERT Framework Coverage:**
- ✅ Automatic audit logging (JSONL format)
- ✅ Timestamped entries
- ✅ Query-context-answer triplets
- ✅ Accuracy metrics and failures

### Annex IV: Technical Documentation

The EU AI Act requires comprehensive technical documentation including:
- Purpose and intended use
- Accuracy metrics
- Performance testing results
- Risk mitigation measures

**CERT Framework Coverage:**
- ✅ Automated compliance reports (HTML)
- ✅ Accuracy metrics and trends
- ✅ Failure analysis
- ✅ Risk assessment

## Risk Classification

### High-Risk Systems

CERT Framework is designed for high-risk AI systems, including:

**Healthcare (Annex III.1)**
- Medical diagnosis systems
- Treatment recommendation systems
- Patient monitoring systems

**Use Case:**
```python
from cert.integrations.anthropic import wrap_anthropic_client

# Healthcare system with strict 0.85 threshold
client = wrap_anthropic_client(client, preset="healthcare")
```

**Financial (Annex III.2)**
- Credit scoring systems
- Insurance underwriting
- Financial advisory systems

**Use Case:**
```python
# Financial system with 0.80 threshold
client = wrap_openai_client(client, preset="financial")
```

**Legal (Annex III.6)**
- Legal research systems
- Contract analysis
- Case prediction systems

**Use Case:**
```python
# Legal system with 0.85 threshold
engine = wrap_llamaindex_engine(engine, preset="legal")
```

## Compliance Requirements

### 1. Accuracy Thresholds

**Article 15.1 Requirement:**
"Appropriate level of accuracy"

**CERT Implementation:**
- Healthcare: ≥0.85 accuracy
- Financial: ≥0.80 accuracy
- Legal: ≥0.85 accuracy
- General: ≥0.70 accuracy

**Validation:**
```python
from cert import measure

result = measure(answer, context)

if result.confidence >= 0.85:  # Healthcare threshold
    print("✓ Article 15.1 compliant")
else:
    print("✗ Below accuracy threshold")
```

### 2. Automatic Logging

**Article 19.1 Requirement:**
"Automatic recording of events"

**CERT Implementation:**
- All evaluations logged to JSONL
- Timestamped entries
- Query, context, answer captured
- Metrics and compliance status

**Audit Log Example:**
```json
{
  "type": "request",
  "timestamp": "2024-01-15T10:30:00",
  "preset": "healthcare",
  "query": "What is the treatment?",
  "context": "Patient has hypertension...",
  "answer": "Treatment involves...",
  "accuracy_result": {
    "accuracy_score": 0.89,
    "passed": true,
    "metrics": {
      "semantic_score": 0.92,
      "nli_score": 0.88,
      "grounding_score": 0.96
    }
  },
  "compliance_check": {
    "Article 15.1": true,
    "Article 15.4": true
  }
}
```

### 3. Technical Documentation

**Annex IV Requirement:**
Comprehensive technical documentation

**CERT Implementation:**
```python
from cert import export_report

# Generate compliance report
export_report(
    audit_log_path="data/audit.jsonl",
    output_path="eu_ai_act_compliance.html"
)
```

**Report Sections:**
1. Executive Summary
2. Accuracy Metrics
3. EU AI Act Article 15 Compliance
4. Detailed Evaluation Results
5. Risk Analysis
6. Technical Details
7. Failure Analysis

### 4. Risk Mitigation

**Article 15.4 Requirement:**
"Resilience against errors and faults"

**CERT Implementation:**

**Circuit Breaker:**
```python
@monitor(
    preset="healthcare",
    circuit_breaker=True,
    failure_threshold=0.7
)
def medical_diagnosis(symptoms):
    # System stops if accuracy drops below 70%
    return diagnose(symptoms)
```

**Failure Explanation:**
```python
from cert.compliance.explanations import explain_measurement_failure

# Get human-readable failure reasons
explanation = explain_measurement_failure(result, answer, context)

print(f"Reason: {explanation.reason}")
print(f"Evidence: {explanation.evidence}")
print(f"Severity: {explanation.severity}")
print(f"Recommendation: {explanation.recommendation}")
```

## Compliance Workflow

### Step 1: Integration

Choose the appropriate integration for your stack:

```python
# LangChain
from cert.integrations.langchain import wrap_langchain_chain
monitored = wrap_langchain_chain(chain, preset="healthcare")

# LlamaIndex
from cert.integrations.llamaindex import wrap_llamaindex_engine
monitored = wrap_llamaindex_engine(engine, preset="healthcare")

# Anthropic
from cert.integrations.anthropic import wrap_anthropic_client
monitored = wrap_anthropic_client(client, preset="healthcare")

# OpenAI
from cert.integrations.openai import wrap_openai_client
monitored = wrap_openai_client(client, preset="healthcare")
```

### Step 2: Production Deployment

Enable appropriate safeguards:

```python
config = {
    "audit_log_path": "data/production_audit.jsonl",
    "circuit_breaker": True,
    "failure_threshold": 0.7,
    "require_approval": False  # For automated systems
}

monitored = wrap_langchain_chain(
    chain,
    preset="healthcare",
    monitor_config=config
)
```

### Step 3: Monitoring

Set up real-time monitoring:

```python
from cert.observability.prometheus import (
    start_metrics_server,
    export_metrics_continuously
)

# Start Prometheus metrics
start_metrics_server(port=8000)

# Continuous export
export_metrics_continuously(
    "data/production_audit.jsonl",
    interval_seconds=60,
    lookback_minutes=5
)
```

### Step 4: Compliance Reporting

Generate periodic compliance reports:

```python
import schedule
from cert import export_report
from datetime import date

def generate_weekly_report():
    export_report(
        audit_log_path="data/production_audit.jsonl",
        output_path=f"compliance/report_{date.today()}.html"
    )

# Weekly reports
schedule.every().monday.at("00:00").do(generate_weekly_report)
```

### Step 5: Audit Preparation

Maintain documentation:

1. **Audit Logs**: Store all logs (minimum 6 months)
2. **Compliance Reports**: Generate monthly reports
3. **System Changes**: Document all updates
4. **Accuracy Trends**: Track over time
5. **Incident Reports**: Document failures

## Compliance Checklist

### Pre-Deployment

- [ ] Risk classification documented
- [ ] Accuracy thresholds defined
- [ ] Monitoring configured
- [ ] Audit logging enabled
- [ ] Circuit breaker tested
- [ ] Compliance reports reviewed

### Production

- [ ] Real-time monitoring active
- [ ] Audit logs backing up
- [ ] Compliance reports generated monthly
- [ ] Accuracy above thresholds
- [ ] Incidents documented
- [ ] System changes logged

### Audit Preparation

- [ ] 6+ months of audit logs available
- [ ] Compliance reports for all periods
- [ ] Accuracy trends documented
- [ ] All incidents explained
- [ ] Mitigation measures documented
- [ ] System documentation current

## Common Violations

### 1. Insufficient Logging

**Violation:**
```python
# No monitoring - Article 19 violation
response = llm.invoke(query)
```

**Compliant:**
```python
# Automatic logging
monitored = wrap_langchain_chain(chain, preset="healthcare")
response = monitored.invoke(query)
```

### 2. No Accuracy Monitoring

**Violation:**
```python
# No accuracy checking - Article 15 violation
answer = generate_answer(query)
```

**Compliant:**
```python
@monitor(preset="healthcare")
def generate_answer(query):
    context = retrieve(query)
    answer = llm(context, query)
    return {"query": query, "context": context, "answer": answer}
```

### 3. Missing Documentation

**Violation:**
No technical documentation available

**Compliant:**
```python
# Generate documentation monthly
export_report("data/audit.jsonl", "monthly_report.html")
```

## Prometheus Alerting

Set up alerts for compliance violations:

```yaml
# prometheus-alerts.yml
- alert: AccuracyBelowThreshold
  expr: cert_accuracy_score{preset="healthcare"} < 0.85
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Article 15.1 compliance violation"
    description: "Healthcare accuracy is {{ $value }}"

- alert: ComplianceViolation
  expr: cert_compliance_pass_rate < 0.8
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "EU AI Act compliance violation"
```

## Documentation Requirements

### System Card

Document your AI system:

```markdown
# System Card

## Purpose
Medical diagnosis assistant

## Risk Classification
High-risk (Healthcare - Annex III.1)

## Accuracy Requirements
- Threshold: 0.85
- Monitoring: Real-time
- Circuit breaker: Enabled at 0.70

## Compliance
- Article 15: Accuracy monitoring active
- Article 19: Automatic logging enabled
- Annex IV: Monthly reports generated

## Mitigation Measures
- Circuit breaker stops system at 0.70 accuracy
- Human review for borderline cases
- Continuous monitoring via Prometheus
```

## See Also

- [Audit Preparation Guide](audit-preparation.md)
- [Report Customization](report-customization.md)
- [Integration Guides](../integrations/)
