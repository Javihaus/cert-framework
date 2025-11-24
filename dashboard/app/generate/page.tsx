'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import FileUpload from '@/components/FileUpload';
import { Upload, Download, CheckCircle2, FileText, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { typographyClasses } from '@/theme/typography';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  pages: string;
  required: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'risk_classification',
    name: 'Risk Classification Report',
    description: 'EU AI Act Annex III risk assessment',
    pages: '2-3 pages',
    required: true
  },
  {
    id: 'annex_iv',
    name: 'Annex IV Technical Documentation',
    description: 'Complete technical documentation package',
    pages: '20-25 pages',
    required: true
  },
  {
    id: 'article_15',
    name: 'Article 15 Compliance Report',
    description: 'Accuracy, robustness, and cybersecurity report',
    pages: '5-8 pages',
    required: false
  },
  {
    id: 'audit_trail',
    name: 'Audit Trail Setup Guide',
    description: 'Logging and record-keeping procedures',
    pages: '3-4 pages',
    required: false
  },
  {
    id: 'monitoring',
    name: 'Monitoring Framework',
    description: 'Continuous monitoring procedures',
    pages: '4-6 pages',
    required: false
  }
];

export default function GenerateDocumentsPage() {
  const [tracesData, setTracesData] = useState<any[] | null>(null);
  const [systemName, setSystemName] = useState('');
  const [systemVersion, setSystemVersion] = useState('v1.0');
  const [providerName, setProviderName] = useState('');
  const [intendedPurpose, setIntendedPurpose] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>(
    DOCUMENT_TYPES.filter(d => d.required).map(d => d.id)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoad = (data: any) => {
    setTracesData(Array.isArray(data) ? data : [data]);
    setError(null);
  };

  const toggleDocument = (docId: string) => {
    const doc = DOCUMENT_TYPES.find(d => d.id === docId);
    if (doc?.required) return; // Can't unselect required docs

    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!tracesData) {
      setError('Please upload a traces file');
      return;
    }
    if (!systemName) {
      setError('Please enter system name');
      return;
    }
    if (!providerName) {
      setError('Please enter provider name');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDownloadUrl(null);

    try {
      // Prepare risk data
      const riskData = {
        metadata: {
          system_name: systemName,
          system_version: systemVersion,
          provider_name: providerName
        },
        classification: {
          risk_level: 'high', // Would normally come from assessment
          title: 'High-Risk AI System',
          description: 'System classified as high-risk under EU AI Act',
          high_risk_indicators: 2
        },
        matched_categories: [],
        requirements: []
      };

      // Prepare compliance data by analyzing traces
      const traces = tracesData;

      const complianceData = {
        metadata: {
          system_name: systemName,
          system_version: systemVersion,
          provider_name: providerName,
          generated_at: new Date().toISOString()
        },
        article_15_compliance: {
          metrics: {
            total_requests: traces.length,
            successful_requests: traces.filter(t => t.status === 'success').length,
            failed_requests: traces.filter(t => t.status !== 'success').length,
            error_rate: traces.filter(t => t.status !== 'success').length / traces.length,
            avg_response_time_ms: traces.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / traces.length
          }
        },
        annex_iv_documentation: {
          sections: {
            section_1_general: {
              data: {
                system_name: systemName,
                system_version: systemVersion,
                provider_name: providerName,
                intended_purpose: intendedPurpose
              }
            }
          }
        },
        trace_summary: {
          total_traces: traces.length,
          date_range: {
            start: traces[0]?.timestamp || new Date().toISOString(),
            end: traces[traces.length - 1]?.timestamp || new Date().toISOString()
          }
        }
      };

      // Call generation API
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskData, complianceData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Document generation failed');
      }

      const result = await response.json();
      setDownloadUrl(result.downloadUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={cn(typographyClasses.pageTitle, "mb-2")}>
            Generate Compliance Documents
          </h1>
          <p className={typographyClasses.body}>
            Auto-generate EU AI Act compliance documentation from your production traces
          </p>
        </div>

        {!downloadUrl ? (
          <>
            {/* Step 1: Upload Traces */}
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className={typographyClasses.sectionTitle}>
                  Upload Production Traces
                </h2>
              </div>
              <p className={cn(typographyClasses.body, "mb-4")}>
                Upload your JSONL file containing production traces (generated by CERT monitoring)
              </p>
              <FileUpload
                onFileLoad={handleFileLoad}
                accept=".jsonl,.json"
                label="Upload Traces File"
              />
            </Card>

            {/* Step 2: System Metadata */}
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className={typographyClasses.sectionTitle}>
                  System Information
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn(typographyClasses.label, "block mb-2")}>
                    System Name *
                  </label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    placeholder="e.g., Document Analysis AI"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className={cn(typographyClasses.label, "block mb-2")}>
                    Version
                  </label>
                  <input
                    type="text"
                    value={systemVersion}
                    onChange={(e) => setSystemVersion(e.target.value)}
                    placeholder="e.g., v1.0"
                    className="input w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className={cn(typographyClasses.label, "block mb-2")}>
                    Provider/Organization Name *
                  </label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className="input w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className={cn(typographyClasses.label, "block mb-2")}>
                    Intended Purpose
                  </label>
                  <textarea
                    value={intendedPurpose}
                    onChange={(e) => setIntendedPurpose(e.target.value)}
                    placeholder="Brief description of the system's intended use..."
                    rows={3}
                    className="input w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Step 3: Select Documents */}
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h2 className={typographyClasses.sectionTitle}>
                  Select Documents
                </h2>
              </div>
              <div className="space-y-3">
                {DOCUMENT_TYPES.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    className={cn(
                      'p-4 border-2 rounded-lg transition-all',
                      doc.required
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 cursor-not-allowed'
                        : selectedDocs.includes(doc.id)
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 cursor-pointer'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400 cursor-pointer'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                        selectedDocs.includes(doc.id)
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-zinc-300 dark:border-zinc-600'
                      )}>
                        {selectedDocs.includes(doc.id) && (
                          <CheckCircle2 size={14} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={typographyClasses.subsectionTitle}>{doc.name}</h3>
                          {doc.required && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className={cn(typographyClasses.body, "mt-1")}>{doc.description}</p>
                        <p className={cn(typographyClasses.caption, "mt-1")}>{doc.pages}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Info Box */}
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-6">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className={cn(typographyClasses.subsectionTitle, "text-amber-900 dark:text-amber-100 mb-1")}>
                    Expert Review Required
                  </h3>
                  <p className={cn(typographyClasses.body, "text-amber-800 dark:text-amber-200")}>
                    Generated documents will contain auto-populated data from your traces and
                    <strong> [EXPERT INPUT REQUIRED]</strong> sections that need manual completion
                    by domain experts (estimated 8-10 hours per system).
                  </p>
                </div>
              </div>
            </Card>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className={cn(typographyClasses.body, "text-red-800 dark:text-red-200")}>{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!tracesData || !systemName || !providerName || isGenerating}
              icon={isGenerating ? undefined : <FileText size={16} />}
              variant="primary"
              size="lg"
              fullWidth
            >
              {isGenerating ? 'Generating Documents...' : `Generate ${selectedDocs.length} Document${selectedDocs.length !== 1 ? 's' : ''}`}
            </Button>
          </>
        ) : (
          /* Success State */
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="text-center py-8">
              <CheckCircle2 size={64} className="text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h2 className={cn(typographyClasses.sectionTitle, "text-green-900 dark:text-green-100 mb-2")}>
                Documents Generated Successfully!
              </h2>
              <p className={cn(typographyClasses.body, "text-green-700 dark:text-green-300 mb-6")}>
                Your compliance documentation package is ready for download
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.location.href = downloadUrl}
                  icon={<Download size={16} />}
                  variant="primary"
                  size="lg"
                >
                  Download Package (.zip)
                </Button>
                <Button
                  onClick={() => {
                    setDownloadUrl(null);
                    setTracesData(null);
                    setSystemName('');
                    setProviderName('');
                    setIntendedPurpose('');
                  }}
                  variant="secondary"
                  size="lg"
                >
                  Generate New Package
                </Button>
              </div>

              <div className="mt-8 p-4 bg-white dark:bg-zinc-800 rounded-lg text-left">
                <h3 className={cn(typographyClasses.subsectionTitle, "mb-3")}>
                  Next Steps:
                </h3>
                <ol className={cn(typographyClasses.body, "space-y-2")}>
                  <li>1. Extract the ZIP file to access all Word documents</li>
                  <li>2. Open each document and search for <strong>[EXPERT INPUT REQUIRED]</strong></li>
                  <li>3. Fill in expert commentary and assessments (8-10 hours estimated)</li>
                  <li>4. Review all auto-populated metrics for accuracy</li>
                  <li>5. Save final versions and export to PDF for submission</li>
                </ol>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
