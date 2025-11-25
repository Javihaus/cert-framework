import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '24h';

  // In production, this would query a database
  // For now, return empty state or mock data based on localStorage sync
  return NextResponse.json({
    passRate: 0,
    passRateTrend: 0,
    tracesEvaluated: 0,
    pendingReview: 0,
    criteriaScores: {
      accuracy: 0,
      relevance: 0,
      safety: 0,
      coherence: 0,
    },
    recentEvaluations: [],
  });
}
