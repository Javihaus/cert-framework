import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/v1/debug - Debug authentication and data status
 * This helps diagnose trace storage issues
 */
export async function GET(request: NextRequest) {
  const debug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseConfigured(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  };

  // Check authentication
  const authResult = await getAuthUser(request);

  // Check for Supabase Auth cookies (they start with 'sb-')
  const allCookies = request.cookies.getAll();
  const supabaseAuthCookies = allCookies.filter(c => c.name.startsWith('sb-'));

  debug.auth = {
    authenticated: !!authResult.user,
    userId: authResult.user?.id,
    email: authResult.user?.email,
    apiKey: authResult.user?.api_key ? `${authResult.user.api_key.substring(0, 10)}...` : null,
    error: authResult.error,
    hasSupabaseAuthCookies: supabaseAuthCookies.length > 0,
    supabaseAuthCookieNames: supabaseAuthCookies.map(c => c.name),
    hasApiKeyHeader: !!request.headers.get('x-api-key'),
  };

  // If authenticated and Supabase is configured, check data
  if (authResult.user && isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();

      // Get trace count
      const traces = await supabase.getTraces({ userId: authResult.user.id, limit: 10 });
      debug.data = {
        traceCount: traces.length,
        sampleTraces: traces.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          model: t.model,
          created_at: t.created_at,
          project_id: t.project_id,
        })),
      };

      // Get projects
      const projects = await supabase.getProjectsByUser(authResult.user.id);
      debug.projects = {
        count: projects.length,
        list: projects.map(p => ({ id: p.id, name: p.name })),
      };
    } catch (error) {
      debug.dataError = String(error);
    }
  }

  return NextResponse.json(debug, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
