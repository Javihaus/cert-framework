'use client';

import Card from './Card';
import Button from './Button';
import { cn } from '@/lib/utils';
import { TrendingDown, Database, Scissors, Zap } from 'lucide-react';

interface RecommendationCardProps {
  type: 'model_downgrade' | 'caching' | 'prompt_optimization' | 'batching';
  description: string;
  savings: string;
  impact?: 'high' | 'medium' | 'low';
  details?: string;
  onApply?: () => void;
}

const typeConfig = {
  model_downgrade: {
    icon: TrendingDown,
    label: 'Model Downgrade',
    colorClass: 'text-blue-600 dark:text-blue-500',
  },
  caching: {
    icon: Database,
    label: 'Response Caching',
    colorClass: 'text-green-600 dark:text-green-500',
  },
  prompt_optimization: {
    icon: Scissors,
    label: 'Prompt Optimization',
    colorClass: 'text-zinc-900 dark:text-white',
  },
  batching: {
    icon: Zap,
    label: 'Request Batching',
    colorClass: 'text-amber-500',
  },
};

const impactConfig = {
  high: {
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    borderClass: 'border-green-600 dark:border-green-500',
    textClass: 'text-green-600 dark:text-green-500',
    label: 'High Impact',
  },
  medium: {
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-600 dark:text-amber-500',
    label: 'Medium Impact',
  },
  low: {
    bgClass: 'bg-zinc-100 dark:bg-zinc-800',
    borderClass: 'border-zinc-400 dark:border-zinc-600',
    textClass: 'text-zinc-500 dark:text-zinc-400',
    label: 'Low Impact',
  },
};

export default function RecommendationCard({
  type,
  description,
  savings,
  impact = 'medium',
  details,
  onApply,
}: RecommendationCardProps) {
  const config = typeConfig[type];
  const impactInfo = impactConfig[impact];
  const Icon = config.icon;

  return (
    <Card>
      <div className="flex gap-4 items-start">
        {/* Icon */}
        <div className={cn('flex-shrink-0', config.colorClass)}>
          <Icon size={32} />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 gap-2">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {config.label}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>

            {/* Impact badge */}
            <span
              className={cn(
                'px-2 py-1 rounded-full border text-xs font-medium',
                impactInfo.bgClass,
                impactInfo.borderClass,
                impactInfo.textClass
              )}
            >
              {impactInfo.label}
            </span>
          </div>

          {/* Details */}
          {details && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {details}
            </p>
          )}

          {/* Savings and action */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xl font-bold text-green-600 dark:text-green-500">
              {savings}
            </span>

            {onApply && (
              <Button
                onClick={onApply}
                size="sm"
                variant="primary"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
