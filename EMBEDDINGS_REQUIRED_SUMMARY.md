# Embeddings Required - Implementation Summary

## What Changed

Embeddings (sentence-transformers) have been made a **required dependency** for the CERT framework, not optional.

### Rationale

**User's directive:**
> "Add embeddings as a required dependency for semantic comparison. Don't make it optional. If users want to test LLM outputs, they need semantic comparison. The 500MB is the cost of doing business."

### Files Modified

#### 1. `packages/python/setup.py` ✓
**Before:**
```python
extras_require={
    "embeddings": [
        "sentence-transformers>=2.0.0",
        "numpy>=1.20.0",
    ],
}
```

**After:**
```python
install_requires=[
    "typing-extensions>=4.0.0",
    "rapidfuzz>=3.0.0",
    "sentence-transformers>=2.0.0",  # REQUIRED for semantic comparison
    "numpy>=1.20.0",  # REQUIRED for embeddings
],
# "embeddings" removed from extras_require
```

#### 2. `packages/python/cert/embeddings.py` ✓
**Before:**
```python
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False
```

**After:**
```python
from sentence_transformers import SentenceTransformer
import numpy as np
# Direct imports - embeddings are REQUIRED
```

#### 3. `packages/python/cert/intelligent_comparator.py` ✓
**Before:**
```python
def __init__(self, ..., use_embeddings: bool = False):
    if use_embeddings:
        self._load_embedding_comparator()

def _load_embedding_comparator(self):
    try:
        from cert.embeddings import EmbeddingComparator
        self.embedding_comparator = EmbeddingComparator(...)
    except ImportError:
        warnings.warn("Embeddings not available...")
```

**After:**
```python
def __init__(self, ...):  # use_embeddings parameter removed
    # Embedding comparator (REQUIRED)
    self._load_embedding_comparator()

def _load_embedding_comparator(self):
    """Load embedding comparator (REQUIRED)."""
    from cert.embeddings import EmbeddingComparator
    self.embedding_comparator = EmbeddingComparator(...)
    # No try/except - embeddings must be available
```

#### 4. `packages/python/cert/__init__.py` ✓
**Before:**
```python
try:
    from .embeddings import EmbeddingComparator
    __all_embeddings__ = ["EmbeddingComparator"]
except ImportError:
    __all_embeddings__ = []
```

**After:**
```python
# Embedding comparator (REQUIRED)
from .embeddings import EmbeddingComparator
__all_embeddings__ = ["EmbeddingComparator"]
```

#### 5. `packages/python/README.md` ✓
Updated documentation to reflect:
- Embeddings are required (not optional)
- ~420MB model download on first use
- Validation infrastructure (STS-Benchmark)
- Why embeddings are necessary for LLM testing

## Benchmark Validation Infrastructure

### Created Files

#### 1. `tests/test_benchmark_validation.py` ✓
Comprehensive validation using STS-Benchmark dataset (8,628 sentence pairs with human similarity judgments 0-5 scale).

**Features:**
- Automatic dataset download from official source
- Three splits: train (5,749), dev (1,500), test (1,379)
- Metrics: accuracy, precision, recall, F1
- Threshold tuning to find optimal setting
- Quick test (100 samples) and full validation modes

**Usage:**
```bash
# Quick validation
pytest tests/test_benchmark_validation.py::TestSTSBenchmarkValidation::test_dev_split_sample

# Full validation
pytest -v -m slow tests/test_benchmark_validation.py::TestSTSBenchmarkValidation::test_full_dev_split

# Threshold tuning
pytest tests/test_benchmark_validation.py::TestSTSBenchmarkValidation::test_threshold_tuning
```

**Expected Results:**
| Metric | Value |
|--------|-------|
| Accuracy | 82-86% |
| Spearman correlation | 0.85-0.87 |
| Pearson correlation | 0.84-0.86 |

**Decision Framework:**
- **≥85% accuracy**: Ship it! Embeddings are sufficient
- **75-85% accuracy**: Consider training (5-10% improvement)
- **<75% accuracy**: Training recommended (10-15% improvement)

#### 2. `quick_benchmark_test.py` ✓
Quick smoke test with 5 example pairs to verify embeddings load correctly.

#### 3. `BENCHMARK_VALIDATION_PLAN.md` ✓
Detailed documentation of:
- Implementation status
- Expected results from literature
- Domain-specific validation plan (FinQA, MedQA, LegalBench)
- Next steps for execution

## Domain-Specific Validation (Pending)

### Test Stubs Created

The following domain-specific validation stubs are ready in `test_benchmark_validation.py`:

1. **FinQA** (Financial): 8,281 question-answer pairs from financial reports
   - Expected accuracy: 75-80%
   - Training gap: 10-15% improvement

2. **MedQA** (Medical): 12,723 USMLE-style questions
   - Expected accuracy: 70-75%
   - Training gap: 15-20% improvement

3. **LegalBench** (Legal): 162 tasks covering legal reasoning
   - Expected accuracy: 65-70%
   - Training gap: 20-25% improvement

### Purpose

These tests measure the "training gap" - how much accuracy would improve with domain-specific fine-tuning compared to general embeddings.

## Expected Impact on Apple 10-K Results

From `ACTUAL_EXPERIMENT_RESULTS.md` (rules only):
- Overall: 61% (14/23 passed)
- Numerical: 100% (8/8) - Rules work perfectly
- **Semantic: 0% (0/7) - All failed without embeddings**

### 7 Semantic Failures (All Vocabulary Substitutions)

1. "revenue" ≠ "sales"
2. "increased" ≠ "grew"
3. "smartphones" ≠ "phones"
4. "designs, manufactures, markets" ≠ "creates and sells"
5. Similar patterns...

**With embeddings enabled:**
- Semantic: 0% → **70-85%** (5-6/7 passing)
- Overall: 61% → **85-91%** (20-21/23 passing)

**These vocabulary substitutions are exactly what embeddings solve.**

## Execution Status

### Completed ✓
1. Embeddings made required in all code
2. Documentation updated
3. Benchmark validation infrastructure created
4. Domain-specific test stubs prepared

### Pending ⏳
1. Execute STS-Benchmark validation
2. Execute domain-specific validation
3. Document actual results
4. Make training decision based on data

### Blocked ⚠️
Current execution environment has resource constraints (process killed with exit code 137, likely OOM).

**Requirements for execution:**
- ≥2GB free RAM for model loading
- Stable environment without process termination
- ~5-10 minutes for full STS-Benchmark validation

## Installation for Users

Users now install with:
```bash
pip install cert-framework
```

On first use, sentence-transformers will download the model (~420MB):
```python
from cert import IntelligentComparator

# Model downloads automatically on first use
comparator = IntelligentComparator()
```

**No optional extras needed** - embeddings are always included.

## Migration Guide

### For Existing Users

**Before:**
```python
# Optional embeddings
pip install cert-framework[embeddings]

comparator = IntelligentComparator(use_embeddings=True)
```

**After:**
```python
# Embeddings included by default
pip install cert-framework

comparator = IntelligentComparator()  # Always uses embeddings
```

### Breaking Changes

1. `use_embeddings` parameter removed from `IntelligentComparator.__init__()`
2. `sentence-transformers` now required (was optional)
3. First-time users will see model download (~420MB)

## Validation Against Real Data

Per user's guidance:
> "Validate on public benchmarks immediately. Don't iterate on hand-crafted test cases. Use real data... STS-Benchmark has 8,628 sentence pairs with human similarity judgments. That's real validation, not 7 examples."

**Implementation complete.** Ready for execution in suitable environment.

## Next Steps

1. **Run validation in suitable environment:**
   ```bash
   cd packages/python
   python3 tests/test_benchmark_validation.py
   ```

2. **Analyze results:**
   - Compare to expected 82-86% accuracy
   - Identify any threshold adjustments needed
   - Document actual performance

3. **Run domain-specific validation:**
   - Download FinQA, MedQA, LegalBench datasets
   - Measure accuracy on each
   - Quantify training gap

4. **Make training decision:**
   - If embeddings hit 85-90%: ship as-is
   - If embeddings at 70-75%: training justified
   - Use real annotation data from benchmarks

## Summary

✅ **Embeddings are now required** (not optional)
✅ **Code updated** to always load embeddings
✅ **Documentation updated** with rationale
✅ **Benchmark validation infrastructure created** (8,628 real pairs)
✅ **Domain-specific test stubs ready** (FinQA, MedQA, LegalBench)
⏳ **Execution pending** due to environment constraints

The framework is now positioned for data-driven training decisions using real benchmarks, not hand-crafted examples.
