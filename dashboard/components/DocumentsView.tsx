'use client';

import { useState } from 'react';
import { Box, Button, Flex, Text, Grid, Input, Textarea, Code } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { InfoBox } from '@/components/ui';
import Card from '@/components/Card';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';
import { Article15Report } from '@/types/report-schema';
import { CERTReportPDF } from './CERTReportPDF';

interface DocumentsViewProps {
  summary: EvaluationSummary;
  results: EvaluationResult[];
}

export default function DocumentsView({ summary, results }: DocumentsViewProps) {
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('CERT Compliance Evaluation Report');
  const [organization, setOrganization] = useState('');
  const [evaluator, setEvaluator] = useState('');
  const [notes, setNotes] = useState('');

  // Load organization from sessionStorage if available
  useState(() => {
    const complianceDataStr = sessionStorage.getItem('compliance_data');
    if (complianceDataStr) {
      try {
        const complianceData = JSON.parse(complianceDataStr);
        setOrganization(complianceData.metadata?.provider_name || '');
      } catch (err) {
        // Ignore errors
      }
    }
  });

  const handleDownloadReport = async () => {
    setLoading(true);

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
          system_name: reportTitle,
          system_version: 'v1.0',
          provider_name: organization || 'Not specified',
          intended_purpose: notes || 'AI system evaluation',
          report_date: new Date().toISOString(),
          evaluator_name: evaluator || undefined,
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

      // Generate PDF entirely in the browser - NO SERVER CALL
      const blob = await pdf(<CERTReportPDF report={report} />).toBlob();

      // Download directly
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
      setLoading(false);
    }
  };

  const isCompliant = summary.accuracy >= 0.9;

  return (
    <Box maxW="900px" mx="auto">
      {/* PDF Report Section */}
      <Card style={{ borderColor: colors.patience, padding: spacing.xl, marginBottom: spacing.lg }}>
        <Text
          fontSize={typography.fontSize['2xl']}
          fontWeight={typography.fontWeight.bold}
          color={colors.navy}
          mb={spacing.md}
        >
          Download PDF Compliance Report
        </Text>
        <Text
          fontSize={typography.fontSize.base}
          color={colors.text.secondary}
          mb={spacing.lg}
          lineHeight={typography.lineHeight.loose}
        >
          Generate a professional PDF report with comprehensive evaluation metrics, failure analysis, and compliance recommendations. Generated entirely in your browser - no data sent to servers.
        </Text>

        <Grid templateColumns="1fr" gap={spacing.lg} mb={spacing.lg}>
          <Box>
            <Text
              fontSize={typography.fontSize.sm}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
              mb={spacing.xs}
            >
              Report Title
            </Text>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
              bg={colors.background}
              fontSize={typography.fontSize.sm}
              height="44px"
            />
          </Box>

          <Box>
            <Text
              fontSize={typography.fontSize.sm}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
              mb={spacing.xs}
            >
              Organization
            </Text>
            <Input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your organization name"
              bg={colors.background}
              fontSize={typography.fontSize.sm}
              height="44px"
            />
          </Box>

          <Box>
            <Text
              fontSize={typography.fontSize.sm}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
              mb={spacing.xs}
            >
              Evaluator
            </Text>
            <Input
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
              placeholder="Name of person conducting evaluation"
              bg={colors.background}
              fontSize={typography.fontSize.sm}
              height="44px"
            />
          </Box>

          <Box>
            <Text
              fontSize={typography.fontSize.sm}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
              mb={spacing.xs}
            >
              Additional Notes
            </Text>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context or notes for this report"
              bg={colors.background}
              fontSize={typography.fontSize.sm}
              rows={4}
            />
          </Box>
        </Grid>

        {/* Report Preview */}
        <Box
          bg={colors.background}
          p={spacing.lg}
          borderRadius={borderRadius.md}
          border="1px solid"
          borderColor={colors.patience}
          mb={spacing.lg}
        >
          <Text
            fontSize={typography.fontSize.base}
            fontWeight={typography.fontWeight.bold}
            color={colors.navy}
            mb={spacing.sm}
          >
            Report Preview
          </Text>
          <Grid templateColumns="1fr 1fr" gap={spacing.sm}>
            <Box>
              <Text fontSize={typography.fontSize.sm} color={colors.text.muted}>Total Traces:</Text>
              <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                {summary.total_traces.toLocaleString()}
              </Text>
            </Box>
            <Box>
              <Text fontSize={typography.fontSize.sm} color={colors.text.muted}>Accuracy:</Text>
              <Text
                fontSize={typography.fontSize.sm}
                fontWeight={typography.fontWeight.semibold}
                color={isCompliant ? colors.success : colors.warning}
              >
                {(summary.accuracy * 100).toFixed(1)}%
              </Text>
            </Box>
            <Box>
              <Text fontSize={typography.fontSize.sm} color={colors.text.muted}>Passed:</Text>
              <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.success}>
                {summary.passed_traces.toLocaleString()}
              </Text>
            </Box>
            <Box>
              <Text fontSize={typography.fontSize.sm} color={colors.text.muted}>Failed:</Text>
              <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.error}>
                {summary.failed_traces.toLocaleString()}
              </Text>
            </Box>
          </Grid>
        </Box>

        <Button
          w="100%"
          h="48px"
          bg={colors.cobalt}
          color="white"
          fontSize={typography.fontSize.lg}
          fontWeight={typography.fontWeight.semibold}
          borderRadius={borderRadius.md}
          _hover={{ bg: colors.navy }}
          onClick={handleDownloadReport}
          disabled={loading}
        >
          {loading ? 'Generating Report...' : (
            <Flex align="center" gap={spacing.sm}>
              <Download size={20} strokeWidth={2} />
              <Text>Download PDF Report</Text>
            </Flex>
          )}
        </Button>
      </Card>

      {/* CLI Instructions for Word Documents */}
      <InfoBox type="info" title="Need Word Documents?">
        <Box>
          <Text mb={spacing.md}>
            For the full EU AI Act compliance package (5 Word documents, 32 pages), use the CERT CLI. All processing happens locally on your machine - your traces never leave your computer.
          </Text>
          <Code
            display="block"
            whiteSpace="pre"
            p={spacing.md}
            borderRadius={borderRadius.md}
            fontSize={typography.fontSize.sm}
            bg="white"
            color={colors.navy}
            lineHeight={typography.lineHeight.relaxed}
          >
{`# Install CERT CLI
pip install cert-framework

# Generate compliance package
cert audit traces.jsonl --format docx --output report.docx

# Or use the Python API
from cert.compliance import ComplianceReporter
reporter = ComplianceReporter(
    system_name="My AI System",
    provider_name="My Company"
)
reporter.save_report("traces.jsonl", "package.docx")`}
          </Code>
          <Text mt={spacing.sm} fontSize={typography.fontSize.xs} color={colors.text.muted}>
            The CLI generates: Risk Classification Report (2p), Annex IV Technical Documentation (20-25p), Audit Trail Guide (3p), Monitoring Framework (5p), and Conformity Checklist (2p).
          </Text>
        </Box>
      </InfoBox>
    </Box>
  );
}
