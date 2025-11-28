'use client';

import { IconType } from 'react-icons';
import Card from './Card';
import { TrendBadge, StatusBadge } from './Badge';
import { cn } from '@/lib/utils';

type MetricVariant = 'default' | 'success' | 'warning' | 'error' | 'primary';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: IconType;
  variant?: MetricVariant;
  trend?: number;
  trendSuffix?: string;
  target?: string;
  sparkline?: number[];
  subtitle?: string;
  onClick?: () => void;
}

const variantStyles: Record<MetricVariant, { iconBg: string; iconColor: string }> = {
  default: {
    iconBg: 'bg-zinc-100 dark:bg-zinc-800',
    iconColor: 'text-zinc-600 dark:text-zinc-400',
  },
  success: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    iconBg: 'bg-red-100 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  primary: {
    iconBg: 'bg-[#3C6098]/10 dark:bg-[#3C6098]/20',
    iconColor: 'text-[#3C6098] dark:text-[#3C6098]',
  },
};

/**
 * Professional Metric Card Component
 * Tailwind-only implementation based on DASHBOARD_DESIGN_SPEC.md
 */
export default function MetricCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  trendSuffix = '%',
  target,
  sparkline,
  subtitle,
  onClick,
}: MetricCardProps) {
  const style = variantStyles[variant];

  return (
    <Card onClick={onClick} hoverEffect={!!onClick}>
      <div className="flex flex-col gap-4">
        {/* Header Row - Label + Icon */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          {Icon && (
            <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', style.iconBg)}>
              <Icon size={18} className={style.iconColor} strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Value Row */}
        <div className="flex items-end gap-3">
          <span className="text-3xl font-semibold text-zinc-900 dark:text-white leading-none tracking-tight">
            {value}
          </span>

          {/* Trend Badge */}
          {trend !== undefined && (
            <div className="mb-1">
              <TrendBadge value={trend} suffix={trendSuffix} />
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <Sparkline data={sparkline} variant={variant} />
        )}

        {/* Footer - Target or Subtitle */}
        {(target || subtitle) && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {target ? `Target: ${target}` : subtitle}
          </span>
        )}
      </div>
    </Card>
  );
}

/**
 * Sparkline Chart Component
 */
interface SparklineProps {
  data: number[];
  variant?: MetricVariant;
  height?: number;
}

function Sparkline({ data, variant = 'default', height = 32 }: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const colorMap: Record<MetricVariant, string> = {
    default: '#A1A1AA',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    primary: '#3C6098',
  };

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((max - value) / range) * height;
    return `${x},${y}`;
  });

  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      <svg width="100%" height={height} preserveAspectRatio="none">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={colorMap[variant]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Big Number Metric Card - For hero metrics
 */
interface BigNumberCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: string;
  color?: string;
  subtitle?: string;
}

export function BigNumberCard({
  title,
  value,
  unit = '',
  trend,
  subtitle,
}: BigNumberCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </span>

        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-[#3C6098] dark:text-[#3C6098] leading-none tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-2xl font-medium text-zinc-500">
              {unit}
            </span>
          )}
        </div>

        {trend && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}

        {subtitle && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </span>
        )}
      </div>
    </Card>
  );
}

/**
 * Metrics Bar - Grid of 4 metrics for dashboard header
 */
interface MetricsBarProps {
  children: React.ReactNode;
}

export function MetricsBar({ children }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

/**
 * Compact Metric - For inline metric display
 */
interface CompactMetricProps {
  label: string;
  value: string | number;
  variant?: MetricVariant;
}

export function CompactMetric({
  label,
  value,
  variant = 'default',
}: CompactMetricProps) {
  const dotColors: Record<MetricVariant, string> = {
    default: 'bg-zinc-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    primary: 'bg-[#3C6098]',
  };

  return (
    <div className="flex items-center gap-3">
      <span className={cn('w-2 h-2 rounded-full', dotColors[variant])} />
      <div className="flex flex-col">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="text-base font-semibold text-zinc-900 dark:text-white">{value}</span>
      </div>
    </div>
  );
}

/**
 * Status Metric Card - For system health status
 */
interface StatusMetricCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'inactive';
  lastCheck?: string;
  details?: string;
}

export function StatusMetricCard({
  title,
  status,
  lastCheck,
  details,
}: StatusMetricCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {title}
          </span>
          <StatusBadge status={status} />
        </div>

        {details && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {details}
          </span>
        )}

        {lastCheck && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Last check: {lastCheck}
          </span>
        )}
      </div>
    </Card>
  );
}
