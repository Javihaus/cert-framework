'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'badge-neutral',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-zinc-400',
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[11px] h-5',
  md: 'text-xs h-6',
  lg: 'text-[13px] h-7',
};

/**
 * Professional Badge Component
 * Tailwind-only implementation based on DASHBOARD_DESIGN_SPEC.md
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {icon && <span className="flex text-xs">{icon}</span>}
      {children}
    </span>
  );
}

/**
 * Status Badge - Pre-configured for common statuses
 */
interface StatusBadgeProps {
  status:
    | 'healthy'
    | 'active'
    | 'warning'
    | 'error'
    | 'inactive'
    | 'pending'
    | 'compliant'
    | 'non-compliant';
  size?: BadgeSize;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  size = 'md',
  showDot = true,
}: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    healthy: { variant: 'success', label: 'Healthy' },
    active: { variant: 'success', label: 'Active' },
    warning: { variant: 'warning', label: 'Warning' },
    error: { variant: 'error', label: 'Error' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    compliant: { variant: 'success', label: 'Compliant' },
    'non-compliant': { variant: 'error', label: 'Non-Compliant' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={showDot}>
      {config.label}
    </Badge>
  );
}

/**
 * Count Badge - For notification counts
 */
interface CountBadgeProps {
  count: number;
  maxCount?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function CountBadge({
  count,
  maxCount = 99,
  variant = 'error',
  size = 'sm',
}: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <Badge variant={variant} size={size} className="badge-notification">
      {displayCount}
    </Badge>
  );
}

/**
 * Trend Badge - For showing positive/negative trends
 */
interface TrendBadgeProps {
  value: number;
  suffix?: string;
  size?: BadgeSize;
}

export function TrendBadge({ value, suffix = '%', size = 'sm' }: TrendBadgeProps) {
  const isPositive = value >= 0;
  const variant = isPositive ? 'success' : 'error';
  const prefix = isPositive ? '+' : '';

  return (
    <Badge variant={variant} size={size}>
      <span className="flex items-center gap-0.5">
        <span className="text-[10px]">{isPositive ? '▲' : '▼'}</span>
        {prefix}
        {Math.abs(value)}
        {suffix}
      </span>
    </Badge>
  );
}

/**
 * Risk Level Badge - For EU AI Act risk levels
 */
interface RiskBadgeProps {
  level: 'minimal' | 'limited' | 'high' | 'unacceptable';
  size?: BadgeSize;
}

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const riskConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    minimal: { variant: 'success', label: 'Minimal Risk' },
    limited: { variant: 'info', label: 'Limited Risk' },
    high: { variant: 'warning', label: 'High Risk' },
    unacceptable: { variant: 'error', label: 'Unacceptable' },
  };

  const config = riskConfig[level];

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
}
