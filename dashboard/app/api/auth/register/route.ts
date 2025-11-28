import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  hashPassword,
  generateSessionToken,
} from '@/lib/supabase';

/**
 * POST /api/auth/register - Create a new user account
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables.' },
        { status: 503 }
      );
    }

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

    const supabase = getSupabaseClient();

    // Check if user already exists
    const existingUser = await supabase.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await supabase.createUser({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      company: company?.trim(),
      password_hash: passwordHash,
    });

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await supabase.createSession({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    // Create default project for user
    await supabase.createProject({
      user_id: user.id,
      name: 'Default Project',
      description: 'Your first CERT project',
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        apiKey: user.api_key,
      },
    });

    response.cookies.set('cert-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
