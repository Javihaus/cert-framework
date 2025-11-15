'use client';

import { Box, Flex, Text, Grid, Button, Input } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { RiskInputs } from '@/types/wizard';
import { AlertTriangle, Shield, Scale, Users } from 'lucide-react';

interface WizardRiskFormProps {
  inputs: RiskInputs;
  onChange: (inputs: RiskInputs) => void;
  onSubmit: () => void;
}

export default function WizardRiskForm({ inputs, onChange, onSubmit }: WizardRiskFormProps) {
  const updateCheckbox = (field: keyof RiskInputs, value: boolean) => {
    onChange({ ...inputs, [field]: value });
  };

  const updateNumber = (field: keyof RiskInputs, value: number) => {
    onChange({ ...inputs, [field]: value });
  };

  const CheckboxField = ({
    field,
    label,
    description
  }: {
    field: keyof RiskInputs;
    label: string;
    description: string;
  }) => (
    <Flex
      align="start"
      gap={spacing.sm}
      p={spacing.md}
      borderRadius="md"
      border="1px solid"
      borderColor={inputs[field as keyof RiskInputs] ? colors.cobalt : colors.patience}
      bg={inputs[field as keyof RiskInputs] ? colors.cobalt + '10' : 'white'}
      cursor="pointer"
      onClick={() => updateCheckbox(field, !inputs[field as keyof RiskInputs])}
      transition="all 0.2s"
      _hover={{ borderColor: colors.cobalt }}
    >
      <Box
        w="20px"
        h="20px"
        border="2px solid"
        borderColor={inputs[field as keyof RiskInputs] ? colors.cobalt : colors.patience}
        borderRadius="4px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={inputs[field as keyof RiskInputs] ? colors.cobalt : 'white'}
        flexShrink={0}
        mt="2px"
      >
        {inputs[field as keyof RiskInputs] && (
          <Box w="10px" h="10px" bg="white" />
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

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        EU AI Act Risk Assessment
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Answer these questions to determine your AI system's risk classification under the EU AI Act
      </Text>

      {/* Prohibited Uses (Article 5) */}
      <Card mb={spacing.lg} bg={colors.alert + '10'} borderColor={colors.alert}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <AlertTriangle size={24} color={colors.alert} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
            Prohibited Uses (Article 5)
          </Text>
        </Flex>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
          These AI systems are banned under EU AI Act. If any apply, your system cannot be deployed.
        </Text>
        <Flex direction="column" gap={spacing.sm}>
          <CheckboxField
            field="biometricIdentification"
            label="Real-time biometric identification in public spaces"
            description="Remote biometric identification systems in publicly accessible spaces for law enforcement (exceptions exist for specific cases)"
          />
          <CheckboxField
            field="socialScoring"
            label="Social scoring by public authorities"
            description="AI systems that evaluate or classify people based on behavior, socio-economic status, or personal characteristics"
          />
          <CheckboxField
            field="manipulativeTechniques"
            label="Manipulative or deceptive techniques"
            description="AI that manipulates human behavior through subliminal techniques beyond a person's consciousness"
          />
          <CheckboxField
            field="exploitVulnerabilities"
            label="Exploitation of vulnerabilities"
            description="AI that exploits vulnerabilities of specific groups (children, persons with disabilities, etc.)"
          />
        </Flex>
      </Card>

      {/* High-Risk Systems (Annex III) */}
      <Card mb={spacing.lg} bg={colors.gold + '10'} borderColor={colors.gold}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Shield size={24} color={colors.gold} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
            High-Risk Systems (Annex III)
          </Text>
        </Flex>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
          These systems face significant compliance requirements under the EU AI Act.
        </Text>
        <Flex direction="column" gap={spacing.sm}>
          <CheckboxField
            field="criticalInfrastructure"
            label="Critical infrastructure safety component"
            description="AI used as safety component in critical infrastructure (energy, water, gas, heating, transport)"
          />
          <CheckboxField
            field="educationAccess"
            label="Education or vocational training access"
            description="Determines access to or admission to educational institutions or assessment of students"
          />
          <CheckboxField
            field="employmentDecisions"
            label="Employment and worker management"
            description="Recruitment, hiring, evaluation, promotion, termination, or task allocation decisions"
          />
          <CheckboxField
            field="essentialServicesAccess"
            label="Essential private/public services"
            description="Credit scoring, insurance pricing, eligibility for public assistance benefits"
          />
          <CheckboxField
            field="lawEnforcement"
            label="Law enforcement applications"
            description="Individual risk assessment, polygraph analysis, crime analytics, deep fake detection"
          />
          <CheckboxField
            field="migrationAsylumBorder"
            label="Migration, asylum, border control"
            description="Risk assessment, verification of travel documents, complaint processing"
          />
          <CheckboxField
            field="justiceAdministration"
            label="Administration of justice"
            description="Assisting judicial authorities in researching and interpreting facts and law"
          />
          <CheckboxField
            field="democraticProcesses"
            label="Democratic processes"
            description="AI that may influence electoral processes, voting behavior, or democratic outcomes"
          />
        </Flex>
      </Card>

      {/* Volume and Impact */}
      <Card mb={spacing.xl} bg={colors.cobalt + '10'} borderColor={colors.cobalt}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Users size={24} color={colors.cobalt} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
            Scale and Impact
          </Text>
        </Flex>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
          Volume thresholds help determine limited-risk classification.
        </Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md}>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Decisions per Year
            </Text>
            <Input
              type="number"
              value={inputs.decisionsPerYear}
              onChange={(e) => updateNumber('decisionsPerYear', Number(e.target.value))}
              placeholder="10000"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              How many decisions does the system make annually?
            </Text>
          </Box>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.navy} mb={spacing.xs}>
              Affected Individuals
            </Text>
            <Input
              type="number"
              value={inputs.affectedIndividuals}
              onChange={(e) => updateNumber('affectedIndividuals', Number(e.target.value))}
              placeholder="5000"
              bg="white"
            />
            <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} mt={spacing.xs}>
              How many people are affected by these decisions?
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
        Classify Risk Level
      </Button>
    </Box>
  );
}
