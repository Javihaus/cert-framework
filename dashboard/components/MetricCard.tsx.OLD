import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import Card from './Card';
import { colors } from '@/theme/colors';

interface MetricCardProps {
  label: string;
  value: string;
  icon: IconType;
  color: 'green' | 'red' | 'blue' | 'orange';
  bgColor?: string;
}

const colorSchemes = {
  green: {
    bg: colors.success,
    light: '#e8f5e9',
  },
  red: {
    bg: colors.error,
    light: '#fee',
  },
  blue: {
    bg: colors.cobalt,
    light: colors.patience,
  },
  orange: {
    bg: colors.coral,
    light: '#fef5e7',
  },
};

export default function MetricCard({ label, value, icon, color, bgColor }: MetricCardProps) {
  const scheme = colorSchemes[color];

  return (
    <Card style={{ borderColor: colors.patience, backgroundColor: bgColor || 'white' }}>
      <Flex align="center" justify="space-between" w="100%">
        <Flex direction="column">
          <Text
            color={colors.text.muted}
            fontSize="16px"
            fontWeight="600"
            mb="8px"
          >
            {label}
          </Text>
          <Text
            color={colors.navy}
            fontSize="40px"
            fontWeight="700"
            lineHeight="1"
          >
            {value}
          </Text>
        </Flex>
        <Icon as={icon} w="48px" h="48px" color={scheme.bg} />
      </Flex>
    </Card>
  );
}
