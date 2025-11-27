import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation } from '@/lib/trace-store';

/**
 * Grounding Check API
 *
 * Evaluates whether the LLM output is grounded in (supported by) the provided context.
 * This is essential for document extraction and RAG scenarios where we need to verify
 * that the output comes from the source material.
 *
 * Uses HuggingFace Inference API for NLI-based grounding check with algorithmic fallback.
 */

const HF_INFERENCE_URL = 'https://api-inference.huggingface.co/models';
const NLI_MODEL = 'cross-encoder/nli-deberta-v3-small';

interface GroundingRequest {
  traceId: string;
  output: string;
  context: string | string[];
  passThreshold?: number;  // 0-10 scale
}

interface GroundingResult {
  score: number;              // 0-10 scale
  groundedClaims: number;     // Number of claims found in context
  totalClaims: number;        // Total claims identified in output
  status: 'pass' | 'fail' | 'review';
  reasoning: string;
  details: Array<{
    claim: string;
    grounded: boolean;
    confidence: number;
    supportingContext?: string;
  }>;
  evaluatedAt: string;
  method: 'huggingface' | 'algorithmic';
}

/**
 * Extract claims/sentences from output text
 */
function extractClaims(text: string): string[] {
  // Split into sentences, filter out very short ones
  const sentences = text
    .replace(/\n+/g, '. ')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.split(' ').length >= 3);

  // Limit to most important claims (first 10)
  return sentences.slice(0, 10);
}

/**
 * Normalize context to array of chunks
 */
function normalizeContext(context: string | string[]): string[] {
  if (Array.isArray(context)) {
    return context;
  }
  // Split single string into paragraphs
  return context
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 10);
}

/**
 * Tokenize text for algorithmic matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Get n-grams from tokens
 */
function getNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Algorithmic grounding check using n-gram overlap
 */
function algorithmicGroundingCheck(
  claim: string,
  contextChunks: string[]
): { grounded: boolean; confidence: number; supportingContext?: string } {
  const claimTokens = tokenize(claim);

  if (claimTokens.length < 3) {
    return { grounded: true, confidence: 0.5 };
  }

  let bestScore = 0;
  let bestChunk = '';

  for (const chunk of contextChunks) {
    const chunkTokens = tokenize(chunk);

    // Calculate n-gram overlap for different sizes
    let totalScore = 0;
    let weights = 0;

    for (let n = 1; n <= 3; n++) {
      const claimNgrams = getNgrams(claimTokens, n);
      const chunkNgrams = getNgrams(chunkTokens, n);

      if (claimNgrams.size === 0) continue;

      // How many claim n-grams appear in chunk
      const matches = Array.from(claimNgrams).filter(ng => chunkNgrams.has(ng)).length;
      const coverage = matches / claimNgrams.size;

      const weight = n * n; // Weight higher n-grams more
      totalScore += coverage * weight;
      weights += weight;
    }

    const score = weights > 0 ? totalScore / weights : 0;

    if (score > bestScore) {
      bestScore = score;
      bestChunk = chunk;
    }
  }

  // Threshold for considering grounded
  const grounded = bestScore > 0.3;
  const confidence = Math.min(1, bestScore * 1.5);

  return {
    grounded,
    confidence,
    supportingContext: grounded ? bestChunk.slice(0, 200) + (bestChunk.length > 200 ? '...' : '') : undefined,
  };
}

/**
 * HuggingFace NLI-based grounding check
 */
async function hfGroundingCheck(
  claim: string,
  contextChunks: string[]
): Promise<{ grounded: boolean; confidence: number; supportingContext?: string } | null> {
  try {
    // Combine context chunks (limit to avoid token limits)
    const combinedContext = contextChunks.slice(0, 5).join(' ').slice(0, 1000);

    const response = await fetch(`${HF_INFERENCE_URL}/${NLI_MODEL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: `${combinedContext} [SEP] ${claim}`,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      const results = Array.isArray(data[0]) ? data[0] : data;
      if (results.length > 0 && results[0].label) {
        const sorted = [...results].sort((a, b) => b.score - a.score);
        const topLabel = sorted[0].label.toLowerCase();
        const confidence = sorted[0].score;

        // Entailment means the context supports the claim
        const grounded = topLabel.includes('entail');

        return {
          grounded,
          confidence,
          supportingContext: grounded ? combinedContext.slice(0, 200) + '...' : undefined,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a single claim is grounded in context
 */
async function checkClaimGrounding(
  claim: string,
  contextChunks: string[]
): Promise<{ grounded: boolean; confidence: number; supportingContext?: string; method: 'huggingface' | 'algorithmic' }> {
  // Try HuggingFace first
  const hfResult = await hfGroundingCheck(claim, contextChunks);

  if (hfResult) {
    return { ...hfResult, method: 'huggingface' };
  }

  // Fall back to algorithmic
  const algResult = algorithmicGroundingCheck(claim, contextChunks);
  return { ...algResult, method: 'algorithmic' };
}

/**
 * POST /api/quality/grounding
 * Performs grounding check for a single trace
 */
export async function POST(request: NextRequest) {
  try {
    const body: GroundingRequest = await request.json();
    const { traceId, output, context, passThreshold = 7 } = body;

    if (!traceId) {
      return NextResponse.json({ error: 'Trace ID is required' }, { status: 400 });
    }

    if (!output) {
      return NextResponse.json({ error: 'Output is required for grounding check' }, { status: 400 });
    }

    if (!context || (Array.isArray(context) && context.length === 0)) {
      return NextResponse.json(
        { error: 'Context is required for grounding check. Cannot verify without source content.' },
        { status: 400 }
      );
    }

    // Extract claims from output
    const claims = extractClaims(output);
    const contextChunks = normalizeContext(context);

    if (claims.length === 0) {
      return NextResponse.json({
        success: true,
        traceId,
        score: 10,
        groundedClaims: 0,
        totalClaims: 0,
        status: 'pass',
        reasoning: 'No substantial claims to verify in the output',
        details: [],
        evaluatedAt: new Date().toISOString(),
        method: 'algorithmic',
      });
    }

    // Check each claim
    const details: GroundingResult['details'] = [];
    let usedHF = true;

    for (const claim of claims) {
      const result = await checkClaimGrounding(claim, contextChunks);
      details.push({
        claim: claim.slice(0, 100) + (claim.length > 100 ? '...' : ''),
        grounded: result.grounded,
        confidence: Math.round(result.confidence * 100) / 100,
        supportingContext: result.supportingContext,
      });

      if (result.method === 'algorithmic') {
        usedHF = false;
      }
    }

    // Calculate overall score
    const groundedClaims = details.filter(d => d.grounded).length;
    const totalClaims = details.length;
    const groundingRatio = totalClaims > 0 ? groundedClaims / totalClaims : 1;
    const avgConfidence = details.reduce((sum, d) => sum + d.confidence, 0) / details.length;

    // Score combines grounding ratio and confidence
    const rawScore = (groundingRatio * 0.7 + avgConfidence * 0.3) * 10;
    const score = Math.round(rawScore * 10) / 10;

    // Determine status
    const status: 'pass' | 'fail' | 'review' =
      score >= passThreshold ? 'pass' :
      score >= passThreshold - 2 ? 'review' : 'fail';

    const result: GroundingResult = {
      score,
      groundedClaims,
      totalClaims,
      status,
      reasoning: `${groundedClaims}/${totalClaims} claims grounded in source context (${Math.round(groundingRatio * 100)}% coverage)`,
      details,
      evaluatedAt: new Date().toISOString(),
      method: usedHF ? 'huggingface' : 'algorithmic',
    };

    // Update trace with grounding evaluation
    await updateEvaluation(traceId, {
      score: result.score,
      status: result.status,
      criteria: {
        grounding: groundingRatio,
        confidence: avgConfidence,
      },
      judgeModel: `cert-grounding-${result.method}`,
      evaluatedAt: result.evaluatedAt,
    });

    return NextResponse.json({
      success: true,
      traceId,
      ...result,
    });
  } catch (error) {
    console.error('Grounding check error:', error);
    return NextResponse.json(
      { error: 'Grounding check failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quality/grounding
 * Batch grounding check for multiple traces
 */
export async function PUT(request: NextRequest) {
  try {
    const { traces, passThreshold = 7 } = await request.json();

    if (!traces || !Array.isArray(traces)) {
      return NextResponse.json({ error: 'Traces array is required' }, { status: 400 });
    }

    const results = [];

    for (const trace of traces.slice(0, 10)) {
      if (!trace.output || !trace.context) continue;

      const claims = extractClaims(trace.output);
      const contextChunks = normalizeContext(trace.context);

      if (claims.length === 0) {
        results.push({
          traceId: trace.id,
          score: 10,
          groundedClaims: 0,
          totalClaims: 0,
          status: 'pass' as const,
          reasoning: 'No claims to verify',
        });
        continue;
      }

      const details: Array<{ grounded: boolean; confidence: number }> = [];

      for (const claim of claims) {
        const result = await checkClaimGrounding(claim, contextChunks);
        details.push({ grounded: result.grounded, confidence: result.confidence });
      }

      const groundedClaims = details.filter(d => d.grounded).length;
      const groundingRatio = groundedClaims / claims.length;
      const avgConfidence = details.reduce((sum, d) => sum + d.confidence, 0) / details.length;
      const score = Math.round((groundingRatio * 0.7 + avgConfidence * 0.3) * 100) / 10;

      const status: 'pass' | 'fail' | 'review' =
        score >= passThreshold ? 'pass' :
        score >= passThreshold - 2 ? 'review' : 'fail';

      await updateEvaluation(trace.id, {
        score,
        status,
        criteria: { grounding: groundingRatio, confidence: avgConfidence },
        judgeModel: 'cert-grounding',
        evaluatedAt: new Date().toISOString(),
      });

      results.push({
        traceId: trace.id,
        score,
        groundedClaims,
        totalClaims: claims.length,
        status,
        reasoning: `${groundedClaims}/${claims.length} claims grounded`,
      });
    }

    return NextResponse.json({
      success: true,
      evaluated: results.length,
      results,
    });
  } catch (error) {
    console.error('Batch grounding check error:', error);
    return NextResponse.json(
      { error: 'Batch grounding check failed' },
      { status: 500 }
    );
  }
}
