# CERT Framework Restructuring Plan

## Executive Summary

**Goal:** Simplify CERT framework to 3 core functions with consistent, intuitive APIs following software engineering best practices.

**Current Problems:**
1. Confusing API - same functionality presented as different functions
2. Unnecessary abstraction layers (configure() + compare(), AssessmentConfig + CERTAgentEngine)
3. Missing core functionality (token/cost tracking)
4. Poor naming (compare → measure, CERTAgentEngine → agent_monitor)

**Solution:** Three simple, composable functions with all parameters explicit:

```python
from cert import measure, agent_monitor, cost_tracker

# 1. Measure reliability of model outputs
result = measure(text1, text2, use_semantic=True, use_nli=True, threshold=0.7, **kwargs)

# 2. Monitor agents/models across multiple trials
summary = agent_monitor(
    consistency_trials=20,
    temperature=0.0,
    provider="openai",
    model="gpt-4o",
    enabled_metrics=["consistency", "performance"],
    **kwargs
)

# 3. Track tokens and costs
tokens = cost_tracker(responses, cost_per_token=0.00001)
```

---

## Architecture Principles

### 1. **Simplicity First** (KISS Principle)
- One function per use case
- All parameters explicit in function signature
- No hidden configuration state
- No unnecessary abstractions

### 2. **Separation of Concerns**
- `measure()` - Output reliability measurement
- `agent_monitor()` - Agent/model monitoring over time
- `cost_tracker()` - Token and cost accounting
- Each function is independent and composable

### 3. **Explicit Over Implicit**
- No global `configure()` - all params in function calls
- Clear parameter names with defaults
- Type hints on everything
- Comprehensive docstrings

### 4. **Consistency**
- Same parameter naming across functions
- Same return type patterns
- Same error handling patterns
- Same logging patterns

### 5. **Backward Compatibility = Clean Break**
- Remove old confusing APIs entirely
- Major version bump (v2.0.0)
- Clear migration guide
- No deprecated aliases (reduces confusion)

---

## Detailed Design

## 1. `measure()` Function

### Purpose
Measure semantic similarity/reliability between two texts (typically model output vs ground truth/context).

### Signature
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
    nli_model: str = "microsoft/deberta-v3-base",
    **kwargs
) -> MeasurementResult:
    """Measure reliability/similarity between two texts.

    Combines semantic embeddings, NLI contradiction detection, and grounding
    analysis to produce a confidence score.

    Args:
        text1: First text (typically model output/answer)
        text2: Second text (typically context/ground truth)
        use_semantic: Enable semantic similarity via embeddings
        semantic_weight: Weight for semantic component (0.0-1.0)
        use_nli: Enable NLI contradiction detection
        nli_weight: Weight for NLI component (0.0-1.0)
        use_grounding: Enable term grounding analysis
        grounding_weight: Weight for grounding component (0.0-1.0)
        threshold: Confidence threshold for match (0.0-1.0)
        embedding_model: Sentence transformer model name
        nli_model: NLI model name
        **kwargs: Additional provider-specific parameters

    Returns:
        MeasurementResult with:
            - matched: bool (above threshold)
            - confidence: float (0.0-1.0)
            - semantic_score: float (0.0-1.0)
            - nli_score: float (0.0-1.0)
            - grounding_score: float (0.0-1.0)
            - threshold_used: float
            - rule: str (which component made decision)

    Raises:
        ValueError: If weights don't sum to 1.0 or invalid parameters

    Examples:
        # Basic semantic comparison
        result = measure("revenue increased", "sales grew")

        # RAG hallucination detection
        result = measure(
            answer="Revenue was $500B",
            context="Revenue was $391B in 2023",
            use_nli=True,
            nli_weight=0.5
        )

        # Fast mode (semantic only)
        result = measure(
            text1, text2,
            use_semantic=True,
            use_nli=False,
            use_grounding=False
        )
    """
```

### Implementation Notes
- Replace `compare()`, `configure()`, all RAG-specific functions
- Single entry point for all text reliability measurement
- Consolidate: SemanticComparator, NLIDetector, ProductionEnergyScorer
- Return rich result object with all component scores
- Default weights: semantic=0.3, nli=0.5, grounding=0.2
- Validate weights sum to 1.0

### Migration from Current API
```python
# OLD (confusing multiple ways)
from cert import compare, configure
configure(use_nli=True)
result = compare(text1, text2)

# NEW (explicit, simple)
from cert import measure
result = measure(text1, text2, use_nli=True, nli_weight=0.5)
```

---

## 2. `agent_monitor()` Function

### Purpose
Monitor one or more agents/models over multiple trials, measuring consistency, performance, latency, output quality, robustness.

### Signature
```python
def agent_monitor(
    *,
    # Core parameters
    provider: str,
    model: str,
    consistency_trials: int = 20,
    performance_trials: int = 15,

    # Model parameters
    temperature: float = 0.0,
    max_tokens: int = 1024,
    timeout: int = 30,

    # Test configuration
    consistency_prompt: Optional[str] = None,
    performance_prompts: Optional[List[str]] = None,

    # Metrics selection
    enabled_metrics: List[str] = ["consistency", "performance", "latency"],

    # Advanced
    embedding_model: str = "all-MiniLM-L6-v2",
    random_seed: int = 42,
    api_key: Optional[str] = None,

    **kwargs
) -> AgentMonitorResult:
    """Monitor agent/model performance across multiple trials.

    Measures:
    - Consistency: Behavioral reliability (semantic variance)
    - Performance: Output quality scored 0-1
    - Latency: Response time (mean, p95, p99)
    - Output Quality: Length, diversity, repetition
    - Robustness: Error rate, timeout handling

    Args:
        provider: Provider name (openai, anthropic, google, xai, huggingface)
        model: Model identifier (e.g., "gpt-4o", "claude-3-5-sonnet-20241022")
        consistency_trials: Number of consistency test trials (min 10)
        performance_trials: Number of performance test trials (min 5)
        temperature: Sampling temperature (0.0=deterministic, 1.0=creative)
        max_tokens: Maximum output tokens
        timeout: Request timeout in seconds
        consistency_prompt: Custom prompt for consistency testing
        performance_prompts: List of prompts for performance testing
        enabled_metrics: Metrics to compute
        embedding_model: Model for semantic similarity
        random_seed: Random seed for reproducibility
        api_key: API key (if not in environment)
        **kwargs: Provider-specific parameters

    Returns:
        AgentMonitorResult with:
            - consistency: ConsistencyMetric (score, mean_distance, std_distance)
            - performance: PerformanceMetric (mean, std, min, max)
            - latency: LatencyMetric (mean, p50, p95, p99)
            - output_quality: OutputQualityMetric (diversity, repetition, length)
            - robustness: RobustnessMetric (error_rate, timeout_rate)
            - metadata: dict (timestamp, duration, config)

    Raises:
        ValueError: Invalid provider, model, or configuration
        RuntimeError: API key missing or API errors

    Examples:
        # Monitor single model
        result = agent_monitor(
            provider="openai",
            model="gpt-4o",
            consistency_trials=20,
            temperature=0.0
        )

        # Quick consistency check
        result = agent_monitor(
            provider="anthropic",
            model="claude-3-5-sonnet-20241022",
            consistency_trials=10,
            enabled_metrics=["consistency"]
        )

        # Full monitoring suite
        result = agent_monitor(
            provider="google",
            model="gemini-2.0-flash-exp",
            consistency_trials=30,
            performance_trials=20,
            temperature=0.0,
            enabled_metrics=["consistency", "performance", "latency",
                           "output_quality", "robustness"]
        )
    """
```

### Multi-Agent Monitoring
For monitoring multiple agents, call multiple times:

```python
results = []
for config in agent_configs:
    result = agent_monitor(
        provider=config["provider"],
        model=config["model"],
        consistency_trials=20,
        temperature=0.0
    )
    results.append(result)

# Compare results
comparison = compare_agents(results)
```

### Implementation Notes
- Replaces: AssessmentConfig, CERTAgentEngine, entire agents module API
- One function call = one agent monitored
- Returns comprehensive result object
- Provider initialized internally from api_key (env or parameter)
- Async execution internally (synchronous API externally)
- Progress logging to INFO level

### Migration from Current API
```python
# OLD (confusing multi-step)
from cert.agents import AssessmentConfig, CERTAgentEngine
config = AssessmentConfig(consistency_trials=20, temperature=0.7, ...)
providers = {"openai": OpenAIProvider(api_key=...)}
engine = CERTAgentEngine(config, providers)
summary = await engine.run_full_assessment()

# NEW (simple, direct)
from cert import agent_monitor
result = agent_monitor(
    provider="openai",
    model="gpt-4o",
    consistency_trials=20,
    temperature=0.0
)
```

---

## 3. `cost_tracker()` Function

### Purpose
Track token usage and calculate costs for LLM API calls.

### Signature
```python
def cost_tracker(
    *,
    tokens_input: Optional[int] = None,
    tokens_output: Optional[int] = None,
    tokens_total: Optional[int] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    cost_per_input_token: Optional[float] = None,
    cost_per_output_token: Optional[float] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> CostResult:
    """Track token usage and calculate costs.

    Args:
        tokens_input: Number of input tokens
        tokens_output: Number of output tokens
        tokens_total: Total tokens (if input/output not separated)
        provider: Provider name (for automatic pricing lookup)
        model: Model name (for automatic pricing lookup)
        cost_per_input_token: Cost per input token (overrides auto-pricing)
        cost_per_output_token: Cost per output token (overrides auto-pricing)
        metadata: Additional metadata to store

    Returns:
        CostResult with:
            - tokens_input: int
            - tokens_output: int
            - tokens_total: int
            - cost_input: float (if pricing available)
            - cost_output: float (if pricing available)
            - cost_total: float (if pricing available)
            - provider: str
            - model: str
            - timestamp: str

    Raises:
        ValueError: If insufficient token information provided

    Examples:
        # Manual token counts
        result = cost_tracker(
            tokens_input=100,
            tokens_output=50,
            cost_per_input_token=0.00001,
            cost_per_output_token=0.00003
        )

        # Auto-pricing lookup
        result = cost_tracker(
            tokens_input=100,
            tokens_output=50,
            provider="openai",
            model="gpt-4o"
        )

        # From API response metadata
        result = cost_tracker(
            tokens_input=response.usage.prompt_tokens,
            tokens_output=response.usage.completion_tokens,
            provider="anthropic",
            model="claude-3-5-sonnet-20241022"
        )
    """
```

### Batch Tracking
For tracking multiple calls:

```python
tracker = CostTrackerAccumulator()

for call in calls:
    result = cost_tracker(
        tokens_input=call.tokens_in,
        tokens_output=call.tokens_out,
        provider="openai",
        model="gpt-4o"
    )
    tracker.add(result)

total = tracker.get_total()
print(f"Total cost: ${total.cost_total:.4f}")
print(f"Total tokens: {total.tokens_total}")
```

### Implementation Notes
- NEW function (doesn't exist currently)
- Maintains pricing database for major providers/models
- Updates via external JSON config file
- Returns cost=None if pricing not available
- Separate accumulator class for batch tracking

---

## Data Models

### MeasurementResult
```python
@dataclass
class MeasurementResult:
    """Result from measure() function."""
    matched: bool
    confidence: float
    semantic_score: Optional[float]
    nli_score: Optional[float]
    grounding_score: Optional[float]
    threshold_used: float
    rule: str
    components_used: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
```

### AgentMonitorResult
```python
@dataclass
class AgentMonitorResult:
    """Result from agent_monitor() function."""
    provider: str
    model: str

    # Metrics
    consistency: Optional[ConsistencyMetric]
    performance: Optional[PerformanceMetric]
    latency: Optional[LatencyMetric]
    output_quality: Optional[OutputQualityMetric]
    robustness: Optional[RobustnessMetric]

    # Metadata
    config: Dict[str, Any]
    duration_seconds: float
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""

    def to_dataframe(self) -> pd.DataFrame:
        """Convert to pandas DataFrame for analysis."""
```

### Metric Classes (from notebook)
```python
@dataclass
class ConsistencyMetric:
    """Consistency measurement results."""
    score: float  # 0-1, higher = more consistent
    mean_distance: float  # Average semantic distance
    std_distance: float  # Standard deviation
    num_trials: int
    responses: List[str]

@dataclass
class PerformanceMetric:
    """Performance measurement results."""
    mean_score: float  # 0-1 average quality
    std_score: float
    min_score: float
    max_score: float
    num_trials: int
    scores: List[float]

@dataclass
class LatencyMetric:
    """Latency measurement results."""
    mean_ms: float
    median_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float
    num_trials: int
    latencies: List[float]

@dataclass
class OutputQualityMetric:
    """Output quality analysis."""
    mean_length: float  # characters
    semantic_diversity: float  # 0-1
    repetition_score: float  # 0-1, lower = less repetition
    num_trials: int

@dataclass
class RobustnessMetric:
    """Error handling and reliability."""
    success_rate: float  # 0-1
    error_rate: float  # 0-1
    timeout_rate: float  # 0-1
    num_trials: int
    errors: List[str]
```

### CostResult
```python
@dataclass
class CostResult:
    """Result from cost_tracker() function."""
    tokens_input: int
    tokens_output: int
    tokens_total: int
    cost_input: Optional[float]
    cost_output: Optional[float]
    cost_total: Optional[float]
    provider: Optional[str]
    model: Optional[str]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
```

---

## File Structure (New)

```
cert-framework/
├── cert/
│   ├── __init__.py                 # Exports: measure, agent_monitor, cost_tracker
│   │
│   ├── measure.py                  # measure() implementation
│   ├── agent_monitor.py            # agent_monitor() implementation
│   ├── cost_tracker.py             # cost_tracker() implementation
│   │
│   ├── core/                       # Core utilities (shared)
│   │   ├── __init__.py
│   │   ├── types.py                # All result dataclasses
│   │   ├── embeddings.py           # Embedding utilities
│   │   ├── nli.py                  # NLI utilities
│   │   ├── grounding.py            # Grounding analysis
│   │   ├── providers.py            # LLM provider interfaces
│   │   └── pricing.py              # Cost/pricing database
│   │
│   ├── metrics/                    # Metric calculators
│   │   ├── __init__.py
│   │   ├── consistency.py
│   │   ├── performance.py
│   │   ├── latency.py
│   │   ├── output_quality.py
│   │   └── robustness.py
│   │
│   └── utils/                      # Utilities
│       ├── __init__.py
│       ├── logging.py
│       ├── validation.py
│       └── export.py               # CSV, JSON export utilities
│
├── tests/
│   ├── test_measure.py
│   ├── test_agent_monitor.py
│   ├── test_cost_tracker.py
│   ├── test_integration.py
│   └── test_metrics/
│       ├── test_consistency.py
│       ├── test_performance.py
│       └── ...
│
├── examples/
│   ├── measure_examples.py
│   ├── agent_monitor_examples.py
│   ├── cost_tracker_examples.py
│   └── full_workflow.py
│
├── docs/
│   ├── API.md                      # Complete API reference
│   ├── MIGRATION.md                # v1 → v2 migration guide
│   ├── TEMPERATURE_GUIDE.md        # Temperature configuration
│   ├── METRICS_GUIDE.md            # Metrics explanation
│   └── EXAMPLES.md                 # Use case examples
│
├── README.md                       # New simplified README
├── pyproject.toml
├── requirements.txt
└── CHANGELOG.md                    # v2.0.0 breaking changes
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Create new file structure
2. Implement core types (MeasurementResult, AgentMonitorResult, etc.)
3. Refactor providers into `core/providers.py`
4. Implement `core/pricing.py` with pricing database
5. Set up new testing structure

### Phase 2: `measure()` Function (Week 1-2)
1. Consolidate embedding, NLI, grounding into `core/`
2. Implement `measure.py` with new signature
3. Add parameter validation
4. Write comprehensive tests
5. Add examples

### Phase 3: `cost_tracker()` Function (Week 2)
1. Implement `cost_tracker.py`
2. Create pricing database (JSON)
3. Implement `CostTrackerAccumulator`
4. Write tests
5. Add examples

### Phase 4: `agent_monitor()` Function (Week 2-3)
1. Port notebook logic to `metrics/` modules
2. Implement `agent_monitor.py`
3. Integrate all metrics
4. Add async handling
5. Write comprehensive tests
6. Add examples

### Phase 5: Documentation (Week 3)
1. Write new README
2. Create API.md reference
3. Write MIGRATION.md guide
4. Create METRICS_GUIDE.md
5. Add inline examples to docstrings

### Phase 6: Examples & Validation (Week 3-4)
1. Port all README examples to new API
2. Create Jupyter notebook examples
3. Validate against notebook use cases
4. Performance testing
5. User acceptance testing

### Phase 7: Release (Week 4)
1. Update CHANGELOG.md
2. Bump version to 2.0.0
3. Create release branch
4. Tag release
5. Deploy to PyPI

---

## Breaking Changes (v2.0.0)

### Removed Entirely
- ❌ `from cert import compare` → use `measure()`
- ❌ `from cert import configure` → params in function calls
- ❌ `from cert.agents import AssessmentConfig` → params in `agent_monitor()`
- ❌ `from cert.agents import CERTAgentEngine` → use `agent_monitor()`
- ❌ `from cert.rag import *` → use `measure()` with NLI
- ❌ `from cert.single_model import *` → use `measure()` or `agent_monitor()`

### Renamed
- ✅ `compare()` → `measure()`
- ✅ `ComparisonResult` → `MeasurementResult`
- ✅ `CERTAgentEngine` → `agent_monitor()`

### New Additions
- ✨ `cost_tracker()` - NEW function
- ✨ `CostResult` - NEW type
- ✨ `AgentMonitorResult` - NEW type
- ✨ Comprehensive metric dataclasses

---

## Testing Strategy

### Unit Tests
- Test each function independently
- Mock LLM API calls
- Test all parameter combinations
- Test error conditions
- Test edge cases (empty strings, very long texts, etc.)

### Integration Tests
- Test full workflows end-to-end
- Test with real API calls (marked slow, optional)
- Test multi-agent scenarios
- Test cost tracking across calls

### Performance Tests
- Benchmark embedding speed
- Benchmark NLI speed
- Test with 1000+ trial scenarios
- Memory usage profiling

### Validation Tests
- Reproduce notebook results
- Validate against known ground truth
- Cross-validate metrics

---

## Engineering Best Practices Applied

### 1. Code Organization
- ✅ Single Responsibility Principle (one function per use case)
- ✅ DRY (Don't Repeat Yourself) - shared utilities in `core/`
- ✅ Separation of Concerns (measure, monitor, track are independent)

### 2. API Design
- ✅ Explicit over implicit (no hidden state)
- ✅ Consistent naming conventions
- ✅ Keyword-only arguments for clarity
- ✅ Sensible defaults
- ✅ Comprehensive type hints

### 3. Documentation
- ✅ Docstrings on every public function/class
- ✅ Usage examples in docstrings
- ✅ Comprehensive guides (API, Migration, Metrics)
- ✅ README with clear quick start

### 4. Testing
- ✅ >90% code coverage target
- ✅ Unit + Integration + Performance tests
- ✅ CI/CD with automated testing
- ✅ Pre-commit hooks (ruff, mypy, pytest)

### 5. Versioning & Release
- ✅ Semantic versioning (2.0.0 = breaking changes)
- ✅ CHANGELOG.md
- ✅ Clear migration guide
- ✅ Deprecation strategy (clean break, no aliases)

### 6. Error Handling
- ✅ Descriptive error messages
- ✅ Clear ValueError for invalid params
- ✅ RuntimeError for API failures
- ✅ Logging at appropriate levels

### 7. Performance
- ✅ Lazy loading of heavy models
- ✅ Caching where appropriate
- ✅ Async execution internally
- ✅ Progress logging for long operations

---

## Success Criteria

### Must Have
- [ ] All 3 functions implemented and tested
- [ ] >90% test coverage
- [ ] All notebook use cases work with new API
- [ ] Complete documentation (API, Migration, Guides)
- [ ] Examples for each function
- [ ] CI/CD passing (tests, linting, type checking)

### Should Have
- [ ] Performance benchmarks documented
- [ ] Pricing database for major providers
- [ ] Jupyter notebook examples
- [ ] Video walkthrough/tutorial

### Nice to Have
- [ ] Web dashboard integration
- [ ] Automated pricing updates
- [ ] Comparison utilities for multi-agent results
- [ ] Export to various formats (CSV, JSON, Parquet)

---

## Timeline

- **Week 1:** Core infrastructure + measure()
- **Week 2:** cost_tracker() + start agent_monitor()
- **Week 3:** Complete agent_monitor() + documentation
- **Week 4:** Examples, validation, release

**Total: 4 weeks to v2.0.0 release**

---

## Migration Guide Outline

```markdown
# Migrating from v1.x to v2.0.0

## Breaking Changes

### RAG / Text Comparison
Before:
```python
from cert import compare, configure
configure(use_nli=True, energy_threshold=0.3)
result = compare(answer, context)
```

After:
```python
from cert import measure
result = measure(
    answer, context,
    use_nli=True,
    nli_weight=0.5,
    threshold=0.7
)
```

### Agent Monitoring
Before:
```python
from cert.agents import AssessmentConfig, CERTAgentEngine
config = AssessmentConfig(...)
providers = {"openai": OpenAIProvider(...)}
engine = CERTAgentEngine(config, providers)
summary = await engine.run_full_assessment()
```

After:
```python
from cert import agent_monitor
result = agent_monitor(
    provider="openai",
    model="gpt-4o",
    consistency_trials=20,
    temperature=0.0
)
```

## New Features

### Cost Tracking
```python
from cert import cost_tracker
result = cost_tracker(
    tokens_input=100,
    tokens_output=50,
    provider="openai",
    model="gpt-4o"
)
print(f"Cost: ${result.cost_total:.4f}")
```
```

---

## Next Steps

**Ready to proceed?** I need your approval on:

1. ✅ Three-function API design (measure, agent_monitor, cost_tracker)
2. ✅ Clean break from v1 (no backward compatibility)
3. ✅ File structure and organization
4. ✅ Implementation timeline (4 weeks)
5. ✅ Python (not TypeScript)

**Questions before starting:**
1. Do you want me to start implementation immediately?
2. Any changes to the proposed function signatures?
3. Should I preserve any v1 functionality I haven't mentioned?

**Reply "APPROVED - START IMPLEMENTATION" to begin Phase 1.**
