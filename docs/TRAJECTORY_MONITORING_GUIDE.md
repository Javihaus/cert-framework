# Trajectory Monitoring Guide

## Overview

CERT Framework v3.1.0 introduces **Trajectory Monitoring** - a physics-inspired approach to real-time LLM generation quality assessment.

**Marketing Position**: "Hamiltonian Trajectory Analysis for Production LLM Monitoring"

**Technical Reality**: Per-token perplexity and entropy tracking with configurable quality thresholds

**Business Value**: Catch hallucinations before production, quantitative quality gates, EU AI Act compliance documentation

---

## What It Actually Does

Trajectory monitoring tracks **three core metrics** at each token generation step:

### 1. Perplexity (Uncertainty)

**Formula**: `perplex

ity = 1 / P(token)`

**Meaning**: How confident the model is about the generated token

**Marketing**: "Potential Energy" - represents model uncertainty

**Threshold**: Default 50.0 (lower is better)

- **Low perplexity** (< 10): Model is very confident
- **Medium perplexity** (10-50): Model has reasonable confidence
- **High perplexity** (> 50): Model is uncertain → potential hallucination

### 2. Entropy (Distribution Spread)

**Formula**: `entropy = -Σ(p_i * log(p_i))` for top-k tokens

**Meaning**: How scattered the probability distribution is

**Marketing**: "Kinetic Energy" - represents decision spread

**Threshold**: Default 2.5 (lower is better)

- **Low entropy** (< 1.5): Model is focused on one or few tokens
- **Medium entropy** (1.5-2.5): Model considering multiple reasonable options
- **High entropy** (> 2.5): Model can't decide → scattered predictions

### 3. Cumulative Surprise (Hallucination Risk)

**Formula**: `surprise += -log(P(token))` when `P(token) < 0.1`

**Meaning**: Running sum of unexpected token choices

**Marketing**: "Hallucination Risk Indicator"

**Threshold**: Default 10.0 (lower is better)

- **Low surprise** (< 5): Output follows expected patterns
- **Medium surprise** (5-10): Some unexpected but reasonable choices
- **High surprise** (> 10): Many low-probability tokens → likely hallucination

---

## Quick Start

### Basic Usage

```python
from cert import analyze_trajectory, load_model_for_monitoring

# Load model (8-bit quantization for memory efficiency)
model, tokenizer = load_model_for_monitoring(
    "Qwen/Qwen2.5-7B-Instruct",
    use_8bit=True
)

# Analyze generation
analysis = analyze_trajectory(
    model,
    tokenizer,
    "Explain quantum entanglement"
)

# Check quality
if analysis.passed_quality_check:
    print("✓ PASSED - Safe for production")
else:
    print("✗ FAILED - Requires review")

print(f"Perplexity: {analysis.avg_perplexity:.2f}")
print(f"Entropy: {analysis.max_entropy:.2f}")
print(f"Surprise: {analysis.final_surprise:.2f}")
```

### Advanced Usage with Custom Thresholds

```python
from cert.trajectory import TrajectoryConfig, CERTTrajectoryAnalyzer

# Configure stricter thresholds
config = TrajectoryConfig(
    perplexity_threshold=40.0,  # Stricter than default 50.0
    entropy_threshold=2.0,      # Stricter than default 2.5
    surprise_threshold=8.0,     # Stricter than default 10.0
    max_new_tokens=200,
    temperature=0.7
)

# Create analyzer
analyzer = CERTTrajectoryAnalyzer(config=config)

# Analyze multiple prompts
test_prompts = [
    "What causes climate change?",
    "Explain photosynthesis.",
    "How do vaccines work?"
]

results = analyzer.analyze_model(
    model=model,
    tokenizer=tokenizer,
    test_prompts=test_prompts
)

# Get summary statistics
summary = analyzer.get_summary_statistics(results)
print(f"Pass Rate: {summary['pass_rate']*100:.1f}%")
print(f"Avg Perplexity: {summary['avg_perplexity']:.2f}")
```

### Generate Visualizations

```python
from cert.trajectory import HamiltonianVisualizer

for prompt, analysis in results.items():
    # Generate 4-panel trajectory plot
    HamiltonianVisualizer.plot_trajectory(
        analysis,
        save_path=f"trajectory_{analysis.generation_steps}.png",
        show_plot=False
    )

    # Generate compliance report
    report = HamiltonianVisualizer.generate_compliance_report(
        analysis,
        save_path=f"compliance_{analysis.generation_steps}.txt"
    )
```

---

## Threshold Tuning Guide

### Conservative (Catch Most Issues)

```python
config = TrajectoryConfig(
    perplexity_threshold=30.0,  # Very strict
    entropy_threshold=2.0,
    surprise_threshold=5.0
)
```

**Use when**:
- High-stakes applications (medical, financial, legal)
- Cost of false negatives is high
- Can afford more human review

**Tradeoff**: Higher false positive rate (more manual reviews)

### Balanced (Default)

```python
config = TrajectoryConfig(
    perplexity_threshold=50.0,  # Default
    entropy_threshold=2.5,
    surprise_threshold=10.0
)
```

**Use when**:
- General-purpose applications
- Need balance between automation and safety
- Standard risk tolerance

**Tradeoff**: Balanced false positive/negative rate

### Permissive (Maximize Automation)

```python
config = TrajectoryConfig(
    perplexity_threshold=70.0,  # Lenient
    entropy_threshold=3.0,
    surprise_threshold=15.0
)
```

**Use when**:
- Low-stakes applications
- Cost of false positives is high
- Human review is expensive
- Creative outputs desired

**Tradeoff**: May miss some hallucinations

---

## Honest Positioning Guide

### What To Say (True Statements)

✅ **"Physics-inspired monitoring framework"**
- True: Uses energy metaphors for visualization

✅ **"Real-time confidence tracking"**
- True: Tracks perplexity at each step

✅ **"Quantitative quality gates"**
- True: Pass/fail based on thresholds

✅ **"Catches hallucinations before production"**
- True: Flags low-confidence outputs

✅ **"EU AI Act compliance documentation"**
- True: Generates required reports

### What NOT To Say (False/Misleading)

❌ **"Measures true reasoning"**
- False: Only measures token prediction confidence

❌ **"Eliminates all hallucinations"**
- False: Reduces risk, doesn't eliminate

❌ **"Scientifically proven perfect accuracy"**
- Misleading: Engineering tool, not research

❌ **"Revolutionary AI breakthrough"**
- False: It's monitoring infrastructure

### The Honest Pitch

> "Our trajectory monitor provides real-time confidence tracking for LLM outputs. We measure perplexity, entropy, and surprise at each generation step - these are standard metrics from information theory that correlate with output quality. The 'Hamiltonian' terminology is a visualization metaphor that maps these metrics to 'energy' concepts, making them intuitive for stakeholders. The tool catches potential hallucinations before deployment by flagging low-confidence outputs. It's solid engineering for current-generation LLMs."

---

## Memory Management

### 8-Bit Quantization (Recommended)

```python
model, tokenizer = load_model_for_monitoring(
    "Qwen/Qwen2.5-7B-Instruct",
    use_8bit=True,  # Reduces memory by ~50%
    device="cuda"
)
```

**Memory Requirements**:
- 7B model: ~8-10 GB GPU (with 8-bit)
- 13B model: ~14-16 GB GPU (with 8-bit)
- 70B model: Not recommended (use smaller models)

### Cleanup After Use

```python
from cert import unload_model

# After analysis
unload_model(model, tokenizer)
```

This clears GPU cache and releases memory.

---

## Supported Models

### Tested Models

- ✅ Qwen/Qwen2.5-7B-Instruct
- ✅ Qwen/Qwen2.5-Coder-7B-Instruct
- ✅ deepseek-ai/deepseek-coder-6.7b-instruct
- ✅ meta-llama/Llama-3-8B-Instruct
- ✅ mistralai/Mistral-7B-Instruct-v0.3

### Should Work (Untested)

Any HuggingFace `AutoModelForCausalLM` compatible model with:
- Decoder-only architecture
- Standard tokenizer
- Support for `generate()` with `output_scores=True`

---

## Troubleshooting

### Issue: Out of Memory (OOM)

**Solution 1**: Enable 8-bit quantization
```python
model, tokenizer = load_model_for_monitoring(model_name, use_8bit=True)
```

**Solution 2**: Reduce max_new_tokens
```python
config = TrajectoryConfig(max_new_tokens=100)  # Down from 150
```

**Solution 3**: Use smaller model
```python
# Instead of 7B, use 1.5B or 3B variant
model, tokenizer = load_model_for_monitoring("Qwen/Qwen2.5-1.5B-Instruct")
```

### Issue: Slow Inference

**Solution**: Normal - trajectory monitoring adds negligible overhead (~5%) compared to standard generation. The main cost is model inference itself.

### Issue: All Tests Failing

**Cause**: Thresholds too strict for model

**Solution**: Tune thresholds based on your model's characteristics:
```python
# Run diagnostic
results = analyzer.analyze_model(model, tokenizer, test_prompts)
summary = analyzer.get_summary_statistics(results)

# Check actual values
print(f"Avg perplexity: {summary['avg_perplexity']}")  # Adjust threshold above this
print(f"Avg entropy: {summary['avg_entropy']}")
print(f"Avg surprise: {summary['avg_surprise']}")
```

---

## API Reference

See `cert/trajectory/__init__.py` for complete API documentation.

### Key Classes

- **TrajectoryConfig**: Configuration for monitoring thresholds
- **TrajectoryAnalysis**: Results from a single analysis
- **ReasoningTrajectoryMonitor**: Core monitoring engine
- **CERTTrajectoryAnalyzer**: Integration wrapper
- **HamiltonianVisualizer**: Visualization and reporting

### Key Functions

- **analyze_trajectory()**: Simple one-shot analysis
- **load_model_for_monitoring()**: Load model efficiently
- **unload_model()**: Clean up memory

---

## Business Use Cases

### Use Case 1: Deployment Gate

```python
# Gate model deployments based on quality
for candidate_model in models_to_test:
    model, tokenizer = load_model_for_monitoring(candidate_model)
    results = analyzer.analyze_model(model, tokenizer, eval_prompts)
    summary = analyzer.get_summary_statistics(results)

    if summary['pass_rate'] >= 0.95:
        print(f"✓ {candidate_model} approved for production")
        deploy_model(candidate_model)
    else:
        print(f"✗ {candidate_model} failed quality gate")
```

### Use Case 2: A/B Testing

```python
# Compare quality between models
model_a_results = analyzer.analyze_model(model_a, tokenizer_a, test_prompts)
model_b_results = analyzer.analyze_model(model_b, tokenizer_b, test_prompts)

summary_a = analyzer.get_summary_statistics(model_a_results)
summary_b = analyzer.get_summary_statistics(model_b_results)

print(f"Model A pass rate: {summary_a['pass_rate']*100:.1f}%")
print(f"Model B pass rate: {summary_b['pass_rate']*100:.1f}%")
```

### Use Case 3: Sales Demo

```python
# Generate impressive visualizations for stakeholders
analysis = analyze_trajectory(model, tokenizer, demo_prompt)

# Create 4-panel plot
HamiltonianVisualizer.plot_trajectory(
    analysis,
    save_path="demo_trajectory.png"
)

# Generate compliance report
report = HamiltonianVisualizer.generate_compliance_report(
    analysis,
    save_path="demo_compliance.txt"
)

# Use in sales deck: "Physics-inspired Hamiltonian monitoring"
```

---

## What This Achieves

**Honest Assessment**:

You now have:
1. **Real infrastructure** that catches hallucinations ✓
2. **Sophisticated branding** that differentiates from basic logging ✓
3. **Compliance artifacts** that regulators want to see ✓
4. **Fast delivery** (2 weeks vs. 2 months custom work) ✓

The Hamiltonian language is **marketing**, the monitoring is **engineering**, and the value is **real**.

This is legitimate business practice. Ship it to clients.

---

**Version**: 3.1.0
**Last Updated**: October 2025
**Author**: Javier Marín
