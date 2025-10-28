# HTML/PDF Professional Reporting Implementation Guide

**Future Enhancement: Professional EU AI Act Compliance Reports**

Version: 2.0.0
Last Updated: 2025-10-28
Status: Implementation Guide (Not Yet Implemented)

**Note**: As of v2.0.0, text reports now include Section 7: Failure Analysis with detailed explanations for non-compliant requests.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Implementation Phases](#implementation-phases)
- [File Structure](#file-structure)
- [HTML Template Design](#html-template-design)
- [CSS Styling](#css-styling)
- [Python Implementation](#python-implementation)
- [PDF Generation](#pdf-generation)
- [Testing Plan](#testing-plan)
- [Deployment](#deployment)

---

## Overview

### Current State (v2.0.0)

CERT Framework currently generates compliance reports in three formats:
- **Text (.txt)**: Plain-text with ASCII art borders (includes Section 7: Failure Analysis)
- **JSON (.json)**: Machine-readable structured data
- **CSV (.csv)**: Spreadsheet-compatible tabular data

**Current Features (v2.0.0)**:
- Section 7: Failure Analysis with human-readable explanations
- Evidence-based failure reasons (contradiction, hallucination, off-topic)
- Severity assessment (high/medium/low)
- Actionable recommendations for each failure

**Enhancement Need**: Professional PDF reports with:
- Proper visual design and typography
- EU AI Act official branding (EU colors/styling)
- Print-ready formatting
- Embedded charts and visualizations (future)

### Proposed Enhancement (v3.1+)

Add HTML/PDF reporting capabilities using **WeasyPrint + Jinja2**:
- **HTML templates**: Designer-friendly, maintainable
- **CSS styling**: Professional, print-optimized
- **PDF generation**: High-quality, standards-compliant
- **No browser dependency**: Pure Python implementation

---

## Technology Stack

### Recommended: WeasyPrint + Jinja2

**Why WeasyPrint?**
- ✅ Modern CSS support (flexbox, grid, media queries)
- ✅ Print-specific CSS (`@page`, page breaks, headers/footers)
- ✅ No browser/headless Chrome dependency
- ✅ Pure Python (easy installation)
- ✅ Excellent for compliance documents
- ✅ Active development and support

**Why Jinja2?**
- ✅ Already widely used in Python ecosystem
- ✅ Template inheritance and includes
- ✅ Designer-friendly syntax
- ✅ Good error messages
- ✅ Fast rendering

### Dependencies to Add

```toml
# pyproject.toml additions
[project.optional-dependencies]
reports = [
    "jinja2>=3.1.0",
    "weasyprint>=62.0",
    "pygments>=2.15.0",  # For code syntax highlighting (optional)
]
```

**Installation**:
```bash
# Basic CERT (current)
pip install cert-framework

# With professional PDF reports (future)
pip install cert-framework[reports]
```

### Alternative Technologies (Not Recommended)

| Technology | Pros | Cons | Verdict |
|------------|------|------|---------|
| **ReportLab** | Low-level control, mature | Steeper learning curve, less maintainable | ❌ Too complex |
| **Python-docx → PDF** | Familiar MS Word format | Requires external conversion, less control | ❌ External dependency |
| **Playwright/Puppeteer** | Perfect Chrome rendering | Heavy dependency, slower | ❌ Overkill |
| **FPDF/FPDF2** | Lightweight, simple | Limited typography, no modern CSS | ❌ Too limited |

---

## Implementation Phases

### Phase 1: HTML Template System (Week 1)

1. Create Jinja2 template structure
2. Implement `reports_html.py` module
3. Generate HTML reports
4. Test HTML rendering in browsers

**Deliverable**: `export_html_report()` function that generates professional HTML

### Phase 2: Professional CSS Styling (Week 2)

1. Design CSS stylesheet for compliance reports
2. Implement EU AI Act visual branding
3. Create print-optimized styles
4. Test cross-browser rendering

**Deliverable**: Professional, print-ready HTML reports

### Phase 3: PDF Generation (Week 3)

1. Integrate WeasyPrint
2. Implement `reports_pdf.py` module
3. Configure PDF-specific CSS (`@page` rules)
4. Add page numbers, headers, footers

**Deliverable**: `export_pdf_report()` function that generates professional PDFs

### Phase 4: Advanced Features (Week 4)

1. Add chart/graph generation (matplotlib integration)
2. Add logo/branding customization
3. Add multi-language support (i18n)
4. Performance optimization

**Deliverable**: Feature-complete professional reporting system

---

## File Structure

### Proposed Directory Layout

```
cert-framework/
├── cert/
│   ├── reports.py                  # Current text/JSON/CSV reports
│   ├── reports_html.py             # NEW: HTML report generation
│   ├── reports_pdf.py              # NEW: PDF report generation
│   ├── templates/                  # NEW: Jinja2 templates
│   │   ├── base.html               # Base template
│   │   ├── compliance_report.html  # Main report template
│   │   ├── components/             # Reusable components
│   │   │   ├── header.html
│   │   │   ├── footer.html
│   │   │   ├── section_article15.html
│   │   │   ├── section_article19.html
│   │   │   ├── section_annexiv.html
│   │   │   └── disclaimers.html
│   │   └── styles/                 # Embedded stylesheets
│   │       └── compliance.css
│   └── static/                     # NEW: Static assets
│       ├── images/
│       │   ├── cert_logo.svg
│       │   └── eu_flag.svg
│       └── fonts/                  # Optional: Custom fonts
│           └── ...
├── docs/
│   └── HTML_PDF_REPORTING_GUIDE.md # This document
└── examples/
    └── reports/
        ├── generate_html_report.py
        └── generate_pdf_report.py
```

---

## HTML Template Design

### Base Template (`templates/base.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ report_title }} - EU AI Act Compliance Report</title>

    <style>
        {% include 'styles/compliance.css' %}
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        {% include 'components/header.html' %}

        <!-- Main Content -->
        <main class="report-content">
            {% block content %}{% endblock %}
        </main>

        <!-- Footer -->
        {% include 'components/footer.html' %}
    </div>
</body>
</html>
```

### Compliance Report Template (`templates/compliance_report.html`)

```html
{% extends "base.html" %}

{% block content %}

<!-- Section 1: System Identification -->
<section class="report-section" id="section-1">
    <h1 class="section-header">
        <span class="section-number">Section 1</span>
        System Identification
    </h1>

    <div class="info-grid">
        <div class="info-item">
            <span class="info-label">System Name:</span>
            <span class="info-value">{{ system_name }}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Monitoring Period:</span>
            <span class="info-value">{{ monitoring_period }}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Report Date:</span>
            <span class="info-value">{{ report_date }}</span>
        </div>
    </div>

    <div class="reference-box">
        <h3>Reference Documents</h3>
        <ul>
            <li>Regulation (EU) 2024/1689 (Artificial Intelligence Act)</li>
            <li>Article 11 (Technical Documentation Requirements)</li>
            <li>Article 15 (Accuracy, Robustness and Cybersecurity)</li>
            <li>Article 19 (Automatically Generated Logs)</li>
            <li>Annex IV (Technical Documentation)</li>
        </ul>
    </div>
</section>

<!-- Section 2: Article 15.1 -->
{% include 'components/section_article15.html' %}

<!-- Section 3: Article 15.4 -->
<section class="report-section" id="section-3">
    <h1 class="section-header">
        <span class="section-number">Section 3</span>
        Article 15.4 - Robustness & Resilience
    </h1>

    <div class="regulatory-quote">
        <p><strong>Regulatory Requirement (EU 2024/1689, Article 15, Paragraph 4):</strong></p>
        <blockquote>
            "High-risk AI systems shall be as resilient as possible regarding
            errors, faults or inconsistencies that may occur within the system
            or the environment in which the system operates..."
        </blockquote>
    </div>

    <table class="metrics-table">
        <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Threshold</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>System Error Rate</td>
                <td>{{ stats.error_rate | percentage }}</td>
                <td>≤5.0%</td>
                <td class="{{ 'pass' if stats.error_rate <= 0.05 else 'fail' }}">
                    {{ '✓ PASS' if stats.error_rate <= 0.05 else '✗ FAIL' }}
                </td>
            </tr>
            <tr>
                <td>Success Rate</td>
                <td>{{ (1 - stats.error_rate) | percentage }}</td>
                <td>≥95.0%</td>
                <td class="{{ 'pass' if (1 - stats.error_rate) >= 0.95 else 'fail' }}">
                    {{ '✓ PASS' if (1 - stats.error_rate) >= 0.95 else '✗ FAIL' }}
                </td>
            </tr>
        </tbody>
    </table>
</section>

<!-- Section 4: Article 19 -->
{% include 'components/section_article19.html' %}

<!-- Section 5: Annex IV -->
{% include 'components/section_annexiv.html' %}

<!-- Section 6: Overall Compliance -->
<section class="report-section" id="section-6">
    <h1 class="section-header">
        <span class="section-number">Section 6</span>
        Overall Compliance Determination
    </h1>

    <table class="compliance-summary">
        <tr>
            <td>Article 15.1 - Accuracy</td>
            <td class="{{ 'pass' if stats.accuracy_compliant else 'fail' }}">
                {{ '✓ PASS' if stats.accuracy_compliant else '✗ FAIL' }}
            </td>
        </tr>
        <tr>
            <td>Article 15.3 - Declaration</td>
            <td class="{{ 'pass' if stats.accuracy_compliant else 'fail' }}">
                {{ '✓ PASS' if stats.accuracy_compliant else '✗ FAIL' }}
            </td>
        </tr>
        <tr>
            <td>Article 15.4 - Robustness</td>
            <td class="{{ 'pass' if stats.robustness_compliant else 'fail' }}">
                {{ '✓ PASS' if stats.robustness_compliant else '✗ FAIL' }}
            </td>
        </tr>
        <tr>
            <td>Article 19 - Audit Logging</td>
            <td class="{{ 'pass' if stats.audit_compliant else 'fail' }}">
                {{ '✓ PASS' if stats.audit_compliant else '✗ FAIL' }}
            </td>
        </tr>
    </table>

    <div class="overall-status {{ 'compliant' if stats.overall_compliant else 'non-compliant' }}">
        <h2>
            {{ '✓' if stats.overall_compliant else '✗' }}
            {{ 'COMPLIANT' if stats.overall_compliant else 'NON-COMPLIANT' }}
        </h2>
        <p>
            {{ 'All monitored metrics meet or exceed EU AI Act requirements.' if stats.overall_compliant
               else 'System requires attention: One or more metrics below compliance thresholds.' }}
        </p>
    </div>
</section>

<!-- Section 7: Failure Analysis -->
<section class="report-section" id="section-7">
    <h1 class="section-header">
        <span class="section-number">Section 7</span>
        Failure Analysis
    </h1>

    {% if failure_explanations %}
    <p>This section provides detailed analysis of non-compliant requests with actionable recommendations for improvement.</p>

    <p><strong>Total Non-Compliant Requests:</strong> {{ failure_explanations|length }}</p>

    {% for failure in failure_explanations[-5:] %}
    <div class="failure-box">
        <h3>Failure #{{ loop.index }}</h3>
        <div class="failure-meta">
            <span><strong>Timestamp:</strong> {{ failure.timestamp }}</span>
            <span><strong>Function:</strong> {{ failure.function }}</span>
        </div>

        <p><strong>Reason:</strong> {{ failure.explanation.reason }}</p>
        <p><strong>Severity:</strong> <span class="severity-{{ failure.explanation.severity }}">{{ failure.explanation.severity|upper }}</span></p>

        <div class="evidence-section">
            <strong>Evidence:</strong>
            <ul>
                {% for evidence in failure.explanation.evidence %}
                <li>{{ evidence }}</li>
                {% endfor %}
            </ul>
        </div>

        <div class="recommendation-box">
            <strong>Recommendation:</strong>
            <p>{{ failure.explanation.recommendation }}</p>
        </div>
    </div>
    {% endfor %}

    {% if failure_explanations|length > 5 %}
    <p class="note">(Showing 5 most recent failures. Total: {{ failure_explanations|length }})</p>
    {% endif %}

    {% else %}
    <p>No failure explanations available. This indicates either:</p>
    <ul>
        <li>All requests are compliant (100% compliance rate)</li>
        <li>Monitoring has just been enabled</li>
        <li>Audit log does not yet contain detailed failure data</li>
    </ul>
    {% endif %}
</section>

<!-- Section 8: Recommendations -->
<section class="report-section" id="section-8">
    <h1 class="section-header">
        <span class="section-number">Section 8</span>
        Recommendations & Continuous Improvement
    </h1>

    {% if recommendations %}
    <ul class="recommendations-list">
        {% for rec in recommendations %}
        <li>{{ rec }}</li>
        {% endfor %}
    </ul>
    {% else %}
    <p class="no-recommendations">
        ✓ No immediate actions required. System meets all compliance thresholds.
    </p>
    {% endif %}
</section>

<!-- Section 9: Disclaimers -->
{% include 'components/disclaimers.html' %}

{% endblock %}
```

---

## CSS Styling

### Professional Compliance Stylesheet (`templates/styles/compliance.css`)

```css
/* ============================================
   EU AI Act Compliance Report Stylesheet
   ============================================ */

/* === PAGE SETUP (PDF) === */
@page {
    size: A4;
    margin: 2.5cm 2cm;

    @top-center {
        content: "EU AI Act Compliance Report";
        font-size: 10pt;
        color: #003399;
        font-weight: 600;
    }

    @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #666;
    }

    @bottom-left {
        content: "Generated by CERT Framework";
        font-size: 9pt;
        color: #666;
    }
}

/* === BASE STYLES === */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: "Helvetica Neue", "Arial", "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
}

.report-container {
    max-width: 210mm; /* A4 width */
    margin: 0 auto;
    background: white;
}

/* === TYPOGRAPHY === */
h1 {
    color: #003399; /* EU Blue */
    font-size: 18pt;
    font-weight: 700;
    margin: 1.5em 0 0.75em 0;
    border-bottom: 3px solid #FFCC00; /* EU Gold */
    padding-bottom: 0.3em;
    page-break-after: avoid;
}

h2 {
    color: #003399;
    font-size: 14pt;
    font-weight: 600;
    margin: 1.2em 0 0.6em 0;
    page-break-after: avoid;
}

h3 {
    color: #555;
    font-size: 12pt;
    font-weight: 600;
    margin: 1em 0 0.5em 0;
}

p {
    margin: 0.5em 0;
}

/* === SECTION HEADERS === */
.section-header {
    display: flex;
    align-items: center;
    gap: 0.5em;
}

.section-number {
    display: inline-block;
    background: #003399;
    color: white;
    padding: 0.2em 0.6em;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: 600;
}

/* === REGULATORY QUOTES === */
.regulatory-quote {
    background-color: #f8f9fa;
    border-left: 4px solid #003399;
    padding: 1em 1.5em;
    margin: 1em 0;
    page-break-inside: avoid;
}

.regulatory-quote blockquote {
    font-style: italic;
    color: #555;
    margin: 0.5em 0 0 0;
    line-height: 1.5;
}

/* === TABLES === */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    page-break-inside: avoid;
}

table thead {
    background-color: #003399;
    color: white;
}

table th {
    padding: 0.75em;
    text-align: left;
    font-weight: 600;
    font-size: 10pt;
}

table td {
    padding: 0.6em 0.75em;
    border: 1px solid #ddd;
    font-size: 10pt;
}

table tbody tr:nth-child(even) {
    background-color: #f8f9fa;
}

/* === STATUS INDICATORS === */
.pass {
    color: #28a745;
    font-weight: 600;
}

.fail {
    color: #dc3545;
    font-weight: 600;
}

.partial {
    color: #ffc107;
    font-weight: 600;
}

/* === OVERALL STATUS BOX === */
.overall-status {
    margin: 1.5em 0;
    padding: 1.5em;
    border: 3px solid;
    border-radius: 8px;
    text-align: center;
    page-break-inside: avoid;
}

.overall-status.compliant {
    background-color: #d4edda;
    border-color: #28a745;
    color: #155724;
}

.overall-status.non-compliant {
    background-color: #f8d7da;
    border-color: #dc3545;
    color: #721c24;
}

.overall-status h2 {
    font-size: 24pt;
    margin: 0 0 0.5em 0;
}

.overall-status p {
    font-size: 12pt;
    margin: 0;
}

/* === INFO GRID === */
.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1em;
    margin: 1em 0;
}

.info-item {
    display: flex;
    flex-direction: column;
    padding: 0.75em;
    background: #f8f9fa;
    border-radius: 4px;
}

.info-label {
    font-weight: 600;
    color: #003399;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.3em;
}

.info-value {
    font-size: 11pt;
    color: #333;
}

/* === REFERENCE BOX === */
.reference-box {
    background: #e7f3ff;
    border: 2px solid #003399;
    border-radius: 4px;
    padding: 1em;
    margin: 1em 0;
    page-break-inside: avoid;
}

.reference-box h3 {
    color: #003399;
    margin-top: 0;
}

.reference-box ul {
    margin-left: 1.5em;
    margin-bottom: 0;
}

.reference-box li {
    margin: 0.3em 0;
}

/* === FAILURE ANALYSIS === */
.failure-box {
    background: #fff;
    border: 2px solid #ddd;
    border-left: 4px solid #dc3545;
    border-radius: 4px;
    padding: 1.5em;
    margin: 1em 0;
    page-break-inside: avoid;
}

.failure-box h3 {
    color: #dc3545;
    margin-top: 0;
}

.failure-meta {
    display: flex;
    gap: 2em;
    font-size: 9pt;
    color: #666;
    margin-bottom: 1em;
}

.severity-high {
    color: #dc3545;
    font-weight: 700;
}

.severity-medium {
    color: #fd7e14;
    font-weight: 600;
}

.severity-low {
    color: #ffc107;
    font-weight: 600;
}

.evidence-section {
    background: #f8f9fa;
    border-left: 3px solid #6c757d;
    padding: 0.75em 1em;
    margin: 1em 0;
}

.evidence-section ul {
    margin: 0.5em 0 0 1.5em;
}

.evidence-section li {
    margin: 0.3em 0;
}

.recommendation-box {
    background: #e7f3ff;
    border-left: 3px solid #0056b3;
    padding: 0.75em 1em;
    margin: 1em 0 0 0;
}

.recommendation-box p {
    margin: 0.3em 0 0 0;
    color: #004085;
}

/* === DISCLAIMERS === */
.disclaimers {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 4px;
    padding: 1.5em;
    margin: 2em 0;
    page-break-inside: avoid;
}

.disclaimers h2 {
    color: #856404;
    margin-top: 0;
}

.disclaimers ul {
    margin-left: 1.5em;
}

.disclaimers li {
    margin: 0.5em 0;
}

/* === PAGE BREAKS === */
.report-section {
    page-break-before: auto;
    page-break-after: auto;
    page-break-inside: avoid;
}

.no-break {
    page-break-inside: avoid;
}

/* === PRINT OPTIMIZATION === */
@media print {
    body {
        background: white;
    }

    .report-container {
        max-width: 100%;
    }

    /* Hide non-essential content for print */
    .no-print {
        display: none;
    }

    /* Force page breaks */
    .page-break-before {
        page-break-before: always;
    }

    .page-break-after {
        page-break-after: always;
    }
}

/* === SCREEN-ONLY STYLES === */
@media screen {
    .report-container {
        padding: 2em;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        margin: 2em auto;
    }
}
```

---

## Python Implementation

### HTML Report Generation (`cert/reports_html.py`)

```python
"""HTML report generation for EU AI Act compliance.

Generates professional HTML compliance reports using Jinja2 templates.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

try:
    from jinja2 import Environment, PackageLoader, select_autoescape
    JINJA2_AVAILABLE = True
except ImportError:
    JINJA2_AVAILABLE = False

from cert.reports import _load_audit_statistics


def export_html_report(
    output_path: str = "cert_compliance_report.html",
    audit_log: str = "cert_audit.jsonl",
    system_name: str = "LLM System",
    system_version: Optional[str] = None,
    provider_name: Optional[str] = None,
    high_risk_classification: Optional[str] = None,
    **kwargs
) -> str:
    """Generate professional HTML compliance report.

    Args:
        output_path: Path to save HTML report
        audit_log: Path to audit log file
        system_name: Name of the AI system
        system_version: Version number of the system
        provider_name: Organization name
        high_risk_classification: High-risk classification details
        **kwargs: Additional template variables

    Returns:
        Path to generated HTML file

    Raises:
        ImportError: If jinja2 is not installed

    Examples:
        >>> export_html_report(
        ...     output_path="report.html",
        ...     system_name="Financial RAG System",
        ...     system_version="2.1.0",
        ...     provider_name="Acme Corp"
        ... )
        'report.html'
    """
    if not JINJA2_AVAILABLE:
        raise ImportError(
            "jinja2 is required for HTML reports. "
            "Install with: pip install cert-framework[reports]"
        )

    # Load audit statistics
    stats = _load_audit_statistics(audit_log)

    # Determine compliance status
    stats["accuracy_compliant"] = stats["mean_accuracy"] >= 0.90
    stats["robustness_compliant"] = stats["error_rate"] <= 0.05
    stats["hallucination_compliant"] = stats["hallucination_rate"] <= 0.05
    stats["audit_compliant"] = stats["total_requests"] > 0
    stats["overall_compliant"] = (
        stats["accuracy_compliant"]
        and stats["robustness_compliant"]
        and stats["hallucination_compliant"]
        and stats["audit_compliant"]
    )

    # Setup Jinja2 environment
    env = Environment(
        loader=PackageLoader('cert', 'templates'),
        autoescape=select_autoescape(['html', 'xml'])
    )

    # Add custom filters
    env.filters['percentage'] = lambda x: f"{x:.1%}"

    # Load template
    template = env.get_template('compliance_report.html')

    # Render template
    html_content = template.render(
        system_name=system_name,
        system_version=system_version or "N/A",
        provider_name=provider_name or "[Organization Name]",
        high_risk_classification=high_risk_classification or "N/A",
        report_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        monitoring_period=f"{stats['period_start'] or 'N/A'} to {stats['period_end'] or 'N/A'}",
        stats=stats,
        **kwargs
    )

    # Write to file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open('w', encoding='utf-8') as f:
        f.write(html_content)

    return str(output_file)
```

### PDF Report Generation (`cert/reports_pdf.py`)

```python
"""PDF report generation for EU AI Act compliance.

Generates professional PDF compliance reports using WeasyPrint.
"""

from pathlib import Path
from typing import Optional

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

from cert.reports_html import export_html_report


def export_pdf_report(
    output_path: str = "cert_compliance_report.pdf",
    audit_log: str = "cert_audit.jsonl",
    system_name: str = "LLM System",
    **kwargs
) -> str:
    """Generate professional PDF compliance report.

    Args:
        output_path: Path to save PDF report
        audit_log: Path to audit log file
        system_name: Name of the AI system
        **kwargs: Additional arguments passed to export_html_report()

    Returns:
        Path to generated PDF file

    Raises:
        ImportError: If weasyprint is not installed

    Examples:
        >>> export_pdf_report(
        ...     output_path="report.pdf",
        ...     system_name="Financial RAG System"
        ... )
        'report.pdf'
    """
    if not WEASYPRINT_AVAILABLE:
        raise ImportError(
            "weasyprint is required for PDF reports. "
            "Install with: pip install cert-framework[reports]"
        )

    # Generate HTML first
    html_path = output_path.replace('.pdf', '.html')
    export_html_report(
        output_path=html_path,
        audit_log=audit_log,
        system_name=system_name,
        **kwargs
    )

    # Convert HTML to PDF
    html_file = HTML(filename=html_path)
    pdf_file = Path(output_path)
    pdf_file.parent.mkdir(parents=True, exist_ok=True)

    # Generate PDF with optimized settings
    html_file.write_pdf(
        str(pdf_file),
        stylesheets=None,  # Styles embedded in HTML
        optimize_images=True
    )

    # Optionally remove temporary HTML file
    # Path(html_path).unlink()

    return str(pdf_file)
```

---

## PDF Generation

### PDF-Specific CSS Features

```css
/* Page numbers and headers */
@page {
    @top-center {
        content: "EU AI Act Compliance Report - " string(system-name);
    }

    @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
    }
}

/* Page breaks */
.page-break-before {
    page-break-before: always;
}

.page-break-after {
    page-break-after: always;
}

.no-page-break {
    page-break-inside: avoid;
}

/* Running headers */
h1 {
    string-set: section-title content();
}

/* Table of contents (future) */
@page :first {
    @bottom-center {
        content: none;
    }
}
```

---

## Testing Plan

### Unit Tests

```python
# tests/test_reports_html.py

import pytest
from cert.reports_html import export_html_report

def test_html_report_generation(tmp_path):
    """Test basic HTML report generation."""
    output_file = tmp_path / "report.html"

    result = export_html_report(
        output_path=str(output_file),
        audit_log="tests/fixtures/sample_audit.jsonl",
        system_name="Test System"
    )

    assert Path(result).exists()
    assert Path(result).stat().st_size > 0

    # Check HTML content
    content = Path(result).read_text()
    assert "EU AI ACT COMPLIANCE REPORT" in content
    assert "Test System" in content
    assert "Article 15" in content

def test_pdf_report_generation(tmp_path):
    """Test PDF report generation."""
    pytest.importorskip("weasyprint")

    from cert.reports_pdf import export_pdf_report

    output_file = tmp_path / "report.pdf"

    result = export_pdf_report(
        output_path=str(output_file),
        audit_log="tests/fixtures/sample_audit.jsonl",
        system_name="Test System"
    )

    assert Path(result).exists()
    assert Path(result).stat().st_size > 1000  # PDF should be substantial
    assert Path(result).read_bytes().startswith(b'%PDF')  # PDF magic number
```

### Visual Regression Testing

Use browser screenshots to detect visual changes:

```bash
# Install playwright for screenshots
pip install playwright
playwright install chromium

# Generate reference screenshots
python scripts/generate_report_screenshots.py --reference

# Compare against reference
python scripts/generate_report_screenshots.py --compare
```

---

## Deployment

### Installation Instructions

Update `README.md`:

```markdown
## Installation

### Basic Installation

```bash
pip install cert-framework
```

### With Professional PDF Reports (Optional)

```bash
pip install cert-framework[reports]
```

**Requirements for PDF reports**:
- Python 3.8+
- System libraries: libcairo2, libpango-1.0-0, libgdk-pixbuf2.0-0

**macOS**:
```bash
brew install cairo pango gdk-pixbuf
pip install cert-framework[reports]
```

**Ubuntu/Debian**:
```bash
sudo apt-get install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0
pip install cert-framework[reports]
```
```

### Usage Examples

```python
from cert import monitor, export_pdf_report

# Enable monitoring
@monitor(preset="financial")
def my_rag_system(query):
    return pipeline(query)

# Generate professional PDF report
export_pdf_report(
    output_path="compliance_report.pdf",
    system_name="Financial Services RAG",
    system_version="2.1.0",
    provider_name="Acme Financial Corp",
    high_risk_classification="Yes, Annex III Point 5(b)",
    format="pdf"
)
```

---

## Timeline and Milestones

| Phase | Duration | Milestone | Status |
|-------|----------|-----------|--------|
| Planning | 1 week | Implementation guide complete | ✅ Done |
| Phase 1 | 1 week | HTML reports functional | ⏳ Pending |
| Phase 2 | 1 week | Professional CSS styling complete | ⏳ Pending |
| Phase 3 | 1 week | PDF generation working | ⏳ Pending |
| Phase 4 | 1 week | Advanced features (charts, logos) | ⏳ Pending |
| Testing | 1 week | All tests passing, visual QA | ⏳ Pending |
| Documentation | 3 days | User guide, examples updated | ⏳ Pending |
| Release | 1 day | v3.1.0 released with PDF reports | ⏳ Pending |

**Total Estimated Time**: 6-7 weeks

---

## Success Criteria

✅ **Functionality**:
- [ ] HTML reports generate successfully
- [ ] PDF reports generate successfully
- [ ] All EU AI Act citations present and accurate
- [ ] Reports render correctly in Chrome, Firefox, Safari
- [ ] PDFs print correctly on A4 paper

✅ **Quality**:
- [ ] Professional visual design
- [ ] Proper typography and spacing
- [ ] EU AI Act official branding (colors, styling)
- [ ] 100% accurate Article/Paragraph citations
- [ ] Proper page breaks and formatting

✅ **Usability**:
- [ ] Simple API (same as current text reports)
- [ ] Clear installation instructions
- [ ] Example code provided
- [ ] Error messages helpful

✅ **Performance**:
- [ ] HTML generation <1 second
- [ ] PDF generation <5 seconds
- [ ] Memory usage <500MB

---

## See Also

- [Documentation Improvement Plan](DOCUMENTATION_IMPROVEMENT_PLAN.md) - Overall improvement roadmap
- [EU AI Act Mapping](EU_AI_ACT_MAPPING.md) - Compliance requirements
- [Parameter Reference](PARAMETER_REFERENCE.md) - Complete API documentation

---

**Status**: Implementation Guide Complete
**Next Step**: Begin Phase 1 implementation
**Est. Completion**: Q2 2025

**Questions?**
- GitHub Issues: https://github.com/Javihaus/cert-framework/issues

**Document Version**: 1.1
**Last Updated**: 2025-10-28
**Changes in v1.1**: Updated for Phase 2 (Explanation System) - Added Section 7: Failure Analysis
