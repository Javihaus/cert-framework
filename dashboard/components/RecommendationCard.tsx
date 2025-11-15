'use client';

import { Box, Flex, Text, Button } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { TrendingDown, Database, Scissors, Zap } from 'lucide-react';

interface RecommendationCardProps {
  type: 'model_downgrade' | 'caching' | 'prompt_optimization' | 'batching';
  description: string;
  savings: string;
  impact?: 'high' | 'medium' | 'low';
  details?: string;
  onApply?: () => void;
}

export default function RecommendationCard({
  type,
  description,
  savings,
  impact = 'medium',
  details,
  onApply,
}: RecommendationCardProps) {
  const typeConfig = {
    model_downgrade: {
      icon: TrendingDown,
      label: 'Model Downgrade',
      color: colors.cobalt,
      emoji: '⬇️',
    },
    caching: {
      icon: Database,
      label: 'Response Caching',
      color: colors.olive,
      emoji: '💾',
    },
    prompt_optimization: {
      icon: Scissors,
      label: 'Prompt Optimization',
      color: colors.navy,
      emoji: '✂️',
    },
    batching: {
      icon: Zap,
      label: 'Request Batching',
      color: colors.gold,
      emoji: '⚡',
    },
  };

  const impactConfig = {
    high: { color: colors.olive, label: 'High Impact' },
    medium: { color: colors.gold, label: 'Medium Impact' },
    low: { color: colors.patience, label: 'Low Impact' },
  };

  const config = typeConfig[type];
  const impactInfo = impactConfig[impact];
  const Icon = config.icon;

  return (
    <Card>
      <Flex gap={spacing.md} align="start">
        {/* Icon */}
        <Box
          fontSize="3xl"
          lineHeight="1"
          flexShrink={0}
          color={config.color}
        >
          <Icon size={32} />
        </Box>

        {/* Content */}
        <Flex direction="column" flex={1} gap={spacing.sm}>
          {/* Header */}
          <Flex justify="space-between" align="start">
            <Flex direction="column" gap={spacing.xs}>
              <Text
                fontSize={typography.fontSize.lg}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
              >
                {config.label}
              </Text>
              <Text
                fontSize={typography.fontSize.sm}
                color={colors.text.secondary}
              >
                {description}
              </Text>
            </Flex>

            {/* Impact badge */}
            <Box
              px={spacing.sm}
              py={spacing.xs}
              borderRadius="full"
              bg={impactInfo.color + '20'}
              border="1px solid"
              borderColor={impactInfo.color}
            >
              <Text
                fontSize={typography.fontSize.xs}
                fontWeight={typography.fontWeight.medium}
                color={impactInfo.color}
              >
                {impactInfo.label}
              </Text>
            </Box>
          </Flex>

          {/* Details */}
          {details && (
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              {details}
            </Text>
          )}

          {/* Savings and action */}
          <Flex justify="space-between" align="center" mt={spacing.xs}>
            <Text
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.bold}
              color={colors.olive}
            >
              {savings}
            </Text>

            {onApply && (
              <Button
                onClick={onApply}
                size="sm"
                bg={colors.cobalt}
                color="white"
                _hover={{ bg: colors.navy }}
              >
                View Details
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
