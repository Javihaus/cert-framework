import { Box, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

export default function Footer() {
  return (
    <Box
      as="footer"
      borderTop="1px solid"
      borderColor={colors.patience}
      py="24px"
      mt="auto"
      bg="white"
    >
      <Box maxW="1600px" mx="auto" px="32px">
        <Text
          fontSize="14px"
          color={colors.text.muted}
          textAlign="center"
        >
          Copyright Javier Marín, 2025
        </Text>
      </Box>
    </Box>
  );
}
