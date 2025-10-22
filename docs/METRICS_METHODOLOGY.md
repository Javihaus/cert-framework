# CERT Benchmark Metrics: Methodology & Interpretation

This document describes the mathematical foundations, implementation details, and interpretation guidelines for each metric in the CERT benchmarking framework.

---

## 1. Consistency Metric

### Purpose
Measures behavioral reliability by quantifying how similar a model's outputs are across multiple trials with the same prompt.

### Methodology

**Embedding-Based Similarity**
- Uses sentence-transformers to encode responses into dense vectors
- Calculates pairwise cosine distances between all response embeddings
- Lower distance = more similar responses

**Consistency Score Calculation**
```
distances = pairwise_cosine_distance(embeddings)
mean_distance = mean(distances)
std_distance = std(distances)

consistency_score = max(0, 1 - (std_distance / mean_distance))
```

**Range**: 0.0 to 1.0
- 1.0 = Perfectly consistent (identical responses)
- 0.7-0.9 = High consistency (good for production)
- 0.5-0.7 = Moderate consistency
- <0.5 = Low consistency (non-deterministic behavior)

### Interpretation

| Score | Interpretation | Recommendation |
|-------|----------------|----------------|
| >0.9 | Highly deterministic | Safe for regulated workflows |
| 0.7-0.9 | Reliably consistent | Acceptable for production |
| 0.5-0.7 | Moderate variance | Review temperature/sampling |
| <0.5 | High variance | May indicate model instability |

### Use Cases
- EU AI Act compliance (behavioral reliability)
- Regression testing after model updates
- Comparing temperature/sampling effects
- Identifying non-deterministic failure modes

---

## 2. Performance Metric

### Purpose
Assesses output quality across diverse prompts by evaluating semantic relevance, completeness, and structure.

### Methodology

**Three-Component Scoring**

1. **Semantic Relevance (50% weight)**
   ```
   prompt_embedding = encode(prompt)
   response_embedding = encode(response)
   relevance = cosine_similarity(prompt_embedding, response_embedding)
   relevance_normalized = (relevance + 1) / 2  # Convert [-1,1] to [0,1]
   ```

2. **Completeness (30% weight)**
   ```
   word_count = len(response.split())
   completeness = min(1.0, word_count / 200)  # 200 words = excellent
   ```

3. **Structure (20% weight)**
   ```
   has_structure = 1.0 if any(['.', '\n', ':']) in response else 0.5
   ```

**Final Score**
```
performance_score = relevance * 0.5 + completeness * 0.3 + structure * 0.2
```

**Range**: 0.0 to 1.0

### Interpretation

| Score | Interpretation | Action |
|-------|----------------|--------|
| >0.8 | Excellent quality | Production-ready |
| 0.6-0.8 | Good quality | Acceptable for most use cases |
| 0.4-0.6 | Moderate quality | Refine prompts |
| <0.4 | Poor quality | Investigate model/prompt issues |

### Limitations
- Simple word-count completeness (not domain-aware)
- Structure detection is basic (presence vs quality)
- Semantic relevance depends on embedding model quality

---

## 3. Latency Metric

### Purpose
Measures response time characteristics for SLA planning and performance optimization.

### Methodology

**Statistical Analysis**
- Mean, standard deviation, min, max
- Percentiles: P50 (median), P95, P99

**Percentile Calculation**
```python
p50 = np.percentile(latencies, 50)  # Median
p95 = np.percentile(latencies, 95)  # 95% of requests faster than this
p99 = np.percentile(latencies, 99)  # 99% of requests faster than this
```

**Throughput (if token data available)**
```
tokens_per_second = total_tokens / total_time
```

### Interpretation

**P95 Latency** (most important for SLAs)
- <1s: Excellent for interactive use
- 1-3s: Acceptable for chatbots
- 3-5s: Suitable for batch processing
- >5s: May impact user experience

**Coefficient of Variation** (std / mean)
- <0.2: Predictable latency
- 0.2-0.5: Moderate variance
- >0.5: High variance (investigate)

### Use Cases
- Setting SLA targets
- Capacity planning
- Provider comparison
- Cost optimization (latency vs price trade-offs)

---

## 4. Output Quality Metric

### Purpose
Analyzes response characteristics including length, diversity, and repetition patterns.

### Methodology

**A. Length Analysis**
```
token_count = len(response.split()) * 1.3  # Approximation
word_count = len(response.split())
```

**B. Semantic Diversity**
```
embeddings = encode_all(responses)
pairwise_distances = pdist(embeddings, metric='cosine')
diversity_score = mean(pairwise_distances)  # Higher = more diverse
```

**C. Repetition Detection**
```
trigrams = extract_trigrams(response)
repeated_trigrams = count_repetitions(trigrams)
repetition_score = 1.0 - (repeated_trigrams / total_trigrams)
```

### Interpretation

**Semantic Diversity**
- >0.6: High diversity (creative responses)
- 0.3-0.6: Moderate diversity (consistent themes)
- <0.3: Low diversity (repetitive across prompts)

**Repetition Score**
- >0.9: Minimal repetition (good)
- 0.7-0.9: Some repetition (acceptable)
- <0.7: Significant repetition (investigate)

### Use Cases
- Detecting stuck/looping models
- Assessing response creativity
- Quality control for content generation
- Identifying overfitting to training data

---

## 5. Robustness Metric

### Purpose
Tracks error handling and production reliability by monitoring failures, timeouts, and exception patterns.

### Methodology

**Error Rate Calculation**
```
error_rate = (failed_trials / total_trials) * 100
timeout_rate = (timeout_trials / total_trials) * 100
```

**Exception Classification**
- TimeoutError: Request exceeded timeout
- RateLimitError: API rate limits hit
- AuthenticationError: Invalid API key
- ServerError: Provider-side failures
- ConnectionError: Network issues
- UnknownError: Unclassified errors

### Interpretation

| Error Rate | Status | Action |
|------------|--------|--------|
| 0% | Excellent | Production-ready |
| <5% | Good | Monitor for patterns |
| 5-15% | Concerning | Investigate error types |
| >15% | Critical | Address before production |

**Timeout Rate**
- Should be <2% in production
- High timeout rate indicates:
  - Aggressive timeout settings
  - Provider capacity issues
  - Network problems

### Use Cases
- Production health monitoring
- Provider reliability comparison
- SLA validation
- Incident investigation

---

## Statistical Confidence

### Minimum Sample Sizes

| Metric | Minimum Trials | Recommended |
|--------|---------------|-------------|
| Consistency | 10 | 20-50 |
| Performance | 5 | 15-30 |
| Latency | 10 | 30-100 |
| Output Quality | 10 | 20-50 |
| Robustness | 20 | 50-100 |

### Confidence Intervals

For means and percentiles, approximate 95% confidence intervals:
```
CI_95 = mean ± 1.96 * (std / sqrt(n))
```

---

## Reproducibility

### Random Seed
All metrics support random seed configuration for reproducible results:
```python
config = BenchmarkConfig(random_seed=42)
```

### Embedding Model
Default: `all-MiniLM-L6-v2` (lightweight, fast)

For higher accuracy:
```python
config = BenchmarkConfig(embedding_model_name='all-mpnet-base-v2')
```

### Temperature Effects
- Temperature 0.0: Maximum determinism (highest consistency)
- Temperature 0.7: Balanced (default)
- Temperature 1.0+: High creativity (lower consistency)

---

## Validation

All metrics include validation logic:
- Range checks (scores must be 0-1)
- Ordering constraints (min ≤ p50 ≤ p95 ≤ p99 ≤ max)
- Trial count verification
- Error rate bounds (0-100%)

Invalid results raise `ValueError` to prevent silent errors.

---

## References

1. **Sentence Transformers**: Reimers & Gurevych (2019) - Sentence-BERT
2. **Cosine Similarity**: Standard metric for semantic similarity
3. **Percentiles**: Standard practice in SRE/DevOps for latency analysis
4. **N-gram Analysis**: Standard NLP technique for repetition detection

---

## Future Enhancements

Planned for v1.2+:
- Cohen's d effect size for provider comparisons
- Bootstrap confidence intervals
- Multi-turn consistency analysis
- Token-level repetition analysis
- Cost-per-quality metrics
