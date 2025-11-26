import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation } from '@/lib/trace-store';

interface HumanReviewRequest {
  traceId: string;
  score: number;
  notes?: string;
  status: 'pass' | 'fail' | 'review';
}

export async function POST(request: NextRequest) {
  try {
    const { traceId, score, notes, status }: HumanReviewRequest = await request.json();

    if (!traceId) {
      return NextResponse.json(
        { error: 'Trace ID is required' },
        { status: 400 }
      );
    }

    if (score === undefined || score < 0 || score > 10) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 10' },
        { status: 400 }
      );
    }

    // Update evaluation in store
    const success = await updateEvaluation(traceId, {
      score,
      status,
      evaluatedAt: new Date().toISOString(),
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update trace' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      traceId,
      score,
      status,
    });
  } catch (e) {
    console.error('Human review error:', e);
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    );
  }
}
