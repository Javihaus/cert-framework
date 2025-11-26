'use client';

import { ReactNode } from 'react';
import {
  Monitor,
  FileText,
  AlertCircle,
  RefreshCw,
  Inbox,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

/**
 * Loading Spinner Component
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full border-zinc-200 border-t-[#3C6098] animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * Loading State Component
 */
interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size={size} />
      <span className="text-sm text-zinc-400 dark:text-zinc-500">
        {message}
      </span>
    </div>
  );
}

/**
 * Empty State Component
 */
type EmptyStateType =
  | 'monitors'
  | 'traces'
  | 'documents'
  | 'alerts'
  | 'data'
  | 'settings';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const typeConfig = {
  monitors: {
    Icon: Monitor,
    defaultTitle: 'No monitors yet',
    defaultDescription: 'Start monitoring your LLM endpoints to track performance and compliance.',
  },
  traces: {
    Icon: BarChart3,
    defaultTitle: 'No traces recorded',
    defaultDescription: 'Traces will appear here once you start making API calls.',
  },
  documents: {
    Icon: FileText,
    defaultTitle: 'No documents generated',
    defaultDescription: 'Generate your first compliance report to get started.',
  },
  alerts: {
    Icon: AlertCircle,
    defaultTitle: 'No alerts',
    defaultDescription: 'You have no active alerts. Everything is running smoothly.',
  },
  data: {
    Icon: Inbox,
    defaultTitle: 'No data available',
    defaultDescription: 'There is no data to display at this time.',
  },
  settings: {
    Icon: Settings,
    defaultTitle: 'No configuration',
    defaultDescription: 'Configure your settings to get started.',
  },
};

export function EmptyState({
  type = 'data',
  title,
  description,
  action,
}: EmptyStateProps) {
  const config = typeConfig[type];
  const IconComponent = config.Icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-6">
        <IconComponent size={32} className="text-zinc-400 dark:text-zinc-500" />
      </div>

      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
        {title || config.defaultTitle}
      </h3>

      <p className={cn(
        'text-sm text-zinc-400 dark:text-zinc-500 max-w-md',
        action ? 'mb-6' : ''
      )}>
        {description || config.defaultDescription}
      </p>

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Error State Component
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
        <AlertCircle size={32} className="text-red-500" />
      </div>

      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
        {title}
      </h3>

      <p className={cn(
        'text-sm text-zinc-400 dark:text-zinc-500 max-w-md',
        onRetry ? 'mb-6' : ''
      )}>
        {message}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Skeleton Loader - For content placeholders
 */
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse',
        className
      )}
      style={{ width, height }}
    />
  );
}

/**
 * Card Skeleton - For card loading states
 */
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm">
      <Skeleton height="24px" width="60%" />
      <div className="h-4" />
      <Skeleton height="14px" width="100%" />
      <div className="h-1" />
      <Skeleton height="14px" width="80%" />
      <div className="h-6" />
      <Skeleton height="40px" width="120px" className="rounded-lg" />
    </div>
  );
}

/**
 * Metric Card Skeleton
 */
export function MetricSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm">
      <Skeleton height="14px" width="80px" />
      <div className="h-4" />
      <Skeleton height="40px" width="120px" />
      <div className="h-2" />
      <Skeleton height="16px" width="60px" />
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 py-2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === 0 ? '30%' : `${70 / (columns - 1)}%`}
        />
      ))}
    </div>
  );
}
