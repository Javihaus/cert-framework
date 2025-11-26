import { NextRequest, NextResponse } from 'next/server';
import { addTraces, getTraces, getStats, clearTraces, getTraceCount, CERTTrace } from '@/lib/trace-store';

/**
 * OTLP Trace Receiver Endpoint
 *
 * Receives traces from OpenLLMetry/OpenTelemetry instrumented applications.
 * Supports both OTLP JSON format and simplified CERT format.
 */

/**
 * Parse OTLP JSON format into CERT traces
 */
function parseOTLPTraces(body: Record<string, unknown>): CERTTrace[] {
  const traces: CERTTrace[] = [];

  const resourceSpans = body.resourceSpans as Array<{
    resource?: { attributes?: Array<{ key: string; value: unknown }> };
    scopeSpans?: Array<{
      scope?: { name?: string };
      spans?: Array<{
        traceId: string;
        spanId: string;
        parentSpanId?: string;
        name: string;
        kind: number;
        startTimeUnixNano: string;
        endTimeUnixNano: string;
        status?: { code?: number; message?: string };
        attributes?: Array<{ key: string; value: unknown }>;
      }>;
    }>;
  }>;

  if (!resourceSpans) return traces;

  for (const resourceSpan of resourceSpans) {
    const scopeSpans = resourceSpan.scopeSpans || [];

    for (const scopeSpan of scopeSpans) {
      const spans = scopeSpan.spans || [];

      for (const span of spans) {
        const attrs: Record<string, unknown> = {};
        for (const attr of span.attributes || []) {
          const value = attr.value as { stringValue?: string; intValue?: string; doubleValue?: number; boolValue?: boolean };
          attrs[attr.key] = value.stringValue || value.intValue || value.doubleValue || value.boolValue;
        }

        const startNano = BigInt(span.startTimeUnixNano);
        const endNano = BigInt(span.endTimeUnixNano);
        const durationMs = Number((endNano - startNano) / BigInt(1_000_000));

        const llmData = extractLLMData(attrs);

        const certTrace: CERTTrace = {
          id: `${span.traceId}-${span.spanId}`,
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentSpanId,
          name: span.name,
          kind: ['UNSPECIFIED', 'INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER'][span.kind] || 'UNKNOWN',
          startTime: new Date(Number(startNano / BigInt(1_000_000))).toISOString(),
          endTime: new Date(Number(endNano / BigInt(1_000_000))).toISOString(),
          durationMs,
          status: span.status?.code === 2 ? 'error' : span.status?.code === 1 ? 'ok' : 'unset',
          attributes: attrs,
          llm: llmData,
          receivedAt: new Date().toISOString(),
          source: 'otlp',
        };

        traces.push(certTrace);
      }
    }
  }

  return traces;
}

/**
 * Extract LLM-specific data from span attributes
 */
function extractLLMData(attrs: Record<string, unknown>) {
  const vendor = (attrs['llm.vendor'] || attrs['gen_ai.system'] || 'unknown') as string;
  const model = (attrs['llm.request.model'] || attrs['llm.response.model'] || attrs['gen_ai.request.model'] || attrs['gen_ai.response.model'] || 'unknown') as string;

  const promptTokens = Number(attrs['llm.usage.prompt_tokens'] || attrs['gen_ai.usage.input_tokens'] || 0);
  const completionTokens = Number(attrs['llm.usage.completion_tokens'] || attrs['gen_ai.usage.output_tokens'] || 0);
  const totalTokens = Number(attrs['llm.usage.total_tokens'] || promptTokens + completionTokens);

  if (vendor === 'unknown' && model === 'unknown' && totalTokens === 0) {
    return undefined;
  }

  return {
    vendor,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    input: attrs['llm.prompts'] as string | undefined,
    output: attrs['llm.completions'] as string | undefined,
    temperature: attrs['llm.temperature'] as number | undefined,
  };
}

/**
 * Parse simplified CERT SDK format
 */
function parseCERTFormat(body: Record<string, unknown>): CERTTrace[] {
  const traces = body.traces as Array<{
    id?: string;
    model: string;
    provider: string;
    input: string;
    output: string;
    promptTokens?: number;
    completionTokens?: number;
    durationMs?: number;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;

  if (!traces) return [];

  return traces.map((t, i) => ({
    id: t.id || `cert-${Date.now()}-${i}`,
    traceId: t.id || `cert-${Date.now()}`,
    spanId: `span-${i}`,
    name: `${t.provider}.${t.model}`,
    kind: 'CLIENT',
    startTime: t.timestamp || new Date().toISOString(),
    endTime: t.timestamp || new Date().toISOString(),
    durationMs: t.durationMs || 0,
    status: 'ok' as const,
    attributes: t.metadata || {},
    llm: {
      vendor: t.provider,
      model: t.model,
      promptTokens: t.promptTokens || 0,
      completionTokens: t.completionTokens || 0,
      totalTokens: (t.promptTokens || 0) + (t.completionTokens || 0),
      input: t.input,
      output: t.output,
    },
    receivedAt: new Date().toISOString(),
    source: 'sdk' as const,
  }));
}

/**
 * POST /api/v1/traces - Receive traces
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-protobuf')) {
      return NextResponse.json(
        { error: 'Protobuf not supported yet. Use JSON format with Content-Type: application/json' },
        { status: 415 }
      );
    } else {
      body = await request.json();
    }

    let newTraces: CERTTrace[];

    if (body.resourceSpans) {
      newTraces = parseOTLPTraces(body);
    } else if (body.traces) {
      newTraces = parseCERTFormat(body);
    } else {
      return NextResponse.json(
        { error: 'Unknown trace format. Expected OTLP or CERT format.' },
        { status: 400 }
      );
    }

    // Store traces using shared store (async)
    await addTraces(newTraces);

    const total = await getTraceCount();
    console.log(`[CERT] Received ${newTraces.length} traces. Total stored: ${total}`);

    return NextResponse.json({
      success: true,
      received: newTraces.length,
      total,
    });

  } catch (error) {
    console.error('[CERT] Error processing traces:', error);
    return NextResponse.json(
      { error: 'Failed to process traces', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/traces - Retrieve traces
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  const model = searchParams.get('model') || undefined;
  const status = searchParams.get('status') || undefined;
  const llmOnly = searchParams.get('llm_only') === 'true';

  const traces = await getTraces({
    limit,
    offset,
    llmOnly,
    model,
    status,
  });

  const stats = await getStats();

  return NextResponse.json({
    traces,
    pagination: {
      total: stats.total,
      limit,
      offset,
      hasMore: offset + limit < stats.total,
    },
    stats,
  });
}

/**
 * DELETE /api/v1/traces - Clear traces
 */
export async function DELETE() {
  const count = await clearTraces();

  return NextResponse.json({
    success: true,
    deleted: count,
  });
}
