"""Semantic comparison engine with pluggable rules."""

import re
from dataclasses import dataclass
from typing import Callable, List, Optional, Union


@dataclass
class ComparisonResult:
    """Result of a semantic comparison."""

    matched: bool
    rule: Optional[str] = None
    confidence: float = 0.0


@dataclass
class ComparisonRule:
    """A pluggable comparison rule."""

    name: str
    priority: int
    match: Callable[[str, str], Union[bool, float]]


class SemanticComparator:
    """
    Semantic comparator with pluggable rules.

    Rules are checked in priority order (highest first).
    """

    def __init__(self):
        """Initialize with default rules."""
        self.rules: List[ComparisonRule] = []
        self._add_default_rules()

    def _add_default_rules(self) -> None:
        """Add built-in comparison rules."""
        self.add_rule(exact_match_rule())
        self.add_rule(normalized_number_rule())
        self.add_rule(fuzzy_text_rule())

    def add_rule(self, rule: ComparisonRule) -> None:
        """Add a comparison rule."""
        self.rules.append(rule)
        # Sort by priority (highest first)
        self.rules.sort(key=lambda r: r.priority, reverse=True)

    def compare(self, expected: str, actual: str) -> ComparisonResult:
        """
        Compare two strings using registered rules.

        Args:
            expected: Expected value
            actual: Actual value

        Returns:
            ComparisonResult indicating match status
        """
        for rule in self.rules:
            result = rule.match(expected, actual)
            if result is not False:
                confidence = result if isinstance(result, float) else 1.0
                return ComparisonResult(
                    matched=True,
                    rule=rule.name,
                    confidence=confidence
                )

        return ComparisonResult(matched=False, confidence=0.0)


def exact_match_rule() -> ComparisonRule:
    """Rule for exact string matching."""

    def match(expected: str, actual: str) -> Union[bool, float]:
        return expected == actual

    return ComparisonRule(
        name="exact-match",
        priority=100,
        match=match
    )


def normalized_number_rule() -> ComparisonRule:
    """Rule for matching numbers with different formatting."""

    def extract_number(text: str) -> Optional[dict]:
        """Extract number and unit from text."""
        # Remove currency symbols and commas
        text = re.sub(r'[$,]', '', text)

        # Match number with optional unit
        pattern = r'([\d.]+)\s*(billion|million|thousand|B|M|K)?'
        match = re.search(pattern, text, re.IGNORECASE)

        if not match:
            return None

        value = float(match.group(1))
        unit = (match.group(2) or '').lower()

        return {"value": value, "unit": unit}

    def normalize_to_base(value: float, unit: str) -> float:
        """Normalize number to base unit."""
        multipliers = {
            'billion': 1e9,
            'b': 1e9,
            'million': 1e6,
            'm': 1e6,
            'thousand': 1e3,
            'k': 1e3,
            '': 1
        }
        return value * multipliers.get(unit, 1)

    def match(expected: str, actual: str) -> Union[bool, float]:
        exp_num = extract_number(expected)
        act_num = extract_number(actual)

        if not exp_num or not act_num:
            return False

        exp_val = normalize_to_base(exp_num["value"], exp_num["unit"])
        act_val = normalize_to_base(act_num["value"], act_num["unit"])

        # Allow 0.1% difference
        if exp_val == 0:
            return act_val == 0

        diff = abs(exp_val - act_val) / exp_val
        return diff < 0.001

    return ComparisonRule(
        name="normalized-number",
        priority=90,
        match=match
    )


def fuzzy_text_rule() -> ComparisonRule:
    """Rule for fuzzy text matching."""

    def normalize(text: str) -> str:
        """Normalize text for comparison."""
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation
        text = re.sub(r'[^\w\s]', '', text)
        # Normalize whitespace
        text = ' '.join(text.split())
        return text

    def match(expected: str, actual: str) -> Union[bool, float]:
        norm_exp = normalize(expected)
        norm_act = normalize(actual)

        if norm_exp == norm_act:
            return 1.0

        # Check if one contains the other
        if norm_exp in norm_act or norm_act in norm_exp:
            return 0.9

        # Try fuzzy matching if rapidfuzz is available
        try:
            from rapidfuzz import fuzz
            ratio = fuzz.ratio(norm_exp, norm_act) / 100.0
            return ratio if ratio > 0.85 else False
        except ImportError:
            return False

    return ComparisonRule(
        name="fuzzy-text",
        priority=70,
        match=match
    )
