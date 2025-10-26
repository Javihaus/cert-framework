# CERT Framework

Production-ready accuracy monitoring for LLM systems. Automated compliance documentation for EU AI Act Article 15.

<div align="center">
  <img src="docs/CERT.png" alt="CERT Framework" width="1000">
</div>

[![PyPI version](https://badge.fury.io/py/cert-framework.svg)](https://pypi.org/project/cert-framework/)
![pytest](https://img.shields.io/badge/pytest-passing-green)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)

---

## Installation & Quickstart

### Installation

```bash
# Basic installation
pip install cert-framework

# With trajectory analysis (experimental)
pip install cert-framework[trajectory]

# From source
git clone https://github.com/Javihaus/cert-framework
cd cert-framework
pip install -e .
```

### Quickstart

Three lines of code to add accuracy monitoring:

```python
from cert import monitor

@monitor(preset="healthcare")  # or "financial", "legal", "general"
def your_rag_pipeline(query):
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}

result = your_rag_pipeline("What was Q4 revenue?")
# Automatically generates audit log in cert_audit.jsonl
```

Generate compliance report:

```python
from cert import export_report

export_report(
    audit_log_path="cert_audit.jsonl",
    system_name="Production RAG System",
    format="txt"  # or "json", "markdown", "html", "pdf"
)
```

**See `examples/` for complete working examples.**

### Run Examples

```bash
# Basic examples (no setup required)
python examples/01_quickstart.py
python examples/02_rag_monitoring.py
python examples/03_model_comparison.py
python examples/04_compliance_reports.py

# Advanced examples (require cert-framework[trajectory])
python examples/05_trajectory_analysis.py
python examples/06_coordination_monitor.py
```

All examples run in < 10 seconds with zero setup.

---

## API Reference

### measure()

Compare two texts for semantic consistency.

**Signature:**

```python
def measure(
    text1: str,
    text2: str,
    *,
    use_semantic: bool = True,
    semantic_weight: float = 0.3,
    use_nli: bool = True,
    nli_weight: float = 0.5,
    use_grounding: bool = True,
    grounding_weight: float = 0.2,
    threshold: float = 0.7,
    embedding_model: str = "all-MiniLM-L6-v2",
    nli_model: str = "microsoft/deberta-v3-base"
) -> MeasurementResult
```

**Purpose:**
Measures semantic similarity, contradiction, and grounding between two texts using three components: embedding similarity (semantic), natural language inference (NLI), and term grounding.

**Parameters:**

- `text1` (str): First text, typically model output or answer
- `text2` (str): Second text, typically context or ground truth
- `use_semantic` (bool): Enable embedding-based similarity [default: True]
- `semantic_weight` (float): Weight for semantic component [default: 0.3]
- `use_nli` (bool): Enable natural language inference [default: True]
- `nli_weight` (float): Weight for NLI component [default: 0.5]
- `use_grounding` (bool): Enable term grounding check [default: True]
- `grounding_weight` (float): Weight for grounding component [default: 0.2]
- `threshold` (float): Confidence threshold for match [default: 0.7]
- `embedding_model` (str): SentenceTransformer model name [default: "all-MiniLM-L6-v2"]
- `nli_model` (str): NLI model from HuggingFace [default: "microsoft/deberta-v3-base"]

**Returns:**

`MeasurementResult` with fields:

- `matched` (bool): Whether texts match (confidence >= threshold)
- `confidence` (float): Overall score 0.0-1.0
- `semantic_score` (float | None): Embedding similarity
- `nli_score` (float | None): Entailment score
- `grounding_score` (float | None): Term grounding score
- `components_used` (list[str]): List of enabled components

**Example:**

```python
from cert import measure

result = measure(
    text1="Revenue was $500M in Q4",
    text2="Q4 revenue reached $500M"
)

print(f"Confidence: {result.confidence:.3f}")  # 0.95
print(f"Matched: {result.matched}")  # True
print(f"Semantic: {result.semantic_score:.3f}")
print(f"NLI: {result.nli_score:.3f}")
print(f"Grounding: {result.grounding_score:.3f}")
```

**Notes:**

- Weights auto-normalize to sum to 1.0
- All three components enabled by default (best accuracy)
- Use `use_semantic=True, use_nli=False, use_grounding=False` for fast mode (1-2ms)
- Models cached after first use (~200MB memory)
- Thread-safe for concurrent requests

---

### monitor()

Decorator for continuous monitoring of LLM functions with automatic audit logging.

**Signature:**

```python
def monitor(
    preset: str = "general",
    *,
    threshold: float | None = None,
    use_semantic: bool = True,
    use_nli: bool = True,
    use_grounding: bool = True,
    log_path: str = "cert_audit.jsonl",
    enabled: bool = True
) -> Callable
```

**Purpose:**
Wraps a function to automatically measure accuracy between context and answer, log results, and generate compliance documentation.

**Parameters:**

- `preset` (str): Industry preset configuration ["general", "healthcare", "financial", "legal"] [default: "general"]
- `threshold` (float | None): Override preset threshold (0.0-1.0) [default: None]
- `use_semantic` (bool): Enable semantic similarity [default: True]
- `use_nli` (bool): Enable NLI [default: True]
- `use_grounding` (bool): Enable grounding [default: True]
- `log_path` (str): Path to audit log file [default: "cert_audit.jsonl"]
- `enabled` (bool): Toggle monitoring on/off [default: True]

**Returns:**
Decorated function that logs measurements to audit file.

**Example:**

```python
from cert import monitor

@monitor(preset="healthcare")
def medical_qa(query: str):
    context = retrieval_system(query)
    answer = medical_llm.generate(context, query)
    return {"context": context, "answer": answer}

# Automatically measured and logged
result = medical_qa("What are the patient's symptoms?")
```

**Expected Return Format:**

The monitored function must return a dict with:

```python
{
    "context": str,  # Source text / ground truth
    "answer": str    # Model-generated text
}
```

**Presets:**

| Preset      | Threshold | Use Case                     |
|-------------|-----------|------------------------------|
| general     | 0.70      | General-purpose applications |
| healthcare  | 0.85      | Medical AI systems           |
| financial   | 0.80      | Financial services           |
| legal       | 0.80      | Legal document processing    |

**Notes:**

- Audit logs written as JSON Lines (`.jsonl`) format
- Each entry includes: timestamp, accuracy score, matched status, input/output
- Logs are append-only (immutable audit trail)
- Use `enabled=False` to disable monitoring without removing decorator
- Thread-safe for concurrent requests

---

### export_report()

Generate EU AI Act compliance reports from audit logs.

**Signature:**

```python
def export_report(
    audit_log_path: str = "cert_audit.jsonl",
    *,
    system_name: str = "AI System",
    system_version: str = "1.0.0",
    risk_level: str = "high",
    format: str = "txt",
    output_path: str | None = None
) -> None
```

**Purpose:**
Analyzes audit logs and generates compliance documentation citing EU AI Act Article 15 (Accuracy) and Article 19 (Logging).

**Parameters:**

- `audit_log_path` (str): Path to CERT audit log [default: "cert_audit.jsonl"]
- `system_name` (str): Name of AI system for report [default: "AI System"]
- `system_version` (str): Version identifier [default: "1.0.0"]
- `risk_level` (str): Risk classification ["high", "limited", "minimal"] [default: "high"]
- `format` (str): Output format ["txt", "json", "markdown", "html", "pdf"] [default: "txt"]
- `output_path` (str | None): Custom output path [default: None]

**Returns:**
None (writes report to file)

**Example:**

```python
from cert import export_report

export_report(
    audit_log_path="cert_audit.jsonl",
    system_name="Healthcare RAG System",
    system_version="2.1.0",
    risk_level="high",
    format="pdf",
    output_path="compliance_report_q4_2024.pdf"
)
```

**Report Contents:**

- System identification and version
- Accuracy metrics summary (mean, median, min, max)
- Pass/fail rate against threshold
- Compliance statement citing EU AI Act articles
- Audit log statistics
- Timestamp and report metadata

**Supported Formats:**

- `txt`: Plain text (human-readable)
- `json`: Machine-readable structured data
- `markdown`: GitHub-flavored markdown
- `html`: Self-contained HTML report
- `pdf`: PDF document (requires `weasyprint`)

**Notes:**

- PDF generation requires: `pip install weasyprint`
- Reports reference specific EU AI Act articles
- Suitable for submission to auditors
- Generated reports are reproducible from audit logs

---

### Preset / PRESETS

Industry-specific configuration presets for accuracy monitoring.

**Usage:**

```python
from cert import Preset, PRESETS

# Use preset with monitor
@monitor(preset="healthcare")
def medical_rag(query):
    # ...

# Access preset configuration
config = PRESETS["healthcare"]
print(config.threshold)  # 0.85
```

**Available Presets:**

```python
PRESETS = {
    "general": Preset(
        threshold=0.70,
        use_semantic=True,
        use_nli=True,
        use_grounding=True
    ),
    "healthcare": Preset(
        threshold=0.85,  # Strictest
        use_semantic=True,
        use_nli=True,
        use_grounding=True
    ),
    "financial": Preset(
        threshold=0.80,
        use_semantic=True,
        use_nli=True,
        use_grounding=True
    ),
    "legal": Preset(
        threshold=0.80,
        use_semantic=True,
        use_nli=True,
        use_grounding=True
    )
}
```

**Preset Fields:**

- `threshold` (float): Accuracy threshold (0.0-1.0)
- `use_semantic` (bool): Enable semantic similarity
- `use_nli` (bool): Enable NLI
- `use_grounding` (bool): Enable term grounding

**Custom Presets:**

```python
from cert import monitor

# Override preset threshold
@monitor(preset="healthcare", threshold=0.90)
def critical_medical_system(query):
    # ...

# Disable specific components
@monitor(preset="general", use_grounding=False)
def fast_rag(query):
    # ...
```

---

### analyze_trajectory() (Experimental)

Analyze LLM generation quality in real-time using trajectory monitoring.

**Signature:**

```python
def analyze_trajectory(
    model,
    tokenizer,
    prompt: str,
    config: TrajectoryConfig | None = None
) -> TrajectoryAnalysis
```

**Purpose:**
Monitors per-token metrics (perplexity, entropy) during LLM generation to detect low-quality or hallucinated outputs before they complete.

**Parameters:**

- `model`: HuggingFace model (AutoModelForCausalLM)
- `tokenizer`: Corresponding tokenizer
- `prompt` (str): Input prompt for generation
- `config` (TrajectoryConfig | None): Optional configuration [default: None]

**Returns:**
`TrajectoryAnalysis` with fields:

- `generated_text` (str): Generated output
- `mean_perplexity` (float): Average perplexity across tokens
- `mean_entropy` (float): Average entropy across tokens
- `passed_quality_check` (bool): Whether quality thresholds met
- `trajectory_metrics` (list): Per-token metrics

**Example:**

```python
from cert import analyze_trajectory, TrajectoryConfig, load_model_for_monitoring

# Load model
model, tokenizer = load_model_for_monitoring("gpt2")

# Configure analysis
config = TrajectoryConfig(
    perplexity_threshold=50.0,
    entropy_threshold=2.5,
    max_new_tokens=100
)

# Analyze generation
analysis = analyze_trajectory(model, tokenizer, "Explain AI safety", config)

print(f"Generated: {analysis.generated_text}")
print(f"Mean perplexity: {analysis.mean_perplexity:.2f}")
print(f"Quality: {'PASSED' if analysis.passed_quality_check else 'FAILED'}")
```

**TrajectoryConfig:**

```python
from cert import TrajectoryConfig

config = TrajectoryConfig(
    perplexity_threshold=50.0,  # Max perplexity
    entropy_threshold=2.5,       # Max entropy
    surprise_threshold=10.0,     # Max surprise
    max_new_tokens=150,          # Generation length
    temperature=0.7,             # Sampling temperature
    top_k=10                     # Top-k sampling
)
```

**Notes:**

- Requires: `pip install cert-framework[trajectory]`
- Dependencies: torch, transformers
- GPU recommended for large models
- Supports 8-bit quantization for memory efficiency
- Experimental - use in research/development, not production

---

### load_model_for_monitoring()

Load HuggingFace model for trajectory analysis.

**Signature:**

```python
def load_model_for_monitoring(
    model_name: str,
    device: str = "auto",
    use_8bit: bool = True
) -> tuple[AutoModelForCausalLM, AutoTokenizer]
```

**Purpose:**
Loads a model and tokenizer with optimizations for trajectory monitoring.

**Parameters:**

- `model_name` (str): HuggingFace model identifier (e.g., "gpt2", "Qwen/Qwen2.5-7B")
- `device` (str): Device placement ["auto", "cuda", "cpu"] [default: "auto"]
- `use_8bit` (bool): Enable 8-bit quantization (saves GPU memory) [default: True]

**Returns:**
Tuple of (model, tokenizer)

**Example:**

```python
from cert import load_model_for_monitoring, unload_model

# Load model
model, tokenizer = load_model_for_monitoring("gpt2")

# Use for analysis
# ...

# Cleanup
unload_model(model)
```

**Notes:**

- 8-bit quantization reduces memory by ~4x
- Automatic device placement (GPU if available, else CPU)
- Models cached in `~/.cache/huggingface/`

---

### unload_model()

Unload model from memory.

**Signature:**

```python
def unload_model(model) -> None
```

**Purpose:**
Explicitly free model from GPU/CPU memory.

**Parameters:**

- `model`: Model instance to unload

**Example:**

```python
from cert import load_model_for_monitoring, unload_model

model, tokenizer = load_model_for_monitoring("gpt2")
# ... use model ...
unload_model(model)
```

---

### CERTTrajectoryAnalyzer (Advanced)

Production-ready trajectory monitoring with resource management.

**Signature:**

```python
class CERTTrajectoryAnalyzer:
    def __init__(
        self,
        model_name: str = "gpt2",
        config: TrajectoryConfig | None = None
    )

    def __enter__(self) -> "CERTTrajectoryAnalyzer"
    def __exit__(self, *args) -> None

    def analyze(self, prompt: str) -> TrajectoryAnalysis
```

**Purpose:**
Context manager for trajectory analysis with automatic resource cleanup.

**Example:**

```python
from cert import CERTTrajectoryAnalyzer, TrajectoryConfig

config = TrajectoryConfig(max_new_tokens=50)

with CERTTrajectoryAnalyzer("gpt2", config) as analyzer:
    result1 = analyzer.analyze("Explain photosynthesis")
    result2 = analyzer.analyze("Describe quantum computing")
    # Automatic cleanup on exit

print(f"Result 1: {result1.passed_quality_check}")
print(f"Result 2: {result2.passed_quality_check}")
```

**Notes:**

- Recommended for production use
- Handles model lifecycle automatically
- Thread-safe for concurrent requests
- Experimental - API may change

---

### HamiltonianMonitor (Advanced)

Production-ready trajectory monitoring with comprehensive error handling.

**Signature:**

```python
class HamiltonianMonitor:
    def __init__(
        self,
        model_name: str = "gpt2",
        preload: bool = True,
        use_8bit: bool = True
    )

    def analyze(
        self,
        prompt: str,
        timeout: float = 30.0
    ) -> TrajectoryAnalysis | AnalysisError

    async def analyze_async(
        self,
        prompt: str,
        timeout: float = 30.0
    ) -> TrajectoryAnalysis | AnalysisError

    def analyze_batch(
        self,
        prompts: list[str],
        timeout: float = 60.0
    ) -> list[TrajectoryAnalysis | AnalysisError]
```

**Purpose:**
Production-grade trajectory monitor with sync/async APIs, batching, caching, and error handling.

**Example:**

```python
from cert.trajectory import HamiltonianMonitor

# Initialize with model preloading
monitor = HamiltonianMonitor("gpt2", preload=True)

# Synchronous analysis
result = monitor.analyze("Explain AI safety")

if result.is_valid():
    print(f"Quality: {result.passed_quality_check}")
else:
    print(f"Error: {result.error_type}")

# Batch processing
prompts = ["Prompt 1", "Prompt 2", "Prompt 3"]
results = monitor.analyze_batch(prompts)
```

**Notes:**

- Requires: `pip install cert-framework[trajectory]`
- Includes LRU caching (1000 entries)
- GPU OOM fallback to CPU
- Input validation and timeout handling
- Experimental - API may change

---

## Production Deployment

### Docker

Run CERT in a container:

```bash
# Build image
docker build -t cert-framework -f deployments/docker/Dockerfile .

# Run with volume for audit logs
docker run -v $(pwd)/logs:/logs cert-framework

# Using docker-compose (includes Prometheus monitoring)
cd deployments/docker
docker-compose up
```

See `deployments/docker/` for:

- `Dockerfile` - Production image
- `docker-compose.yml` - Full stack with monitoring

### Kubernetes

Deploy to K8s cluster:

```bash
# Apply all manifests
kubectl apply -f deployments/kubernetes/

# Check deployment
kubectl get pods -l app=cert-framework
kubectl logs -f deployment/cert-framework
```

Includes:

- Deployment with resource limits (CPU, memory, GPU)
- Service for metrics endpoint (`:9090/metrics`)
- PersistentVolumeClaim for audit logs
- Liveness and readiness probes

### Monitoring

CERT exposes Prometheus metrics at `/metrics` endpoint:

**Request Metrics:**

- `cert_requests_total` - Total monitored requests by service and status
- `cert_request_duration_seconds` - Request latency histogram
- `cert_request_errors_total` - Error count by service and error type

**Accuracy Metrics:**

- `cert_accuracy_score` - Accuracy score distribution (histogram)
- `cert_hallucinations_total` - Hallucination count by service
- `cert_quality_checks_total` - Quality check results (pass/fail)

**Trajectory Metrics (if enabled):**

- `cert_hamiltonian_perplexity` - Perplexity distribution
- `cert_hamiltonian_entropy` - Entropy distribution
- `cert_hamiltonian_quality_checks_total` - Trajectory quality results

**Cache Metrics:**

- `cert_cache_hits_total` - Cache hits by cache type
- `cert_cache_misses_total` - Cache misses by cache type

**Setup Prometheus:**

```yaml
# deployments/prometheus/prometheus.yml
scrape_configs:
  - job_name: 'cert-framework'
    static_configs:
      - targets: ['localhost:9090']
```

**Grafana Dashboard:**

See `deployments/prometheus/dashboards/cert-overview.json` for pre-built Grafana dashboard.

### Production Checklist

Before deploying to production:

- [ ] Set appropriate accuracy thresholds for your risk level
- [ ] Configure audit log rotation (default: 30 days retention)
- [ ] Monitor `cert_hallucinations_total` metric for anomalies
- [ ] Set up alerts for compliance violations (accuracy < threshold)
- [ ] Test with production-like traffic patterns
- [ ] Document threshold justification for auditors
- [ ] Verify audit logs are immutable (append-only)
- [ ] Set up log backup and archival
- [ ] Configure resource limits for trajectory monitoring (GPU memory)
- [ ] Test circuit breaker behavior under load

**Example Alert (Prometheus):**

```yaml
# deployments/prometheus/alerts.yml
- alert: HighHallucination Rate
  expr: rate(cert_hallucinations_total[5m]) > 0.05
  for: 10m
  annotations:
    summary: "High hallucination rate detected"

- alert: LowAccuracy
  expr: histogram_quantile(0.95, rate(cert_accuracy_score_bucket[5m])) < 0.7
  for: 15m
  annotations:
    summary: "Accuracy below acceptable threshold"
```

---

## EU AI Act Compliance

CERT provides technical measurement infrastructure for EU AI Act compliance. It is **not** a complete compliance solution.

### What CERT Provides

**Article 15 (Accuracy):**

- Automated accuracy measurement for LLM outputs
- Configurable thresholds by risk level
- Statistical accuracy reporting (mean, variance, percentiles)

**Article 19 (Logging):**

- Immutable audit logs in JSON Lines format
- Timestamp, input, output, accuracy score per request
- Tamper-evident append-only format

**Compliance Reports:**

- Automated report generation citing EU AI Act articles
- Human-readable (TXT, PDF) and machine-readable (JSON) formats
- Statistical summaries suitable for auditor review

### What You Still Need

CERT handles **technical measurement**. You are responsible for:

- **Risk Classification** - Determine if your system is high-risk, limited-risk, or minimal-risk
- **Quality Management System (QMS)** - ISO 13485 or equivalent documentation
- **Post-Market Monitoring** - Procedures for ongoing surveillance
- **Threshold Justification** - Document why you chose specific accuracy thresholds
- **Human Oversight** - Procedures for human review of high-stakes decisions
- **Transparency** - User-facing documentation of AI system capabilities and limitations

### Compliance Workflow

1. **Instrument your system** with `@monitor` decorator
2. **Run in production** to collect audit logs
3. **Generate reports** quarterly or as required
4. **Submit to auditors** with QMS documentation
5. **Iterate thresholds** based on post-market monitoring

### Compliance Consulting

For assistance with full EU AI Act compliance (risk assessment, QMS documentation, auditor liaison):

**Email:** info@cert-framework.com

---

## License & Citation

### License

Apache License 2.0 - See [LICENSE](LICENSE) file

### Citation

If you use CERT Framework in academic work, please cite:

```bibtex
@software{cert_framework,
  author = {Marín, Javier},
  title = {CERT Framework: EU AI Act Compliance Tools for LLM Systems},
  url = {https://github.com/Javihaus/cert-framework},
  version = {3.1.0},
  year = {2025}
}
```

### Contact

- **Issues**: https://github.com/Javihaus/cert-framework/issues
- **Email**: info@cert-framework.com
- **Documentation**: https://github.com/Javihaus/cert-framework
- **PyPI**: https://pypi.org/project/cert-framework/

---

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/Javihaus/cert-framework
cd cert-framework

# Install in editable mode with all dependencies
pip install -e ".[trajectory]"

# Install development dependencies
pip install pytest ruff

# Run tests
pytest tests/

# Run linting
ruff check cert/
ruff format cert/
```

### Project Structure

```
cert/
├── __init__.py              # Public API exports
├── measure/                 # measure() implementation
│   ├── semantic.py         # Embedding similarity
│   ├── nli.py              # Natural language inference
│   └── grounding.py        # Term grounding
├── monitor/                 # @monitor decorator
│   └── decorator.py        # Monitoring logic
├── trajectory/              # Trajectory analysis (experimental)
│   ├── monitor.py          # ReasoningTrajectoryMonitor
│   ├── analyzer.py         # CERTTrajectoryAnalyzer
│   ├── api.py              # HamiltonianMonitor
│   └── engine.py           # HamiltonianEngine
├── coordination/            # Multi-agent coordination (experimental)
│   ├── orchestrator.py     # CoordinationOrchestrator
│   ├── evaluator.py        # QualityEvaluator
│   └── baseline.py         # BaselineMeasurer
├── core/                    # Production infrastructure
│   ├── errors.py           # Exception hierarchy
│   ├── retry.py            # Retry decorator
│   ├── circuit_breaker.py  # Circuit breaker
│   └── resources.py        # Resource management
├── observability/           # Monitoring infrastructure
│   ├── logging.py          # Structured logging
│   └── metrics.py          # Prometheus metrics
└── utils/                   # Utilities
    ├── presets.py          # Industry presets
    ├── audit.py            # Audit logging
    └── report.py           # Compliance reports
```

### Running Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/unit/core/test_errors.py

# Run with coverage
pytest --cov=cert tests/

# Run with verbose output
pytest -v tests/
```

### Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Run linting (`ruff check` + `ruff format`)
6. Submit pull request

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community guidelines.

---

**CERT Framework** - Production-ready LLM accuracy monitoring for EU AI Act compliance.
