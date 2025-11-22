'use client';

import Card from './Card';
import Button from './Button';
import { ROIOutputs } from '@/types/wizard';
import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardROIResultsProps {
  outputs: ROIOutputs;
  onNext: () => void;
}

export default function WizardROIResults({ outputs, onNext }: WizardROIResultsProps) {
  const getConfidenceConfig = (level: string) => {
    switch (level) {
      case 'high': return { colorClass: 'text-green-600', bgClass: 'bg-green-50 dark:bg-green-900/20', borderClass: 'border-green-600', Icon: CheckCircle2 };
      case 'medium': return { colorClass: 'text-blue-600', bgClass: 'bg-blue-50 dark:bg-blue-900/20', borderClass: 'border-blue-600', Icon: TrendingUp };
      case 'low': return { colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-900/20', borderClass: 'border-amber-500', Icon: AlertTriangle };
      default: return { colorClass: 'text-zinc-500', bgClass: 'bg-zinc-100', borderClass: 'border-zinc-300', Icon: AlertTriangle };
    }
  };

  const confidenceConfig = getConfidenceConfig(outputs.confidenceLevel);
  const ConfidenceIcon = confidenceConfig.Icon;
  const isPositiveROI = outputs.monthlySavings > 0;

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">ROI Analysis Results</h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">Here's your projected return on investment for AI automation</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-2 border-red-500">
          <p className="text-sm text-zinc-500 mb-1">Current Monthly Cost</p>
          <p className="text-3xl font-bold text-red-500">${outputs.currentMonthlyCost.toLocaleString()}</p>
        </Card>
        <Card className="border-2 border-green-600">
          <p className="text-sm text-zinc-500 mb-1">AI Monthly Cost</p>
          <p className="text-3xl font-bold text-green-600">${outputs.aiMonthlyCost.toLocaleString()}</p>
        </Card>
        <Card className={cn('border-2', isPositiveROI ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600' : 'bg-red-50 dark:bg-red-900/20 border-red-500')}>
          <p className="text-sm text-zinc-500 mb-1">Monthly Savings</p>
          <p className={cn('text-3xl font-bold', isPositiveROI ? 'text-blue-600' : 'text-red-500')}>${outputs.monthlySavings.toLocaleString()}</p>
        </Card>
        <Card className={cn('border-2', isPositiveROI ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600' : 'bg-red-50 dark:bg-red-900/20 border-red-500')}>
          <p className="text-sm text-zinc-500 mb-1">Annual Savings</p>
          <p className={cn('text-3xl font-bold', isPositiveROI ? 'text-blue-600' : 'text-red-500')}>${outputs.annualSavings.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500 mb-1">Return on Investment</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{outputs.roiPercentage.toFixed(0)}%</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500 mb-1">Break-Even Point</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{outputs.breakEvenMonths < 100 ? `${outputs.breakEvenMonths.toFixed(1)} months` : 'Never'}</p>
        </Card>
      </div>

      {/* Confidence Level */}
      <Card className={cn('mb-6 border-2', confidenceConfig.bgClass, confidenceConfig.borderClass)}>
        <div className="flex items-center gap-4 mb-2">
          <ConfidenceIcon size={32} className={confidenceConfig.colorClass} />
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">Confidence Level: {outputs.confidenceLevel.toUpperCase()}</p>
            <p className="text-sm text-zinc-500">
              {outputs.confidenceLevel === 'high' && 'Strong business case with well-defined parameters'}
              {outputs.confidenceLevel === 'medium' && 'Reasonable estimates but some uncertainty remains'}
              {outputs.confidenceLevel === 'low' && 'Significant uncertainty - recommend pilot project first'}
            </p>
          </div>
        </div>
      </Card>

      {/* Risk Factors */}
      {outputs.risks.length > 0 && (
        <Card className="mb-8 bg-amber-50 dark:bg-amber-900/20 border-amber-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-amber-500" />
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">Risk Factors to Consider</span>
          </div>
          <div className="flex flex-col gap-1">
            {outputs.risks.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-zinc-500">{risk}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Summary</h3>
        <p className="text-sm text-zinc-500">
          {isPositiveROI ? (
            <>Your AI automation project shows a <strong className="text-zinc-900 dark:text-white">positive ROI of {outputs.roiPercentage.toFixed(0)}%</strong> with monthly savings of <strong className="text-zinc-900 dark:text-white">${outputs.monthlySavings.toLocaleString()}</strong>. You'll break even in <strong className="text-zinc-900 dark:text-white">{outputs.breakEvenMonths.toFixed(1)} months</strong>.</>
          ) : (
            <>Based on your inputs, AI automation may <strong className="text-zinc-900 dark:text-white">cost more</strong> than your current manual process. Consider optimizing the AI success rate, reducing human review requirements, or exploring cheaper model alternatives.</>
          )}
        </p>
      </Card>

      <Button onClick={onNext} variant="primary" fullWidth size="lg">Continue to Risk Assessment</Button>
    </div>
  );
}
