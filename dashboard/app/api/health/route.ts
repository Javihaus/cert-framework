import { NextResponse } from 'next/server';

/**
 * GET /api/health - Check if the app is configured correctly
 */
export async function GET() {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  };

  const isConfigured = config.supabaseUrl === 'SET' && config.supabaseKey === 'SET';

  return NextResponse.json({
    status: isConfigured ? 'ok' : 'missing_config',
    config,
    message: isConfigured
      ? 'Supabase is configured'
      : 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  });
}
