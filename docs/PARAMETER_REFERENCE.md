# CERT Framework Parameter Reference

**Complete reference for all configurable parameters**

Version: 3.0.0
Last Updated: 2025-10-26

---

## Table of Contents

- [measure() Function](#measure-function)
- [@monitor Decorator](#monitor-decorator)
- [Industry Presets](#industry-presets)
- [Parameter Validation](#parameter-validation)
- [Troubleshooting](#troubleshooting)

---

## `measure()` Function

### Overview

The `measure()` function performs direct text comparison using composite accuracy measurement.

```python
from cert import measure

result = measure(text1, text2, **kwargs)
```

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `text1` | str | First text for comparison (typically LLM output or answer) | `"Revenue was $500M"` |
| `text2` | str | Second text for comparison (typically context or ground truth) | `"Q4 revenue reached $500M"` |

### Component Selection Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `use_semantic` | bool | `True` | Enable semantic similarity analysis using sentence embeddings |
| `use_nli` | bool | `True` | Enable Natural Language Inference for contradiction detection |
| `use_grounding` | bool | `True` | Enable term-level grounding verification |

**Validation Rules**:
- At least one component must be enabled
- If all are `False`, raises `ValueError`

**Use Cases**:
- **All enabled** (default): Maximum accuracy, highest latency (~500-1000ms)
- **Semantic only**: Fast mode for paraphrase detection (~100ms)
- **NLI only**: Contradiction-focused for hallucination detection (~300ms)
- **Grounding only**: Lightweight term verification (~50ms)

### Component Weight Parameters

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `semantic_weight` | float | `0.3` | 0.0-1.0 | Weight contribution of semantic similarity to final confidence |
| `nli_weight` | float | `0.5` | 0.0-1.0 | Weight contribution of NLI analysis to final confidence |
| `grounding_weight` | float | `0.2` | 0.0-1.0 | Weight contribution of grounding analysis to final confidence |

**Validation Rules**:
- Weights are automatically normalized to sum to 1.0
- Only weights for enabled components are used
- Sum of enabled component weights must be > 0

**How Weights Work**:

```python
# Input weights
semantic_weight = 0.3
nli_weight = 0.5
grounding_weight = 0.2

# Automatic normalization (sum = 1.0)
total = 0.3 + 0.5 + 0.2 = 1.0  # Already normalized

# If one component disabled:
use_grounding = False
total = 0.3 + 0.5 = 0.8
normalized_semantic = 0.3 / 0.8 = 0.375  # 37.5%
normalized_nli = 0.5 / 0.8 = 0.625       # 62.5%

# Final confidence calculation
confidence = (0.375 × semantic_score) + (0.625 × nli_score)
```

**Weight Tuning Guidelines**:

| Use Case | Recommended Weights | Rationale |
|----------|-------------------|-----------|
| General hallucination detection | semantic=0.3, nli=0.5, grounding=0.2 | Balanced, emphasizes contradiction detection |
| Fast paraphrase detection | semantic=1.0 | Fastest, good for semantic equivalence |
| Strict fact verification | semantic=0.2, nli=0.7, grounding=0.1 | Maximum contradiction sensitivity |
| Entity/number checking | semantic=0.1, nli=0.4, grounding=0.5 | Emphasizes term-level verification |

### Threshold Parameter

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `threshold` | float | `0.7` | 0.0-1.0 | Minimum confidence score required for `matched=True` |

**Threshold Selection Guide**:

| Threshold | Strictness | Use Case | False Positive Rate | False Negative Rate |
|-----------|-----------|----------|-------------------|-------------------|
| 0.5 | Very lenient | Exploratory analysis | Low | High |
| 0.7 | Balanced | General production use | Medium | Medium |
| 0.8 | Strict | High-stakes applications | High | Low |
| 0.9 | Very strict | Healthcare/financial | Very High | Very Low |
| 0.95 | Extremely strict | Safety-critical systems | Extremely High | Extremely Low |

**Example**:

```python
# Lenient: Accept if 50%+ confident
result = measure(text1, text2, threshold=0.5)

# Strict: Require 90%+ confidence
result = measure(text1, text2, threshold=0.9)

# Check result
if result.matched:
    print(f"Texts match with {result.confidence:.1%} confidence")
else:
    print(f"No match ({result.confidence:.1%} < {result.threshold_used})")
```

### Model Selection Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `embedding_model` | str | `"all-MiniLM-L6-v2"` | Sentence transformer model name for semantic embeddings |
| `nli_model` | str | `"microsoft/deberta-v3-base"` | Transformer model for NLI contradiction detection |

**Available Embedding Models** (sentence-transformers):

| Model | Dimensions | Performance | Speed | Size |
|-------|-----------|-------------|-------|------|
| `all-MiniLM-L6-v2` | 384 | Good | Fast | ~90MB |
| `all-MiniLM-L12-v2` | 384 | Better | Medium | ~120MB |
| `all-mpnet-base-v2` | 768 | Best | Slow | ~420MB |
| `paraphrase-multilingual-MiniLM-L12-v2` | 384 | Good (multilingual) | Medium | ~470MB |

**Available NLI Models** (HuggingFace):

| Model | Performance | Speed | Size |
|-------|-------------|-------|------|
| `microsoft/deberta-v3-base` | Best | Medium | ~540MB |
| `facebook/bart-large-mnli` | Very Good | Slow | ~1.6GB |
| `cross-encoder/nli-deberta-v3-base` | Excellent | Slow | ~540MB |

**Example**:

```python
# High-performance configuration (slower)
result = measure(
    text1, text2,
    embedding_model="all-mpnet-base-v2",
    nli_model="facebook/bart-large-mnli"
)

# Fast configuration (lower accuracy)
result = measure(
    text1, text2,
    embedding_model="all-MiniLM-L6-v2",
    nli_model="microsoft/deberta-v3-base"
)

# Multilingual configuration
result = measure(
    text1, text2,
    embedding_model="paraphrase-multilingual-MiniLM-L12-v2"
)
```

### Return Value: MeasurementResult

```python
@dataclass
class MeasurementResult:
    matched: bool                      # True if confidence >= threshold
    confidence: float                  # Overall confidence score (0.0-1.0)
    semantic_score: Optional[float]    # Semantic similarity score (if enabled)
    nli_score: Optional[float]         # NLI entailment score (if enabled)
    grounding_score: Optional[float]   # Grounding verification score (if enabled)
    threshold_used: float              # Threshold that was applied
    rule: str                          # Human-readable decision description
    components_used: List[str]         # List of enabled components
    metadata: Dict[str, Any]           # Additional metadata (models used, weights)
```

**Example Usage**:

```python
result = measure(text1, text2)

# Check overall match
if result.matched:
    print("✓ Texts match")

# Inspect individual scores
print(f"Semantic: {result.semantic_score:.3f}")
print(f"NLI: {result.nli_score:.3f}")
print(f"Grounding: {result.grounding_score:.3f}")

# Get explanation
print(result.rule)
# Output: "Match (confidence 0.85 >= threshold 0.70); strongest: nli(0.92), weakest: grounding(0.74)"

# Access metadata
print(f"Models: {result.metadata['embedding_model']}, {result.metadata['nli_model']}")
print(f"Weights: {result.metadata['weights']}")
```

---

## `@monitor` Decorator

### Overview

The `@monitor` decorator wraps functions to provide automatic accuracy monitoring, hallucination detection, and audit logging.

```python
from cert import monitor

@monitor(**kwargs)
def my_function(query):
    return llm_pipeline(query)
```

### Core Parameters

| Parameter | Type | Default | Range/Options | Description |
|-----------|------|---------|---------------|-------------|
| `preset` | str | `None` | "healthcare", "financial", "legal", "general" | Industry-specific preset configuration |
| `accuracy_threshold` | float | `0.90` | 0.0-1.0 | Minimum accuracy score for individual requests to be compliant |
| `hallucination_tolerance` | float | `0.05` | 0.0-1.0 | Maximum acceptable hallucination **rate** across all requests |
| `audit_log` | str | `"cert_audit.jsonl"` | Any valid file path | Path to JSONL audit log file |
| `alert_on_hallucination` | bool | `False` | True/False | Print console alerts when hallucinations detected |
| `explain` | bool | `False` | True/False | Show detailed monitoring explanations on startup |

### Understanding `accuracy_threshold` vs `hallucination_tolerance`

**This is the most commonly misunderstood aspect of CERT Framework.**

#### `accuracy_threshold` (Per-Request)

- **Level**: Individual request
- **Measured as**: Composite confidence score from `measure()`
- **Range**: 0.0 to 1.0 (higher = stricter)
- **Applied when**: Each request is processed
- **Determines**: Whether this specific request is compliant

**Example**:
```python
@monitor(accuracy_threshold=0.95)
def my_rag(query):
    return pipeline(query)

# Request 1: confidence = 0.96 → ✓ COMPLIANT (0.96 >= 0.95)
# Request 2: confidence = 0.94 → ✗ HALLUCINATION (0.94 < 0.95)
# Request 3: confidence = 0.97 → ✓ COMPLIANT (0.97 >= 0.95)
```

#### `hallucination_tolerance` (Aggregate Rate)

- **Level**: Overall system performance
- **Measured as**: Percentage of requests flagged as hallucinations
- **Range**: 0.0 to 1.0 (lower = stricter)
- **Applied when**: Periodic status updates (every 100 requests)
- **Determines**: Whether the system as a whole is compliant

**Example**:
```python
@monitor(hallucination_tolerance=0.02)  # Allow 2% hallucination rate
def my_rag(query):
    return pipeline(query)

# After 100 requests:
# - 3 flagged as hallucinations
# - Hallucination rate: 3% (3/100)
# - System status: ✗ NON-COMPLIANT (3% > 2% tolerance)

# After 200 requests:
# - 3 flagged as hallucinations
# - Hallucination rate: 1.5% (3/200)
# - System status: ✓ COMPLIANT (1.5% <= 2% tolerance)
```

#### Combined Example

```python
@monitor(
    accuracy_threshold=0.90,       # Each request needs 90%+ accuracy
    hallucination_tolerance=0.05   # Overall system can have 5% failure rate
)
def financial_rag(query):
    return pipeline(query)

# Processing 100 requests:
#
# Request 1:  0.92 → ✓ (above 0.90)
# Request 2:  0.88 → ✗ HALLUCINATION (below 0.90)
# Request 3:  0.95 → ✓
# Request 4:  0.87 → ✗ HALLUCINATION
# ...
# Request 100: 0.93 → ✓
#
# Final Stats:
# ├─ Hallucinations: 4 out of 100 (4%)
# ├─ Hallucination rate: 4% <= 5% tolerance
# └─ Status: ✓ COMPLIANT
```

### Preset Parameter

When `preset` is specified, it overrides `accuracy_threshold`, `hallucination_tolerance`, and `audit_retention_months`:

```python
@monitor(preset="healthcare")
def my_rag(query):
    return pipeline(query)

# Equivalent to:
@monitor(
    accuracy_threshold=0.95,
    hallucination_tolerance=0.02,
    audit_retention_months=120  # 10 years
)
def my_rag(query):
    return pipeline(query)
```

**Available Presets**:

| Preset | accuracy_threshold | hallucination_tolerance | Retention | Use Case |
|--------|-------------------|------------------------|-----------|----------|
| `"healthcare"` | 0.95 | 0.02 | 10 years | Medical/clinical applications |
| `"financial"` | 0.90 | 0.05 | 7 years | Banking, trading, credit |
| `"legal"` | 0.92 | 0.03 | 7 years | Legal analysis, contracts |
| `"general"` | 0.80 | 0.10 | 6 months | Non-high-risk applications |

**Overriding Preset Values**:

```python
# Start with financial preset, but make it stricter
@monitor(
    preset="financial",              # 90% accuracy, 5% tolerance
    accuracy_threshold=0.95,         # Override to 95% accuracy
    alert_on_hallucination=True      # Add alerting
)
def strict_financial_rag(query):
    return pipeline(query)
```

### Audit Log Parameter

The `audit_log` parameter specifies where to write the JSONL audit trail:

```python
@monitor(audit_log="production_audit.jsonl")
def my_rag(query):
    return pipeline(query)
```

**Audit Log Format** (JSONL):

```json
{"type": "request", "timestamp": "2025-01-31T14:23:00.123Z", "function_name": "my_rag", "context": "...", "answer": "...", "accuracy_score": 0.94, "hallucination_detected": false, "is_compliant": true, "metrics": {"semantic_score": 0.93, "nli_score": 0.95, "grounding_score": 0.96}, "duration_ms": 342}
{"type": "request", "timestamp": "2025-01-31T14:23:01.456Z", "function_name": "my_rag", "context": "...", "answer": "...", "accuracy_score": 0.87, "hallucination_detected": true, "is_compliant": false, "metrics": {"semantic_score": 0.89, "nli_score": 0.82, "grounding_score": 0.91}, "duration_ms": 298}
```

### Alert Parameter

When `alert_on_hallucination=True`, prints console warnings when hallucinations are detected:

```python
@monitor(alert_on_hallucination=True)
def my_rag(query):
    return pipeline(query)

# When hallucination detected:
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# ⚠️  HALLUCINATION DETECTED
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# Function: my_rag
# Accuracy score: 87.2%
# NLI score: 0.821 (OK)
# Grounding score: 91.3%
# Ungrounded terms: 2
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

### Explain Parameter

When `explain=True`, prints detailed information at startup:

```python
@monitor(explain=True)
def my_rag(query):
    return pipeline(query)

# Startup output:
# ============================================================
# ✓ CERT Framework Monitoring Enabled
# ============================================================
# Function: my_rag
# Accuracy threshold: 90%
# Hallucination tolerance: 5%
# Audit log: cert_audit.jsonl
# EU AI Act Article 15: Ready for compliance
# ============================================================
#
# 📖 What CERT monitors:
#   • Semantic accuracy - Does answer match context meaning?
#   • NLI contradiction - Does answer contradict context?
#   • Grounding - Is answer grounded in provided context?
#   • Hallucination rate - How often does model hallucinate?
#
# 📋 EU AI Act Article 15 Compliance:
#   • Article 15.1 - Appropriate levels of accuracy
#   • Article 15.4 - Resilience regarding errors
#   • Article 19 - Automatic logging for audit trail
```

---

## Industry Presets

### Preset Details

#### Healthcare Preset

```python
{
    "accuracy_threshold": 0.95,
    "hallucination_tolerance": 0.02,
    "audit_retention_months": 120,  # 10 years
    "description": "Healthcare and medical applications (FDA, HIPAA compliance)",
    "regulatory_basis": "HIPAA § 164.530(j)(2), FDA 21 CFR Part 11"
}
```

**Use Cases**: Medical diagnosis support, clinical decision support, patient record analysis, drug interaction checking

**Rationale**:
- 95% accuracy based on FDA guidance for medical device software (<5% error rate)
- 2% tolerance for extremely low hallucination acceptance in life-critical applications
- 10-year retention for HIPAA compliance

#### Financial Preset

```python
{
    "accuracy_threshold": 0.90,
    "hallucination_tolerance": 0.05,
    "audit_retention_months": 84,  # 7 years
    "description": "Financial services and banking applications (SEC, SOX compliance)",
    "regulatory_basis": "SEC Rule 17a-4, SOX Section 802"
}
```

**Use Cases**: Credit risk assessment, trading algorithms, financial advice, fraud detection, regulatory reporting

**Rationale**:
- 90% accuracy aligned with FINRA expectations for automated systems
- 5% tolerance balances accuracy with operational practicality
- 7-year retention per SEC Rule 17a-4

#### Legal Preset

```python
{
    "accuracy_threshold": 0.92,
    "hallucination_tolerance": 0.03,
    "audit_retention_months": 84,  # 7 years
    "description": "Legal applications (ABA ethics compliance)",
    "regulatory_basis": "State bar ethics rules, ABA Model Rules 1.1 & 1.6"
}
```

**Use Cases**: Contract analysis, legal research, case law summarization, compliance checking, e-discovery

**Rationale**:
- 92% accuracy based on ABA Model Rule 1.1 (competence) expectations
- 3% tolerance for high-stakes legal applications
- 7-year retention for legal record-keeping standards

#### General Preset

```python
{
    "accuracy_threshold": 0.80,
    "hallucination_tolerance": 0.10,
    "audit_retention_months": 6,  # 6 months
    "description": "General purpose applications (EU AI Act minimum requirements)",
    "regulatory_basis": "EU AI Act Article 19 minimum requirements"
}
```

**Use Cases**: Customer service chatbots, content generation, general Q&A, non-high-risk applications

**Rationale**:
- 80% accuracy as baseline "appropriate level" for EU AI Act Article 15
- 10% tolerance for non-critical applications
- 6-month minimum retention per EU AI Act Article 19

---

## Parameter Validation

### Common Validation Errors

#### measure() Validation Errors

```python
# ERROR: Empty strings
measure("", "text")
# ValueError: Both text1 and text2 must be non-empty strings

# ERROR: No components enabled
measure(text1, text2, use_semantic=False, use_nli=False, use_grounding=False)
# ValueError: At least one component (semantic, nli, grounding) must be enabled

# ERROR: Invalid threshold
measure(text1, text2, threshold=1.5)
# No error, but threshold > 1.0 means nothing will ever match

# ERROR: Zero weights
measure(text1, text2, semantic_weight=0.0, nli_weight=0.0, grounding_weight=0.0)
# ValueError: Sum of enabled component weights must be > 0
```

#### @monitor Validation Errors

```python
# ERROR: Invalid preset
@monitor(preset="unknown")
# KeyError: 'unknown' not in PRESETS

# ERROR: Out of range thresholds
@monitor(accuracy_threshold=1.5)
# No error raised, but effectively impossible to satisfy

# ERROR: Invalid file path
@monitor(audit_log="/invalid/path/audit.jsonl")
# OSError when attempting to write (parent directory must exist)
```

### Parameter Constraints

| Parameter | Constraint | Validation |
|-----------|-----------|-----------|
| `text1`, `text2` | Non-empty strings | Raises `ValueError` if empty |
| `use_semantic`, `use_nli`, `use_grounding` | At least one True | Raises `ValueError` if all False |
| `semantic_weight`, `nli_weight`, `grounding_weight` | Sum > 0 for enabled components | Raises `ValueError` if sum = 0 |
| `threshold` | 0.0-1.0 (recommended) | No validation, but >1.0 unusable |
| `accuracy_threshold` | 0.0-1.0 (recommended) | No validation, but >1.0 unusable |
| `hallucination_tolerance` | 0.0-1.0 (recommended) | No validation, but >1.0 invalid |
| `embedding_model` | Valid sentence-transformers model | Downloads if not cached |
| `nli_model` | Valid HuggingFace model | Downloads if not cached |
| `preset` | One of: "healthcare", "financial", "legal", "general" | Raises `KeyError` if invalid |
| `audit_log` | Valid writable file path | Raises `OSError` if path invalid |

---

## Troubleshooting

### Performance Issues

**Problem**: `measure()` is slow (>1s per call)

**Solutions**:
1. Disable unused components:
   ```python
   result = measure(text1, text2, use_semantic=True, use_nli=False, use_grounding=False)
   ```
2. Use faster models:
   ```python
   result = measure(text1, text2, embedding_model="all-MiniLM-L6-v2")
   ```
3. Batch processing (not yet supported - future feature)

### False Positives (Hallucinations Detected When Shouldn't Be)

**Problem**: Too many false hallucination detections

**Solutions**:
1. Lower accuracy_threshold:
   ```python
   @monitor(accuracy_threshold=0.85)  # From default 0.90
   ```
2. Adjust weights to favor semantic similarity:
   ```python
   result = measure(text1, text2, semantic_weight=0.5, nli_weight=0.3, grounding_weight=0.2)
   ```
3. Lower threshold:
   ```python
   result = measure(text1, text2, threshold=0.6)  # From default 0.7
   ```

### False Negatives (Hallucinations Missed)

**Problem**: Hallucinations not being detected

**Solutions**:
1. Raise accuracy_threshold:
   ```python
   @monitor(accuracy_threshold=0.95)  # From default 0.90
   ```
2. Emphasize NLI (contradiction detection):
   ```python
   result = measure(text1, text2, semantic_weight=0.2, nli_weight=0.7, grounding_weight=0.1)
   ```
3. Raise threshold:
   ```python
   result = measure(text1, text2, threshold=0.8)  # From default 0.7
   ```

### Model Download Issues

**Problem**: Models not downloading or failing to load

**Solutions**:
1. Check internet connection
2. Manually download models:
   ```python
   from sentence_transformers import SentenceTransformer
   model = SentenceTransformer("all-MiniLM-L6-v2")
   ```
3. Check disk space (models need ~2GB)
4. Set cache directory:
   ```bash
   export TRANSFORMERS_CACHE=/path/to/cache
   export SENTENCE_TRANSFORMERS_HOME=/path/to/cache
   ```

### Audit Log Issues

**Problem**: Audit log not being written

**Solutions**:
1. Check parent directory exists:
   ```bash
   mkdir -p logs/
   ```
   ```python
   @monitor(audit_log="logs/audit.jsonl")
   ```
2. Check write permissions:
   ```bash
   chmod +w logs/
   ```
3. Check disk space

### Memory Issues

**Problem**: Out of memory errors

**Solutions**:
1. Use smaller models:
   ```python
   result = measure(text1, text2, embedding_model="all-MiniLM-L6-v2")  # 90MB vs 420MB
   ```
2. Process shorter texts
3. Increase system memory (models need ~2GB RAM)

---

## See Also

- [EU AI Act Mapping](EU_AI_ACT_MAPPING.md) - How CERT maps to EU AI Act requirements
- [Preset Validation Methodology](PRESET_VALIDATION_METHODOLOGY.md) - How preset thresholds were derived
- [Documentation Improvement Plan](DOCUMENTATION_IMPROVEMENT_PLAN.md) - Roadmap for future improvements

---

**Questions or Issues?**

- GitHub Issues: https://github.com/Javihaus/cert-framework/issues
- Email: info@cert-framework.com

**Last Updated**: 2025-10-26
**Version**: 3.0.0
