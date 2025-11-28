import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/auth/me - Get current authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get trace stats
    const { data: traces } = await supabase
      .from('traces')
      .select('evaluation_status, total_tokens')
      .eq('user_id', user.id);

    const stats = {
      totalTraces: traces?.length || 0,
      byStatus: {
        pass: traces?.filter(t => t.evaluation_status === 'pass').length || 0,
        fail: traces?.filter(t => t.evaluation_status === 'fail').length || 0,
        review: traces?.filter(t => t.evaluation_status === 'review').length || 0,
        pending: traces?.filter(t => !t.evaluation_status).length || 0,
      },
      totalTokens: traces?.reduce((sum, t) => sum + (t.total_tokens || 0), 0) || 0,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || 'User',
        company: profile?.company || user.user_metadata?.company,
        apiKey: profile?.api_key,
        createdAt: profile?.created_at,
        settings: profile?.settings,
      },
      projects: projects?.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
      })) || [],
      stats,
    });

  } catch (error) {
    console.error('[Auth] Get user error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
