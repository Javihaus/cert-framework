<div align="center">
<img src="docs/CERT_LOGO_NEW_1.png" alt="CERT" width="20%" />

# CERT Framework

**AI Implementation Pipeline — From Readiness to Production to Compliance**

Deploy AI systems that work, prove they create value, and generate regulatory documentation automatically.

<img src="docs/dashboard-hero.png" alt="CERT Dashboard" width="100%" />

---

[![Python](https://img.shields.io/badge/python-3.8%2B-blue?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![PyPI](https://img.shields.io/pypi/v/cert-framework?style=for-the-badge&logo=pypi&logoColor=white)](https://pypi.org/project/cert-framework/)
[![Tests](https://img.shields.io/github/actions/workflow/status/javihaus/cert-framework/cert.yml?style=for-the-badge&logo=github&label=tests)](https://github.com/Javihaus/cert-framework/actions)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=for-the-badge&logo=apache&logoColor=white)](LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-ruff-000000.svg?style=for-the-badge)](https://github.com/astral-sh/ruff)

**[Pipeline](#the-pipeline)** • **[Installation](#installation)** • **[Quick Start](#quick-start)** • **[Dashboard](#dashboard)** • **[API Reference](#api-reference)** • **[Contributing](#contributing)**

</div>

---

## The Problem

Companies don't fail at AI because of technology. They fail because they skip steps:

- **Build without assessing risk** → Surprise: your chatbot is a high-risk system under EU AI Act
- **Deploy without monitoring** → No idea if the AI actually works in production
- **No ROI tracking** → Can't justify continued investment, project gets killed
- **Compliance as afterthought** → €15M+ in fines, or $100K+ in consulting fees

The usual approach: hire consultants for each phase, use 5 different tools, hope they integrate.

**CERT's approach:** One pipeline. Five stages. Same data flows through all of them.

---

## The Pipeline

<div align="center">

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CERT AI IMPLEMENTATION PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   STAGE 1    │    │   STAGE 2    │    │   STAGE 3    │    │   STAGE 4    │   │
│  │  READINESS   │───▶│  DEPLOYMENT  │───▶│    VALUE     │───▶│ OPTIMIZATION │   │
│  │  ASSESSMENT  │    │  MONITORING  │    │  VALIDATION  │    │              │   │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                   │                   │           │
│         ▼                   ▼                   ▼                   ▼           │
│  Risk classification   Trace logs         ROI metrics        Recommendations   │
│  Readiness scorecard   Cost data          Business value     Cost reduction    │
│  Gap analysis          Performance        Accuracy rates     Model downgrades  │
│                                                                                 │
│                              │                                                  │
│                              ▼                                                  │
│                     ┌──────────────┐                                            │
│                     │   STAGE 5    │                                            │
│                     │  COMPLIANCE  │                                            │
│                     │     DOCS     │                                            │
│                     └──────────────┘                                            │
│                              │                                                  │
│                              ▼                                                  │
│                     EU AI Act Article 15                                        │
│                     Technical Documentation                                     │
│                     Conformity Assessment                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

</div>

### Stage 1: Readiness Assessment

**Before writing code, understand your regulatory risk.**

```bash
$ cert assess --interactive

EU AI Act Risk Assessment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Does the AI system make hiring decisions?
→ Yes

Will it process >10,000 applications per year?
→ Yes

[... guided questionnaire ...]

═══════════════════════════════════════════════════════════════
RESULT: HIGH-RISK SYSTEM (EU AI Act Annex III, Category 4)
═══════════════════════════════════════════════════════════════

Required obligations:
  • Conformity assessment before deployment
  • Technical documentation (Article 11)
  • Quality management system (Article 17)
  • Human oversight measures (Article 14)
  • Continuous accuracy monitoring (Article 15)

Estimated compliance timeline: 8-12 months
Estimated compliance cost: €75K-€300K (or use CERT: €0)

Readiness Score: 34/100
  ├─ Data quality: 45/100
  ├─ Infrastructure: 28/100
  ├─ Team skills: 52/100
  ├─ Security: 31/100
  └─ Documentation: 15/100

Next steps saved to: assessment_report.pdf
```

**What you get:** Risk classification citing specific EU AI Act articles, readiness scorecard across 5 dimensions, gap analysis, compliance roadmap.

### Stage 2: Deployment Monitoring

**Trace every inference in production. Zero code changes.**

```python
# Option 1: Auto-instrumentation (works with existing code)
from cert.integrations.auto import *

# Your existing code stays exactly the same
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[{"role": "user", "content": "Analyze this contract..."}]
)
# CERT automatically logged: request, response, tokens, cost, latency
```

```python
# Option 2: Explicit tracing (more control)
from cert import trace

@trace(cost_tracking=True, metadata={"service": "contract-analysis"})
def analyze_contract(document: str) -> dict:
    context = vector_db.search(document)
    analysis = llm.generate(context, document)
    return {"analysis": analysis, "confidence": 0.87}
```

**Supported platforms:** OpenAI, Anthropic, AWS Bedrock, Azure OpenAI, LangChain, LlamaIndex

**What you get:** JSONL logs with every inference—full request/response, token counts, calculated cost, latency, timestamps. Foundation for everything else.

### Stage 3: Business Value Validation

**Prove ROI with real numbers. Not estimates—production data.**

```bash
$ cert roi --value-per-task 2.50

Business Value Analysis (30 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total AI spend:           €1,247.32
Successful tasks:         18,234 (accuracy ≥70%)
Failed tasks:             1,766 (accuracy <70%)
Success rate:             91.2%

Value generated:          €45,585.00
Net value:                €44,337.68
ROI:                      3,554%
Cost per successful task: €0.068

Monthly projection at current rate:
  └─ Net value: €44,337/month | €532K/year
```

```python
from cert.value.roi_calculator import ROICalculator

calculator = ROICalculator(
    traces_path="production.jsonl",
    business_value_per_task=2.50  # Your metric: revenue saved, time saved, etc.
)

roi = calculator.calculate_roi(period_days=30)
print(f"ROI: {roi['roi_percentage']}%")
print(f"Net value: €{roi['net_value']:,.2f}")
```

**What you get:** Cost per task, value generated, ROI percentage, success rates, monthly/yearly projections. Board-ready numbers.

### Stage 4: Optimization

**Automated recommendations. Typical savings: 30-50%.**

```bash
$ cert optimize

Optimization Opportunities
━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 3 opportunities totaling €667/month (53% reduction)

1. MODEL DOWNGRADE — simple_qa tasks
   Current model: gpt-4-turbo
   Average confidence: 0.91 (overkill for this task)
   Recommended: gpt-3.5-turbo
   ├─ Monthly savings: €417
   └─ Risk: LOW (confidence stays above 0.85)

2. PROMPT CACHING — 47 repeated prompts
   Most repeated: "You are a helpful assistant..." (1,203× this month)
   ├─ Monthly savings: €156
   └─ Implementation: Enable response caching

3. PROMPT SHORTENING — 12 prompts over 2000 tokens
   Longest: Customer support context includes full chat history
   ├─ Monthly savings: €94
   └─ Implementation: Truncate to last 5 messages

Total annual savings: €8,004
Payback period: Immediate
```

**What you get:** Ranked recommendations with savings estimates, risk assessment, implementation guidance.

### Stage 5: Compliance Documentation

**Generate EU AI Act Article 15 documentation automatically from production traces.**

```bash
$ cert compliance --system-name "ContractAnalyzer" --output article15_report.pdf

Generating EU AI Act Technical Documentation...

✓ System overview (Article 11.1.a)
✓ Risk management measures (Article 9)
✓ Data governance documentation (Article 10)
✓ Accuracy metrics from production (Article 15)
✓ Human oversight procedures (Article 14)
✓ Cybersecurity measures (Article 15.4)

Report generated: article15_report.pdf (47 pages)
```

**The insight:** Compliance documentation and cost optimization use the same underlying data. If you're logging every inference anyway (Stage 2), generating Article 15 documentation is just reformatting those logs.

Manual documentation costs: €100K-€500K in consulting fees
CERT documentation cost: €0 (you already have the data)

---

## Installation

```bash
# Core (tracing only, zero dependencies)
pip install cert-framework

# With platform connectors
pip install cert-framework[integrations]

# Everything (connectors + evaluation + CLI)
pip install cert-framework[all]
```

| Tier | Size | What you get |
|------|------|--------------|
| Core | <100KB | `@trace()` decorator, JSONL logging |
| Integrations | ~5MB | Auto-connectors for OpenAI, Anthropic, LangChain, Bedrock, Azure |
| Evaluation | ~500MB | Accuracy measurement (semantic similarity + NLI models) |
| CLI | <1MB | `cert assess`, `cert roi`, `cert optimize`, `cert compliance` |

---

## Quick Start

### 5 minutes: See what CERT does

```python
from cert.integrations.auto import *
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "What is 2+2?"}]
)
# Check production.jsonl — CERT logged everything
```

```bash
# Analyze your costs
cert costs --period 7d

# Get optimization recommendations
cert optimize

# Run risk assessment
cert assess --interactive
```

### 30 minutes: Full pipeline demo

```bash
# 1. Clone and install
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework
pip install -e ".[all]"

# 2. Run the demo
python examples/03_compliance_workflow.py

# 3. Launch dashboard
cd dashboard && npm install && npm run dev
# Open http://localhost:3000
```

---

## Dashboard

Web interface for the complete pipeline. Upload traces, run assessments, generate reports.

<img src="docs/dashboard-metrics.png" alt="CERT Metrics" width="100%" />

**Features:**
- **Assessment Wizard:** Guided EU AI Act risk classification
- **Cost Analytics:** Real-time spend tracking with drill-down
- **ROI Calculator:** Business value metrics from production data
- **Optimization Engine:** Automated savings recommendations
- **Compliance Center:** One-click Article 15 report generation

```bash
cd dashboard
npm install
npm run dev
# Dashboard at http://localhost:3000
```

---

## Connectors

CERT auto-instruments these platforms:

| Platform | Tracing | Cost Tracking | Status |
|----------|---------|---------------|--------|
| **OpenAI** | Full (chat, completions, embeddings, streaming) | Automatic | Production |
| **Anthropic** | Full (including tool use, prompt caching) | Automatic (with cache hits) | Production |
| **AWS Bedrock** | Claude, Llama, Titan | Manual pricing | Production |
| **Azure OpenAI** | OpenAI-compatible | Automatic | Production |
| **LangChain** | Chains, agents, tools | Aggregated | Production |
| **LlamaIndex** | Query engines, chat engines | Aggregated | Beta |

```python
# Auto-detect installed platforms
from cert.integrations.auto import *

# Or explicit activation
from cert.integrations.openai import OpenAIConnector
from cert.core.tracer import CertTracer

tracer = CertTracer()
OpenAIConnector(tracer).activate()
```

---

## API Reference

### Assessment

```python
from cert.assessment import RiskClassifier, ReadinessAssessor

# Risk classification
classifier = RiskClassifier()
result = classifier.classify(questionnaire_answers)
# Returns: {"risk_level": "high", "category": "Annex III, Cat 4", "obligations": [...]}

# Readiness scoring
assessor = ReadinessAssessor()
score = assessor.assess(company_profile)
# Returns: {"total": 34, "data_quality": 45, "infrastructure": 28, ...}
```

### Tracing

```python
from cert import trace
from cert.core.tracer import CertTracer

# Decorator
@trace(log_path="traces.jsonl", cost_tracking=True)
def my_function(query):
    return llm.generate(query)

# Manual
tracer = CertTracer(log_path="traces.jsonl")
tracer.log_trace({
    "timestamp": "2025-01-15T10:30:00Z",
    "platform": "openai",
    "model": "gpt-4",
    "input_data": "What is 2+2?",
    "output_data": "4",
    "cost": 0.002,
    "metadata": {"tokens": {"prompt": 12, "completion": 5}}
})
```

### Value Analysis

```python
from cert.value.analyzer import CostAnalyzer
from cert.value.optimizer import Optimizer
from cert.value.roi_calculator import ROICalculator

# Costs
analyzer = CostAnalyzer("production.jsonl")
total = analyzer.total_cost(start_date="2025-01-01", end_date="2025-01-31")
by_model = analyzer.cost_by_model()

# ROI
calculator = ROICalculator(traces_path="production.jsonl", business_value_per_task=2.50)
roi = calculator.calculate_roi(period_days=30)

# Optimization
optimizer = Optimizer("production.jsonl")
recommendations = optimizer.recommend_model_changes()
```

### Compliance

```python
from cert.compliance import ComplianceReportGenerator

generator = ComplianceReportGenerator(
    traces_path="production.jsonl",
    system_name="ContractAnalyzer",
    provider="Acme Corp"
)
generator.generate_article15_report(output_path="article15_report.pdf")
```

Full API documentation: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## Why CERT Works

### Single Source of Truth

Other tools: Langfuse for monitoring, spreadsheets for ROI, Vanta for compliance, custom scripts for optimization. Five data sources that don't talk to each other.

CERT: One trace log → feeds into cost analysis → feeds into ROI calculation → feeds into optimization → feeds into compliance docs. Same data, different views.

### Compliance as Output, Not Input

Traditional approach: Hire €100K+ consultants to manually document your AI system for regulators.

CERT approach: You're already logging traces for debugging. Those traces contain exactly what Article 15 requires: accuracy metrics, performance monitoring, system behavior documentation. CERT just reformats it.

### Built for Consulting Delivery

CERT is designed for the 80/20 rule: 80% automated analysis, 20% expert interpretation. The dashboard generates the reports; you add the strategic recommendations.

---

## Architecture

```
cert/
├── assessment/        # Stage 1: Risk classification, readiness scoring
├── integrations/      # Stage 2: Platform connectors (OpenAI, Anthropic, etc.)
├── value/             # Stage 3-4: ROI calculation, cost analysis, optimization
├── compliance/        # Stage 5: EU AI Act documentation generation
├── core/              # Shared: Tracing, evaluation engine
├── cli/               # Command-line interface
└── monitoring/        # Real-time observability

dashboard/             # Next.js web interface
├── app/               # Pages: assessment, costs, optimization, compliance
├── components/        # Reusable UI components
└── lib/               # Business logic (mirrors Python modules)
```

---

## Roadmap

| Quarter | Focus |
|---------|-------|
| **Q1 2026** | Hosted evaluation API, Prometheus exporters, Slack alerts |
| **Q2 2026** | Multi-modal support (vision), custom evaluation presets |
| **Q3 2026** | Drift detection, A/B testing framework, circuit breakers |
| **Q4 2026** | SaaS offering, team collaboration, enterprise SSO |

---

## Contributing

```bash
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework
pip install -e ".[dev]"
pytest
ruff check .
```

Priority areas:
- Platform connectors ([docs/CONNECTOR_DEVELOPMENT_GUIDE.md](docs/CONNECTOR_DEVELOPMENT_GUIDE.md))
- Industry-specific evaluation presets (healthcare, finance, legal)
- Dashboard components

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 — [LICENSE](LICENSE)

Commercial use, modification, distribution permitted with attribution.

---

## Contact

**Javier Marin**  
AI Implementation Consultant

Email: javier@jmarin.info  
LinkedIn: [linkedin.com/in/javiermarinvalenzuela](https://linkedin.com/in/javiermarinvalenzuela)

**Services:** EU AI Act implementation, AI deployment strategy, production LLM optimization.

---

<div align="center">

### Deploy AI systems that work. Prove they create value. Stay compliant.

[![Install](https://img.shields.io/badge/pip_install-cert--framework-4B8BBE?style=for-the-badge&logo=python&logoColor=white)](https://pypi.org/project/cert-framework/)
[![GitHub](https://img.shields.io/github/stars/Javihaus/cert-framework?style=for-the-badge&logo=github)](https://github.com/Javihaus/cert-framework)

</div>
