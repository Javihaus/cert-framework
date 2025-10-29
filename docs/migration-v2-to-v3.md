# Migration Guide: v2.x → v4.0 (Architecture Overhaul)

This guide helps you migrate from the monolithic v2.x architecture to the new modular v4.0 architecture with optional dependencies and offline evaluation.

## Overview of Changes

**v4.0 introduces a fundamental architectural change:**

- **Core Package**: Zero dependencies, lightweight tracing only (~5MB)
- **Evaluation Layer**: Optional, offline batch processing
- **Compliance Tools**: Separate CLI tools for report generation
- **Lazy Loading**: ML models load only when needed

## Breaking Changes

### 1. Dependencies Now Optional

**Before (v2.x):**
```bash
pip install cert-framework  # Installs 1.5GB+ of dependencies
```

**After (v4.0):**
```bash
# Core monitoring only (~5MB)
pip install cert-framework

# With evaluation features (~150MB)
pip install cert-framework[evaluation]

# With CLI tools
pip install cert-framework[cli]

# With compliance reporting
pip install cert-framework[compliance]

# With specific integrations
pip install cert-framework[langchain]
pip install cert-framework[anthropic]
pip install cert-framework[openai]

# Everything
pip install cert-framework[all]
```

### 2. New Primary API: `@trace` decorator

**Before (v2.x):**
```python
from cert import monitor

@monitor(preset="financial", accuracy_threshold=0.9)
def my_rag(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}
```

**After (v4.0):**
```python
from cert import trace

@trace(log_path="traces.jsonl")  # Just logging, zero dependencies
def my_rag(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}
```

**Key difference:** `@trace` only logs. No evaluation at runtime!

### 3. Evaluation Now Separate (Offline)

**Before (v2.x):**
Evaluation happened automatically in the decorator (runtime overhead).

**After (v4.0):**
```python
# Step 1: Trace during runtime (fast, <1ms overhead)
@trace(log_path="traces.jsonl")
def my_rag(query):
    return {"context": context, "answer": answer}

# Step 2: Evaluate offline (batch processing)
from cert.evaluation import Evaluator

evaluator = Evaluator(preset="financial", threshold=0.9)
results = evaluator.evaluate_log_file("traces.jsonl")

print(f"Pass rate: {results['pass_rate']:.1%}")
```

**Or use the CLI:**
```bash
cert evaluate traces.jsonl --preset financial --threshold 0.9 -o results.json
```

### 4. Compliance Reports via CLI

**Before (v2.x):**
```python
from cert import export_report

export_report(
    audit_log="cert_audit.jsonl",
    output_path="report.pdf",
    system_name="My RAG System"
)
```

**After (v4.0):**
```bash
# Via CLI (recommended)
cert report traces.jsonl \
  -o report.pdf \
  -f pdf \
  --system-name "My RAG System" \
  --risk-level high

# Or programmatically
from cert.compliance.reporter import ComplianceReporter

reporter = ComplianceReporter(
    system_name="My RAG System",
    risk_level="high"
)
reporter.generate_report(
    log_path="traces.jsonl",
    output_path="report.pdf",
    format="pdf"
)
```

### 5. `@monitor` is Deprecated

The old `@monitor` decorator still works but issues a deprecation warning:

```python
from cert import monitor  # DeprecationWarning

@monitor(preset="financial")  # Still works, but not recommended
def my_rag(query):
    return {"context": context, "answer": answer}
```

**Migration path:**
1. Replace `@monitor` with `@trace`
2. Run evaluation offline with CLI or Evaluator class

## Migration Checklist

### Minimal Migration (Just Monitoring)

- [ ] Install core package: `pip install --upgrade cert-framework`
- [ ] Replace `@monitor` with `@trace`
- [ ] Verify logs are created: check `cert_traces.jsonl`
- [ ] No evaluation? You're done! (Core has zero dependencies)

### Full Migration (With Evaluation)

- [ ] Install with extras: `pip install --upgrade cert-framework[evaluation,cli]`
- [ ] Replace `@monitor` with `@trace` in all files
- [ ] Update monitoring code to use offline evaluation:
  ```python
  # Old: evaluation at runtime
  @monitor(preset="financial")

  # New: trace at runtime, evaluate offline
  @trace()
  # Later: evaluator.evaluate_log_file("traces.jsonl")
  ```
- [ ] Update compliance report generation to use CLI:
  ```bash
  cert report traces.jsonl -o report.pdf --system-name "Your System"
  ```
- [ ] Update CI/CD pipelines (see below)
- [ ] Test with property-based tests (optional)

### CI/CD Pipeline Updates

**Before (v2.x):**
```yaml
# Tests ran with full dependencies
- run: pip install cert-framework pytest
- run: pytest tests/
```

**After (v4.0):**
```yaml
# Tests can run with minimal dependencies
- name: Test core (no ML dependencies)
  run: |
    pip install cert-framework pytest
    pytest tests/test_core.py

- name: Test evaluation (with ML dependencies)
  run: |
    pip install cert-framework[evaluation] pytest
    pytest tests/test_evaluation.py

# Matrix testing
strategy:
  matrix:
    extras: ["core", "evaluation", "all"]
steps:
  - run: pip install cert-framework[${{ matrix.extras }}]
```

## Architecture Changes

### Old Architecture (v2.x)

```
User Code
   ↓
@monitor decorator (heavy!)
   ├─ Loads ML models at decoration time
   ├─ Evaluates every request (runtime overhead)
   ├─ Writes audit log
   └─ Returns result

Single monolithic package with all dependencies.
```

**Problems:**
- Heavy runtime overhead (ML model loading + inference per request)
- Large installation size (1.5GB+)
- No separation of concerns

### New Architecture (v4.0)

```
Layer 1: Runtime Monitoring (cert.core.tracer)
   @trace decorator - just logging, <1ms overhead
   ↓
   Writes JSONL traces

Layer 2: Offline Evaluation (cert.evaluation)
   Evaluator.evaluate_log_file()
   ├─ Loads ML models (once)
   ├─ Batch processes traces
   └─ Returns aggregated results

Layer 3: Compliance Reporting (cert.compliance)
   ComplianceReporter.generate_report()
   ├─ Analyzes traces + evaluation results
   └─ Generates Article 15 documentation
```

**Benefits:**
- Minimal runtime overhead (<1ms)
- Optional dependencies (install only what you need)
- Evaluation runs on your schedule (hourly, daily, on-demand)
- Better separation of concerns

## Common Patterns

### Pattern 1: Basic Monitoring (No Evaluation)

```python
# Just trace, no evaluation needed
from cert import trace

@trace(log_path="production_traces.jsonl")
def my_rag_pipeline(query):
    return {"context": context, "answer": answer}
```

That's it! Core package has zero dependencies.

### Pattern 2: Monitoring + Periodic Evaluation

```python
# Runtime: trace only
from cert import trace

@trace(log_path="traces.jsonl")
def my_rag_pipeline(query):
    return {"context": context, "answer": answer}

# Separate process: evaluate every hour
# (Run this in a cron job, scheduled task, or manually)
from cert.evaluation import Evaluator

def evaluate_traces():
    evaluator = Evaluator(preset="financial", threshold=0.9)
    results = evaluator.evaluate_log_file("traces.jsonl")

    if results['pass_rate'] < 0.9:
        alert_team(f"Pass rate dropped to {results['pass_rate']:.1%}")
```

### Pattern 3: Full Compliance Pipeline

```python
# Step 1: Runtime monitoring
from cert import trace

@trace(log_path="traces.jsonl")
def my_rag_pipeline(query):
    return {"context": context, "answer": answer}

# Step 2: Daily evaluation (scheduled job)
from cert.evaluation import Evaluator
import json

evaluator = Evaluator(preset="financial", threshold=0.9)
results = evaluator.evaluate_log_file("traces.jsonl")

# Save results
with open("eval_results.json", "w") as f:
    json.dump(results, f)

# Step 3: Monthly compliance report (via CLI)
# cert report traces.jsonl \
#   -o monthly_report.pdf \
#   -f pdf \
#   --system-name "Trading RAG System" \
#   --risk-level high \
#   --eval-results eval_results.json
```

## FAQ

**Q: Do I need to migrate immediately?**
A: No. The old `@monitor` decorator still works in v4.0 (with deprecation warning).

**Q: What if I don't need evaluation?**
A: Just use `@trace` with the core package. No need to install evaluation extras.

**Q: Will my old audit logs work?**
A: Mostly yes. The new tracer uses a similar JSONL format. You may need to adjust field names.

**Q: What about performance?**
A: v4.0 is much faster:
  - Runtime monitoring: <1ms overhead (was ~100ms+)
  - Evaluation: Batch processing (was per-request)
  - Cold start: Instant for core, 2-5s for evaluation (was always 2-5s)

**Q: Can I still use presets?**
A: Yes! Presets are now used by the Evaluator:
```python
evaluator = Evaluator(preset="financial")  # or healthcare, legal, etc.
```

**Q: What about integrations (LangChain, etc.)?**
A: Still supported, now as optional extras:
```bash
pip install cert-framework[langchain]
```

## Need Help?

- **Issues:** https://github.com/Javihaus/cert-framework/issues
- **Discussions:** https://github.com/Javihaus/cert-framework/discussions
- **Documentation:** https://github.com/Javihaus/cert-framework#readme

## Summary

The v4.0 architecture makes CERT Framework:
- **Lighter**: Core is ~5MB (was 1.5GB+)
- **Faster**: Runtime overhead <1ms (was ~100ms+)
- **Modular**: Install only what you need
- **Better design**: Clear separation of monitoring, evaluation, and compliance

**Recommended migration path:**
1. Start with `@trace` (core package)
2. Add `[evaluation]` extras when you need accuracy metrics
3. Use CLI tools for compliance reports

The new architecture scales from hobby projects to enterprise deployments.
