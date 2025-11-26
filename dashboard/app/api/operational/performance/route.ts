import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceMetrics } from '@/lib/trace-store';

/**
 * GET /api/operational/performance - Get performance metrics
 */
export async function GET(request: NextRequest) {
  const metrics = await getPerformanceMetrics();
  return NextResponse.json(metrics);
}
