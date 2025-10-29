"""Grounding analysis utilities.

This module provides term grounding analysis to detect when LLM outputs
contain terms or entities not present in the source context.
"""

import logging
from typing import List, Set

logger = logging.getLogger(__name__)


def compute_grounding_score(context: str, answer: str, min_term_length: int = 4) -> float:
    """Compute grounding score between context and answer.

    Checks if key terms from answer appear in context. This catches cases
    where the LLM invents terminology or entities that don't exist in the context.

    Args:
        context: Source context
        answer: Answer to check
        min_term_length: Minimum term length to consider (default: 4 to skip articles)

    Returns:
        Ratio of answer terms found in context (0.0-1.0)

    Example:
        context = "Apple's revenue was $391B"
        answer = "Apple's profit was $200B"
        score = compute_grounding_score(context, answer)
        # Returns low score (profit/200 not in context)
    """
    # Extract significant terms (>min_term_length chars to avoid articles/prepositions)
    answer_terms = extract_terms(answer, min_length=min_term_length)

    if not answer_terms:
        return 0.0

    # Case-insensitive search in context
    context_lower = context.lower()
    grounded = sum(1 for term in answer_terms if term.lower() in context_lower)

    return grounded / len(answer_terms)


def extract_terms(text: str, min_length: int = 4) -> List[str]:
    """Extract significant terms from text.

    Args:
        text: Text to extract terms from
        min_length: Minimum term length to consider

    Returns:
        List of terms (lowercased, punctuation stripped)
    """
    # Strip common punctuation
    punctuation = '.,!?;:"'
    terms = []

    for word in text.split():
        term = word.strip(punctuation)
        if len(term) >= min_length:
            terms.append(term)

    return terms


def get_ungrounded_terms(context: str, answer: str, min_term_length: int = 4) -> Set[str]:
    """Get terms from answer that don't appear in context.

    Useful for debugging and explaining why grounding score is low.

    Args:
        context: Source context
        answer: Answer to check
        min_term_length: Minimum term length to consider

    Returns:
        Set of ungrounded terms

    Example:
        context = "Apple's revenue was $391B"
        answer = "Apple's profit was $200B"
        ungrounded = get_ungrounded_terms(context, answer)
        # Returns: {"profit", "$200B"}
    """
    answer_terms = extract_terms(answer, min_length=min_term_length)
    context_lower = context.lower()

    ungrounded = {term for term in answer_terms if term.lower() not in context_lower}

    return ungrounded


def compute_term_overlap(text1: str, text2: str, min_term_length: int = 4) -> float:
    """Compute Jaccard similarity of terms between two texts.

    Args:
        text1: First text
        text2: Second text
        min_term_length: Minimum term length to consider

    Returns:
        Jaccard similarity (0.0-1.0)
    """
    terms1 = {t.lower() for t in extract_terms(text1, min_length=min_term_length)}
    terms2 = {t.lower() for t in extract_terms(text2, min_length=min_term_length)}

    if not terms1 or not terms2:
        return 0.0

    intersection = len(terms1 & terms2)
    union = len(terms1 | terms2)

    return intersection / union if union > 0 else 0.0
