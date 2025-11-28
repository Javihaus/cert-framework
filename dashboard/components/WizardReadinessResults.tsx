'use client';

import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';
import { ReadinessOutputs } from '@/types/wizard';
import { LuCircleCheckBig, LuTriangleAlert, LuCircleX, LuTrendingUp, LuClock, LuCircleAlert, LuDatabase, LuCode, LuUsers, LuShield } from 'react-icons/lu';

interface WizardReadinessResultsProps {
  outputs: ReadinessOutputs;
  onNext: () => void;
}

export default function WizardReadinessResults({
  outputs,
  onNext
}: WizardReadinessResultsProps) {
  const getReadinessConfig = (level: string) => {
    switch (level) {
      case 'ready':
        return {
          icon: LuCircleCheckBig,
          colorClass: 'text-green-600',
          bgClass: 'bg-green-50 dark:bg-green-900/20',
          borderClass: 'border-green-600',
          label: 'Ready to Implement',
          message: 'Your organization demonstrates strong readiness across all dimensions. You can proceed with confidence.'
        };
      case 'needs-preparation':
        return {
          icon: LuTriangleAlert,
          colorClass: 'text-amber-500',
          bgClass: 'bg-amber-50 dark:bg-amber-900/20',
          borderClass: 'border-amber-500',
          label: 'Needs Preparation',
          message: 'Some gaps need to be addressed before implementation. Review recommendations and create a preparation plan.'
        };
      case 'not-ready':
        return {
          icon: LuCircleX,
          colorClass: 'text-red-500',
          bgClass: 'bg-red-50 dark:bg-red-900/20',
          borderClass: 'border-red-500',
          label: 'Not Ready',
          message: 'Significant preparation required. Focus on building foundational capabilities before implementation.'
        };
      default:
        return {
          icon: LuCircleAlert,
          colorClass: 'text-zinc-500',
          bgClass: 'bg-zinc-100 dark:bg-zinc-800',
          borderClass: 'border-zinc-300',
          label: 'Unknown',
          message: ''
        };
    }
  };

  const config = getReadinessConfig(outputs.readinessLevel);
  const ReadinessIcon = config.icon;

  const categoryIcons = {
    data: LuDatabase,
    technical: LuCode,
    organizational: LuUsers,
    compliance: LuShield
  };

  const getCategoryConfig = (score: number) => {
    if (score >= 70) return { colorClass: 'text-green-600', bgClass: 'bg-green-50 dark:bg-green-900/20', borderClass: 'border-green-600' };
    if (score >= 40) return { colorClass: 'text-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-900/20', borderClass: 'border-amber-500' };
    return { colorClass: 'text-red-500', bgClass: 'bg-red-50 dark:bg-red-900/20', borderClass: 'border-red-500' };
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
        Readiness Assessment Results
      </h2>
      <p className="text-base text-zinc-500 dark:text-zinc-400 mb-8">
        Based on your organizational capabilities and preparedness
      </p>

      {/* Overall Readiness Badge */}
      <Card className={cn('mb-6 border-2 text-center py-8', config.bgClass, config.borderClass)}>
        <div className="flex flex-col items-center gap-4">
          <ReadinessIcon size={64} className={config.colorClass} />
          <div>
            <p className={cn('text-4xl font-bold', config.colorClass)}>
              {config.label}
            </p>
            <p className="text-5xl font-bold text-zinc-900 dark:text-white mt-2">
              {outputs.overallScore}/100
            </p>
          </div>
          <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
            {config.message}
          </p>
        </div>
      </Card>

      {/* Category Scores */}
      <Card className="mb-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
          Category Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(outputs.categoryScores).map(([category, score]) => {
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
            const categoryConfig = getCategoryConfig(score);

            return (
              <Card
                key={category}
                className={cn('border-2', categoryConfig.bgClass, categoryConfig.borderClass)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon size={20} className={categoryConfig.colorClass} />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </div>
                <p className={cn('text-3xl font-bold', categoryConfig.colorClass)}>
                  {score}/100
                </p>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Timeline Estimate */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-2 border-blue-600">
          <div className="flex items-center gap-2 mb-2">
            <LuClock size={20} className="text-blue-600" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Estimated Timeline
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {outputs.estimatedTimelineWeeks} weeks
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Including preparation and implementation
          </p>
        </Card>

        <Card className="border-2 border-red-500">
          <div className="flex items-center gap-2 mb-2">
            <LuCircleAlert size={20} className="text-red-500" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Gaps Identified
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {outputs.gaps.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Areas needing attention
          </p>
        </Card>
      </div>

      {/* Gaps */}
      {outputs.gaps.length > 0 && (
        <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-500">
          <div className="flex items-center gap-2 mb-4">
            <LuCircleAlert size={24} className="text-red-500" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Gaps to Address
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {outputs.gaps.map((gap, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-zinc-800 rounded-md">
                <LuCircleX size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {gap}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-600">
        <div className="flex items-center gap-2 mb-4">
          <LuTrendingUp size={24} className="text-blue-600" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
            Recommendations
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {outputs.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-zinc-800 rounded-md">
              <LuCircleCheckBig size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {rec}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Risk Factors */}
      {outputs.riskFactors.length > 0 && (
        <Card className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-500">
          <div className="flex items-center gap-2 mb-4">
            <LuTriangleAlert size={24} className="text-amber-500" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Risk Factors
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {outputs.riskFactors.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-zinc-800 rounded-md">
                <LuTriangleAlert size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {risk}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Message */}
      <Card className="mb-6">
        <p className="text-base text-zinc-500 dark:text-zinc-400">
          {outputs.readinessLevel === 'ready' && (
            <>
              Your organization is well-positioned to proceed with AI implementation.
              The next step will help you create a detailed deployment plan based on
              all the information gathered in this wizard.
            </>
          )}
          {outputs.readinessLevel === 'needs-preparation' && (
            <>
              Before proceeding to deployment planning, we recommend addressing the
              identified gaps. However, you can continue to see what a full deployment
              plan would look like and use it as a roadmap for your preparation phase.
            </>
          )}
          {outputs.readinessLevel === 'not-ready' && (
            <>
              We strongly recommend addressing the critical gaps before moving to
              deployment planning. The final step will show you what needs to be in
              place, which can serve as your preparation roadmap.
            </>
          )}
        </p>
      </Card>

      {/* Continue Button */}
      <Button onClick={onNext} variant="primary" fullWidth size="lg">
        Continue to Deployment Planning
      </Button>
    </div>
  );
}
