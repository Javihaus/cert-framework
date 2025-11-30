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

  // Get API key from header if present
  const apiKeyFromHeader = request.headers.get('x-api-key');

  debug.auth = {
    authenticated: !!authResult.user,
    userId: authResult.user?.id,
    email: authResult.user?.email,
    userApiKey: authResult.user?.api_key ? `${authResult.user.api_key.substring(0, 15)}...` : null,
    authError: authResult.error,
    hasSupabaseAuthCookies: supabaseAuthCookies.length > 0,
    supabaseAuthCookieNames: supabaseAuthCookies.map(c => c.name),
    hasApiKeyHeader: !!apiKeyFromHeader,
    apiKeyFromHeader: apiKeyFromHeader ? `${apiKeyFromHeader.substring(0, 15)}...` : null,
  };

  // If API key was provided but auth failed, try to diagnose why
  if (apiKeyFromHeader && !authResult.user) {
    try {
      const supabase = getSupabaseClient();
      // Check if the key exists in the database at all
      const testUser = await supabase.getUserByApiKey(apiKeyFromHeader);
      debug.apiKeyDiagnostics = {
        keyFound: !!testUser,
        keyActive: testUser?.is_active || false,
        keyUserEmail: testUser?.email || null,
      };
    } catch (error) {
      debug.apiKeyDiagnostics = {
        error: String(error),
      };
    }
  }

  // List all users for diagnostics (only if accessed with service role)
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      // This only works with service role key
      const allUsersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id,email,api_key,is_active`,
        {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
        }
      );
      if (allUsersResponse.ok) {
        const allUsers = await allUsersResponse.json();
        debug.usersInDatabase = allUsers.map((u: { email: string; api_key: string; is_active: boolean }) => ({
          email: u.email,
          apiKey: u.api_key ? `${u.api_key.substring(0, 15)}...` : 'NO_API_KEY',
          isActive: u.is_active,
        }));
      }
    } catch (error) {
      debug.usersQueryError = String(error);
    }
  }

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
