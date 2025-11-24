# CERT Dashboard UX Improvement Proposal (P2)

**Problem Statement:**
The dashboard over-emphasizes EU AI Act compliance, making CERT appear as a single-purpose compliance tool rather than a general AI monitoring platform. This confuses users and misrepresents CERT's core value proposition.

**Design Reference:** Stripe.com — Clean, professional, progressive disclosure, clear hierarchy

---

## 1. Core Positioning Issues

### Current Problems

| Page | Current Messaging | Problem | Correct Positioning |
|------|------------------|---------|---------------------|
| **Help** | "helps you comply with EU AI Act requirements" | Makes compliance the primary purpose | Should be: "Monitor and optimize your AI systems" |
| **Audit** | "EU AI Act Compliance Audit" | Too specific, regulatory-focused | Should be: "Accuracy Testing" or "Quality Audit" |
| **Generate** | "Auto-generate EU AI Act compliance documentation" | Makes it sound like the only use case | Should be: "Generate Documentation" with compliance as one template |
| **Navigation** | "Compliance" section prominent | Overemphasizes compliance | Should be: "Governance" or move to sub-menu |

### What CERT Actually Does (from README)

**Primary:** Monitor production LLM systems for:
1. **Cost** — Track spending, optimize models, ROI analysis
2. **Health** — Performance, latency, error rates, SLA compliance
3. **Quality** — Accuracy testing, semantic consistency

**Secondary:** Generate compliance documentation (EU AI Act as one option)

---

## 2. Navigation Structure — P2 Priority

### Current Navigation (Confusing)
```
Overview
Monitoring (Live)

Compliance (Section)
├─ Compliance
├─ Assessment
├─ Audit ❌ (Accuracy testing, not just compliance)
├─ Generate Docs ❌ (Generic docs, not just compliance)
└─ Reports

Analysis
├─ Analytics
├─ Costs
└─ Optimization

Settings
├─ Settings
└─ Help
```

### **PROPOSED P2: Reposition & Rename**

```
Overview
Monitoring (Live)

Quality ✨ (New section name — clearer than "Compliance")
├─ Accuracy Testing (renamed from "Audit")
├─ Documentation (renamed from "Generate Docs")
├─ Reports
└─ Assessment

Analysis
├─ Analytics
├─ Costs
└─ Optimization

Governance (New section — for regulatory/compliance)
├─ Compliance Status
└─ Risk Assessment

Settings
├─ Settings
└─ Help
```

**Rationale:**
- **"Quality"** is more general than "Compliance" — applies to all AI systems
- **"Accuracy Testing"** describes what the feature does (not why)
- **"Documentation"** is generic — compliance is one type
- **"Governance"** section for explicitly regulatory features

---

## 3. Help Page Redesign — P2 Priority

### Current Problems
1. **Opening statement** overemphasizes compliance
2. **Section organization** mixes general features with compliance
3. **Language** too regulatory-heavy
4. **Missing context** about CERT's broader purpose

### Proposed Structure (Inspired by Stripe Docs)

#### **New Opening (Stripe-style clarity)**

```markdown
# CERT Dashboard

Monitor, analyze, and optimize your production AI systems.

## What You Can Do

### Monitor Performance
Track cost, latency, errors, and quality metrics in real-time.

### Optimize Operations
Identify cost-saving opportunities and performance bottlenecks.

### Generate Documentation
Create technical documentation, compliance reports, and audit trails.

---

## Getting Started

New to CERT Dashboard? Start here:

1. **Connect Your Data** → Upload traces or connect to live systems
2. **View Metrics** → See cost, health, and quality at a glance
3. **Run Analysis** → Test accuracy, identify optimizations
```

#### **Reorganized Sections**

**General Features First (80% of users):**
1. Understanding Traces Files
2. Viewing Metrics & Analytics
3. Running Accuracy Tests
4. Generating Documentation (general)
5. Cost Analysis & Optimization

**Specialized Features Second (20% of users):**
6. Compliance Documentation (EU AI Act)
7. Risk Assessment for Regulated Industries
8. Audit Trails

#### **Progressive Disclosure**

**Example: Accuracy Testing Section**

```markdown
## Accuracy Testing

Test your AI system's response quality against expected outputs.

### Use Cases
- Validate responses before production deployment
- Monitor quality degradation over time
- Compare model performance (GPT-4 vs Claude vs local models)
- Meet regulatory accuracy requirements (e.g., EU AI Act Article 15)

### How It Works
1. Upload traces with expected outputs
2. Choose evaluation method (semantic similarity or exact match)
3. Set accuracy threshold (default: 70%, regulatory: 90%)
4. Review results and failed traces

💡 **For EU AI Act Compliance:**
   Use semantic evaluation with 90% threshold to meet Article 15 requirements.
```

**Key Changes:**
- Leads with general use case (quality testing)
- Shows compliance as ONE use case (not the only one)
- Uses progressive disclosure (regulatory details in callout)

---

## 4. Page-Specific Improvements

### A. Audit Page → **"Accuracy Testing"**

#### Current Problems
- Title: "EU AI Act Compliance Audit" ❌
- Subtitle: "Evaluate system accuracy against Article 15 requirements" ❌
- Info card starts with "EU AI Act Article 15 Requirements" ❌

#### Proposed P2 Changes

**New Title & Subtitle:**
```tsx
<h1>Accuracy Testing</h1>
<p>Evaluate AI system response quality against expected outputs</p>
```

**Reorder Content:**
1. **Main card:** Accuracy testing configuration (current)
2. **Info card:** "Why Accuracy Testing Matters" (new, general)
   ```
   Regular accuracy testing helps you:
   • Detect quality degradation before users do
   • Compare model performance (GPT-4 vs alternatives)
   • Validate changes before production
   • Meet regulatory requirements when needed
   ```
3. **Expandable section:** "For Regulated Industries" (move EU AI Act details here)

**Visual Hierarchy:**
```
┌─────────────────────────────────┐
│ Accuracy Testing                │ ← General, clear
│ Test response quality            │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ Upload Traces                    │
│ Select Evaluator                 │
│ Set Threshold (70% default)      │ ← Neutral defaults
│ Run Test                         │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ ℹ️ Why Accuracy Testing Matters │ ← General use cases
│ • Detect quality issues early    │
│ • Compare model performance      │
│ • Meet compliance requirements   │ ← Compliance is ONE use case
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│ 🔽 For Regulated Industries      │ ← Expandable, progressive disclosure
│    EU AI Act Article 15 details  │
│    (collapsed by default)         │
└─────────────────────────────────┘
```

---

### B. Generate Page → **"Documentation Generator"**

#### Current Problems
- Focuses on compliance documents only
- Step titles are generic ("Upload Traces", "System Information")
- No context about other documentation types

#### Proposed P2 Changes

**New Opening:**
```tsx
<h1>Documentation Generator</h1>
<p>Generate technical documentation, reports, and compliance packages from your traces</p>
```

**Document Selection Improvements:**

**Current:**
```
Risk Classification Report (Required)
Annex IV Technical Documentation (Required)
Article 15 Compliance Report
Audit Trail Setup Guide
Monitoring Framework
```

**Proposed (categorized):**
```markdown
### Standard Documentation
☐ System Technical Documentation
   Comprehensive technical specs from production data
   20-25 pages • Auto-populated with metrics

☐ Performance Report
   Cost, latency, error analysis
   5-8 pages • Monthly or custom timeframe

☐ Audit Trail Guide
   Logging and record-keeping procedures
   3-4 pages • Customizable templates

### Compliance Templates
☐ EU AI Act Package
   Risk classification, Annex IV docs, Article 15 report
   30+ pages • Requires expert review

☐ ISO 27001 Documentation
   Information security management
   Coming soon

☐ SOC 2 Compliance
   Security and availability controls
   Coming soon
```

**Key Improvements:**
- General documentation options first
- Compliance as a separate category
- Shows future expansion (not EU-only)
- Clear value proposition for each

---

### C. Help Page Restructuring

#### Proposed New Structure

**Section 1: Core Concepts (Applies to all users)**
- What are traces?
- How to generate traces
- Understanding the dashboard
- Navigating metrics

**Section 2: Core Features**
- Monitoring & Alerts
- Cost Analysis
- Accuracy Testing
- Documentation Generation

**Section 3: Advanced Use Cases**
- Optimization Strategies
- Multi-model Comparison
- Compliance Documentation (EU AI Act)
- Custom Evaluations

**Section 4: Resources**
- Troubleshooting
- Best Practices
- API Reference
- Contact Support

**Progressive Disclosure Example:**

```markdown
## Accuracy Testing

Run quality evaluations on your AI system's responses.

<Accordion title="Basic Setup">
  How to upload traces, select evaluator, interpret results
</Accordion>

<Accordion title="Evaluation Methods">
  Semantic vs Exact Match, when to use each
</Accordion>

<Accordion title="For Regulated Industries">
  EU AI Act Article 15 compliance
  FDA software validation
  Financial services accuracy requirements
</Accordion>
```

---

## 5. Visual Design Improvements (Stripe-inspired)

### Current Issues
- Typography inconsistent (✓ fixed in recent update)
- Information hierarchy unclear
- Too much text visible at once
- No visual separation between general/specialized features

### Proposed P2 Visual Changes

#### A. Card Design System

**General Feature Cards (Default state):**
```
┌─────────────────────────────────┐
│ 📊 Accuracy Testing              │
│                                  │
│ Test response quality            │
│ against expected outputs         │
│                                  │
│ [Run Test →]                    │
└─────────────────────────────────┘
```

**Specialized Feature Cards (Subtle differentiation):**
```
┌─────────────────────────────────┐
│ 🔒 Compliance Documentation      │
│ EU AI Act • ISO • SOC 2          │
│                                  │
│ Generate regulatory packages     │
│ for conformity assessment        │
│                                  │
│ [Generate →]                    │
└─────────────────────────────────┘
```

**Visual Cues:**
- General features: Standard card style
- Specialized features: Subtle badge or icon
- No color differences (avoids hierarchy confusion)

#### B. Progressive Disclosure Pattern

**Collapsed State (Default):**
```
┌─────────────────────────────────┐
│ ℹ️ About Accuracy Testing        │
│                                  │
│ Regular testing helps detect     │
│ quality issues early...          │
│                                  │
│ [Learn more ↓]                  │
└─────────────────────────────────┘
```

**Expanded State (On click):**
```
┌─────────────────────────────────┐
│ ℹ️ About Accuracy Testing [×]    │
│                                  │
│ Common Use Cases:                │
│ • Quality monitoring             │
│ • Model comparison               │
│ • Pre-deployment validation      │
│                                  │
│ For Regulated Industries:        │
│ • EU AI Act Article 15: 90%      │
│ • FDA validation: Custom         │
│                                  │
│ [Run Your First Test →]         │
└─────────────────────────────────┘
```

---

## 6. Language & Tone Guidelines (P2)

### Avoid (Too Regulatory)
❌ "Evaluate system accuracy against Article 15 requirements"
❌ "Generate EU AI Act compliance documentation"
❌ "High-risk AI systems must achieve..."
❌ "Conformity assessment procedures"

### Use Instead (Clear, General)
✅ "Test response quality"
✅ "Generate technical documentation"
✅ "Regulated industries: See compliance options"
✅ "Validate before deployment"

### Pattern: General → Specific

**Good Example:**
```
Test your AI system's accuracy
→ Use semantic evaluation for flexible matching
  → For EU AI Act: Set threshold to 90%
```

**Bad Example:**
```
EU AI Act Article 15 Compliance
→ Evaluate accuracy, robustness, and cybersecurity
  → High-risk systems must achieve appropriate levels...
```

---

## 7. Implementation Priority (P2)

### Phase 1: Quick Wins (1-2 days)
- [ ] Rename "Audit" → "Accuracy Testing" in navigation
- [ ] Update Help page opening paragraph
- [ ] Change Audit page title and subtitle
- [ ] Reorder Help page sections (general first)
- [ ] Add "Why This Matters" general info cards

### Phase 2: Content Restructuring (3-4 days)
- [ ] Reorganize navigation (Quality section)
- [ ] Create progressive disclosure accordions
- [ ] Add document categorization (Standard vs Compliance)
- [ ] Update all page descriptions to be general-first
- [ ] Add "For regulated industries" expandable sections

### Phase 3: Visual Polish (2-3 days)
- [ ] Implement card design system
- [ ] Add badges for specialized features
- [ ] Improve typography hierarchy
- [ ] Add Stripe-style page transitions
- [ ] Implement collapsible sections

---

## 8. Success Metrics

### UX Improvements Measured By:
1. **Clarity Score** — User test: "What does CERT do?" (Target: 90% mention monitoring, not just compliance)
2. **Task Success Rate** — Can users find accuracy testing without thinking "compliance"? (Target: >90%)
3. **Time to First Value** — How long until user understands CERT's purpose? (Target: <30 seconds)
4. **Feature Discovery** — Do users explore Cost/Health/Quality? (Target: 80% engagement)

### Anti-Metrics (Watch for regressions)
- Don't lose compliance users: They should still find features easily
- Don't dilute regulatory value: Compliance features still prominent in "Governance" section

---

## 9. Wireframe Comparisons

### Before (Current — Too Compliance-Focused)
```
┌─────────────────────────────────────────────────┐
│ CERT Dashboard                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  📘 Help & Documentation                        │
│  Learn how to use CERT Dashboard for           │
│  EU AI Act compliance                           │ ← TOO SPECIFIC
│                                                 │
│  Quick Start: Compliance Workflow               │ ← WRONG FOCUS
│   1. Risk Assessment → Compliance Requirements  │
│   2. Document Generation → Compliance Docs      │
│   3. Compliance Audit → Accuracy Status         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### After (Proposed P2 — General-First)
```
┌─────────────────────────────────────────────────┐
│ CERT Dashboard                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Help & Documentation                        │
│  Monitor, analyze, and optimize your            │
│  production AI systems                          │ ← GENERAL VALUE
│                                                 │
│  Quick Start: Essential Workflows               │ ← CLEAR
│   1. View Metrics → Cost, Health, Quality       │
│   2. Run Tests → Accuracy evaluation            │
│   3. Optimize → Cost savings, model comparison  │
│                                                 │
│   🔒 For Regulated Industries: See Governance → │ ← OPTIONAL
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 10. Stripe.com Design Principles Applied

### 1. Clarity Over Cleverness
- ❌ "Compliance Audit" (clever, vague)
- ✅ "Accuracy Testing" (clear, obvious)

### 2. Progressive Disclosure
- Show basics first (monitoring, testing, optimization)
- Reveal complexity on demand (regulatory details)
- Don't hide compliance, just don't lead with it

### 3. Consistent Mental Models
- "Quality" section = features that test/validate
- "Analysis" section = features that visualize/report
- "Governance" section = regulatory/compliance

### 4. Professional Tone
- Avoid jargon ("Annex III", "Article 15")
- Use plain language ("accuracy requirements", "regulatory packages")
- Show expertise without intimidation

### 5. Scannable Hierarchy
```
Large: Page purpose (what you can do)
Medium: Section headers (feature categories)
Small: Feature descriptions (how it helps)
Tiny: Regulatory details (if applicable)
```

---

## 11. FAQ Improvements

### Current FAQ (Too Compliance-Heavy)
```
Q: Is my data sent to external servers?
Q: How long does document generation take?
Q: What's the difference between evaluators?
Q: How many traces do I need?
Q: Can I use this for production compliance submissions? ← ONLY ONE about compliance
```

### Proposed FAQ (Balanced)
```
Q: What does CERT monitor?
A: Cost, performance, and quality of your AI systems in production.

Q: Is my data sent to external servers?
A: No. All processing happens locally. Your data never leaves your infrastructure.

Q: How do I get started?
A: Upload trace files or connect to your live system. The dashboard shows insights immediately.

Q: What's accuracy testing?
A: Validates your AI responses against expected outputs. Helps detect quality issues early.

Q: Can I use this for compliance?
A: Yes. CERT supports EU AI Act, ISO 27001, and SOC 2 documentation templates.

Q: How much does it cost?
A: CERT is open-source and free. No usage limits or hidden fees.
```

**Key Changes:**
- Leads with "What does CERT do?" (most common question)
- Compliance mentioned, but not overemphasized
- Answers are general-first, specific second

---

## 12. Content Audit Summary

| Current Issue | Impact | P2 Fix | Effort |
|--------------|---------|---------|--------|
| Help page leads with compliance | High - Wrong positioning | Rewrite opening, reorder sections | Medium |
| Audit page titled "EU AI Act..." | High - Misleading purpose | Rename to "Accuracy Testing" | Low |
| No general documentation options | Medium - Limits use cases | Categorize docs: Standard vs Compliance | Medium |
| Navigation emphasizes "Compliance" | Medium - Wrong hierarchy | Create "Quality" and "Governance" sections | High |
| No progressive disclosure | Low - Info overload | Add collapsible sections | Medium |
| Missing general use cases | High - Unclear value | Add "Why This Matters" cards | Low |

---

## 13. Implementation Checklist

### Content Changes
- [ ] Rewrite Help page opening (general AI monitoring, not compliance)
- [ ] Rename Audit → Accuracy Testing everywhere
- [ ] Update Generate page to show document categories
- [ ] Add "Why This Matters" sections (general value, then compliance)
- [ ] Reorder all content: general use cases first, compliance second
- [ ] Remove regulatory jargon from titles and subtitles
- [ ] Add FAQ entries about general monitoring use cases

### Navigation Changes
- [ ] Rename "Compliance" section → "Quality"
- [ ] Move "Audit" → "Quality → Accuracy Testing"
- [ ] Move "Generate Docs" → "Quality → Documentation"
- [ ] Create "Governance" section for regulatory features
- [ ] Add icons that suggest general use (not just compliance shields)

### Visual Changes
- [ ] Implement card design system (standard vs specialized)
- [ ] Add progressive disclosure accordions
- [ ] Create collapsible sections for regulatory details
- [ ] Improve typography hierarchy (already done in P1)
- [ ] Add subtle badges for specialized features
- [ ] Implement Stripe-style hover states and transitions

### Testing
- [ ] User test: "What does CERT do?" (without mentioning page)
- [ ] Task test: "Find where to test response quality"
- [ ] Comprehension test: Show Help page, ask about features
- [ ] Navigation test: Can users find compliance features? (should still be easy)

---

## 14. Long-term Vision (Post-P2)

### Future Enhancements
1. **Onboarding Flow** — Interactive tour showing Cost → Health → Quality → Governance progression
2. **Use Case Templates** — Pre-configured workflows for common scenarios (not just compliance)
3. **Integrations Page** — Show how CERT connects to existing tools (Grafana, Datadog, etc.)
4. **Model Comparison Tool** — Side-by-side GPT-4 vs Claude vs Llama (general use case)
5. **Cost Optimization Wizard** — Automated recommendations (more prominent than compliance)

### Expansion Beyond EU AI Act
- ISO 27001 documentation templates
- SOC 2 compliance packages
- FDA software validation (medical AI)
- Financial services accuracy requirements
- Custom compliance frameworks

This positions CERT as a **platform for AI governance**, not just an EU AI Act tool.

---

## Conclusion

CERT is a **general AI monitoring platform** with compliance as ONE feature. The P2 improvements will:

1. ✅ **Clarify purpose** — "Monitor, analyze, optimize" not "Comply with EU AI Act"
2. ✅ **Improve discoverability** — General features first, compliance second
3. ✅ **Reduce confusion** — Clear naming (Accuracy Testing vs Compliance Audit)
4. ✅ **Maintain compliance value** — Regulatory features still prominent in "Governance"
5. ✅ **Enable expansion** — Architecture supports future compliance frameworks

**Design Reference:** Stripe.com — Clarity, progressive disclosure, professional tone

**Success Metric:** 90% of new users understand CERT monitors AI systems (not just compliance)
