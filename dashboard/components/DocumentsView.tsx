'use client';

import { useState } from 'react';
import { Box, Button, Flex, Text, Grid, Input, Textarea } from '@chakra-ui/react';
import { MdFileDownload, MdFolderZip, MdDescription, MdFolder } from 'react-icons/md';
import { pdf } from '@react-pdf/renderer';
import { colors } from '@/theme/colors';
import Card from '@/components/Card';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';
import { Article15Report } from '@/types/report-schema';
import { CERTReportPDF } from './CERTReportPDF';

interface FormData {
  // System Metadata
  systemName: string;
  systemVersion: string;
  providerName: string;
  intendedPurpose: string;
  deploymentDate: string;

  // Risk Classification
  riskLevel: 'high' | 'limited' | 'minimal' | '';
  riskJustification: string;

  // Architecture
  modelType: string;
  modelVersion: string;
  infrastructure: string;

  // Data Governance
  trainingData: string;
  dataQuality: string;
}

interface DocumentsViewProps {
  summary: EvaluationSummary;
  results: EvaluationResult[];
}

export default function DocumentsView({ summary, results }: DocumentsViewProps) {
  const [activeSection, setActiveSection] = useState<'pdf' | 'compliance'>('pdf');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfReportTitle, setPdfReportTitle] = useState('CERT Compliance Evaluation Report');
  const [pdfOrganization, setPdfOrganization] = useState('');
  const [pdfEvaluator, setPdfEvaluator] = useState('');
  const [pdfNotes, setPdfNotes] = useState('');

  const [complianceGenerating, setComplianceGenerating] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [complianceDownloadUrl, setComplianceDownloadUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    systemName: '',
    systemVersion: 'v1.0',
    providerName: '',
    intendedPurpose: '',
    deploymentDate: new Date().toISOString().split('T')[0],
    riskLevel: '',
    riskJustification: '',
    modelType: '',
    modelVersion: '',
    infrastructure: '',
    trainingData: '',
    dataQuality: '',
  });

  // Load data from sessionStorage on mount
  useState(() => {
    const complianceDataStr = sessionStorage.getItem('compliance_data');
    const riskDataStr = sessionStorage.getItem('risk_classification');

    if (complianceDataStr && riskDataStr) {
      try {
        const complianceData = JSON.parse(complianceDataStr);
        const riskData = JSON.parse(riskDataStr);

        setFormData(prev => ({
          ...prev,
          systemName: complianceData.metadata?.system_name || prev.systemName,
          systemVersion: complianceData.metadata?.system_version || prev.systemVersion,
          providerName: complianceData.metadata?.provider_name || prev.providerName,
          riskLevel: riskData.classification?.risk_level || prev.riskLevel,
        }));

        setPdfOrganization(complianceData.metadata?.provider_name || '');
      } catch (err) {
        // Ignore errors
      }
    }
  });

  const handleDownloadPDFReport = async () => {
    setPdfLoading(true);

    try {
      const failedTraces = results
        .filter((r) => !r.passed)
        .map((r) => ({
          timestamp: r.timestamp,
          input_query: r.query,
          context: '',
          answer: r.response || '',
          confidence: r.measurement.confidence,
          reason: `Low confidence (${r.measurement.confidence.toFixed(3)})`,
        }));

      const report: Article15Report = {
        metadata: {
          system_name: pdfReportTitle,
          system_version: 'v1.0',
          provider_name: pdfOrganization || 'Not specified',
          intended_purpose: pdfNotes || 'AI system evaluation',
          report_date: new Date().toISOString(),
          evaluator_name: pdfEvaluator || undefined,
        },
        performance: {
          total_traces: summary.total_traces,
          evaluated_traces: summary.evaluated_traces,
          passed_traces: summary.passed_traces,
          failed_traces: summary.failed_traces,
          accuracy_percentage: summary.accuracy * 100,
          mean_confidence: summary.mean_confidence,
          median_confidence: summary.mean_confidence,
          threshold_used: summary.threshold_used,
        },
        temporal: {
          period_start: summary.date_range.start,
          period_end: summary.date_range.end,
          daily_accuracy: [
            {
              date: new Date(summary.date_range.start).toISOString().split('T')[0],
              accuracy: summary.accuracy,
            },
          ],
        },
        failed_traces: failedTraces,
        evaluation_methodology: `CERT Framework dual-component measurement approach. Threshold: ${summary.threshold_used}`,
        compliance_statement: `This system ${summary.accuracy >= 0.9 ? 'meets' : 'does not meet'} EU AI Act Article 15 requirements for accuracy monitoring. Evaluation conducted with ${summary.total_traces} traces. Pass rate of ${(summary.accuracy * 100).toFixed(1)}% ${summary.accuracy >= 0.9 ? 'exceeds' : 'is below'} the 90% compliance threshold.`,
      };

      const blob = await pdf(<CERTReportPDF report={report} />).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cert_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateCompliance = async () => {
    if (!formData.systemName || !formData.providerName) {
      setComplianceError('Please fill in System Name and Provider Name');
      return;
    }

    if (!formData.riskLevel) {
      setComplianceError('Please select a Risk Level');
      return;
    }

    setComplianceGenerating(true);
    setComplianceError(null);
    setComplianceDownloadUrl(null);

    try {
      const response = await fetch('/api/generate-compliance-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setComplianceDownloadUrl(url);

    } catch (err) {
      setComplianceError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setComplianceGenerating(false);
    }
  };

  const handleDownloadCompliance = () => {
    if (complianceDownloadUrl) {
      const a = document.createElement('a');
      a.href = complianceDownloadUrl;
      a.download = `${formData.systemName.replace(/\s+/g, '_')}_Compliance_Package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isCompliant = summary.accuracy >= 0.9;

  return (
    <Box maxW="1000px" mx="auto">
      {/* Document Type Selector */}
      <Flex gap="16px" mb="32px">
        <Button
          flex="1"
          h="auto"
          py="20px"
          bg={activeSection === 'pdf' ? colors.cobalt : 'white'}
          color={activeSection === 'pdf' ? 'white' : colors.text.primary}
          border="2px solid"
          borderColor={activeSection === 'pdf' ? colors.cobalt : colors.patience}
          borderRadius="12px"
          onClick={() => setActiveSection('pdf')}
          _hover={{ borderColor: colors.cobalt }}
        >
          <Flex direction="column" align="center" gap="8px">
            <MdDescription size={32} />
            <Text fontSize="18px" fontWeight="700">PDF Report</Text>
            <Text fontSize="14px" opacity={0.8}>Article 15 Compliance Report</Text>
          </Flex>
        </Button>

        <Button
          flex="1"
          h="auto"
          py="20px"
          bg={activeSection === 'compliance' ? colors.cobalt : 'white'}
          color={activeSection === 'compliance' ? 'white' : colors.text.primary}
          border="2px solid"
          borderColor={activeSection === 'compliance' ? colors.cobalt : colors.patience}
          borderRadius="12px"
          onClick={() => setActiveSection('compliance')}
          _hover={{ borderColor: colors.cobalt }}
        >
          <Flex direction="column" align="center" gap="8px">
            <MdFolder size={32} />
            <Text fontSize="18px" fontWeight="700">Compliance Package</Text>
            <Text fontSize="14px" opacity={0.8}>5 Word Documents (32 pages)</Text>
          </Flex>
        </Button>
      </Flex>

      {/* PDF Report Section */}
      {activeSection === 'pdf' && (
        <Card style={{ borderColor: colors.patience, padding: '32px' }}>
          <Text fontSize="24px" fontWeight="700" color={colors.navy} mb="16px">
            Generate PDF Compliance Report
          </Text>
          <Text fontSize="16px" color={colors.text.secondary} mb="24px" lineHeight="1.7">
            Generate a professional PDF report with comprehensive evaluation metrics, failure analysis, and compliance recommendations.
          </Text>

          <Grid templateColumns="1fr" gap="20px" mb="24px">
            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
                Report Title
              </Text>
              <Input
                value={pdfReportTitle}
                onChange={(e) => setPdfReportTitle(e.target.value)}
                placeholder="Enter report title"
                bg={colors.background}
                fontSize="15px"
                height="44px"
              />
            </Box>

            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
                Organization
              </Text>
              <Input
                value={pdfOrganization}
                onChange={(e) => setPdfOrganization(e.target.value)}
                placeholder="Your organization name"
                bg={colors.background}
                fontSize="15px"
                height="44px"
              />
            </Box>

            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
                Evaluator
              </Text>
              <Input
                value={pdfEvaluator}
                onChange={(e) => setPdfEvaluator(e.target.value)}
                placeholder="Name of person conducting evaluation"
                bg={colors.background}
                fontSize="15px"
                height="44px"
              />
            </Box>

            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
                Additional Notes
              </Text>
              <Textarea
                value={pdfNotes}
                onChange={(e) => setPdfNotes(e.target.value)}
                placeholder="Add any additional context or notes for this report"
                bg={colors.background}
                fontSize="15px"
                rows={4}
              />
            </Box>
          </Grid>

          {/* PDF Preview */}
          <Box bg={colors.background} p="20px" borderRadius="8px" border="1px solid" borderColor={colors.patience} mb="24px">
            <Text fontSize="16px" fontWeight="700" color={colors.navy} mb="12px">
              Report Preview
            </Text>
            <Grid templateColumns="1fr 1fr" gap="12px">
              <Box>
                <Text fontSize="14px" color={colors.text.muted}>Total Traces:</Text>
                <Text fontSize="14px" fontWeight="600" color={colors.navy}>{summary.total_traces.toLocaleString()}</Text>
              </Box>
              <Box>
                <Text fontSize="14px" color={colors.text.muted}>Accuracy:</Text>
                <Text fontSize="14px" fontWeight="600" color={isCompliant ? colors.success : colors.warning}>
                  {(summary.accuracy * 100).toFixed(1)}%
                </Text>
              </Box>
              <Box>
                <Text fontSize="14px" color={colors.text.muted}>Passed:</Text>
                <Text fontSize="14px" fontWeight="600" color={colors.success}>{summary.passed_traces.toLocaleString()}</Text>
              </Box>
              <Box>
                <Text fontSize="14px" color={colors.text.muted}>Failed:</Text>
                <Text fontSize="14px" fontWeight="600" color={colors.error}>{summary.failed_traces.toLocaleString()}</Text>
              </Box>
            </Grid>
          </Box>

          <Button
            w="100%"
            h="56px"
            bg={colors.cobalt}
            color="white"
            fontSize="17px"
            fontWeight="600"
            borderRadius="8px"
            _hover={{ bg: colors.navy }}
            onClick={handleDownloadPDFReport}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating Report...' : (
              <Flex align="center" gap="12px">
                <MdFileDownload size={22} />
                <Text>Download PDF Report</Text>
              </Flex>
            )}
          </Button>
        </Card>
      )}

      {/* Compliance Package Section */}
      {activeSection === 'compliance' && (
        <Box>
          <Card style={{ borderColor: colors.patience, padding: '32px', marginBottom: '24px' }}>
            <Text fontSize="24px" fontWeight="700" color={colors.navy} mb="16px">
              Generate Compliance Package
            </Text>
            <Text fontSize="16px" color={colors.text.secondary} mb="24px" lineHeight="1.7">
              Generate 5 professional Word documents (32 pages total) for EU AI Act compliance. Fill in the fields below.
            </Text>

            {/* System Identification */}
            <Text fontSize="20px" fontWeight="700" color={colors.navy} mb="16px">
              1. System Identification
            </Text>
            <Grid templateColumns="1fr 1fr" gap="20px" mb="24px">
              <Box>
                <Text fontSize="15px" fontWeight="600" color={colors.text.primary} mb="8px">
                  System Name *
                </Text>
                <Input
                  value={formData.systemName}
                  onChange={(e) => updateField('systemName', e.target.value)}
                  placeholder="e.g., Customer Support AI Assistant"
                  bg="white"
                  fontSize="15px"
                  height="44px"
                />
              </Box>

              <Box>
                <Text fontSize="15px" fontWeight="600" color={colors.text.primary} mb="8px">
                  Provider Name *
                </Text>
                <Input
                  value={formData.providerName}
                  onChange={(e) => updateField('providerName', e.target.value)}
                  placeholder="e.g., Acme Corp"
                  bg="white"
                  fontSize="15px"
                  height="44px"
                />
              </Box>
            </Grid>

            {/* Risk Classification */}
            <Text fontSize="20px" fontWeight="700" color={colors.navy} mb="16px">
              2. Risk Classification *
            </Text>
            <Box mb="24px">
              <select
                value={formData.riskLevel}
                onChange={(e) => updateField('riskLevel', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  height: '44px',
                }}
              >
                <option value="">Select risk level...</option>
                <option value="high">HIGH RISK - Annex III categories matched</option>
                <option value="limited">LIMITED RISK - Transparency obligations</option>
                <option value="minimal">MINIMAL RISK - Basic compliance</option>
              </select>
            </Box>

            {complianceError && (
              <Box bg="#fee" p="16px" borderRadius="8px" mb="20px">
                <Text fontSize="15px" color={colors.error}>{complianceError}</Text>
              </Box>
            )}

            {complianceDownloadUrl && (
              <Box bg="#e8f5e9" p="20px" borderRadius="8px" mb="20px">
                <Text fontSize="16px" fontWeight="600" color={colors.success} mb="12px">
                  Package Generated Successfully!
                </Text>
                <Button
                  onClick={handleDownloadCompliance}
                  bg={colors.success}
                  color="white"
                  size="lg"
                  width="full"
                  _hover={{ opacity: 0.9 }}
                >
                  <Flex align="center" gap="10px">
                    <MdFileDownload size={24} />
                    <span>Download Compliance Package (.zip)</span>
                  </Flex>
                </Button>
              </Box>
            )}

            <Button
              onClick={handleGenerateCompliance}
              disabled={complianceGenerating || !formData.systemName || !formData.providerName || !formData.riskLevel}
              bg={colors.cobalt}
              color="white"
              size="lg"
              width="full"
              fontSize="16px"
              _hover={{ opacity: 0.9 }}
            >
              {complianceGenerating ? 'Generating...' : (
                <Flex align="center" gap="10px">
                  <MdFolderZip size={20} />
                  <span>Generate Compliance Package</span>
                </Flex>
              )}
            </Button>
          </Card>

          <Box bg={colors.background} p="20px" borderRadius="8px" border="1px solid" borderColor={colors.patience}>
            <Text fontSize="15px" color={colors.text.muted} lineHeight="1.6">
              This will generate 5 Word documents: Risk Classification Report (2p), Annex IV Technical Documentation (20-25p), Audit Trail Guide (3p), Monitoring Framework (5p), and Conformity Checklist (2p).
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
