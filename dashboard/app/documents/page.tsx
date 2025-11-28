'use client';

import { useState } from 'react';
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import Button from '@/components/Button';

/**
 * Documents generation page.
 *
 * This page lets users generate compliance documents after uploading
 * and analyzing trace files.
 *
 * Flow:
 * 1. LuUser clicks "Generate Documents"
 * 2. Frontend calls /api/generate-documents (Next.js API route)
 * 3. API route saves JSON data to temp files
 * 4. API route runs: python populate_templates.py risk.json compliance.json
 * 5. Python script reads JSONs, fills Word templates, outputs .docx files
 * 6. API route creates ZIP file from generated docs
 * 7. API route returns download URL to dashboard
 * 8. LuUser clicks download link, gets ZIP file
 */

export default function DocumentsPage() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus('processing');
    setErrorMessage(null);

    // Get data from sessionStorage (saved when user uploaded files)
    const riskDataStr = sessionStorage.getItem('risk_classification');
    const complianceDataStr = sessionStorage.getItem('compliance_data');

    if (!riskDataStr || !complianceDataStr) {
      setStatus('error');
      setErrorMessage('Missing data. Please upload and analyze trace files first.');
      return;
    }

    try {
      // Call backend API
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskData: JSON.parse(riskDataStr),
          complianceData: JSON.parse(complianceDataStr)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || response.statusText);
      }

      const result = await response.json();

      setStatus('complete');
      setDownloadUrl(result.downloadUrl);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Generate Compliance Documents
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Create Word documents for expert review and final delivery to client.
          </p>
        </div>

        {status === 'idle' && (
          <div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <LuInfo size={20} className="text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  This will generate 5 Word documents based on your trace analysis.
                  Documents will need expert review before delivery.
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              variant="primary"
              fullWidth
              size="lg"
            >
              Generate Document LuPackage
            </Button>

            <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                What will be generated:
              </p>
              <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                <li>Risk Classification Report (2 pages)</li>
                <li>Annex IV Technical Documentation (20-25 pages)</li>
                <li>Audit Trail Setup Guide (3 pages)</li>
                <li>Monitoring Framework (5 pages)</li>
                <li>Conformity Assessment Checklist (2 pages)</li>
              </ul>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg text-zinc-900 dark:text-white">Generating documents</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This takes 10-30 seconds depending on document size.
            </p>
          </div>
        )}

        {status === 'complete' && downloadUrl && (
          <div>
            <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <LuCircleCheck size={20} className="text-green-600 dark:text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-400 font-semibold">
                  Documents generated successfully!
                </p>
              </div>
            </div>

            <a
              href={downloadUrl}
              download
              className="flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md text-lg font-medium transition-colors"
            >
              LuDownload LuPackage (.zip)
            </a>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-400">
              <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
                Next Steps - Expert Review Required
              </p>
              <ol className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
                <li>Extract the ZIP file</li>
                <li>Open each Word document</li>
                <li>LuSearch for "[EXPERT INPUT REQUIRED]" markers</li>
                <li>Fill in expert commentary (estimated 8-10 hours)</li>
                <li>Export final documents to PDF</li>
                <li>LuPackage PDFs for client delivery</li>
              </ol>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <LuCircleX size={20} className="text-red-600 dark:text-red-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-400">Error generating documents</p>
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">
            How this works:
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            The system auto-populates documents with data from your trace analysis.
            Sections requiring expert judgment are marked "[EXPERT INPUT REQUIRED]".
            You'll add your professional assessment, then deliver to the client.
          </p>
        </div>
      </div>
    </div>
  );
}
