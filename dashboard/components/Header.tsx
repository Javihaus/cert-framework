'use client';

import { Box, Flex, Image, Text } from '@chakra-ui/react';

export default function Header() {
  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px="30px"
      py="20px"
    >
      <Flex align="center" justify="space-between">
        <Flex align="center" gap="12px">
          <Image
            src="/cert-logo.png"
            alt="CERT Logo"
            h="40px"
            w="auto"
          />
          <Box>
            <Text
              fontSize="24px"
              fontWeight="700"
              color="secondaryGray.900"
            >
              CERT Dashboard
            </Text>
            <Text
              fontSize="14px"
              color="secondaryGray.600"
              fontWeight="500"
            >
              EU AI Act Article 15 Compliance Monitoring
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
