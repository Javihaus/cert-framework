import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * POST /api/auth/logout - End user session
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cert-session')?.value;

    if (token && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      await supabase.deleteSession(token);
    }

    // Clear session cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set('cert-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Still clear the cookie even if there's an error
    const response = NextResponse.json({ success: true });
    response.cookies.set('cert-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });
    return response;
  }
}
