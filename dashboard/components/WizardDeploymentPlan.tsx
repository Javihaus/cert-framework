'use client';

import { Box, Flex, Text, Grid, Button } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { WizardState } from '@/types/wizard';
import { CheckCircle2, Calendar, DollarSign, Shield, Code, Rocket, FileText, Users, AlertTriangle } from 'lucide-react';

interface WizardDeploymentPlanProps {
  wizardState: WizardState;
  onRestart: () => void;
}

export default function WizardDeploymentPlan({
  wizardState,
  onRestart
}: WizardDeploymentPlanProps) {
  // Generate phase-based roadmap
  const phases = generatePhases(wizardState);
  const summary = generateSummary(wizardState);

  return (
    <Box>
      <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
        Implementation Roadmap
      </Text>
      <Text fontSize={typography.fontSize.base} color={colors.text.secondary} mb={spacing.xl}>
        Your complete AI implementation plan based on business case, compliance requirements, and organizational readiness
      </Text>

      {/* Executive Summary */}
      <Card mb={spacing.lg} bg={colors.cobalt + '10'} borderColor={colors.cobalt}>
        <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.md}>
          Executive Summary
        </Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md}>
          <Flex align="center" gap={spacing.sm}>
            <DollarSign size={20} color={colors.olive} />
            <Box>
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>Expected Annual Savings</Text>
              <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                ${summary.annualSavings.toLocaleString()}
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap={spacing.sm}>
            <Calendar size={20} color={colors.cobalt} />
            <Box>
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>Total Timeline</Text>
              <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                {summary.totalWeeks} weeks
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap={spacing.sm}>
            <Shield size={20} color={colors.gold} />
            <Box>
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>Compliance Level</Text>
              <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                {summary.complianceLevel}
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap={spacing.sm}>
            <Users size={20} color={colors.alert} />
            <Box>
              <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>Readiness Score</Text>
              <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                {summary.readinessScore}/100
              </Text>
            </Box>
          </Flex>
        </Grid>

        <Box mt={spacing.md} p={spacing.md} bg="white" borderRadius="md">
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            <strong>Architecture:</strong> {summary.architecture}
          </Text>
        </Box>
      </Card>

      {/* Implementation Phases */}
      <Card mb={spacing.lg}>
        <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.md}>
          Implementation Phases
        </Text>
        <Flex direction="column" gap={spacing.md}>
          {phases.map((phase, idx) => (
            <Box
              key={idx}
              p={spacing.md}
              borderRadius="md"
              borderWidth="2px"
              borderColor={phase.color}
              bg={phase.color + '10'}
            >
              <Flex align="center" justify="space-between" mb={spacing.sm}>
                <Flex align="center" gap={spacing.sm}>
                  <phase.icon size={24} color={phase.color} />
                  <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                    Phase {idx + 1}: {phase.name}
                  </Text>
                </Flex>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  {phase.duration} weeks
                </Text>
              </Flex>

              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
                {phase.description}
              </Text>

              <Flex direction="column" gap={spacing.xs}>
                {phase.tasks.map((task, taskIdx) => (
                  <Flex key={taskIdx} align="start" gap={spacing.sm}>
                    <CheckCircle2 size={16} color={phase.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                      {task}
                    </Text>
                  </Flex>
                ))}
              </Flex>

              {phase.deliverables.length > 0 && (
                <Box mt={spacing.sm} p={spacing.sm} bg="white" borderRadius="md">
                  <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
                    Key Deliverables:
                  </Text>
                  <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                    {phase.deliverables.join(' • ')}
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </Flex>
      </Card>

      {/* Critical Success Factors */}
      <Card mb={spacing.lg} bg={colors.gold + '10'} borderColor={colors.gold}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <AlertTriangle size={24} color={colors.gold} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Critical Success Factors
          </Text>
        </Flex>
        <Flex direction="column" gap={spacing.sm}>
          {summary.criticalFactors.map((factor, idx) => (
            <Flex key={idx} align="start" gap={spacing.sm} p={spacing.sm} bg="white" borderRadius="md">
              <AlertTriangle size={16} color={colors.gold} style={{ marginTop: '2px', flexShrink: 0 }} />
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                {factor}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Next Steps */}
      <Card mb={spacing.lg}>
        <Flex align="center" gap={spacing.sm} mb={spacing.md}>
          <Rocket size={24} color={colors.cobalt} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.bold} color={colors.navy}>
            Immediate Next Steps
          </Text>
        </Flex>
        <Flex direction="column" gap={spacing.sm}>
          {summary.nextSteps.map((step, idx) => (
            <Flex key={idx} align="start" gap={spacing.sm}>
              <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.bold} color={colors.cobalt}>
                {idx + 1}.
              </Text>
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                {step}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Card>

      {/* Actions */}
      <Grid templateColumns="repeat(2, 1fr)" gap={spacing.md}>
        <Button
          onClick={onRestart}
          variant="outline"
          borderColor={colors.patience}
          color={colors.text.secondary}
          py={spacing.lg}
          fontSize={typography.fontSize.base}
          _hover={{ borderColor: colors.cobalt, color: colors.cobalt }}
        >
          <Flex align="center" gap={spacing.sm}>
            <FileText size={20} />
            <Text>Start New Assessment</Text>
          </Flex>
        </Button>

        <Button
          onClick={() => window.print()}
          bg={colors.cobalt}
          color="white"
          py={spacing.lg}
          fontSize={typography.fontSize.base}
          _hover={{ bg: colors.navy }}
        >
          <Flex align="center" gap={spacing.sm}>
            <FileText size={20} />
            <Text>Print / Export PDF</Text>
          </Flex>
        </Button>
      </Grid>

      {/* Disclaimer */}
      <Box mt={spacing.lg} p={spacing.md} bg={colors.background} borderRadius="md">
        <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} textAlign="center">
          This implementation plan is generated based on your inputs and industry best practices.
          Actual timelines, costs, and requirements may vary. Consult with legal and technical experts
          before making final implementation decisions.
        </Text>
      </Box>
    </Box>
  );
}

// Helper functions

function generateSummary(state: WizardState) {
  return {
    annualSavings: state.roi.outputs?.annualSavings || 0,
    totalWeeks: state.readiness.outputs?.estimatedTimelineWeeks || 12,
    complianceLevel: state.risk.outputs?.classification || 'Unknown',
    readinessScore: state.readiness.outputs?.overallScore || 0,
    architecture: state.architecture.selected?.name || 'Not selected',
    criticalFactors: generateCriticalFactors(state),
    nextSteps: generateNextSteps(state)
  };
}

function generateCriticalFactors(state: WizardState): string[] {
  const factors: string[] = [];

  // From readiness assessment
  if (state.readiness.outputs) {
    if (state.readiness.outputs.overallScore < 70) {
      factors.push('Address organizational gaps before full implementation');
    }
    if (state.readiness.outputs.riskFactors.length > 0) {
      factors.push('Mitigate identified risk factors to prevent project delays');
    }
  }

  // From risk assessment
  if (state.risk.outputs) {
    if (state.risk.outputs.classification === 'high-risk') {
      factors.push('EU AI Act compliance is mandatory - budget for audit and documentation');
    }
    if (state.risk.outputs.classification === 'prohibited') {
      factors.push('Current use case is prohibited under EU AI Act - redesign required');
    }
  }

  // From ROI
  if (state.roi.outputs) {
    if (state.roi.outputs.breakEvenMonths > 12) {
      factors.push('Long payback period - secure multi-year budget commitment');
    }
    if (state.roi.outputs.confidenceLevel === 'low') {
      factors.push('Start with pilot to validate ROI assumptions before scaling');
    }
  }

  // General best practices
  factors.push('Establish clear success metrics and monitoring from day one');
  factors.push('Plan for iterative improvement - initial deployment is just the beginning');

  return factors;
}

function generateNextSteps(state: WizardState): string[] {
  const steps: string[] = [];

  // Prioritize based on readiness
  if (state.readiness.outputs && state.readiness.outputs.overallScore < 40) {
    steps.push('Secure executive sponsorship and formal budget allocation');
    steps.push('Develop data strategy and governance framework');
    steps.push('Hire or contract AI/ML technical expertise');
  } else {
    steps.push('Form project team with clear roles and responsibilities');
    steps.push('Set up development environment with chosen architecture');
  }

  // Compliance requirements
  if (state.risk.outputs && state.risk.outputs.classification === 'high-risk') {
    steps.push('Engage legal counsel to establish EU AI Act compliance program');
    steps.push('Begin documentation of AI system design and risk management');
  }

  // Technical setup
  if (state.architecture.selected) {
    steps.push(`Provision ${state.architecture.selected.name} infrastructure and accounts`);
    steps.push('Create proof-of-concept with sample data to validate approach');
  }

  // General
  steps.push('Define success metrics and monitoring strategy');
  steps.push('Create user acceptance testing plan and criteria');

  return steps.slice(0, 6); // Limit to 6 most important
}

interface Phase {
  name: string;
  description: string;
  duration: number;
  tasks: string[];
  deliverables: string[];
  icon: any;
  color: string;
}

function generatePhases(state: WizardState): Phase[] {
  const phases: Phase[] = [];

  // Determine if preparation phase is needed
  const needsPreparation = state.readiness.outputs && state.readiness.outputs.gaps.length > 3;

  if (needsPreparation) {
    phases.push({
      name: 'Preparation & Foundation',
      description: 'Address organizational gaps and establish foundational capabilities',
      duration: Math.ceil((state.readiness.outputs?.estimatedTimelineWeeks || 12) * 0.3),
      tasks: [
        'Secure executive sponsorship and budget approval',
        'Establish data governance framework and policies',
        'Hire or contract required technical expertise',
        'Set up compliance and audit framework',
        'Implement security and privacy measures'
      ],
      deliverables: ['Data governance framework', 'Compliance program', 'Technical team in place'],
      icon: Users,
      color: colors.alert
    });
  }

  // Planning & Design
  phases.push({
    name: 'Planning & Architecture',
    description: 'Detailed design and technical planning based on chosen architecture',
    duration: 3,
    tasks: [
      `Provision ${state.architecture.selected?.name || 'selected architecture'} infrastructure`,
      'Design data pipelines and model architecture',
      'Create detailed project timeline and milestones',
      'Define success metrics and KPIs',
      'Establish monitoring and observability strategy'
    ],
    deliverables: ['Technical architecture document', 'Project plan', 'Success criteria'],
    icon: Code,
    color: colors.cobalt
  });

  // Development & Testing
  const devDuration = state.readiness.outputs ?
    Math.ceil((state.readiness.outputs.estimatedTimelineWeeks || 12) * 0.4) : 6;

  phases.push({
    name: 'Development & Testing',
    description: 'Build, train, and validate the AI system',
    duration: devDuration,
    tasks: [
      'Prepare and label training data',
      'Implement data processing pipelines',
      'Develop and train AI models',
      'Build integration with existing systems',
      'Conduct thorough testing and validation',
      'Perform security and compliance audits'
    ],
    deliverables: ['Trained models', 'Integration code', 'Test reports', 'Security audit'],
    icon: Code,
    color: colors.olive
  });

  // Compliance (if high-risk)
  if (state.risk.outputs && state.risk.outputs.classification === 'high-risk') {
    phases.push({
      name: 'Compliance & Documentation',
      description: 'EU AI Act compliance requirements and documentation',
      duration: 4,
      tasks: state.risk.outputs.complianceRequirements || [],
      deliverables: ['Technical documentation', 'Risk assessment report', 'Conformity assessment'],
      icon: Shield,
      color: colors.gold
    });
  }

  // Deployment
  phases.push({
    name: 'Deployment & Launch',
    description: 'Production deployment and user rollout',
    duration: 2,
    tasks: [
      'Deploy to production environment',
      'Conduct user training and onboarding',
      'Implement monitoring and alerting',
      'Gradual rollout to users (pilot → full)',
      'Establish support and incident response procedures'
    ],
    deliverables: ['Production system', 'User documentation', 'Monitoring dashboards'],
    icon: Rocket,
    color: colors.cobalt
  });

  // Optimization
  phases.push({
    name: 'Monitor & Optimize',
    description: 'Ongoing monitoring, improvement, and maintenance',
    duration: 0, // Ongoing
    tasks: [
      'Monitor performance metrics and KPIs',
      'Collect user feedback and iterate',
      'Retrain models with new data',
      'Optimize costs and performance',
      'Maintain compliance documentation'
    ],
    deliverables: ['Performance reports', 'Model updates', 'Cost optimization'],
    icon: FileText,
    color: colors.olive
  });

  return phases;
}
