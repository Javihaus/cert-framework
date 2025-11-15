'use client';

import { Box, Flex, Text, Grid, Button } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { ROIOutputs } from '@/types/wizard';
import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';

interface WizardROIResultsProps {
  outputs: ROIOutputs;
  onNext: () => void;
}

export default function WizardROIResults({ outputs, onNext }: WizardROIResultsProps) {
  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return colors.olive;
      case 'medium': return colors.cobalt;
      case 'low': return colors.gold;
      default: return colors.mist;
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case 'high': return CheckCircle2;
      case 'medium': return TrendingUp;
      case 'low': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const ConfidenceIcon = getConfidenceIcon(outputs.confidenceLevel);
  const isPositiveROI = outputs.monthlySavings > 0;

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        ROI Analysis Results
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Here's your projected return on investment for AI automation
      </Text>

      {/* Key Metrics */}
      <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md} mb={spacing.lg}>
        <Card borderColor={colors.alert} borderWidth="2px">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
            Current Monthly Cost
          </Text>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.alert}>
            ${outputs.currentMonthlyCost.toLocaleString()}
          </Text>
        </Card>

        <Card borderColor={colors.olive} borderWidth="2px">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
            AI Monthly Cost
          </Text>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.olive}>
            ${outputs.aiMonthlyCost.toLocaleString()}
          </Text>
        </Card>

        <Card bg={isPositiveROI ? colors.cobalt + '10' : colors.alert + '10'} borderColor={isPositiveROI ? colors.cobalt : colors.alert} borderWidth="2px">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
            Monthly Savings
          </Text>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={isPositiveROI ? colors.cobalt : colors.alert}>
            ${outputs.monthlySavings.toLocaleString()}
          </Text>
        </Card>

        <Card bg={isPositiveROI ? colors.cobalt + '10' : colors.alert + '10'} borderColor={isPositiveROI ? colors.cobalt : colors.alert} borderWidth="2px">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
            Annual Savings
          </Text>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={isPositiveROI ? colors.cobalt : colors.alert}>
            ${outputs.annualSavings.toLocaleString()}
          </Text>
        </Card>

        <Card>
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
            Return on Investment
          </Text>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            {outputs.roiPercentage.toFixed(0)}%
          </Text>
        </Card>

        <Card>
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
            Break-Even Point
          </Text>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            {outputs.breakEvenMonths < 100 ? `${outputs.breakEvenMonths.toFixed(1)} months` : 'Never'}
          </Text>
        </Card>
      </Grid>

      {/* Confidence Level */}
      <Card mb={spacing.lg} bg={getConfidenceColor(outputs.confidenceLevel) + '10'} borderColor={getConfidenceColor(outputs.confidenceLevel)} borderWidth="2px">
        <Flex align="center" gap={spacing.md} mb={spacing.sm}>
          <ConfidenceIcon size={32} color={getConfidenceColor(outputs.confidenceLevel)} />
          <Box>
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Confidence Level: {outputs.confidenceLevel.toUpperCase()}
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              {outputs.confidenceLevel === 'high' && 'Strong business case with well-defined parameters'}
              {outputs.confidenceLevel === 'medium' && 'Reasonable estimates but some uncertainty remains'}
              {outputs.confidenceLevel === 'low' && 'Significant uncertainty - recommend pilot project first'}
            </Text>
          </Box>
        </Flex>
      </Card>

      {/* Risk Factors */}
      {outputs.risks.length > 0 && (
        <Card mb={spacing.xl} bg={colors.gold + '10'} borderColor={colors.gold}>
          <Flex align="center" gap={spacing.sm} mb={spacing.md}>
            <AlertTriangle size={20} color={colors.gold} />
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Risk Factors to Consider
            </Text>
          </Flex>
          <Flex direction="column" gap={spacing.xs}>
            {outputs.risks.map((risk, idx) => (
              <Flex key={idx} align="start" gap={spacing.xs}>
                <Box w="4px" h="4px" bg={colors.gold} borderRadius="full" mt="8px" flexShrink={0} />
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  {risk}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      {/* Summary */}
      <Card mb={spacing.xl}>
        <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
          Summary
        </Text>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.sm}>
          {isPositiveROI ? (
            <>
              Your AI automation project shows a <strong>positive ROI of {outputs.roiPercentage.toFixed(0)}%</strong> with
              monthly savings of <strong>${outputs.monthlySavings.toLocaleString()}</strong>. You'll break even
              in <strong>{outputs.breakEvenMonths.toFixed(1)} months</strong>.
            </>
          ) : (
            <>
              Based on your inputs, AI automation may <strong>cost more</strong> than your current manual process.
              Consider optimizing the AI success rate, reducing human review requirements, or exploring cheaper model alternatives.
            </>
          )}
        </Text>
      </Card>

      <Button
        onClick={onNext}
        bg={colors.cobalt}
        color="white"
        w="100%"
        py={spacing.lg}
        fontSize={typography.fontSize.lg}
        fontWeight={typography.fontWeight.semibold}
        _hover={{ bg: colors.navy }}
      >
        Continue to Risk Assessment
      </Button>
    </Box>
  );
}
