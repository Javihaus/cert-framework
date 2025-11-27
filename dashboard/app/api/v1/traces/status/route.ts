import { NextResponse } from 'next/server';
import { getTraceCount, getStats } from '@/lib/trace-store';

/**
 * GET /api/v1/traces/status - Check trace storage status
 *
 * Diagnostic endpoint to verify storage configuration
 */
export async function GET() {
  const isKVConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  let count = 0;
  let stats = null;
  let kvError = null;

  try {
    count = await getTraceCount();
    stats = await getStats();
  } catch (error) {
    kvError = String(error);
  }

  return NextResponse.json({
    status: 'ok',
    storage: {
      type: isKVConfigured ? 'vercel-kv' : 'memory',
      configured: isKVConfigured,
      warning: isKVConfigured ? null : 'In-memory storage does not persist between serverless invocations. Configure Vercel KV for production use.',
      error: kvError,
    },
    traces: {
      count,
      stats,
    },
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
