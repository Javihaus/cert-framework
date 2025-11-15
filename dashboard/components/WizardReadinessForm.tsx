'use client';

import { Box, Flex, Text, Grid, Button, Input } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { ReadinessInputs } from '@/types/wizard';
import { CheckCircle2, Circle, Database, Code, Users, Shield } from 'lucide-react';

interface WizardReadinessFormProps {
  inputs: ReadinessInputs;
  onChange: (inputs: ReadinessInputs) => void;
  onSubmit: () => void;
}

export default function WizardReadinessForm({
  inputs,
  onChange,
  onSubmit
}: WizardReadinessFormProps) {
  const updateCheckbox = (field: keyof ReadinessInputs, value: boolean) => {
    onChange({ ...inputs, [field]: value });
  };

  const updateField = (field: keyof ReadinessInputs, value: any) => {
    onChange({ ...inputs, [field]: value });
  };

  const CheckboxField = ({
    field,
    label,
    description
  }: {
    field: keyof ReadinessInputs;
    label: string;
    description: string;
  }) => {
    const isChecked = inputs[field] as boolean;

    return (
      <Flex
        p={spacing.md}
        borderRadius="md"
        borderWidth="2px"
        borderColor={isChecked ? colors.cobalt : colors.patience}
        bg={isChecked ? colors.cobalt + '10' : 'white'}
        cursor="pointer"
        transition="all 0.2s"
        onClick={() => updateCheckbox(field, !isChecked)}
        _hover={{ borderColor: colors.cobalt }}
        gap={spacing.sm}
      >
        <Box flexShrink={0} mt="2px">
          {isChecked ? (
            <CheckCircle2 size={20} color={colors.cobalt} />
          ) : (
            <Circle size={20} color={colors.patience} />
          )}
        </Box>
        <Box flex={1}>
          <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
            {label}
          </Text>
          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
            {description}
          </Text>
        </Box>
      </Flex>
    );
  };

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        Readiness Assessment
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Evaluate your organization's preparedness for AI implementation across data, technical, organizational, and compliance dimensions.
      </Text>

      {/* Data Readiness */}
      <Card mb={spacing.lg} bg={colors.cobalt + '10'} borderColor={colors.cobalt}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Database size={24} color={colors.cobalt} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Data Readiness
          </Text>
        </Flex>

        <Flex direction="column" gap={spacing.sm}>
          <CheckboxField
            field="hasDataStrategy"
            label="Data Strategy & Governance"
            description="Formal data governance framework, policies, and ownership established"
          />

          <CheckboxField
            field="hasLabeledData"
            label="Labeled Training Data"
            description="Sufficient labeled or annotated data available for training/fine-tuning"
          />

          <Box p={spacing.md} borderRadius="md" borderWidth="2px" borderColor={colors.patience} bg="white">
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
              Data Quality Level
            </Text>
            <Box>
              <select
                value={inputs.dataQuality}
                onChange={(e) => updateField('dataQuality', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `2px solid ${colors.patience}`,
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="high">High - Clean, consistent, well-documented</option>
                <option value="medium">Medium - Mostly clean with some gaps</option>
                <option value="low">Low - Significant quality issues</option>
              </select>
            </Box>
          </Box>
        </Flex>
      </Card>

      {/* Technical Readiness */}
      <Card mb={spacing.lg} bg={colors.olive + '10'} borderColor={colors.olive}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Code size={24} color={colors.olive} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Technical Readiness
          </Text>
        </Flex>

        <Flex direction="column" gap={spacing.sm}>
          <CheckboxField
            field="hasMLExperience"
            label="ML/AI Experience"
            description="Team has successfully delivered ML/AI projects in production"
          />

          <CheckboxField
            field="hasInfrastructure"
            label="Cloud Infrastructure"
            description="Cloud infrastructure (AWS/Azure/GCP) set up for AI workloads"
          />

          <Box p={spacing.md} borderRadius="md" borderWidth="2px" borderColor={colors.patience} bg="white">
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
              Team Size (technical staff)
            </Text>
            <Input
              type="number"
              value={inputs.teamSize}
              onChange={(e) => updateField('teamSize', Number(e.target.value))}
              placeholder="Number of engineers/data scientists"
              min={0}
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Include engineers, data scientists, ML specialists working on this project
            </Text>
          </Box>
        </Flex>
      </Card>

      {/* Organizational Readiness */}
      <Card mb={spacing.lg} bg={colors.gold + '10'} borderColor={colors.gold}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Users size={24} color={colors.gold} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Organizational Readiness
          </Text>
        </Flex>

        <Flex direction="column" gap={spacing.sm}>
          <CheckboxField
            field="hasExecutiveSupport"
            label="Executive Sponsorship"
            description="C-level sponsor committed to project success and resource allocation"
          />

          <CheckboxField
            field="hasChangeManagement"
            label="Change Management Plan"
            description="Strategy for user adoption, training, and process changes defined"
          />

          <CheckboxField
            field="hasBudgetAllocated"
            label="Budget Allocated"
            description="Formal budget approved and allocated for implementation and operations"
          />
        </Flex>
      </Card>

      {/* Compliance Readiness */}
      <Card mb={spacing.lg} bg={colors.alert + '10'} borderColor={colors.alert}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Shield size={24} color={colors.alert} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Compliance & Security Readiness
          </Text>
        </Flex>

        <Flex direction="column" gap={spacing.sm}>
          <CheckboxField
            field="hasComplianceFramework"
            label="Compliance Framework"
            description="Audit and compliance processes established for AI systems"
          />

          <CheckboxField
            field="hasSecurityMeasures"
            label="Security & Privacy Measures"
            description="Data security, access controls, and privacy protection implemented"
          />
        </Flex>
      </Card>

      {/* Timeline Estimate */}
      <Card mb={spacing.lg}>
        <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
          Expected Timeline
        </Text>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
          How many weeks do you estimate for implementation?
        </Text>
        <Input
          type="number"
          value={inputs.timelineWeeks}
          onChange={(e) => updateField('timelineWeeks', Number(e.target.value))}
          placeholder="Weeks"
          min={1}
        />
        <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
          Include planning, development, testing, and deployment phases
        </Text>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        bg={colors.cobalt}
        color="white"
        w="100%"
        py={spacing.lg}
        fontSize={typography.fontSize.lg}
        fontWeight={typography.fontWeight.semibold}
        _hover={{ bg: colors.navy }}
      >
        Assess Readiness
      </Button>
    </Box>
  );
}
