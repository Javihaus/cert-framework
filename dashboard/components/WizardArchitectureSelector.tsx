'use client';

import { Box, Flex, Text, Grid, Button } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { ArchitectureInputs, ArchitectureRecommendation } from '@/types/wizard';
import { selectArchitecture, getAllArchitectures, calculateMonthlyCost } from '@/lib/architecture-selector';
import { Check, DollarSign, Clock, Code, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useState } from 'react';

interface WizardArchitectureSelectorProps {
  inputs: ArchitectureInputs;
  selectedArchitecture: ArchitectureRecommendation | null;
  onSelect: (architecture: ArchitectureRecommendation) => void;
  onNext: () => void;
}

export default function WizardArchitectureSelector({
  inputs,
  selectedArchitecture,
  onSelect,
  onNext
}: WizardArchitectureSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  const recommendations = selectArchitecture(inputs);
  const allArchitectures = getAllArchitectures();
  const displayedArchitectures = showAll ? allArchitectures : recommendations;

  const getComplexityConfig = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return { color: colors.olive, label: 'Easy Setup', icon: CheckCircle2 };
      case 'medium':
        return { color: colors.cobalt, label: 'Moderate Setup', icon: AlertCircle };
      case 'high':
        return { color: colors.gold, label: 'Complex Setup', icon: Zap };
      default:
        return { color: colors.mist, label: 'Unknown', icon: AlertCircle };
    }
  };

  const ArchitectureCard = ({ arch, isSelected }: { arch: ArchitectureRecommendation; isSelected: boolean }) => {
    const complexityConfig = getComplexityConfig(arch.complexity);
    const ComplexityIcon = complexityConfig.icon;
    const estimatedCost = calculateMonthlyCost(arch, inputs.volumeQueriesPerMonth);

    return (
      <Card
        borderWidth="2px"
        borderColor={isSelected ? colors.cobalt : colors.patience}
        bg={isSelected ? colors.cobalt + '10' : 'white'}
        cursor="pointer"
        onClick={() => onSelect(arch)}
        transition="all 0.2s"
        _hover={{ borderColor: colors.cobalt }}
        position="relative"
      >
        {/* Selection indicator */}
        {isSelected && (
          <Box position="absolute" top={spacing.md} right={spacing.md}>
            <Flex
              w="32px"
              h="32px"
              bg={colors.cobalt}
              borderRadius="full"
              align="center"
              justify="center"
            >
              <Check size={20} color="white" />
            </Flex>
          </Box>
        )}

        {/* Header */}
        <Flex direction="column" mb={spacing.md}>
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
            {arch.name}
          </Text>
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            {arch.description}
          </Text>
        </Flex>

        {/* Complexity & Cost */}
        <Flex gap={spacing.sm} mb={spacing.md}>
          <Flex align="center" gap={spacing.xs} px={spacing.sm} py={spacing.xs} bg={complexityConfig.color + '20'} borderRadius="md">
            <ComplexityIcon size={16} color={complexityConfig.color} />
            <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={complexityConfig.color}>
              {complexityConfig.label}
            </Text>
          </Flex>
          <Flex align="center" gap={spacing.xs} px={spacing.sm} py={spacing.xs} bg={colors.cobalt + '10'} borderRadius="md">
            <DollarSign size={16} color={colors.cobalt} />
            <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={colors.cobalt}>
              ${estimatedCost.toFixed(0)}/mo
            </Text>
          </Flex>
        </Flex>

        {/* Components Breakdown */}
        <Box mb={spacing.md} p={spacing.md} bg={colors.background} borderRadius="md">
          <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
            Tech Stack
          </Text>
          <Flex direction="column" gap={spacing.xs}>
            <Flex justify="space-between">
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>LLM:</Text>
              <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={colors.navy}>
                {arch.components.llm.provider} {arch.components.llm.model}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>Vector DB:</Text>
              <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={colors.navy}>
                {arch.components.vectorDb.name}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>Framework:</Text>
              <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={colors.navy}>
                {arch.components.orchestration.framework}
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Pros & Cons */}
        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md} mb={spacing.md}>
          <Box>
            <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.semibold} color={colors.olive} mb={spacing.xs}>
              Pros
            </Text>
            <Flex direction="column" gap={spacing.xs}>
              {arch.pros.slice(0, 2).map((pro, idx) => (
                <Flex key={idx} align="start" gap={spacing.xs}>
                  <CheckCircle2 size={12} color={colors.olive} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                    {pro}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
          <Box>
            <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.semibold} color={colors.alert} mb={spacing.xs}>
              Cons
            </Text>
            <Flex direction="column" gap={spacing.xs}>
              {arch.cons.slice(0, 2).map((con, idx) => (
                <Flex key={idx} align="start" gap={spacing.xs}>
                  <AlertCircle size={12} color={colors.alert} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                    {con}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        </Grid>

        {/* Code Example Toggle */}
        {isSelected && (
          <Box p={spacing.md} bg={colors.navy} borderRadius="md">
            <Flex align="center" gap={spacing.xs} mb={spacing.sm}>
              <Code size={14} color="white" />
              <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.semibold} color="white">
                Quick Start Example
              </Text>
            </Flex>
            <Box
              as="pre"
              fontSize={typography.fontSize.xs}
              color="white"
              overflow="auto"
              whiteSpace="pre-wrap"
              fontFamily="monospace"
            >
              {arch.codeExample}
            </Box>
          </Box>
        )}
      </Card>
    );
  };

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        Architecture Selection
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        {showAll
          ? 'All available reference architectures. Click any to see details and select.'
          : `Based on your requirements, we recommend these ${recommendations.length} production-proven architectures.`
        }
      </Text>

      {/* Recommendation context */}
      {!showAll && recommendations.length > 0 && (
        <Card mb={spacing.lg} bg={colors.cobalt + '10'} borderColor={colors.cobalt}>
          <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
            Recommendations Based On:
          </Text>
          <Flex direction="column" gap={spacing.xs}>
            <Flex align="center" gap={spacing.xs}>
              <DollarSign size={14} color={colors.cobalt} />
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                Budget: ${inputs.budgetPerMonth}/month
              </Text>
            </Flex>
            <Flex align="center" gap={spacing.xs}>
              <Zap size={14} color={colors.cobalt} />
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                Volume: {inputs.volumeQueriesPerMonth.toLocaleString()} queries/month
              </Text>
            </Flex>
            {inputs.dataResidency !== 'any' && (
              <Flex align="center" gap={spacing.xs}>
                <AlertCircle size={14} color={colors.cobalt} />
                <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                  Data Residency: {inputs.dataResidency.toUpperCase()}
                </Text>
              </Flex>
            )}
            {inputs.teamSkills.length > 0 && (
              <Flex align="center" gap={spacing.xs}>
                <CheckCircle2 size={14} color={colors.cobalt} />
                <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                  Team Skills: {inputs.teamSkills.join(', ')}
                </Text>
              </Flex>
            )}
          </Flex>
        </Card>
      )}

      {/* No recommendations warning */}
      {!showAll && recommendations.length === 0 && (
        <Card mb={spacing.lg} bg={colors.alert + '10'} borderColor={colors.alert}>
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            No architectures match your exact requirements. We've relaxed some constraints below to show available options.
          </Text>
        </Card>
      )}

      {/* Architecture Cards */}
      <Flex direction="column" gap={spacing.md} mb={spacing.lg}>
        {displayedArchitectures.map((arch, idx) => (
          <ArchitectureCard
            key={idx}
            arch={arch}
            isSelected={selectedArchitecture?.name === arch.name}
          />
        ))}
      </Flex>

      {/* Show All / Show Recommended Toggle */}
      {!showAll && recommendations.length < allArchitectures.length && (
        <Button
          onClick={() => setShowAll(true)}
          variant="outline"
          w="100%"
          mb={spacing.md}
          borderColor={colors.patience}
          color={colors.text.secondary}
          _hover={{ borderColor: colors.cobalt, color: colors.cobalt }}
        >
          Browse All {allArchitectures.length} Architectures
        </Button>
      )}

      {showAll && (
        <Button
          onClick={() => setShowAll(false)}
          variant="outline"
          w="100%"
          mb={spacing.md}
          borderColor={colors.patience}
          color={colors.text.secondary}
          _hover={{ borderColor: colors.cobalt, color: colors.cobalt }}
        >
          Show Only Recommended
        </Button>
      )}

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
        disabled={!selectedArchitecture}
      >
        {selectedArchitecture ? 'Continue to Readiness Assessment' : 'Select an Architecture to Continue'}
      </Button>
    </Box>
  );
}
