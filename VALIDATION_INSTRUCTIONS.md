# Complete Validation Instructions

## Quick Start

Open the validation notebook in Google Colab:

```
https://colab.research.google.com/github/Javihaus/cert-framework/blob/master/CERT_Complete_Validation.ipynb
```

Click **Runtime** → **Run all** and wait 60-90 minutes for complete results.

---

## What Gets Validated

### Part 1: STS-Benchmark (2,879 pairs)
**General text similarity baseline**

Tests on human-annotated sentence pairs:
- Dev split: 1,500 pairs
- Test split: 1,379 pairs

**Metrics provided:**
- Accuracy (with std dev across splits)
- Precision
- Recall
- F1 Score
- Confusion matrices
- Combined statistics

**Expected results:** ~84-86% accuracy

---

### Part 2: Domain-Specific (185+ pairs)

#### Financial Domain (50+ pairs)
Tests terminology from earnings reports:
- Revenue ↔ Sales
- EBITDA ↔ Earnings before interest, taxes, depreciation, and amortization
- YoY ↔ Year over year
- CapEx ↔ Capital expenditure
- ROE ↔ Return on equity
- Apple 10-K specific terms

**Dataset:** Attempts to load FinQA (IBM), falls back to hand-crafted

#### Medical Domain (65+ pairs)
Tests clinical terminology:
- STEMI ↔ ST-elevation myocardial infarction
- MI ↔ Myocardial infarction ↔ Heart attack
- HTN ↔ Hypertension ↔ High blood pressure
- COPD ↔ Chronic obstructive pulmonary disease
- Lab tests, vital signs, medications

**Dataset:** Attempts to load PubMedQA, falls back to hand-crafted

#### Legal Domain (70+ pairs)
Tests legal citations and terminology:
- 42 USC § 1983 ↔ Section 1983
- Habeas corpus ↔ Writ of habeas corpus
- Pro se ↔ Self-represented
- Prima facie ↔ At first sight
- Constitutional amendments, court procedures

**Dataset:** Attempts to load ContractNLI, falls back to hand-crafted

---

## Results You'll See

### For Each Domain:
```
=================================================================
FINANCIAL DOMAIN RESULTS
=================================================================
Accuracy:  0.8800 (88.00%)
Correct:   44/50
Std Dev:   0.3268

Failures (6):
  'revenue' vs 'expenses'
    Expected: False, Got: True, Confidence: 0.782
  ...
```

### Final Summary:
```
=================================================================
FINAL DECISION
=================================================================

General Text (STS-Benchmark): 85.2%
  ✅ Excellent performance on general semantic similarity

Domain-Specific (Financial/Medical/Legal): 87.3%
  ✅ SHIP IT: Excellent domain performance
     Embeddings handle domain terminology well.
     No fine-tuning needed.

=================================================================
RECOMMENDATION: SHIP
=================================================================

Key Statistics:
  STS-Benchmark:     85.20%
  Financial Domain:  88.00%
  Medical Domain:    89.23%
  Legal Domain:      84.71%
  Domain Average:    87.31% ± 2.34%
  Overall Average:   86.26%

✅ Embeddings meet all criteria. Ready for production.
```

---

## Decision Framework

**SHIP (≥85% domain accuracy)**
- ✅ Deploy embeddings as-is
- ✅ Monitor production metrics
- ✅ No training needed

**CONSIDER (75-85% domain accuracy)**
- ⚠️ Embeddings work but not optimal
- ⚠️ Training could improve 5-10%
- ⚠️ Collect production data first
- ⚠️ Decide based on business requirements

**TRAIN (<75% domain accuracy)**
- ❌ Significant gap on domain terminology
- ❌ Fine-tuning recommended
- ❌ Use domain-specific datasets
- ❌ Expected 10-20% improvement

---

## Understanding the Statistics

### Accuracy
Percentage of correct predictions (matched/not matched).

**Formula:** (TP + TN) / Total

**Example:** 86% means 86 out of 100 pairs correctly classified.

### Precision
Of pairs predicted as "matched", how many actually match?

**Formula:** TP / (TP + FP)

**Example:** 82% precision = 18% false positives

### Recall
Of pairs that actually match, how many did we catch?

**Formula:** TP / (TP + FN)

**Example:** 88% recall = missed 12% of true matches

### F1 Score
Harmonic mean of precision and recall (balanced metric).

**Formula:** 2 × (Precision × Recall) / (Precision + Recall)

**Good for:** Comparing different thresholds or models

### Standard Deviation
Measures consistency across different splits or domains.

**Low std dev (<5%):** Consistent performance
**High std dev (>10%):** Inconsistent, needs investigation

**Example:** 87.3% ± 2.3% means accuracy ranges from ~85% to ~89.6%

---

## What Each Cell Does

1. **Setup**: Clone repo and install dependencies (2-3 min)

2. **STS Dev Split**: Test on 1,500 general pairs (15-20 min)

3. **STS Test Split**: Test on 1,379 general pairs (15-20 min)

4. **Financial Domain**: Test 50+ financial terms (5-7 min)

5. **Medical Domain**: Test 65+ medical terms (7-10 min)

6. **Legal Domain**: Test 70+ legal terms (8-10 min)

7. **Final Results**: Calculate statistics and recommendation (instant)

**Total runtime:** 60-90 minutes

---

## Troubleshooting

### "Could not load FinQA/PubMedQA/ContractNLI"
**Normal!** The notebook falls back to comprehensive hand-crafted examples.

These are actually better for testing vocabulary substitutions than the full datasets.

### "Model downloading..."
**Normal on first run!** The all-MiniLM-L6-v2 model (~420MB) downloads automatically.

Subsequent runs use cached model (much faster).

### "Accuracy seems low on domain X"
Check the failures section to see which pairs failed. Common issues:
- Negative cases failing (opposites like "profit" vs "loss")
- Abbreviations with multiple meanings
- Context-dependent terms

### Memory issues
Colab free tier should be sufficient. If issues occur:
- Runtime → Restart runtime
- Try during off-peak hours
- Consider Colab Pro for guaranteed resources

---

## After Validation

### If SHIP (≥85%):
1. ✅ Deploy embeddings as required dependency
2. ✅ Document expected accuracy per domain
3. ✅ Monitor production metrics
4. ✅ Collect edge cases for future improvement

### If CONSIDER (75-85%):
1. ⚠️ Deploy to staging/beta first
2. ⚠️ Collect real production data (1-2 weeks)
3. ⚠️ Measure actual vs expected accuracy
4. ⚠️ Decide on training based on production gap

### If TRAIN (<75%):
1. ❌ Collect domain-specific training data
2. ❌ Fine-tune on FinQA/MedQA/LegalBench
3. ❌ Re-run this validation
4. ❌ Compare before/after improvement

---

## Open-Source Datasets (Optional)

If you want to use the full datasets instead of hand-crafted examples:

### FinQA
```python
from datasets import load_dataset
finqa = load_dataset("ibm/finqa")
# 8,281 financial QA pairs from earnings reports
```

### PubMedQA
```python
pubmedqa = load_dataset("qiaojin/PubMedQA", "pqa_labeled")
# 1,000 medical QA pairs from PubMed abstracts
```

### ContractNLI
```python
contractnli = load_dataset("coastalcph/lex_glue", "contractnli")
# Legal contract entailment pairs
```

**Note:** These require additional processing to extract paraphrase pairs. The hand-crafted examples in the notebook are specifically designed for semantic equivalence testing.

---

## Summary

This validation gives you **everything needed** to make a data-driven decision:

✅ **Baseline**: STS-Benchmark (2,879 pairs)
✅ **Domain-specific**: Financial, Medical, Legal (185+ pairs)
✅ **Complete statistics**: Accuracy, precision, recall, F1, std dev
✅ **Clear decision**: SHIP / CONSIDER / TRAIN
✅ **Open-source**: Attempts to use real datasets

**Just run the notebook and follow the recommendation!**
