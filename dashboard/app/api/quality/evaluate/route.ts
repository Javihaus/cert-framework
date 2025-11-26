import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation } from '@/lib/trace-store';

interface EvaluateRequest {
  traceId: string;
  input: string;
  output: string;
  config: {
    apiKey: string;
    provider: string;
    model: string;
    passThreshold: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { traceId, input, output, config }: EvaluateRequest = await request.json();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!input || !output) {
      return NextResponse.json(
        { error: 'Input and output are required' },
        { status: 400 }
      );
    }

    // Build evaluation prompt
    const prompt = `You are an LLM output quality evaluator. Evaluate the following LLM interaction on a scale from 0 to 10.

Consider:
- Accuracy: Is the response factually correct?
- Relevance: Does the response address the question/request?
- Completeness: Is the response thorough enough?
- Clarity: Is the response clear and well-structured?
- Safety: Is the response appropriate and harmless?

INPUT (user's request):
${input.slice(0, 2000)}

OUTPUT (LLM response):
${output.slice(0, 4000)}

Respond with ONLY valid JSON in this exact format:
{"score": <number 0-10>, "reasoning": "<brief 1-2 sentence explanation>"}`;

    let score = 7;
    let reasoning = 'Default evaluation - API call not completed';
    let judgeResponse = '';

    // Call the LLM API based on provider
    if (config.provider === 'anthropic') {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: config.model || 'claude-3-5-haiku-20241022',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          judgeResponse = data.content?.[0]?.text || '';

          // Parse JSON from response
          const jsonMatch = judgeResponse.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            score = Math.min(10, Math.max(0, Number(parsed.score) || 7));
            reasoning = parsed.reasoning || 'Evaluation completed';
          }
        } else {
          const error = await response.text();
          return NextResponse.json(
            { error: `Anthropic API error: ${error}` },
            { status: 500 }
          );
        }
      } catch (e) {
        console.error('Anthropic API error:', e);
        return NextResponse.json(
          { error: 'Failed to call Anthropic API' },
          { status: 500 }
        );
      }
    } else if (config.provider === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model || 'gpt-4o-mini',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          judgeResponse = data.choices?.[0]?.message?.content || '';

          // Parse JSON from response
          const jsonMatch = judgeResponse.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            score = Math.min(10, Math.max(0, Number(parsed.score) || 7));
            reasoning = parsed.reasoning || 'Evaluation completed';
          }
        } else {
          const error = await response.text();
          return NextResponse.json(
            { error: `OpenAI API error: ${error}` },
            { status: 500 }
          );
        }
      } catch (e) {
        console.error('OpenAI API error:', e);
        return NextResponse.json(
          { error: 'Failed to call OpenAI API' },
          { status: 500 }
        );
      }
    } else if (config.provider === 'google') {
      try {
        const modelName = config.model || 'gemini-1.5-flash';
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 200 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          judgeResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

          // Parse JSON from response
          const jsonMatch = judgeResponse.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            score = Math.min(10, Math.max(0, Number(parsed.score) || 7));
            reasoning = parsed.reasoning || 'Evaluation completed';
          }
        } else {
          const error = await response.text();
          return NextResponse.json(
            { error: `Google API error: ${error}` },
            { status: 500 }
          );
        }
      } catch (e) {
        console.error('Google API error:', e);
        return NextResponse.json(
          { error: 'Failed to call Google API' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${config.provider}` },
        { status: 400 }
      );
    }

    // Determine status based on threshold
    const status = score >= config.passThreshold ? 'pass' : score >= config.passThreshold * 0.6 ? 'review' : 'fail';

    // Update trace in store
    if (traceId) {
      await updateEvaluation(traceId, {
        score,
        status,
        judgeModel: config.model,
        evaluatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      score,
      status,
      reasoning,
      judgeResponse,
    });
  } catch (e) {
    console.error('Evaluation error:', e);
    return NextResponse.json(
      { error: 'Evaluation failed' },
      { status: 500 }
    );
  }
}
