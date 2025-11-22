'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
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
import { colors, spacing, shadows } from '@/theme';
import Button from './Button';

/**
 * Loading Spinner Component
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Spinner({ size = 'md', color = colors.primary[500] }: SpinnerProps) {
  const sizeMap = { sm: '16px', md: '24px', lg: '40px' };
  const borderMap = { sm: '2px', md: '3px', lg: '4px' };

  return (
    <Box
      w={sizeMap[size]}
      h={sizeMap[size]}
      border={`${borderMap[size]} solid ${colors.neutral[200]}`}
      borderTopColor={color}
      borderRadius="50%"
      animation="states-spin 0.8s linear infinite"
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
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={spacing['2xl']}
      gap={spacing.md}
    >
      <Spinner size={size} />
      <Text fontSize="14px" color={colors.text.muted}>
        {message}
      </Text>
    </Flex>
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

export function EmptyState({
  type = 'data',
  title,
  description,
  action,
}: EmptyStateProps) {
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

  const config = typeConfig[type];
  const IconComponent = config.Icon;

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={spacing['3xl']}
      px={spacing.xl}
      textAlign="center"
    >
      <Flex
        align="center"
        justify="center"
        w="80px"
        h="80px"
        borderRadius="full"
        bg={colors.neutral[100]}
        mb={spacing.lg}
      >
        <IconComponent size={32} color={colors.neutral[400]} />
      </Flex>

      <Text
        fontSize="20px"
        fontWeight={600}
        color={colors.text.primary}
        mb={spacing.xs}
      >
        {title || config.defaultTitle}
      </Text>

      <Text
        fontSize="14px"
        color={colors.text.muted}
        maxW="400px"
        mb={action ? spacing.lg : 0}
      >
        {description || config.defaultDescription}
      </Text>

      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Flex>
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
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={spacing['3xl']}
      px={spacing.xl}
      textAlign="center"
    >
      <Flex
        align="center"
        justify="center"
        w="80px"
        h="80px"
        borderRadius="full"
        bg={colors.accent[100]}
        mb={spacing.lg}
      >
        <AlertCircle size={32} color={colors.accent[500]} />
      </Flex>

      <Text
        fontSize="20px"
        fontWeight={600}
        color={colors.text.primary}
        mb={spacing.xs}
      >
        {title}
      </Text>

      <Text
        fontSize="14px"
        color={colors.text.muted}
        maxW="400px"
        mb={onRetry ? spacing.lg : 0}
      >
        {message}
      </Text>

      {onRetry && (
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </Flex>
  );
}

/**
 * Skeleton Loader - For content placeholders
 */
interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
}: SkeletonProps) {
  return (
    <Box
      w={width}
      h={height}
      borderRadius={borderRadius}
      bg={colors.neutral[200]}
      animation="states-pulse 1.5s ease-in-out infinite"
    />
  );
}

// Add keyframes via style tag injection
if (typeof document !== 'undefined') {
  const styleId = 'states-keyframes';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.textContent = `
      @keyframes states-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes states-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(styleTag);
  }
}

/**
 * Card Skeleton - For card loading states
 */
export function CardSkeleton() {
  return (
    <Box
      bg={colors.background}
      borderRadius="12px"
      p={spacing.lg}
      boxShadow={shadows.card}
    >
      <Skeleton height="24px" width="60%" />
      <Box h={spacing.md} />
      <Skeleton height="14px" width="100%" />
      <Box h={spacing.xs} />
      <Skeleton height="14px" width="80%" />
      <Box h={spacing.lg} />
      <Skeleton height="40px" width="120px" borderRadius="8px" />
    </Box>
  );
}

/**
 * Metric Card Skeleton
 */
export function MetricSkeleton() {
  return (
    <Box
      bg={colors.background}
      borderRadius="12px"
      p={spacing.lg}
      boxShadow={shadows.card}
    >
      <Skeleton height="14px" width="80px" />
      <Box h={spacing.md} />
      <Skeleton height="40px" width="120px" />
      <Box h={spacing.sm} />
      <Skeleton height="16px" width="60px" />
    </Box>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <Flex gap={spacing.md} py={spacing.sm}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === 0 ? '30%' : `${70 / (columns - 1)}%`}
        />
      ))}
    </Flex>
  );
}
