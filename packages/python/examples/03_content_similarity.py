"""
Example 3: Content Similarity Search

Shows how to find articles similar to a query article.
Common use case: "related articles" feature, content recommendations.

PERFORMANCE NOTE: This example compares one article against all others (O(N)).
For comparing ALL articles to each other, use deduplication example pattern (O(N²)).
"""

from cert import compare
from typing import List, Tuple

# Sample article corpus
articles = [
    {
        "id": 1,
        "title": "Introduction to Machine Learning",
        "content": "Machine learning is a subset of artificial intelligence that enables systems to learn from data",
    },
    {
        "id": 2,
        "title": "Deep Learning Fundamentals",
        "content": "Deep learning uses neural networks with multiple layers to process complex patterns",
    },
    {
        "id": 3,
        "title": "Natural Language Processing Basics",
        "content": "NLP enables computers to understand and generate human language using machine learning",
    },
    {
        "id": 4,
        "title": "Getting Started with Python",
        "content": "Python is a versatile programming language popular for data science and web development",
    },
    {
        "id": 5,
        "title": "Neural Networks Explained",
        "content": "Neural networks are computing systems inspired by biological neural networks in the brain",
    },
]


def find_similar_articles(
    query_article: dict, corpus: List[dict], top_k: int = 3, threshold: float = 0.70
) -> List[Tuple[dict, float]]:
    """Find articles similar to a query article.

    Args:
        query_article: The article to find matches for
        corpus: List of all articles to search
        top_k: Number of similar articles to return
        threshold: Minimum similarity threshold

    Returns:
        List of (article, confidence) tuples, sorted by confidence
    """
    similarities = []

    query_text = f"{query_article['title']} {query_article['content']}"

    for article in corpus:
        # Skip comparing article to itself
        if article["id"] == query_article["id"]:
            continue

        article_text = f"{article['title']} {article['content']}"
        result = compare(query_text, article_text, threshold=threshold)

        if result.confidence >= threshold:
            similarities.append((article, result.confidence))

    # Sort by confidence (highest first) and return top K
    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]


if __name__ == "__main__":
    print("=" * 70)
    print("CONTENT SIMILARITY SEARCH EXAMPLE")
    print("=" * 70)

    # User is reading article #1, find related content
    query = articles[0]

    print(f"\nQuery Article: '{query['title']}'")
    print(f"Content: {query['content']}\n")

    similar = find_similar_articles(query, articles, top_k=3, threshold=0.70)

    if similar:
        print(f"Found {len(similar)} similar articles:\n")
        for rank, (article, confidence) in enumerate(similar, 1):
            print(f"{rank}. '{article['title']}' ({confidence:.0%} similar)")
            print(f"   {article['content']}\n")
    else:
        print("No similar articles found above threshold")

    print("=" * 70)
    print("PERFORMANCE CONSIDERATIONS")
    print("=" * 70)
    print(f"Corpus size: {len(articles)} articles")
    print(f"Comparisons: {len(articles) - 1} (query vs each article)")
    print(f"Runtime: <1 second for this size")
    print()
    print("Scaling:")
    print("  - 100 articles: ~99 comparisons, ~1 second")
    print("  - 1,000 articles: ~999 comparisons, ~5 seconds")
    print("  - 10,000 articles: ~9,999 comparisons, ~50 seconds")
    print()
    print("For larger datasets (>10K), use a vector database like:")
    print("  - Pinecone, Weaviate, Qdrant (managed)")
    print("  - FAISS, Annoy (self-hosted)")
