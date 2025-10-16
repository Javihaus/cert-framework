# CERT Framework Examples

Examples showing how to test LLM systems for consistency and reliability.

## Quick Start
```bash
# Run pytest integration example
pytest examples/test_llm_consistency.py -v

# Run standalone examples
python examples/01_chatbot_consistency.py
python examples/02_rag_retrieval.py
python examples/03_model_regression.py
python examples/04_pytest_integration.py
```

## Examples

### 1. Chatbot Consistency (`01_chatbot_consistency.py`)
Tests whether a chatbot gives consistent answers to the same question.

**Problem**: LLMs are non-deterministic - same input, different outputs.

**Solution**: CERT validates outputs are semantically equivalent even when worded differently.

**Use when**:
- Building customer service chatbots
- Testing prompt engineering changes
- Validating temperature/sampling parameters

**Example output**:
```
✗ Found 1 inconsistent responses:
  run_5: 'We offer a 90-day refund window for all purchases.'
  Confidence: 62% (below threshold)
  → ISSUE: This response contradicts the baseline
```

### 2. RAG Retrieval Testing (`02_rag_retrieval.py`)
Tests whether RAG systems retrieve consistent documents for query variations.

**Problem**: Similar questions should retrieve similar documents, but don't always.

**Solution**: CERT validates retrieval consistency across paraphrased queries.

**Use when**:
- Building RAG/semantic search systems
- Testing embedding model quality
- Validating chunking strategies

**Example**:
```python
queries = [
    "What programming language is good for beginners?",
    "Which language should I learn first for coding?",
    "Best programming language for someone starting out?",
]
# All should retrieve similar documents
```

### 3. Model Regression Testing (`03_model_regression.py`)
Tests whether model upgrades break existing behavior.

**Problem**: Upgrading models (GPT-3.5→4, version bumps) can change outputs unpredictably.

**Solution**: CERT compares new model outputs against baseline test suite.

**Use when**:
- Deploying model upgrades
- A/B testing different models
- Validating fine-tuned models

**Example**:
```python
# Test that new model produces semantically equivalent outputs
old_output = "Q4 revenue increased 20% year-over-year to $10 million."
new_output = "The company's Q4 revenue reached $10M, a 20% increase YoY."
result = compare(old_output, new_output, threshold=0.85)
assert result.matched  # Should pass - same meaning, different wording
```

### 4. pytest Integration (`test_llm_consistency.py`)
Shows how to integrate CERT into your pytest test suite.

**Run with**: `pytest examples/test_llm_consistency.py -v`

**Use when**: You want LLM consistency testing in your CI/CD pipeline.

**Example**:
```python
def test_summarization_consistency(self, input_text):
    """Test that repeated summarizations are semantically equivalent."""
    output_1 = get_summarization_output(input_text, 1)
    output_2 = get_summarization_output(input_text, 2)

    result = compare(output_1, output_2, threshold=0.80)
    assert result.matched, f"Inconsistent (confidence: {result.confidence:.2f})"
```

### 5. Real LLM Testing (`05_real_llm_testing.py`)
Tests CERT with actual OpenAI or Anthropic API calls.

**Setup**:
```bash
# OpenAI
export OPENAI_API_KEY="your-key"
pip install openai

# OR Anthropic
export ANTHROPIC_API_KEY="your-key"
pip install anthropic

# Run
python examples/05_real_llm_testing.py
```

**Cost**: ~$0.001 per run (5 API calls)

**What it proves**:
- CERT validates real LLM non-determinism
- Framework catches inconsistent/wrong outputs
- Ready for production integration

**Use this when**: You want proof CERT works with real LLMs before integrating.

## Live OpenAI Integration

The examples use simulated outputs for zero-friction running. For live OpenAI integration:

```python
import openai
from cert import compare

def test_live_consistency():
    prompt = "Explain quantum computing in one sentence"

    response1 = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    response2 = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    output1 = response1.choices[0].message.content
    output2 = response2.choices[0].message.content

    result = compare(output1, output2)
    assert result.matched, "Inconsistent responses"
```

## Why These Examples Matter

LLM systems fail in production because of:
1. **Inconsistency**: Same input → different outputs
2. **Hallucination**: Outputs unrelated to inputs
3. **Regression**: Model upgrades break behavior

CERT catches these failures before production through systematic testing.

## Next Steps

- Add CERT to your test suite: `pip install cert-framework`
- Write consistency tests for your LLM application
- Run tests in CI/CD before deployments
- See full documentation: https://github.com/Javihaus/cert-framework
