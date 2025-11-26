import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation } from '@/lib/trace-store';

/**
 * CERT Auto-Evaluation API
 *
 * Uses HuggingFace Inference API (free tier, no API key required) for:
 * - Semantic similarity via sentence embeddings
 * - NLI (Natural Language Inference) for entailment detection
 *
 * Falls back to algorithmic methods if API is unavailable.
 */

const HF_INFERENCE_URL = 'https://api-inference.huggingface.co/models';
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const NLI_MODEL = 'cross-encoder/nli-deberta-v3-small';

interface AutoEvalRequest {
  traceId: string;
  input: string;
  output: string;
  semanticWeight?: number;  // 0-100
  nliWeight?: number;       // 0-100
  passThreshold?: number;   // 0-10
}

interface AutoEvalResult {
  score: number;              // 0-10 scale
  semanticScore: number;      // 0-1
  nliScore: number;           // 0-1
  status: 'pass' | 'fail' | 'review';
  reasoning: string;
  evaluatedAt: string;
  method: 'huggingface' | 'algorithmic';
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Convert from [-1, 1] to [0, 1] range
  return (similarity + 1) / 2;
}

/**
 * Tokenize text into words (simple tokenizer)
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Compute n-grams from text
 */
function getNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Algorithmic semantic similarity using n-gram overlap
 * Used as fallback when HuggingFace API is unavailable
 */
function algorithmicSemanticSimilarity(input: string, output: string): number {
  const inputTokens = tokenize(input);
  const outputTokens = tokenize(output);

  if (inputTokens.length === 0 || outputTokens.length === 0) {
    return 0.5;
  }

  // Compute overlap scores for different n-gram sizes
  let totalScore = 0;
  let weights = 0;

  for (let n = 1; n <= 3; n++) {
    const inputNgrams = getNgrams(inputTokens, n);
    const outputNgrams = getNgrams(outputTokens, n);

    if (inputNgrams.size === 0 || outputNgrams.size === 0) continue;

    // Jaccard similarity
    const intersection = new Set(Array.from(inputNgrams).filter(x => outputNgrams.has(x)));
    const union = new Set([...Array.from(inputNgrams), ...Array.from(outputNgrams)]);
    const jaccard = intersection.size / union.size;

    // Weight by n-gram size (higher n = more weight)
    const weight = n;
    totalScore += jaccard * weight;
    weights += weight;
  }

  // Normalize to 0-1 range
  const similarity = weights > 0 ? totalScore / weights : 0.5;

  // Scale to be less harsh (most outputs have some relevance)
  return 0.3 + (similarity * 0.7);
}

/**
 * Algorithmic NLI using keyword and structure analysis
 * Used as fallback when HuggingFace API is unavailable
 */
function algorithmicNLI(input: string, output: string): { score: number; reasoning: string } {
  const inputLower = input.toLowerCase();
  const outputLower = output.toLowerCase();

  // Check for contradiction indicators
  const contradictionIndicators = [
    'however', 'but actually', 'incorrect', 'wrong', 'false',
    'not true', 'contrary', 'opposite', 'disagree'
  ];

  const hasContradiction = contradictionIndicators.some(
    indicator => outputLower.includes(indicator) && inputLower.length > 0
  );

  // Check for affirmation indicators
  const affirmationIndicators = [
    'yes', 'correct', 'right', 'true', 'exactly', 'indeed',
    'as you mentioned', 'as stated', 'confirms'
  ];

  const hasAffirmation = affirmationIndicators.some(
    indicator => outputLower.includes(indicator)
  );

  // Extract key concepts from input
  const inputTokens = tokenize(input);
  const outputTokens = tokenize(output);
  const inputSet = new Set(inputTokens);
  const outputSet = new Set(outputTokens);

  // Calculate concept overlap
  const overlap = Array.from(inputSet).filter(t => outputSet.has(t)).length;
  const overlapRatio = inputSet.size > 0 ? overlap / inputSet.size : 0;

  // Determine score and reasoning
  let score: number;
  let reasoning: string;

  if (hasContradiction && overlapRatio < 0.3) {
    score = 0.3;
    reasoning = 'Potential contradiction detected (low concept overlap)';
  } else if (hasAffirmation || overlapRatio > 0.5) {
    score = 0.7 + (overlapRatio * 0.3);
    reasoning = `Entailment likely (${Math.round(overlapRatio * 100)}% concept overlap)`;
  } else {
    score = 0.5 + (overlapRatio * 0.2);
    reasoning = `Neutral relationship (${Math.round(overlapRatio * 100)}% concept overlap)`;
  }

  return { score: Math.min(1, Math.max(0, score)), reasoning };
}

/**
 * Get embeddings from HuggingFace Inference API
 */
async function getHFEmbeddings(texts: string[]): Promise<number[][] | null> {
  try {
    const response = await fetch(`${HF_INFERENCE_URL}/${EMBEDDING_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: texts,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      console.warn(`HF Embeddings API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data) && data.length === texts.length) {
      // Check if it's already pooled embeddings or needs pooling
      if (Array.isArray(data[0]) && typeof data[0][0] === 'number') {
        return data as number[][];
      }
      // If nested (token-level embeddings), perform mean pooling
      if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        return data.map((tokenEmbeddings: number[][]) => {
          const embeddingSize = tokenEmbeddings[0].length;
          const pooled = new Array(embeddingSize).fill(0);
          for (const embedding of tokenEmbeddings) {
            for (let i = 0; i < embeddingSize; i++) {
              pooled[i] += embedding[i];
            }
          }
          return pooled.map(v => v / tokenEmbeddings.length);
        });
      }
    }

    console.warn('Unexpected HF embedding response format');
    return null;
  } catch (error) {
    console.warn('HF Embeddings API error:', error);
    return null;
  }
}

/**
 * Get NLI classification from HuggingFace Inference API
 */
async function getHFNLI(premise: string, hypothesis: string): Promise<{ label: string; score: number } | null> {
  try {
    // Cross-encoder NLI models expect the text pair as a single input
    const response = await fetch(`${HF_INFERENCE_URL}/${NLI_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `${premise} [SEP] ${hypothesis}`,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      console.warn(`HF NLI API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Parse response - could be array of arrays or single array
    if (Array.isArray(data)) {
      const results = Array.isArray(data[0]) ? data[0] : data;
      if (results.length > 0 && results[0].label) {
        // Find the highest scoring label
        const sorted = [...results].sort((a, b) => b.score - a.score);
        return { label: sorted[0].label.toLowerCase(), score: sorted[0].score };
      }
    }

    console.warn('Unexpected HF NLI response format');
    return null;
  } catch (error) {
    console.warn('HF NLI API error:', error);
    return null;
  }
}

/**
 * Compute semantic similarity - tries HuggingFace API first, falls back to algorithmic
 */
async function computeSemanticSimilarity(
  input: string,
  output: string
): Promise<{ score: number; method: 'huggingface' | 'algorithmic' }> {
  // Truncate to reasonable length
  const maxLen = 512;
  const truncInput = input.slice(0, maxLen);
  const truncOutput = output.slice(0, maxLen);

  // Try HuggingFace API first
  const embeddings = await getHFEmbeddings([truncInput, truncOutput]);

  if (embeddings && embeddings.length === 2) {
    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    return { score: Math.max(0, Math.min(1, similarity)), method: 'huggingface' };
  }

  // Fall back to algorithmic method
  const score = algorithmicSemanticSimilarity(truncInput, truncOutput);
  return { score, method: 'algorithmic' };
}

/**
 * Compute NLI score - tries HuggingFace API first, falls back to algorithmic
 */
async function computeNLIScore(
  input: string,
  output: string
): Promise<{ score: number; reasoning: string; method: 'huggingface' | 'algorithmic' }> {
  // Truncate inputs
  const maxLen = 256;
  const truncInput = input.slice(0, maxLen);
  const truncOutput = output.slice(0, maxLen);

  // Try HuggingFace API first
  const nliResult = await getHFNLI(truncInput, truncOutput);

  if (nliResult) {
    let score = 0.5;
    let reasoning = 'NLI evaluation completed';

    const label = nliResult.label;
    const confidence = nliResult.score;

    if (label.includes('entail')) {
      score = 0.5 + (confidence * 0.5);
      reasoning = `Entailment detected (confidence: ${(confidence * 100).toFixed(0)}%)`;
    } else if (label.includes('contradict')) {
      score = 0.5 - (confidence * 0.5);
      reasoning = `Contradiction detected (confidence: ${(confidence * 100).toFixed(0)}%)`;
    } else {
      score = 0.5;
      reasoning = `Neutral relationship (confidence: ${(confidence * 100).toFixed(0)}%)`;
    }

    return { score: Math.max(0, Math.min(1, score)), reasoning, method: 'huggingface' };
  }

  // Fall back to algorithmic method
  const { score, reasoning } = algorithmicNLI(truncInput, truncOutput);
  return { score, reasoning: `${reasoning} (algorithmic)`, method: 'algorithmic' };
}

/**
 * POST /api/quality/auto-eval
 * Performs automatic evaluation using HuggingFace API or algorithmic fallback
 */
export async function POST(request: NextRequest) {
  try {
    const body: AutoEvalRequest = await request.json();

    const {
      traceId,
      input,
      output,
      semanticWeight = 30,
      nliWeight = 70,
      passThreshold = 7,
    } = body;

    if (!traceId) {
      return NextResponse.json(
        { error: 'Trace ID is required' },
        { status: 400 }
      );
    }

    if (!input || !output) {
      return NextResponse.json(
        { error: 'Input and output are required for evaluation' },
        { status: 400 }
      );
    }

    // Compute semantic similarity
    const semanticResult = await computeSemanticSimilarity(input, output);

    // Compute NLI score
    const nliResult = await computeNLIScore(input, output);

    // Normalize weights
    const totalWeight = semanticWeight + nliWeight;
    const normSemanticWeight = totalWeight > 0 ? semanticWeight / totalWeight : 0.5;
    const normNliWeight = totalWeight > 0 ? nliWeight / totalWeight : 0.5;

    // Compute weighted final score (0-1 scale)
    const rawScore = (normSemanticWeight * semanticResult.score) + (normNliWeight * nliResult.score);

    // Convert to 0-10 scale
    const finalScore = rawScore * 10;

    // Determine status
    let status: 'pass' | 'fail' | 'review';
    if (finalScore >= passThreshold) {
      status = 'pass';
    } else if (finalScore >= passThreshold - 2) {
      status = 'review';
    } else {
      status = 'fail';
    }

    // Determine method used (huggingface if both used it, otherwise algorithmic)
    const method = (semanticResult.method === 'huggingface' && nliResult.method === 'huggingface')
      ? 'huggingface'
      : 'algorithmic';

    const result: AutoEvalResult = {
      score: Math.round(finalScore * 10) / 10,
      semanticScore: Math.round(semanticResult.score * 100) / 100,
      nliScore: Math.round(nliResult.score * 100) / 100,
      status,
      reasoning: `Semantic: ${(semanticResult.score * 10).toFixed(1)}/10, NLI: ${(nliResult.score * 10).toFixed(1)}/10. ${nliResult.reasoning}`,
      evaluatedAt: new Date().toISOString(),
      method,
    };

    // Update trace with evaluation
    const success = await updateEvaluation(traceId, {
      score: result.score,
      status: result.status,
      criteria: {
        semantic: semanticResult.score,
        nli: nliResult.score,
      },
      judgeModel: `cert-auto-eval-${method}`,
      evaluatedAt: result.evaluatedAt,
    });

    if (!success) {
      console.warn(`Could not update trace ${traceId} with evaluation`);
    }

    return NextResponse.json({
      success: true,
      traceId,
      ...result,
    });
  } catch (error) {
    console.error('Auto-eval error:', error);
    return NextResponse.json(
      { error: 'Auto-evaluation failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Batch auto-evaluation for multiple traces
 */
export async function PUT(request: NextRequest) {
  try {
    const { traces, semanticWeight = 30, nliWeight = 70, passThreshold = 7 } = await request.json();

    if (!traces || !Array.isArray(traces)) {
      return NextResponse.json(
        { error: 'Traces array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const trace of traces.slice(0, 10)) { // Limit to 10 traces per batch
      if (!trace.input || !trace.output) continue;

      const semanticResult = await computeSemanticSimilarity(trace.input, trace.output);
      const nliResult = await computeNLIScore(trace.input, trace.output);

      const totalWeight = semanticWeight + nliWeight;
      const normSemanticWeight = totalWeight > 0 ? semanticWeight / totalWeight : 0.5;
      const normNliWeight = totalWeight > 0 ? nliWeight / totalWeight : 0.5;

      const rawScore = (normSemanticWeight * semanticResult.score) + (normNliWeight * nliResult.score);
      const finalScore = rawScore * 10;

      const status: 'pass' | 'fail' | 'review' =
        finalScore >= passThreshold ? 'pass' :
        finalScore >= passThreshold - 2 ? 'review' : 'fail';

      const method = (semanticResult.method === 'huggingface' && nliResult.method === 'huggingface')
        ? 'huggingface'
        : 'algorithmic';

      await updateEvaluation(trace.id, {
        score: Math.round(finalScore * 10) / 10,
        status,
        criteria: { semantic: semanticResult.score, nli: nliResult.score },
        judgeModel: `cert-auto-eval-${method}`,
        evaluatedAt: new Date().toISOString(),
      });

      results.push({
        traceId: trace.id,
        score: Math.round(finalScore * 10) / 10,
        status,
        semanticScore: semanticResult.score,
        nliScore: nliResult.score,
        reasoning: nliResult.reasoning,
        method,
      });
    }

    return NextResponse.json({
      success: true,
      evaluated: results.length,
      results,
    });
  } catch (error) {
    console.error('Batch auto-eval error:', error);
    return NextResponse.json(
      { error: 'Batch auto-evaluation failed' },
      { status: 500 }
    );
  }
}
