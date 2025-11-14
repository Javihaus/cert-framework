## CERT Framework API Reference

Complete API documentation for CERT Framework v2.0.

---

### Table of Contents

1. [Connectors](#connectors)
2. [Assessment](#assessment)
3. [Cost Analysis](#cost-analysis)
4. [CLI Commands](#cli-commands)
5. [Utilities](#utilities)

---

## Connectors

### Base Classes

#### `ConnectorAdapter`

Abstract base class for all platform connectors.

**Location:** `cert.integrations.base.ConnectorAdapter`

**Abstract Methods:**

```python
class ConnectorAdapter(ABC):
    def activate(self) -> None:
        """Install hooks into target platform."""

    def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
        """Extract platform-specific metadata."""

    def calculate_cost(self, call_data: Any) -> Optional[float]:
        """Calculate API cost in USD."""
```

**Methods:**

- `log_call(traced_call: TracedCall) -> None` - Log a traced call with circuit breaker
- `reset_circuit_breaker() -> None` - Manually reset circuit breaker
- `is_healthy() -> bool` - Check if connector is healthy
- `format_timestamp(dt: datetime) -> str` - Format timestamp as ISO 8601

**Properties:**

- `enabled: bool` - Whether connector is enabled
- `failure_count: int` - Number of consecutive failures
- `max_failures: int` - Max failures before circuit breaker opens (default: 3)

#### `TracedCall`

Standard format for traced calls.

```python
@dataclass
class TracedCall:
    timestamp: str                    # ISO 8601 with Z suffix
    platform: str                     # "openai", "anthropic", etc.
    model: str                        # Model identifier
    input_data: Any                   # Input to model
    output_data: Any                  # Output from model
    metadata: Dict[str, Any]          # Platform-specific metadata
    cost: Optional[float] = None      # Cost in USD
    error: Optional[str] = None       # Error message if failed
```

### Registry Functions

**Location:** `cert.integrations.registry`

#### `register_connector(connector_class)`

Decorator to register a connector for auto-activation.

```python
from cert.integrations.registry import register_connector
from cert.integrations.base import ConnectorAdapter

@register_connector
class MyConnector(ConnectorAdapter):
    ...
```

#### `activate_all(tracer, skip_on_import_error=True)`

Activate all registered connectors.

**Parameters:**
- `tracer` - CERT tracer instance
- `skip_on_import_error` (bool) - Skip connectors whose platforms aren't installed

**Returns:** List of activated connector instances

```python
from cert.integrations.registry import activate_all
from cert.core.api import get_tracer

tracer = get_tracer()
connectors = activate_all(tracer)
```

#### `get_active_connectors()`

Get all currently activated connector instances.

**Returns:** List of `ConnectorAdapter` instances

#### `check_connector_health()`

Check health of all connectors.

**Returns:** Dictionary with health statistics

```python
{
    "total_connectors": 5,
    "healthy": 5,
    "unhealthy": 0,
    "health_percentage": 100.0,
    "connectors": [...]
}
```

### Available Connectors

#### OpenAI Connector

**Location:** `cert.integrations.openai_connector.OpenAIConnector`

Traces OpenAI SDK calls.

**Supported:**
- Chat completions (streaming and non-streaming)
- Async completions
- All GPT models

**Pricing:** Automatic calculation from token usage

#### Anthropic Connector

**Location:** `cert.integrations.anthropic_connector.AnthropicConnector`

Traces Anthropic SDK calls.

**Supported:**
- Messages API
- All Claude models

**Pricing:** Automatic calculation from token usage

#### LangChain Connector

**Location:** `cert.integrations.langchain_connector.LangChainConnector`

Integrates with LangChain via callback system.

**Usage:**
```python
from cert.integrations.langchain_connector import LangChainConnector
from cert.core.api import get_tracer

connector = LangChainConnector(get_tracer())
connector.activate()

# Use the handler
from langchain.chains import LLMChain
chain = LLMChain(llm=llm, callbacks=[connector.handler])
```

#### Bedrock Connector

**Location:** `cert.integrations.bedrock_connector.BedrockConnector`

Traces AWS Bedrock calls.

**Supported Models:**
- Anthropic Claude
- Meta Llama
- Amazon Titan
- AI21 Jurassic
- Cohere Command

#### Azure OpenAI Connector

**Location:** `cert.integrations.azure_openai_connector.AzureOpenAIConnector`

Traces Azure OpenAI calls.

**Supported:** Same as OpenAI connector

---

## Assessment

### Questionnaire

**Location:** `cert.assessment.questionnaire`

#### `run_interactive_questionnaire(questions, title)`

Run interactive CLI questionnaire.

**Parameters:**
- `questions` (List[Question]) - Questions to ask
- `title` (str) - Title to display

**Returns:** Dictionary of answers (question_id -> answer)

#### Predefined Questions

- `ANNEX_III_QUESTIONS` - EU AI Act Annex III risk questions (14 questions)
- `READINESS_QUESTIONS` - Readiness assessment questions by dimension (25 questions)

### Risk Classification

**Location:** `cert.assessment.classifier`

#### `classify_risk(risk_score: int) -> str`

Classify AI system by risk level.

**Returns:** "PROHIBITED", "HIGH_RISK", "LIMITED_RISK", or "MINIMAL_RISK"

#### `get_compliance_requirements(risk_level: str) -> List[str]`

Get compliance requirements for a risk level.

#### `get_next_steps(risk_level: str, readiness_score: float) -> List[str]`

Get recommended next steps.

### Readiness Assessment

**Location:** `cert.assessment.readiness`

#### `assess_readiness(answers: Dict[str, str]) -> Dict[str, float]`

Calculate readiness scores across dimensions.

**Returns:** Dictionary of dimension scores (0-100)

```python
{
    "data_governance": 75.0,
    "infrastructure": 60.0,
    "team_skills": 80.0,
    "documentation": 50.0,
    "testing_validation": 70.0,
    "overall": 67.0
}
```

#### `identify_gaps(readiness_scores, threshold=60.0) -> List[Dict]`

Identify dimensions scoring below threshold.

### Report Generation

**Location:** `cert.assessment.report_generator`

#### `generate_report(risk_level, readiness_scores, answers) -> Dict`

Generate comprehensive assessment report.

**Returns:** Complete report dictionary with:
- Risk classification
- Readiness assessment
- Gap analysis
- Timeline/cost estimates
- Recommendations

#### `estimate_timeline(risk_level: str, readiness_score: float) -> Dict`

Estimate time to compliance.

#### `estimate_cost(risk_level: str, readiness_score: float) -> Dict`

Estimate cost of compliance.

---

## Cost Analysis

### Cost Analyzer

**Location:** `cert.value.analyzer.CostAnalyzer`

```python
from cert.value import CostAnalyzer

analyzer = CostAnalyzer("production.jsonl")
```

#### Methods

- `total_cost(start_date=None, end_date=None) -> float` - Total spending
- `cost_by_model(start_date=None, end_date=None) -> Dict[str, float]` - Costs by model
- `cost_by_platform(...) -> Dict[str, float]` - Costs by platform
- `cost_trend(granularity="daily", ...) -> Dict[str, float]` - Time series
- `detect_anomalies(threshold_stddev=2.0) -> List[Dict]` - Find cost spikes
- `get_summary(days=30) -> Dict` - Comprehensive summary

### ROI Calculator

**Location:** `cert.value.roi_calculator.ROICalculator`

```python
from cert.value import ROICalculator

calculator = ROICalculator("production.jsonl", business_value_per_task=2.50)
```

#### Methods

- `calculate_roi(start_date=None, end_date=None) -> Dict` - Calculate ROI
- `calculate_lifetime_value(monthly_tasks, months=12) -> Dict` - Project LTV
- `compare_scenarios(scenarios) -> List[Dict]` - Compare different scenarios

### Optimizer

**Location:** `cert.value.optimizer.Optimizer`

```python
from cert.value import Optimizer

optimizer = Optimizer("production.jsonl")
```

#### Methods

- `recommend_model_changes(confidence_threshold=0.85) -> List[Dict]` - Model downgrade opportunities
- `find_caching_opportunities(min_repetitions=5) -> List[Dict]` - Caching opportunities
- `suggest_prompt_optimizations() -> List[Dict]` - Prompt shortening suggestions
- `get_optimization_summary() -> Dict` - Complete summary

---

## CLI Commands

### Assessment Commands

#### `cert assess`

Run AI readiness assessment.

**Options:**
- `--interactive, -i` - Run interactive questionnaire
- `--output, -o` - Output file path
- `--format, -f` - Output format (json/txt)
- `--risk-only` - Only assess risk
- `--readiness-only` - Only assess readiness

**Example:**
```bash
cert assess --interactive --output report.json
```

#### `cert assess-risk`

Quick risk classification.

#### `cert assess-readiness`

Quick readiness assessment.

### Cost Commands

#### `cert costs`

Analyze AI/LLM costs.

**Arguments:**
- `TRACES_FILE` - Path to trace file

**Options:**
- `--days, -d` - Number of days to analyze (default: 30)
- `--format, -f` - Output format (json/text)

**Example:**
```bash
cert costs production.jsonl --days 30
```

#### `cert roi`

Calculate ROI.

**Options:**
- `--value-per-task, -v` - Business value per successful task (required)
- `--days, -d` - Number of days to analyze

**Example:**
```bash
cert roi production.jsonl --value-per-task 2.50
```

#### `cert optimize`

Find cost optimization opportunities.

**Example:**
```bash
cert optimize production.jsonl
```

### Health Commands

#### `cert health`

Check connector health.

**Options:**
- `--format, -f` - Output format (json/text)
- `--verbose, -v` - Show detailed information

**Example:**
```bash
cert health --verbose
```

#### `cert reset-health`

Reset connector circuit breakers.

**Options:**
- `--connector, -c` - Specific connector to reset

**Example:**
```bash
cert reset-health --connector openai
```

#### `cert perf`

View and manage performance metrics.

**Options:**
- `--enable` - Enable performance monitoring
- `--disable` - Disable performance monitoring
- `--reset` - Reset metrics
- `--format, -f` - Output format

**Example:**
```bash
cert perf --enable
cert perf --format json
```

---

## Utilities

### Performance Monitoring

**Location:** `cert.integrations.performance`

#### `get_performance_monitor() -> PerformanceMonitor`

Get global performance monitor instance.

#### `PerformanceTracker`

Context manager for tracking overhead.

```python
from cert.integrations.performance import PerformanceTracker

with PerformanceTracker("my_connector"):
    # Code to measure
    pass
```

### Structured Logging

**Location:** `cert.utils.logging`

#### `setup_logging(level="INFO", structured=False, log_file=None)`

Set up logging for CERT framework.

```python
from cert.utils.logging import setup_logging

setup_logging(level="DEBUG", structured=True, log_file="cert.log")
```

#### `get_logger(name: str) -> CERTLogger`

Get enhanced logger instance.

```python
from cert.utils.logging import get_logger

logger = get_logger("my_module")
logger.info("Message", custom_field="value")
```

### Telemetry

**Location:** `cert.utils.telemetry`

#### `track_event(event_name: str, properties: Dict)`

Track anonymous event (opt-in only).

#### `enable_telemetry()`

Enable telemetry for current session.

#### `disable_telemetry()`

Disable telemetry.

#### `show_telemetry_info()`

Show what is/isn't tracked.

**Enable via environment:**
```bash
export CERT_TELEMETRY=1
```

---

## Examples

### Basic Connector Usage

```python
import cert.integrations.auto  # Auto-activates all connectors

# Your LLM calls are now automatically traced
import openai
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
# Automatically logged to traces
```

### Manual Activation

```python
from cert.integrations.registry import activate_all
from cert.core.api import get_tracer

tracer = get_tracer()
connectors = activate_all(tracer)
print(f"Activated {len(connectors)} connectors")
```

### Cost Analysis

```python
from cert.value import CostAnalyzer

analyzer = CostAnalyzer("production.jsonl")
summary = analyzer.get_summary(days=30)

print(f"Total: ${summary['costs']['total']}")
print(f"Top model: {summary['top_model']['name']}")
```

### ROI Calculation

```python
from cert.value import ROICalculator
from datetime import datetime, timedelta

calculator = ROICalculator("production.jsonl", business_value_per_task=2.50)

end = datetime.utcnow()
start = end - timedelta(days=30)

roi = calculator.calculate_roi(start, end)
print(f"ROI: {roi['roi']['percentage']:.1f}%")
```

---

## Error Handling

All connectors implement error isolation - connector failures never break user code:

```python
# Even if connector fails, this still works
response = client.chat.completions.create(...)
```

Circuit breaker automatically disables connectors after 3 consecutive failures.

---

## Performance

Target: **< 5ms overhead per traced call**

Monitor with:
```bash
cert perf --enable
# Use your application
cert perf  # View metrics
```

---

For more information, see:
- [Connector Development Guide](./CONNECTOR_DEVELOPMENT_GUIDE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [GitHub Repository](https://github.com/Javihaus/cert-framework)
