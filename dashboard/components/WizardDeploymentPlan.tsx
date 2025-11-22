'use client';

import Card from './Card';
import Button from './Button';
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
  const phases = generatePhases(wizardState);
  const summary = generateSummary(wizardState);

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
        Implementation Roadmap
      </h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        Your complete AI implementation plan based on business case, compliance requirements, and organizational readiness
      </p>

      {/* Executive Summary */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-600">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Executive Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-green-600" />
            <div>
              <p className="text-xs text-zinc-500">Expected Annual Savings</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">${summary.annualSavings.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            <div>
              <p className="text-xs text-zinc-500">Total Timeline</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{summary.totalWeeks} weeks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-amber-500" />
            <div>
              <p className="text-xs text-zinc-500">Compliance Level</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{summary.complianceLevel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-red-500" />
            <div>
              <p className="text-xs text-zinc-500">Readiness Score</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{summary.readinessScore}/100</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-md">
          <p className="text-sm text-zinc-500"><strong className="text-zinc-900 dark:text-white">Architecture:</strong> {summary.architecture}</p>
        </div>
      </Card>

      {/* Implementation Phases */}
      <Card className="mb-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Implementation Phases</h3>
        <div className="flex flex-col gap-4">
          {phases.map((phase, idx) => (
            <div key={idx} className={`p-4 rounded-md border-2 ${phase.borderClass} ${phase.bgClass}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <phase.icon size={24} className={phase.iconClass} />
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">Phase {idx + 1}: {phase.name}</span>
                </div>
                <span className="text-sm text-zinc-500">{phase.duration} weeks</span>
              </div>
              <p className="text-sm text-zinc-500 mb-4">{phase.description}</p>
              <div className="flex flex-col gap-1">
                {phase.tasks.map((task, taskIdx) => (
                  <div key={taskIdx} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className={`${phase.iconClass} mt-0.5 flex-shrink-0`} />
                    <span className="text-sm text-zinc-500">{task}</span>
                  </div>
                ))}
              </div>
              {phase.deliverables.length > 0 && (
                <div className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded-md">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">Key Deliverables: </span>
                  <span className="text-xs text-zinc-500">{phase.deliverables.join(' + ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Critical Success Factors */}
      <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-500">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={24} className="text-amber-500" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Critical Success Factors</h3>
        </div>
        <div className="flex flex-col gap-2">
          {summary.criticalFactors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-zinc-800 rounded-md">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-500">{factor}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Rocket size={24} className="text-blue-600" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Immediate Next Steps</h3>
        </div>
        <div className="flex flex-col gap-2">
          {summary.nextSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-lg font-bold text-blue-600">{idx + 1}.</span>
              <span className="text-sm text-zinc-500">{step}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={onRestart} variant="secondary">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <span>Start New Assessment</span>
          </div>
        </Button>
        <Button onClick={() => window.print()} variant="primary">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <span>Print / Export PDF</span>
          </div>
        </Button>
      </div>

      <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-md">
        <p className="text-xs text-zinc-500 text-center">
          This implementation plan is generated based on your inputs and industry best practices.
          Actual timelines, costs, and requirements may vary.
        </p>
      </div>
    </div>
  );
}

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
  if (state.readiness.outputs) {
    if (state.readiness.outputs.overallScore < 70) factors.push('Address organizational gaps before full implementation');
    if (state.readiness.outputs.riskFactors.length > 0) factors.push('Mitigate identified risk factors to prevent project delays');
  }
  if (state.risk.outputs) {
    if (state.risk.outputs.classification === 'high-risk') factors.push('EU AI Act compliance is mandatory - budget for audit and documentation');
    if (state.risk.outputs.classification === 'prohibited') factors.push('Current use case is prohibited under EU AI Act - redesign required');
  }
  if (state.roi.outputs) {
    if (state.roi.outputs.breakEvenMonths > 12) factors.push('Long payback period - secure multi-year budget commitment');
    if (state.roi.outputs.confidenceLevel === 'low') factors.push('Start with pilot to validate ROI assumptions before scaling');
  }
  factors.push('Establish clear success metrics and monitoring from day one');
  factors.push('Plan for iterative improvement - initial deployment is just the beginning');
  return factors;
}

function generateNextSteps(state: WizardState): string[] {
  const steps: string[] = [];
  if (state.readiness.outputs && state.readiness.outputs.overallScore < 40) {
    steps.push('Secure executive sponsorship and formal budget allocation');
    steps.push('Develop data strategy and governance framework');
    steps.push('Hire or contract AI/ML technical expertise');
  } else {
    steps.push('Form project team with clear roles and responsibilities');
    steps.push('Set up development environment with chosen architecture');
  }
  if (state.risk.outputs && state.risk.outputs.classification === 'high-risk') {
    steps.push('Engage legal counsel to establish EU AI Act compliance program');
    steps.push('Begin documentation of AI system design and risk management');
  }
  if (state.architecture.selected) {
    steps.push(`Provision ${state.architecture.selected.name} infrastructure and accounts`);
    steps.push('Create proof-of-concept with sample data to validate approach');
  }
  steps.push('Define success metrics and monitoring strategy');
  steps.push('Create user acceptance testing plan and criteria');
  return steps.slice(0, 6);
}

interface Phase {
  name: string;
  description: string;
  duration: number;
  tasks: string[];
  deliverables: string[];
  icon: any;
  iconClass: string;
  borderClass: string;
  bgClass: string;
}

function generatePhases(state: WizardState): Phase[] {
  const phases: Phase[] = [];
  const needsPreparation = state.readiness.outputs && state.readiness.outputs.gaps.length > 3;

  if (needsPreparation) {
    phases.push({
      name: 'Preparation & Foundation',
      description: 'Address organizational gaps and establish foundational capabilities',
      duration: Math.ceil((state.readiness.outputs?.estimatedTimelineWeeks || 12) * 0.3),
      tasks: ['Secure executive sponsorship and budget approval', 'Establish data governance framework', 'Hire required technical expertise', 'Set up compliance framework', 'Implement security measures'],
      deliverables: ['Data governance framework', 'Compliance program', 'Technical team'],
      icon: Users,
      iconClass: 'text-red-500',
      borderClass: 'border-red-500',
      bgClass: 'bg-red-50 dark:bg-red-900/20'
    });
  }

  phases.push({
    name: 'Planning & Architecture',
    description: 'Detailed design and technical planning based on chosen architecture',
    duration: 3,
    tasks: [`Provision ${state.architecture.selected?.name || 'selected architecture'} infrastructure`, 'Design data pipelines and model architecture', 'Create detailed project timeline', 'Define success metrics and KPIs', 'Establish monitoring strategy'],
    deliverables: ['Technical architecture document', 'Project plan', 'Success criteria'],
    icon: Code,
    iconClass: 'text-blue-600',
    borderClass: 'border-blue-600',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20'
  });

  const devDuration = state.readiness.outputs ? Math.ceil((state.readiness.outputs.estimatedTimelineWeeks || 12) * 0.4) : 6;
  phases.push({
    name: 'Development & Testing',
    description: 'Build, train, and validate the AI system',
    duration: devDuration,
    tasks: ['Prepare and label training data', 'Implement data processing pipelines', 'Develop and train AI models', 'Build integration with existing systems', 'Conduct testing and validation', 'Perform security audits'],
    deliverables: ['Trained models', 'Integration code', 'Test reports', 'Security audit'],
    icon: Code,
    iconClass: 'text-green-600',
    borderClass: 'border-green-600',
    bgClass: 'bg-green-50 dark:bg-green-900/20'
  });

  if (state.risk.outputs && state.risk.outputs.classification === 'high-risk') {
    phases.push({
      name: 'Compliance & Documentation',
      description: 'EU AI Act compliance requirements and documentation',
      duration: 4,
      tasks: state.risk.outputs.complianceRequirements || [],
      deliverables: ['Technical documentation', 'Risk assessment report', 'Conformity assessment'],
      icon: Shield,
      iconClass: 'text-amber-500',
      borderClass: 'border-amber-500',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20'
    });
  }

  phases.push({
    name: 'Deployment & Launch',
    description: 'Production deployment and user rollout',
    duration: 2,
    tasks: ['Deploy to production environment', 'Conduct user training and onboarding', 'Implement monitoring and alerting', 'Gradual rollout to users', 'Establish support procedures'],
    deliverables: ['Production system', 'User documentation', 'Monitoring dashboards'],
    icon: Rocket,
    iconClass: 'text-blue-600',
    borderClass: 'border-blue-600',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20'
  });

  phases.push({
    name: 'Monitor & Optimize',
    description: 'Ongoing monitoring, improvement, and maintenance',
    duration: 0,
    tasks: ['Monitor performance metrics and KPIs', 'Collect user feedback and iterate', 'Retrain models with new data', 'Optimize costs and performance', 'Maintain compliance documentation'],
    deliverables: ['Performance reports', 'Model updates', 'Cost optimization'],
    icon: FileText,
    iconClass: 'text-green-600',
    borderClass: 'border-green-600',
    bgClass: 'bg-green-50 dark:bg-green-900/20'
  });

  return phases;
}
