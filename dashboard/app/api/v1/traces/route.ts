import { NextRequest, NextResponse } from 'next/server';
import { addTraces, getTraces, getStats, clearTraces, getTraceCount, CERTTrace } from '@/lib/trace-store';
import { getAuthUser } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured, DBTrace } from '@/lib/supabase';

/**
 * OTLP Trace Receiver Endpoint
 *
 * Receives traces from OpenLLMetry/OpenTelemetry instrumented applications.
 * Supports both OTLP JSON format and simplified CERT format.
 *
 * Authentication:
 * - If authenticated (API key or session): traces stored in Supabase with user association
 * - If not authenticated: traces stored in memory/KV (legacy behavior, temporary)
 */

// CORS headers for cross-origin requests (notebooks, external clients)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

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

  // Extract context/retrieved documents if available
  const context = (
    attrs['llm.context'] ||
    attrs['llm.retrieved_docs'] ||
    attrs['llm.retrieved_context'] ||
    attrs['gen_ai.context'] ||
    attrs['rag.retrieved_documents'] ||
    attrs['rag.context']
  ) as string | string[] | undefined;

  return {
    vendor,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    input: attrs['llm.prompts'] as string | undefined,
    output: attrs['llm.completions'] as string | undefined,
    context,
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
    context?: string | string[];  // Source context/retrieved chunks
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
      context: t.context,
    },
    receivedAt: new Date().toISOString(),
    source: 'sdk' as const,
  }));
}

/**
 * Convert CERTTrace to DBTrace format for Supabase
 */
function toDBTrace(trace: CERTTrace, userId: string, projectId?: string): Partial<DBTrace> & { user_id: string; name: string } {
  return {
    user_id: userId,
    project_id: projectId,
    trace_id: trace.traceId,
    span_id: trace.spanId,
    parent_span_id: trace.parentSpanId,
    name: trace.name,
    kind: trace.kind,
    vendor: trace.llm?.vendor,
    model: trace.llm?.model,
    input_text: trace.llm?.input,
    output_text: trace.llm?.output,
    context: trace.llm?.context ? (Array.isArray(trace.llm.context) ? trace.llm.context : [trace.llm.context]) : undefined,
    prompt_tokens: trace.llm?.promptTokens || 0,
    completion_tokens: trace.llm?.completionTokens || 0,
    total_tokens: trace.llm?.totalTokens || 0,
    duration_ms: trace.durationMs,
    start_time: trace.startTime,
    end_time: trace.endTime,
    status: trace.status,
    metadata: trace.attributes,
    source: trace.source,
  };
}

/**
 * Convert DBTrace to CERTTrace format for API response
 */
function toCERTTrace(dbTrace: DBTrace): CERTTrace {
  return {
    id: dbTrace.id,
    traceId: dbTrace.trace_id || dbTrace.id,
    spanId: dbTrace.span_id || 'span-0',
    parentSpanId: dbTrace.parent_span_id,
    name: dbTrace.name,
    kind: dbTrace.kind,
    startTime: dbTrace.start_time || dbTrace.created_at,
    endTime: dbTrace.end_time || dbTrace.created_at,
    durationMs: dbTrace.duration_ms,
    status: dbTrace.status,
    attributes: dbTrace.metadata,
    llm: dbTrace.vendor || dbTrace.model ? {
      vendor: dbTrace.vendor || 'unknown',
      model: dbTrace.model || 'unknown',
      promptTokens: dbTrace.prompt_tokens,
      completionTokens: dbTrace.completion_tokens,
      totalTokens: dbTrace.total_tokens,
      input: dbTrace.input_text,
      output: dbTrace.output_text,
      context: dbTrace.context,
    } : undefined,
    evaluation: dbTrace.evaluation_score !== null && dbTrace.evaluation_score !== undefined ? {
      score: dbTrace.evaluation_score,
      status: dbTrace.evaluation_status,
      criteria: dbTrace.evaluation_criteria,
      judgeModel: dbTrace.evaluated_by,
      evaluatedAt: dbTrace.evaluated_at,
    } : undefined,
    receivedAt: dbTrace.created_at,
    source: dbTrace.source,
  };
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
        { status: 415, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for authentication
    const authResult = await getAuthUser(request);

    if (authResult.user && isSupabaseConfigured()) {
      // Authenticated: store in Supabase
      const supabase = getSupabaseClient();

      // Extract project name from trace metadata if available
      let projectName = 'Default Project';
      if (newTraces.length > 0 && newTraces[0].attributes) {
        const metadata = newTraces[0].attributes as Record<string, unknown>;
        if (metadata.project && typeof metadata.project === 'string') {
          projectName = metadata.project;
        }
      }

      // Get or create project for this user
      let project;
      try {
        project = await supabase.getOrCreateDefaultProject(authResult.user.id, projectName);
        console.log(`[CERT] Using project: ${project.name} (${project.id})`);
      } catch (error) {
        console.error(`[CERT] Failed to get/create project:`, error);
        // Continue without project - traces will still be stored
      }

      // Convert and insert traces with timestamps
      const dbTraces = newTraces.map(t => ({
        ...toDBTrace(t, authResult.user!.id, project?.id),
        // Ensure timestamps are properly set
        start_time: t.startTime || new Date().toISOString(),
        end_time: t.endTime || new Date().toISOString(),
      }));

      try {
        await supabase.insertTraces(dbTraces);
      } catch (insertError) {
        console.error(`[CERT] Failed to insert traces:`, insertError);
        return NextResponse.json({
          success: false,
          error: 'Failed to store traces',
          details: String(insertError),
        }, { status: 500, headers: corsHeaders });
      }

      const total = await supabase.getTraceCount(authResult.user.id);
      console.log(`[CERT] Received ${newTraces.length} traces for user ${authResult.user.email}. Total stored: ${total}`);

      return NextResponse.json({
        success: true,
        received: newTraces.length,
        total,
        storage: 'supabase',
        stored_in_db: true,
        user_id: authResult.user.id,
        project_id: project?.id,
        project_name: project?.name,
      }, { headers: corsHeaders });

    } else {
      // Not authenticated: use legacy memory/KV storage
      await addTraces(newTraces);
      const total = await getTraceCount();
      console.log(`[CERT] Received ${newTraces.length} traces (unauthenticated). Total in memory: ${total}`);

      return NextResponse.json({
        success: true,
        received: newTraces.length,
        total,
        storage: process.env.KV_REST_API_URL ? 'kv' : 'memory',
        authenticated: false,
        message: 'Traces stored temporarily. Register for persistent storage.',
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('[CERT] Error processing traces:', error);
    return NextResponse.json(
      { error: 'Failed to process traces', details: String(error) },
      { status: 500, headers: corsHeaders }
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
  const llmOnly = searchParams.get('llm_only') === 'true' || searchParams.get('llmOnly') === 'true';

  // Check for authentication
  const authResult = await getAuthUser(request);

  if (authResult.user && isSupabaseConfigured()) {
    // Authenticated: get from Supabase
    const supabase = getSupabaseClient();

    const dbTraces = await supabase.getTraces({
      userId: authResult.user.id,
      limit,
      offset,
      model,
      evaluationStatus: status,
    });

    // Filter for LLM traces if requested
    let traces = dbTraces.map(toCERTTrace);
    if (llmOnly) {
      traces = traces.filter(t => t.llm);
    }

    const stats = await supabase.getTraceStats(authResult.user.id);

    return NextResponse.json({
      traces,
      pagination: {
        total: stats.total,
        limit,
        offset,
        hasMore: offset + limit < stats.total,
      },
      stats: {
        total: stats.total,
        llmTraces: stats.total,
        evaluated: stats.byStatus.pass + stats.byStatus.fail + stats.byStatus.review,
        byStatus: stats.byStatus,
        byVendor: stats.byVendor,
        byModel: stats.byModel,
        totalTokens: stats.totalTokens,
      },
      storage: 'supabase',
      userId: authResult.user.id,
    }, { headers: corsHeaders });

  } else {
    // Not authenticated: use legacy memory/KV storage
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
      storage: process.env.KV_REST_API_URL ? 'kv' : 'memory',
      authenticated: false,
    }, { headers: corsHeaders });
  }
}

/**
 * DELETE /api/v1/traces - Clear traces
 */
export async function DELETE(request: NextRequest) {
  // Check for authentication
  const authResult = await getAuthUser(request);

  if (authResult.user && isSupabaseConfigured()) {
    // Authenticated: delete from Supabase
    const supabase = getSupabaseClient();
    await supabase.deleteTraces(authResult.user.id);

    return NextResponse.json({
      success: true,
      message: 'All traces deleted',
      storage: 'supabase',
    }, { headers: corsHeaders });

  } else {
    // Not authenticated: clear memory/KV storage
    const count = await clearTraces();

    return NextResponse.json({
      success: true,
      deleted: count,
      storage: process.env.KV_REST_API_URL ? 'kv' : 'memory',
    }, { headers: corsHeaders });
  }
}
