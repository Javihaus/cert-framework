import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

/**
 * API endpoint to run compliance audit on traces.
 *
 * Receives traces data and runs accuracy evaluation using Python backend.
 */
export async function POST(request: NextRequest) {
  console.log('[API] Audit requested');

  try {
    const body = await request.json();
    const { traces, threshold = 0.7, evaluator = 'semantic' } = body;

    if (!traces) {
      return NextResponse.json(
        { error: 'Missing traces data' },
        { status: 400 }
      );
    }

    // Create unique temp directory
    const tempDir = path.join('/tmp', `cert-audit-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    console.log(`[API] Created temp directory: ${tempDir}`);

    // Write traces to temp file
    const tracesPath = path.join(tempDir, 'traces.jsonl');
    await writeFile(tracesPath, traces);
    console.log('[API] Wrote traces file');

    // Output path for results
    const resultsPath = path.join(tempDir, 'audit_results.json');

    // Path to Python script (use the cert CLI)
    const certPath = 'cert';  // Assumes cert is installed in environment

    console.log(`[API] Running audit with ${evaluator} evaluator, threshold ${threshold}`);

    // Run cert audit command
    const auditProcess = spawn('python3', [
      '-m', 'cert.cli.main',
      'audit',
      tracesPath,
      '--format', 'json',
      '--output', resultsPath,
      '--threshold', threshold.toString(),
      '--evaluator', evaluator
    ]);

    let stdout = '';
    let stderr = '';

    auditProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    auditProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for audit to complete
    await new Promise<void>((resolve, reject) => {
      auditProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[API] Audit completed successfully');
          console.log('[API] Output:', stdout);
          resolve();
        } else {
          console.error('[API] Audit failed with code:', code);
          console.error('[API] Error output:', stderr);
          reject(new Error(`Audit failed: ${stderr}`));
        }
      });

      auditProcess.on('error', (error) => {
        console.error('[API] Failed to spawn audit process:', error);
        reject(error);
      });
    });

    // Read results
    const resultsData = await readFile(resultsPath, 'utf-8');
    const auditResults = JSON.parse(resultsData);

    console.log(`[API] Audit complete: ${auditResults.article_15.passed_traces}/${auditResults.article_15.total_traces} passed`);

    // Format response
    const response = {
      total_traces: auditResults.article_15.total_traces,
      passed_traces: auditResults.article_15.passed_traces,
      failed_traces: auditResults.article_15.failed_traces,
      pass_rate: auditResults.article_15.accuracy,
      threshold: threshold,
      evaluator_type: auditResults.article_15.evaluator_type,
      compliant: auditResults.article_15.compliant,
      results: auditResults.traces || []
    };

    return NextResponse.json(response);

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
