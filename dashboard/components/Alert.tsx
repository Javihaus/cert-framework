'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { colors, borderRadius, spacing, transitions } from '@/theme';
import Button from './Button';

type AlertSeverity = 'info' | 'success' | 'warning' | 'error' | 'high';

interface AlertProps {
  children: ReactNode;
  severity?: AlertSeverity;
  title?: string;
  timestamp?: string;
  action?: ReactNode;
  onDismiss?: () => void;
  [key: string]: unknown;
}

/**
 * Professional Alert Component
 * For system alerts, warnings, and notifications
 */
export default function Alert({
  children,
  severity = 'info',
  title,
  timestamp,
  action,
  onDismiss,
  ...rest
}: AlertProps) {
  const severityStyles = {
    info: {
      bg: colors.semantic.infoLight,
      borderColor: colors.semantic.info,
      iconColor: colors.semantic.info,
      Icon: Info,
    },
    success: {
      bg: colors.semantic.successLight,
      borderColor: colors.semantic.success,
      iconColor: colors.semantic.success,
      Icon: CheckCircle,
    },
    warning: {
      bg: colors.semantic.warningLight,
      borderColor: colors.semantic.warning,
      iconColor: colors.semantic.warning,
      Icon: AlertTriangle,
    },
    error: {
      bg: colors.semantic.errorLight,
      borderColor: colors.semantic.error,
      iconColor: colors.semantic.error,
      Icon: AlertCircle,
    },
    high: {
      bg: colors.accent[100],
      borderColor: colors.accent[500],
      iconColor: colors.accent[500],
      Icon: AlertCircle,
    },
  };

  const style = severityStyles[severity];
  const IconComponent = style.Icon;

  return (
    <Box
      bg={style.bg}
      borderLeft={`4px solid ${style.borderColor}`}
      borderRadius={borderRadius.md}
      p={spacing.md}
      transition={transitions.all}
      {...rest}
    >
      <Flex gap={spacing.sm} align="flex-start">
        <Box color={style.iconColor} flexShrink={0} mt="2px">
          <IconComponent size={20} />
        </Box>

        <Box flex={1}>
          {title && (
            <Text
              fontWeight={600}
              fontSize="14px"
              color={colors.text.primary}
              mb={spacing.xs}
            >
              {title}
            </Text>
          )}
          <Text fontSize="14px" color={colors.text.secondary}>
            {children}
          </Text>

          {action && <Box mt={spacing.sm}>{action}</Box>}
        </Box>

        <Flex align="center" gap={spacing.sm} flexShrink={0}>
          {timestamp && (
            <Text fontSize="12px" color={colors.text.muted}>
              {timestamp}
            </Text>
          )}
          {onDismiss && (
            <Box
              as="button"
              p="4px"
              borderRadius={borderRadius.sm}
              color={colors.text.muted}
              cursor="pointer"
              transition={transitions.colors}
              onClick={onDismiss}
              _hover={{ bg: colors.surfaceHover, color: colors.text.primary }}
            >
              <X size={16} />
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

/**
 * Alert List - For displaying multiple alerts
 */
interface AlertListProps {
  children: ReactNode;
  maxVisible?: number;
}

export function AlertList({ children, maxVisible }: AlertListProps) {
  return (
    <Flex direction="column" gap={spacing.sm}>
      {children}
    </Flex>
  );
}

/**
 * Actionable Alert - Pre-configured with investigate button
 */
interface ActionableAlertProps {
  message: string;
  severity?: AlertSeverity;
  timestamp?: string;
  onInvestigate?: () => void;
  onDismiss?: () => void;
}

export function ActionableAlert({
  message,
  severity = 'warning',
  timestamp,
  onInvestigate,
  onDismiss,
}: ActionableAlertProps) {
  return (
    <Alert
      severity={severity}
      timestamp={timestamp}
      onDismiss={onDismiss}
      action={
        onInvestigate && (
          <Button size="sm" variant="primary" onClick={onInvestigate}>
            Investigate
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}
