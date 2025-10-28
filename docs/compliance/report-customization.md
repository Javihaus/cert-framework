# Report Customization Guide

Guide for customizing CERT Framework compliance reports to meet your organization's needs.

## Overview

CERT Framework generates comprehensive HTML compliance reports. This guide shows how to customize reports for different stakeholders, regulatory requirements, and organizational needs.

## Basic Report Generation

### Standard Report

```python
from cert import export_report

# Generate standard report
export_report(
    audit_log_path="data/audit.jsonl",
    output_path="compliance_report.html"
)
```

### Report Contents

Standard reports include 7 sections:
1. Executive Summary
2. Accuracy Metrics
3. EU AI Act Article 15 Compliance
4. Detailed Evaluation Results
5. Risk Analysis
6. Technical Details
7. Failure Analysis

## Customization Options

### Time Range Filtering

Filter reports by date range:

```python
import json
from datetime import datetime, timedelta
from pathlib import Path

def export_report_for_period(
    audit_log_path,
    start_date,
    end_date,
    output_path
):
    """Generate report for specific time period."""
    # Filter entries
    filtered_log = "data/filtered_audit.jsonl"
    
    with open(audit_log_path, "r") as infile:
        with open(filtered_log, "w") as outfile:
            for line in infile:
                try:
                    entry = json.loads(line)
                    timestamp = datetime.fromisoformat(entry["timestamp"])
                    
                    if start_date <= timestamp <= end_date:
                        outfile.write(line)
                except:
                    continue
    
    # Generate report
    export_report(filtered_log, output_path)
    
    # Cleanup
    Path(filtered_log).unlink()

# Monthly report
start = datetime(2024, 1, 1)
end = datetime(2024, 1, 31)
export_report_for_period(
    "data/audit.jsonl",
    start,
    end,
    "compliance_january_2024.html"
)
```

### System Filtering

Generate reports for specific systems:

```python
def export_report_for_system(
    audit_log_path,
    system_id,
    output_path
):
    """Generate report for specific system."""
    filtered_log = f"data/filtered_{system_id}.jsonl"
    
    with open(audit_log_path, "r") as infile:
        with open(filtered_log, "w") as outfile:
            for line in infile:
                try:
                    entry = json.loads(line)
                    if entry.get("system_id") == system_id:
                        outfile.write(line)
                except:
                    continue
    
    export_report(filtered_log, output_path)
    Path(filtered_log).unlink()

# System-specific report
export_report_for_system(
    "data/audit.jsonl",
    "medical_diagnosis_v2",
    "medical_system_report.html"
)
```

### Preset Filtering

Generate reports for specific risk levels:

```python
def export_report_for_preset(
    audit_log_path,
    preset,
    output_path
):
    """Generate report for specific preset."""
    filtered_log = f"data/filtered_{preset}.jsonl"
    
    with open(audit_log_path, "r") as infile:
        with open(filtered_log, "w") as outfile:
            for line in infile:
                try:
                    entry = json.loads(line)
                    if entry.get("preset") == preset:
                        outfile.write(line)
                except:
                    continue
    
    export_report(filtered_log, output_path)
    Path(filtered_log).unlink()

# Healthcare-only report
export_report_for_preset(
    "data/audit.jsonl",
    "healthcare",
    "healthcare_compliance.html"
)
```

## Custom Report Templates

### Executive Summary Only

For leadership:

```python
import json
import pandas as pd
from jinja2 import Template

def generate_executive_summary(audit_log_path, output_path):
    """Generate executive summary report."""
    # Load data
    data = []
    with open(audit_log_path, "r") as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("type") == "request":
                    data.append(entry)
            except:
                continue
    
    # Calculate metrics
    total = len(data)
    passed = sum(1 for e in data if e["accuracy_result"]["passed"])
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    # Calculate by preset
    by_preset = {}
    for entry in data:
        preset = entry.get("preset", "unknown")
        if preset not in by_preset:
            by_preset[preset] = {"total": 0, "passed": 0}
        by_preset[preset]["total"] += 1
        if entry["accuracy_result"]["passed"]:
            by_preset[preset]["passed"] += 1
    
    # Generate HTML
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Executive Summary</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .metric { background: #f5f5f5; padding: 20px; margin: 10px 0; }
            .pass { color: green; }
            .fail { color: red; }
        </style>
    </head>
    <body>
        <h1>Executive Summary</h1>
        <h2>Overall Performance</h2>
        <div class="metric">
            <h3>Compliance Rate: <span class="{{ 'pass' if pass_rate >= 80 else 'fail' }}">{{ pass_rate|round(2) }}%</span></h3>
            <p>Total Evaluations: {{ total }}</p>
            <p>Passed: {{ passed }}</p>
            <p>Failed: {{ total - passed }}</p>
        </div>
        
        <h2>By System Type</h2>
        {% for preset, stats in by_preset.items() %}
        <div class="metric">
            <h3>{{ preset|title }}</h3>
            <p>Pass Rate: {{ (stats.passed / stats.total * 100)|round(2) }}%</p>
            <p>Total: {{ stats.total }}</p>
        </div>
        {% endfor %}
        
        <h2>Compliance Status</h2>
        <p>EU AI Act Article 15: <span class="{{ 'pass' if pass_rate >= 80 else 'fail' }}">{{ 'COMPLIANT' if pass_rate >= 80 else 'NON-COMPLIANT' }}</span></p>
    </body>
    </html>
    """)
    
    html = template.render(
        total=total,
        passed=passed,
        pass_rate=pass_rate,
        by_preset=by_preset
    )
    
    with open(output_path, "w") as f:
        f.write(html)

generate_executive_summary("data/audit.jsonl", "executive_summary.html")
```

### Technical Deep Dive

For engineering teams:

```python
def generate_technical_report(audit_log_path, output_path):
    """Generate detailed technical report."""
    data = []
    with open(audit_log_path, "r") as f:
        for line in f:
            try:
                entry = json.loads(line)
                if entry.get("type") == "request":
                    data.append(entry)
            except:
                continue
    
    # Analyze metrics
    df = pd.DataFrame([
        {
            "timestamp": e["timestamp"],
            "accuracy": e["accuracy_result"]["accuracy_score"],
            "semantic": e["accuracy_result"]["metrics"]["semantic_score"],
            "nli": e["accuracy_result"]["metrics"]["nli_score"],
            "grounding": e["accuracy_result"]["metrics"]["grounding_score"],
            "preset": e.get("preset", "unknown")
        }
        for e in data
    ])
    
    # Generate statistics
    stats = df.groupby("preset").agg({
        "accuracy": ["mean", "std", "min", "max"],
        "semantic": ["mean", "std"],
        "nli": ["mean", "std"],
        "grounding": ["mean", "std"]
    })
    
    # Create report
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Technical Report</title>
        <style>
            body { font-family: monospace; margin: 40px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
        </style>
    </head>
    <body>
        <h1>Technical Report</h1>
        
        <h2>Metric Statistics by Preset</h2>
        {{ stats_table }}
        
        <h2>Metric Distributions</h2>
        <pre>{{ distributions }}</pre>
        
        <h2>Correlations</h2>
        <pre>{{ correlations }}</pre>
    </body>
    </html>
    """)
    
    html = template.render(
        stats_table=stats.to_html(),
        distributions=df.describe().to_string(),
        correlations=df.corr().to_string()
    )
    
    with open(output_path, "w") as f:
        f.write(html)

generate_technical_report("data/audit.jsonl", "technical_report.html")
```

### Regulatory Submission

For compliance officers:

```python
def generate_regulatory_report(audit_log_path, output_path):
    """Generate report for regulatory submission."""
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>EU AI Act Compliance Report</title>
        <style>
            body { font-family: Arial; margin: 40px; line-height: 1.6; }
            .section { margin: 30px 0; page-break-inside: avoid; }
            .requirement { background: #f0f0f0; padding: 15px; margin: 10px 0; }
            .compliant { color: green; font-weight: bold; }
            .non-compliant { color: red; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>EU AI Act Article 15 Compliance Report</h1>
        
        <div class="section">
            <h2>System Information</h2>
            <p><strong>System Name:</strong> {{ system_name }}</p>
            <p><strong>Risk Classification:</strong> {{ risk_class }}</p>
            <p><strong>Reporting Period:</strong> {{ period }}</p>
        </div>
        
        <div class="section">
            <h2>Article 15.1: Accuracy</h2>
            <div class="requirement">
                <p><strong>Requirement:</strong> Achieve appropriate level of accuracy</p>
                <p><strong>Implementation:</strong> Real-time accuracy monitoring with {{ threshold }} threshold</p>
                <p><strong>Status:</strong> <span class="{{ 'compliant' if compliant_15_1 else 'non-compliant' }}">{{ 'COMPLIANT' if compliant_15_1 else 'NON-COMPLIANT' }}</span></p>
                <p><strong>Evidence:</strong> {{ evidence_15_1 }}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Article 15.4: Robustness</h2>
            <div class="requirement">
                <p><strong>Requirement:</strong> Resilience against errors and faults</p>
                <p><strong>Implementation:</strong> Circuit breaker at {{ circuit_threshold }} accuracy</p>
                <p><strong>Status:</strong> <span class="compliant">COMPLIANT</span></p>
                <p><strong>Evidence:</strong> {{ evidence_15_4 }}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Article 19: Logging</h2>
            <div class="requirement">
                <p><strong>Requirement:</strong> Automatic recording of events</p>
                <p><strong>Implementation:</strong> Append-only JSONL audit logs</p>
                <p><strong>Status:</strong> <span class="compliant">COMPLIANT</span></p>
                <p><strong>Evidence:</strong> {{ evidence_19 }}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Supporting Documentation</h2>
            <ul>
                <li>Audit Logs: {{ log_count }} entries</li>
                <li>Time Range: {{ time_range }}</li>
                <li>Compliance Reports: {{ report_count }} monthly reports</li>
                <li>Incident Reports: {{ incident_count }} incidents</li>
            </ul>
        </div>
    </body>
    </html>
    """)
    
    # Calculate metrics
    # ... (implementation details)
    
    html = template.render(**metrics)
    
    with open(output_path, "w") as f:
        f.write(html)

generate_regulatory_report("data/audit.jsonl", "regulatory_submission.html")
```

## Report Scheduling

### Automated Generation

```python
import schedule
import time
from datetime import datetime

def generate_scheduled_reports():
    """Generate all scheduled reports."""
    date_str = datetime.now().strftime("%Y_%m_%d")
    
    # Executive summary (weekly)
    generate_executive_summary(
        "data/audit.jsonl",
        f"reports/executive_{date_str}.html"
    )
    
    # Technical report (monthly)
    if datetime.now().day == 1:
        generate_technical_report(
            "data/audit.jsonl",
            f"reports/technical_{date_str}.html"
        )
    
    # Regulatory report (quarterly)
    if datetime.now().month in [1, 4, 7, 10] and datetime.now().day == 1:
        generate_regulatory_report(
            "data/audit.jsonl",
            f"reports/regulatory_{date_str}.html"
        )

# Schedule
schedule.every().monday.at("00:00").do(generate_scheduled_reports)

while True:
    schedule.run_pending()
    time.sleep(3600)  # Check hourly
```

## Best Practices

### 1. Multiple Stakeholders

Generate different reports for different audiences:

```python
# Leadership: Executive summary
generate_executive_summary("data/audit.jsonl", "exec_report.html")

# Engineering: Technical deep dive
generate_technical_report("data/audit.jsonl", "tech_report.html")

# Compliance: Regulatory submission
generate_regulatory_report("data/audit.jsonl", "compliance_report.html")
```

### 2. Version Control

Track report versions:

```python
def export_versioned_report(audit_log_path, base_name):
    """Export report with version number."""
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = f"reports/{base_name}_v{timestamp}.html"
    
    export_report(audit_log_path, output_path)
    
    # Create latest symlink
    import os
    latest = f"reports/{base_name}_latest.html"
    if os.path.exists(latest):
        os.remove(latest)
    os.symlink(output_path, latest)
    
    return output_path

# Generate versioned report
path = export_versioned_report("data/audit.jsonl", "compliance")
print(f"Report generated: {path}")
```

### 3. Report Archives

Maintain historical archives:

```python
def archive_report(report_path, archive_dir="report_archive"):
    """Archive report with metadata."""
    import shutil
    from pathlib import Path
    from datetime import datetime
    
    archive = Path(archive_dir) / str(datetime.now().year)
    archive.mkdir(parents=True, exist_ok=True)
    
    shutil.copy(report_path, archive)
    
    # Create index
    index_path = archive / "index.txt"
    with open(index_path, "a") as f:
        f.write(f"{datetime.now()}: {report_path}\n")

archive_report("compliance_report.html")
```

## See Also

- [EU AI Act Compliance Guide](eu-ai-act.md)
- [Audit Preparation Guide](audit-preparation.md)
- [Integration Guides](../integrations/)
