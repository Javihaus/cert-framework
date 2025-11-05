'use client';

import { Box, Text, Grid, Flex } from '@chakra-ui/react';
import { colors } from '@/theme/colors';
import Card from '@/components/Card';

export default function HomePage() {
  return (
    <Box maxW="1200px" mx="auto" p="32px">
      {/* Header */}
      <Box mb="40px">
        <Text
          fontSize="36px"
          fontWeight="700"
          color={colors.navy}
          mb="12px"
          letterSpacing="-1px"
        >
          CERT Framework
        </Text>
        <Text fontSize="18px" color={colors.text.secondary} lineHeight="1.6">
          Compliance Evaluation and Reporting Toolkit for EU AI Act
        </Text>
      </Box>

      {/* Overview Card */}
      <Card style={{ borderColor: colors.patience, marginBottom: '32px' }}>
        <Text fontSize="20px" fontWeight="700" color={colors.navy} mb="16px">
          What CERT Does
        </Text>
        <Text fontSize="15px" lineHeight="1.7" color={colors.text.primary} mb="16px">
          CERT combines production LLM monitoring with EU AI Act compliance automation.
          Track accuracy, analyze failures, and generate audit-ready documentation automatically.
        </Text>
        <Box
          bg={colors.patience}
          p="16px"
          borderRadius="8px"
          borderLeft="4px solid"
          borderLeftColor={colors.cobalt}
        >
          <Text fontSize="14px" fontWeight="600" color={colors.navy} mb="8px">
            🎯 Built for Compliance Consultants
          </Text>
          <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
            Turn weeks of manual documentation into hours. CERT analyzes your traces,
            classifies risk, and generates professional Word documents ready for expert review.
          </Text>
        </Box>
      </Card>

      {/* Features Grid */}
      <Grid templateColumns="repeat(2, 1fr)" gap="24px" mb="32px">
        {/* Monitoring */}
        <Card style={{ borderColor: colors.patience }}>
          <Flex align="start" gap="12px" mb="12px">
            <Box
              w="40px"
              h="40px"
              bg={colors.cobalt}
              borderRadius="8px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize="20px"
            >
              📊
            </Box>
            <Box flex="1">
              <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="8px">
                Production Monitoring
              </Text>
              <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
                Upload LLM traces to analyze accuracy, identify failures, and track
                performance metrics required by Article 15 (accuracy, robustness).
              </Text>
            </Box>
          </Flex>
          <Box mt="16px" pt="16px" borderTop="1px solid" borderColor={colors.patience}>
            <Text fontSize="13px" color={colors.text.secondary}>
              → Use <strong>Monitoring</strong> tab to load trace data
            </Text>
          </Box>
        </Card>

        {/* Document Generation */}
        <Card style={{ borderColor: colors.patience }}>
          <Flex align="start" gap="12px" mb="12px">
            <Box
              w="40px"
              h="40px"
              bg={colors.coral}
              borderRadius="8px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              fontSize="20px"
            >
              📄
            </Box>
            <Box flex="1">
              <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="8px">
                Compliance Documents
              </Text>
              <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
                Generate 5 professional Word documents for EU AI Act compliance:
                Risk Classification, Annex IV Technical Documentation, and more.
              </Text>
            </Box>
          </Flex>
          <Box mt="16px" pt="16px" borderTop="1px solid" borderColor={colors.patience}>
            <Text fontSize="13px" color={colors.text.secondary}>
              → Use <strong>Document Generation</strong> tab to create package
            </Text>
          </Box>
        </Card>
      </Grid>

      {/* Workflow Card */}
      <Card style={{ borderColor: colors.cobalt, backgroundColor: '#f8fafc' }}>
        <Text fontSize="20px" fontWeight="700" color={colors.navy} mb="20px">
          Typical Workflow
        </Text>

        <Flex direction="column" gap="16px">
          {/* Step 1 */}
          <Flex align="start" gap="16px">
            <Box
              minW="32px"
              h="32px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="16px"
              fontWeight="700"
            >
              1
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="4px">
                Load Production Traces
              </Text>
              <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
                Upload JSON file with LLM traces from your production system (via OpenTelemetry,
                LangSmith, or custom logging). CERT analyzes accuracy and failure patterns.
              </Text>
            </Box>
          </Flex>

          {/* Step 2 */}
          <Flex align="start" gap="16px">
            <Box
              minW="32px"
              h="32px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="16px"
              fontWeight="700"
            >
              2
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="4px">
                Review Monitoring Dashboards
              </Text>
              <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
                Explore overview metrics, failed traces, and distribution charts. Identify
                issues to address before generating compliance documentation.
              </Text>
            </Box>
          </Flex>

          {/* Step 3 */}
          <Flex align="start" gap="16px">
            <Box
              minW="32px"
              h="32px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="16px"
              fontWeight="700"
            >
              3
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="4px">
                Generate Compliance Package
              </Text>
              <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
                Fill in system details (name, purpose, risk classification) and generate
                5 Word documents: Risk Report, Annex IV, Audit Trail, Monitoring, and Checklist.
              </Text>
            </Box>
          </Flex>

          {/* Step 4 */}
          <Flex align="start" gap="16px">
            <Box
              minW="32px"
              h="32px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="16px"
              fontWeight="700"
            >
              4
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="600" color={colors.navy} mb="4px">
                Expert Review & Delivery
              </Text>
              <Text fontSize="14px" lineHeight="1.6" color={colors.text.primary}>
                Documents include [EXPERT INPUT REQUIRED] markers for manual sections.
                Add professional commentary (8-10 hours), convert to PDF, deliver to client.
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Card>

      {/* Footer Info */}
      <Box mt="40px" pt="24px" borderTop="1px solid" borderColor={colors.patience}>
        <Flex gap="48px">
          <Box>
            <Text fontSize="13px" fontWeight="600" color={colors.text.secondary} mb="4px">
              EU AI Act Focus
            </Text>
            <Text fontSize="12px" color={colors.text.muted} lineHeight="1.5">
              Risk classification (Annex III)<br/>
              Technical documentation (Annex IV)<br/>
              Accuracy & robustness (Article 15)<br/>
              Logging requirements (Article 19)
            </Text>
          </Box>
          <Box>
            <Text fontSize="13px" fontWeight="600" color={colors.text.secondary} mb="4px">
              Document Outputs
            </Text>
            <Text fontSize="12px" color={colors.text.muted} lineHeight="1.5">
              5 Microsoft Word documents<br/>
              32 pages total<br/>
              Auto-populated with trace data<br/>
              Expert sections marked for review
            </Text>
          </Box>
          <Box>
            <Text fontSize="13px" fontWeight="600" color={colors.text.secondary} mb="4px">
              Time Savings
            </Text>
            <Text fontSize="12px" color={colors.text.muted} lineHeight="1.5">
              Traditional: 40-60 hours manual work<br/>
              With CERT: 8-10 hours expert review<br/>
              Automation: 80% time reduction<br/>
              Quality: Consistent, audit-ready output
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
