'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/tabs';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { CheckCircle2, XCircle, Package, Code as CodeIcon, Zap } from 'lucide-react';

interface Connector {
  name: string;
  platform: string;
  status: 'available' | 'planned';
  description: string;
  features: string[];
  installCommand: string;
  usageExample: string;
  releaseDate?: string;
}

const CONNECTORS: Connector[] = [
  {
    name: 'OpenAI',
    platform: 'openai',
    status: 'available',
    description: 'Automatic tracing for OpenAI SDK (chat, completions, embeddings)',
    features: [
      'Zero-code instrumentation',
      'Automatic cost calculation',
      'Token usage tracking',
      'Latency measurement',
      'Error logging',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.auto import *

# That's it! All OpenAI calls are now traced
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Traces automatically logged to cert_traces.jsonl`,
  },
  {
    name: 'Anthropic',
    platform: 'anthropic',
    status: 'available',
    description: 'Automatic tracing for Anthropic SDK (messages, tool use)',
    features: [
      'Zero-code instrumentation',
      'Automatic cost calculation',
      'Token usage tracking',
      'Tool use logging',
      'Streaming support',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.auto import *

# All Anthropic calls are now traced
client = anthropic.Anthropic()
message = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)

# Traces automatically logged to cert_traces.jsonl`,
  },
  {
    name: 'LangChain',
    platform: 'langchain',
    status: 'available',
    description: 'Callback-based tracing for chains, agents, and tools',
    features: [
      'Full chain visibility',
      'Agent action tracking',
      'Tool invocation logs',
      'Retrieval logging',
      'Custom callback support',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.langchain import CertCallbackHandler
from langchain.chains import LLMChain

callback = CertCallbackHandler()

chain = LLMChain(llm=llm, callbacks=[callback])
result = chain.run("Your prompt")

# All chain steps logged to cert_traces.jsonl`,
  },
  {
    name: 'AWS Bedrock',
    platform: 'bedrock',
    status: 'available',
    description: 'boto3 client wrapper for Bedrock models',
    features: [
      'Claude via Bedrock',
      'Cost estimation',
      'Token tracking',
      'Model version logging',
      'Region tracking',
    ],
    installCommand: 'pip install cert-framework[integrations]',
    usageExample: `from cert.integrations.auto import *

# Use boto3 as normal - tracing is automatic
bedrock = boto3.client('bedrock-runtime')
response = bedrock.invoke_model(
    modelId="anthropic.claude-3-sonnet-20240229-v1:0",
    body=json.dumps({"messages": [...]})
)

# Traces automatically logged`,
  },
  {
    name: 'Google Vertex AI',
    platform: 'vertex',
    status: 'planned',
    description: 'Support for Google Vertex AI models',
    features: [
      'Gemini models',
      'PaLM models',
      'Cost tracking',
      'Token usage',
      'Streaming support',
    ],
    installCommand: 'Coming Q2 2026',
    usageExample: '# Implementation planned for Q2 2026',
    releaseDate: 'Q2 2026',
  },
];

export default function ConnectorsPage() {
  const availableConnectors = CONNECTORS.filter((c) => c.status === 'available');
  const plannedConnectors = CONNECTORS.filter((c) => c.status === 'planned');

  return (
    <Box p={spacing.xl}>
      {/* Header */}
      <Flex direction="column" mb={spacing.xl}>
        <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
          Connectors
        </Text>
        <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
          Automatic tracing for all major AI platforms with zero code changes
        </Text>
      </Flex>

      {/* Quick Start */}
      <Card mb={spacing.xl}>
        <Flex align="center" gap={spacing.md} mb={spacing.md}>
          <Zap size={24} color={colors.cobalt} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
            Quick Start
          </Text>
        </Flex>
        <Box bg={colors.background} p={spacing.md} borderRadius="md" fontFamily="mono" fontSize={typography.fontSize.sm} mb={spacing.md}>
          pip install cert-framework[integrations]
        </Box>
        <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
          Then add this single line to your code:
        </Text>
        <Box bg={colors.background} p={spacing.md} borderRadius="md" fontFamily="mono" fontSize={typography.fontSize.sm} mt={spacing.sm}>
          from cert.integrations.auto import *
        </Box>
        <Text fontSize={typography.fontSize.sm} color={colors.olive} mt={spacing.md} fontWeight={typography.fontWeight.medium}>
          ✓ All AI API calls are now automatically traced to cert_traces.jsonl
        </Text>
      </Card>

      {/* Tabs */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList borderBottom="2px solid" borderColor={colors.patience}>
          <Tab
            _selected={{ bg: colors.cobalt, color: 'white' }}
            color={colors.text.secondary}
            fontWeight={typography.fontWeight.medium}
          >
            Available ({availableConnectors.length})
          </Tab>
          <Tab
            _selected={{ bg: colors.cobalt, color: 'white' }}
            color={colors.text.secondary}
            fontWeight={typography.fontWeight.medium}
          >
            Planned ({plannedConnectors.length})
          </Tab>
        </TabList>

        <TabPanels>
          {/* Available Connectors */}
          <TabPanel p={0} pt={spacing.lg}>
            <Flex direction="column" gap={spacing.lg}>
              {availableConnectors.map((connector) => (
                <Card key={connector.platform}>
                  <Flex justify="space-between" align="start" mb={spacing.md}>
                    <Box>
                      <Flex align="center" gap={spacing.sm} mb={spacing.xs}>
                        <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                          {connector.name}
                        </Text>
                        <Flex
                          align="center"
                          gap={spacing.xs}
                          px={spacing.sm}
                          py={spacing.xs}
                          bg={colors.olive + '20'}
                          borderRadius="full"
                        >
                          <CheckCircle2 size={14} color={colors.olive} />
                          <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={colors.olive}>
                            Available
                          </Text>
                        </Flex>
                      </Flex>
                      <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                        {connector.description}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Features */}
                  <Box mb={spacing.md}>
                    <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
                      Features:
                    </Text>
                    <Grid templateColumns="repeat(2, 1fr)" gap={spacing.xs}>
                      {connector.features.map((feature, idx) => (
                        <Flex key={idx} align="center" gap={spacing.xs}>
                          <CheckCircle2 size={14} color={colors.cobalt} />
                          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                            {feature}
                          </Text>
                        </Flex>
                      ))}
                    </Grid>
                  </Box>

                  {/* Installation */}
                  <Box mb={spacing.md}>
                    <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
                      Installation:
                    </Text>
                    <Box bg={colors.background} p={spacing.sm} borderRadius="md" fontFamily="mono" fontSize={typography.fontSize.sm}>
                      {connector.installCommand}
                    </Box>
                  </Box>

                  {/* Usage Example */}
                  <Box>
                    <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
                      Usage Example:
                    </Text>
                    <Box
                      as="pre"
                      bg={colors.navy}
                      color="white"
                      p={spacing.md}
                      borderRadius="md"
                      fontSize={typography.fontSize.xs}
                      overflowX="auto"
                      fontFamily="mono"
                      lineHeight="1.5"
                    >
                      {connector.usageExample}
                    </Box>
                  </Box>
                </Card>
              ))}
            </Flex>
          </TabPanel>

          {/* Planned Connectors */}
          <TabPanel p={0} pt={spacing.lg}>
            <Flex direction="column" gap={spacing.lg}>
              {plannedConnectors.map((connector) => (
                <Card key={connector.platform}>
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Flex align="center" gap={spacing.sm} mb={spacing.xs}>
                        <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                          {connector.name}
                        </Text>
                        <Flex
                          align="center"
                          gap={spacing.xs}
                          px={spacing.sm}
                          py={spacing.xs}
                          bg={colors.patience}
                          borderRadius="full"
                        >
                          <Package size={14} color={colors.text.secondary} />
                          <Text fontSize={typography.fontSize.xs} fontWeight={typography.fontWeight.medium} color={colors.text.secondary}>
                            {connector.releaseDate}
                          </Text>
                        </Flex>
                      </Flex>
                      <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
                        {connector.description}
                      </Text>

                      <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
                        Planned Features:
                      </Text>
                      <Grid templateColumns="repeat(2, 1fr)" gap={spacing.xs}>
                        {connector.features.map((feature, idx) => (
                          <Flex key={idx} align="center" gap={spacing.xs}>
                            <CheckCircle2 size={14} color={colors.mist} />
                            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                              {feature}
                            </Text>
                          </Flex>
                        ))}
                      </Grid>
                    </Box>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
