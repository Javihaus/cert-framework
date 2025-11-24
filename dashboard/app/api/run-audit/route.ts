import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to run compliance audit on traces using async FastAPI backend.
 *
 * New Flow (Production):
 * 1. Receive traces data from frontend
 * 2. Send to FastAPI backend (/api/v2/audit/run)
 * 3. Receive job_id from backend
 * 4. Poll job status until complete
 * 5. Return audit results
 *
 * Benefits:
 * - Non-blocking execution
 * - Can handle multiple concurrent audits
 * - Scalable Celery workers
 * - Auto-retry on failures
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const POLL_INTERVAL_MS = 1000;  // Poll every 1 second (audits are faster)
const MAX_POLL_ATTEMPTS = 180;  // 3 minutes max (180 * 1s)

export async function POST(request: NextRequest) {
  console.log('[API] Audit requested (v2 async)');

  try {
    const body = await request.json();
    const { traces, threshold = 0.7, evaluator = 'semantic' } = body;

    if (!traces) {
      return NextResponse.json(
        { error: 'Missing traces data' },
        { status: 400 }
      );
    }

    // Step 1: Start audit job
    console.log(`[API] Starting audit job with ${evaluator} evaluator, threshold ${threshold}`);

    const startResponse = await fetch(`${API_BASE_URL}/api/v2/audit/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traces, threshold, evaluator }),
    });

    if (!startResponse.ok) {
      const errorData = await startResponse.json();
      throw new Error(errorData.detail || 'Failed to start audit');
    }

    const { job_id } = await startResponse.json();
    console.log(`[API] Audit job started: ${job_id}`);

    // Step 2: Poll for job completion
    let attempts = 0;
    let jobResult = null;

    while (attempts < MAX_POLL_ATTEMPTS) {
      attempts++;

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

      // Check job status
      const statusResponse = await fetch(`${API_BASE_URL}/api/v2/audit/status/${job_id}`);

      if (!statusResponse.ok) {
        console.error('[API] Failed to check audit status');
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[API] Audit status (attempt ${attempts}): ${statusData.status}`);

      if (statusData.status === 'SUCCESS') {
        jobResult = statusData.result;
        break;
      } else if (statusData.status === 'FAILURE') {
        throw new Error(statusData.error || 'Audit execution failed');
      }

      // Continue polling if PENDING or STARTED
    }

    if (!jobResult) {
      throw new Error('Audit execution timed out. Please try again.');
    }

    console.log(`[API] Audit complete: ${jobResult.passed_traces}/${jobResult.total_traces} passed`);

    return NextResponse.json(jobResult);

  } catch (error) {
    console.error('[API] Error:', error);

    return NextResponse.json(
      {
        error: 'Audit execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
