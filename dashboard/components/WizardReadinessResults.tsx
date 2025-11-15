'use client';

import { Box, Flex, Text, Grid, Button } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { ReadinessOutputs } from '@/types/wizard';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock, AlertCircle, Database, Code, Users, Shield } from 'lucide-react';

interface WizardReadinessResultsProps {
  outputs: ReadinessOutputs;
  onNext: () => void;
}

export default function WizardReadinessResults({
  outputs,
  onNext
}: WizardReadinessResultsProps) {
  const getReadinessConfig = (level: string) => {
    switch (level) {
      case 'ready':
        return {
          icon: CheckCircle2,
          color: colors.olive,
          bg: colors.olive + '10',
          label: 'Ready to Implement',
          message: 'Your organization demonstrates strong readiness across all dimensions. You can proceed with confidence.'
        };
      case 'needs-preparation':
        return {
          icon: AlertTriangle,
          color: colors.gold,
          bg: colors.gold + '10',
          label: 'Needs Preparation',
          message: 'Some gaps need to be addressed before implementation. Review recommendations and create a preparation plan.'
        };
      case 'not-ready':
        return {
          icon: XCircle,
          color: colors.alert,
          bg: colors.alert + '10',
          label: 'Not Ready',
          message: 'Significant preparation required. Focus on building foundational capabilities before implementation.'
        };
      default:
        return {
          icon: AlertCircle,
          color: colors.mist,
          bg: colors.background,
          label: 'Unknown',
          message: ''
        };
    }
  };

  const config = getReadinessConfig(outputs.readinessLevel);
  const ReadinessIcon = config.icon;

  const categoryIcons = {
    data: Database,
    technical: Code,
    organizational: Users,
    compliance: Shield
  };

  const getCategoryColor = (score: number) => {
    if (score >= 70) return colors.olive;
    if (score >= 40) return colors.gold;
    return colors.alert;
  };

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        Readiness Assessment Results
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Based on your organizational capabilities and preparedness
      </Text>

      {/* Overall Readiness Badge */}
      <Card
        mb={spacing.lg}
        bg={config.bg}
        borderColor={config.color}
        borderWidth="2px"
        textAlign="center"
        py={spacing.xl}
      >
        <Flex direction="column" align="center" gap={spacing.md}>
          <ReadinessIcon size={64} color={config.color} />
          <Box>
            <Text fontSize={typography.fontSize['4xl']} fontWeight={typography.fontWeight.bold} color={config.color}>
              {config.label}
            </Text>
            <Text fontSize={typography.fontSize['5xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mt={spacing.sm}>
              {outputs.overallScore}/100
            </Text>
          </Box>
          <Text fontSize={typography.fontSize.base} color={colors.text.secondary} maxW="600px">
            {config.message}
          </Text>
        </Flex>
      </Card>

      {/* Category Scores */}
      <Card mb={spacing.lg}>
        <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.md}>
          Category Breakdown
        </Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md}>
          {Object.entries(outputs.categoryScores).map(([category, score]) => {
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
            const categoryColor = getCategoryColor(score);

            return (
              <Card
                key={category}
                bg={categoryColor + '10'}
                borderColor={categoryColor}
              >
                <Flex align="center" gap={spacing.sm} mb={spacing.sm}>
                  <CategoryIcon size={20} color={categoryColor} />
                  <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </Flex>
                <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={categoryColor}>
                  {score}/100
                </Text>
              </Card>
            );
          })}
        </Grid>
      </Card>

      {/* Timeline Estimate */}
      <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md} mb={spacing.lg}>
        <Card borderColor={colors.cobalt}>
          <Flex align="center" gap={spacing.sm} mb={spacing.sm}>
            <Clock size={20} color={colors.cobalt} />
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Estimated Timeline
            </Text>
          </Flex>
          <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            {outputs.estimatedTimelineWeeks} weeks
          </Text>
          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
            Including preparation and implementation
          </Text>
        </Card>

        <Card borderColor={colors.alert}>
          <Flex align="center" gap={spacing.sm} mb={spacing.sm}>
            <AlertCircle size={20} color={colors.alert} />
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Gaps Identified
            </Text>
          </Flex>
          <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            {outputs.gaps.length}
          </Text>
          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
            Areas needing attention
          </Text>
        </Card>
      </Grid>

      {/* Gaps */}
      {outputs.gaps.length > 0 && (
        <Card mb={spacing.lg} bg={colors.alert + '10'} borderColor={colors.alert}>
          <Flex align="center" gap={spacing.sm} mb={spacing.md}>
            <AlertCircle size={24} color={colors.alert} />
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
              Gaps to Address
            </Text>
          </Flex>
          <Flex direction="column" gap={spacing.sm}>
            {outputs.gaps.map((gap, idx) => (
              <Flex key={idx} align="start" gap={spacing.sm} p={spacing.sm} bg="white" borderRadius="md">
                <XCircle size={16} color={colors.alert} style={{ marginTop: '2px', flexShrink: 0 }} />
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  {gap}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      {/* Recommendations */}
      <Card mb={spacing.lg} bg={colors.cobalt + '10'} borderColor={colors.cobalt}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <TrendingUp size={24} color={colors.cobalt} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Recommendations
          </Text>
        </Flex>
        <Flex direction="column" gap={spacing.sm}>
          {outputs.recommendations.map((rec, idx) => (
            <Flex key={idx} align="start" gap={spacing.sm} p={spacing.sm} bg="white" borderRadius="md">
              <CheckCircle2 size={16} color={colors.cobalt} style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                {rec}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Risk Factors */}
      {outputs.riskFactors.length > 0 && (
        <Card mb={spacing.lg} bg={colors.gold + '10'} borderColor={colors.gold}>
          <Flex align="center" gap={spacing.sm} mb={spacing.md}>
            <AlertTriangle size={24} color={colors.gold} />
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
              Risk Factors
            </Text>
          </Flex>
          <Flex direction="column" gap={spacing.sm}>
            {outputs.riskFactors.map((risk, idx) => (
              <Flex key={idx} align="start" gap={spacing.sm} p={spacing.sm} bg="white" borderRadius="md">
                <AlertTriangle size={16} color={colors.gold} style={{ marginTop: '2px', flexShrink: 0 }} />
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  {risk}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      {/* Summary Message */}
      <Card mb={spacing.lg}>
        <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.md}>
          {outputs.readinessLevel === 'ready' && (
            <>
              Your organization is well-positioned to proceed with AI implementation.
              The next step will help you create a detailed deployment plan based on
              all the information gathered in this wizard.
            </>
          )}
          {outputs.readinessLevel === 'needs-preparation' && (
            <>
              Before proceeding to deployment planning, we recommend addressing the
              identified gaps. However, you can continue to see what a full deployment
              plan would look like and use it as a roadmap for your preparation phase.
            </>
          )}
          {outputs.readinessLevel === 'not-ready' && (
            <>
              We strongly recommend addressing the critical gaps before moving to
              deployment planning. The final step will show you what needs to be in
              place, which can serve as your preparation roadmap.
            </>
          )}
        </Text>
      </Card>

      {/* Continue Button */}
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
        Continue to Deployment Planning
      </Button>
    </Box>
  );
}
