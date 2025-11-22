'use client';

import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import { ReactNode } from 'react';
import {
  Play,
  Download,
  Settings,
  Plus,
  Search,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { colors, spacing, borderRadius, transitions } from '@/theme';

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

/**
 * Quick Action Card Component
 */
export function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  variant = 'default',
}: QuickActionCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <Flex
      as="button"
      direction="column"
      align="flex-start"
      gap={spacing.sm}
      p={spacing.lg}
      borderRadius={borderRadius.lg}
      bg={isPrimary ? colors.primary[700] : colors.background}
      border={isPrimary ? 'none' : `1px solid ${colors.border.default}`}
      cursor="pointer"
      transition={transitions.all}
      textAlign="left"
      onClick={onClick}
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderColor: isPrimary ? undefined : colors.primary[500],
        bg: isPrimary ? colors.primary[500] : colors.background,
      }}
    >
      <Flex
        align="center"
        justify="center"
        w="40px"
        h="40px"
        borderRadius={borderRadius.md}
        bg={isPrimary ? 'rgba(255,255,255,0.2)' : colors.primary[100]}
        color={isPrimary ? colors.text.inverse : colors.primary[700]}
      >
        {icon}
      </Flex>

      <Box>
        <Text
          fontSize="16px"
          fontWeight={600}
          color={isPrimary ? colors.text.inverse : colors.text.primary}
          mb={spacing.xs}
        >
          {title}
        </Text>
        <Text
          fontSize="13px"
          color={isPrimary ? 'rgba(255,255,255,0.8)' : colors.text.muted}
        >
          {description}
        </Text>
      </Box>
    </Flex>
  );
}

/**
 * Legacy Quick Actions Props - for backward compatibility
 */
interface LegacyQuickActionsProps {
  onViewFailed: () => void;
  onViewDistribution: () => void;
  onExport: () => void;
}

/**
 * New Quick Actions Props
 */
interface QuickActionsProps {
  onRunCheck?: () => void;
  onExportReport?: () => void;
  onConfigure?: () => void;
  onAddMonitor?: () => void;
  // Legacy props
  onViewFailed?: () => void;
  onViewDistribution?: () => void;
  onExport?: () => void;
}

/**
 * Quick Actions Grid Component
 */
export default function QuickActions({
  onRunCheck,
  onExportReport,
  onConfigure,
  onAddMonitor,
  onViewFailed,
  onViewDistribution,
  onExport,
}: QuickActionsProps) {
  // Check if using legacy props
  const isLegacy = onViewFailed || onViewDistribution || onExport;

  if (isLegacy) {
    return (
      <Card variant="elevated" padding={spacing.lg}>
        <Text
          fontSize="18px"
          fontWeight={600}
          color={colors.text.primary}
          mb={spacing.md}
        >
          Quick Actions
        </Text>

        <Flex gap={spacing.sm} flexWrap="wrap">
          {onViewFailed && (
            <Button
              variant="primary"
              icon={<Search size={18} />}
              onClick={onViewFailed}
            >
              Investigate Failed Traces
            </Button>
          )}
          {onExport && (
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              onClick={onExport}
            >
              Export to CSV
            </Button>
          )}
          {onViewDistribution && (
            <Button
              variant="secondary"
              icon={<BarChart3 size={18} />}
              onClick={onViewDistribution}
            >
              View Distribution
            </Button>
          )}
        </Flex>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding={spacing.lg}>
      <Text
        fontSize="14px"
        fontWeight={500}
        color={colors.text.muted}
        mb={spacing.md}
      >
        Quick Actions
      </Text>

      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={spacing.md}
      >
        <QuickActionCard
          icon={<Play size={20} />}
          title="Run Compliance Check"
          description="Execute full compliance scan"
          onClick={onRunCheck || (() => {})}
          variant="primary"
        />

        <QuickActionCard
          icon={<Download size={20} />}
          title="Export Report"
          description="Generate EU AI Act document"
          onClick={onExportReport || (() => {})}
        />

        <QuickActionCard
          icon={<Plus size={20} />}
          title="Add Monitor"
          description="Track a new endpoint"
          onClick={onAddMonitor || (() => {})}
        />

        <QuickActionCard
          icon={<Settings size={20} />}
          title="Configure"
          description="Manage alert rules"
          onClick={onConfigure || (() => {})}
        />
      </Grid>
    </Card>
  );
}

/**
 * Inline Quick Actions - Horizontal button bar
 */
interface InlineActionsProps {
  actions: Array<{
    icon: ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  }>;
}

export function InlineActions({ actions }: InlineActionsProps) {
  return (
    <Flex gap={spacing.sm} flexWrap="wrap">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'secondary'}
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </Flex>
  );
}

/**
 * Action Link - Text link with arrow
 */
interface ActionLinkProps {
  children: ReactNode;
  onClick: () => void;
}

export function ActionLink({ children, onClick }: ActionLinkProps) {
  return (
    <Flex
      as="button"
      align="center"
      gap={spacing.xs}
      color={colors.primary[500]}
      fontSize="14px"
      fontWeight={500}
      cursor="pointer"
      transition={transitions.colors}
      onClick={onClick}
      _hover={{
        color: colors.primary[700],
      }}
    >
      {children}
      <ArrowRight size={14} />
    </Flex>
  );
}
