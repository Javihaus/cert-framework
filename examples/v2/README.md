# CERT Framework v2.0 Examples

This directory contains comprehensive examples demonstrating the v2.0 API.

## Quick Start

Install CERT Framework:

```bash
pip install cert-framework
```

Set up API keys (for agent_monitor examples):

```bash
export OPENAI_API_KEY=your_key_here
export ANTHROPIC_API_KEY=your_key_here
export GOOGLE_API_KEY=your_key_here
```

## Three Core Functions

CERT v2.0 provides three core functions for AI system testing:

### 1. measure() - Text Reliability Measurement

Combines semantic similarity, NLI (contradiction detection), and grounding analysis.

```python
import cert

result = cert.measure(
    "Apple reported revenue of $117B in Q1 2024",
    "Apple's Q1 2024 revenue was $150B",  # Hallucinated number
    use_semantic=True, semantic_weight=0.3,
    use_nli=True, nli_weight=0.5,
    use_grounding=True, grounding_weight=0.2,
    threshold=0.7
)

print(f"Matched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
```

**Use Cases:**
- RAG hallucination detection
- Answer verification
- Semantic similarity measurement
- Text comparison and matching

**See:** `example_measure.py`

### 2. cost_tracker() - Token & Cost Tracking

Tracks token usage and calculates costs for LLM API calls.

```python
import cert

cost = cert.cost_tracker(
    tokens_input=1000,
    tokens_output=500,
    provider="openai",
    model="gpt-4o"
)

print(f"Total Cost: ${cost.cost_total:.6f}")
```

**Use Cases:**
- API cost tracking
- Budget monitoring
- Multi-provider cost comparison
- Session-level cost accumulation

**See:** `example_cost_tracker.py`

### 3. agent_monitor() - Comprehensive LLM Monitoring

Measures behavioral reliability, output quality, response time, and robustness.

```python
import cert

result = cert.agent_monitor(
    provider="openai",
    model="gpt-4o",
    consistency_trials=20,
    performance_trials=15,
    temperature=0.0
)

print(f"Consistency: {result.consistency.score:.3f}")
print(f"Performance: {result.performance.mean_score:.3f}")
print(f"Latency: {result.latency.mean_ms:.1f}ms")
```

**Use Cases:**
- Model benchmarking
- Reliability testing
- Performance monitoring
- Multi-model comparison

**See:** `example_agent_monitor.py`

## Running the Examples

Each example is self-contained and can be run independently:

```bash
# Text measurement examples
python example_measure.py

# Cost tracking examples
python example_cost_tracker.py

# Agent monitoring examples (requires API keys)
python example_agent_monitor.py
```

## Example Overview

### example_measure.py

Demonstrates all capabilities of the `measure()` function:

1. **Basic Semantic Comparison** - Simple text similarity
2. **RAG Hallucination Detection** - Full semantic + NLI + grounding
3. **Custom Weights** - Prioritizing different components
4. **Semantic-Only Mode** - Fast comparison without ML models
5. **Custom Embedding Models** - Using different sentence transformers

**Key Features:**
- Configurable component weights
- Multiple analysis modes
- Structured result output
- No hidden configuration

### example_cost_tracker.py

Demonstrates token and cost tracking capabilities:

1. **Auto-Pricing** - Automatic cost lookup from database
2. **Manual Override** - Custom pricing for proprietary models
3. **Batch Tracking** - Aggregating multiple API calls
4. **Metadata Support** - Detailed tracking with custom metadata
5. **Cost Comparison** - Comparing costs across providers
6. **Session Accumulator** - Running total for sessions

**Key Features:**
- Auto-pricing for all major providers
- Manual override support
- Batch aggregation
- Session-level tracking

### example_agent_monitor.py

Demonstrates comprehensive LLM monitoring:

1. **Quick Consistency Check** - Fast reliability assessment
2. **Full Monitoring Suite** - All 5 metrics
3. **Custom Prompts** - Domain-specific testing
4. **Multi-Model Comparison** - Benchmarking multiple models
5. **DataFrame Export** - Results to pandas DataFrame
6. **Temperature Impact** - Understanding temperature effects

**Key Features:**
- 5 comprehensive metrics
- Configurable trials and prompts
- Multi-model comparison
- Export to DataFrame
- Reproducible benchmarking

## API Design Philosophy

CERT v2.0 follows these principles:

1. **Explicit over Implicit** - All parameters visible in function calls
2. **No Hidden State** - No global configuration or hidden settings
3. **Composable** - Functions work independently or together
4. **Type-Safe** - Structured results with dataclasses
5. **Simple** - Three functions cover all use cases

## Migration from v1.x

If you're using the old API, here's the migration guide:

### Old API (v1.x - Deprecated)

```python
import cert

# Old way - hidden configuration
cert.configure(threshold=0.7, use_semantic=True)
result = cert.compare(text1, text2)

# Old way - separate RAG functions
from cert.rag import SemanticComparator
comparator = SemanticComparator()
result = comparator.compare(context, answer)
```

### New API (v2.0 - Recommended)

```python
import cert

# New way - explicit parameters
result = cert.measure(
    text1, text2,
    use_semantic=True,
    threshold=0.7
)

# New way - unified measure() for RAG
result = cert.measure(
    context, answer,
    use_semantic=True, semantic_weight=0.3,
    use_nli=True, nli_weight=0.5,
    use_grounding=True, grounding_weight=0.2
)
```

**Benefits:**
- No hidden state
- All parameters explicit
- One function for all text comparison
- Type-safe results
- Better composability

## Additional Resources

- **Main Documentation**: See project README.md
- **API Reference**: See RESTRUCTURING_PLAN.md
- **Temperature Guide**: See docs/TEMPERATURE_GUIDE.md
- **GitHub**: https://github.com/Javihaus/cert-framework

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review example code

## Version

These examples are for CERT Framework v2.0.0-beta.
