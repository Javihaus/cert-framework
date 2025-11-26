import { NextRequest, NextResponse } from 'next/server';

/**
 * OTLP Trace Receiver Endpoint
 *
 * Receives traces from OpenLLMetry/OpenTelemetry instrumented applications.
 * Supports both OTLP JSON format and simplified CERT format.
 *
 * Standard OTLP endpoint: POST /api/v1/traces
 */

// In-memory store for demo (in production, use a database)
const traceStore: CERTTrace[] = [];
const MAX_TRACES = 1000;

export interface LLMSpanAttributes {
  'llm.vendor'?: string;
  'llm.request.type'?: string;
  'llm.request.model'?: string;
  'llm.response.model'?: string;
  'llm.usage.prompt_tokens'?: number;
  'llm.usage.completion_tokens'?: number;
  'llm.usage.total_tokens'?: number;
  'llm.prompts'?: string;
  'llm.completions'?: string;
  'llm.temperature'?: number;
  'llm.top_p'?: number;
  'llm.frequency_penalty'?: number;
  'llm.presence_penalty'?: number;
  'llm.chat.stop_sequences'?: string[];
  'gen_ai.system'?: string;
  'gen_ai.request.model'?: string;
  'gen_ai.response.model'?: string;
  'gen_ai.usage.input_tokens'?: number;
  'gen_ai.usage.output_tokens'?: number;
}

export interface CERTTrace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: 'ok' | 'error' | 'unset';
  attributes: LLMSpanAttributes & Record<string, unknown>;
  // Extracted LLM-specific fields for easy access
  llm?: {
    vendor: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    input?: string;
    output?: string;
    temperature?: number;
  };
  // Evaluation results (added by CERT)
  evaluation?: {
    score?: number;
    status?: 'pass' | 'fail' | 'review';
    criteria?: Record<string, number>;
    judgeModel?: string;
    evaluatedAt?: string;
  };
  // Metadata
  receivedAt: string;
  source: 'otlp' | 'sdk' | 'manual';
}

/**
 * Parse OTLP JSON format into CERT traces
 */
function parseOTLPTraces(body: Record<string, unknown>): CERTTrace[] {
  const traces: CERTTrace[] = [];

  // OTLP format: { resourceSpans: [{ scopeSpans: [{ spans: [...] }] }] }
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
        // Convert attributes array to object
        const attrs: Record<string, unknown> = {};
        for (const attr of span.attributes || []) {
          const value = attr.value as { stringValue?: string; intValue?: string; doubleValue?: number; boolValue?: boolean };
          attrs[attr.key] = value.stringValue || value.intValue || value.doubleValue || value.boolValue;
        }

        // Calculate duration
        const startNano = BigInt(span.startTimeUnixNano);
        const endNano = BigInt(span.endTimeUnixNano);
        const durationMs = Number((endNano - startNano) / BigInt(1_000_000));

        // Extract LLM-specific data
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
          attributes: attrs as LLMSpanAttributes & Record<string, unknown>,
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

  // Only return if this looks like an LLM span
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

    // Parse body based on content type
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-protobuf')) {
      // For protobuf, we'd need to decode - for now, return unsupported
      return NextResponse.json(
        { error: 'Protobuf not supported yet. Use JSON format with Content-Type: application/json' },
        { status: 415 }
      );
    } else {
      body = await request.json();
    }

    // Detect format and parse
    let newTraces: CERTTrace[];

    if (body.resourceSpans) {
      // OTLP format
      newTraces = parseOTLPTraces(body);
    } else if (body.traces) {
      // CERT SDK format
      newTraces = parseCERTFormat(body);
    } else {
      return NextResponse.json(
        { error: 'Unknown trace format. Expected OTLP or CERT format.' },
        { status: 400 }
      );
    }

    // Store traces (with limit)
    for (const trace of newTraces) {
      traceStore.unshift(trace);
    }

    // Trim to max size
    while (traceStore.length > MAX_TRACES) {
      traceStore.pop();
    }

    console.log(`[CERT] Received ${newTraces.length} traces. Total stored: ${traceStore.length}`);

    return NextResponse.json({
      success: true,
      received: newTraces.length,
      total: traceStore.length,
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
  const model = searchParams.get('model');
  const status = searchParams.get('status');
  const hasLLM = searchParams.get('llm_only') === 'true';

  let filtered = [...traceStore];

  // Filter by LLM traces only
  if (hasLLM) {
    filtered = filtered.filter(t => t.llm);
  }

  // Filter by model
  if (model) {
    filtered = filtered.filter(t => t.llm?.model?.includes(model));
  }

  // Filter by evaluation status
  if (status) {
    filtered = filtered.filter(t => t.evaluation?.status === status);
  }

  // Paginate
  const paginated = filtered.slice(offset, offset + limit);

  // Calculate stats
  const llmTraces = traceStore.filter(t => t.llm);
  const stats = {
    total: traceStore.length,
    llmTraces: llmTraces.length,
    evaluated: traceStore.filter(t => t.evaluation).length,
    byStatus: {
      pass: traceStore.filter(t => t.evaluation?.status === 'pass').length,
      fail: traceStore.filter(t => t.evaluation?.status === 'fail').length,
      review: traceStore.filter(t => t.evaluation?.status === 'review').length,
    },
    byVendor: llmTraces.reduce((acc, t) => {
      const vendor = t.llm?.vendor || 'unknown';
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalTokens: llmTraces.reduce((acc, t) => acc + (t.llm?.totalTokens || 0), 0),
  };

  return NextResponse.json({
    traces: paginated,
    pagination: {
      total: filtered.length,
      limit,
      offset,
      hasMore: offset + limit < filtered.length,
    },
    stats,
  });
}

/**
 * DELETE /api/v1/traces - Clear traces
 */
export async function DELETE() {
  const count = traceStore.length;
  traceStore.length = 0;

  return NextResponse.json({
    success: true,
    deleted: count,
  });
}
