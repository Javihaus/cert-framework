'use client';

import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';
import { RiskInputs } from '@/types/wizard';
import { LuTriangleAlert, LuShield, LuUsers } from 'react-icons/lu';

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
  }) => {
    const isChecked = inputs[field as keyof RiskInputs] as boolean;

    return (
      <div
        className={cn(
          'flex items-start gap-2 p-4 rounded-md border cursor-pointer transition-all hover:border-blue-600',
          isChecked
            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
        )}
        onClick={() => updateCheckbox(field, !isChecked)}
      >
        <div
          className={cn(
            'w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mt-0.5',
            isChecked
              ? 'border-blue-600 bg-blue-600'
              : 'border-zinc-400 bg-white dark:bg-zinc-800'
          )}
        >
          {isChecked && (
            <div className="w-2.5 h-2.5 bg-white" />
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
        EU AI Act Risk Assessment
      </h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        Answer these questions to determine your AI system's risk classification under the EU AI Act
      </p>

      {/* Prohibited Uses (Article 5) */}
      <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-500">
        <div className="flex items-center gap-2 mb-4">
          <LuTriangleAlert size={24} className="text-red-500" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Prohibited Uses (Article 5)
          </h3>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          These AI systems are banned under EU AI Act. If any apply, your system cannot be deployed.
        </p>
        <div className="flex flex-col gap-2">
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
        </div>
      </Card>

      {/* High-Risk Systems (Annex III) */}
      <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-500">
        <div className="flex items-center gap-2 mb-4">
          <LuShield size={24} className="text-amber-500" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
            High-Risk Systems (Annex III)
          </h3>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          These systems face significant compliance requirements under the EU AI Act.
        </p>
        <div className="flex flex-col gap-2">
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
        </div>
      </Card>

      {/* Volume and Impact */}
      <Card className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-600">
        <div className="flex items-center gap-2 mb-4">
          <LuUsers size={24} className="text-blue-600" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Scale and Impact
          </h3>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Volume thresholds help determine limited-risk classification.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">
              Decisions per Year
            </label>
            <input
              type="number"
              value={inputs.decisionsPerYear}
              onChange={(e) => updateNumber('decisionsPerYear', Number(e.target.value))}
              placeholder="10000"
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              How many decisions does the system make annually?
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">
              Affected Individuals
            </label>
            <input
              type="number"
              value={inputs.affectedIndividuals}
              onChange={(e) => updateNumber('affectedIndividuals', Number(e.target.value))}
              placeholder="5000"
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              How many people are affected by these decisions?
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={onSubmit} variant="primary" fullWidth size="lg">
        Classify Risk Level
      </Button>
    </div>
  );
}
