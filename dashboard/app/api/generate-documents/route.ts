import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to generate compliance documents using async FastAPI backend.
 *
 * New Flow (Production):
 * 1. Receive JSON data from frontend
 * 2. Send to FastAPI backend (/api/v2/documents/generate)
 * 3. Receive job_id from backend
 * 4. Poll job status until complete
 * 5. Return download URL from MinIO
 *
 * Benefits:
 * - Non-blocking: Can handle multiple concurrent requests
 * - Scalable: Celery workers can be scaled independently
 * - Reliable: Failed jobs auto-retry
 * - Production-ready: Files stored in MinIO, not /tmp
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const POLL_INTERVAL_MS = 2000;  // Poll every 2 seconds
const MAX_POLL_ATTEMPTS = 150;  // 5 minutes max (150 * 2s)

export async function POST(request: NextRequest) {
  console.log('[API] Document generation requested (v2 async)');

  try {
    // Parse request body
    const body = await request.json();
    const { riskData, complianceData } = body;

    if (!riskData || !complianceData) {
      return NextResponse.json(
        { error: 'Missing riskData or complianceData' },
        { status: 400 }
      );
    }

    // Step 1: Start document generation job
    console.log('[API] Starting document generation job...');

    const startResponse = await fetch(`${API_BASE_URL}/api/v2/documents/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riskData, complianceData }),
    });

    if (!startResponse.ok) {
      const errorData = await startResponse.json();
      throw new Error(errorData.detail || 'Failed to start document generation');
    }

    const { job_id } = await startResponse.json();
    console.log(`[API] Job started: ${job_id}`);

    // Step 2: Poll for job completion
    let attempts = 0;
    let jobResult = null;

    while (attempts < MAX_POLL_ATTEMPTS) {
      attempts++;

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

      // Check job status
      const statusResponse = await fetch(`${API_BASE_URL}/api/v2/documents/status/${job_id}`);

      if (!statusResponse.ok) {
        console.error('[API] Failed to check job status');
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[API] Job status (attempt ${attempts}): ${statusData.status}`);

      if (statusData.status === 'SUCCESS') {
        jobResult = statusData.result;
        break;
      } else if (statusData.status === 'FAILURE') {
        throw new Error(statusData.error || 'Document generation failed');
      }

      // Continue polling if PENDING or STARTED
    }

    if (!jobResult) {
      throw new Error('Document generation timed out. Please try again.');
    }

    console.log(`[API] Success! Download URL: ${jobResult.file_url}`);

    return NextResponse.json({
      success: true,
      downloadUrl: jobResult.file_url,
      fileName: jobResult.file_name,
      jobId: job_id,
    });

  } catch (error) {
    console.error('[API] Error:', error);

    return NextResponse.json(
      {
        error: 'Document generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
