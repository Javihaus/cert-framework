import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { IconType } from 'react-icons';
import Card from './Card';

interface MetricCardProps {
  label: string;
  value: string;
  icon: IconType;
  color: 'green' | 'red' | 'blue' | 'orange';
}

const colorSchemes = {
  green: {
    bg: 'green.500',
    light: 'green.50',
  },
  red: {
    bg: 'red.500',
    light: 'red.50',
  },
  blue: {
    bg: 'brand.500',
    light: 'brand.50',
  },
  orange: {
    bg: 'orange.500',
    light: 'orange.50',
  },
};

export default function MetricCard({ label, value, icon, color }: MetricCardProps) {
  const scheme = colorSchemes[color];

  return (
    <Card>
      <Flex align="center" justify="space-between" w="100%">
        <Flex direction="column">
          <Text
            color="secondaryGray.600"
            fontSize="sm"
            fontWeight="500"
            mb="4px"
          >
            {label}
          </Text>
          <Text
            color="secondaryGray.900"
            fontSize="34px"
            fontWeight="700"
            lineHeight="100%"
          >
            {value}
          </Text>
        </Flex>
        <Flex
          align="center"
          justify="center"
          bg={scheme.light}
          borderRadius="50%"
          w="56px"
          h="56px"
        >
          <Icon as={icon} w="28px" h="28px" color={scheme.bg} />
        </Flex>
      </Flex>
    </Card>
  );
}
