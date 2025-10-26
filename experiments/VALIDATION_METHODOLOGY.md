# Preset Threshold Validation Methodology

## Executive Summary

This document describes the complete validation methodology for deriving evidence-based accuracy thresholds for CERT Framework industry presets (Legal and Healthcare domains).

**Current Status**: Validation experiment designed and ready to execute.

**Time to Complete**: 4-6 hours (depending on dataset size and compute resources)

---

## Datasets Identified

### Legal Domain: LegalBench-RAG
- **Source**: https://github.com/zeroentropy-ai/legalbenchrag
- **Paper**: https://arxiv.org/abs/2408.10343
- **Size**: 6,858 query-answer pairs
- **Coverage**: NDAs, M&A agreements, commercial contracts, privacy policies
- **Annotation**: Human-annotated by legal experts
- **Format**: Query + Gold context + Correct answer
- **Target Threshold**: 95% accuracy, <1% hallucination rate

### Healthcare Domain: MedQA
- **Source**: https://huggingface.co/datasets/bigbio/med_qa
- **Paper**: https://arxiv.org/abs/2009.13081
- **Size**: 12,723 English medical exam questions
- **Coverage**: USMLE-style medical board exam questions
- **Annotation**: Professional medical board exams (gold standard)
- **Format**: Multiple choice with correct/incorrect answers
- **Target Threshold**: 98% accuracy, <0.5% hallucination rate

---

## Validation Methodology

### Step 1: Dataset Preparation

**For Each Domain**:
1. Download dataset from source
2. Extract 500-1,000 test cases per domain
3. Create positive/negative pairs:
   - **Positive**: Context + Correct answer
   - **Negative**: Context + Incorrect answer (known hallucination)
4. Split 80/20 train/test (stratified)

**Requirements**:
- Minimum 500 test cases per domain for statistical significance
- Balanced positive/negative samples
- Domain-representative coverage

### Step 2: Energy Threshold Calibration

**For Each Domain**:

1. **Sweep energy thresholds** from 0.05 to 0.45 in 0.05 increments

2. **At each threshold**, evaluate:
   ```
   For each test case:
       - Compute energy for correct answer
       - Compute energy for incorrect answer

       Decision logic:
       - If energy < threshold: ACCEPT answer
       - If energy >= threshold: REJECT answer

       Classification:
       - TP: Correct answer accepted
       - TN: Incorrect answer rejected
       - FP: Incorrect answer accepted (HALLUCINATION!)
       - FN: Correct answer rejected
   ```

3. **Calculate metrics**:
   ```
   Accuracy = (TP + TN) / (TP + TN + FP + FN)
   Precision = TP / (TP + FP)
   Recall = TP / (TP + FN)
   F1 Score = 2 * Precision * Recall / (Precision + Recall)
   Hallucination Rate = FP / (TP + FP)
   ```

4. **Find optimal threshold**:
   - For Legal: Threshold where accuracy ≥ 95%
   - For Healthcare: Threshold where accuracy ≥ 98%
   - Also check hallucination rate meets targets

### Step 3: Statistical Validation

For recommended thresholds, compute:

**95% Confidence Interval (Binomial Proportion)**:
```python
n = total_test_cases
p = achieved_accuracy
se = sqrt(p * (1 - p) / n)
ci_95 = (p - 1.96 * se, p + 1.96 * se)
```

**Requirements for Validation**:
- Sample size n ≥ 500
- Achieved accuracy ≥ target accuracy
- Lower bound of 95% CI > (target - 3%)

### Step 4: Cross-Validation

**5-Fold Cross-Validation**:
- Split test set into 5 folds
- Evaluate threshold on each fold
- Report mean ± std accuracy
- Check consistency across folds

---

## Expected Results Format

### Calibration Curves

For each domain, generate plots showing:

1. **Accuracy vs Energy Threshold**
   - X-axis: Energy threshold (0.05 - 0.45)
   - Y-axis: Accuracy (%)
   - Target line: 95% (Legal) or 98% (Healthcare)

2. **Hallucination Rate vs Energy Threshold**
   - X-axis: Energy threshold
   - Y-axis: Hallucination rate (%)
   - Target line: 1% (Legal) or 0.5% (Healthcare)

### Results Table

| Domain | Target Acc | Energy Threshold | Achieved Acc | 95% CI | Hallucination Rate | n | Status |
|--------|-----------|------------------|--------------|--------|-------------------|---|---------|
| Legal | 95% | 0.25 | 95.3% | [93.1%, 97.5%] | 0.9% | 500 | VALIDATED |
| Healthcare | 98% | 0.15 | 98.1% | [96.8%, 99.4%] | 0.4% | 500 | VALIDATED |

*(These are hypothetical examples - actual values will be determined by experiments)*

### Detailed Calibration Results

**Legal Domain**:
```
Energy Threshold | Accuracy | Precision | Recall | F1 | Hallucination | TP | TN | FP | FN
0.05            | 85.2%    | 92.1%     | 76.3%  | 0.83 | 7.9%      | 191 | 235 | 18 | 56
0.10            | 89.4%    | 93.8%     | 84.2%  | 0.88 | 6.2%      | 211 | 236 | 14 | 39
0.15            | 92.7%    | 94.5%     | 89.8%  | 0.92 | 5.5%      | 225 | 239 | 13 | 23
0.20            | 94.3%    | 95.2%     | 93.1%  | 0.94 | 4.8%      | 233 | 238 | 12 | 17
0.25            | 95.3%    | 95.7%     | 94.6%  | 0.95 | 4.3%      | 237 | 239 | 11 | 13 ← RECOMMENDED
0.30            | 94.8%    | 95.1%     | 94.3%  | 0.95 | 4.9%      | 236 | 238 | 12 | 14
0.35            | 93.2%    | 94.3%     | 91.8%  | 0.93 | 5.7%      | 230 | 236 | 14 | 20
0.40            | 90.1%    | 92.8%     | 86.4%  | 0.90 | 7.2%      | 216 | 234 | 16 | 34
0.45            | 85.7%    | 90.2%     | 79.6%  | 0.85 | 9.8%      | 199 | 229 | 21 | 51
```

*(Example data - actual results will vary)*

**Healthcare Domain**:
```
Energy Threshold | Accuracy | Precision | Recall | F1 | Hallucination | TP | TN | FP | FN
0.05            | 92.3%    | 95.1%     | 88.4%  | 0.92 | 4.9%      | 221 | 240 | 12 | 27
0.10            | 95.7%    | 96.8%     | 94.2%  | 0.96 | 3.2%      | 236 | 243 | 8  | 13
0.15            | 98.1%    | 98.3%     | 97.8%  | 0.98 | 1.7%      | 245 | 246 | 4  | 5  ← RECOMMENDED
0.20            | 97.4%    | 97.9%     | 96.7%  | 0.97 | 2.1%      | 242 | 245 | 5  | 8
0.25            | 96.2%    | 96.5%     | 95.7%  | 0.96 | 3.5%      | 239 | 242 | 9  | 10
0.30            | 94.8%    | 95.3%     | 93.9%  | 0.95 | 4.7%      | 235 | 239 | 12 | 14
0.35            | 92.1%    | 93.7%     | 89.8%  | 0.92 | 6.3%      | 225 | 236 | 15 | 24
0.40            | 88.4%    | 91.2%     | 84.3%  | 0.88 | 8.8%      | 211 | 231 | 20 | 38
0.45            | 83.7%    | 87.9%     | 78.1%  | 0.83 | 12.1%     | 195 | 224 | 27 | 54
```

*(Example data - actual results will vary)*

---

## How to Run the Validation Study

### Prerequisites

```bash
# Install required packages
pip install datasets transformers sentence-transformers torch sklearn matplotlib seaborn pandas numpy tqdm

# Ensure CERT is installed
cd /Users/javiermarin/cert-framework
pip install -e packages/python
```

### Execution

**Option 1: Run Full Study** (4-6 hours):
```bash
cd /Users/javiermarin/cert-framework
python3 experiments/preset_validation_study.py
```

**Option 2: Run with Real Datasets** (requires download):

1. Download LegalBench-RAG:
```bash
git clone https://github.com/zeroentropy-ai/legalbenchrag.git data/legalbenchrag
```

2. Install HuggingFace datasets:
```bash
pip install datasets
```

3. Update `preset_validation_study.py` to load real data:
```python
# In DatasetLoader.load_legalbench_rag():
from datasets import load_dataset
dataset = load_dataset("zeroentropy/legalbench-rag")
# Process dataset...

# In DatasetLoader.load_medqa():
dataset = load_dataset("bigbio/med_qa", "med_qa_en_source")
# Process dataset...
```

### Output Files

After completion, check `./validation_results/`:
- `threshold_recommendations.json` - Final recommendations
- `legal_calibration_results.csv` - Detailed legal domain results
- `healthcare_calibration_results.csv` - Detailed healthcare results
- `calibration_curves.png` - Visualization plots

---

## Interpretation Guidelines

### When Results Are Valid

**VALIDATED** status requires:
1. Sample size n ≥ 500
2. Achieved accuracy ≥ target accuracy
3. Lower bound of 95% CI within 3% of target
4. Cross-validation consistency (std < 2%)

**Example**:
```
Legal Domain: VALIDATED
- Target: 95%
- Achieved: 95.3% (95% CI: [93.1%, 97.5%])
- Energy Threshold: 0.25
- Hallucination Rate: 0.9%
- Status: Ready for production use
```

### When Results Are Insufficient

**INSUFFICIENT** status indicates:
1. Sample size too small (n < 500)
2. Failed to meet target accuracy
3. High variance across folds
4. Hallucination rate exceeds target

**Example**:
```
Legal Domain: INSUFFICIENT
- Target: 95%
- Achieved: 92.1% (95% CI: [89.3%, 94.9%])
- Energy Threshold: 0.30
- Hallucination Rate: 5.2%
- Action Required: Increase sample size or adjust target
```

---

## Preset Updates Based on Results

### If Validation Succeeds

Update `cert/presets.py`:

```python
PRESETS: Dict[str, Dict[str, float]] = {
    "legal": {
        "energy_threshold": 0.25,  # VALIDATED: LegalBench-RAG (n=500)
        "accuracy_target": 0.95,    # Achieved: 95.3% (95% CI: [93.1%, 97.5%])
        "hallucination_tolerance": 0.01,  # Achieved: 0.9%
        "audit_retention_months": 84,     # 7 years (statutory requirement)
        "description": "Validated on LegalBench-RAG with 95.3% accuracy (n=500)",
        "validation_date": "2025-10-24",
        "validation_dataset": "LegalBench-RAG",
        "validation_paper": "https://arxiv.org/abs/2408.10343"
    },
    "healthcare": {
        "energy_threshold": 0.15,  # VALIDATED: MedQA (n=500)
        "accuracy_target": 0.98,    # Achieved: 98.1% (95% CI: [96.8%, 99.4%])
        "hallucination_tolerance": 0.005,  # Achieved: 0.4%
        "audit_retention_months": 120,     # 10 years (HIPAA requirement)
        "description": "Validated on MedQA with 98.1% accuracy (n=500)",
        "validation_date": "2025-10-24",
        "validation_dataset": "MedQA (USMLE)",
        "validation_paper": "https://arxiv.org/abs/2009.13081"
    },
}
```

### If Validation Fails

**Option A**: Adjust targets to match achievable accuracy
**Option B**: Collect more data and retrain
**Option C**: Use "experimental" status with disclaimers

```python
"legal": {
    "energy_threshold": 0.30,  # EXPERIMENTAL: Insufficient validation
    "accuracy_target": 0.92,    # Achievable: 92.1%
    "description": "EXPERIMENTAL: Thresholds based on limited validation (n=200). "
                   "Not recommended for production use without domain-specific validation.",
    "validation_status": "INSUFFICIENT",
}
```

---

## Publication-Ready Documentation

Once validated, create academic-style documentation:

### Technical Report Structure

1. **Abstract**: Summary of validation methodology and results
2. **Introduction**: Motivation for evidence-based thresholds
3. **Methods**:
   - Datasets used
   - Energy function description
   - Calibration methodology
   - Statistical validation
4. **Results**:
   - Calibration curves
   - Threshold recommendations
   - Confidence intervals
   - Cross-validation results
5. **Discussion**:
   - Comparison to baselines
   - Limitations
   - Generalization considerations
6. **Conclusion**: Recommended thresholds and deployment guidelines

### Example Citation Format

```bibtex
@techreport{cert_threshold_validation_2025,
  author = {Marin, Javier},
  title = {Evidence-Based Threshold Calibration for RAG Hallucination Detection:
           Validation on Legal and Healthcare Benchmarks},
  institution = {CERT Framework},
  year = {2025},
  type = {Technical Report},
  note = {LegalBench-RAG (n=500, 95.3\% accuracy), MedQA (n=500, 98.1\% accuracy)}
}
```

---

## Next Steps

### Immediate Actions (Today)

1. **Run validation study**:
   ```bash
   python3 experiments/preset_validation_study.py
   ```

2. **Review results**:
   - Check `validation_results/threshold_recommendations.json`
   - Examine calibration curves
   - Verify statistical significance

3. **Document findings**:
   - Update preset values with validated thresholds
   - Add validation metadata
   - Create technical report

### Follow-Up Actions (This Week)

1. **Extend to financial domain**:
   - Use FinQA dataset
   - Target: 95% accuracy
   - Repeat calibration process

2. **Publish validation report**:
   - Write technical report
   - Share on arXiv
   - Update documentation

3. **Update README**:
   - Replace "unvalidated" warnings
   - Add "validated on" badges
   - Link to validation report

### Long-Term Actions (Next Month)

1. **Continuous validation**:
   - Monitor production performance
   - Collect edge cases
   - Retrain and recalibrate

2. **Expand domains**:
   - Add validated presets for other industries
   - Create domain-specific validation pipelines
   - Build community validation contributions

---

## Questions & Troubleshooting

### Q: What if achieved accuracy falls short of target?

**A**: Three options:
1. Lower target to achievable level (e.g., 93% instead of 95%)
2. Increase sample size (try 1,000 instead of 500)
3. Tune energy function weights (adjust semantic/NLI/grounding ratios)

### Q: What if results vary significantly across folds?

**A**: High variance indicates:
- Dataset is too small or imbalanced
- Energy function is unstable
- Need more representative samples

**Solution**: Increase sample size and ensure balanced sampling.

### Q: What if hallucination rate exceeds target despite meeting accuracy?

**A**: Adjust threshold trade-off:
- Lower threshold → fewer hallucinations, lower recall
- Higher threshold → more hallucinations, higher recall
- Find optimal balance based on domain risk tolerance

### Q: How often should thresholds be revalidated?

**A**: Recommended schedule:
- **Every 6 months**: Review production performance
- **Every 12 months**: Full revalidation with new data
- **After major updates**: Revalidate if energy function changes

---

## Conclusion

This validation methodology provides a rigorous, evidence-based approach to calibrating accuracy thresholds for CERT Framework presets. By following this process, you can:

1. Replace unvalidated claims with statistically significant results
2. Provide confidence intervals and validation metadata
3. Justify threshold values with peer-reviewed datasets
4. Enable reproducible validation by the research community

**Status**: Ready to execute. Run `preset_validation_study.py` to begin.

**Expected Duration**: 4-6 hours for full validation (Legal + Healthcare)

**Next Step**: Execute validation study and review results.
