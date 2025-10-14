/**
 * @cert/semantic - Semantic comparison engine
 *
 * Provides pluggable comparison rules for matching LLM outputs against expected values,
 * handling numerical equivalence, unit conversions, and fuzzy text matching.
 */

export {
  SemanticComparator,
  exactMatch,
  normalizedNumberMatch,
  fuzzyTextMatch,
  type ComparisonRule,
} from './comparator.js';
