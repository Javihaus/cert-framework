'use client';

import {
  Bird,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Card, { CardTitle } from './Card';
import Badge from './Badge';
import { cn } from '@/lib/utils';

/**
 * Canary Prompt Interface
 */
interface CanaryPrompt {
  id: string;
  name: string;
  type: 'reasoning' | 'factuality' | 'safety' | 'consistency';
  status: 'healthy' | 'warning' | 'error';
  consistency: number; // 0-100%
  lastCheck: Date;
  responseTime: number; // ms
  trend: 'up' | 'down' | 'stable';
}

/**
 * Mock canary data
 */
const mockCanaries: CanaryPrompt[] = [
  {
    id: '1',
    name: 'Math Reasoning',
    type: 'reasoning',
    status: 'healthy',
    consistency: 98.5,
    lastCheck: new Date(),
    responseTime: 245,
    trend: 'stable',
  },
  {
    id: '2',
    name: 'Factual Knowledge',
    type: 'factuality',
    status: 'healthy',
    consistency: 97.2,
    lastCheck: new Date(Date.now() - 60000),
    responseTime: 312,
    trend: 'up',
  },
  {
    id: '3',
    name: 'Safety Guardrails',
    type: 'safety',
    status: 'warning',
    consistency: 94.1,
    lastCheck: new Date(Date.now() - 120000),
    responseTime: 890,
    trend: 'down',
  },
  {
    id: '4',
    name: 'Output Format',
    type: 'consistency',
    status: 'healthy',
    consistency: 99.8,
    lastCheck: new Date(Date.now() - 180000),
    responseTime: 156,
    trend: 'stable',
  },
];

interface CanaryStatusProps {
  canaries?: CanaryPrompt[];
  compact?: boolean;
}

/**
 * Canary Status Component
 * Shows health of canary prompt monitors
 */
export default function CanaryStatus({
  canaries = mockCanaries,
  compact = false,
}: CanaryStatusProps) {
  const healthyCount = canaries.filter((c) => c.status === 'healthy').length;
  const warningCount = canaries.filter((c) => c.status === 'warning').length;
  const errorCount = canaries.filter((c) => c.status === 'error').length;

  return (
    <Card variant="elevated" className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30">
            <Bird size={16} className="text-blue-700 dark:text-blue-400" />
          </div>
          <CardTitle>Canary Status</CardTitle>
        </div>

        {/* Summary Badges */}
        <div className="flex gap-1">
          <Badge variant="success" size="sm">
            {healthyCount} OK
          </Badge>
          {warningCount > 0 && (
            <Badge variant="warning" size="sm">
              {warningCount}
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="error" size="sm">
              {errorCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Canary Grid */}
      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      )}>
        {canaries.map((canary) => (
          <CanaryCard key={canary.id} canary={canary} />
        ))}
      </div>
    </Card>
  );
}

/**
 * Individual Canary Card
 */
interface CanaryCardProps {
  canary: CanaryPrompt;
}

function CanaryCard({ canary }: CanaryCardProps) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      colorClass: 'text-green-600 dark:text-green-500',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
    },
    warning: {
      icon: AlertTriangle,
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    },
    error: {
      icon: XCircle,
      colorClass: 'text-red-500',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
    },
  };

  const config = statusConfig[canary.status];
  const StatusIcon = config.icon;

  const TrendIcon =
    canary.trend === 'up'
      ? TrendingUp
      : canary.trend === 'down'
        ? TrendingDown
        : null;

  const trendColorClass =
    canary.trend === 'up'
      ? 'text-green-600 dark:text-green-500'
      : canary.trend === 'down'
        ? 'text-red-500'
        : 'text-zinc-400';

  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 transition-all hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
      {/* Status Icon */}
      <div className={cn(
        'flex items-center justify-center w-7 h-7 rounded flex-shrink-0',
        config.bgClass
      )}>
        <StatusIcon size={14} className={config.colorClass} />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[13px] font-medium text-zinc-900 dark:text-white truncate">
          {canary.name}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {canary.consistency.toFixed(1)}% consistent
          </span>
          {TrendIcon && <TrendIcon size={10} className={trendColorClass} />}
        </div>
      </div>

      {/* Response Time */}
      <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
        <Clock size={12} />
        <span className="text-[11px]">{canary.responseTime}ms</span>
      </div>
    </div>
  );
}

/**
 * Canary Type Badge
 */
function CanaryTypeBadge({ type }: { type: CanaryPrompt['type'] }) {
  const typeConfig = {
    reasoning: { label: 'Reasoning', variant: 'info' as const },
    factuality: { label: 'Factuality', variant: 'primary' as const },
    safety: { label: 'Safety', variant: 'warning' as const },
    consistency: { label: 'Format', variant: 'default' as const },
  };

  const config = typeConfig[type];

  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
}

export type { CanaryPrompt };
