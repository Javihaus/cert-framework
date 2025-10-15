"""
Example 2: Support Ticket Classification

Shows how to classify new support tickets by similarity to resolved tickets.
Common use case: automatic routing, priority detection, suggested solutions.
"""

from cert import compare
from typing import List, Dict, Optional

# Historical resolved tickets with categories
resolved_tickets = [
    {
        "id": 1,
        "category": "billing",
        "text": "I was charged twice for my subscription",
    },
    {
        "id": 2,
        "category": "billing",
        "text": "Why is there a duplicate charge on my account?",
    },
    {
        "id": 3,
        "category": "technical",
        "text": "The application crashes when I try to export data",
    },
    {
        "id": 4,
        "category": "technical",
        "text": "Getting error message when attempting to save file",
    },
    {
        "id": 5,
        "category": "account",
        "text": "I forgot my password and can't reset it",
    },
    {
        "id": 6,
        "category": "account",
        "text": "Unable to log in, password reset not working",
    },
]

# New incoming tickets to classify
new_tickets = [
    "I see two charges for the same month on my credit card",  # billing
    "App freezes whenever I click the export button",  # technical
    "Can't access my account, password reset email not arriving",  # account
]


def classify_ticket(
    new_ticket: str, resolved: List[Dict], threshold: float = 0.75
) -> Optional[Dict[str, any]]:
    """Classify a new ticket by finding the most similar resolved ticket.

    Args:
        new_ticket: Text of the new ticket
        resolved: List of resolved tickets with categories
        threshold: Minimum similarity to consider a match

    Returns:
        Dictionary with category, confidence, and similar ticket, or None
    """
    best_match = None
    best_confidence = 0.0

    for ticket in resolved:
        result = compare(new_ticket, ticket["text"], threshold=threshold)

        if result.confidence > best_confidence:
            best_confidence = result.confidence
            best_match = ticket

    if best_confidence >= threshold:
        return {
            "category": best_match["category"],
            "confidence": best_confidence,
            "similar_to": best_match["text"],
            "ticket_id": best_match["id"],
        }

    return None


if __name__ == "__main__":
    print("=" * 70)
    print("SUPPORT TICKET CLASSIFICATION EXAMPLE")
    print("=" * 70)

    print(f"\nKnowledge base: {len(resolved_tickets)} resolved tickets")
    print(f"Classifying: {len(new_tickets)} new tickets\n")

    for idx, ticket in enumerate(new_tickets, 1):
        print(f"New Ticket #{idx}:")
        print(f"  '{ticket}'")

        classification = classify_ticket(ticket, resolved_tickets)

        if classification:
            print(f"  ✓ Category: {classification['category']}")
            print(f"  ✓ Confidence: {classification['confidence']:.0%}")
            print(f"  ✓ Similar to ticket #{classification['ticket_id']}:")
            print(f"    '{classification['similar_to']}'")
        else:
            print(f"  ✗ No match found (below 75% threshold)")
            print(f"    → Route to human for manual classification")

        print()

    print("=" * 70)
    print("THRESHOLD TUNING GUIDANCE")
    print("=" * 70)
    print("Lower threshold (0.70-0.75):")
    print("  + More tickets auto-classified (higher recall)")
    print("  - More misclassifications (lower precision)")
    print("  → Use when manual review is cheap\n")

    print("Higher threshold (0.85-0.90):")
    print("  + Fewer misclassifications (higher precision)")
    print("  - More 'no match' cases (lower recall)")
    print("  → Use when misrouting is expensive\n")

    print("Current (0.75): Balanced for most use cases")
