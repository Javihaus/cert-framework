# CERT Framework Beta Testing - UX Feedback Report

**Tester:** Claude (AI Assistant)
**Date:** 2025-11-23
**Version Tested:** CERT Framework v4.0.0
**Test Scenario:** PDF Extraction & Report Generation Pipeline using LangChain + Claude

---

## Executive Summary

I tested CERT Framework by building a real-world agentic pipeline with two sequential agents (PDF Extraction Agent and Report Generation Agent) using LangChain and Claude, monitored by cert-framework. This report documents the limitations, incomplete features, UX issues, and recommendations from a user perspective.

---

## Test Application Created

```
beta_test/
├── create_sample_pdf.py          # Sample PDF/text document generator
├── pdf_extraction_pipeline.py    # Full pipeline with real LLM calls
├── pipeline_test_mock.py         # Mock version for testing without API
├── sample_financial_report.txt   # Sample financial report
├── sample_research_paper.txt     # Sample research paper
└── UX_FEEDBACK_REPORT.md         # This report
```

### Pipeline Architecture
1. **Agent 1 (Extraction):** Reads PDF/text documents, extracts structured data
2. **Agent 2 (Report Generation):** Creates analytical reports from extracted data
3. **CERT Monitoring:** Traces all LLM calls, records latency, tokens, costs

---

## Issues Found

### Category 1: Installation & Dependencies

| Issue | Severity | Description |
|-------|----------|-------------|
| **Dependency Conflicts** | HIGH | `pypdf` depends on `cryptography` which has conflicts with `cffi` in some environments. Error: `ModuleNotFoundError: No module named '_cffi_backend'` |
| **Heavy Optional Dependencies** | MEDIUM | Installing `[evaluation]` requires ~500MB of dependencies (torch, transformers). Should document this clearly. |
| **LangChain Import Changes** | MEDIUM | LangChain v1.0+ moved classes to `langchain_core`. The framework's examples use outdated imports: `from langchain.schema import HumanMessage` should be `from langchain_core.messages import HumanMessage` |
| **Missing CLI Error** | LOW | `cert measure` fails with unhelpful error `Error: Install cert-framework to use measure` when evaluation extras aren't installed. Should specify which extras to install. |

### Category 2: Documentation Gaps

| Issue | Severity | Description |
|-------|----------|-------------|
| **No Quick Start for Agentic Pipelines** | HIGH | README focuses on basic tracing. No example showing multi-agent pipeline with LangChain/Claude integration. |
| **LangChain Connector Manual Setup** | HIGH | LangChain connector requires manual callback injection (`callbacks=[connector.handler]`). No auto-instrumentation like OpenAI/Anthropic. This is documented but buried in code comments. |
| **Unclear Cost Calculation** | MEDIUM | Cost analysis shows $0.00 for traces - unclear how to properly populate cost data. The `TracedCall` needs explicit cost field population. |
| **Missing Environment Variable Docs** | MEDIUM | `ANTHROPIC_API_KEY` requirement not documented in main README quick start section. |
| **Pricing Table Incomplete** | LOW | `anthropic_connector.py` pricing table (lines 32-38) doesn't include Claude 3.5 Sonnet or Claude 4 models. |

### Category 3: API & Integration Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Anthropic Connector Monkey-Patching** | HIGH | Line 53 `Anthropic.messages.create` patching may not work with newer SDK versions. The SDK structure has changed. |
| **No Async Support for Anthropic** | MEDIUM | Anthropic connector only patches synchronous `create()`. No support for `create_async()` or streaming. |
| **LangChain Callback API Changes** | MEDIUM | `BaseCallbackHandler` interface has changed in langchain_core. The import `from langchain.callbacks.base import BaseCallbackHandler` should be updated. |
| **TracedCall Missing Fields** | LOW | `TracedCall` dataclass doesn't capture all useful metrics: no request_id, no model version, no prompt_tokens vs completion_tokens breakdown by default. |

### Category 4: CLI UX Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **`cert costs` Shows $0.00** | HIGH | When traces don't have explicit cost field, shows $0.00 without warning that cost data is missing. Should indicate "Cost data not available in traces". |
| **`cert health` Shows 0 Connectors** | MEDIUM | Health check shows "0 connectors activated" even after running traced code. Connectors are activated at import time, not persisted. |
| **No Example Trace Files** | MEDIUM | No sample trace files provided for testing CLI commands without running actual LLM calls. |
| **`cert measure` Slow First Run** | LOW | First run of `cert measure` takes 30+ seconds to load ML models. No progress indicator or "loading models" message. |

### Category 5: Monitoring & Observability Gaps

| Issue | Severity | Description |
|-------|----------|-------------|
| **No Real-time Monitoring** | MEDIUM | All monitoring is offline (analyze JSONL after the fact). No live dashboard or streaming metrics. |
| **No Alerting Integration** | MEDIUM | `cert/observability/alerting/` exists but no examples of setting up Slack/PagerDuty/email alerts. |
| **Trace Correlation Missing** | MEDIUM | Pipeline traces don't automatically correlate with agent traces. Need to manually add trace_id across calls. |
| **No Token Budget Tracking** | LOW | Can't set token/cost budgets and get alerts when approaching limits. |

### Category 6: Compliance Features

| Issue | Severity | Description |
|-------|----------|-------------|
| **Risk Classifier Requires Manual Input** | MEDIUM | `AIActRiskClassifier.classify()` requires manual domain input. Could auto-detect from trace content. |
| **No Report Templates** | MEDIUM | Compliance reports are generated as JSON. No ready-to-use Word/PDF templates for auditors. |
| **GPAI Classification Incomplete** | LOW | `cert/compliance_2025/gpai/` exists but general-purpose AI classification logic appears incomplete. |

---

## Positive Findings

### What Works Well

1. **Zero-Dependency Core**: The `@trace` decorator works with just standard library - no torch/transformers needed for basic tracing. This is excellent for production deployments.

2. **JSONL Format**: Using newline-delimited JSON for traces is smart - easy to analyze with standard tools, stream-friendly, human-readable.

3. **Comprehensive CLI**: The `cert` CLI has many useful commands (`costs`, `health`, `measure`, `optimize`, `report`). Good foundation.

4. **Modular Architecture**: Optional dependencies via `[extras]` is well-designed. Users only install what they need.

5. **Multi-Provider Support**: Support for OpenAI, Anthropic, Bedrock, Azure is comprehensive.

6. **EU AI Act Focus**: The compliance focus is unique and valuable. Risk classification and documentation generation are useful features.

---

## Recommendations

### Immediate Fixes (High Priority)

1. **Update LangChain imports** in all examples and connectors to use `langchain_core`:
   ```python
   # Old (broken)
   from langchain.schema import HumanMessage
   from langchain.callbacks.base import BaseCallbackHandler

   # New (correct)
   from langchain_core.messages import HumanMessage
   from langchain_core.callbacks import BaseCallbackHandler
   ```

2. **Add Claude 3.5/4 pricing** to `anthropic_connector.py`:
   ```python
   ANTHROPIC_PRICING = {
       "claude-3-5-sonnet": {"input": 3.0, "output": 15.0},
       "claude-sonnet-4": {"input": 3.0, "output": 15.0},
       "claude-3-opus": {"input": 15.0, "output": 75.0},
       # ... existing models
   }
   ```

3. **Better error messages** in CLI:
   ```python
   # Instead of: "Error: Install cert-framework to use measure"
   # Show: "Error: Evaluation features required. Install with: pip install cert-framework[evaluation]"
   ```

4. **Add cost data warning** when traces have no cost:
   ```
   ⚠️ Warning: No cost data in traces. Ensure connectors are capturing costs or add cost field to TracedCall.
   ```

### Medium Priority Improvements

5. **Create agentic pipeline example** in `examples/04_agentic_pipeline.py` showing:
   - Multi-agent setup with LangChain
   - Callback handler integration
   - Trace correlation between agents
   - Cost tracking across pipeline

6. **Add sample trace files** in `examples/sample_traces/`:
   - `openai_traces.jsonl` - Sample OpenAI traces with costs
   - `anthropic_traces.jsonl` - Sample Anthropic traces
   - `langchain_traces.jsonl` - Sample LangChain agent traces

7. **Add progress indicators** for slow operations:
   ```python
   print("Loading evaluation models... (this may take 30+ seconds on first run)")
   ```

8. **Document environment setup** in README:
   ```markdown
   ## Quick Start

   1. Install: `pip install cert-framework`
   2. Set API keys: `export ANTHROPIC_API_KEY=sk-ant-...`
   3. Add tracing:
      ```python
      from cert import trace

      @trace()
      def my_pipeline(query):
          ...
      ```
   ```

### Future Enhancements

9. **Real-time dashboard**: Add WebSocket support for live trace streaming to the Next.js dashboard.

10. **Auto-instrumentation for LangChain**: Instead of requiring manual callback injection, auto-patch LangChain chains like OpenAI/Anthropic connectors.

11. **Token budget alerts**: Allow setting budgets and getting warnings:
    ```python
    from cert.monitoring import BudgetTracker

    budget = BudgetTracker(daily_limit_usd=100, alert_threshold=0.8)
    ```

12. **Trace correlation**: Automatic parent-child trace linking for multi-step pipelines:
    ```python
    @trace(parent_trace_id="auto")  # Auto-link to parent
    def child_step():
        pass
    ```

---

## Test Files Generated

During testing, the following trace files were generated:

| File | Contents | Lines |
|------|----------|-------|
| `cert_traces.jsonl` | All LLM calls | 4 |
| `extraction_agent_traces.jsonl` | Extraction agent calls | 2 |
| `report_agent_traces.jsonl` | Report generation calls | 2 |
| `pipeline_traces.jsonl` | Pipeline orchestration events | 6 |
| `pipeline_results.json` | Full pipeline output | 1 |

---

## Conclusion

CERT Framework v4.0.0 has a solid foundation with excellent architectural decisions (zero-dep core, modular extras, JSONL traces). However, it needs polish in:

1. **Documentation**: More examples, especially for agentic/multi-step pipelines
2. **Dependencies**: Updates for LangChain v1.0+ compatibility
3. **CLI UX**: Better error messages and progress indicators
4. **Pricing**: Updated model pricing tables

The EU AI Act compliance focus is a unique value proposition that differentiates this from generic LLM observability tools. With the recommended fixes, this framework would be production-ready for teams needing LLM monitoring with compliance documentation.

---

**Testing completed:** 2025-11-23
**Report generated by:** Claude (Anthropic)
