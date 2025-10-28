# Audit Preparation Guide

Complete guide for preparing for EU AI Act compliance audits using CERT Framework.

## Overview

This guide helps organizations prepare for regulatory audits by maintaining proper documentation, audit logs, and compliance reports using CERT Framework.

## Timeline

### 6 Months Before Production

- [ ] Define risk classification
- [ ] Set accuracy thresholds
- [ ] Configure monitoring
- [ ] Set up audit logging
- [ ] Test compliance reports

### Production Launch

- [ ] Enable automatic logging
- [ ] Start Prometheus monitoring
- [ ] Begin compliance reporting
- [ ] Document system configuration
- [ ] Train operations team

### Ongoing (Monthly)

- [ ] Generate compliance reports
- [ ] Review accuracy trends
- [ ] Document incidents
- [ ] Back up audit logs
- [ ] Update system documentation

### Pre-Audit (2 Weeks)

- [ ] Gather all audit logs
- [ ] Generate compliance reports for all periods
- [ ] Document all incidents
- [ ] Prepare accuracy trend analysis
- [ ] Review mitigation measures

## Required Documentation

### 1. System Documentation

Create comprehensive system documentation:

**System Card Template:**
```markdown
# AI System Documentation

## System Identification
- System Name: Medical Diagnosis Assistant
- Version: 2.0.0
- Deployment Date: 2024-01-15
- Risk Classification: High-Risk (Healthcare - Annex III.1)

## Purpose and Intended Use
- Primary Purpose: Assist clinicians with preliminary diagnosis
- Intended Users: Licensed medical professionals
- Intended Context: Clinical decision support
- Limitations: Not for unsupervised use

## Technical Architecture
- Framework: LangChain + OpenAI GPT-4
- Monitoring: CERT Framework v2.0.0
- Accuracy Threshold: 0.85 (Healthcare preset)
- Circuit Breaker: Enabled at 0.70

## Compliance Measures
- Real-time accuracy monitoring
- Automatic audit logging
- Monthly compliance reports
- Prometheus alerting
- Human review for borderline cases

## Accuracy Requirements
- Minimum Accuracy: 0.85 (Article 15.1)
- Semantic Similarity: ≥0.80
- NLI Score: ≥0.75
- Grounding Score: ≥0.90

## Risk Mitigation
- Circuit breaker stops system if accuracy < 0.70
- Human review required for 0.70-0.85 range
- Continuous monitoring via Prometheus
- Incident response procedure documented
```

### 2. Audit Logs

Maintain comprehensive audit logs:

**Log Retention Policy:**
```python
# Keep logs for minimum 6 months
import shutil
from datetime import datetime, timedelta
from pathlib import Path

def archive_old_logs(audit_dir="data", retention_months=6):
    """Archive logs older than retention period."""
    cutoff_date = datetime.now() - timedelta(days=retention_months * 30)
    
    for log_file in Path(audit_dir).glob("audit_*.jsonl"):
        if log_file.stat().st_mtime < cutoff_date.timestamp():
            # Archive to backup location
            archive_dir = Path("archive") / str(cutoff_date.year)
            archive_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(log_file, archive_dir / log_file.name)
```

**Log Verification:**
```python
import json
from pathlib import Path

def verify_audit_log(log_path):
    """Verify audit log integrity."""
    with open(log_path, "r") as f:
        entries = []
        for line_num, line in enumerate(f, 1):
            try:
                entry = json.loads(line)
                
                # Verify required fields
                assert "type" in entry
                assert "timestamp" in entry
                
                if entry["type"] == "request":
                    assert "accuracy_result" in entry
                    assert "query" in entry or "context" in entry
                
                entries.append(entry)
            except (json.JSONDecodeError, AssertionError) as e:
                print(f"Line {line_num}: Invalid entry - {e}")
        
        return len(entries), entries

# Verify all logs
total, entries = verify_audit_log("data/audit.jsonl")
print(f"Verified {total} entries")
```

### 3. Compliance Reports

Generate reports for all operational periods:

**Automated Report Generation:**
```python
from cert import export_report
from datetime import datetime, timedelta
from pathlib import Path

def generate_audit_reports(
    audit_log_path="data/audit.jsonl",
    output_dir="compliance_reports"
):
    """Generate monthly compliance reports."""
    Path(output_dir).mkdir(exist_ok=True)
    
    # Current month
    current_date = datetime.now()
    report_name = f"compliance_{current_date.strftime('%Y_%m')}.html"
    
    export_report(
        audit_log_path=audit_log_path,
        output_path=f"{output_dir}/{report_name}"
    )
    
    print(f"Generated: {report_name}")

# Generate for all months
for month in range(1, 13):
    generate_audit_reports()
```

### 4. Incident Documentation

Document all accuracy failures and incidents:

**Incident Report Template:**
```markdown
# Incident Report: IR-2024-001

## Incident Details
- Date: 2024-01-15 10:30:00
- System: Medical Diagnosis Assistant
- Severity: Medium
- Status: Resolved

## Description
Accuracy score dropped to 0.72 for 3 consecutive queries.

## Root Cause
Context retrieval returned outdated medical guidelines.

## Impact
3 queries received low-confidence responses.
All flagged for human review.
No patient harm occurred.

## Resolution
- Updated knowledge base with latest guidelines
- Improved retrieval filtering
- Added date-based relevance scoring

## Compliance Impact
- Article 15.1: Briefly non-compliant (0.72 < 0.85)
- Article 15.4: Circuit breaker functioned correctly
- Article 19: All events logged automatically

## Prevention Measures
- Monthly knowledge base updates
- Automated guideline version checking
- Enhanced monitoring for retrieval quality

## Sign-off
- Incident Lead: Dr. Jane Smith
- Compliance Officer: John Doe
- Date Resolved: 2024-01-15 14:00:00
```

### 5. Accuracy Trend Analysis

Track accuracy over time:

```python
import json
import pandas as pd
from datetime import datetime

def analyze_accuracy_trends(audit_log_path):
    """Analyze accuracy trends over time."""
    data = []
    
    with open(audit_log_path, "r") as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("type") == "request" and "accuracy_result" in entry:
                    data.append({
                        "timestamp": datetime.fromisoformat(entry["timestamp"]),
                        "accuracy": entry["accuracy_result"]["accuracy_score"],
                        "preset": entry.get("preset", "unknown")
                    })
            except:
                continue
    
    df = pd.DataFrame(data)
    
    # Monthly trends
    monthly = df.groupby([
        df["timestamp"].dt.to_period("M"),
        "preset"
    ])["accuracy"].agg(["mean", "min", "max", "count"])
    
    print("Monthly Accuracy Trends:")
    print(monthly)
    
    # Check compliance
    compliant = df[df["accuracy"] >= 0.85]
    compliance_rate = len(compliant) / len(df) * 100
    
    print(f"\nOverall Compliance Rate: {compliance_rate:.2f}%")
    
    return monthly

# Analyze
trends = analyze_accuracy_trends("data/audit.jsonl")
```

## Audit Checklist

### Documentation

- [ ] System card complete and current
- [ ] Technical architecture documented
- [ ] Accuracy thresholds defined
- [ ] Risk mitigation measures documented
- [ ] User training materials available

### Audit Logs

- [ ] All logs available (minimum 6 months)
- [ ] Logs verified for integrity
- [ ] Logs properly archived
- [ ] Log retention policy documented
- [ ] Backup procedures tested

### Compliance Reports

- [ ] Monthly reports for all periods
- [ ] All reports reviewed for accuracy
- [ ] Trends analysis completed
- [ ] Compliance rates calculated
- [ ] Incidents documented

### Monitoring

- [ ] Prometheus metrics operational
- [ ] Grafana dashboard configured
- [ ] Alerting rules active
- [ ] Alert history available
- [ ] Incident response procedures tested

### Incident Management

- [ ] All incidents documented
- [ ] Root cause analysis completed
- [ ] Resolution steps documented
- [ ] Prevention measures implemented
- [ ] Sign-offs obtained

## Audit Package

Prepare a complete audit package:

**Directory Structure:**
```
audit_package_2024/
├── 1_system_documentation/
│   ├── system_card.md
│   ├── technical_architecture.pdf
│   └── risk_assessment.pdf
├── 2_audit_logs/
│   ├── audit_2024_01.jsonl
│   ├── audit_2024_02.jsonl
│   └── ...
├── 3_compliance_reports/
│   ├── compliance_2024_01.html
│   ├── compliance_2024_02.html
│   └── ...
├── 4_incident_reports/
│   ├── IR-2024-001.md
│   └── ...
├── 5_metrics/
│   ├── accuracy_trends.pdf
│   ├── grafana_dashboard.json
│   └── prometheus_config.yml
├── 6_evidence/
│   ├── deployment_logs.txt
│   ├── configuration_snapshots/
│   └── test_results/
└── README.md
```

**Package Script:**
```python
import shutil
from pathlib import Path
from datetime import datetime

def create_audit_package(output_dir="audit_package"):
    """Create complete audit package."""
    base = Path(output_dir)
    base.mkdir(exist_ok=True)
    
    # 1. System Documentation
    docs = base / "1_system_documentation"
    docs.mkdir(exist_ok=True)
    shutil.copy("docs/system_card.md", docs)
    
    # 2. Audit Logs
    logs = base / "2_audit_logs"
    logs.mkdir(exist_ok=True)
    for log_file in Path("data").glob("audit_*.jsonl"):
        shutil.copy(log_file, logs)
    
    # 3. Compliance Reports
    reports = base / "3_compliance_reports"
    reports.mkdir(exist_ok=True)
    for report in Path("compliance_reports").glob("*.html"):
        shutil.copy(report, reports)
    
    # 4. Incident Reports
    incidents = base / "4_incident_reports"
    incidents.mkdir(exist_ok=True)
    for incident in Path("incidents").glob("*.md"):
        shutil.copy(incident, incidents)
    
    # 5. Metrics
    metrics = base / "5_metrics"
    metrics.mkdir(exist_ok=True)
    shutil.copy("grafana_dashboard.json", metrics)
    shutil.copy("prometheus.yml", metrics)
    
    print(f"Audit package created: {output_dir}")

create_audit_package()
```

## Common Audit Questions

### Q: How do you ensure accuracy?

**Answer:**
"We use CERT Framework for continuous accuracy monitoring. All outputs are measured against the input context using:
- Semantic similarity (sentence transformers)
- Natural Language Inference (NLI models)
- Grounding verification (hallucination detection)

Our healthcare preset requires ≥0.85 accuracy, which is logged automatically and reported monthly."

**Evidence:**
- Show compliance reports
- Demonstrate real-time monitoring
- Show audit logs

### Q: What happens when accuracy drops?

**Answer:**
"We have a circuit breaker that stops the system if accuracy drops below 0.70. For accuracy between 0.70-0.85, human review is required before outputs are used. All failures are logged and investigated."

**Evidence:**
- Show circuit breaker configuration
- Show incident reports
- Demonstrate Prometheus alerts

### Q: How do you ensure logging compliance?

**Answer:**
"All AI system operations are automatically logged in append-only JSONL format. Each log entry includes timestamp, query, context, answer, accuracy metrics, and compliance status. Logs are retained for 6+ months and backed up daily."

**Evidence:**
- Show audit logs
- Demonstrate log verification
- Show backup procedures

### Q: How often do you review system performance?

**Answer:**
"We generate compliance reports monthly, monitor accuracy in real-time via Prometheus, and conduct quarterly reviews. All incidents trigger immediate investigation and documentation."

**Evidence:**
- Show monthly reports
- Show Grafana dashboards
- Show incident reports

## Best Practices

### 1. Continuous Monitoring

```python
# Always monitor in production
monitored = wrap_langchain_chain(chain, preset="healthcare")

# Never skip monitoring
# BAD: chain.invoke(query)
# GOOD: monitored.invoke(query)
```

### 2. Regular Reporting

```python
import schedule

# Monthly reports
schedule.every().month.do(generate_audit_reports)

# Weekly backups
schedule.every().week.do(backup_audit_logs)
```

### 3. Incident Documentation

```python
# Document immediately
def handle_low_accuracy(result, query, context):
    if result.confidence < 0.70:
        log_incident(
            severity="high",
            description=f"Accuracy {result.confidence:.2f}",
            query=query,
            context=context
        )
```

### 4. Version Control

```python
# Tag system versions
# git tag -a v2.0.0 -m "Production deployment"
# git push origin v2.0.0

# Document in system card
"""
Version: 2.0.0
Deployment Date: 2024-01-15
Changes: Updated to GPT-4, increased accuracy threshold
"""
```

## See Also

- [EU AI Act Compliance Guide](eu-ai-act.md)
- [Report Customization](report-customization.md)
- [Integration Guides](../integrations/)
