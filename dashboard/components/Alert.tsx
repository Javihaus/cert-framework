'use client';

import { ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

type AlertSeverity = 'info' | 'success' | 'warning' | 'error' | 'high';

interface AlertProps {
  children: ReactNode;
  severity?: AlertSeverity;
  title?: string;
  timestamp?: string;
  action?: ReactNode;
  onDismiss?: () => void;
}

const severityConfig = {
  info: {
    bgClass: 'bg-[#3C6098]/10 dark:bg-[#3C6098]/20',
    borderClass: 'border-[#3C6098]',
    iconClass: 'text-[#3C6098]',
    Icon: Info,
  },
  success: {
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-500',
    iconClass: 'text-green-500',
    Icon: CheckCircle,
  },
  warning: {
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-500',
    iconClass: 'text-amber-500',
    Icon: AlertTriangle,
  },
  error: {
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-500',
    iconClass: 'text-red-500',
    Icon: AlertCircle,
  },
  high: {
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    borderClass: 'border-red-600',
    iconClass: 'text-red-600',
    Icon: AlertCircle,
  },
};

/**
 * Professional Alert Component
 * For system alerts, warnings, and notifications
 */
export default function Alert({
  children,
  severity = 'info',
  title,
  timestamp,
  action,
  onDismiss,
}: AlertProps) {
  const config = severityConfig[severity];
  const IconComponent = config.Icon;

  return (
    <div
      className={cn(
        'border-l-4 rounded-md p-4 transition-all',
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="flex gap-2 items-start">
        <div className={cn('flex-shrink-0 mt-0.5', config.iconClass)}>
          <IconComponent size={20} />
        </div>

        <div className="flex-1">
          {title && (
            <p className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {children}
          </p>

          {action && <div className="mt-2">{action}</div>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {timestamp && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {timestamp}
            </span>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Alert List - For displaying multiple alerts
 */
interface AlertListProps {
  children: ReactNode;
  maxVisible?: number;
}

export function AlertList({ children, maxVisible }: AlertListProps) {
  return (
    <div className="flex flex-col gap-2">
      {children}
    </div>
  );
}

/**
 * Actionable Alert - Pre-configured with investigate button
 */
interface ActionableAlertProps {
  message: string;
  severity?: AlertSeverity;
  timestamp?: string;
  onInvestigate?: () => void;
  onDismiss?: () => void;
}

export function ActionableAlert({
  message,
  severity = 'warning',
  timestamp,
  onInvestigate,
  onDismiss,
}: ActionableAlertProps) {
  return (
    <Alert
      severity={severity}
      timestamp={timestamp}
      onDismiss={onDismiss}
      action={
        onInvestigate && (
          <Button size="sm" variant="primary" onClick={onInvestigate}>
            Investigate
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}
