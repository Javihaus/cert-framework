# CERT Dashboard Automation Features

This document describes the **no-code automation features** added to the CERT Dashboard, enabling non-technical users to perform compliance tasks without writing code.

## Overview

The dashboard now includes three major automation capabilities (P1 Priority):

1. **Risk Assessment Wizard** - Interactive EU AI Act risk classification with PDF reports
2. **Compliance Document Generator** - Automated document generation from traces
3. **Compliance Audit System** - Automated Article 15 accuracy audits

---

## Feature 1: Risk Assessment Wizard

**URL:** `/assessment`

### Description

Interactive questionnaire-based risk assessment tool that classifies AI systems according to EU AI Act Annex III and evaluates organizational readiness.

### Features

- **10-question assessment** (5 risk + 5 readiness)
- **Real-time scoring** and classification
- **Professional PDF reports** with email delivery
- **Cost and timeline estimates** based on risk level
- **Actionable recommendations** for compliance

### How to Use

1. Navigate to `/assessment` in the dashboard
2. Answer all 10 questions by selecting options
3. Review your assessment results:
   - Risk Level (PROHIBITED, HIGH_RISK, LIMITED_RISK, MINIMAL_RISK)
   - Readiness Score (0-100%)
   - Compliance requirements
   - Estimated cost and timeline
4. Enter your email address
5. Click "Download Report" to generate PDF

### PDF Generation

The PDF report includes:
- Executive summary with risk classification
- Detailed scores and metrics
- Compliance requirements checklist
- Resource estimates (cost & timeline)
- Current state assessment (strengths & gaps)
- Recommended next steps

### Technical Details

- **Frontend:** React component at `/dashboard/app/assessment/page.tsx`
- **API:** `/api/generate-assessment-pdf`
- **Backend:** Python script using `reportlab` at `/scripts/generate_assessment_pdf.py`

---

## Feature 2: Compliance Document Generator

**URL:** `/generate`

### Description

Automated generation of EU AI Act compliance documentation from production traces. Generates Word documents with auto-populated data and expert input sections.

### Features

- **5 document types** (2 required, 3 optional):
  - Risk Classification Report (2-3 pages) *Required*
  - Annex IV Technical Documentation (20-25 pages) *Required*
  - Article 15 Compliance Report (5-8 pages)
  - Audit Trail Setup Guide (3-4 pages)
  - Monitoring Framework (4-6 pages)

- **Auto-population** from traces:
  - System metadata
  - Performance metrics
  - Error rates and latency
  - Token usage and costs

- **Expert input sections** clearly marked
- **ZIP download** with all selected documents

### How to Use

1. Navigate to `/generate` in the dashboard
2. **Step 1:** Upload traces file (JSONL format from CERT monitoring)
3. **Step 2:** Fill in system information:
   - System name *
   - Version
   - Provider/organization name *
   - Intended purpose
4. **Step 3:** Select which documents to generate (required docs are pre-selected)
5. Click "Generate Documents"
6. Download the ZIP package containing Word documents
7. Open each document and complete `[EXPERT INPUT REQUIRED]` sections (8-10 hours estimated)

### Document Templates

Templates are located at `/templates/` and include:
- `risk_classification_template.docx`
- `annex_iv_template.docx`
- `audit_trail_template.docx`
- `monitoring_framework_template.docx`
- `conformity_checklist_template.docx`

### Technical Details

- **Frontend:** React component at `/dashboard/app/generate/page.tsx`
- **API:** `/api/generate-documents`
- **Backend:** Python script using `python-docx` at `/scripts/populate_templates.py`

---

## Feature 3: Compliance Audit System

**URL:** `/audit`

### Description

Automated compliance audit for EU AI Act Article 15 (Accuracy, Robustness, and Cybersecurity). Evaluates system accuracy from production traces using semantic or exact-match evaluation.

### Features

- **Two evaluator types:**
  - **Semantic:** Uses embeddings to evaluate meaning similarity (recommended)
  - **Exact Match:** Requires exact string matches (for financial/legal domains)

- **Configurable threshold** (0-100%)
- **Detailed results** with failed trace analysis
- **Compliance determination** (90% threshold for Article 15)
- **Downloadable JSON report**

### How to Use

1. Navigate to `/audit` in the dashboard
2. **Upload traces file** (JSONL format)
3. **Select evaluator type:**
   - Semantic (default) - Best for most use cases
   - Exact Match - For high-precision domains
4. **Set accuracy threshold** (default 70%)
5. Click "Run Compliance Audit"
6. Review results:
   - Overall pass rate
   - Total/passed/failed traces
   - Compliance status
   - Table of failed traces with reasons
7. Download full JSON report for records

### Compliance Thresholds

- **Article 15 compliance:** Requires ≥90% accuracy
- **Warning zone:** 70-90% accuracy
- **Non-compliant:** <70% accuracy

### Technical Details

- **Frontend:** React component at `/dashboard/app/audit/page.tsx`
- **API:** `/api/run-audit`
- **Backend:** Uses CERT CLI `cert audit` command with evaluation engines

---

## Installation & Setup

### Prerequisites

```bash
# Python dependencies
pip install cert-framework[evaluation]
pip install python-docx
pip install reportlab

# Node.js dependencies (dashboard)
cd dashboard
npm install
```

### Environment Setup

No additional environment variables required. All processing happens locally or in the Next.js API routes.

### Database (Optional)

For storing assessment results and audit history:

```bash
# Set up Supabase (optional)
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_KEY="your-key-here"
```

---

## API Reference

### POST /api/generate-assessment-pdf

Generate PDF report from assessment data.

**Request:**
```json
{
  "assessmentData": {
    "riskLevel": "HIGH_RISK",
    "riskScore": 150,
    "readinessScore": 65.4,
    "requirements": ["req1", "req2"],
    "estimatedCost": "$50,000 - $100,000",
    "estimatedTimeline": "4-6 months",
    "nextSteps": ["step1", "step2"],
    "strengths": ["strength1"],
    "gaps": ["gap1"]
  },
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/api/download/cert-assessment-123/assessment_report.pdf"
}
```

### POST /api/generate-documents

Generate compliance documentation package.

**Request:**
```json
{
  "riskData": {
    "metadata": { "system_name": "...", "system_version": "...", "provider_name": "..." },
    "classification": { "risk_level": "high", "title": "...", "description": "..." }
  },
  "complianceData": {
    "metadata": { ... },
    "article_15_compliance": { "metrics": { ... } },
    "annex_iv_documentation": { "sections": { ... } }
  }
}
```

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/api/download/cert-123/compliance_package.zip"
}
```

### POST /api/run-audit

Run compliance audit on traces.

**Request:**
```json
{
  "traces": "... JSONL content ...",
  "threshold": 0.7,
  "evaluator": "semantic"
}
```

**Response:**
```json
{
  "total_traces": 1000,
  "passed_traces": 920,
  "failed_traces": 80,
  "pass_rate": 0.92,
  "threshold": 0.7,
  "evaluator_type": "Semantic Evaluator",
  "compliant": true,
  "results": [...]
}
```

---

## Technology Stack

### Open Source Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 16 + React 19 | Dashboard UI |
| Styling | Tailwind CSS 4 | Responsive design |
| PDF Generation | reportlab (Python) | Assessment reports |
| Word Generation | python-docx | Compliance documents |
| Evaluation | sentence-transformers | Semantic similarity |
| Database | PostgreSQL (Supabase) | Optional data storage |

### No Proprietary Dependencies

All components use open-source tools:
- ✅ PostgreSQL (not required)
- ✅ Python standard library
- ✅ Open-source ML models (sentence-transformers)
- ✅ Next.js (MIT license)

---

## Deployment

### Option 1: Vercel (Recommended for Dashboard)

```bash
cd dashboard
vercel
```

### Option 2: Docker

```bash
# Dashboard
cd dashboard
docker build -t cert-dashboard .
docker run -p 3000:3000 cert-dashboard

# Backend (if separate)
docker build -t cert-backend -f Dockerfile.backend .
docker run -p 8000:8000 cert-backend
```

### Option 3: Traditional Server

```bash
# Dashboard
cd dashboard
npm run build
npm run start

# Ensure Python is available for API routes
python3 --version
```

---

## Troubleshooting

### PDF Generation Fails

**Symptom:** "PDF generation failed" error

**Solutions:**
1. Check Python installation: `python3 --version`
2. Install reportlab: `pip install reportlab`
3. Check script permissions: `chmod +x scripts/generate_assessment_pdf.py`
4. Check temp directory: `/tmp` must be writable

### Document Generation Fails

**Symptom:** "Document generation failed" error

**Solutions:**
1. Check python-docx: `pip install python-docx`
2. Verify templates exist in `/templates/` directory
3. Check script: `python3 scripts/populate_templates.py --help`

### Audit Fails

**Symptom:** "Audit execution failed" error

**Solutions:**
1. Install evaluation dependencies: `pip install cert-framework[evaluation]`
2. Check traces format: Must be valid JSONL
3. Verify cert CLI: `cert --version`

---

## Performance Notes

### Expected Processing Times

| Operation | Time | Notes |
|-----------|------|-------|
| Assessment (10 questions) | <1s | Client-side |
| PDF generation | 2-5s | Server-side Python |
| Document generation (5 docs) | 10-30s | Depends on trace count |
| Audit (1000 traces) | 30-120s | Depends on evaluator |

### Optimization Tips

1. **Use semantic evaluator** for most audits (faster than exact match)
2. **Batch document generation** instead of multiple small runs
3. **Cache assessment PDFs** to avoid regeneration
4. **Use pagination** for large audit results (>10,000 traces)

---

## Security Considerations

### Data Privacy

- All processing happens **server-side** or **client-side**
- No data sent to third-party services
- Traces remain on your infrastructure
- Temp files cleaned up after 1 hour

### Access Control

To add authentication:

```typescript
// dashboard/middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/assessment", "/generate", "/audit"]
}
```

---

## Future Enhancements (P2/P3)

### Planned Features

1. **Database integration** for audit history
2. **Email delivery** of assessment reports
3. **Real-time progress** for long-running audits
4. **Batch processing** for multiple systems
5. **Custom templates** upload
6. **Collaborative reviews** for expert input
7. **Version control** for documents
8. **Compliance dashboard** with timeline tracking

---

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review API logs in browser console
3. Check Python script output: `python3 scripts/xxx.py --help`
4. Open issue: https://github.com/Javihaus/cert-framework/issues

---

## License

All automation features are part of the CERT Framework and licensed under Apache 2.0.

Free for commercial use, modification, and distribution.
