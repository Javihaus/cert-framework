'use client';

import { Box, Text, Grid, Flex } from '@chakra-ui/react';
import { MdCheckCircle, MdInsertDriveFile, MdBarChart, MdSecurity, MdSpeed, MdVerifiedUser } from 'react-icons/md';
import { colors } from '@/theme/colors';
import Card from '@/components/Card';

export default function HomePage() {
  return (
    <Box maxW="1200px" mx="auto" p="48px">
      {/* Hero Section */}
      <Box mb="72px" textAlign="center">
        <Text
          fontSize="56px"
          fontWeight="700"
          color={colors.navy}
          mb="24px"
          letterSpacing="-2px"
          lineHeight="1.1"
        >
          AI systems you can deploy with confidence
        </Text>
        <Text fontSize="24px" color={colors.text.secondary} lineHeight="1.6" maxW="800px" mx="auto">
          Built for the August 2025 EU AI Act deadline. Trace analysis that proves 90%+ accuracy. Documentation ready for conformity assessment.
        </Text>
      </Box>

      {/* Overview Card */}
      <Card style={{ borderColor: colors.patience, marginBottom: '48px' }}>
        <Text fontSize="28px" fontWeight="700" color={colors.navy} mb="20px">
          What CERT Does
        </Text>
        <Text fontSize="18px" lineHeight="1.7" color={colors.text.primary} mb="24px">
          CERT combines production LLM monitoring with EU AI Act compliance automation.
          Track accuracy, analyze failures, and generate audit-ready documentation automatically.
        </Text>
        <Box
          bg={colors.patience}
          p="24px"
          borderRadius="12px"
        >
          <Flex align="center" gap="12px" mb="12px">
            <MdVerifiedUser size={28} color={colors.cobalt} />
            <Text fontSize="18px" fontWeight="600" color={colors.navy}>
              Built for Compliance Consultants
            </Text>
          </Flex>
          <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
            Turn weeks of manual documentation into hours. CERT analyzes your traces,
            classifies risk, and generates professional Word documents ready for expert review.
          </Text>
        </Box>
      </Card>

      {/* Features Grid */}
      <Grid templateColumns="repeat(2, 1fr)" gap="32px" mb="48px">
        {/* Monitoring */}
        <Card style={{ borderColor: colors.patience, padding: '32px' }}>
          <Flex align="start" gap="16px" mb="16px">
            <Box
              w="56px"
              h="56px"
              bg={colors.cobalt}
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
            >
              <MdBarChart size={32} />
            </Box>
            <Box flex="1">
              <Text fontSize="24px" fontWeight="700" color={colors.navy} mb="12px">
                Production Monitoring
              </Text>
              <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
                Upload LLM traces to analyze accuracy, identify failures, and track
                performance metrics required by Article 15 (accuracy, robustness).
              </Text>
            </Box>
          </Flex>
          <Box mt="20px" pt="20px" borderTop="1px solid" borderColor={colors.patience}>
            <Text fontSize="15px" color={colors.text.secondary}>
              → Use <strong>Monitoring</strong> tab to load trace data
            </Text>
          </Box>
        </Card>

        {/* Document Generation */}
        <Card style={{ borderColor: colors.patience, padding: '32px' }}>
          <Flex align="start" gap="16px" mb="16px">
            <Box
              w="56px"
              h="56px"
              bg={colors.coral}
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
            >
              <MdInsertDriveFile size={32} />
            </Box>
            <Box flex="1">
              <Text fontSize="24px" fontWeight="700" color={colors.navy} mb="12px">
                Compliance Documents
              </Text>
              <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
                Generate 5 professional Word documents for EU AI Act compliance:
                Risk Classification, Annex IV Technical Documentation, and more.
              </Text>
            </Box>
          </Flex>
          <Box mt="20px" pt="20px" borderTop="1px solid" borderColor={colors.patience}>
            <Text fontSize="15px" color={colors.text.secondary}>
              → Use <strong>Document Generation</strong> tab to create package
            </Text>
          </Box>
        </Card>
      </Grid>

      {/* Workflow Card */}
      <Card style={{ borderColor: colors.cobalt, backgroundColor: '#f8fafc', padding: '40px' }}>
        <Text fontSize="32px" fontWeight="700" color={colors.navy} mb="32px">
          Typical Workflow
        </Text>

        <Flex direction="column" gap="24px">
          {/* Step 1 */}
          <Flex align="start" gap="20px">
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="20px"
              fontWeight="700"
            >
              1
            </Box>
            <Box>
              <Text fontSize="20px" fontWeight="600" color={colors.navy} mb="8px">
                Load Production Traces
              </Text>
              <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
                Upload JSON file with LLM traces from your production system (via OpenTelemetry,
                LangSmith, or custom logging). CERT analyzes accuracy and failure patterns.
              </Text>
            </Box>
          </Flex>

          {/* Step 2 */}
          <Flex align="start" gap="20px">
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="20px"
              fontWeight="700"
            >
              2
            </Box>
            <Box>
              <Text fontSize="20px" fontWeight="600" color={colors.navy} mb="8px">
                Review Monitoring Dashboards
              </Text>
              <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
                Explore overview metrics, failed traces, and distribution charts. Identify
                issues to address before generating compliance documentation.
              </Text>
            </Box>
          </Flex>

          {/* Step 3 */}
          <Flex align="start" gap="20px">
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="20px"
              fontWeight="700"
            >
              3
            </Box>
            <Box>
              <Text fontSize="20px" fontWeight="600" color={colors.navy} mb="8px">
                Download Reports
              </Text>
              <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
                Generate a professional PDF report directly in your browser. For Word documents,
                use the CERT CLI to generate the full compliance package locally.
              </Text>
            </Box>
          </Flex>

          {/* Step 4 */}
          <Flex align="start" gap="20px">
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="20px"
              fontWeight="700"
            >
              4
            </Box>
            <Box>
              <Text fontSize="20px" fontWeight="600" color={colors.navy} mb="8px">
                Expert Review & Delivery
              </Text>
              <Text fontSize="16px" lineHeight="1.6" color={colors.text.primary}>
                Documents include [EXPERT INPUT REQUIRED] markers for manual sections.
                Add professional commentary (8-10 hours), convert to PDF, deliver to client.
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Card>

      {/* Footer Info */}
      <Box mt="64px" pt="32px" borderTop="1px solid" borderColor={colors.patience}>
        <Flex gap="64px">
          <Box flex="1">
            <Flex align="center" gap="8px" mb="12px">
              <MdSecurity size={20} color={colors.cobalt} />
              <Text fontSize="16px" fontWeight="600" color={colors.text.secondary}>
                EU AI Act Focus
              </Text>
            </Flex>
            <Text fontSize="15px" color={colors.text.muted} lineHeight="1.7">
              Risk classification (Annex III)<br/>
              Technical documentation (Annex IV)<br/>
              Accuracy & robustness (Article 15)<br/>
              Logging requirements (Article 19)
            </Text>
          </Box>
          <Box flex="1">
            <Flex align="center" gap="8px" mb="12px">
              <MdInsertDriveFile size={20} color={colors.cobalt} />
              <Text fontSize="16px" fontWeight="600" color={colors.text.secondary}>
                Document Outputs
              </Text>
            </Flex>
            <Text fontSize="15px" color={colors.text.muted} lineHeight="1.7">
              5 Microsoft Word documents<br/>
              32 pages total<br/>
              Auto-populated with trace data<br/>
              Expert sections marked for review
            </Text>
          </Box>
          <Box flex="1">
            <Flex align="center" gap="8px" mb="12px">
              <MdSpeed size={20} color={colors.cobalt} />
              <Text fontSize="16px" fontWeight="600" color={colors.text.secondary}>
                Time Savings
              </Text>
            </Flex>
            <Text fontSize="15px" color={colors.text.muted} lineHeight="1.7">
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
