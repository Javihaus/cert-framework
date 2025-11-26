import { NextRequest, NextResponse } from 'next/server';
import { getQualityMetrics } from '@/lib/trace-store';

/**
 * GET /api/quality/summary - Get quality metrics summary
 */
export async function GET(request: NextRequest) {
  const metrics = await getQualityMetrics();
  return NextResponse.json(metrics);
}
