"""
Example 1: Document Deduplication

Shows how to find and remove near-duplicate documents from a corpus.
Common use case: cleaning scraped data, preventing duplicate processing.
"""

from cert import compare
from typing import List, Set, Tuple

# Sample documents - mix of originals and near-duplicates
documents = [
    "Apple reported strong iPhone sales in Q4 2024",
    "Apple's Q4 2024 results showed robust iPhone revenue",  # Near-duplicate
    "Microsoft Azure cloud revenue grew 30% year-over-year",
    "Tesla delivered record number of vehicles last quarter",
    "Google announced new AI features for Search",
    "Microsoft's cloud business Azure saw 30% YoY growth",  # Near-duplicate
    "Amazon Web Services remains market leader in cloud",
    "Tesla set new delivery record in recent quarter",  # Near-duplicate
    "Google Search getting AI-powered enhancements",  # Near-duplicate
]


def find_duplicates(
    docs: List[str], threshold: float = 0.80
) -> List[Tuple[int, int, float]]:
    """Find pairs of duplicate documents.

    Args:
        docs: List of documents to check
        threshold: Similarity threshold for considering duplicates

    Returns:
        List of (index1, index2, confidence) tuples
    """
    duplicates = []

    # Compare each document to every other document
    for i in range(len(docs)):
        for j in range(i + 1, len(docs)):
            result = compare(docs[i], docs[j], threshold=threshold)
            if result.matched:
                duplicates.append((i, j, result.confidence))

    return duplicates


def deduplicate(docs: List[str], threshold: float = 0.80) -> List[str]:
    """Remove duplicate documents, keeping only the first occurrence.

    Args:
        docs: List of documents to deduplicate
        threshold: Similarity threshold

    Returns:
        List of unique documents
    """
    duplicates = find_duplicates(docs, threshold)

    # Build set of indices to remove (always remove the later occurrence)
    to_remove: Set[int] = set()
    for i, j, confidence in duplicates:
        to_remove.add(j)

    # Keep documents not marked for removal
    unique_docs = [doc for idx, doc in enumerate(docs) if idx not in to_remove]

    return unique_docs


if __name__ == "__main__":
    print("=" * 70)
    print("DOCUMENT DEDUPLICATION EXAMPLE")
    print("=" * 70)

    print(f"\nOriginal: {len(documents)} documents")

    # Find duplicates
    duplicates = find_duplicates(documents)
    print(f"\nFound {len(duplicates)} duplicate pairs:")
    for i, j, confidence in duplicates:
        print(f"  [{i}] ↔ [{j}] ({confidence:.0%} similar)")
        print(f"    '{documents[i]}'")
        print(f"    '{documents[j]}'")

    # Deduplicate
    unique = deduplicate(documents)
    print(f"\nAfter deduplication: {len(unique)} unique documents")
    print("\nRemaining documents:")
    for idx, doc in enumerate(unique):
        print(f"  {idx + 1}. {doc}")

    print("\n" + "=" * 70)
    print("NOTES")
    print("=" * 70)
    print("- Duplicates are identified by semantic similarity, not exact matches")
    print("- Threshold of 0.80 catches near-duplicates while avoiding false positives")
    print("- For large datasets (>1000 docs), consider using a vector database")
    print("- Runtime: O(N²) comparisons - 100 docs = ~5000 comparisons = ~3 seconds")
