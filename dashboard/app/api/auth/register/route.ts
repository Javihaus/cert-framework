import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/auth/register - Create a new user account using Supabase Auth
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    const { email, password, name, company } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          company: company?.trim(),
        },
      },
    });

    if (authError) {
      console.error('[Auth] Supabase signup error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account - no user returned' },
        { status: 500 }
      );
    }

    // Note: User profile is created automatically by the database trigger
    // (handle_new_user function in schema.sql)
    // If the trigger hasn't been set up, we try to create it manually
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        company: company?.trim(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[Auth] Profile creation error:', profileError);
      // Continue anyway - the user can still log in
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name.trim(),
        company: company?.trim(),
      },
      message: authData.user.email_confirmed_at ? 'Account created successfully' : 'Please check your email to confirm your account',
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Registration failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
