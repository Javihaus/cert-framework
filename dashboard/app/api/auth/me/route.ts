import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/auth/me - Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured', user: null },
        { status: 200 }
      );
    }

    const token = request.cookies.get('cert-session')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const supabase = getSupabaseClient();

    // Get session
    const session = await supabase.getSessionByToken(token);
    if (!session) {
      // Session expired or invalid, clear cookie
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.set('cert-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
      });
      return response;
    }

    // Get user
    const user = await supabase.getUserById(session.user_id);
    if (!user || !user.is_active) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.set('cert-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        path: '/',
      });
      return response;
    }

    // Get user's projects
    const projects = await supabase.getProjectsByUser(user.id);

    // Get trace stats
    const stats = await supabase.getTraceStats(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        apiKey: user.api_key,
        createdAt: user.created_at,
        settings: user.settings,
      },
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
      })),
      stats: {
        totalTraces: stats.total,
        byStatus: stats.byStatus,
        totalTokens: stats.totalTokens,
      },
    });

  } catch (error) {
    console.error('[Auth] Get user error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
