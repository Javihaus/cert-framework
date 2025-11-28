'use client';

import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';
import { RiskOutputs } from '@/types/wizard';
import { LuCircleX, LuTriangleAlert, LuShield, LuCircleCheckBig, LuClock, LuDollarSign } from 'react-icons/lu';

interface WizardRiskResultsProps {
  outputs: RiskOutputs;
  onNext: () => void;
}

export default function WizardRiskResults({ outputs, onNext }: WizardRiskResultsProps) {
  const getClassificationConfig = (classification: string) => {
    switch (classification) {
      case 'prohibited':
        return {
          icon: LuCircleX,
          colorClass: 'text-red-500',
          bgClass: 'bg-red-50 dark:bg-red-900/20',
          borderClass: 'border-red-500',
          label: 'PROHIBITED',
          description: 'This AI system cannot be deployed under EU AI Act'
        };
      case 'high-risk':
        return {
          icon: LuTriangleAlert,
          colorClass: 'text-amber-500',
          bgClass: 'bg-amber-50 dark:bg-amber-900/20',
          borderClass: 'border-amber-500',
          label: 'HIGH-RISK',
          description: 'Significant compliance requirements apply'
        };
      case 'limited-risk':
        return {
          icon: LuShield,
          colorClass: 'text-blue-600',
          bgClass: 'bg-blue-50 dark:bg-blue-900/20',
          borderClass: 'border-blue-600',
          label: 'LIMITED-RISK',
          description: 'Transparency obligations required'
        };
      case 'minimal-risk':
        return {
          icon: LuCircleCheckBig,
          colorClass: 'text-green-600',
          bgClass: 'bg-green-50 dark:bg-green-900/20',
          borderClass: 'border-green-600',
          label: 'MINIMAL-RISK',
          description: 'No mandatory requirements'
        };
      default:
        return {
          icon: LuShield,
          colorClass: 'text-zinc-500',
          bgClass: 'bg-zinc-100 dark:bg-zinc-800',
          borderClass: 'border-zinc-300',
          label: 'UNKNOWN',
          description: ''
        };
    }
  };

  const config = getClassificationConfig(outputs.classification);
  const Icon = config.icon;
  const isProhibited = outputs.classification === 'prohibited';

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
        Risk Classification Results
      </h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        Your AI system has been classified according to EU AI Act requirements
      </p>

      {/* Classification Badge */}
      <Card className={cn('mb-6 border-[3px]', config.bgClass, config.borderClass)}>
        <div className="flex flex-col items-center text-center py-6">
          <Icon size={64} className={config.colorClass} />
          <p className={cn('text-4xl font-bold mt-4 mb-1', config.colorClass)}>
            {config.label}
          </p>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            {config.description}
          </p>
        </div>
      </Card>

      {/* Prohibition Reason */}
      {isProhibited && outputs.prohibitionReason && (
        <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-500">
          <div className="flex items-center gap-2 mb-4">
            <LuCircleX size={24} className="text-red-500" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Why This System is Prohibited
            </h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {outputs.prohibitionReason}
          </p>
        </Card>
      )}

      {/* Triggered Criteria */}
      {outputs.triggeredCriteria.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Triggered Criteria
          </h3>
          <div className="flex flex-col gap-2">
            {outputs.triggeredCriteria.map((criterion, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={cn('w-1 h-1 rounded-full mt-2 flex-shrink-0', config.colorClass.replace('text-', 'bg-'))} />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {criterion}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cost and Timeline Estimates */}
      {!isProhibited && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-2 border-blue-600">
            <div className="flex items-center gap-2 mb-2">
              <LuDollarSign size={20} className="text-blue-600" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Estimated Compliance Cost
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              ${outputs.estimatedComplianceCost.low.toLocaleString()} - ${outputs.estimatedComplianceCost.high.toLocaleString()}
            </p>
          </Card>

          <Card className="border-2 border-blue-600">
            <div className="flex items-center gap-2 mb-2">
              <LuClock size={20} className="text-blue-600" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                Estimated Timeline
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {outputs.estimatedTimeMonths.low} - {outputs.estimatedTimeMonths.high} months
            </p>
          </Card>
        </div>
      )}

      {/* Compliance Requirements */}
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          {isProhibited ? 'Legal Status' : 'Compliance Requirements'}
        </h3>
        <div className="flex flex-col gap-2">
          {outputs.complianceRequirements.map((requirement, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <LuCircleCheckBig size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {requirement}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary and Next Steps */}
      <Card className="mb-8 bg-zinc-100 dark:bg-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          What This Means
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isProhibited && (
            <>
              Your AI system falls under prohibited uses of the EU AI Act. It cannot be deployed in the EU.
              You will need to either redesign the system to avoid prohibited practices or deploy it outside EU jurisdiction.
            </>
          )}
          {outputs.classification === 'high-risk' && (
            <>
              Your AI system is classified as <strong className="text-zinc-900 dark:text-white">high-risk</strong> under Annex III of the EU AI Act.
              You'll need to implement comprehensive compliance measures including risk management systems,
              technical documentation, human oversight, and undergo conformity assessment before deployment.
              Estimated compliance costs range from <strong className="text-zinc-900 dark:text-white">${outputs.estimatedComplianceCost.low.toLocaleString()}</strong> to{' '}
              <strong className="text-zinc-900 dark:text-white">${outputs.estimatedComplianceCost.high.toLocaleString()}</strong> over{' '}
              <strong className="text-zinc-900 dark:text-white">{outputs.estimatedTimeMonths.low}-{outputs.estimatedTimeMonths.high} months</strong>.
            </>
          )}
          {outputs.classification === 'limited-risk' && (
            <>
              Your AI system has <strong className="text-zinc-900 dark:text-white">limited-risk</strong> classification. You must comply with transparency requirements,
              ensuring users know they're interacting with AI and understand the system's capabilities and limitations.
              This is relatively straightforward with costs around <strong className="text-zinc-900 dark:text-white">${outputs.estimatedComplianceCost.low.toLocaleString()}</strong> to{' '}
              <strong className="text-zinc-900 dark:text-white">${outputs.estimatedComplianceCost.high.toLocaleString()}</strong>.
            </>
          )}
          {outputs.classification === 'minimal-risk' && (
            <>
              Good news! Your AI system is <strong className="text-zinc-900 dark:text-white">minimal-risk</strong> with no mandatory compliance requirements under the EU AI Act.
              You're encouraged to follow voluntary codes of conduct, but standard product safety laws apply.
            </>
          )}
        </p>
      </Card>

      {!isProhibited && (
        <Button onClick={onNext} variant="primary" fullWidth size="lg">
          Continue to Architecture Selection
        </Button>
      )}

      {isProhibited && (
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This wizard cannot proceed with prohibited AI systems. Please consult legal counsel for alternative approaches.
          </p>
        </div>
      )}
    </div>
  );
}
