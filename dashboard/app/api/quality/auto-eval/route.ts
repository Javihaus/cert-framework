import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation } from '@/lib/trace-store';

interface AutoEvalRequest {
  traceId: string;
  input: string;
  output: string;
  apiKey: string;
  semanticWeight: number;  // 0-100
  nliWeight: number;       // 0-100
  passThreshold: number;   // 0-10
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
 * Compute semantic similarity using OpenAI embeddings
 */
async function computeSemanticSimilarity(
  input: string,
  output: string,
  apiKey: string
): Promise<number> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: [input, output],
      }),
    });

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.status}`);
    }

    const data = await response.json();
    const embeddings = data.data.map((d: { embedding: number[] }) => d.embedding);

    // Compute cosine similarity
    const [embedding1, embedding2] = embeddings;
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    // Convert from [-1, 1] range to [0, 1]
    return (similarity + 1) / 2;
  } catch (error) {
    console.error('Semantic similarity error:', error);
    return 0.5; // Default to neutral if error
  }
}

/**
 * Compute NLI score using GPT
 * Determines if the output logically follows from/is supported by the input
 */
async function computeNLIScore(
  input: string,
  output: string,
  apiKey: string
): Promise<{ score: number; reasoning: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an NLI (Natural Language Inference) evaluator. Your task is to determine if a response (hypothesis) logically follows from a prompt (premise).

Evaluate the relationship and provide:
1. A score from 0 to 1:
   - 1.0: Strong entailment - the response directly and logically follows from the prompt
   - 0.7-0.9: Moderate entailment - mostly supported but with some assumptions
   - 0.4-0.6: Neutral - neither supported nor contradicted
   - 0.1-0.3: Weak contradiction - mostly unsupported
   - 0.0: Strong contradiction - directly contradicts the prompt

2. Brief reasoning (1-2 sentences)

Respond in JSON format: {"score": 0.X, "reasoning": "..."}`
          },
          {
            role: 'user',
            content: `Premise (Input): ${input.slice(0, 2000)}

Hypothesis (Output): ${output.slice(0, 2000)}

Evaluate the NLI relationship.`
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`NLI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(1, parsed.score || 0.5)),
        reasoning: parsed.reasoning || 'NLI evaluation completed',
      };
    }

    return { score: 0.5, reasoning: 'Could not parse NLI response' };
  } catch (error) {
    console.error('NLI score error:', error);
    return { score: 0.5, reasoning: 'NLI evaluation failed' };
  }
}

/**
 * POST /api/quality/auto-eval
 * Performs automatic evaluation using semantic similarity + NLI
 */
export async function POST(request: NextRequest) {
  try {
    const body: AutoEvalRequest = await request.json();

    const {
      traceId,
      input,
      output,
      apiKey,
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

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required for auto-evaluation' },
        { status: 400 }
      );
    }

    // Compute semantic similarity
    const semanticScore = await computeSemanticSimilarity(input, output, apiKey);

    // Compute NLI score
    const { score: nliScore, reasoning: nliReasoning } = await computeNLIScore(input, output, apiKey);

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
    const { traces, apiKey, semanticWeight, nliWeight, passThreshold } = await request.json();

    if (!traces || !Array.isArray(traces)) {
      return NextResponse.json(
        { error: 'Traces array is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const trace of traces.slice(0, 10)) { // Limit to 10 traces per batch
      if (!trace.input || !trace.output) continue;

      const semanticScore = await computeSemanticSimilarity(trace.input, trace.output, apiKey);
      const { score: nliScore, reasoning } = await computeNLIScore(trace.input, trace.output, apiKey);

      const totalWeight = (semanticWeight || 30) + (nliWeight || 70);
      const normSemanticWeight = totalWeight > 0 ? (semanticWeight || 30) / totalWeight : 0.5;
      const normNliWeight = totalWeight > 0 ? (nliWeight || 70) / totalWeight : 0.5;

      const rawScore = (normSemanticWeight * semanticScore) + (normNliWeight * nliScore);
      const finalScore = rawScore * 10;
      const threshold = passThreshold || 7;

      const status: 'pass' | 'fail' | 'review' =
        finalScore >= threshold ? 'pass' :
        finalScore >= threshold - 2 ? 'review' : 'fail';

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
