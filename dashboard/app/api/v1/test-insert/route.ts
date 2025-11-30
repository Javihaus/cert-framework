import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/v1/test-insert - Test trace insertion with detailed error reporting
 * Call this with your API key to test if trace insertion works
 */
export async function GET(request: NextRequest) {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    test: 'trace-insertion',
  };

  // Check authentication
  const authResult = await getAuthUser(request);

  result.auth = {
    authenticated: !!authResult.user,
    userId: authResult.user?.id,
    email: authResult.user?.email,
    error: authResult.error,
  };

  if (!authResult.user) {
    return NextResponse.json({
      ...result,
      success: false,
      error: 'Authentication failed. Provide X-API-Key header.',
    }, {
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ...result,
      success: false,
      error: 'Supabase not configured',
    }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const supabase = getSupabaseClient();

  // Step 1: Try to get or create a project
  let projectId: string | undefined;
  try {
    const project = await supabase.getOrCreateDefaultProject(authResult.user.id, 'Test Project');
    projectId = project.id;
    result.project = {
      success: true,
      id: project.id,
      name: project.name,
    };
  } catch (error) {
    result.project = {
      success: false,
      error: String(error),
    };
  }

  // Step 2: Try to insert a minimal test trace
  const testTrace = {
    user_id: authResult.user.id,
    project_id: projectId,
    name: 'test-trace-' + Date.now(),
    kind: 'llm',
    vendor: 'test',
    model: 'test-model',
    input_text: 'Test input',
    output_text: 'Test output',
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
    duration_ms: 100,
    status: 'ok',
    source: 'sdk',
    metadata: { test: true },
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
  };

  result.traceToInsert = testTrace;

  try {
    // Direct REST API call to see exact error
    const insertResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/traces`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(testTrace),
      }
    );

    const responseText = await insertResponse.text();

    result.insertion = {
      success: insertResponse.ok,
      status: insertResponse.status,
      statusText: insertResponse.statusText,
      response: responseText.substring(0, 500),
    };

    if (insertResponse.ok) {
      // Verify it was inserted
      const count = await supabase.getTraceCount(authResult.user.id);
      result.verification = {
        totalTracesAfterInsert: count,
      };
    }
  } catch (error) {
    result.insertion = {
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
