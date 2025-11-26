import { NextRequest, NextResponse } from 'next/server';
import { traceStore } from '@/lib/trace-store';

/**
 * GET /api/operational/performance - Get performance metrics
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';

  const metrics = traceStore.getPerformanceMetrics();

  if (!metrics) {
    return NextResponse.json(null);
  }

  return NextResponse.json(metrics);
}
