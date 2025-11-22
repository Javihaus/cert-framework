'use client';

import Card from './Card';
import Badge from './Badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ConnectorCardProps {
  name: string;
  status: 'active' | 'disabled' | 'error';
  tracesLogged: number;
  failureCount: number;
  lastActivity?: string;
  description?: string;
}

export default function ConnectorCard({
  name,
  status,
  tracesLogged,
  failureCount,
  lastActivity,
  description,
}: ConnectorCardProps) {
  const statusConfig = {
    active: {
      iconClass: 'text-green-600 dark:text-green-500',
      icon: CheckCircle2,
      label: 'Active',
      variant: 'success' as const,
    },
    disabled: {
      iconClass: 'text-zinc-400',
      icon: XCircle,
      label: 'Disabled',
      variant: 'default' as const,
    },
    error: {
      iconClass: 'text-red-500',
      icon: AlertTriangle,
      label: 'Error',
      variant: 'error' as const,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <div className="flex flex-col gap-4">
        {/* Header with name and status */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <StatusIcon size={20} className={config.iconClass} />
            <Badge variant={config.variant} size="sm">
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex gap-6">
          <div className="flex flex-col flex-1">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              {tracesLogged.toLocaleString()}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              traces logged
            </span>
          </div>

          {failureCount > 0 && (
            <div className="flex flex-col flex-1">
              <span className="text-2xl font-bold text-red-500">
                {failureCount}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                failures
              </span>
            </div>
          )}
        </div>

        {/* Last activity */}
        {lastActivity && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Last activity: {lastActivity}
          </p>
        )}

        {/* Warning for failures */}
        {failureCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-500 rounded-md p-2">
            <div className="flex items-center gap-1">
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm text-red-500">
                {failureCount} recent {failureCount === 1 ? 'failure' : 'failures'} detected
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
