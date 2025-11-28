import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/auth/logout - End user session
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json({ success: true });
  }
}
