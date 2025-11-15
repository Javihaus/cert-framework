'use client';

import { Box, Flex, Text, Grid, Button, Input } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { ROIInputs } from '@/types/wizard';

interface WizardROIFormProps {
  inputs: ROIInputs;
  onChange: (inputs: ROIInputs) => void;
  onSubmit: () => void;
}

export default function WizardROIForm({ inputs, onChange, onSubmit }: WizardROIFormProps) {
  const updateField = (field: keyof ROIInputs, value: number) => {
    onChange({ ...inputs, [field]: value });
  };

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        ROI Calculator
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Calculate the business case for AI automation. We'll compare your current manual process costs against estimated AI costs.
      </Text>

      {/* Current Manual Process */}
      <Card mb={spacing.lg} bg={colors.coral + '10'} borderColor={colors.coral}>
        <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
          Current Manual Process
        </Text>

        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md}>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Tasks per Month
            </Text>
            <Input
              type="number"
              value={inputs.tasksPerMonth}
              onChange={(e) => updateField('tasksPerMonth', Number(e.target.value))}
              placeholder="1000"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              How many tasks done manually today?
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Minutes per Task
            </Text>
            <Input
              type="number"
              value={inputs.minutesPerTask}
              onChange={(e) => updateField('minutesPerTask', Number(e.target.value))}
              placeholder="15"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Average time to complete one task
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Labor Cost per Hour ($)
            </Text>
            <Input
              type="number"
              value={inputs.laborCostPerHour}
              onChange={(e) => updateField('laborCostPerHour', Number(e.target.value))}
              placeholder="25"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Fully-loaded cost (salary + benefits)
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Error Rate (%)
            </Text>
            <Input
              type="number"
              value={inputs.errorRate}
              onChange={(e) => updateField('errorRate', Number(e.target.value))}
              placeholder="5"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Percentage of tasks with errors
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Cost per Error ($)
            </Text>
            <Input
              type="number"
              value={inputs.errorCostPerIncident}
              onChange={(e) => updateField('errorCostPerIncident', Number(e.target.value))}
              placeholder="100"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Average cost when error occurs
            </Text>
          </Box>
        </Grid>
      </Card>

      {/* AI System Estimates */}
      <Card mb={spacing.xl} bg={colors.olive + '10'} borderColor={colors.olive}>
        <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
          AI System Estimates
        </Text>

        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md}>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              AI Success Rate (%)
            </Text>
            <Input
              type="number"
              value={inputs.aiSuccessRate}
              onChange={(e) => updateField('aiSuccessRate', Number(e.target.value))}
              placeholder="85"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Expected accuracy of AI system
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              AI Cost per Task ($)
            </Text>
            <Input
              type="number"
              step="0.01"
              value={inputs.aiCostPerTask}
              onChange={(e) => updateField('aiCostPerTask', Number(e.target.value))}
              placeholder="0.05"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              Model inference + infrastructure
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Human Review (%)
            </Text>
            <Input
              type="number"
              value={inputs.humanReviewPercent}
              onChange={(e) => updateField('humanReviewPercent', Number(e.target.value))}
              placeholder="20"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              What % of AI outputs need human review?
            </Text>
          </Box>

          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Implementation Cost ($)
            </Text>
            <Input
              type="number"
              value={inputs.implementationCost}
              onChange={(e) => updateField('implementationCost', Number(e.target.value))}
              placeholder="50000"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              One-time setup cost
            </Text>
          </Box>
        </Grid>
      </Card>

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
        Calculate ROI
      </Button>
    </Box>
  );
}
