/**
 * Authentication helpers for API routes
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseClient, isSupabaseConfigured, User } from './supabase';

export interface AuthResult {
  user: User | null;
  error?: string;
}

/**
 * Get user from Supabase Auth session (dashboard login)
 */
async function getSupabaseAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only for this use case
          },
        },
      }
    );

    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

    if (!authUser) {
      return null;
    }

    // Get the user profile from our users table
    const supabase = getSupabaseClient();
    const user = await supabase.getUserById(authUser.id);

    return user;
  } catch (error) {
    console.error('[Auth] Error getting Supabase Auth user:', error);
    return null;
  }
}

/**
 * Get the authenticated user from the request.
 * Supports:
 * 1. Supabase Auth session (web dashboard)
 * 2. API Key header (notebooks/SDK)
 * 3. Bearer token (API clients)
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Database not configured' };
  }

  const supabase = getSupabaseClient();

  // 1. Check API Key header first (notebooks/SDK) - most common for trace ingestion
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const user = await supabase.getUserByApiKey(apiKey);
    if (user && user.is_active) {
      return { user };
    }
    return { user: null, error: 'Invalid API key' };
  }

  // 2. Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Try as API key
    const user = await supabase.getUserByApiKey(token);
    if (user && user.is_active) {
      return { user };
    }

    return { user: null, error: 'Invalid token' };
  }

  // 3. Check Supabase Auth session (web dashboard)
  const authUser = await getSupabaseAuthUser();
  if (authUser && authUser.is_active) {
    return { user: authUser };
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
