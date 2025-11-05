import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify fs functions for async/await
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * API endpoint to generate compliance documents.
 *
 * Flow:
 * 1. Receive JSON data from frontend
 * 2. Write JSON to temporary files
 * 3. Spawn Python script to populate templates
 * 4. Create ZIP file of generated documents
 * 5. Return download URL
 *
 * Critical details:
 * - Use unique temp directory (multiple simultaneous requests)
 * - Clean up temp files after 1 hour
 * - Capture Python stderr for debugging
 * - Validate files exist before returning URLs
 */

export async function POST(request: NextRequest) {
  console.log('[API] Document generation requested');

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

    // Create unique temp directory
    // Use timestamp to avoid collisions
    const tempDir = path.join('/tmp', `cert-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    console.log(`[API] Created temp directory: ${tempDir}`);

    // Write JSON data to temp files
    const riskPath = path.join(tempDir, 'risk.json');
    const compliancePath = path.join(tempDir, 'compliance.json');

    await writeFile(riskPath, JSON.stringify(riskData, null, 2));
    await writeFile(compliancePath, JSON.stringify(complianceData, null, 2));
    console.log('[API] Wrote JSON files');

    // Output directory for generated documents
    const outputDir = path.join(tempDir, 'documents');
    await mkdir(outputDir, { recursive: true });

    // Path to Python script
    // Assumes dashboard is in cert-framework/dashboard/
    // Script is in cert-framework/scripts/
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'populate_templates.py');

    console.log(`[API] Running Python script: ${scriptPath}`);

    // Run Python script
    // This spawns a subprocess that runs the populate_templates.py script
    const pythonProcess = spawn('python3', [
      scriptPath,
      riskPath,
      compliancePath,
      '--output',
      outputDir
    ]);

    // Capture stdout and stderr
    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for Python script to complete
    await new Promise<void>((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[API] Python script completed successfully');
          console.log('[API] Output:', stdout);
          resolve();
        } else {
          console.error('[API] Python script failed with code:', code);
          console.error('[API] Error output:', stderr);
          reject(new Error(`Python script failed: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[API] Failed to spawn Python process:', error);
        reject(error);
      });
    });

    // Create ZIP file of generated documents
    const zipPath = path.join(tempDir, 'compliance_package.zip');

    console.log('[API] Creating ZIP file');

    const zipProcess = spawn('zip', [
      '-r',
      '-j',  // Junk directory names (flat structure in ZIP)
      zipPath,
      outputDir
    ]);

    await new Promise<void>((resolve, reject) => {
      zipProcess.on('close', (code) => {
        if (code === 0) {
          console.log('[API] ZIP file created');
          resolve();
        } else {
          reject(new Error('ZIP creation failed'));
        }
      });
    });

    // Verify ZIP file exists and has content
    const stats = fs.statSync(zipPath);
    if (stats.size === 0) {
      throw new Error('Generated ZIP file is empty');
    }

    console.log(`[API] ZIP file size: ${stats.size} bytes`);

    // In production, upload to S3/cloud storage and return that URL
    // For MVP, we'll serve it directly from /tmp
    // This is NOT production-ready (temp files should be cleaned up)

    // Return download URL
    // The URL will be handled by another API endpoint
    const downloadUrl = `/api/download/${path.basename(tempDir)}`;

    console.log(`[API] Success! Download URL: ${downloadUrl}`);

    return NextResponse.json({
      success: true,
      downloadUrl: downloadUrl
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
