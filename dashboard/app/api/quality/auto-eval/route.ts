import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation } from '@/lib/trace-store';

// Dynamic import for transformers (loads models on first use)
let pipeline: any = null;
let featureExtractor: any = null;
let nliClassifier: any = null;

async function loadModels() {
  if (!pipeline) {
    // Dynamic import to avoid issues with SSR
    const transformers = await import('@huggingface/transformers');
    pipeline = transformers.pipeline;
  }

  // Load feature extraction model for embeddings (semantic similarity)
  if (!featureExtractor) {
    console.log('Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
    featureExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✓ Embedding model loaded');
  }

  // Load NLI model for textual entailment
  if (!nliClassifier) {
    console.log('Loading NLI model (Xenova/nli-deberta-v3-xsmall)...');
    nliClassifier = await pipeline('text-classification', 'Xenova/nli-deberta-v3-xsmall');
    console.log('✓ NLI model loaded');
  }
}

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

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Convert from [-1, 1] to [0, 1] range
  return (similarity + 1) / 2;
}

/**
 * Mean pooling for sentence embeddings
 */
function meanPooling(embeddings: number[][]): number[] {
  const numTokens = embeddings.length;
  const embeddingSize = embeddings[0].length;
  const pooled = new Array(embeddingSize).fill(0);

  for (let i = 0; i < numTokens; i++) {
    for (let j = 0; j < embeddingSize; j++) {
      pooled[j] += embeddings[i][j];
    }
  }

  for (let j = 0; j < embeddingSize; j++) {
    pooled[j] /= numTokens;
  }

  return pooled;
}

/**
 * Compute semantic similarity using local embedding model
 */
async function computeSemanticSimilarity(
  input: string,
  output: string
): Promise<number> {
  try {
    await loadModels();

    // Truncate inputs to avoid memory issues
    const maxLen = 512;
    const truncInput = input.slice(0, maxLen);
    const truncOutput = output.slice(0, maxLen);

    // Get embeddings
    const inputEmbedding = await featureExtractor(truncInput, { pooling: 'mean', normalize: true });
    const outputEmbedding = await featureExtractor(truncOutput, { pooling: 'mean', normalize: true });

    // Extract the pooled embeddings
    const inputVec = Array.from(inputEmbedding.data as Float32Array);
    const outputVec = Array.from(outputEmbedding.data as Float32Array);

    // Compute cosine similarity
    const similarity = cosineSimilarity(inputVec, outputVec);

    return Math.max(0, Math.min(1, similarity));
  } catch (error) {
    console.error('Semantic similarity error:', error);
    return 0.5; // Default to neutral if error
  }
}

/**
 * Compute NLI score using local model
 * Determines if the output logically follows from the input
 */
async function computeNLIScore(
  input: string,
  output: string
): Promise<{ score: number; reasoning: string }> {
  try {
    await loadModels();

    // Truncate inputs
    const maxLen = 256;
    const truncInput = input.slice(0, maxLen);
    const truncOutput = output.slice(0, maxLen);

    // NLI models expect premise-hypothesis pairs
    // Format: "[CLS] premise [SEP] hypothesis [SEP]"
    const nliInput = `${truncInput} [SEP] ${truncOutput}`;

    const result = await nliClassifier(nliInput);

    // Result contains labels like 'entailment', 'neutral', 'contradiction'
    // Map to score
    let score = 0.5;
    let reasoning = 'NLI evaluation completed';

    if (Array.isArray(result) && result.length > 0) {
      const label = result[0].label?.toLowerCase() || '';
      const confidence = result[0].score || 0.5;

      if (label.includes('entail')) {
        score = 0.5 + (confidence * 0.5); // 0.5 to 1.0
        reasoning = `Entailment detected (confidence: ${(confidence * 100).toFixed(0)}%)`;
      } else if (label.includes('contradict')) {
        score = 0.5 - (confidence * 0.5); // 0.0 to 0.5
        reasoning = `Contradiction detected (confidence: ${(confidence * 100).toFixed(0)}%)`;
      } else {
        score = 0.5;
        reasoning = `Neutral relationship (confidence: ${(confidence * 100).toFixed(0)}%)`;
      }
    }

    return { score: Math.max(0, Math.min(1, score)), reasoning };
  } catch (error) {
    console.error('NLI score error:', error);
    return { score: 0.5, reasoning: 'NLI evaluation encountered an error' };
  }
}

/**
 * POST /api/quality/auto-eval
 * Performs automatic evaluation using local models (semantic similarity + NLI)
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

    // Compute semantic similarity using local model
    const semanticScore = await computeSemanticSimilarity(input, output);

    // Compute NLI score using local model
    const { score: nliScore, reasoning: nliReasoning } = await computeNLIScore(input, output);

    // Normalize weights
    const totalWeight = semanticWeight + nliWeight;
    const normSemanticWeight = totalWeight > 0 ? semanticWeight / totalWeight : 0.5;
    const normNliWeight = totalWeight > 0 ? nliWeight / totalWeight : 0.5;

    // Compute weighted final score (0-1 scale)
    const rawScore = (normSemanticWeight * semanticScore) + (normNliWeight * nliScore);

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

    const result: AutoEvalResult = {
      score: Math.round(finalScore * 10) / 10,
      semanticScore: Math.round(semanticScore * 100) / 100,
      nliScore: Math.round(nliScore * 100) / 100,
      status,
      reasoning: `Semantic: ${(semanticScore * 10).toFixed(1)}/10, NLI: ${(nliScore * 10).toFixed(1)}/10. ${nliReasoning}`,
      evaluatedAt: new Date().toISOString(),
    };

    // Update trace with evaluation
    const success = await updateEvaluation(traceId, {
      score: result.score,
      status: result.status,
      criteria: {
        semantic: semanticScore,
        nli: nliScore,
      },
      judgeModel: 'cert-auto-eval',
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

    // Pre-load models before processing
    await loadModels();

    const results = [];

    for (const trace of traces.slice(0, 10)) { // Limit to 10 traces per batch
      if (!trace.input || !trace.output) continue;

      const semanticScore = await computeSemanticSimilarity(trace.input, trace.output);
      const { score: nliScore, reasoning } = await computeNLIScore(trace.input, trace.output);

      const totalWeight = semanticWeight + nliWeight;
      const normSemanticWeight = totalWeight > 0 ? semanticWeight / totalWeight : 0.5;
      const normNliWeight = totalWeight > 0 ? nliWeight / totalWeight : 0.5;

      const rawScore = (normSemanticWeight * semanticScore) + (normNliWeight * nliScore);
      const finalScore = rawScore * 10;

      const status: 'pass' | 'fail' | 'review' =
        finalScore >= passThreshold ? 'pass' :
        finalScore >= passThreshold - 2 ? 'review' : 'fail';

      await updateEvaluation(trace.id, {
        score: Math.round(finalScore * 10) / 10,
        status,
        criteria: { semantic: semanticScore, nli: nliScore },
        judgeModel: 'cert-auto-eval',
        evaluatedAt: new Date().toISOString(),
      });

      results.push({
        traceId: trace.id,
        score: Math.round(finalScore * 10) / 10,
        status,
        semanticScore,
        nliScore,
        reasoning,
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
