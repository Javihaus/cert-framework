'use client';

import { Box, Flex, Text, Grid } from '@chakra-ui/react';
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
import Badge, { StatusBadge } from './Badge';
import { colors, spacing, borderRadius, transitions } from '@/theme';

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
    <Card variant="elevated" padding={spacing.lg}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={spacing.lg}>
        <Flex align="center" gap={spacing.sm}>
          <Flex
            align="center"
            justify="center"
            w="32px"
            h="32px"
            borderRadius={borderRadius.md}
            bg={colors.primary[100]}
          >
            <Bird size={16} color={colors.primary[700]} />
          </Flex>
          <CardTitle>Canary Status</CardTitle>
        </Flex>

        {/* Summary Badges */}
        <Flex gap={spacing.xs}>
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
        </Flex>
      </Flex>

      {/* Canary Grid */}
      <Grid
        templateColumns={compact ? '1fr' : { base: '1fr', md: 'repeat(2, 1fr)' }}
        gap={spacing.sm}
      >
        {canaries.map((canary) => (
          <CanaryCard key={canary.id} canary={canary} />
        ))}
      </Grid>
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
      color: colors.semantic.success,
      bg: colors.semantic.successLight,
    },
    warning: {
      icon: AlertTriangle,
      color: colors.semantic.warning,
      bg: colors.semantic.warningLight,
    },
    error: {
      icon: XCircle,
      color: colors.semantic.error,
      bg: colors.semantic.errorLight,
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

  const trendColor =
    canary.trend === 'up'
      ? colors.semantic.success
      : canary.trend === 'down'
        ? colors.semantic.error
        : colors.text.muted;

  return (
    <Flex
      align="center"
      gap={spacing.sm}
      p={spacing.sm}
      borderRadius={borderRadius.md}
      border={`1px solid ${colors.border.light}`}
      bg={colors.neutral[50]}
      transition={transitions.all}
      _hover={{
        borderColor: colors.border.dark,
        bg: colors.neutral[100],
      }}
    >
      {/* Status Icon */}
      <Flex
        align="center"
        justify="center"
        w="28px"
        h="28px"
        borderRadius={borderRadius.sm}
        bg={config.bg}
        flexShrink={0}
      >
        <StatusIcon size={14} color={config.color} />
      </Flex>

      {/* Info */}
      <Flex direction="column" flex={1} minW="0">
        <Text
          fontSize="13px"
          fontWeight={500}
          color={colors.text.primary}
          noOfLines={1}
        >
          {canary.name}
        </Text>
        <Flex align="center" gap={spacing.xs}>
          <Text fontSize="11px" color={colors.text.muted}>
            {canary.consistency.toFixed(1)}% consistent
          </Text>
          {TrendIcon && <TrendIcon size={10} color={trendColor} />}
        </Flex>
      </Flex>

      {/* Response Time */}
      <Flex align="center" gap={spacing.xs} color={colors.text.muted}>
        <Clock size={12} />
        <Text fontSize="11px">{canary.responseTime}ms</Text>
      </Flex>
    </Flex>
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
