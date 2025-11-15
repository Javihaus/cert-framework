'use client';

import { Box, Flex, Text, Grid, Button } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { RiskOutputs } from '@/types/wizard';
import { XCircle, AlertTriangle, Shield, CheckCircle2, Clock, DollarSign } from 'lucide-react';

interface WizardRiskResultsProps {
  outputs: RiskOutputs;
  onNext: () => void;
}

export default function WizardRiskResults({ outputs, onNext }: WizardRiskResultsProps) {
  const getClassificationConfig = (classification: string) => {
    switch (classification) {
      case 'prohibited':
        return {
          icon: XCircle,
          color: colors.alert,
          bg: colors.alert + '10',
          label: 'PROHIBITED',
          description: 'This AI system cannot be deployed under EU AI Act'
        };
      case 'high-risk':
        return {
          icon: AlertTriangle,
          color: colors.gold,
          bg: colors.gold + '10',
          label: 'HIGH-RISK',
          description: 'Significant compliance requirements apply'
        };
      case 'limited-risk':
        return {
          icon: Shield,
          color: colors.cobalt,
          bg: colors.cobalt + '10',
          label: 'LIMITED-RISK',
          description: 'Transparency obligations required'
        };
      case 'minimal-risk':
        return {
          icon: CheckCircle2,
          color: colors.olive,
          bg: colors.olive + '10',
          label: 'MINIMAL-RISK',
          description: 'No mandatory requirements'
        };
      default:
        return {
          icon: Shield,
          color: colors.mist,
          bg: colors.background,
          label: 'UNKNOWN',
          description: ''
        };
    }
  };

  const config = getClassificationConfig(outputs.classification);
  const Icon = config.icon;
  const isProhibited = outputs.classification === 'prohibited';

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        Risk Classification Results
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Your AI system has been classified according to EU AI Act requirements
      </Text>

      {/* Classification Badge */}
      <Card mb={spacing.lg} bg={config.bg} borderColor={config.color} borderWidth="3px">
        <Flex direction="column" align="center" textAlign="center" py={spacing.lg}>
          <Icon size={64} color={config.color} />
          <Text fontSize={typography.fontSize['4xl']} fontWeight={typography.fontWeight.bold} color={config.color} mt={spacing.md} mb={spacing.xs}>
            {config.label}
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            {config.description}
          </Text>
        </Flex>
      </Card>

      {/* Prohibition Reason */}
      {isProhibited && outputs.prohibitionReason && (
        <Card mb={spacing.lg} bg={colors.alert + '10'} borderColor={colors.alert}>
          <Flex align="center" gap={spacing.sm} mb={spacing.md}>
            <XCircle size={24} color={colors.alert} />
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Why This System is Prohibited
            </Text>
          </Flex>
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            {outputs.prohibitionReason}
          </Text>
        </Card>
      )}

      {/* Triggered Criteria */}
      {outputs.triggeredCriteria.length > 0 && (
        <Card mb={spacing.lg}>
          <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
            Triggered Criteria
          </Text>
          <Flex direction="column" gap={spacing.sm}>
            {outputs.triggeredCriteria.map((criterion, idx) => (
              <Flex key={idx} align="start" gap={spacing.sm}>
                <Box w="4px" h="4px" bg={config.color} borderRadius="full" mt="8px" flexShrink={0} />
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  {criterion}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}

      {/* Cost and Timeline Estimates */}
      {!isProhibited && (
        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md} mb={spacing.lg}>
          <Card borderColor={colors.cobalt} borderWidth="2px">
            <Flex align="center" gap={spacing.sm} mb={spacing.sm}>
              <DollarSign size={20} color={colors.cobalt} />
              <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                Estimated Compliance Cost
              </Text>
            </Flex>
            <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
              ${outputs.estimatedComplianceCost.low.toLocaleString()} - ${outputs.estimatedComplianceCost.high.toLocaleString()}
            </Text>
          </Card>

          <Card borderColor={colors.cobalt} borderWidth="2px">
            <Flex align="center" gap={spacing.sm} mb={spacing.sm}>
              <Clock size={20} color={colors.cobalt} />
              <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                Estimated Timeline
              </Text>
            </Flex>
            <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
              {outputs.estimatedTimeMonths.low} - {outputs.estimatedTimeMonths.high} months
            </Text>
          </Card>
        </Grid>
      )}

      {/* Compliance Requirements */}
      <Card mb={spacing.xl}>
        <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
          {isProhibited ? 'Legal Status' : 'Compliance Requirements'}
        </Text>
        <Flex direction="column" gap={spacing.sm}>
          {outputs.complianceRequirements.map((requirement, idx) => (
            <Flex key={idx} align="start" gap={spacing.sm}>
              <CheckCircle2 size={16} color={colors.cobalt} style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                {requirement}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Summary and Next Steps */}
      <Card mb={spacing.xl} bg={colors.background}>
        <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
          What This Means
        </Text>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
          {isProhibited && (
            <>
              Your AI system falls under prohibited uses of the EU AI Act. It cannot be deployed in the EU.
              You will need to either redesign the system to avoid prohibited practices or deploy it outside EU jurisdiction.
            </>
          )}
          {outputs.classification === 'high-risk' && (
            <>
              Your AI system is classified as <strong>high-risk</strong> under Annex III of the EU AI Act.
              You'll need to implement comprehensive compliance measures including risk management systems,
              technical documentation, human oversight, and undergo conformity assessment before deployment.
              Estimated compliance costs range from <strong>${outputs.estimatedComplianceCost.low.toLocaleString()}</strong> to{' '}
              <strong>${outputs.estimatedComplianceCost.high.toLocaleString()}</strong> over{' '}
              <strong>{outputs.estimatedTimeMonths.low}-{outputs.estimatedTimeMonths.high} months</strong>.
            </>
          )}
          {outputs.classification === 'limited-risk' && (
            <>
              Your AI system has <strong>limited-risk</strong> classification. You must comply with transparency requirements,
              ensuring users know they're interacting with AI and understand the system's capabilities and limitations.
              This is relatively straightforward with costs around <strong>${outputs.estimatedComplianceCost.low.toLocaleString()}</strong> to{' '}
              <strong>${outputs.estimatedComplianceCost.high.toLocaleString()}</strong>.
            </>
          )}
          {outputs.classification === 'minimal-risk' && (
            <>
              Good news! Your AI system is <strong>minimal-risk</strong> with no mandatory compliance requirements under the EU AI Act.
              You're encouraged to follow voluntary codes of conduct, but standard product safety laws apply.
            </>
          )}
        </Text>
      </Card>

      {!isProhibited && (
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
          Continue to Architecture Selection
        </Button>
      )}

      {isProhibited && (
        <Box textAlign="center">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            This wizard cannot proceed with prohibited AI systems. Please consult legal counsel for alternative approaches.
          </Text>
        </Box>
      )}
    </Box>
  );
}
