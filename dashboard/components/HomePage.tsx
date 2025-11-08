'use client';

import { Box, Text, Grid, Flex } from '@chakra-ui/react';
import { MdCheckCircle, MdInsertDriveFile, MdBarChart, MdSecurity, MdSpeed, MdVerifiedUser } from 'react-icons/md';
import { colors, spacing, typography, borderRadius } from '@/theme';
import Card from '@/components/Card';

export default function HomePage() {
  return (
    <Box maxW="1200px" mx="auto" p={spacing['2xl']}>
      {/* Hero Section */}
      <Box mb={spacing['3xl']} textAlign="center">
        <Text
          fontSize={typography.fontSize['5xl']}
          fontWeight={typography.fontWeight.bold}
          color={colors.navy}
          mb={spacing.lg}
          letterSpacing={typography.letterSpacing.tight}
          lineHeight={typography.lineHeight.tight}
        >
          AI systems you can deploy with confidence
        </Text>
        <Text
          fontSize={typography.fontSize['2xl']}
          color={colors.text.secondary}
          lineHeight={typography.lineHeight.relaxed}
          maxW="800px"
          mx="auto"
        >
          Built for the August 2025 EU AI Act deadline. Trace analysis that proves 90%+ accuracy. Documentation ready for conformity assessment.
        </Text>
      </Box>

      {/* Overview Card */}
      <Card style={{ borderColor: colors.patience, marginBottom: spacing['2xl'] }}>
        <Text
          fontSize={typography.fontSize['3xl']}
          fontWeight={typography.fontWeight.bold}
          color={colors.navy}
          mb={spacing.lg}
        >
          What CERT Does
        </Text>
        <Text
          fontSize={typography.fontSize.lg}
          lineHeight={typography.lineHeight.loose}
          color={colors.text.primary}
          mb={spacing.lg}
        >
          CERT combines production LLM monitoring with EU AI Act compliance automation.
          Track accuracy, analyze failures, and generate audit-ready documentation automatically.
        </Text>
        <Box
          bg={colors.patience}
          p={spacing.lg}
          borderRadius={borderRadius.lg}
        >
          <Flex align="center" gap={spacing.sm} mb={spacing.sm}>
            <MdVerifiedUser size={28} color={colors.cobalt} />
            <Text
              fontSize={typography.fontSize.lg}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
            >
              Built for Compliance Consultants
            </Text>
          </Flex>
          <Text
            fontSize={typography.fontSize.base}
            lineHeight={typography.lineHeight.relaxed}
            color={colors.text.primary}
          >
            Turn weeks of manual documentation into hours. CERT analyzes your traces,
            classifies risk, and generates professional Word documents ready for expert review.
          </Text>
        </Box>
      </Card>

      {/* Features Grid */}
      <Grid templateColumns="repeat(2, 1fr)" gap={spacing.xl} mb={spacing['2xl']}>
        {/* Monitoring */}
        <Card style={{ borderColor: colors.patience, padding: spacing.xl }}>
          <Flex align="start" gap={spacing.md} mb={spacing.md}>
            <Box
              w="56px"
              h="56px"
              bg={colors.cobalt}
              borderRadius={borderRadius.lg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
            >
              <MdBarChart size={32} />
            </Box>
            <Box flex="1">
              <Text
                fontSize={typography.fontSize['2xl']}
                fontWeight={typography.fontWeight.bold}
                color={colors.navy}
                mb={spacing.sm}
              >
                Production Monitoring
              </Text>
              <Text
                fontSize={typography.fontSize.base}
                lineHeight={typography.lineHeight.relaxed}
                color={colors.text.primary}
              >
                Upload LLM traces to analyze accuracy, identify failures, and track
                performance metrics required by Article 15 (accuracy, robustness).
              </Text>
            </Box>
          </Flex>
          <Box mt={spacing.lg} pt={spacing.lg} borderTop="1px solid" borderColor={colors.patience}>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              → Use <strong>Monitoring</strong> tab to load trace data
            </Text>
          </Box>
        </Card>

        {/* Document Generation */}
        <Card style={{ borderColor: colors.patience, padding: spacing.xl }}>
          <Flex align="start" gap={spacing.md} mb={spacing.md}>
            <Box
              w="56px"
              h="56px"
              bg={colors.coral}
              borderRadius={borderRadius.lg}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
            >
              <MdInsertDriveFile size={32} />
            </Box>
            <Box flex="1">
              <Text
                fontSize={typography.fontSize['2xl']}
                fontWeight={typography.fontWeight.bold}
                color={colors.navy}
                mb={spacing.sm}
              >
                Compliance Documents
              </Text>
              <Text
                fontSize={typography.fontSize.base}
                lineHeight={typography.lineHeight.relaxed}
                color={colors.text.primary}
              >
                Generate 5 professional Word documents for EU AI Act compliance:
                Risk Classification, Annex IV Technical Documentation, and more.
              </Text>
            </Box>
          </Flex>
          <Box mt={spacing.lg} pt={spacing.lg} borderTop="1px solid" borderColor={colors.patience}>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              → Use <strong>Document Generation</strong> tab to create package
            </Text>
          </Box>
        </Card>
      </Grid>

      {/* Workflow Card */}
      <Card style={{ borderColor: colors.cobalt, backgroundColor: '#f8fafc', padding: spacing['2xl'] }}>
        <Text
          fontSize={typography.fontSize['3xl']}
          fontWeight={typography.fontWeight.bold}
          color={colors.navy}
          mb={spacing.xl}
        >
          Typical Workflow
        </Text>

        <Flex direction="column" gap={spacing.lg}>
          {/* Step 1 */}
          <Flex align="start" gap={spacing.lg}>
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.bold}
            >
              1
            </Box>
            <Box>
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
                mb={spacing.xs}
              >
                Load Production Traces
              </Text>
              <Text
                fontSize={typography.fontSize.base}
                lineHeight={typography.lineHeight.relaxed}
                color={colors.text.primary}
              >
                Upload JSON file with LLM traces from your production system (via OpenTelemetry,
                LangSmith, or custom logging). CERT analyzes accuracy and failure patterns.
              </Text>
            </Box>
          </Flex>

          {/* Step 2 */}
          <Flex align="start" gap={spacing.lg}>
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.bold}
            >
              2
            </Box>
            <Box>
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
                mb={spacing.xs}
              >
                Review Monitoring Dashboards
              </Text>
              <Text
                fontSize={typography.fontSize.base}
                lineHeight={typography.lineHeight.relaxed}
                color={colors.text.primary}
              >
                Explore overview metrics, failed traces, and distribution charts. Identify
                issues to address before generating compliance documentation.
              </Text>
            </Box>
          </Flex>

          {/* Step 3 */}
          <Flex align="start" gap={spacing.lg}>
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.bold}
            >
              3
            </Box>
            <Box>
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
                mb={spacing.xs}
              >
                Download Reports
              </Text>
              <Text
                fontSize={typography.fontSize.base}
                lineHeight={typography.lineHeight.relaxed}
                color={colors.text.primary}
              >
                Generate a professional PDF report directly in your browser. For Word documents,
                use the CERT CLI to generate the full compliance package locally.
              </Text>
            </Box>
          </Flex>

          {/* Step 4 */}
          <Flex align="start" gap={spacing.lg}>
            <Box
              minW="44px"
              h="44px"
              bg={colors.cobalt}
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.bold}
            >
              4
            </Box>
            <Box>
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
                mb={spacing.xs}
              >
                Expert Review & Delivery
              </Text>
              <Text
                fontSize={typography.fontSize.base}
                lineHeight={typography.lineHeight.relaxed}
                color={colors.text.primary}
              >
                Documents include [EXPERT INPUT REQUIRED] markers for manual sections.
                Add professional commentary (8-10 hours), convert to PDF, deliver to client.
              </Text>
            </Box>
          </Flex>
        </Flex>
      </Card>

      {/* Footer Info */}
      <Box mt={spacing['3xl']} pt={spacing.xl} borderTop="1px solid" borderColor={colors.patience}>
        <Flex gap={spacing['3xl']}>
          <Box flex="1">
            <Flex align="center" gap={spacing.xs} mb={spacing.sm}>
              <MdSecurity size={20} color={colors.cobalt} />
              <Text
                fontSize={typography.fontSize.base}
                fontWeight={typography.fontWeight.semibold}
                color={colors.text.secondary}
              >
                EU AI Act Focus
              </Text>
            </Flex>
            <Text
              fontSize={typography.fontSize.sm}
              color={colors.text.muted}
              lineHeight={typography.lineHeight.loose}
            >
              Risk classification (Annex III)<br/>
              Technical documentation (Annex IV)<br/>
              Accuracy & robustness (Article 15)<br/>
              Logging requirements (Article 19)
            </Text>
          </Box>
          <Box flex="1">
            <Flex align="center" gap={spacing.xs} mb={spacing.sm}>
              <MdInsertDriveFile size={20} color={colors.cobalt} />
              <Text
                fontSize={typography.fontSize.base}
                fontWeight={typography.fontWeight.semibold}
                color={colors.text.secondary}
              >
                Document Outputs
              </Text>
            </Flex>
            <Text
              fontSize={typography.fontSize.sm}
              color={colors.text.muted}
              lineHeight={typography.lineHeight.loose}
            >
              5 Microsoft Word documents<br/>
              32 pages total<br/>
              Auto-populated with trace data<br/>
              Expert sections marked for review
            </Text>
          </Box>
          <Box flex="1">
            <Flex align="center" gap={spacing.xs} mb={spacing.sm}>
              <MdSpeed size={20} color={colors.cobalt} />
              <Text
                fontSize={typography.fontSize.base}
                fontWeight={typography.fontWeight.semibold}
                color={colors.text.secondary}
              >
                Time Savings
              </Text>
            </Flex>
            <Text
              fontSize={typography.fontSize.sm}
              color={colors.text.muted}
              lineHeight={typography.lineHeight.loose}
            >
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
