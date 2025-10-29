# CERT Framework - Deployment Guide

**Version:** 4.0
**Last Updated:** October 2025

This guide helps you deploy and use the CERT Framework for EU AI Act Article 15 compliance monitoring in production environments.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Basic Usage](#basic-usage)
5. [Interpreting Results](#interpreting-results)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Support](#support)

---

## System Requirements

### Minimum Requirements

- **Python:** 3.8 or higher
- **RAM:** 4GB minimum
- **Disk Space:** 2GB (for models and dependencies)
- **CPU:** Multi-core recommended
- **OS:** Linux, macOS, or Windows

### Recommended Requirements

- **Python:** 3.10 or higher
- **RAM:** 8GB or more
- **Disk Space:** 5GB
- **CPU:** 4+ cores
- **GPU:** Optional (CUDA-compatible for faster NLI inference)

### Dependencies

The framework has different dependency sets for different use cases:

**Core Package (zero dependencies):**
- Basic tracing and logging
- No ML models, no evaluation
- Installation size: ~5MB

**Evaluation Features (recommended):**
- Semantic similarity (sentence-transformers)
- NLI contradiction detection (transformers)
- Grounding analysis
- Installation size: ~2GB (including models)

---

## Installation

### Option 1: Minimal Installation (Core Only)

For basic tracing without evaluation:

```bash
pip install cert-framework
```

This installs only the core package with no external dependencies.

### Option 2: Full Installation (Recommended)

For complete functionality including accuracy measurement:

```bash
pip install cert-framework[evaluation]
```

This installs:
- Semantic similarity models (~500MB)
- NLI models (~500MB)
- All required ML dependencies

### Option 3: Development Installation

For contributors or advanced users:

```bash
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework
pip install -e .[evaluation,dev]
```

### Verifying Installation

```bash
python -c "from cert import trace, measure; print('✓ Installation successful')"
```

If you see "✓ Installation successful", you're ready to go!

---

## Quick Start

### 1. Basic Monitoring (Core Package)

Track function calls with zero dependencies:

```python
from cert import trace

@trace()
def my_rag_pipeline(query: str) -> dict:
    context = retrieve_documents(query)
    answer = llm.generate(context, query)
    return {"context": context, "answer": answer}

# All calls are logged to cert_traces.jsonl
result = my_rag_pipeline("What is the revenue?")
```

### 2. Accuracy Measurement (Evaluation Package)

Measure semantic similarity and detect hallucinations:

```python
from cert import measure

result = measure(
    text1="Apple's revenue was $500B in 2023",
    text2="Apple's revenue was $394.3B in 2023",
    threshold=0.7
)

print(f"Matched: {result.matched}")
print(f"Confidence: {result.confidence:.2f}")
print(f"NLI Score: {result.nli_score:.2f}")
```

### 3. Generate Compliance Report

Run the example script to generate a full compliance report:

```bash
cd cert-framework
python examples/compliance_report_example.py
```

Output:
- Console summary with pass/fail results
- `compliance_report.md` with detailed analysis
- Convert to PDF: `pandoc compliance_report.md -o compliance_report.pdf`

---

## Basic Usage

### Semantic Similarity

Compare two texts for semantic equivalence:

```python
from cert import measure

result = measure(
    text1="Revenue increased significantly in Q4",
    text2="Q4 saw strong revenue growth",
    use_semantic=True,
    use_nli=False,
    use_grounding=False
)

if result.matched:
    print(f"Texts are semantically similar ({result.confidence:.2f})")
```

### Hallucination Detection

Detect when answers contradict the source context:

```python
from cert import measure

result = measure(
    text1="The study included 1000 participants",  # Answer
    text2="The study included 500 participants",   # Context (truth)
    use_nli=True,
    nli_weight=0.7,
    threshold=0.8
)

if not result.matched:
    print("⚠️  Potential hallucination detected!")
    print(f"NLI Score: {result.nli_score:.2f}")
```

### Grounding Analysis

Check if answer terms are grounded in the context:

```python
from cert import measure

result = measure(
    text1="The product will launch in Europe and Asia",
    text2="The product will launch in Europe",
    use_grounding=True,
    grounding_weight=0.5
)

print(f"Grounding Score: {result.grounding_score:.2f}")
```

### Combined Analysis (Recommended)

Use all three components for robust accuracy measurement:

```python
from cert import measure

result = measure(
    text1=model_output,
    text2=source_context,
    use_semantic=True,
    semantic_weight=0.3,
    use_nli=True,
    nli_weight=0.5,
    use_grounding=True,
    grounding_weight=0.2,
    threshold=0.7
)

print(f"Overall Confidence: {result.confidence:.2f}")
print(f"Decision: {result.rule}")
```

---

## Interpreting Results

### MeasurementResult Object

The `measure()` function returns a `MeasurementResult` with:

```python
result = measure(text1, text2)

# Core fields
result.matched          # bool: True if confidence >= threshold
result.confidence       # float: Overall confidence score (0.0-1.0)

# Component scores
result.semantic_score   # float: Semantic similarity (0.0-1.0)
result.nli_score        # float: NLI entailment score (0.0-1.0)
result.grounding_score  # float: Grounding score (0.0-1.0)

# Metadata
result.threshold_used   # float: Threshold that was applied
result.rule             # str: Human-readable decision explanation
result.components_used  # list: Which components were enabled
result.metadata         # dict: Model names and weights
result.timestamp        # str: ISO timestamp
```

### Score Interpretation

**Semantic Score (0.0-1.0):**
- **0.9-1.0:** Nearly identical meaning
- **0.7-0.9:** High semantic similarity
- **0.5-0.7:** Moderate similarity
- **0.0-0.5:** Low similarity

**NLI Score (0.0-1.0):**
- **0.9-1.0:** Strong entailment (answer follows from context)
- **0.7-0.9:** Likely entailment
- **0.4-0.7:** Neutral (neither entails nor contradicts)
- **0.0-0.4:** Contradiction detected

**Grounding Score (0.0-1.0):**
- **0.9-1.0:** All terms grounded in context
- **0.7-0.9:** Most terms grounded
- **0.5-0.7:** Some ungrounded terms
- **0.0-0.5:** Many ungrounded terms (potential hallucination)

### Confidence Levels

The overall confidence is a weighted combination:

- **0.9-1.0:** Very high confidence - texts align well
- **0.7-0.9:** High confidence - acceptable match
- **0.5-0.7:** Moderate confidence - review recommended
- **0.0-0.5:** Low confidence - likely mismatch or error

---

## Production Deployment

### Environment Setup

1. **Create production environment:**

```bash
python -m venv prod_env
source prod_env/bin/activate  # Linux/Mac
# or
prod_env\Scripts\activate  # Windows

pip install cert-framework[evaluation]
```

2. **Configure logging:**

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('cert.log'),
        logging.StreamHandler()
    ]
)
```

3. **Set up model caching:**

Models are automatically cached after first download. Ensure sufficient disk space:

```bash
# Default cache location
~/.cache/huggingface/
```

### Docker Deployment

Example Dockerfile:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install CERT Framework
RUN pip install cert-framework[evaluation]

# Copy your application
COPY . /app

# Pre-download models (optional but recommended)
RUN python -c "from cert import measure; measure('test', 'test')"

CMD ["python", "your_app.py"]
```

### Performance Optimization

**Model Caching:**

The framework now caches loaded models to avoid reloading:

```python
# First call: loads models (~5s)
result1 = measure("text1", "text2")

# Subsequent calls: reuses cached models (<100ms)
result2 = measure("text3", "text4")
result3 = measure("text5", "text6")
```

**Batch Processing:**

For multiple comparisons, reuse the same model instances:

```python
from cert import measure

# Models are loaded once and cached
for text_pair in text_pairs:
    result = measure(text_pair[0], text_pair[1])
    # Process result...
```

**Resource Management:**

- **CPU:** 2-4 cores recommended
- **RAM:** 4GB minimum (8GB recommended)
- **First run:** 30-60 seconds (model download)
- **Cached runs:** <1 second per comparison

---

## Troubleshooting

### Common Issues

#### 1. Import Error: "No module named 'sentence_transformers'"

**Problem:** Evaluation features not installed

**Solution:**
```bash
pip install cert-framework[evaluation]
```

#### 2. Out of Memory

**Problem:** Not enough RAM for models

**Solution:**
- Close other applications
- Use smaller models:
  ```python
  measure(text1, text2, embedding_model="all-MiniLM-L6-v2")
  ```
- Disable components:
  ```python
  measure(text1, text2, use_nli=False)  # Saves ~500MB
  ```

#### 3. Slow Performance

**Problem:** Models loading on every call

**Solution:**
- Ensure you're using the latest version (v4.0+) with model caching
- Pre-load models on startup:
  ```python
  from cert import measure
  # Warm up the cache
  measure("init", "init")
  ```

#### 4. GPU Not Detected

**Problem:** Models running on CPU despite having GPU

**Solution:**
```bash
# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 5. Certificate/SSL Errors During Model Download

**Problem:** Corporate firewall blocking model downloads

**Solution:**
```bash
# Set proxy if needed
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Or download models manually
python -c "from transformers import AutoModel; AutoModel.from_pretrained('microsoft/deberta-v3-base')"
```

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Both text1 and text2 must be non-empty" | Empty input | Check your inputs |
| "At least one component must be enabled" | All components disabled | Enable at least one: use_semantic, use_nli, or use_grounding |
| "measure requires: pip install cert-framework[evaluation]" | Missing dependencies | Install evaluation extras |

---

## Support

### Documentation

- **GitHub:** https://github.com/Javihaus/cert-framework
- **Issues:** https://github.com/Javihaus/cert-framework/issues
- **Examples:** https://github.com/Javihaus/cert-framework/tree/master/examples

### Getting Help

1. **Check this guide** for common issues
2. **Review examples** in the `examples/` directory
3. **Check existing issues** on GitHub
4. **Open a new issue** with:
   - Python version
   - CERT version (`pip show cert-framework`)
   - Full error traceback
   - Minimal code to reproduce

### Commercial Support

For enterprise support, custom integrations, or consulting:
- Email: info@cert-framework.com
- Website: https://cert-framework.com

---

## Best Practices

### 1. Start with Core Package

Test basic tracing before adding evaluation features:

```python
from cert import trace

@trace()
def my_function(x):
    return x * 2
```

### 2. Use Appropriate Thresholds

- **High-risk applications (financial, medical):** threshold=0.8-0.9
- **General applications:** threshold=0.7
- **Low-risk applications:** threshold=0.6

### 3. Monitor Performance

Track measurement latency and model load times:

```python
import time

start = time.time()
result = measure(text1, text2)
print(f"Measurement took: {time.time() - start:.3f}s")
```

### 4. Implement Error Handling

Always handle potential errors:

```python
from cert import measure

try:
    result = measure(text1, text2)
    if not result.matched:
        # Handle mismatch
        log_potential_issue(text1, text2, result)
except Exception as e:
    logger.error(f"Measurement failed: {e}")
    # Fallback behavior
```

### 5. Generate Regular Reports

Use the compliance report generator regularly:

```bash
# Weekly compliance report
python examples/compliance_report_example.py
```

---

## Version History

### v4.0 (October 2025)
- Zero-dependency core architecture
- Model caching for 50x performance improvement
- Enhanced error handling and logging
- Compliance report generator

### v3.x (Previous)
- Initial measure() function
- Multi-component evaluation

---

**Need help?** Open an issue on GitHub or contact support@cert-framework.com
