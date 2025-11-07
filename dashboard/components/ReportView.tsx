'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  Icon,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { MdFileDownload, MdDescription } from 'react-icons/md';
import { pdf } from '@react-pdf/renderer';
import { colors } from '@/theme/colors';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';
import { Article15Report } from '@/types/report-schema';
import { CERTReportPDF } from './CERTReportPDF';

interface ReportViewProps {
  summary: EvaluationSummary;
  results: EvaluationResult[];
}

export default function ReportView({ summary, results }: ReportViewProps) {
  const [loading, setLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('CERT Compliance Evaluation Report');
  const [organization, setOrganization] = useState('');
  const [evaluator, setEvaluator] = useState('');
  const [notes, setNotes] = useState('');

  const handleDownloadReport = async () => {
    setLoading(true);

    try {
      // Convert old format to Article15Report schema
      const failedTraces = results
        .filter((r) => !r.passed)
        .map((r) => ({
          timestamp: r.timestamp,
          input_query: r.query,
          context: '', // Not available in old format
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
          median_confidence: summary.mean_confidence, // Approximation
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
      <Box
        bg="white"
        p="32px"
        borderRadius="12px"
        border="1px solid"
        borderColor={colors.patience}
        mb="24px"
      >
        <Flex align="center" gap="16px" mb="24px">
          <Flex
            w="56px"
            h="56px"
            align="center"
            justify="center"
            bg={colors.patience}
            borderRadius="12px"
          >
            <Icon as={MdDescription} w="32px" h="32px" color={colors.cobalt} />
          </Flex>
          <Text fontSize="28px" fontWeight="700" color={colors.navy}>
            Generate Compliance Report
          </Text>
        </Flex>

        <Text fontSize="16px" color={colors.text.secondary} mb="28px" lineHeight="1.7">
          Generate a professional PDF report with comprehensive evaluation metrics,
          failure analysis, and compliance recommendations. This report is suitable
          for regulatory documentation and stakeholder review.
        </Text>

        {/* Report Metadata Form */}
        <VStack gap="20px" align="stretch" mb="32px">
          <Box>
            <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
              Report Title
            </Text>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
              bg={colors.background}
              border="1px solid"
              borderColor={colors.patience}
              _focus={{ borderColor: colors.cobalt }}
              fontSize="15px"
              height="44px"
            />
          </Box>

          <Box>
            <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
              Organization
            </Text>
            <Input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your organization name"
              bg={colors.background}
              border="1px solid"
              borderColor={colors.patience}
              _focus={{ borderColor: colors.cobalt }}
              fontSize="15px"
              height="44px"
            />
          </Box>

          <Box>
            <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
              Evaluator
            </Text>
            <Input
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
              placeholder="Name of person conducting evaluation"
              bg={colors.background}
              border="1px solid"
              borderColor={colors.patience}
              _focus={{ borderColor: colors.cobalt }}
              fontSize="15px"
              height="44px"
            />
          </Box>

          <Box>
            <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="8px">
              Additional Notes
            </Text>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context or notes for this report"
              bg={colors.background}
              border="1px solid"
              borderColor={colors.patience}
              _focus={{ borderColor: colors.cobalt }}
              fontSize="15px"
              rows={4}
            />
          </Box>
        </VStack>

        {/* Report Preview */}
        <Box
          bg={colors.background}
          p="24px"
          borderRadius="8px"
          border="1px solid"
          borderColor={colors.patience}
          mb="24px"
        >
          <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="16px">
            Report Preview
          </Text>

          <VStack gap="12px" align="stretch">
            <Flex justify="space-between">
              <Text fontSize="15px" color={colors.text.muted}>Total Traces:</Text>
              <Text fontSize="15px" fontWeight="600" color={colors.navy}>
                {summary.total_traces.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="15px" color={colors.text.muted}>Accuracy:</Text>
              <Text
                fontSize="15px"
                fontWeight="600"
                color={isCompliant ? colors.success : colors.warning}
              >
                {(summary.accuracy * 100).toFixed(1)}%
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="15px" color={colors.text.muted}>Passed Traces:</Text>
              <Text fontSize="15px" fontWeight="600" color={colors.success}>
                {summary.passed_traces.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="15px" color={colors.text.muted}>Failed Traces:</Text>
              <Text fontSize="15px" fontWeight="600" color={colors.error}>
                {summary.failed_traces.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="15px" color={colors.text.muted}>Mean Confidence:</Text>
              <Text fontSize="15px" fontWeight="600" color={colors.navy}>
                {summary.mean_confidence.toFixed(3)}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="15px" color={colors.text.muted}>Compliance Status:</Text>
              <Text
                fontSize="15px"
                fontWeight="600"
                color={isCompliant ? colors.success : colors.warning}
              >
                {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
              </Text>
            </Flex>
          </VStack>
        </Box>

        {/* Download Button */}
        <Button
          w="100%"
          h="56px"
          bg={colors.cobalt}
          color="white"
          fontSize="17px"
          fontWeight="600"
          borderRadius="8px"
          _hover={{ bg: colors.navy }}
          onClick={handleDownloadReport}
          disabled={loading}
        >
          {loading ? (
            'Generating Report...'
          ) : (
            <Flex align="center" gap="12px">
              <Icon as={MdFileDownload} w="22px" h="22px" />
              <Text>Download PDF Report</Text>
            </Flex>
          )}
        </Button>
      </Box>

      {/* Information Box */}
      <Box
        bg="#FEF3C7"
        p="24px"
        borderRadius="12px"
        border="1px solid"
        borderColor={colors.warning}
      >
        <Flex align="center" gap="12px" mb="12px">
          <Flex
            w="40px"
            h="40px"
            align="center"
            justify="center"
            bg="rgba(255, 255, 255, 0.5)"
            borderRadius="8px"
          >
            <Icon as={MdDescription} w="24px" h="24px" color={colors.navy} />
          </Flex>
          <Text fontSize="18px" fontWeight="600" color={colors.navy}>
            Report Contents
          </Text>
        </Flex>
        <Box
          as="ul"
          ml="20px"
          fontSize="15px"
          color={colors.text.primary}
          lineHeight="1.8"
          css={{ listStyleType: 'disc' }}
        >
          <li>Executive summary with compliance verdict</li>
          <li>Detailed evaluation metrics and statistics</li>
          <li>Score distribution visualization</li>
          <li>Failed trace analysis with pattern classification</li>
          <li>Recommendations for compliance improvement</li>
          <li>EU AI Act Article 15 & 19 alignment notes</li>
        </Box>
      </Box>
    </Box>
  );
}
