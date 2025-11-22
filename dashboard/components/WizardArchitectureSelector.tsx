'use client';

import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';
import { ArchitectureInputs, ArchitectureRecommendation } from '@/types/wizard';
import { selectArchitecture, getAllArchitectures, calculateMonthlyCost } from '@/lib/architecture-selector';
import { Check, DollarSign, Code, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
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
        return { colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-900/30', label: 'Easy Setup', icon: CheckCircle2 };
      case 'medium':
        return { colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-900/30', label: 'Moderate Setup', icon: AlertCircle };
      case 'high':
        return { colorClass: 'text-amber-500', bgClass: 'bg-amber-100 dark:bg-amber-900/30', label: 'Complex Setup', icon: Zap };
      default:
        return { colorClass: 'text-zinc-500', bgClass: 'bg-zinc-100 dark:bg-zinc-800', label: 'Unknown', icon: AlertCircle };
    }
  };

  const ArchitectureCard = ({ arch, isSelected }: { arch: ArchitectureRecommendation; isSelected: boolean }) => {
    const complexityConfig = getComplexityConfig(arch.complexity);
    const ComplexityIcon = complexityConfig.icon;
    const estimatedCost = calculateMonthlyCost(arch, inputs.volumeQueriesPerMonth);

    return (
      <Card
        className={cn(
          'cursor-pointer transition-all relative',
          isSelected
            ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
            : 'border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500'
        )}
        onClick={() => onSelect(arch)}
      >
        {isSelected && (
          <div className="absolute top-4 right-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Check size={20} color="white" />
            </div>
          </div>
        )}

        <div className="flex flex-col mb-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
            {arch.name}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {arch.description}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md', complexityConfig.bgClass)}>
            <ComplexityIcon size={16} className={complexityConfig.colorClass} />
            <span className={cn('text-xs font-medium', complexityConfig.colorClass)}>
              {complexityConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
            <DollarSign size={16} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-600">
              ${estimatedCost.toFixed(0)}/mo
            </span>
          </div>
        </div>

        <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
          <span className="text-xs font-semibold text-zinc-900 dark:text-white mb-2 block">
            Tech Stack
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-500">LLM:</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-white">
                {arch.components.llm.provider} {arch.components.llm.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-500">Vector DB:</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-white">
                {arch.components.vectorDb.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-zinc-500">Framework:</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-white">
                {arch.components.orchestration.framework}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold text-green-600 mb-1 block">Pros</span>
            <div className="flex flex-col gap-1">
              {arch.pros.slice(0, 2).map((pro, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <CheckCircle2 size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-zinc-500">{pro}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-red-500 mb-1 block">Cons</span>
            <div className="flex flex-col gap-1">
              {arch.cons.slice(0, 2).map((con, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <AlertCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-zinc-500">{con}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isSelected && (
          <div className="p-4 bg-zinc-900 rounded-md">
            <div className="flex items-center gap-1 mb-2">
              <Code size={14} className="text-white" />
              <span className="text-xs font-semibold text-white">Quick Start Example</span>
            </div>
            <pre className="text-xs text-white overflow-auto whitespace-pre-wrap font-mono">
              {arch.codeExample}
            </pre>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
        Architecture Selection
      </h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        {showAll
          ? 'All available reference architectures. Click any to see details and select.'
          : `Based on your requirements, we recommend these ${recommendations.length} production-proven architectures.`
        }
      </p>

      {!showAll && recommendations.length > 0 && (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-600">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white mb-2 block">
            Recommendations Based On:
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className="text-blue-600" />
              <span className="text-xs text-zinc-500">Budget: ${inputs.budgetPerMonth}/month</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={14} className="text-blue-600" />
              <span className="text-xs text-zinc-500">Volume: {inputs.volumeQueriesPerMonth.toLocaleString()} queries/month</span>
            </div>
            {inputs.dataResidency !== 'any' && (
              <div className="flex items-center gap-1">
                <AlertCircle size={14} className="text-blue-600" />
                <span className="text-xs text-zinc-500">Data Residency: {inputs.dataResidency.toUpperCase()}</span>
              </div>
            )}
            {inputs.teamSkills.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-blue-600" />
                <span className="text-xs text-zinc-500">Team Skills: {inputs.teamSkills.join(', ')}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {!showAll && recommendations.length === 0 && (
        <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-500">
          <p className="text-sm text-zinc-500">
            No architectures match your exact requirements. We've relaxed some constraints below to show available options.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-4 mb-6">
        {displayedArchitectures.map((arch, idx) => (
          <ArchitectureCard
            key={idx}
            arch={arch}
            isSelected={selectedArchitecture?.name === arch.name}
          />
        ))}
      </div>

      {!showAll && recommendations.length < allArchitectures.length && (
        <Button
          onClick={() => setShowAll(true)}
          variant="secondary"
          fullWidth
          className="mb-4"
        >
          Browse All {allArchitectures.length} Architectures
        </Button>
      )}

      {showAll && (
        <Button
          onClick={() => setShowAll(false)}
          variant="secondary"
          fullWidth
          className="mb-4"
        >
          Show Only Recommended
        </Button>
      )}

      <Button
        onClick={onNext}
        variant="primary"
        fullWidth
        size="lg"
        disabled={!selectedArchitecture}
      >
        {selectedArchitecture ? 'Continue to Readiness Assessment' : 'Select an Architecture to Continue'}
      </Button>
    </div>
  );
}
