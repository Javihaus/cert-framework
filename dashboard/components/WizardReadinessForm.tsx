'use client';

import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';
import { ReadinessInputs } from '@/types/wizard';
import { LuCircleCheckBig, LuCircle, LuDatabase, LuCode, LuUsers, LuShield } from 'react-icons/lu';

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
      <div
        className={cn(
          'p-4 rounded-md border-2 cursor-pointer transition-all flex gap-2 hover:border-blue-600',
          isChecked
            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
        )}
        onClick={() => updateCheckbox(field, !isChecked)}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isChecked ? (
            <LuCircleCheckBig size={20} className="text-blue-600" />
          ) : (
            <LuCircle size={20} className="text-zinc-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            {label}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
        Readiness Assessment
      </h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        Evaluate your organization's preparedness for AI implementation across data, technical, organizational, and compliance dimensions.
      </p>

      {/* Data Readiness */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-600">
        <div className="flex items-center gap-2 mb-4">
          <LuDatabase size={24} className="text-blue-600" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            Data Readiness
          </h3>
        </div>

        <div className="flex flex-col gap-2">
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

          <div className="p-4 rounded-md border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Data Quality Level
            </p>
            <select
              value={inputs.dataQuality}
              onChange={(e) => updateField('dataQuality', e.target.value)}
              className="w-full px-3 py-2 rounded-md border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm cursor-pointer"
            >
              <option value="high">High - Clean, consistent, well-documented</option>
              <option value="medium">Medium - Mostly clean with some gaps</option>
              <option value="low">Low - Significant quality issues</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Technical Readiness */}
      <Card className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-600">
        <div className="flex items-center gap-2 mb-4">
          <LuCode size={24} className="text-green-600" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            Technical Readiness
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          <CheckboxField
            field="hasMLExperience"
            label="ML/AI Experience"
            description="Team has successfully delivered ML/AI projects in production"
          />

          <CheckboxField
            field="hasInfrastructure"
            label="LuCloud Infrastructure"
            description="LuCloud infrastructure (AWS/Azure/GCP) set up for AI workloads"
          />

          <div className="p-4 rounded-md border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Team Size (technical staff)
            </p>
            <input
              type="number"
              value={inputs.teamSize}
              onChange={(e) => updateField('teamSize', Number(e.target.value))}
              placeholder="Number of engineers/data scientists"
              min={0}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Include engineers, data scientists, ML specialists working on this project
            </p>
          </div>
        </div>
      </Card>

      {/* Organizational Readiness */}
      <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-500">
        <div className="flex items-center gap-2 mb-4">
          <LuUsers size={24} className="text-amber-500" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            Organizational Readiness
          </h3>
        </div>

        <div className="flex flex-col gap-2">
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
        </div>
      </Card>

      {/* Compliance Readiness */}
      <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-500">
        <div className="flex items-center gap-2 mb-4">
          <LuShield size={24} className="text-red-500" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            Compliance & Security Readiness
          </h3>
        </div>

        <div className="flex flex-col gap-2">
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
        </div>
      </Card>

      {/* Timeline Estimate */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
          Expected Timeline
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          How many weeks do you estimate for implementation?
        </p>
        <input
          type="number"
          value={inputs.timelineWeeks}
          onChange={(e) => updateField('timelineWeeks', Number(e.target.value))}
          placeholder="Weeks"
          min={1}
          className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Include planning, development, testing, and deployment phases
        </p>
      </Card>

      {/* Submit Button */}
      <Button onClick={onSubmit} variant="primary" fullWidth size="lg">
        Assess Readiness
      </Button>
    </div>
  );
}
