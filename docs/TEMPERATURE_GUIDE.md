# Temperature Configuration Guide

## Overview

Temperature is a critical parameter in LLM testing that controls output randomness and diversity. This guide explains how to configure temperature in CERT Framework for different testing scenarios.

## Why Temperature Matters for Testing

**Temperature controls the randomness of model outputs:**
- **Temperature = 0.0**: Deterministic, greedy decoding (always picks most likely token)
- **Temperature = 0.3**: Slightly random, highly consistent
- **Temperature = 0.7**: Balanced between consistency and diversity
- **Temperature = 1.0**: Maximum diversity, highly random

**For benchmarking and model comparison, temperature has significant implications:**

### Impact on Consistency Testing
- High temperature (0.7-1.0) introduces sampling randomness, making it harder to distinguish:
  - Model-inherent behavioral inconsistency
  - Random sampling variation
- Low temperature (0.0-0.3) isolates model behavior from sampling effects

### Impact on Reproducibility
- Temperature = 0.0 produces deterministic outputs (given same model state)
- Higher temperatures require more trials for statistical significance
- Reproducibility is critical for:
  - Compliance/audit documentation
  - Regression testing
  - Fair model-to-model comparison

### Impact on Model Comparison
- **Different models behave differently at different temperatures**
- Temperature 0.7 may favor models with certain training approaches
- Temperature 0.0 provides a level playing field for capability comparison

## CERT Framework Defaults

**Default: `temperature=0.0` (Deterministic)**

This default was chosen because:
1. **Industry Standard**: OpenAI Evals, HuggingFace benchmarks, academic papers use temperature=0
2. **Reproducibility**: Critical for compliance, audit, and regression testing
3. **Fair Comparison**: Isolates model capabilities from sampling randomness
4. **Statistical Efficiency**: Requires fewer trials for significance

## Temperature Modes

CERT provides preset temperature modes via the `TemperatureMode` enum:

```python
from cert.agents import AssessmentConfig, TemperatureMode

# Option 1: Use preset modes
config = AssessmentConfig.from_temperature_mode(
    TemperatureMode.DETERMINISTIC,  # temperature=0.0
    consistency_trials=10
)

# Option 2: Set temperature directly
config = AssessmentConfig(
    temperature=0.0,
    consistency_trials=10
)
```

### Available Modes

#### `TemperatureMode.DETERMINISTIC` (0.0) - RECOMMENDED
**Use for:**
- Model benchmarking and comparison
- Reproducible results for compliance/audit
- Regression testing
- Statistical rigor with fewer trials

**Example:**
```python
config = AssessmentConfig.from_temperature_mode(
    TemperatureMode.DETERMINISTIC,
    consistency_trials=20,
    providers={
        'anthropic': ['claude-3-5-haiku-20241022'],
        'openai': ['gpt-4o-mini']
    }
)
```

#### `TemperatureMode.FACTUAL` (0.3)
**Use for:**
- Testing factual/deterministic use cases
- Q&A systems, classification, extraction tasks
- When slight variation is acceptable but consistency is key

**Example:**
```python
config = AssessmentConfig.from_temperature_mode(
    TemperatureMode.FACTUAL,
    consistency_trials=15
)
```

#### `TemperatureMode.BALANCED` (0.7)
**Use for:**
- Testing how models behave in typical production settings
- When your production application uses temperature=0.7
- General-purpose testing with moderate diversity

**Example:**
```python
config = AssessmentConfig.from_temperature_mode(
    TemperatureMode.BALANCED,
    consistency_trials=25  # More trials needed for statistical significance
)
```

#### `TemperatureMode.CREATIVE` (1.0)
**Use for:**
- Testing creative/generative scenarios
- When output diversity is desired
- Testing robustness to high sampling randomness

**Example:**
```python
config = AssessmentConfig.from_temperature_mode(
    TemperatureMode.CREATIVE,
    consistency_trials=30  # Even more trials needed
)
```

## Recommendations by Use Case

### 1. Model Selection / Benchmarking
**Recommended: `temperature=0.0`**

```python
config = AssessmentConfig(
    temperature=0.0,  # Deterministic
    consistency_trials=20,
    performance_trials=15
)
```

**Rationale:** Fair comparison, reproducible, standard practice

### 2. Compliance / Audit Documentation
**Recommended: `temperature=0.0`**

```python
config = AssessmentConfig(
    temperature=0.0,  # Reproducible for audits
    consistency_trials=20,
    output_dir='./audit_results'
)
```

**Rationale:** Reproducible results required for legal/compliance

### 3. Regression Testing
**Recommended: `temperature=0.0`**

```python
config = AssessmentConfig(
    temperature=0.0,  # Detect model changes
    consistency_trials=10,  # Fewer trials ok with temp=0
)
```

**Rationale:** Detect behavioral changes between model versions

### 4. Production Simulation
**Recommended: Match production temperature**

If your production app uses temperature=0.7:
```python
config = AssessmentConfig(
    temperature=0.7,  # Match production
    consistency_trials=25  # More trials for variance
)
```

**Rationale:** Test reflects production behavior

### 5. Multi-Temperature Testing
**Recommended: Test multiple temperatures**

```python
import asyncio
from cert.agents import AssessmentConfig, TemperatureMode, CERTAgentEngine

async def test_all_temperatures():
    modes = [
        TemperatureMode.DETERMINISTIC,
        TemperatureMode.FACTUAL,
        TemperatureMode.BALANCED,
        TemperatureMode.CREATIVE
    ]

    results = {}
    for mode in modes:
        config = AssessmentConfig.from_temperature_mode(
            mode,
            consistency_trials=20,
            output_dir=f'./results_temp_{mode.value}'
        )
        engine = CERTAgentEngine(config, providers)
        results[mode] = await engine.run_full_assessment()

    return results
```

**Rationale:** Understand model behavior across temperature spectrum

## Trial Count Guidelines

Higher temperature requires more trials for statistical significance:

| Temperature | Recommended Consistency Trials | Rationale |
|------------|-------------------------------|-----------|
| 0.0 | 10-20 | Low variance, fewer trials needed |
| 0.3 | 15-25 | Moderate variance |
| 0.7 | 25-35 | High variance |
| 1.0 | 30-50 | Very high variance |

## Common Pitfalls

### ❌ Using high temperature for benchmarking
```python
# DON'T: High variance makes comparison difficult
config = AssessmentConfig(temperature=0.7)
```

### ✅ Use deterministic for benchmarking
```python
# DO: Fair, reproducible comparison
config = AssessmentConfig(temperature=0.0)
```

### ❌ Insufficient trials with high temperature
```python
# DON'T: Not enough trials for statistical significance
config = AssessmentConfig(temperature=0.7, consistency_trials=10)
```

### ✅ Sufficient trials for temperature
```python
# DO: Adequate trials for variance
config = AssessmentConfig(temperature=0.7, consistency_trials=30)
```

### ❌ Mismatching test and production temperature
```python
# DON'T: Test with temp=0 if production uses temp=0.7
config = AssessmentConfig(temperature=0.0)  # But prod uses 0.7!
```

### ✅ Match production or test both
```python
# DO: Match production temperature
config = AssessmentConfig(temperature=0.7)  # Matches production

# OR test both scenarios
config_benchmark = AssessmentConfig(temperature=0.0)  # For comparison
config_production = AssessmentConfig(temperature=0.7)  # For prod simulation
```

## FAQ

**Q: Why did CERT change default from 0.7 to 0.0?**
A: To align with industry standards (OpenAI Evals, HuggingFace benchmarks, academic research) and provide fair, reproducible model comparisons by default.

**Q: Should I use temperature=0 if my production app uses 0.7?**
A: It depends on your goal:
- For **model selection/comparison**: Use temperature=0
- For **production simulation**: Use temperature=0.7
- **Ideally**: Test both scenarios

**Q: Does temperature affect all metrics equally?**
A: No:
- **Consistency**: Highly affected (high temp = more variance)
- **Latency**: Not affected
- **Output Quality**: Moderately affected (diversity metrics change)
- **Robustness**: Slightly affected

**Q: Can different models have different temperatures?**
A: Currently no, but you can run multiple assessments with different configs per model.

**Q: What if I want temperature per prompt, not per config?**
A: Currently temperature is config-level. For per-prompt temperature, you would need to run separate assessments.

## References

- [OpenAI Evals Documentation](https://github.com/openai/evals)
- [HuggingFace Model Evaluation](https://huggingface.co/docs/evaluate)
- [Temperature in Language Models (Academic)](https://arxiv.org/abs/1904.09751)

## Summary

**For most CERT users:**
- **Default `temperature=0.0` is the right choice** for fair, reproducible model comparison
- Use `TemperatureMode` enum for common scenarios
- Match production temperature only when testing production-specific behavior
- Increase trial count with higher temperature

**Quick decision tree:**
1. Are you comparing models? → Use `temperature=0.0`
2. Are you doing compliance/audit? → Use `temperature=0.0`
3. Are you simulating production? → Match production temperature
4. Are you testing creativity? → Use `temperature=0.7-1.0` with more trials
