'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { colors, borderRadius, spacing, componentTokens } from '@/theme';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pro';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  [key: string]: unknown;
}

/**
 * Professional Badge Component
 * For status indicators, labels, and counts
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  ...rest
}: BadgeProps) {
  const sizeStyles = componentTokens.badge[size];

  const variantStyles = {
    default: {
      bg: colors.neutral[100],
      color: colors.text.secondary,
      dotColor: colors.neutral[400],
    },
    primary: {
      bg: colors.primary[100],
      color: colors.primary[700],
      dotColor: colors.primary[500],
    },
    success: {
      bg: colors.semantic.successLight,
      color: colors.semantic.successDark,
      dotColor: colors.semantic.success,
    },
    warning: {
      bg: colors.semantic.warningLight,
      color: colors.semantic.warningDark,
      dotColor: colors.semantic.warning,
    },
    error: {
      bg: colors.semantic.errorLight,
      color: colors.semantic.errorDark,
      dotColor: colors.semantic.error,
    },
    info: {
      bg: colors.semantic.infoLight,
      color: colors.semantic.infoDark,
      dotColor: colors.semantic.info,
    },
    pro: {
      bg: colors.primary[700],
      color: colors.text.inverse,
      dotColor: colors.text.inverse,
    },
  };

  const style = variantStyles[variant];

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      gap={spacing.xs}
      h={sizeStyles.height}
      px={sizeStyles.padding}
      fontSize={sizeStyles.fontSize}
      fontWeight={500}
      borderRadius={sizeStyles.borderRadius}
      bg={style.bg}
      color={style.color}
      whiteSpace="nowrap"
      {...rest}
    >
      {dot && (
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg={style.dotColor}
          flexShrink={0}
        />
      )}
      {icon && (
        <Box as="span" display="flex" fontSize="12px">
          {icon}
        </Box>
      )}
      {children}
    </Box>
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
  const statusConfig = {
    healthy: { variant: 'success' as const, label: 'Healthy' },
    active: { variant: 'success' as const, label: 'Active' },
    warning: { variant: 'warning' as const, label: 'Warning' },
    error: { variant: 'error' as const, label: 'Error' },
    inactive: { variant: 'default' as const, label: 'Inactive' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    compliant: { variant: 'success' as const, label: 'Compliant' },
    'non-compliant': { variant: 'error' as const, label: 'Non-Compliant' },
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
    <Badge variant={variant} size={size}>
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
      <Flex align="center" gap="2px">
        <Box as="span" fontSize="10px">
          {isPositive ? '▲' : '▼'}
        </Box>
        {prefix}
        {Math.abs(value)}
        {suffix}
      </Flex>
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
  const riskConfig = {
    minimal: { variant: 'success' as const, label: 'Minimal Risk' },
    limited: { variant: 'info' as const, label: 'Limited Risk' },
    high: { variant: 'warning' as const, label: 'High Risk' },
    unacceptable: { variant: 'error' as const, label: 'Unacceptable' },
  };

  const config = riskConfig[level];

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
}
