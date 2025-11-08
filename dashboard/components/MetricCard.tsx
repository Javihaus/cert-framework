import { Box, Flex, Text } from '@chakra-ui/react';
import Card from './Card';
import { colors, spacing, typography } from '@/theme';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variants = {
  default: {
    iconColor: colors.cobalt,
    valueColor: colors.navy,
  },
  success: {
    iconColor: colors.success,
    valueColor: colors.navy,
  },
  warning: {
    iconColor: colors.coral,
    valueColor: colors.navy,
  },
  error: {
    iconColor: colors.error,
    valueColor: colors.navy,
  },
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  variant = 'default'
}: MetricCardProps) {
  const style = variants[variant];

  return (
    <Card>
      <Flex direction="column" gap={spacing.md}>
        {/* Icon + Label Row */}
        <Flex align="center" justify="space-between">
          <Text
            fontSize={typography.fontSize.sm}
            fontWeight={typography.fontWeight.semibold}
            color={colors.text.secondary}
            textTransform="uppercase"
            letterSpacing={typography.letterSpacing.wide}
          >
            {label}
          </Text>
          <Icon
            size={20}
            color={style.iconColor}
            strokeWidth={2}
          />
        </Flex>

        {/* Value */}
        <Text
          fontSize={typography.fontSize['3xl']}
          fontWeight={typography.fontWeight.bold}
          color={style.valueColor}
          lineHeight={typography.lineHeight.tight}
        >
          {value}
        </Text>
      </Flex>
    </Card>
  );
}
