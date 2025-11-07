'use client';

import { Box, Text, Heading, VStack, Link } from '@chakra-ui/react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';

export default function PrivacyPolicy() {
  return (
    <Box minH="100vh" bg={colors.background} display="flex" flexDirection="column">
      <Navigation activeTab="privacy" onTabChange={() => {}} hasData={false} />

      <Box maxW="900px" mx="auto" px="32px" py="48px" flex="1">
        <Card style={{ borderColor: colors.patience }}>
          <VStack align="stretch" gap="32px">
            {/* Header */}
            <Box>
              <Heading as="h1" fontSize="42px" fontWeight="700" color={colors.navy} mb="12px">
                Privacy Policy
              </Heading>
              <Text fontSize="16px" color={colors.text.muted}>
                Effective Date: November 7, 2025
              </Text>
            </Box>

            {/* Data Processing */}
            <Box>
              <Heading as="h2" fontSize="28px" fontWeight="700" color={colors.navy} mb="16px">
                Data Processing
              </Heading>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary} mb="16px">
                When you use the CERT Framework dashboard, all file processing occurs locally in your web browser. We do not receive, store, or have access to your uploaded files or the data they contain.
              </Text>
              <Box as="ul" pl="24px" fontSize="16px" lineHeight="1.8" color={colors.text.primary}>
                <Box as="li" mb="8px">Your trace files never leave your computer</Box>
                <Box as="li" mb="8px">PDF reports are generated in your browser</Box>
                <Box as="li" mb="8px">No data is sent to our servers</Box>
                <Box as="li" mb="8px">No data is stored in databases or logs</Box>
              </Box>
            </Box>

            {/* Information We Collect */}
            <Box>
              <Heading as="h2" fontSize="28px" fontWeight="700" color={colors.navy} mb="16px">
                Information We Collect
              </Heading>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary} mb="16px">
                The CERT Framework dashboard collects minimal operational data:
              </Text>
              <Box as="ul" pl="24px" fontSize="16px" lineHeight="1.8" color={colors.text.primary} mb="16px">
                <Box as="li" mb="8px">Basic usage analytics (page views, feature usage)</Box>
                <Box as="li" mb="8px">Technical error logs (for debugging purposes only)</Box>
              </Box>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary} fontWeight="600" mb="8px">
                We do NOT collect:
              </Text>
              <Box as="ul" pl="24px" fontSize="16px" lineHeight="1.8" color={colors.text.primary}>
                <Box as="li" mb="8px">Uploaded file contents</Box>
                <Box as="li" mb="8px">Evaluation results</Box>
                <Box as="li" mb="8px">Any data from your AI systems</Box>
              </Box>
            </Box>

            {/* Third-Party Services */}
            <Box>
              <Heading as="h2" fontSize="28px" fontWeight="700" color={colors.navy} mb="16px">
                Third-Party Services
              </Heading>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary}>
                Our dashboard is hosted on Vercel. While we don't send your evaluation data to servers, Vercel may collect standard web hosting analytics (IP addresses, page load times) as part of their infrastructure.
              </Text>
            </Box>

            {/* GDPR Rights */}
            <Box>
              <Heading as="h2" fontSize="28px" fontWeight="700" color={colors.navy} mb="16px">
                Your Rights (GDPR)
              </Heading>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary} mb="16px">
                Under the General Data Protection Regulation, you have rights to:
              </Text>
              <Box as="ul" pl="24px" fontSize="16px" lineHeight="1.8" color={colors.text.primary} mb="16px">
                <Box as="li" mb="8px">Access any personal data we hold</Box>
                <Box as="li" mb="8px">Request deletion of your data</Box>
                <Box as="li" mb="8px">Object to processing</Box>
                <Box as="li" mb="8px">Lodge a complaint with your supervisory authority</Box>
              </Box>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary}>
                Since we don't store your evaluation data, these rights are automatically fulfilled - we cannot access what we never collected.
              </Text>
            </Box>

            {/* Contact */}
            <Box>
              <Heading as="h2" fontSize="28px" fontWeight="700" color={colors.navy} mb="16px">
                Contact
              </Heading>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary} mb="12px">
                For privacy questions:{' '}
                <Link href="mailto:privacy@cert-framework.com" color={colors.cobalt} textDecoration="underline">
                  privacy@cert-framework.com
                </Link>
              </Text>
              <Text fontSize="16px" lineHeight="1.8" color={colors.text.primary}>
                Data Controller:<br />
                CERT Framework<br />
                Madrid, Spain
              </Text>
            </Box>

            {/* Updates */}
            <Box bg={colors.patience} p="24px" borderRadius="12px">
              <Heading as="h3" fontSize="18px" fontWeight="700" color={colors.navy} mb="12px">
                Policy Updates
              </Heading>
              <Text fontSize="15px" lineHeight="1.7" color={colors.text.primary}>
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated effective date. Your continued use of the dashboard after such changes constitutes acceptance of the updated policy.
              </Text>
            </Box>
          </VStack>
        </Card>
      </Box>

      <Footer />
    </Box>
  );
}
