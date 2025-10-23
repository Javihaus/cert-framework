# CERT Metrics Reference

**Understanding Production Assessment Metrics for Agentic AI Systems**

This document explains each metric CERT measures, what it means for your pipeline, how to interpret results, and how to use metrics for operational decisions and compliance documentation.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Hallucination Detection Metrics](#hallucination-detection-metrics)
3. [Pipeline Reliability Metrics](#pipeline-reliability-metrics)
4. [Latency Metrics](#latency-metrics)
5. [Output Quality Metrics](#output-quality-metrics)
6. [Robustness Metrics](#robustness-metrics)
7. [Advanced Statistical Metrics](#advanced-statistical-metrics)
8. [Interpretation Guidelines](#interpretation-guidelines)
9. [Compliance Mapping](#compliance-mapping)
10. [Decision Trees](#decision-trees)

---

## Core Philosophy

CERT metrics answer operational questions, not academic ones:

| Question | Metric | Interpretation |
|----------|--------|-----------------|
| Is output grounded in source material? | Energy Score, Contradiction Rate | High confidence = safe to deploy |
| Do we meet our latency SLA? | P95, P99 Latency | Below threshold = ✓ Ready |
| Are outputs consistent? | Consistency Score | High = predictable behavior |
| Does the system handle errors? | Error Rate, Timeout Rate | Low = resilient |
| Is output quality degrading? | Semantic Diversity, Repetition | High diversity = healthy |

All metrics translate to **Go/No-Go deployment decisions**, not rankings or comparisons.

---

## Hallucination Detection Metrics

### 1. Energy Score

**What it measures:** How well an LLM output is grounded in source material.

**Mathematical definition:**
```
E(context, answer) = 1 - (α·s_semantic + β·s_nli + γ·s_grounding)

Where:
- s_semantic: Cosine similarity of embeddings (0-1)
- s_nli: Entailment confidence from NLI model (0-1)
- s_grounding: Term overlap ratio (0-1)
- α=0.25, β=0.55, γ=0.20 (weights optimized on 500 examples)
```

**Scale:**
- E ≈ 0.0-0.1: Output well-grounded, supported by context ✓
- E ≈ 0.2-0.3: Output plausible but slightly unsupported (review)
- E ≈ 0.4-0.6: Output potentially diverges from context (possible hallucination)
- E ≈ 0.7-1.0: Output contradicts or unsupported by context (hallucination)

**Business impact:**
- Financial RAG: High energy scores = incorrect loan decisions or compliance violations
- Legal discovery: High energy scores = discovery errors, litigation risk
- Medical systems: High energy scores = patient harm, liability

**How to use:**
```python
# Single call
result = compare(context="Apple revenue was $391B", 
                answer="Apple revenue was $450B", 
                use_nli=True)
                
if result.energy_score > 0.4:
    log_for_review(result)  # Manual verification needed
    
if result.energy_score > 0.6:
    block_response()  # Too risky to output
```

**Compliance mapping:** EU AI Act Article 15 (Accuracy) - proves system detects and flags inaccurate outputs.

---

### 2. Contradiction Rate

**What it measures:** Percentage of outputs flagged as contradicting source material.

**Calculation:**
```
contradiction_rate = (num_contradictions / total_outputs) × 100%

Where contradiction = energy_score > threshold (default 0.4)
```

**Interpretation:**
- 0-1%: Excellent grounding, expected for production systems
- 1-5%: Acceptable, but warrants monitoring
- 5-10%: Concerning, investigate source data quality
- >10%: High risk, do not deploy

**Example:**
```
Test 1000 RAG outputs from your knowledge base
- 995 outputs grounded (energy < 0.4)
- 5 outputs questionable (0.4 < energy < 0.6)
- 0 outputs contradictory (energy > 0.6)

Contradiction rate = 0% at strict threshold ✓ PASS
```

**How to improve:**
- Review the 5 questionable outputs manually
- Check if source data has errors
- Adjust retrieval ranking (maybe wrong documents retrieved)
- Increase context size for prompt

**Compliance mapping:** EU AI Act Article 13 (Documentation) - required to document error rates in instructions.

---

### 3. Grounding Verification

**What it measures:** Whether output terms appear in source material.

**Calculation:**
```
grounding_score = (unique_terms_in_context ∩ unique_terms_in_answer) / 
                  (unique_terms_in_context ∪ unique_terms_in_answer)

Score range: 0-1 (0 = no overlap, 1 = perfect overlap)
```

**Interpretation:**
- >0.7: Output is grounded, uses source material terms
- 0.4-0.7: Some grounding, but introduces new concepts (may be synthesis)
- <0.4: Little overlap, potential hallucination

**Why it matters:**
RAG systems should primarily use terms from retrieved documents. If output introduces entirely new terminology, it's generating rather than retrieving.

**Example:**
```
Document: "Tesla stock rose 12% due to strong earnings"
Output: "Tesla's valuation increased significantly based on financial performance"

Grounding: 0.33 (only "Tesla" overlaps)
Verdict: Output is plausible synthesis, but heavily rephrased. 
Review needed if this is a Q&A or summarization system.
```

---

## Pipeline Reliability Metrics

### 4. Consistency Score

**What it measures:** How stable outputs are when given identical inputs.

**Calculation:**
```
For N identical prompt calls:
  responses = [response_1, response_2, ..., response_N]
  
  # Compute pairwise semantic similarity
  similarities = []
  for i in range(N):
    for j in range(i+1, N):
      sim = cosine_similarity(embedding(responses[i]), embedding(responses[j]))
      similarities.append(sim)
  
  consistency_score = mean(similarities)  # 0-1 scale
```

**Interpretation:**
- 0.90-1.00: Highly consistent, near-identical outputs ✓✓✓
- 0.80-0.89: Consistent, acceptable variation for creative tasks
- 0.70-0.79: Moderate consistency, watch for degradation
- 0.50-0.69: Low consistency, unpredictable behavior
- <0.50: Very low consistency, production risk 

**Why it matters:**
Production systems must be reliable. If identical requests get wildly different responses, users lose trust. Exception: systems designed for creativity (storytelling) can tolerate 0.70-0.80 consistency.

**Example:**
```
Query: "What is our return policy?"

Trial 1: "Returns accepted within 30 days with receipt"
Trial 2: "We accept returns within 30 days of purchase"
Trial 3: "30-day return window with proof of purchase"
Trial 4: "Return policy: 30 days. Requires receipt."

All trials convey same information → consistency ~0.92 ✓
Safe for deployment.

VERSUS

Trial 1: "Returns accepted within 30 days with receipt"
Trial 2: "We don't accept returns"
Trial 3: "Return window: 60 days"
Trial 4: "No returns after opening"

Wild variation → consistency ~0.35 
Dangerous for customer service.
```

**SLA Guidelines:**
| Use Case | Min Consistency |
|----------|-----------------|
| Customer service | 0.90 |
| Q&A systems | 0.85 |
| Summarization | 0.80 |
| Content generation | 0.75 |
| Creative writing | 0.70 |

**Compliance mapping:** EU AI Act Article 15 (Robustness) - demonstrates system behaves predictably.

---

### 5. Consistency Drift

**What it measures:** Whether consistency degrades over time (indicator of model degradation or cache issues).

**Calculation:**
```
# Measure consistency in batches over time
batch_1_consistency = 0.92
batch_2_consistency = 0.88
batch_3_consistency = 0.84
batch_4_consistency = 0.79

drift_rate = (final - initial) / num_batches
           = (0.79 - 0.92) / 4
           = -0.0325 per batch (~3.25% decrease per 20 calls)
```

**Red flag thresholds:**
- Drift < -2% per 20 calls: Investigation required
- Drift < -5% per 20 calls: Critical issue, stop deployment

**Why it matters:**
Models can degrade over time due to:
- API changes (provider updates model version)
- Cache pollution (incorrect documents retrieved)
- System exhaustion (running 24/7 without restart)
- Prompt injection (adversarial inputs change behavior)

**What to do:**
```python
# Monitor in production
if consistency_drift < -0.02:
    alert("Consistency degrading")
    # Action: Clear cache, restart, or rollback model version
```

**Compliance mapping:** EU AI Act Article 8 (Risk Assessment) - demonstrates ongoing monitoring capability.

---

## Latency Metrics

### 6. Mean Latency

**What it measures:** Average response time in seconds.

**Calculation:**
```
Collect latencies: [0.45, 0.52, 0.41, 0.89, 0.48, ...]
mean_latency = sum(latencies) / count(latencies)
```

**Interpretation:**
- <0.5s: Excellent, near-instantaneous
- 0.5-2s: Good for most applications
- 2-5s: Acceptable for complex queries
- 5-10s: Slow but tolerable
- >10s: Likely to frustrate users

**Example:**
```
Model: Claude 3.5 Sonnet
Mean latency: 1.2 seconds

What does this mean?
- On average, users wait 1.2s for a response
- Good for interactive applications
- Acceptable for batch processing
```

**Why not just use mean?**
Mean is misleading. If 19 requests complete in 0.5s and 1 request takes 20s, mean = 1.45s. But users see the 20s wait.
→ Always look at **percentiles** (P95, P99), not just mean.

---

### 7. Latency Percentiles (P50, P95, P99)

**What it measures:** Distribution of response times, not just average.

**Calculation:**
```
Sort all latencies: [0.41, 0.45, 0.48, 0.52, ..., 8.9]

P50 (50th percentile / median) = 0.48s
  → 50% of requests faster, 50% slower

P95 (95th percentile) = 2.1s
  → 95% of requests faster than 2.1s
  → 5% of requests slower than 2.1s

P99 (99th percentile) = 5.3s
  → 99% of requests faster than 5.3s
  → 1% of requests slower than 5.3s
```

**Interpretation (production SLA):**
- P95 < 1s: Excellent, near-real-time
- P95 < 2s: Good for most interactive apps
- P95 < 5s: Acceptable with patience
- P95 > 10s: May lose users due to timeout
- P99 > 30s: Likely to cause cascading failures

**Why percentiles matter:**
```
Two pipelines, both with mean=2s:

Pipeline A:
- 100 requests: all complete in 1.8-2.2s
- P95 = 2.1s ✓ Predictable

Pipeline B:
- 95 requests: complete in 0.1s
- 4 requests: complete in 15-20s
- P95 = 0.1s (misleading!)
- P99 = 18s (actual tail behavior)
- Mean = 2s (misleading!)
```

**Setting SLA targets:**
```python
config = {
    'sla_p95_seconds': 2.0,   # 95% of requests < 2s
    'sla_p99_seconds': 5.0,   # 99% of requests < 5s
}

# Assessment checks
if result['p95_latency'] > 2.0:
    print("   P95 exceeds SLA")
    print(f"  Target: 2.0s, Actual: {result['p95_latency']:.2f}s")
    print("  Action: Optimize pipeline or provision more resources")
```

**Compliance mapping:** EU AI Act Article 13 (Documentation) - required to document expected processing times.

---

### 8. Latency Variability (Std Dev, Coefficient of Variation)

**What it measures:** Consistency of response times.

**Calculation:**
```
Standard deviation: σ = sqrt(sum((x - mean)² / n))

Coefficient of Variation: CV = σ / mean

Interpretation:
- CV < 0.1: Very stable latency
- CV 0.1-0.3: Acceptable variation
- CV > 0.5: High variability, unpredictable
```

**Example:**
```
Pipeline A:
Mean = 1.0s, Std Dev = 0.05s
CV = 0.05 ✓ Stable
→ Most requests complete in 0.95-1.05s

Pipeline B:
Mean = 1.0s, Std Dev = 0.8s
CV = 0.8 - Unstable
→ Requests vary wildly: some 0.1s, some 5s+

Both have same mean, but completely different user experience.
```

**Why it matters for production:**
Users dislike unpredictability more than consistent slowness. A pipeline that's always 2s is better than one averaging 1s but sometimes taking 10s.

**Red flags:**
```
If CV > 0.5 or std > mean:
  → Investigate infrastructure/networking issues
  → Check for contention, resource limits
  → Monitor for provider API degradation
```

---

## Output Quality Metrics

### 9. Output Length (Token and Word Count)

**What it measures:** How long are generated responses?

**Calculation:**
```
For each response:
  token_count = len(tokenizer.encode(response))
  word_count = len(response.split())
  char_count = len(response)

Aggregate across N responses:
  mean_tokens = sum(tokens) / N
  std_tokens = sqrt(sum((x - mean)² / N))
  min_max_tokens = (min, max)
```

**Why it matters:**
```
Suspicious patterns:

PATTERN 1: All outputs exactly 2048 tokens
  → Model is truncating at max_tokens limit
  → No outputs are complete

PATTERN 2: Output length identical across trials (std=0)
  → Model is repeating same output verbatim
  → Or max_tokens is extremely restrictive

PATTERN 3: Natural variation in length (std > 0)
  → Healthy, different topics have different lengths
```

**Example:**
```
Task: Summarize financial reports

GOOD:
Mean length: 287 tokens (appropriate for summary)
Std dev: 45 tokens (natural variation)
Range: 180-410 tokens

Interpretation: Different reports have different summary lengths.
Natural behavior ✓

BAD:
Mean length: 2048 tokens (suspicious)
Std dev: 0 tokens (identical)
Range: 2048-2048 tokens

Interpretation: All outputs are exactly 2048 tokens.
Likely truncation issue. Check max_tokens setting 
```

**Compliance mapping:** EU AI Act Article 15 (Quality) - demonstrates outputs aren't truncated/incomplete.

---

### 10. Semantic Diversity

**What it measures:** How different are outputs for identical prompts?

**Calculation:**
```
For N identical prompts, collect N responses:
  responses = [response_1, response_2, ..., response_N]
  embeddings = [embed(r1), embed(r2), ..., embed(rN)]

# Compute pairwise distances
diversity_scores = []
for i in range(N):
  for j in range(i+1, N):
    distance = cosine_distance(embeddings[i], embeddings[j])
    # distance: 0 = identical, 1 = completely different
    diversity_scores.append(distance)

semantic_diversity = mean(diversity_scores)  # 0-1 scale
```

**Interpretation:**
- 0.0-0.2: Outputs nearly identical (low diversity)
- 0.2-0.5: Some variation but mostly same content
- 0.5-0.7: Healthy variation, different angles
- 0.7-0.9: High diversity, very different outputs
- 0.9-1.0: Completely different (may indicate instability)

**Why it matters:**
```
Example: Customer service chatbot asked "What are your hours?"

Low diversity (0.15):
Trial 1: "We're open 9am-5pm Monday-Friday"
Trial 2: "Open 9-5, Mon-Fri"
Trial 3: "9am to 5pm, Mon-Fri"
All essentially identical ✓ Good for customer service

High diversity (0.85):
Trial 1: "Store hours are 9am-5pm weekdays"
Trial 2: "We close on weekends, operating 9-5"
Trial 3: "Available Mon-Fri between 9 and 5"
Trial 4: "Open all week except Saturday and Sunday, 9-5"

Different wordings but same info. Is this concerning?
Not necessarily—it's just varied expression.

VERSUS actual high diversity (hallucination):
Trial 1: "We're open 9am-5pm"
Trial 2: "We're open 24/7"
Trial 3: "We're closed on Tuesdays"
Trial 4: "We only open weekends"

These contradict each other - Serious problem
(Different semantic diversity metric would catch this)
```

**Guidelines by use case:**
| Use Case | Target Diversity |
|----------|-----------------|
| Customer service | 0.3-0.5 (consistent) |
| Q&A systems | 0.4-0.6 (varied phrasing) |
| Content generation | 0.6-0.8 (fresh outputs) |
| Creative writing | 0.7-0.9 (different stories) |

**Compliance mapping:** EU AI Act Article 15 (Quality) - shows system produces varied, non-deterministic outputs (positive for fairness).

---

### 11. Repetition Score

**What it measures:** Degree of phrase repetition within outputs.

**Calculation:**
```
For each response:
  trigrams = extract_all_3word_phrases(response)
  # e.g., ["the quick brown", "quick brown fox", "brown fox jumps"]
  
  trigram_frequencies = count_occurrences(trigrams)
  # e.g., {"the quick brown": 1, "quick brown fox": 2, ...}
  
  max_frequency = max(trigram_frequencies.values())
  total_trigrams = len(trigrams)
  
  repetition_penalty = max_frequency - 1  # How much it repeats
  repetition_score = 1.0 - (repetition_penalty / total_trigrams)
  
  # Result: 1.0 = no repetition, 0.0 = very repetitive
```

**Interpretation:**
- 0.90-1.00: No repetitive phrases, natural language ✓
- 0.75-0.89: Minimal repetition, acceptable
- 0.50-0.74: Noticeable repetition, concerning
- 0.30-0.49: Heavy repetition, possible loop
- <0.30: Extreme repetition, hallucination indicator 

**Example:**
```
GOOD REPETITION SCORE (0.94):
"The company reported strong earnings. Revenue increased 15%. 
Profitability grew significantly. Market share expanded. 
Competitive position improved. Strategic initiatives paid off."

Each idea expressed once with natural variation ✓

BAD REPETITION SCORE (0.23):
"The company is doing well. The company is profitable. 
The company is growing. The company is strong. 
The company is the best. The company will succeed. 
The company has success. The company is good."

Repetitive phrase: "The company is..." 
```

**Why it matters:**
Repetition often indicates:
- Model is stuck in a loop
- Temperature too low (same outputs)
- Prompt is confusing the model
- Context window is too small (model forgets context)

**What to do:**
```python
if result['repetition_score'] < 0.75:
    # Investigate
    print("High repetition detected")
    
    # Potential fixes:
    # 1. Increase temperature (0.7-0.9)
    # 2. Add max_tokens limit to prevent loops
    # 3. Check if context is coherent
    # 4. Verify knowledge base doesn't have duplicate docs
```

**Compliance mapping:** EU AI Act Article 22 (Human Rights) - low repetition helps prevent biased/discriminatory outputs.

---

## Robustness Metrics

### 12. Error Rate

**What it measures:** Percentage of requests that fail.

**Calculation:**
```
For N total requests:
  successful_requests = N - (failures + timeouts + exceptions)
  error_rate = (failures + timeouts + exceptions) / N × 100%
```

**Interpretation:**
- 0.0-0.5%: Excellent reliability ✓
- 0.5-2%: Acceptable, monitor
- 2-5%: Concerning, investigate
- >5%: Production not ready 

**Example:**
```
Test 1000 requests:
  950 successful
  40 rate-limited errors
  7 timeout errors
  3 invalid input exceptions

Error rate = (40 + 7 + 3) / 1000 = 5% 

Issues to investigate:
- Rate limiting: Use exponential backoff, batch requests
- Timeouts: Reduce request complexity, increase timeout
- Exceptions: Validate input, handle edge cases
```

**Why it matters:**
Every error is a customer-facing failure. In production:
- 1% error rate = 1 in 100 requests fails
- With 1M requests/day = 10,000 failures
- Each failure = frustrated user, support ticket, retention risk

**SLA guidelines:**
| Service Type | Max Error Rate |
|--------------|---|
| Financial transaction | 0.001% (1 in 100k) |
| Healthcare system | 0.01% (1 in 10k) |
| General enterprise | 0.1% (1 in 1k) |
| Non-critical service | 1% (1 in 100) |

**Compliance mapping:** EU AI Act Article 15 (Robustness) - documents system's resistance to errors.

---

### 13. Timeout Rate

**What it measures:** Percentage of requests exceeding time limit.

**Calculation:**
```
For N total requests:
  timeout_count = requests where (response_time > timeout_threshold)
  timeout_rate = (timeout_count / N) × 100%
```

**Interpretation:**
- <0.1%: Excellent latency stability
- 0.1-1%: Acceptable, occasional slow requests
- 1-5%: Concerning, infrastructure issues
- >5%: Severe, likely to cause cascading failures

**Why it matters:**
Timeouts break the entire system:
```
Example: User-facing web app with 5s timeout

If 2% timeout:
- User clicks button
- After 5s, no response
- User clicks again
- After 5s, still no response
- User leaves, frustrated

With 2% timeout rate across 1000 concurrent users:
- 20 users hit timeout each 5s
- Those 20 users retry
- Load increases further
- More timeouts cascade
- System appears "down" even though it's working
```

**What to do:**
```python
if timeout_rate > 1%:
    # Actions:
    # 1. Increase timeout threshold (if safe)
    # 2. Optimize pipeline (reduce complexity)
    # 3. Scale infrastructure (add more replicas)
    # 4. Investigate provider: API degradation?
    
    # Monitor: log every timeout for root cause
```

**Compliance mapping:** EU AI Act Article 8 (Risk Assessment) - demonstrates ongoing capacity monitoring.

---

### 14. Exception Distribution

**What it measures:** Types and frequencies of errors.

**Calculation:**
```
exception_counts = {
    "TimeoutError": 15,
    "RateLimitError": 8,
    "ValueError": 2,
    "ConnectionError": 1,
    "Other": 4
}

# Calculate percentages
for exception_type, count in exception_counts.items():
    percentage = (count / total_exceptions) × 100%
```

**Interpretation:**
Healthy exception distribution:
- Most exceptions are provider-specific (RateLimitError, ConnectionError)
- Few ValueError exceptions (good input validation)
- Few ContentFilterError exceptions (expected for safety)

Unhealthy exception distribution:
- High ValueError rate (→ validate inputs better)
- High ContentFilterError rate (→ review prompts)
- Constantly new exception types (→ system instability)

**Example:**
```
GOOD DISTRIBUTION:
TimeoutError: 60% → Normal, occasional latency spikes
RateLimitError: 30% → Expected during peak load
ValueError: 5% → Few malformed inputs
Other: 5% → Random provider issues

INTERPRETATION: Expected error distribution, no concerns ✓

BAD DISTRIBUTION:
ValueError: 40% → Why so many malformed inputs?
OutOfMemory: 25% → System running out of memory?
KeyError: 20% → Code bugs?
TimeoutError: 10% → Latency problems
RateLimitError: 5% → Not hitting rate limits?

INTERPRETATION: System is unstable, bugs present 
```

**What to do:**
```python
# Monitor exception distribution
if exception_distribution[ValueError] > 10%:
    print("Too many ValueError - review input validation")
    
if new_exception_types_detected():
    print("New exception detected - investigate immediately")
    
# Alert if distribution changes unexpectedly
if distribution_changed_significantly():
    alert("Exception distribution changed - possible regression")
```

**Compliance mapping:** EU AI Act Article 12 (Record-Keeping) - enables post-market monitoring of failure modes.

---

## Advanced Statistical Metrics

### 15. Confidence Intervals (95% CI)

**What it measures:** Uncertainty bounds around measurements.

**Calculation:**
```
Given measurements: [0.82, 0.85, 0.81, 0.87, 0.83, ...]

mean = 0.846
std = 0.028
n = 20 samples

Standard Error: SEM = std / sqrt(n) = 0.028 / sqrt(20) = 0.0063

95% Confidence Interval:
  CI_lower = mean - 1.96 × SEM = 0.846 - 0.0123 = 0.834
  CI_upper = mean + 1.96 × SEM = 0.846 + 0.0123 = 0.858

Interpretation:
  "We are 95% confident the true value is between 0.834 and 0.858"
```

**Why it matters:**
Never report a single number without bounds.

```
WRONG: "Consistency is 0.85"
RIGHT: "Consistency is 0.85 (95% CI: 0.82-0.88)"

With bounds, you know:
- How certain you are
- Whether to trust the measurement
- How many trials you need for certainty
```

**Using confidence intervals:**
```python
# SLA check with confidence
sla_target = 0.85

if ci_lower > sla_target:
    print("✓ PASS: Definitely meets SLA (95% confident)")
elif ci_upper < sla_target:
    print("✗ FAIL: Definitely below SLA (95% confident)")
else:
    print("INCONCLUSIVE: Need more trials")
    print("Run 50+ trials instead of 20")
```

**Compliance mapping:** EU AI Act Article 15 (Documentation) - supports defensible accuracy claims with confidence bounds.

---

### 16. Cohen's d (Effect Size)

**What it measures:** Statistical significance of difference between two measurements.

**Calculation:**
```
Given two pipelines' consistency scores:
  Pipeline A: [0.85, 0.87, 0.86, 0.84, ...]  mean=0.852, std=0.018
  Pipeline B: [0.78, 0.79, 0.80, 0.77, ...]  mean=0.785, std=0.014

Pooled standard deviation:
  σ_pooled = sqrt((σ_A² + σ_B²) / 2)
           = sqrt((0.018² + 0.014²) / 2)
           = 0.0162

Cohen's d:
  d = (mean_A - mean_B) / σ_pooled
    = (0.852 - 0.785) / 0.0162
    = 4.14

Interpretation:
  d < 0.2: Negligible difference (no practical significance)
  0.2 ≤ d < 0.5: Small difference (some significance)
  0.5 ≤ d < 0.8: Medium difference (important)
  d ≥ 0.8: Large difference (very important)
  
  In this case: d=4.14 → LARGE DIFFERENCE, Pipeline A much better
```

**Why it matters:**
Statistical significance ≠ practical significance.

```
Example:
- Pipeline A consistency: 0.8502 (95% CI: 0.8500-0.8504)
- Pipeline B consistency: 0.8501 (95% CI: 0.8499-0.8503)

Statistically significant difference (p<0.05)? Maybe.
Practically significant? NO—difference is 0.0001

Cohen's d would show negligible effect (d<0.1)
→ "Both pipelines are effectively equivalent"
```

**When to use:**
```python
# Comparing two production setups
old_pipeline_consistency = 0.847
new_pipeline_consistency = 0.853

cohens_d = calculate_cohen_d(old_scores, new_scores)

if cohens_d < 0.2:
    print("No meaningful difference - stick with current setup")
elif cohens_d >= 0.5:
    print("Meaningful improvement - worth migration cost")
else:
    print("Small improvement - run cost-benefit analysis")
```

**Compliance mapping:** EU AI Act Article 8 (Risk Assessment) - demonstrates rigorous statistical assessment.

---

### 17. Coefficient of Variation (CV)

**What it measures:** Relative variability (normalized by mean).

**Calculation:**
```
CV = std_dev / mean

Interpretation:
  CV < 0.1: Low relative variability (stable)
  CV 0.1-0.3: Moderate variability
  CV > 0.5: High relative variability (unstable)
```

**Why use CV instead of std dev?**
```
Metric A: mean=100, std=5  →  absolute variability seems small
Metric B: mean=10, std=5   →  absolute variability seems same

But relatively:
Metric A: CV = 5/100 = 0.05 (only 5% variation) ✓
Metric B: CV = 5/10 = 0.50 (50% variation!) ✗

Same std dev, very different stability.
CV makes comparisons meaningful.
```

**Use case:**
```python
# Compare latency across different request sizes
small_requests: mean=0.5s, std=0.05s  → CV=0.1
large_requests: mean=2.0s, std=0.3s   → CV=0.15

Interpretation: Large requests are slightly more variable,
but both are acceptably stable (CV < 0.2)
```

---

## Interpretation Guidelines

### Decision Tree: Should We Deploy?

```
START: Pipeline Assessment Results

├─ HALLUCINATION METRICS
│  ├─ Contradiction rate > 5%?
│  │  ├─ YES → STOP: Unacceptable hallucination rate
│  │  │         Action: Review RAG retrieval, check source data
│  │  └─ NO → Continue
│  │
│  └─ Energy score > 0.4 (average)?
│     ├─ YES → CAUTION: Outputs not well-grounded
│     │        Action: Increase grounding checks, manual review
│     └─ NO → Continue
│
├─ CONSISTENCY METRICS
│  ├─ Consistency < 0.75 (for use case)?
│  │  ├─ YES → STOP: Outputs too erratic
│  │  │         Action: Increase temperature, debug model behavior
│  │  └─ NO → Continue
│  │
│  └─ Consistency drift < -2% per batch?
│     ├─ YES → WARNING: Degradation detected
│     │        Action: Investigate cause, set up monitoring
│     └─ NO → Continue
│
├─ LATENCY METRICS
│  ├─ P95 > SLA target?
│  │  ├─ YES → CAUTION: May miss SLA
│  │  │        Action: Optimize or provision more resources
│  │  └─ NO → Continue
│  │
│  └─ Timeout rate > 2%?
│     ├─ YES → WARNING: Cascading failure risk
│     │        Action: Increase timeout, optimize pipeline
│     └─ NO → Continue
│
├─ OUTPUT QUALITY METRICS
│  ├─ Output length always exactly 2048?
│  │  ├─ YES → STOP: Truncation issue
│  │  │         Action: Check max_tokens setting
│  │  └─ NO → Continue
│  │
│  └─ Semantic diversity < 0.3?
│     ├─ YES → WARNING: Outputs identical/stuck
│     │        Action: Increase temperature, check prompt
│     └─ NO → Continue
│
├─ ROBUSTNESS METRICS
│  ├─ Error rate > SLA threshold?
│  │  ├─ YES → STOP: Too many failures
│  │  │         Action: Fix bugs, handle edge cases
│  │  └─ NO → Continue
│  │
│  └─ Timeout rate > 5%?
│     ├─ YES → STOP: Infrastructure can't handle load
│     │         Action: Scale up or reduce complexity
│     └─ NO → Continue

END: ✓ READY FOR PRODUCTION (with specific monitoring)
```

### Red Flags (Stop Deployment)

| Metric | Red Flag | Action |
|--------|----------|--------|
| Contradiction Rate | > 5% | Review knowledge base, RAG pipeline |
| Consistency | < 0.70 (or use-case minimum) | Debug model, check prompt |
| Error Rate | > SLA threshold (usually 1-5%) | Fix bugs, validate inputs |
| Timeout Rate | > 2% | Optimize or scale |
| Output Length | Always exactly max_tokens | Check max_tokens setting |
| Exception Count | Growing over time | Monitor for memory leaks, provider issues |

### Green Flags (Safe to Deploy)

| Metric | Green Flag | Implication |
|--------|-----------|-------------|
| Contradiction Rate | < 1% | Strong hallucination detection |
| Consistency | > 0.85 (for most use cases) | Reliable, predictable behavior |
| P95 Latency | < 2s (or your SLA) | Meets performance target |
| Error Rate | < 0.1% | Robust error handling |
| Semantic Diversity | > 0.7 | Outputs are naturally varied |
| Repetition Score | > 0.85 | No problematic loops |

---

## Compliance Mapping

How metrics support EU AI Act requirements:

### Article 8: High-Risk Systems Risk Management
- ✓ **Consistency metrics**: Demonstrates ongoing behavioral monitoring
- ✓ **Error rate & robustness**: Proves failure mode documentation
- ✓ **Latency metrics**: Shows SLA management

**Documentation artifact:**
```
"System is assessed for consistency (mean: 0.87, 95% CI: 0.84-0.90) 
and error rate (0.3%) before deployment and quarterly thereafter."
```

### Article 13: Technical Documentation
- ✓ **All metrics**: Required to document expected performance
- ✓ **Latency percentiles**: Document "expected processing times"
- ✓ **Error rates**: Document "failure modes and mitigation"

**Documentation artifact:**
```
"Expected latency: P95 < 2.0 seconds, P99 < 5.0 seconds
Error rate: < 0.5% | Supported by testing across 2000 scenarios"
```

### Article 15: Accuracy, Robustness, Cybersecurity
- ✓ **Hallucination metrics**: Proves "appropriate levels of accuracy"
- ✓ **Output quality metrics**: Proves "resilience regarding errors"
- ✓ **Robustness metrics**: Demonstrates "cybersecurity measures"

**Documentation artifact:**
```
"System achieves 99% accuracy on grounded outputs (confidence interval: 98.2%-99.8%),
measured via NLI contradiction detection on 500 annotated examples."
```

### Article 19: Automatically Generated Logs
- ✓ **All metrics**: Enable 6+ month compliance log retention
- ✓ **Exception distribution**: Tracks "situations that may result in risk"

**Implementation:**
```python
# Log every assessment result
logger.info(f"Pipeline assessment completed", extra={
    "consistency": 0.874,
    "p95_latency": 1.95,
    "error_rate": 0.003,
    "contradiction_rate": 0.001,
    "timestamp": datetime.now().isoformat(),
    "model_version": "claude-3.5-sonnet-20250101"
})
```

### Article 22: Human Rights and Non-Discrimination
- ✓ **Semantic diversity**: Low diversity → risk of discriminatory patterns
- ✓ **Output length**: Consistent length → no unfair content truncation

**Risk assessment:**
```
"If semantic diversity < 0.5, system flags outputs for human review
to prevent discriminatory pattern emergence."
```

---

## Common Metric Combinations

### For RAG Systems
```
Key metrics:
1. Contradiction rate < 1%
2. Energy score < 0.4
3. Grounding score > 0.6
4. Consistency > 0.80
5. Error rate < 0.5%

Threshold: All must PASS before production
```

### For Customer Service Chatbots
```
Key metrics:
1. Consistency > 0.90 (must be reliable)
2. P95 latency < 2s (users expect fast response)
3. Error rate < 0.1% (every error = support ticket)
4. Semantic diversity 0.4-0.6 (varied but on-topic)
5. Repetition score > 0.85 (not repetitive)

Threshold: All must PASS before production
```

### For Content Generation
```
Key metrics:
1. Output quality: Semantic diversity > 0.7 (variety matters)
2. Repetition score > 0.80 (no loops)
3. Latency: P95 < 5s (users tolerate slower generation)
4. Error rate < 1% (some failures acceptable)
5. Consistency 0.70-0.80 (variety is expected)

Threshold: Focus on diversity and repetition
```

### For High-Stakes (Financial/Medical)
```
Key metrics:
1. Contradiction rate < 0.1% (zero hallucination tolerance)
2. Consistency > 0.95 (rock solid reliability)
3. Error rate < 0.01% (near-perfect)
4. P99 latency < 10s (worst-case acceptable)
5. Grounding score > 0.8 (strong grounding required)
6. 95% confidence intervals on all measurements

Threshold: ALL must PASS + manual audit sample
```

---

## Metrics Calculation Reference (for implementation)

### Percentile Calculation
```
percentile_k = value at position ceil((k/100) × (n+1)) in sorted array

Example: P95 with 100 values
  Position = ceil((95/100) × 101) = 96th value in sorted array
```

### Cosine Similarity / Distance
```
similarity(u, v) = (u · v) / (||u|| × ||v||)
distance(u, v) = 1 - similarity(u, v)

Range: distance = 0 (identical) to 1 (completely different)
```

### Standard Deviation
```
σ = sqrt(sum((x_i - mean)²) / n)
```

### Confidence Interval (95%)
```
CI = mean ± 1.96 × (std / sqrt(n))

where 1.96 is the z-score for 95% confidence
```

### Cohen's d (Effect Size)
```
d = (mean_1 - mean_2) / σ_pooled

where σ_pooled = sqrt((σ_1² + σ_2²) / 2)
```

---

## What's NOT Measured (and why)

### Not Measured: Model Rankings
**Why:** CERT is NOT a benchmarking tool. It measures whether YOUR pipeline meets YOUR requirements, not whether Model A is better than Model B.

### Not Measured: Business ROI
**Why:** CERT measures operational metrics. Your business value depends on your specific use case (cost savings, user satisfaction, compliance). Metrics alone don't determine ROI.

### Not Measured: Fairness / Bias
**Why:** Requires domain-specific evaluation beyond CERT's scope. However, CERT's diversity metrics support fairness monitoring.

### Not Measured: Safety / Alignment
**Why:** Beyond scope. However, robustness and grounding metrics provide partial safety signals.

---

## Getting Help

### Interpreting Your Results

**Step 1:** Identify your use case above (RAG, chatbot, content gen, high-stakes)

**Step 2:** Check if your metrics exceed thresholds

**Step 3:** Follow recommended actions for any red flags

**Step 4:** If uncertain, consult Decision Tree above

### Improving Your Pipeline

| Problem | Likely Cause | Fix |
|---------|--------------|-----|
| High contradiction rate | Poor RAG retrieval | Improve document ranking, expand context |
| Low consistency | Prompt ambiguity | Clarify prompt, reduce temperature |
| High latency P99 | Outlier requests | Optimize complex queries, add caching |
| Low semantic diversity | Max_tokens too restrictive | Increase max_tokens, reduce frequency_penalty |
| High repetition | Model stuck in loop | Increase temperature, add diverse examples |
| High error rate | Unhandled edge cases | Add validation, error handling |

---

## References

- EU AI Act: https://artificialintelligenceact.eu/
- Article 15 (Accuracy): https://artificialintelligenceact.eu/article/15/
- Article 13 (Documentation): https://artificialintelligenceact.eu/article/13/
- MNLI Dataset: https://cims.nyu.edu/~sbowman/multinli/
- Effect Sizes (Cohen's d): https://en.wikipedia.org/wiki/Effect_size
