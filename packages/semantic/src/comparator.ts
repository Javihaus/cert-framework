import { ComparisonResult } from '@cert/core';

/**
 * A comparison rule that can match expected against actual outputs.
 */
export interface ComparisonRule {
  /** Name of this rule */
  name: string;
  /** Function to test if expected matches actual
   * Returns false for no match, true for exact match, or 0-1 for fuzzy match
   */
  match: (expected: string, actual: string) => boolean | number;
  /** Priority (higher = checked first) */
  priority: number;
}

/**
 * Extracts a number and its unit from a string.
 */
interface NumberExtraction {
  value: number;
  unit?: string;
}

/**
 * Extracts numbers from strings like "$391.035 billion" or "42.5%"
 */
function extractNumber(str: string): NumberExtraction | null {
  // Remove common currency symbols and normalize
  const normalized = str
    .replace(/[$£€¥]/g, '')
    .replace(/,/g, '')
    .trim();

  // Try to match number with optional unit
  const match = normalized.match(
    /(-?\d+(?:\.\d+)?)\s*(billion|million|thousand|trillion|%|percent)?/i
  );

  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();

  if (isNaN(value)) return null;

  return { value, unit };
}

/**
 * Normalizes a number to a standard unit for comparison.
 */
function normalizeUnit(value: number, unit?: string): number {
  if (!unit) return value;

  switch (unit.toLowerCase()) {
    case 'billion':
      return value * 1e9;
    case 'million':
      return value * 1e6;
    case 'thousand':
      return value * 1e3;
    case 'trillion':
      return value * 1e12;
    case '%':
    case 'percent':
      return value / 100;
    default:
      return value;
  }
}

/**
 * Exact string match (case-insensitive, whitespace normalized).
 */
export const exactMatch: ComparisonRule = {
  name: 'exact-match',
  priority: 100,
  match: (expected, actual) => {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/\s+/g, ' ').trim();
    return normalize(expected) === normalize(actual);
  },
};

/**
 * Normalized number match with unit conversion.
 * Handles cases like "$391.035 billion" vs "$391035000000" or "391.035B"
 */
export const normalizedNumberMatch: ComparisonRule = {
  name: 'normalized-number',
  priority: 90,
  match: (expected, actual) => {
    const exp = extractNumber(expected);
    const act = extractNumber(actual);

    if (!exp || !act) return false;

    // Handle unit conversion
    const expVal = normalizeUnit(exp.value, exp.unit);
    const actVal = normalizeUnit(act.value, act.unit);

    // Within 0.1% tolerance to account for rounding
    const diff = Math.abs(expVal - actVal) / expVal;
    return diff < 0.001 ? 1.0 : false;
  },
};

/**
 * Fuzzy text match using simple string similarity.
 * Returns a confidence score based on character overlap.
 */
export const fuzzyTextMatch: ComparisonRule = {
  name: 'fuzzy-text',
  priority: 50,
  match: (expected, actual) => {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const exp = normalize(expected);
    const act = normalize(actual);

    // Simple Levenshtein-based similarity
    const maxLen = Math.max(exp.length, act.length);
    if (maxLen === 0) return true;

    const distance = levenshteinDistance(exp, act);
    const similarity = 1 - distance / maxLen;

    // Return confidence if similarity is high enough
    return similarity >= 0.8 ? similarity : false;
  },
};

/**
 * Calculates Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Semantic comparator that applies pluggable comparison rules.
 */
export class SemanticComparator {
  private rules: ComparisonRule[] = [];

  constructor() {
    // Built-in rules
    this.addRule(exactMatch);
    this.addRule(normalizedNumberMatch);
    this.addRule(fuzzyTextMatch);
  }

  /**
   * Adds a custom comparison rule.
   * Rules are applied in priority order (highest first).
   */
  addRule(rule: ComparisonRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Compares expected against actual using all registered rules.
   * Returns the first rule that matches, in priority order.
   */
  compare(expected: string, actual: string): ComparisonResult {
    for (const rule of this.rules) {
      const match = rule.match(expected, actual);
      if (match !== false) {
        return {
          matched: true,
          rule: rule.name,
          confidence: typeof match === 'number' ? match : 1.0,
        };
      }
    }

    return { matched: false, confidence: 0 };
  }

  /**
   * Checks if actual matches any of the expected values (including equivalents).
   */
  compareWithEquivalents(
    expected: string,
    equivalents: string[] | undefined,
    actual: string
  ): ComparisonResult {
    // Try exact expected first
    const result = this.compare(expected, actual);
    if (result.matched) return result;

    // Try equivalents
    if (equivalents) {
      for (const equiv of equivalents) {
        const equivResult = this.compare(equiv, actual);
        if (equivResult.matched) {
          return {
            ...equivResult,
            rule: `equivalent-${equivResult.rule}`,
          };
        }
      }
    }

    return { matched: false, confidence: 0 };
  }
}
