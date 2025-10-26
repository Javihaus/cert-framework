# EU AI Act Compliance Mapping

**How CERT Framework Addresses EU AI Act Requirements**

Regulation (EU) 2024/1689 - Artificial Intelligence Act
Entered into force: August 1, 2024
Compliance deadline for high-risk systems: August 2, 2026

Version: 3.0.0
Last Updated: 2025-10-26

---

## Table of Contents

- [Overview](#overview)
- [Article 11: Technical Documentation](#article-11-technical-documentation)
- [Article 15: Accuracy, Robustness and Cybersecurity](#article-15-accuracy-robustness-and-cybersecurity)
- [Article 19: Automatically Generated Logs](#article-19-automatically-generated-logs)
- [Article 12: Record-Keeping](#article-12-record-keeping)
- [Annex IV: Technical Documentation Requirements](#annex-iv-technical-documentation-requirements)
- [Compliance Checklist](#compliance-checklist)
- [Limitations and Disclaimers](#limitations-and-disclaimers)

---

## Overview

### Scope of CERT Framework

CERT Framework provides **technical tools** to support compliance with EU AI Act requirements for high-risk AI systems. Specifically, CERT addresses:

✅ **Article 15** - Accuracy measurement and robustness monitoring
✅ **Article 19** - Automatic event logging and audit trails
✅ **Article 12** - Record-keeping through timestamped verification
✅ **Annex IV** - Performance metrics documentation support

❌ CERT does **NOT** provide:
- Legal compliance certification
- High-risk system classification determination
- Conformity assessment procedures
- Complete governance frameworks
- Legal advice

### What "Appropriate Levels of Accuracy" Means

**Article 15.1** requires that "high-risk AI systems shall be designed and developed in such a way that they achieve an **appropriate level of accuracy**..."

The regulation **does not specify exact percentages**. "Appropriate" depends on:
- Intended purpose of the AI system
- Specific use case and application domain
- Consequences of errors in that domain
- State of the art in the technical field

**CERT's Approach**: Provides evidence-based threshold recommendations (80%, 90%, 92%, 95%) derived from:
- Domain-specific error rate literature
- Experimental validation studies
- Risk assessment for consequence severity
- Industry best practices

---

## Article 11: Technical Documentation

### Full Text (Article 11, Paragraph 1)

> "Technical documentation of a high-risk AI system shall be drawn up before that system is placed on the market or put into service and shall be kept up-to-date. The technical documentation shall be drawn up in such a way as to demonstrate that the high-risk AI system complies with the requirements set out in this Section and to provide national competent authorities and notified bodies with the necessary information in a clear and comprehensive form to assess the compliance of the AI system with those requirements."

### How CERT Addresses This

| Requirement | CERT Implementation | Status |
|-------------|-------------------|--------|
| Documentation drawn up before placement | CERT enables measurement and documentation during development and testing phases | ✅ Supported |
| Kept up-to-date | Continuous monitoring generates ongoing documentation through audit logs | ✅ Supported |
| Demonstrate compliance | `export_report()` generates compliance documentation with metrics | ✅ Supported |
| Clear and comprehensive form | Plain-language reports for non-technical stakeholders | ✅ Supported |
| Provide to authorities | Reports exportable in txt/json/csv formats for submission | ✅ Supported |

### CERT Functions

```python
from cert import monitor, export_report

# Enable continuous monitoring
@monitor(preset="financial")
def my_rag_system(query):
    return pipeline(query)

# Generate technical documentation
export_report(
    output_path="technical_documentation.txt",
    system_name="Financial Services RAG System",
    format="txt"
)
```

### Reference to Annex IV

Article 11 requires documentation to include elements specified in **Annex IV**. See [Annex IV section](#annex-iv-technical-documentation-requirements) below.

---

## Article 15: Accuracy, Robustness and Cybersecurity

### Article 15.1 - Appropriate Levels of Accuracy

**Full Text**:
> "High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness and cybersecurity, and that they perform consistently in those respects throughout their lifecycle."

#### How CERT Addresses This

| Aspect | CERT Implementation | Code Example |
|--------|-------------------|--------------|
| **Accuracy Measurement** | Composite accuracy score combining semantic similarity (30%), NLI (50%), and grounding (20%) | `result = measure(text1, text2)` |
| **Threshold Configuration** | Configurable accuracy thresholds per industry (80-95%) | `@monitor(accuracy_threshold=0.95)` |
| **Throughout Lifecycle** | Continuous per-request monitoring and logging | `@monitor` decorator |
| **Perform Consistently** | Tracks accuracy trends over time in audit logs | Audit log statistics |

**Evidence of Compliance**:
- Continuous accuracy measurement per request
- Statistical aggregation across requests
- Configurable thresholds appropriate to use case
- Documented accuracy metrics in audit trail

**CERT Functions**:

```python
from cert import measure, monitor

# Direct measurement
result = measure(
    text1="LLM output",
    text2="Expected output or context"
)
print(f"Accuracy: {result.confidence:.1%}")  # e.g., "Accuracy: 94.2%"

# Continuous monitoring
@monitor(accuracy_threshold=0.90)
def my_system(query):
    return llm_pipeline(query)
```

### Article 15.2 - Benchmarks and Measurement Methodologies

**Full Text**:
> "To address the technical aspects of how to measure the appropriate levels of accuracy and robustness set out in paragraph 1 and any other relevant performance metrics, the Commission shall, in cooperation with relevant stakeholders and organisations such as metrology and benchmarking authorities, encourage, as appropriate, the development of benchmarks and measurement methodologies."

#### How CERT Addresses This

| Aspect | CERT Implementation |
|--------|-------------------|
| **Measurement Methodology** | Three-component composite scoring: semantic similarity, NLI contradiction detection, grounding analysis |
| **Benchmarks** | Industry-specific accuracy thresholds validated through experimental studies |
| **Performance Metrics** | Tracks accuracy, hallucination rate, robustness, latency, error rate |
| **Methodology Documentation** | Detailed methodology in [METRICS_METHODOLOGY.md](METRICS_METHODOLOGY.md) |

**CERT's Measurement Methodology**:

```
Confidence = 0.3 × Semantic + 0.5 × NLI + 0.2 × Grounding

Where:
- Semantic: Embedding-based similarity (sentence-transformers)
- NLI: Natural Language Inference entailment score (DeBERTa)
- Grounding: Term-level verification (pattern matching)
```

See [METRICS_METHODOLOGY.md](METRICS_METHODOLOGY.md) for mathematical foundations.

### Article 15.3 - Accuracy Metrics Declared in Instructions

**Full Text**:
> "The levels of accuracy and the relevant accuracy metrics of high-risk AI systems shall be declared in the accompanying instructions of use."

#### How CERT Addresses This

| Requirement | CERT Implementation | Output |
|-------------|-------------------|--------|
| **Declare accuracy levels** | Reports include declared vs measured accuracy | "Declared: 90% ± 5%, Measured: 94.2%" |
| **Relevant accuracy metrics** | Semantic accuracy, NLI score, grounding score, composite score | Full metric breakdown in reports |
| **Instructions of use** | Plain-language reports for system documentation | `export_report()` |

**CERT Functions**:

```python
from cert import export_report

# Generate declaration for instructions of use
export_report(
    output_path="accuracy_declaration.txt",
    system_name="Customer Service RAG",
    format="txt"
)
```

**Sample Output** (for instructions of use):

```
Declared Accuracy (Article 15.3):
  Declared Accuracy Threshold: 90.0% ± 5.0%
  Measured Accuracy (Period): 94.2%

  ✓ System performs ABOVE declared accuracy threshold

Accuracy Metrics:
  - Overall Accuracy Score: 94.2%
  - Semantic Similarity Score: 93.8%
  - NLI Entailment Score: 95.1%
  - Grounding Verification Score: 96.3%
```

### Article 15.4 - Resilience Regarding Errors

**Full Text**:
> "High-risk AI systems shall be as resilient as possible regarding errors, faults or inconsistencies that may occur within the system or the environment in which the system operates, in particular due to their interaction with natural persons or other systems. The robustness of high-risk AI systems may be achieved through technical redundancy solutions, which may include backup or fail-safe plans."

#### How CERT Addresses This

| Aspect | CERT Implementation |
|--------|-------------------|
| **Error Tracking** | Logs all errors to audit trail with timestamps and stack traces |
| **Error Rate Measurement** | Calculates error rate as percentage of failed operations |
| **Robustness Metrics** | Success rate, timeout rate, response time distribution |
| **Resilience Monitoring** | Tracks system performance under error conditions |

**CERT Functions**:

```python
@monitor(preset="financial")
def resilient_system(query):
    try:
        return llm_pipeline(query)
    except Exception as e:
        # Error is automatically logged by CERT
        # Audit trail includes error type, message, timestamp
        return fallback_response()
```

**Robustness Metrics in Reports**:

```
ROBUSTNESS (Article 15.4)
┌─────────────────────────────────┬──────────┬────────────┬──────────┐
│ Metric                          │ Value    │ Threshold  │ Status   │
├─────────────────────────────────┼──────────┼────────────┼──────────┤
│ System Error Rate               │ 0.8%     │ ≤5.0%      │ ✓ PASS   │
│ Timeout Rate                    │ 0.1%     │ ≤1.0%      │ ✓ PASS   │
│ Success Rate                    │ 99.1%    │ ≥95.0%     │ ✓ PASS   │
└─────────────────────────────────┴──────────┴────────────┴──────────┘
```

### Article 15.5 - Cybersecurity

**Full Text**:
> "High-risk AI systems shall be resilient against attempts by unauthorised third parties to alter their use, outputs or performance by exploiting system vulnerabilities. The technical solutions to address AI specific vulnerabilities shall include, where appropriate, measures to prevent, detect, respond to, resolve and control for attacks..."

#### How CERT Addresses This

| Aspect | Status | Notes |
|--------|--------|-------|
| **Data Poisoning Detection** | ❌ Not Supported | Out of scope for CERT (requires MLOps platform) |
| **Model Poisoning Detection** | ❌ Not Supported | Out of scope |
| **Adversarial Examples Detection** | ❌ Not Supported | Out of scope |
| **Output Integrity Verification** | ✅ Partial Support | Hallucination detection can identify anomalous outputs |
| **Audit Trail Immutability** | ✅ Supported | Append-only JSONL format provides tamper evidence |

**CERT Limitations**: Cybersecurity is **largely out of scope** for CERT Framework. Organizations must implement:
- Model versioning and integrity checking
- Input validation and sanitization
- Access controls and authentication
- Network security and encryption
- Adversarial robustness testing

CERT provides **output verification** (hallucination detection) which can help identify suspicious outputs, but does not replace comprehensive cybersecurity measures.

---

## Article 19: Automatically Generated Logs

### Full Text

**Article 19, Paragraph 1**:
> "High-risk AI systems shall be designed and developed with capabilities enabling the automatic recording of events ('logs') over the lifetime of the system."

**Article 19, Minimum Retention**:
> "The logs shall be kept for a period that is appropriate in light of the intended purpose of the high-risk AI system and applicable legal obligations under Union or national law, of at least 6 months..."

**Article 19, Financial Institutions**:
> "For high-risk AI systems referred to in point 1(b) of Annex III that are provided by financial institutions subject to requirements regarding their internal governance, arrangements or processes under Union financial services law, the logging obligations set out in this Article shall be considered to be fulfilled by complying with the rules on internal governance, arrangements or processes pursuant to the relevant financial services legislation."

### How CERT Addresses This

| Requirement | CERT Implementation | Code Example |
|-------------|-------------------|--------------|
| **Automatic Recording** | Every request automatically logged to JSONL audit trail | `@monitor(audit_log="audit.jsonl")` |
| **Event Types** | Logs: requests, responses, accuracy metrics, hallucinations, errors | Automatic |
| **Minimum 6 Months** | Configurable retention period (6 months default, 7-10 years for finance/healthcare) | `audit_retention_months=6` |
| **Financial Institutions** | Supports 7-year retention for SEC Rule 17a-4 compliance | `preset="financial"` |
| **Lifetime of System** | Continuous append-only logging throughout operation | Automatic |

### CERT Functions

```python
from cert import monitor

@monitor(
    audit_log="cert_audit.jsonl",        # Custom log file
    preset="financial"                    # 7-year retention
)
def financial_system(query):
    return pipeline(query)
```

### Audit Log Format

**JSONL Format** (JSON Lines - one JSON object per line):

```json
{"type": "request", "timestamp": "2025-01-31T14:23:00.123Z", "function_name": "financial_system", "context": "Customer has credit score 720...", "answer": "Approved for $50,000 credit line", "accuracy_score": 0.94, "hallucination_detected": false, "is_compliant": true, "metrics": {"semantic_score": 0.93, "nli_score": 0.95, "grounding_score": 0.96, "is_contradiction": false, "ungrounded_terms_count": 0}, "duration_ms": 342}
```

### Log Content (Article 19 Requirements)

| Required Event Information | Logged by CERT | Field Name |
|---------------------------|----------------|------------|
| Timestamp | ✅ Yes | `timestamp` (ISO 8601 UTC) |
| Event type | ✅ Yes | `type` ("request", "error") |
| Input data | ✅ Yes | `context` |
| Output data | ✅ Yes | `answer` |
| System performance | ✅ Yes | `accuracy_score`, `metrics`, `duration_ms` |
| Decision/outcome | ✅ Yes | `is_compliant`, `hallucination_detected` |
| Error events | ✅ Yes | Separate error log entries |

### Accessing Audit Logs

```python
from cert.audit import AuditLogger

# Read audit statistics
logger = AuditLogger("cert_audit.jsonl")
stats = logger.get_statistics()

print(f"Total requests: {stats['total_requests']}")
print(f"Hallucination rate: {stats['hallucination_rate']:.1%}")
print(f"Retention days: {stats['retention_days']}")
```

### Log Immutability

CERT uses **append-only JSONL format** which provides:
- ✅ Tamper evidence (modifications detectable)
- ✅ Sequential timestamping
- ✅ No overwriting of historical records
- ✅ Simple audit trail verification

For enhanced immutability, organizations should implement:
- Write-once storage media
- Cryptographic signing of log entries
- Separate log storage with restricted access
- Regular backup and integrity verification

---

## Article 12: Record-Keeping

### Full Text (Article 12, Paragraph 1)

> "Providers of high-risk AI systems shall keep the logs automatically generated by their high-risk AI systems as referred to in Article 19(1), to the extent such logs are under their control. The logs shall be kept for a period that is appropriate in light of the intended purpose of the high-risk AI system, of at least 6 months..."

### How CERT Addresses This

| Requirement | CERT Implementation |
|-------------|-------------------|
| **Keep logs** | Automatic JSONL logging to durable file storage |
| **Under provider control** | Local file system storage (provider controls backup/archival) |
| **Appropriate period** | Configurable retention (6 months to 10 years) |
| **Minimum 6 months** | Default general preset uses 6-month retention |
| **Industry-specific** | Financial (7 years), Healthcare (10 years) presets available |

### CERT Functions

```python
from cert import monitor, PRESETS

# View retention period for preset
config = PRESETS["healthcare"]
print(f"Retention: {config['audit_retention_months']} months")  # 120 months (10 years)

# Configure custom retention
@monitor(audit_retention_months=84)  # 7 years for custom compliance
def my_system(query):
    return pipeline(query)
```

### Integration with Organizational Systems

Organizations should integrate CERT audit logs with their record-keeping systems:

```python
from cert.audit import AuditLogger
import your_archive_system

# Export logs to organizational archive
logger = AuditLogger("cert_audit.jsonl")
logs = logger.read_all_logs()

for log_entry in logs:
    your_archive_system.archive(
        document=log_entry,
        retention_years=7,
        classification="compliance_record"
    )
```

---

## Annex IV: Technical Documentation Requirements

### Overview

Annex IV specifies the minimum content required in technical documentation for high-risk AI systems.

### Annex IV Requirements and CERT Support

| Annex IV Section | Requirement | CERT Support | Implementation |
|------------------|-------------|--------------|----------------|
| **IV.1** | General description of AI system | ⚠️ Partial | User provides system description in `export_report()` |
| **IV.2** | Detailed description of elements and development process | ❌ Not Supported | Out of scope (requires MLOps documentation) |
| **IV.3** | Detailed information about monitoring, functioning, and control | ✅ Supported | CERT provides continuous monitoring documentation |
| **IV.3** | Description of appropriateness of performance metrics | ✅ Supported | Composite accuracy methodology documented |
| **IV.4** | Detailed description of risk management system | ⚠️ Partial | CERT provides hallucination detection (risk mitigation) |
| **IV.5** | Description of changes made through lifecycle | ⚠️ Partial | Audit logs track performance changes over time |
| **IV.6** | List of harmonised standards applied | ⚠️ Partial | CERT measurement methodology documented |
| **IV.7** | Copy of EU declaration of conformity | ❌ Not Supported | Out of scope (legal/organizational process) |
| **IV.8** | Description of post-market monitoring system | ✅ Supported | Continuous monitoring with `@monitor` decorator |

### CERT's Role in Annex IV Compliance

**CERT Provides** (✅):
- **IV.3**: Performance metrics (accuracy, robustness, hallucination rate)
- **IV.3**: Appropriateness justification for metrics
- **IV.8**: Post-market monitoring system implementation

**User Must Provide** (⚠️):
- **IV.1**: System description, purpose, high-risk classification
- **IV.2**: Development process documentation
- **IV.4**: Complete risk management framework
- **IV.5**: Change management documentation
- **IV.6**: Standards compliance declarations
- **IV.7**: Legal conformity declarations

**Out of Scope** (❌):
- Legal declarations
- Complete governance frameworks
- Development lifecycle documentation

### Example: Annex IV Documentation with CERT

```python
from cert import export_report

# Generate Annex IV partial documentation
export_report(
    output_path="annex_iv_performance_metrics.txt",
    system_name="Financial Services RAG System",
    system_version="2.1.0",
    system_purpose="Credit risk assessment support",
    high_risk_classification="Yes, Annex III Point 5(b)",
    format="txt"
)
```

**Output includes**:
- ✅ IV.3: Performance metrics with appropriateness justification
- ✅ IV.8: Post-market monitoring system description
- ✅ Accuracy measurements per Article 15.1
- ✅ Robustness metrics per Article 15.4
- ✅ Audit trail status per Article 19

**User must supplement with**:
- IV.1: System description and architecture
- IV.2: Development process
- IV.4: Risk management system
- IV.5: Change log
- IV.6: Standards applied
- IV.7: Conformity declaration

---

## Compliance Checklist

### Article 15 Compliance

- [ ] **Article 15.1**: Accuracy measurement system implemented
  - [ ] Composite accuracy score calculated per request
  - [ ] Accuracy threshold configured appropriate to use case
  - [ ] Continuous measurement throughout system lifecycle

- [ ] **Article 15.2**: Measurement methodology documented
  - [ ] Three-component methodology explained in documentation
  - [ ] Validation studies referenced
  - [ ] Performance metrics defined

- [ ] **Article 15.3**: Accuracy metrics declared
  - [ ] Declared accuracy threshold documented in instructions of use
  - [ ] Measured accuracy tracked and compared to declared
  - [ ] Compliance reports generated for stakeholders

- [ ] **Article 15.4**: Robustness monitoring implemented
  - [ ] Error rate tracking enabled
  - [ ] Success rate monitoring enabled
  - [ ] Error logging to audit trail enabled
  - [ ] Fallback mechanisms documented (outside CERT)

- [ ] **Article 15.5**: Cybersecurity measures implemented
  - [ ] ❌ Note: Mostly out of scope for CERT
  - [ ] Output verification (hallucination detection) enabled
  - [ ] Audit trail integrity measures implemented
  - [ ] Additional cybersecurity controls implemented (outside CERT)

### Article 19 Compliance

- [ ] **Automatic Logging**: Enabled with `@monitor` decorator
- [ ] **Log Retention**: Configured to appropriate period (≥6 months)
- [ ] **Log Content**: Includes all required information (timestamp, inputs, outputs, metrics)
- [ ] **Log Storage**: Durable storage with backup procedures
- [ ] **Log Access**: Controlled access for auditing and review
- [ ] **Financial Institutions**: 7-year retention if applicable

### Article 12 Compliance

- [ ] **Record-Keeping**: Audit logs integrated with organizational systems
- [ ] **Retention Period**: Appropriate to intended purpose and regulations
- [ ] **Control**: Logs under provider control with backup/archival procedures

### Annex IV Compliance

- [ ] **IV.3**: Performance metrics documentation prepared
- [ ] **IV.8**: Post-market monitoring system operational
- [ ] **Supplementary**: Other Annex IV elements prepared (outside CERT)

---

## Limitations and Disclaimers

### What CERT Does

✅ **Technical Monitoring**:
- Measures accuracy per Article 15.1
- Tracks robustness per Article 15.4
- Generates automatic logs per Article 19
- Provides performance metrics for Annex IV

✅ **Documentation Support**:
- Generates compliance reports
- Provides measurement methodology documentation
- Exports audit trail statistics

### What CERT Does NOT Do

❌ **Legal Compliance**:
- Does not certify legal compliance
- Does not replace legal counsel
- Does not determine high-risk classification
- Does not provide conformity assessment

❌ **Complete Governance**:
- Does not provide full risk management framework
- Does not cover entire Article 15.5 (cybersecurity)
- Does not provide complete Annex IV documentation
- Does not cover data governance requirements

❌ **Organizational Processes**:
- Does not implement human oversight
- Does not provide quality management system
- Does not manage model development lifecycle
- Does not handle change management

### Critical Understanding

> **IMPORTANT**: Using CERT Framework does NOT guarantee EU AI Act compliance. CERT provides technical tools to support compliance efforts, but full compliance requires:
>
> - Comprehensive legal analysis
> - Organizational risk management processes
> - Human oversight and governance structures
> - Data governance and quality management
> - Professional legal counsel
> - Conformity assessment procedures (for some high-risk systems)

### Responsibility

Organizations deploying high-risk AI systems remain responsible for:
1. Determining if their system is high-risk under the EU AI Act
2. Implementing complete compliance framework
3. Conducting conformity assessment (if required)
4. Maintaining ongoing compliance throughout system lifecycle
5. Responding to regulatory inquiries and audits

CERT is **one component** of a larger compliance strategy, not a complete solution.

---

## Official Resources

- **EU AI Act Full Text**: https://artificialintelligenceact.eu/
- **Article 15**: https://artificialintelligenceact.eu/article/15/
- **Article 19**: https://artificialintelligenceact.eu/article/19/
- **Article 11**: https://artificialintelligenceact.eu/article/11/
- **Article 12**: https://artificialintelligenceact.eu/article/12/
- **Annex IV**: https://artificialintelligenceact.eu/annex/4/
- **Compliance Checker**: https://artificialintelligenceact.eu/assessment/eu-ai-act-compliance-checker/
- **European Commission AI Page**: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai

---

## See Also

- [Parameter Reference](PARAMETER_REFERENCE.md) - Complete parameter documentation
- [Preset Validation Methodology](PRESET_VALIDATION_METHODOLOGY.md) - How thresholds were derived
- [Metrics Methodology](METRICS_METHODOLOGY.md) - Mathematical foundations of measurements
- [Documentation Improvement Plan](DOCUMENTATION_IMPROVEMENT_PLAN.md) - Future improvements roadmap

---

**Questions or Concerns?**

For questions about EU AI Act compliance and CERT Framework:
- GitHub Issues: https://github.com/Javihaus/cert-framework/issues
- Email: info@cert-framework.com

**For legal advice**, consult qualified legal counsel specializing in EU AI regulation.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-26
**Regulation**: EU 2024/1689 (AI Act)
**CERT Framework Version**: 3.0.0
