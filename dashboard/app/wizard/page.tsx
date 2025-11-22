'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WizardState, ROIInputs, RiskInputs, ArchitectureInputs, ArchitectureRecommendation, ReadinessInputs } from '@/types/wizard';
import { calculateROI } from '@/lib/roi-calculator';
import { classifyRisk } from '@/lib/risk-classifier';
import { selectArchitecture } from '@/lib/architecture-selector';
import { assessReadiness } from '@/lib/readiness-assessor';
import WizardROIForm from '@/components/WizardROIForm';
import WizardROIResults from '@/components/WizardROIResults';
import WizardRiskForm from '@/components/WizardRiskForm';
import WizardRiskResults from '@/components/WizardRiskResults';
import WizardArchitectureSelector from '@/components/WizardArchitectureSelector';
import WizardReadinessForm from '@/components/WizardReadinessForm';
import WizardReadinessResults from '@/components/WizardReadinessResults';
import WizardDeploymentPlan from '@/components/WizardDeploymentPlan';

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
        hasLabeledData: false,
        dataQuality: 'medium',
        hasMLExperience: false,
        hasInfrastructure: false,
        teamSize: 0,
        hasExecutiveSupport: false,
        hasChangeManagement: false,
        hasBudgetAllocated: false,
        hasComplianceFramework: false,
        hasSecurityMeasures: false,
        timelineWeeks: 12
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

  const handleReadinessSubmit = () => {
    const outputs = assessReadiness(state.readiness.inputs);
    setState(prev => ({
      ...prev,
      readiness: { ...prev.readiness, outputs, completed: true }
    }));
  };

  const handleReadinessNext = () => {
    setState(prev => ({ ...prev, currentStep: 5 }));
  };

  const handleRestart = () => {
    setState({
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
          hasLabeledData: false,
          dataQuality: 'medium',
          hasMLExperience: false,
          hasInfrastructure: false,
          teamSize: 0,
          hasExecutiveSupport: false,
          hasChangeManagement: false,
          hasBudgetAllocated: false,
          hasComplianceFramework: false,
          hasSecurityMeasures: false,
          timelineWeeks: 12
        },
        outputs: null,
        completed: false
      },
      projectId: null,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-1">
            AI Implementation Wizard
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Data-driven planning for production AI systems
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm',
                      step.id <= state.currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                    )}
                  >
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'text-sm font-semibold',
                      step.id <= state.currentStep
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400'
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {step.description}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-[0_0_40px] mx-1',
                      step.id < state.currentStep
                        ? 'bg-blue-600'
                        : 'bg-zinc-200 dark:bg-zinc-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-8">
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

          {/* Step 4: Readiness Assessment */}
          {state.currentStep === 4 && !state.readiness.completed && (
            <WizardReadinessForm
              inputs={state.readiness.inputs}
              onChange={(inputs: ReadinessInputs) => setState(prev => ({
                ...prev,
                readiness: { ...prev.readiness, inputs }
              }))}
              onSubmit={handleReadinessSubmit}
            />
          )}

          {state.currentStep === 4 && state.readiness.completed && state.readiness.outputs && (
            <WizardReadinessResults
              outputs={state.readiness.outputs}
              onNext={handleReadinessNext}
            />
          )}

          {/* Step 5: Deployment Planning */}
          {state.currentStep === 5 && (
            <WizardDeploymentPlan
              wizardState={state}
              onRestart={handleRestart}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All calculations are performed client-side. Your data never leaves your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
