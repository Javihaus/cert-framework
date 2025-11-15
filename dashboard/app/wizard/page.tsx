'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { colors, spacing, typography } from '@/theme';
import { WizardState, ROIInputs, RiskInputs, ArchitectureInputs, ArchitectureRecommendation } from '@/types/wizard';
import { calculateROI } from '@/lib/roi-calculator';
import { classifyRisk } from '@/lib/risk-classifier';
import { selectArchitecture } from '@/lib/architecture-selector';
import WizardROIForm from '@/components/WizardROIForm';
import WizardROIResults from '@/components/WizardROIResults';
import WizardRiskForm from '@/components/WizardRiskForm';
import WizardRiskResults from '@/components/WizardRiskResults';
import WizardArchitectureSelector from '@/components/WizardArchitectureSelector';

const STEPS = [
  { id: 1, name: 'ROI', description: 'Calculate business case' },
  { id: 2, name: 'Risk', description: 'EU AI Act compliance' },
  { id: 3, name: 'Architecture', description: 'Tech stack selection' },
  { id: 4, name: 'Readiness', description: 'Team & org assessment' },
  { id: 5, name: 'Deploy', description: 'Implementation plan' },
];

export default function WizardPage() {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    roi: {
      inputs: {
        tasksPerMonth: 1000,
        minutesPerTask: 15,
        laborCostPerHour: 25,
        errorRate: 5,
        errorCostPerIncident: 100,
        aiSuccessRate: 85,
        aiCostPerTask: 0.05,
        humanReviewPercent: 20,
        implementationCost: 50000
      },
      outputs: null,
      completed: false
    },
    risk: {
      inputs: {
        biometricIdentification: false,
        socialScoring: false,
        manipulativeTechniques: false,
        exploitVulnerabilities: false,
        criticalInfrastructure: false,
        educationAccess: false,
        employmentDecisions: false,
        essentialServicesAccess: false,
        lawEnforcement: false,
        migrationAsylumBorder: false,
        justiceAdministration: false,
        democraticProcesses: false,
        decisionsPerYear: 0,
        affectedIndividuals: 0
      },
      outputs: null,
      completed: false
    },
    architecture: {
      inputs: {
        useCase: '',
        volumeQueriesPerMonth: 0,
        latencyRequirementMs: 0,
        dataResidency: 'any',
        budgetPerMonth: 0,
        teamSkills: []
      },
      recommendations: [],
      selected: null,
      completed: false
    },
    readiness: {
      inputs: {
        hasDataStrategy: false,
        hasMLExperience: false,
        hasInfrastructure: false,
        hasComplianceFramework: false,
        teamSize: 0,
        timelineWeeks: 0
      },
      outputs: null,
      completed: false
    },
    projectId: null,
    createdAt: new Date().toISOString()
  });

  const handleROISubmit = () => {
    const outputs = calculateROI(state.roi.inputs);
    setState(prev => ({
      ...prev,
      roi: { ...prev.roi, outputs, completed: true }
    }));
  };

  const handleROINext = () => {
    setState(prev => ({ ...prev, currentStep: 2 }));
  };

  const handleRiskSubmit = () => {
    const outputs = classifyRisk(state.risk.inputs);
    setState(prev => ({
      ...prev,
      risk: { ...prev.risk, outputs, completed: true }
    }));
  };

  const handleRiskNext = () => {
    // Populate architecture inputs from previous steps
    const volumeFromROI = state.roi.inputs.tasksPerMonth;
    const budgetFromROI = state.roi.outputs?.aiMonthlyCost || 500;

    setState(prev => ({
      ...prev,
      currentStep: 3,
      architecture: {
        ...prev.architecture,
        inputs: {
          ...prev.architecture.inputs,
          volumeQueriesPerMonth: volumeFromROI,
          budgetPerMonth: budgetFromROI * 1.2 // Allow 20% buffer
        },
        recommendations: selectArchitecture({
          ...prev.architecture.inputs,
          volumeQueriesPerMonth: volumeFromROI,
          budgetPerMonth: budgetFromROI * 1.2
        })
      }
    }));
  };

  const handleArchitectureSelect = (architecture: ArchitectureRecommendation) => {
    setState(prev => ({
      ...prev,
      architecture: { ...prev.architecture, selected: architecture }
    }));
  };

  const handleArchitectureNext = () => {
    setState(prev => ({
      ...prev,
      currentStep: 4,
      architecture: { ...prev.architecture, completed: true }
    }));
  };

  return (
    <Box minH="100vh" bg={colors.background} py={spacing.xl}>
      <Box maxW="1200px" mx="auto" px={spacing.lg}>
        {/* Header */}
        <Box mb={spacing.xl} textAlign="center">
          <Text fontSize={typography.fontSize['4xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
            AI Implementation Wizard
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            Data-driven planning for production AI systems
          </Text>
        </Box>

        {/* Progress Indicator */}
        <Box mb={spacing.xl}>
          <Flex justify="space-between" mb={spacing.sm}>
            {STEPS.map((step, idx) => (
              <Flex key={step.id} align="center" flex={1}>
                <Flex align="center" gap={spacing.sm} flex={1}>
                  <Flex
                    align="center"
                    justify="center"
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    bg={step.id <= state.currentStep ? colors.cobalt : colors.patience}
                    color={step.id <= state.currentStep ? 'white' : colors.text.secondary}
                    fontWeight={typography.fontWeight.semibold}
                    fontSize={typography.fontSize.sm}
                  >
                    {step.id}
                  </Flex>
                  <Box flex={1}>
                    <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={step.id <= state.currentStep ? colors.navy : colors.text.secondary}>
                      {step.name}
                    </Text>
                    <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                      {step.description}
                    </Text>
                  </Box>
                </Flex>
                {idx < STEPS.length - 1 && (
                  <Box
                    h="2px"
                    flex="0 0 40px"
                    bg={step.id < state.currentStep ? colors.cobalt : colors.patience}
                    mx={spacing.xs}
                  />
                )}
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* Step Content */}
        <Box bg="white" borderRadius="lg" boxShadow="0 2px 8px rgba(0,0,0,0.1)" p={spacing.xl}>
          {/* Step 1: ROI Calculator */}
          {state.currentStep === 1 && !state.roi.completed && (
            <WizardROIForm
              inputs={state.roi.inputs}
              onChange={(inputs: ROIInputs) => setState(prev => ({
                ...prev,
                roi: { ...prev.roi, inputs }
              }))}
              onSubmit={handleROISubmit}
            />
          )}

          {state.currentStep === 1 && state.roi.completed && state.roi.outputs && (
            <WizardROIResults
              outputs={state.roi.outputs}
              onNext={handleROINext}
            />
          )}

          {/* Step 2: Risk Assessment */}
          {state.currentStep === 2 && !state.risk.completed && (
            <WizardRiskForm
              inputs={state.risk.inputs}
              onChange={(inputs: RiskInputs) => setState(prev => ({
                ...prev,
                risk: { ...prev.risk, inputs }
              }))}
              onSubmit={handleRiskSubmit}
            />
          )}

          {state.currentStep === 2 && state.risk.completed && state.risk.outputs && (
            <WizardRiskResults
              outputs={state.risk.outputs}
              onNext={handleRiskNext}
            />
          )}

          {/* Step 3: Architecture Selection */}
          {state.currentStep === 3 && (
            <WizardArchitectureSelector
              inputs={state.architecture.inputs}
              selectedArchitecture={state.architecture.selected}
              onSelect={handleArchitectureSelect}
              onNext={handleArchitectureNext}
            />
          )}

          {/* Placeholder for remaining steps */}
          {state.currentStep > 3 && (
            <Box textAlign="center" py={spacing.xl}>
              <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.md}>
                Step {state.currentStep} (Coming Soon)
              </Text>
              <Text fontSize={typography.fontSize.base} color={colors.text.secondary}>
                Readiness Assessment and Deployment Planning steps will be implemented in future phases.
              </Text>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box mt={spacing.lg} textAlign="center">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            All calculations are performed client-side. Your data never leaves your browser.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
