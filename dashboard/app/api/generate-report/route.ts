import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    const response = await fetch(`${pythonBackendUrl}/api/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate report from Python backend' },
        { status: response.status }
      );
    }

    // Get the PDF blob from Python backend
    const pdfBuffer = await response.arrayBuffer();

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cert_report_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error in generate-report API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
