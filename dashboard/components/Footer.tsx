import { Box, Text, Flex } from '@chakra-ui/react';
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
        <Flex
          direction="column"
          align="center"
          gap="12px"
        >
          <Flex
            gap="16px"
            fontSize="14px"
            color={colors.text.muted}
            flexWrap="wrap"
            justify="center"
          >
            <Text
              as="a"
              href="/privacy"
              _hover={{ color: colors.cobalt, textDecoration: 'underline' }}
              cursor="pointer"
            >
              Privacy Policy
            </Text>
            <Text color={colors.patience}>·</Text>
            <Text
              as="a"
              href="https://github.com/Javihaus/cert-framework"
              target="_blank"
              rel="noopener noreferrer"
              _hover={{ color: colors.cobalt, textDecoration: 'underline' }}
              cursor="pointer"
            >
              GitHub
            </Text>
            <Text color={colors.patience}>·</Text>
            <Text
              as="a"
              href="mailto:privacy@cert-framework.com"
              _hover={{ color: colors.cobalt, textDecoration: 'underline' }}
              cursor="pointer"
            >
              Contact
            </Text>
          </Flex>
          <Text
            fontSize="14px"
            color={colors.text.muted}
            textAlign="center"
          >
            Copyright Javier Marín, 2025
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
