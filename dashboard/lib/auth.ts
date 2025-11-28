/**
 * Authentication helpers for API routes
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured, User } from './supabase';

export interface AuthResult {
  user: User | null;
  error?: string;
}

/**
 * Get the authenticated user from the request.
 * Supports:
 * 1. Session cookie (web dashboard)
 * 2. API Key header (notebooks/SDK)
 * 3. Bearer token (API clients)
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Database not configured' };
  }

  const supabase = getSupabaseClient();

  // 1. Check session cookie (web dashboard)
  const sessionToken = request.cookies.get('cert-session')?.value;
  if (sessionToken) {
    const session = await supabase.getSessionByToken(sessionToken);
    if (session) {
      const user = await supabase.getUserById(session.user_id);
      if (user && user.is_active) {
        return { user };
      }
    }
  }

  // 2. Check API Key header (notebooks/SDK)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const user = await supabase.getUserByApiKey(apiKey);
    if (user && user.is_active) {
      return { user };
    }
    return { user: null, error: 'Invalid API key' };
  }

  // 3. Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // First try as API key
    let user = await supabase.getUserByApiKey(token);
    if (user && user.is_active) {
      return { user };
    }

    // Then try as session token
    const session = await supabase.getSessionByToken(token);
    if (session) {
      user = await supabase.getUserById(session.user_id);
      if (user && user.is_active) {
        return { user };
      }
    }

    return { user: null, error: 'Invalid token' };
  }

  return { user: null };
}

/**
 * Require authentication for an API route.
 * Returns the user or throws an error response.
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const result = await getAuthUser(request);

  if (!result.user) {
    return {
      user: null,
      error: result.error || 'Authentication required. Please log in or provide an API key.',
    };
  }

  return result;
}
