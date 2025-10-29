# CERT Framework

**The only open-source LLM monitoring platform with built-in EU AI Act compliance**

> Langfuse for EU AI Act Compliance: Developer-friendly LLM observability with automated Article 15 documentation.

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## Why CERT?

The EU AI Act requires high-risk AI systems to demonstrate **"appropriate levels of accuracy"** with documented evidence for auditors. Enforcement begins August 2, 2027.

CERT combines **production monitoring** (trace logs, performance metrics, accuracy tracking) with **compliance automation** (Article 15 reports, audit trails, transparency documentation) in one open-source platform.

### Key Features

✅ **Lightweight Core**: 5MB installation, zero ML dependencies for basic monitoring
✅ **Developer-First**: Single `@trace` decorator, works with any LLM provider
✅ **Offline Evaluation**: Run accuracy checks on your schedule, not per-request
✅ **Compliance Automation**: CLI tools generate Article 15 reports from trace logs
✅ **Open Source**: Apache 2.0 license, self-host unlimited usage

---

## Quick Start

### Installation

```bash
# Core monitoring (5MB, zero dependencies)
pip install cert-framework

# With evaluation features (150MB)
pip install cert-framework[evaluation]

# With CLI tools
pip install cert-framework[cli]

# Everything
pip install cert-framework[all]
```

### Three Lines of Code

```python
from cert import trace

@trace()  # That's it - logs inputs/outputs/timing
def your_rag_pipeline(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}
```

This creates structured JSONL logs with zero external dependencies.

### Evaluate Traces (Offline)

```bash
# Evaluate accuracy offline
cert evaluate traces.jsonl --preset healthcare --output eval.json

# Generate Article 15 compliance report
cert report traces.jsonl \
  --output article15_report.pdf \
  --format pdf \
  --system-name "Clinical Decision Support" \
  --risk-level high
```

---

## Architecture

CERT separates concerns for maximum flexibility:

### 1. Runtime Monitoring
Lightweight `@trace` decorator logs inputs/outputs (**<1ms overhead**)

### 2. Offline Evaluation
Batch process traces with semantic similarity, NLI, grounding analysis

### 3. Compliance Reporting
CLI tools generate Article 15 documentation from trace logs

**This architecture means:**
- ✓ Monitoring works without ML dependencies
- ✓ Evaluation runs on your schedule (hourly, daily, on-demand)
- ✓ Compliance reports generated independently of runtime

---

## Comparison: CERT vs Alternatives

| Feature | CERT | Langfuse | LangSmith | Helicone |
|---------|------|----------|-----------|----------|
| **Open Source** | ✅ Apache 2.0 | ❌ Proprietary | ❌ Proprietary | ✅ MIT |
| **Self-Hosted** | ✅ Unlimited | ⚠️  Limited | ❌ Cloud only | ⚠️  Limited |
| **EU AI Act Compliance** | ✅ Native | ❌ | ❌ | ❌ |
| **Lightweight Core** | ✅ 5MB | ❌ ~50MB | N/A | ❌ ~20MB |
| **Offline Evaluation** | ✅ | ❌ | ❌ | ❌ |
| **Multi-Framework** | ✅ | ✅ | ⚠️  LangChain only | ✅ |

---

## Compliance Features

### Article 15.1: Accuracy Levels

- **Semantic similarity** scoring (embedding-based)
- **NLI contradiction** detection
- **Term grounding** analysis
- **Configurable thresholds** per risk level

### Article 19: Record Keeping

- Structured JSONL trace logs
- Timestamps, inputs, outputs, metadata
- Retention policies configurable
- Audit trail immutability

### Article 15.4: Resilience to Errors

- Error logging and categorization
- Performance degradation tracking
- Alerting on accuracy drops

---

## How It Works

### Step 1: Trace at Runtime

```python
from cert import trace

@trace(log_path="production_traces.jsonl")
def my_rag_pipeline(query):
    context = retrieve_documents(query)
    answer = generate_answer(context, query)
    return {"context": context, "answer": answer}
```

**Output:** `production_traces.jsonl`
```json
{"timestamp": "2025-10-29T14:30:00Z", "function": "my_rag_pipeline", "duration_ms": 245.3, "status": "success", "context": "...", "answer": "..."}
```

### Step 2: Evaluate Offline

```bash
cert evaluate production_traces.jsonl --preset financial --threshold 0.9
```

**Output:**
```
📊 Evaluation Results:
  Total traces: 1,250
  Passed: 1,187 (94.96%)
  Failed: 63 (5.04%)
  Pass rate: 95.0%
```

### Step 3: Generate Compliance Report

```bash
cert report production_traces.jsonl \
  -o monthly_report.pdf \
  -f pdf \
  --system-name "Trading RAG System" \
  --risk-level high
```

**Output:** PDF report documenting:
- Article 15.1 accuracy metrics
- Article 15.4 error resilience
- Article 19 record keeping
- Compliance status (✅ COMPLIANT / ⚠️ NON-COMPLIANT)

---

## API Reference

### Core API

#### `@trace` Decorator

```python
from cert import trace

@trace(
    log_path="traces.jsonl",  # Path to log file
    metadata={"service": "rag", "version": "1.0"}  # Optional metadata
)
def my_function(query):
    return {"context": "...", "answer": "..."}
```

**Features:**
- Zero external dependencies
- <1ms overhead
- Automatic error logging
- Thread-safe

### Evaluation API

#### `Evaluator` Class

```python
from cert.evaluation import Evaluator

evaluator = Evaluator(
    preset="financial",  # or "healthcare", "legal", "general"
    threshold=0.9        # Confidence threshold
)

# Evaluate log file
results = evaluator.evaluate_log_file("traces.jsonl")

print(f"Pass rate: {results['pass_rate']:.1%}")
print(f"Passed: {results['passed']}/{results['total_traces']}")
```

**Presets:**
- `general`: threshold=0.7, balanced accuracy
- `financial`: threshold=0.9, high accuracy for numbers
- `healthcare`: threshold=0.95, highest accuracy for medical
- `legal`: threshold=0.85, high accuracy for contracts

### CLI Tools

#### `cert evaluate`
Evaluate traces offline with accuracy measurements.

```bash
cert evaluate traces.jsonl \
  --preset financial \
  --threshold 0.9 \
  --output results.json
```

#### `cert report`
Generate EU AI Act compliance reports.

```bash
cert report traces.jsonl \
  -o report.pdf \
  -f pdf \
  --system-name "My RAG System" \
  --risk-level high
```

**Supported formats:** `markdown`, `html`, `pdf`, `txt`

#### `cert logs`
View recent traces.

```bash
cert logs traces.jsonl --tail 20
cert logs traces.jsonl --filter-status error
cert logs traces.jsonl --json-output
```

#### `cert stats`
Show aggregate statistics.

```bash
cert stats traces.jsonl
```

---

## Examples

### Example 1: Basic RAG Monitoring

```python
from cert import trace

@trace()
def simple_rag(query):
    # Your RAG logic here
    context = "Revenue in Q4 was $500M"
    answer = "Q4 revenue reached $500 million"
    return {"context": context, "answer": answer}

# Use normally
result = simple_rag("What was Q4 revenue?")
```

### Example 2: With Evaluation

```python
from cert import trace
from cert.evaluation import Evaluator

# Runtime: just trace
@trace(log_path="traces.jsonl")
def my_rag(query):
    return {"context": context, "answer": answer}

# Offline: evaluate periodically
evaluator = Evaluator(preset="financial", threshold=0.9)
results = evaluator.evaluate_log_file("traces.jsonl")

if results['pass_rate'] < 0.9:
    alert_team(f"Pass rate dropped to {results['pass_rate']:.1%}")
```

### Example 3: Full Compliance Pipeline

```python
# 1. Runtime monitoring
from cert import trace

@trace(log_path="traces.jsonl", metadata={"version": "1.0"})
def production_rag(query):
    return {"context": context, "answer": answer}

# 2. Daily evaluation (cron job)
from cert.evaluation import Evaluator
import json

evaluator = Evaluator(preset="financial")
results = evaluator.evaluate_log_file("traces.jsonl")

with open("eval_results.json", "w") as f:
    json.dump(results, f)

# 3. Monthly compliance report (CLI)
# cert report traces.jsonl -o report.pdf -f pdf --system-name "Trading RAG"
```

---

## Framework Integrations

### LangChain

```python
from cert import trace
from langchain.chains import RetrievalQA

@trace()
def langchain_rag(query):
    qa = RetrievalQA.from_chain_type(...)
    result = qa.run(query)
    return {"answer": result, "context": "..."}  # Extract context from chain
```

### Anthropic Claude

```python
from cert import trace
import anthropic

@trace()
def claude_rag(query):
    client = anthropic.Anthropic()
    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{"role": "user", "content": query}]
    )
    return {"answer": message.content[0].text, "context": "..."}
```

### OpenAI

```python
from cert import trace
import openai

@trace()
def openai_rag(query):
    client = openai.OpenAI()
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": query}]
    )
    return {"answer": response.choices[0].message.content, "context": "..."}
```

---

## Advanced Features (Experimental)

### Trajectory Monitoring

```python
from cert.advanced.trajectory import ReasoningTrajectoryMonitor

monitor = ReasoningTrajectoryMonitor(model, tokenizer)
analysis = monitor.monitor_generation(prompt)
```

### Multi-Agent Coordination

```python
from cert.advanced.coordination import CoordinationOrchestrator

orchestrator = CoordinationOrchestrator()
results = orchestrator.coordinate_agents([agent1, agent2])
```

---

## Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

# Install core only (lightweight)
RUN pip install cert-framework

# Or with evaluation
# RUN pip install cert-framework[evaluation]

COPY app.py .

CMD ["python", "app.py"]
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cert-config
data:
  log_path: "/var/log/cert/traces.jsonl"
  preset: "financial"
  threshold: "0.9"
```

### CI/CD Integration

```yaml
# .github/workflows/compliance-check.yml
name: Compliance Check

on:
  schedule:
    - cron: "0 0 * * *"  # Daily

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install CERT
        run: pip install cert-framework[evaluation,cli]

      - name: Evaluate traces
        run: |
          cert evaluate traces.jsonl --preset financial --output results.json

      - name: Check pass rate
        run: |
          PASS_RATE=$(jq .pass_rate results.json)
          if (( $(echo "$PASS_RATE < 0.9" | bc -l) )); then
            echo "❌ Pass rate too low: $PASS_RATE"
            exit 1
          fi

      - name: Generate report
        run: |
          cert report traces.jsonl -o report.pdf --system-name "Production RAG"

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: compliance-report
          path: report.pdf
```

---

## Performance Characteristics

| Operation | Time | Memory |
|-----------|------|--------|
| `@trace` decorator overhead | <1ms | <100MB (no models) |
| First evaluation (cold start) | 2-5s | ~600MB (model loading) |
| Subsequent evaluations (cached) | <100ms | ~600MB |
| Batch evaluation (1000 traces) | ~30s | ~600MB |
| CLI report generation | <1s | <50MB (no models) |

**Throughput:**
- Tracing: >1000 req/s sustained
- Evaluation: ~30-50 traces/s (depends on text length)

---

## Migration from v2.x

See [docs/migration-v2-to-v3.md](docs/migration-v2-to-v3.md) for complete migration guide.

**TL;DR:**
- Replace `@monitor` with `@trace`
- Move evaluation to offline (CLI or Evaluator class)
- Update dependencies: `pip install cert-framework[evaluation]`

---

## Development

```bash
# Clone repository
git clone https://github.com/Javihaus/cert-framework
cd cert-framework

# Install development dependencies
pip install -e ".[dev,all]"

# Run tests
pytest tests/

# Run linting
ruff check .

# Format code
ruff format .
```

---

## FAQ

**Q: Do I need ML dependencies for basic monitoring?**
A: No! Core package has zero dependencies. Install `[evaluation]` extras only when needed.

**Q: How is this different from Langfuse?**
A: Langfuse is observability. CERT is observability + EU AI Act compliance automation.

**Q: Can I use this with my existing monitoring?**
A: Yes! CERT complements tools like Langfuse, Weights & Biases, etc.

**Q: What about GDPR/data privacy?**
A: All data stays on your infrastructure (self-hosted). No external API calls for core functionality.

**Q: Is evaluation accuracy good enough for compliance?**
A: We validate against ground truth datasets (STS Benchmark, etc.). See validation tests.

**Q: What about production performance?**
A: <1ms overhead for tracing. Evaluation runs offline, no impact on serving latency.

---

## Roadmap

- [ ] Real-time alerting integration (PagerDuty, Slack)
- [ ] Web dashboard for visualization
- [ ] More NLI models (multilingual support)
- [ ] Integration with Weights & Biases
- [ ] Export to OpenTelemetry format

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 - See [LICENSE](LICENSE)

---

## Citation

```bibtex
@software{cert_framework,
  title = {CERT Framework: LLM Monitoring with EU AI Act Compliance},
  author = {Javier Marin},
  year = {2025},
  url = {https://github.com/Javihaus/cert-framework},
  version = {4.0.0}
}
```

---

## Support

- **Issues:** https://github.com/Javihaus/cert-framework/issues
- **Discussions:** https://github.com/Javihaus/cert-framework/discussions
- **Email:** info@cert-framework.com

---

**Made with ❤️ for the AI safety community**
