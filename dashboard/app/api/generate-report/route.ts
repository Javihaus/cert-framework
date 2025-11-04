import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { CERTReportPDF } from '@/components/CERTReportPDF';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';

interface ReportMetadata {
  title: string;
  organization?: string;
  evaluator?: string;
  notes?: string;
  generated_date: string;
}

interface GenerateReportRequest {
  summary: EvaluationSummary;
  results: EvaluationResult[];
  metadata: ReportMetadata;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateReportRequest = await request.json();
    const { summary, results, metadata } = body;

    // Validate required fields
    if (!summary || !results || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, results, or metadata' },
        { status: 400 }
      );
    }

    // Generate PDF using @react-pdf/renderer
    // Use React.createElement instead of JSX for TypeScript compatibility
    const pdfBuffer = await renderToBuffer(
      React.createElement(CERTReportPDF, { summary, results, metadata })
    );

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
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
