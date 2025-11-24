import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * API endpoint to generate assessment report PDF.
 *
 * Receives assessment data from the frontend and generates
 * a professional PDF report using Python backend.
 */
export async function POST(request: NextRequest) {
  console.log('[API] Assessment PDF generation requested');

  try {
    const body = await request.json();
    const { assessmentData, email } = body;

    if (!assessmentData) {
      return NextResponse.json(
        { error: 'Missing assessment data' },
        { status: 400 }
      );
    }

    // Create unique temp directory
    const tempDir = path.join('/tmp', `cert-assessment-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    console.log(`[API] Created temp directory: ${tempDir}`);

    // Write assessment data to temp file
    const assessmentPath = path.join(tempDir, 'assessment.json');
    await writeFile(assessmentPath, JSON.stringify(assessmentData, null, 2));
    console.log('[API] Wrote assessment data');

    // Output path for PDF
    const pdfPath = path.join(tempDir, 'assessment_report.pdf');

    // Path to Python script
    const scriptPath = path.join(process.cwd(), '..', 'scripts', 'generate_assessment_pdf.py');

    console.log(`[API] Running Python script: ${scriptPath}`);

    // Run Python script to generate PDF
    const pythonProcess = spawn('python3', [
      scriptPath,
      assessmentPath,
      '--output',
      pdfPath,
      ...(email ? ['--email', email] : [])
    ]);

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
          console.log('[API] PDF generation completed successfully');
          console.log('[API] Output:', stdout);
          resolve();
        } else {
          console.error('[API] PDF generation failed with code:', code);
          console.error('[API] Error output:', stderr);
          reject(new Error(`PDF generation failed: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[API] Failed to spawn Python process:', error);
        reject(error);
      });
    });

    // Verify PDF file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error('PDF file was not generated');
    }

    const stats = fs.statSync(pdfPath);
    console.log(`[API] PDF file size: ${stats.size} bytes`);

    // Return download URL
    const downloadUrl = `/api/download/${path.basename(tempDir)}/assessment_report.pdf`;

    console.log(`[API] Success! Download URL: ${downloadUrl}`);

    return NextResponse.json({
      success: true,
      downloadUrl: downloadUrl
    });

  } catch (error) {
    console.error('[API] Error:', error);

    return NextResponse.json(
      {
        error: 'Assessment PDF generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
