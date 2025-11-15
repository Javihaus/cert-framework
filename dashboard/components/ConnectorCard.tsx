'use client';

import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
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
      color: 'green',
      icon: CheckCircle2,
      label: 'Active',
      bg: colors.olive,
    },
    disabled: {
      color: 'gray',
      icon: XCircle,
      label: 'Disabled',
      bg: colors.gray,
    },
    error: {
      color: 'red',
      icon: AlertTriangle,
      label: 'Error',
      bg: colors.alert,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <Flex direction="column" gap={spacing.md}>
        {/* Header with name and status */}
        <Flex justify="space-between" align="center">
          <Flex direction="column" gap={spacing.xs}>
            <Text
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
            >
              {name}
            </Text>
            {description && (
              <Text
                fontSize={typography.fontSize.sm}
                color={colors.text.secondary}
              >
                {description}
              </Text>
            )}
          </Flex>

          <Flex align="center" gap={spacing.xs}>
            <StatusIcon size={20} color={config.color} />
            <Badge
              colorScheme={config.color}
              px={spacing.sm}
              py={spacing.xs}
              borderRadius="full"
              fontSize={typography.fontSize.sm}
            >
              {config.label}
            </Badge>
          </Flex>
        </Flex>

        {/* Metrics */}
        <Flex gap={spacing.lg}>
          <Flex direction="column" flex={1}>
            <Text
              fontSize={typography.fontSize['2xl']}
              fontWeight={typography.fontWeight.bold}
              color={colors.cobalt}
            >
              {tracesLogged.toLocaleString()}
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              traces logged
            </Text>
          </Flex>

          {failureCount > 0 && (
            <Flex direction="column" flex={1}>
              <Text
                fontSize={typography.fontSize['2xl']}
                fontWeight={typography.fontWeight.bold}
                color={colors.alert}
              >
                {failureCount}
              </Text>
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                failures
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Last activity */}
        {lastActivity && (
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            Last activity: {lastActivity}
          </Text>
        )}

        {/* Warning for failures */}
        {failureCount > 0 && (
          <Box
            bg={colors.alert + '20'}
            border="1px solid"
            borderColor={colors.alert}
            borderRadius={borderRadius.md}
            p={spacing.sm}
          >
            <Flex align="center" gap={spacing.xs}>
              <AlertTriangle size={16} color={colors.alert} />
              <Text fontSize={typography.fontSize.sm} color={colors.alert}>
                {failureCount} recent {failureCount === 1 ? 'failure' : 'failures'} detected
              </Text>
            </Flex>
          </Box>
        )}
      </Flex>
    </Card>
  );
}
