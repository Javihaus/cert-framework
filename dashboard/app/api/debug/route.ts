import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/debug - Test Supabase connection
 */
export async function GET() {
  const results: Record<string, unknown> = {
    envCheck: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET',
    },
  };

  try {
    // Test 1: Create client
    const supabase = await createClient();
    results.clientCreated = true;

    // Test 2: Check auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    results.authTest = {
      success: !authError,
      error: authError?.message,
      hasSession: !!authData?.session,
    };

    // Test 3: Check if users table exists
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    results.usersTable = {
      exists: !usersError,
      error: usersError?.message,
    };

    // Test 4: Check if projects table exists
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    results.projectsTable = {
      exists: !projectsError,
      error: projectsError?.message,
    };

    // Test 5: Check if traces table exists
    const { data: tracesData, error: tracesError } = await supabase
      .from('traces')
      .select('count')
      .limit(1);
    results.tracesTable = {
      exists: !tracesError,
      error: tracesError?.message,
    };

    // Test 6: Try a test signup (with a random email that won't be used)
    const testEmail = `test-${Date.now()}@debug-test.local`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: { name: 'Debug Test' },
      },
    });
    results.signupTest = {
      success: !signupError,
      error: signupError?.message,
      errorCode: signupError?.status,
    };

    results.status = 'Tests completed';

  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.status = 'Error during tests';
  }

  return NextResponse.json(results, { status: 200 });
}

/**
 * POST /api/debug - Test login with provided credentials
 * Send: { "email": "your@email.com", "password": "yourpassword" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Test login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        errorMessage: error.message,
        errorCode: error.code,
        errorStatus: error.status,
        errorName: error.name,
        fullError: JSON.stringify(error),
      }, { status: 200 });
    }

    // Check user details
    const userInfo = {
      id: data.user?.id,
      email: data.user?.email,
      emailConfirmedAt: data.user?.email_confirmed_at,
      createdAt: data.user?.created_at,
      lastSignIn: data.user?.last_sign_in_at,
      metadata: data.user?.user_metadata,
    };

    return NextResponse.json({
      success: true,
      user: userInfo,
      hasSession: !!data.session,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
