import { Box, Flex, Text } from '@chakra-ui/react';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatusBannerProps {
  isCompliant: boolean;
  accuracy: number;
  failedCount: number;
}

export default function StatusBanner({ isCompliant, accuracy, failedCount }: StatusBannerProps) {
  const variant = isCompliant
    ? {
        border: colors.success,
        bg: 'white',
        icon: CheckCircle2,
        iconColor: colors.success,
        title: 'Meets Compliance Threshold',
        message: `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). System ready for deployment.`,
      }
    : {
        border: colors.coral,
        bg: 'white',
        icon: AlertTriangle,
        iconColor: colors.coral,
        title: 'Below Compliance Threshold',
        message: `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). Review ${failedCount} failed traces to identify systematic issues.`,
      };

  const Icon = variant.icon;

  return (
    <Box
      bg={variant.bg}
      border="2px solid"
      borderColor={variant.border}
      borderRadius={borderRadius.lg}
      p={spacing.lg}
      mb={spacing['2xl']}
    >
      <Flex gap={spacing.md} align="flex-start">
        <Icon
          size={24}
          color={variant.iconColor}
          strokeWidth={2}
        />
        <Box flex="1">
          <Text
            fontSize={typography.fontSize.lg}
            fontWeight={typography.fontWeight.semibold}
            color={colors.navy}
            mb={spacing.xs}
          >
            {variant.title}
          </Text>
          <Text
            fontSize={typography.fontSize.base}
            color={colors.text.secondary}
            lineHeight={typography.lineHeight.relaxed}
          >
            {variant.message}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
