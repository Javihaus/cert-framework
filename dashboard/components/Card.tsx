'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { colors, borderRadius, spacing, shadows, transitions } from '@/theme';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  padding?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  [key: string]: unknown;
}

interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
}

interface CardContentProps {
  children: ReactNode;
}

/**
 * Professional Card Component
 * Consistent styling across the dashboard with hover effects
 */
export default function Card({
  children,
  variant = 'default',
  padding = spacing.cardPadding,
  hoverEffect = false,
  onClick,
  ...rest
}: CardProps) {
  const variants = {
    default: {
      bg: colors.surface,
      border: 'none',
      boxShadow: 'none',
    },
    bordered: {
      bg: colors.background,
      border: `1px solid ${colors.border.default}`,
      boxShadow: 'none',
    },
    elevated: {
      bg: colors.background,
      border: 'none',
      boxShadow: shadows.card,
    },
    interactive: {
      bg: colors.background,
      border: `1px solid ${colors.border.default}`,
      boxShadow: shadows.card,
    },
  };

  const style = variants[variant];
  const isInteractive = hoverEffect || onClick || variant === 'interactive';

  return (
    <Box
      bg={style.bg}
      border={style.border}
      borderRadius={borderRadius.lg}
      p={padding}
      boxShadow={style.boxShadow}
      transition={transitions.all}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={
        isInteractive
          ? {
              transform: 'translateY(-2px)',
              boxShadow: shadows.cardHover,
              borderColor: colors.primary[500],
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </Box>
  );
}

/**
 * Card Header with optional action button
 */
export function CardHeader({ children, action }: CardHeaderProps) {
  return (
    <Flex
      justify="space-between"
      align="center"
      mb={spacing.md}
      pb={spacing.md}
      borderBottom={`1px solid ${colors.border.light}`}
    >
      <Box>{children}</Box>
      {action && <Box>{action}</Box>}
    </Flex>
  );
}

/**
 * Card Content wrapper
 */
export function CardContent({ children }: CardContentProps) {
  return <Box>{children}</Box>;
}

/**
 * Card Title component for consistent heading styling
 */
export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      fontSize="20px"
      fontWeight={600}
      color={colors.text.primary}
      lineHeight={1.4}
    >
      {children}
    </Text>
  );
}

/**
 * Card Description for secondary text
 */
export function CardDescription({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="14px" color={colors.text.muted} mt={spacing.xs}>
      {children}
    </Text>
  );
}
