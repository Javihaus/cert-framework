"""Example: Using measure() for text reliability measurement.

The measure() function combines semantic similarity, NLI (contradiction detection),
and grounding analysis to assess text reliability and similarity.
"""

import cert

# Example 1: Basic semantic comparison
print("=" * 60)
print("Example 1: Basic Semantic Comparison")
print("=" * 60)

text1 = "The company's revenue increased by 15% in Q4 2024."
text2 = "The organization saw a 15% growth in quarterly revenue for Q4 2024."

result = cert.measure(
    text1, text2,
    use_semantic=True,
    use_nli=False,
    use_grounding=False,
    threshold=0.7
)

print(f"Text 1: {text1}")
print(f"Text 2: {text2}")
print(f"\nMatched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Semantic Score: {result.semantic_score:.3f}")
print()


# Example 2: RAG hallucination detection
print("=" * 60)
print("Example 2: RAG Hallucination Detection")
print("=" * 60)

context = """
Apple Inc. reported revenue of $117.2 billion in Q1 2024,
representing a 2% increase year-over-year. iPhone sales
contributed $69.7 billion, while Services revenue reached
$23.1 billion.
"""

answer = "Apple's revenue in Q1 2024 was $150 billion with iPhone sales at $80 billion."

result = cert.measure(
    context, answer,
    use_semantic=True, semantic_weight=0.3,
    use_nli=True, nli_weight=0.5,
    use_grounding=True, grounding_weight=0.2,
    threshold=0.7
)

print(f"Context: {context.strip()}")
print(f"\nAnswer: {answer}")
print(f"\nMatched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Semantic Score: {result.semantic_score:.3f}")
print(f"NLI Score: {result.nli_score:.3f}")
print(f"Grounding Score: {result.grounding_score:.3f}")
print(f"Rule Applied: {result.rule}")
print()


# Example 3: Custom weights for specific use case
print("=" * 60)
print("Example 3: Custom Weights - Prioritize Contradiction Detection")
print("=" * 60)

context = "The product launch is scheduled for March 2025."
answer = "The product will be released in December 2024."

result = cert.measure(
    context, answer,
    use_semantic=True, semantic_weight=0.2,
    use_nli=True, nli_weight=0.7,  # High weight on NLI
    use_grounding=True, grounding_weight=0.1,
    threshold=0.6
)

print(f"Context: {context}")
print(f"Answer: {answer}")
print(f"\nMatched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Components Used: {', '.join(result.components_used)}")
print()


# Example 4: Only semantic similarity (fast, no ML models)
print("=" * 60)
print("Example 4: Semantic-Only Mode (Fast)")
print("=" * 60)

query = "What are the benefits of cloud computing?"
response1 = "Cloud computing offers scalability, cost savings, and flexibility."
response2 = "The weather today is sunny with a chance of rain."

result1 = cert.measure(
    query, response1,
    use_semantic=True,
    use_nli=False,
    use_grounding=False,
    threshold=0.5
)

result2 = cert.measure(
    query, response2,
    use_semantic=True,
    use_nli=False,
    use_grounding=False,
    threshold=0.5
)

print(f"Query: {query}")
print(f"\nResponse 1: {response1}")
print(f"Matched: {result1.matched}, Score: {result1.semantic_score:.3f}")
print(f"\nResponse 2: {response2}")
print(f"Matched: {result2.matched}, Score: {result2.semantic_score:.3f}")
print()


# Example 5: Using different embedding models
print("=" * 60)
print("Example 5: Custom Embedding Model")
print("=" * 60)

result = cert.measure(
    "Machine learning enables computers to learn from data.",
    "ML allows systems to improve through experience with data.",
    use_semantic=True,
    embedding_model="all-MiniLM-L6-v2",  # Default
    threshold=0.7
)

print(f"Matched: {result.matched}")
print(f"Confidence: {result.confidence:.3f}")
print(f"Model: all-MiniLM-L6-v2")
print()

print("\nKey Takeaways:")
print("- measure() is the unified function for all text comparison tasks")
print("- Supports semantic, NLI, and grounding analysis")
print("- Configurable weights for different use cases")
print("- No hidden configuration - all parameters explicit")
print("- Returns structured MeasurementResult with all scores")
