import { FailurePattern } from '@/types/cert';

// Define the 4 failure patterns
export const PATTERNS: Record<string, FailurePattern> = {
  irrelevant: {
    type: 'irrelevant',
    label: 'Irrelevant Response',
    description: 'Completely off-topic or unrelated answer',
    color: 'red',
    icon: 'MdWarning'
  },
  incomplete: {
    type: 'incomplete',
    label: 'Incomplete Answer',
    description: 'Vague or missing specific details',
    color: 'orange',
    icon: 'MdInfo'
  },
  missing_info: {
    type: 'missing_info',
    label: 'Missing Information',
    description: 'No specific data, list, or calculation provided',
    color: 'yellow',
    icon: 'MdRemoveCircle'
  },
  definition_only: {
    type: 'definition_only',
    label: 'Definition Without Explanation',
    description: 'Defines terms but doesn\'t explain differences',
    color: 'blue',
    icon: 'MdHelp'
  }
};

/**
 * Classifies why a trace failed based on its content
 *
 * @param query - What the user asked
 * @param response - What the AI responded
 * @param score - The confidence score (0-1)
 * @returns The failure pattern
 */
export function classifyFailure(
  query: string,
  response: string,
  score: number
): FailurePattern {
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();
  const responseLength = response.length;

  // Type 1: Irrelevant (score < 0.5, totally unrelated)
  if (score < 0.5 && responseLength < 200) {
    // Get unique words from query and response (length > 3 to skip "the", "and", etc.)
    const queryWords = new Set(
      queryLower.split(/\s+/).filter(w => w.length > 3)
    );
    const responseWords = new Set(
      responseLower.split(/\s+/).filter(w => w.length > 3)
    );

    // Count how many words overlap
    const overlap = Array.from(queryWords).filter(w => responseWords.has(w)).length;

    // If fewer than 2 words overlap, it's irrelevant
    if (overlap < 2) {
      return PATTERNS.irrelevant;
    }
  }

  // Type 2: Incomplete (score 0.5-0.65, vague answers)
  if (score >= 0.5 && score < 0.65 && responseLength < 150) {
    const vagueTerms = ['various', 'different', 'some', 'several', 'methods', 'ways'];
    if (vagueTerms.some(term => responseLower.includes(term))) {
      return PATTERNS.incomplete;
    }
  }

  // Type 3: Missing Info (query asks for list/specific but response is generic)
  const listIndicators = ['what', 'which', 'list', 'documents', 'items', 'steps'];
  const hasListRequest = listIndicators.some(ind => queryLower.includes(ind));
  const hasNoList = !response.includes('\n') &&
                    !response.includes('•') &&
                    !response.includes('-');

  if (hasListRequest && hasNoList && responseLength < 100) {
    return PATTERNS.missing_info;
  }

  // Type 4: Definition only (query asks "difference" but response just defines)
  if (queryLower.includes('differ') ||
      queryLower.includes('vs') ||
      queryLower.includes('versus')) {
    // Check if response compares (uses contrast words)
    const hasComparison = ['however', 'while', 'whereas'].some(
      word => responseLower.includes(word)
    );

    if (!hasComparison && responseLength < 200) {
      return PATTERNS.definition_only;
    }
  }

  // Default to incomplete if we couldn't classify
  return PATTERNS.incomplete;
}
