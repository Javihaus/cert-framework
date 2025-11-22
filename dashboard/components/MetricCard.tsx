'use client';

import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from './Card';
import { colors, spacing, typography, shadows, transitions } from '@/theme';
import { TrendBadge, StatusBadge } from './Badge';

type MetricVariant = 'default' | 'success' | 'warning' | 'error' | 'primary';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: MetricVariant;
  trend?: number;
  trendSuffix?: string;
  target?: string;
  sparkline?: number[];
  subtitle?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    iconBg: colors.neutral[100],
    iconColor: colors.neutral[600],
    valueColor: colors.text.primary,
  },
  success: {
    iconBg: colors.semantic.successLight,
    iconColor: colors.semantic.success,
    valueColor: colors.text.primary,
  },
  warning: {
    iconBg: colors.semantic.warningLight,
    iconColor: colors.semantic.warning,
    valueColor: colors.text.primary,
  },
  error: {
    iconBg: colors.semantic.errorLight,
    iconColor: colors.semantic.error,
    valueColor: colors.text.primary,
  },
  primary: {
    iconBg: colors.primary[100],
    iconColor: colors.primary[700],
    valueColor: colors.text.primary,
  },
};

/**
 * Professional Metric Card Component
 * Displays key metrics with trends, sparklines, and targets
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
    <Card
      variant="elevated"
      onClick={onClick}
      hoverEffect={!!onClick}
    >
      <Flex direction="column" gap={spacing.md}>
        {/* Header Row - Label + Icon */}
        <Flex align="center" justify="space-between">
          <Text
            fontSize="14px"
            fontWeight={500}
            color={colors.text.muted}
          >
            {label}
          </Text>
          {Icon && (
            <Flex
              align="center"
              justify="center"
              w="36px"
              h="36px"
              borderRadius="8px"
              bg={style.iconBg}
            >
              <Icon size={18} color={style.iconColor} strokeWidth={2} />
            </Flex>
          )}
        </Flex>

        {/* Value Row */}
        <Flex align="flex-end" gap={spacing.sm}>
          <Text
            fontSize="32px"
            fontWeight={700}
            color={style.valueColor}
            lineHeight={1.2}
            letterSpacing="-0.02em"
          >
            {value}
          </Text>

          {/* Trend Badge */}
          {trend !== undefined && (
            <Box mb="4px">
              <TrendBadge value={trend} suffix={trendSuffix} />
            </Box>
          )}
        </Flex>

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <Sparkline data={sparkline} variant={variant} />
        )}

        {/* Footer - Target or Subtitle */}
        {(target || subtitle) && (
          <Text fontSize="12px" color={colors.text.muted}>
            {target ? `Target: ${target}` : subtitle}
          </Text>
        )}
      </Flex>
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

  const colorMap = {
    default: colors.neutral[400],
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
    primary: colors.primary[500],
  };

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((max - value) / range) * height;
    return `${x},${y}`;
  });

  return (
    <Box h={`${height}px`} w="100%" overflow="hidden">
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
    </Box>
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
  color = colors.primary[500],
  subtitle,
}: BigNumberCardProps) {
  return (
    <Card variant="elevated">
      <Flex direction="column" gap={spacing.sm}>
        <Text fontSize="14px" fontWeight={500} color={colors.text.muted}>
          {title}
        </Text>

        <Flex align="baseline" gap={spacing.xs}>
          <Text
            fontSize="48px"
            fontWeight={700}
            color={color}
            lineHeight={1}
            letterSpacing="-0.02em"
          >
            {value}
          </Text>
          {unit && (
            <Text fontSize="24px" fontWeight={500} color={colors.text.muted}>
              {unit}
            </Text>
          )}
        </Flex>

        {trend && (
          <Text fontSize="14px" color={colors.semantic.success}>
            {trend}
          </Text>
        )}

        {subtitle && (
          <Text fontSize="12px" color={colors.text.muted}>
            {subtitle}
          </Text>
        )}
      </Flex>
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
    <Grid
      templateColumns={{
        base: '1fr',
        sm: 'repeat(2, 1fr)',
        lg: 'repeat(4, 1fr)',
      }}
      gap={spacing.lg}
    >
      {children}
    </Grid>
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
  const style = variantStyles[variant];

  return (
    <Flex align="center" gap={spacing.sm}>
      <Box
        w="8px"
        h="8px"
        borderRadius="full"
        bg={style.iconColor}
      />
      <Flex direction="column">
        <Text fontSize="12px" color={colors.text.muted}>
          {label}
        </Text>
        <Text fontSize="16px" fontWeight={600} color={style.valueColor}>
          {value}
        </Text>
      </Flex>
    </Flex>
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
    <Card variant="bordered">
      <Flex direction="column" gap={spacing.sm}>
        <Flex justify="space-between" align="center">
          <Text fontSize="14px" fontWeight={500} color={colors.text.primary}>
            {title}
          </Text>
          <StatusBadge status={status} />
        </Flex>

        {details && (
          <Text fontSize="12px" color={colors.text.muted}>
            {details}
          </Text>
        )}

        {lastCheck && (
          <Text fontSize="11px" color={colors.text.disabled}>
            Last check: {lastCheck}
          </Text>
        )}
      </Flex>
    </Card>
  );
}
