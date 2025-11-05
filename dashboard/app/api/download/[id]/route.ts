import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to download generated ZIP file.
 *
 * Security considerations:
 * - Validate ID format (no directory traversal)
 * - Only serve files from /tmp/cert-* directories
 * - Set appropriate headers for download
 *
 * Production TODO:
 * - Use signed URLs from cloud storage
 * - Implement expiration (delete files after 24 hours)
 * - Add authentication (verify user owns this file)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID format - must start with 'cert-' and contain only numbers
    if (!/^cert-\d+$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid download ID' },
        { status: 400 }
      );
    }

    // Construct file path
    const tempDir = path.join('/tmp', id);
    const zipPath = path.join(tempDir, 'compliance_package.zip');

    // Verify file exists
    if (!fs.existsSync(zipPath)) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(zipPath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="compliance_package.zip"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('[Download] Error:', error);

    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
