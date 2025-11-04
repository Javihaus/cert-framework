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
import { colors } from '@/theme/colors';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';

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
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          results,
          metadata: {
            title: reportTitle,
            organization,
            evaluator,
            notes,
            generated_date: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cert_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please ensure the Python backend is running.');
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
        <Flex align="center" gap="12px" mb="24px">
          <Icon as={MdDescription} w="32px" h="32px" color={colors.cobalt} />
          <Text fontSize="24px" fontWeight="700" color={colors.navy}>
            Generate Compliance Report
          </Text>
        </Flex>

        <Text fontSize="14px" color={colors.text.muted} mb="24px" lineHeight="1.7">
          Generate a professional PDF report with comprehensive evaluation metrics,
          failure analysis, and compliance recommendations. This report is suitable
          for regulatory documentation and stakeholder review.
        </Text>

        {/* Report Metadata Form */}
        <VStack gap="20px" align="stretch" mb="32px">
          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
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
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
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
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
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
            />
          </Box>

          <Box>
            <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
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
          <Text fontSize="16px" fontWeight="700" color={colors.navy} mb="16px">
            Report Preview
          </Text>

          <VStack gap="12px" align="stretch">
            <Flex justify="space-between">
              <Text fontSize="14px" color={colors.text.muted}>Total Traces:</Text>
              <Text fontSize="14px" fontWeight="600" color={colors.navy}>
                {summary.total_traces.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="14px" color={colors.text.muted}>Accuracy:</Text>
              <Text
                fontSize="14px"
                fontWeight="600"
                color={isCompliant ? colors.success : colors.warning}
              >
                {(summary.accuracy * 100).toFixed(1)}%
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="14px" color={colors.text.muted}>Passed Traces:</Text>
              <Text fontSize="14px" fontWeight="600" color={colors.success}>
                {summary.passed_traces.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="14px" color={colors.text.muted}>Failed Traces:</Text>
              <Text fontSize="14px" fontWeight="600" color={colors.error}>
                {summary.failed_traces.toLocaleString()}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="14px" color={colors.text.muted}>Mean Confidence:</Text>
              <Text fontSize="14px" fontWeight="600" color={colors.navy}>
                {summary.mean_confidence.toFixed(3)}
              </Text>
            </Flex>

            <Flex justify="space-between">
              <Text fontSize="14px" color={colors.text.muted}>Compliance Status:</Text>
              <Text
                fontSize="14px"
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
          h="52px"
          bg={colors.cobalt}
          color="white"
          fontSize="16px"
          fontWeight="600"
          borderRadius="8px"
          _hover={{ bg: colors.navy }}
          onClick={handleDownloadReport}
          isDisabled={loading}
        >
          {loading ? (
            'Generating Report...'
          ) : (
            <Flex align="center" gap="12px">
              <Icon as={MdFileDownload} w="20px" h="20px" />
              <Text>Download PDF Report</Text>
            </Flex>
          )}
        </Button>
      </Box>

      {/* Information Box */}
      <Box
        bg="#FEF3C7"
        p="20px"
        borderRadius="12px"
        border="1px solid"
        borderColor={colors.warning}
      >
        <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
          📄 Report Contents
        </Text>
        <Box
          as="ul"
          ml="20px"
          fontSize="13px"
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
