import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { CERTReportPDF } from '@/components/CERTReportPDF';
import { Article15Report } from '@/types/report-schema';

interface GenerateReportRequest {
  report: Article15Report;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateReportRequest = await request.json();
    const { report } = body;

    // Validate required fields
    if (!report || !report.metadata || !report.performance || !report.temporal) {
      return NextResponse.json(
        { error: 'Missing required fields in Article15Report' },
        { status: 400 }
      );
    }

    // Generate PDF using @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <CERTReportPDF report={report} />
    );

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF with proper headers
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cert_report_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
