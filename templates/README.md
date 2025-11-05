# EU AI Act Compliance Document Templates

This directory contains Word document templates for generating EU AI Act compliance documentation.

## Overview

The templates use a placeholder system where `{{PLACEHOLDERS}}` are automatically replaced with data from cert-framework analysis, while `[EXPERT INPUT REQUIRED]` sections need manual completion by compliance experts.

## Required Templates

### 1. risk_classification_template.docx (2 pages)

**Purpose:** Risk classification report per Annex III

**Key Placeholders:**
- `{{SYSTEM_NAME}}` - Name of the AI system
- `{{SYSTEM_VERSION}}` - Version number
- `{{PROVIDER_NAME}}` - Organization name
- `{{GENERATION_DATE}}` - Date report was generated
- `{{RISK_LEVEL}}` - HIGH / LIMITED / MINIMAL
- `{{RISK_INDICATORS}}` - Number of matched high-risk categories
- `{{RISK_TITLE}}` - Classification title
- `{{RISK_DESCRIPTION}}` - Description of risk level
- `{{MATCHED_CATEGORIES}}` - List of matched Annex III categories
- `{{REQUIREMENTS_LIST}}` - Compliance requirements

**Expert Sections:**
- Risk assessment justification
- Operational context
- Mitigation measures
- Compliance officer sign-off

**How to Create:**
1. Open Microsoft Word or LibreOffice Writer
2. Use professional document formatting:
   - Title: "EU AI ACT RISK CLASSIFICATION REPORT"
   - Sections clearly separated with horizontal lines (═══ or ───)
   - Use monospace font for sections
3. Add all placeholders exactly as shown (with {{ }} braces)
4. Add [EXPERT INPUT REQUIRED] markers with guidance text
5. Save as: `risk_classification_template.docx`

### 2. annex_iv_template.docx (20-25 pages)

**Purpose:** Complete Annex IV technical documentation

**Key Placeholders:**
- All system metadata (`{{SYSTEM_NAME}}`, etc.)
- `{{MODEL_TYPE}}` - Type of AI model
- `{{MODEL_VERSION}}` - Model version
- `{{INFRASTRUCTURE_DESCRIPTION}}` - Infrastructure details
- `{{TRAINING_DATA_DESCRIPTION}}` - Training data information
- `{{TOTAL_TRACES}}` - Number of traces analyzed
- `{{TOTAL_REQUESTS}}` - Total API requests
- `{{SUCCESSFUL_REQUESTS}}` - Successful requests
- `{{FAILED_REQUESTS}}` - Failed requests
- `{{ERROR_RATE}}` - Error rate percentage
- `{{AVG_RESPONSE_TIME}}` - Average response time
- `{{TRACE_START_DATE}}` - Analysis period start
- `{{TRACE_END_DATE}}` - Analysis period end

**Sections:**
1. **General Information** - System identity, regulatory classification, scope
2. **AI System Architecture** - Model info, infrastructure, integration points
3. **Data and Data Governance** - Training data, quality measures, bias mitigation
4. **Performance Metrics** - Article 15 compliance metrics
5. **Risk Management System** - Risk identification, assessment, mitigation
6. **Human Oversight Mechanisms** - Article 14 compliance
7. **Accuracy, Robustness and Cybersecurity** - Article 15 detailed analysis
8. **Changes and Version Control** - Version history, change management
9. **Conformity Assessment Preparation** - Declaration, gaps, action items

**Critical:** Each section needs extensive [EXPERT INPUT REQUIRED] guidance explaining what to write.

### 3. audit_trail_template.docx (3 pages)

**Purpose:** Guide for setting up Article 19 logging

**Content:**
- What events must be logged
- Log format and structure
- Storage location and retention period
- Access controls
- How to generate audit reports

**No Automated Placeholders:** This template is copied as-is and requires full manual completion.

### 4. monitoring_framework_template.docx (5 pages)

**Purpose:** Continuous monitoring procedures

**Content:**
- Metrics monitored continuously
- Monitoring tools and dashboards
- Alert thresholds
- Escalation procedures
- Review cadence and responsibilities

**No Automated Placeholders:** Copied as-is, requires manual completion.

### 5. conformity_checklist_template.docx (2 pages)

**Purpose:** Checklist for conformity assessment

**Content:**
- Checklist of all required documents
- Instructions for conformity assessment
- Timeline for next reviews
- Contact information

**No Automated Placeholders:** Copied as-is, requires manual completion.

## Template Creation Guidelines

### Formatting Standards

1. **Document Structure:**
   - Use clear section headers with visual separators
   - Number sections consistently (1, 1.1, 1.2, etc.)
   - Add table of contents for documents > 5 pages

2. **Placeholder Format:**
   - Always use: `{{PLACEHOLDER_NAME}}`
   - Use UPPERCASE with underscores
   - Never use spaces: `{{SYSTEM NAME}}` ❌ `{{SYSTEM_NAME}}` ✓

3. **Expert Input Markers:**
   - Format: `[EXPERT INPUT REQUIRED]`
   - Always provide guidance on what to write
   - Include example text or structure
   - Specify 2-3 paragraphs or specific bullet points

4. **Visual Elements:**
   - Use horizontal lines for section separation: `════════════════════`
   - Use monospace font (Courier New or Consolas)
   - Keep line length ~70 characters
   - Use bullet points (•) for lists

### Example Section Structure

```
════════════════════════════════════════════════════════════════════
SECTION 2: AI SYSTEM ARCHITECTURE
════════════════════════════════════════════════════════════════════

2.1 Model Information
────────────────────────────────────────────────────────────────────

Model Type:     {{MODEL_TYPE}}
Model Version:  {{MODEL_VERSION}}
Provider:       OpenAI / Anthropic / Other [specify]

2.2 Infrastructure
────────────────────────────────────────────────────────────────────

{{INFRASTRUCTURE_DESCRIPTION}}

[EXPERT INPUT REQUIRED - If not provided in metadata, add manually:]

Describe the technical infrastructure:
- Cloud provider (AWS / GCP / Azure / On-premise)
- Compute resources (GPU type, memory, scaling configuration)
- Network architecture (API calls, internal services, load balancing)
- Geographic location of processing

[Example:]
"The system runs on AWS infrastructure in the EU-West-1 region.
We use EC2 t3.large instances (8GB RAM, 2 vCPUs) with auto-scaling
from 2 to 10 instances based on load. API calls are routed through
AWS API Gateway with rate limiting (100 requests/minute per user)."
```

## Testing Your Templates

After creating templates, test them:

```bash
# 1. Generate test data
cert classify-system --output test/risk.json --non-interactive
cert generate-docs test_traces.jsonl \
  --system-name "Test System" \
  --provider-name "Test Corp" \
  --output test/compliance.json

# 2. Run population script
python scripts/populate_templates.py \
  test/risk.json \
  test/compliance.json \
  --output test_output/

# 3. Open generated documents
open test_output/*.docx  # macOS
# or
libreoffice test_output/*.docx  # Linux

# 4. Verify
# - All {{PLACEHOLDERS}} should be replaced with real values
# - [EXPERT INPUT REQUIRED] sections should still say that
# - Formatting should be preserved
# - No broken tables or weird spacing
```

## Common Issues

### Placeholders Not Replaced

**Cause:** JSON data structure doesn't match expected format

**Fix:** Add debug printing to populate_templates.py:
```python
print("Risk data keys:", risk_data.keys())
print("Classification:", risk_data.get('classification'))
```

### Formatting Breaks

**Cause:** Placeholders span multiple "runs" in Word

**Solution:**
1. In Word, type placeholder as single continuous text
2. Don't format part of the placeholder differently
3. Test with simple "Find & Replace" in Word first

### Template Not Found

**Cause:** Template file missing or wrong filename

**Fix:**
- Check exact filename matches script expectations
- File extension must be `.docx` not `.doc`
- Check file permissions

## Integration with Dashboard

The dashboard integration (Week 1):
1. User clicks "Generate Documents" in dashboard
2. Dashboard uploads JSON data to backend API
3. Backend runs: `python scripts/populate_templates.py risk.json compliance.json --output docs/`
4. Backend creates ZIP of generated documents
5. User downloads ZIP file

See `dashboard/app/documents/page.tsx` for implementation.

## Next Steps

1. Create all 5 templates using Microsoft Word or LibreOffice
2. Test with populate_templates.py script
3. Refine [EXPERT INPUT REQUIRED] guidance based on actual usage
4. After Client 1, review which sections need better automation
5. After Client 3, consider adding more templates (e.g., training documentation)

## Reference Documents

- EU AI Act: https://artificialintelligenceact.eu/
- Annex III (High-Risk Categories): Article 6 and Annex III
- Annex IV (Technical Documentation): Article 11 and Annex IV
- Article 15 (Accuracy, robustness, cybersecurity)
- Article 19 (Logging and record-keeping)

## Questions?

For questions about template structure or content, see:
- EU AI Act official text: https://artificialintelligenceact.eu/the-act/
- CERT Framework documentation: ../README.md
- Dashboard documentation: ../dashboard/README.md
