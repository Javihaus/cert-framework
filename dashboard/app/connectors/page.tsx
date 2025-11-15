'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Grid, Button, Code } from '@chakra-ui/react';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/tabs';
import ConnectorCard from '@/components/ConnectorCard';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { RefreshCw, Package, Server } from 'lucide-react';

interface Connector {
  name: string;
  status: 'active' | 'disabled' | 'error';
  trace_count: number;
  failure_count: number;
  last_activity?: string;
  description: string;
  platform: string;
  install_command?: string;
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'demo' | 'live'>('demo');

  // Check if running in live mode (self-hosted with API)
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_CERT_API;
    if (apiUrl) {
      setMode('live');
      fetchConnectorStatus();
    } else {
      // Demo mode - show available connectors
      loadDemoData();
    }
  }, []);

  const fetchConnectorStatus = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_CERT_API || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/connectors/status`);
      const data = await response.json();
      setConnectors(data.connectors);
    } catch (error) {
      console.error('Failed to fetch connector status:', error);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    // Demo data showing available connectors
    setConnectors([
      {
        name: 'OpenAI',
        status: 'disabled',
        trace_count: 0,
        failure_count: 0,
        description: 'GPT-4, GPT-3.5, and all OpenAI models',
        platform: 'openai',
        install_command: 'pip install cert-framework[integrations]',
      },
      {
        name: 'Anthropic',
        status: 'disabled',
        trace_count: 0,
        failure_count: 0,
        description: 'Claude 3 Opus, Sonnet, and Haiku',
        platform: 'anthropic',
        install_command: 'pip install cert-framework[integrations]',
      },
      {
        name: 'AWS Bedrock',
        status: 'disabled',
        trace_count: 0,
        failure_count: 0,
        description: 'Claude, Llama, Titan, and more on AWS',
        platform: 'bedrock',
        install_command: 'pip install cert-framework[integrations]',
      },
      {
        name: 'Azure OpenAI',
        status: 'disabled',
        trace_count: 0,
        failure_count: 0,
        description: 'OpenAI models via Azure',
        platform: 'azure',
        install_command: 'pip install cert-framework[integrations]',
      },
      {
        name: 'LangChain',
        status: 'disabled',
        trace_count: 0,
        failure_count: 0,
        description: 'LangChain framework integration',
        platform: 'langchain',
        install_command: 'pip install cert-framework[integrations]',
      },
    ]);
  };

  const activeConnectors = connectors.filter((c) => c.status === 'active');
  const totalTraces = connectors.reduce((sum, c) => sum + c.trace_count, 0);
  const totalFailures = connectors.reduce((sum, c) => sum + c.failure_count, 0);

  return (
    <Box maxW="1400px" mx="auto" p={spacing.xl}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={spacing.xl}>
        <Box>
          <Text
            fontSize={typography.fontSize['3xl']}
            fontWeight={typography.fontWeight.bold}
            color={colors.navy}
            mb={spacing.xs}
          >
            Connector Status
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            Monitor and manage AI platform integrations
          </Text>
        </Box>

        {mode === 'live' && (
          <Button
            leftIcon={<RefreshCw size={16} />}
            onClick={fetchConnectorStatus}
            isLoading={loading}
            bg={colors.cobalt}
            color="white"
            _hover={{ bg: colors.navy }}
          >
            Refresh
          </Button>
        )}
      </Flex>

      {/* Mode indicator */}
      <Card mb={spacing.lg}>
        <Flex align="center" gap={spacing.md}>
          {mode === 'demo' ? (
            <>
              <Package size={24} color={colors.cobalt} />
              <Box flex={1}>
                <Text fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                  Demo Mode
                </Text>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  Showing available connectors. Install CERT locally to see live status.
                </Text>
              </Box>
              <Code
                px={spacing.sm}
                py={spacing.xs}
                borderRadius="md"
                fontSize={typography.fontSize.sm}
              >
                pip install cert-framework[integrations]
              </Code>
            </>
          ) : (
            <>
              <Server size={24} color={colors.olive} />
              <Box flex={1}>
                <Text fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                  Live Mode
                </Text>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  Connected to local CERT API - showing real-time status
                </Text>
              </Box>
            </>
          )}
        </Flex>
      </Card>

      {/* Summary metrics */}
      {mode === 'live' && (
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={spacing.md} mb={spacing.lg}>
          <Card>
            <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.cobalt}>
              {activeConnectors.length}
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              Active Connectors
            </Text>
          </Card>
          <Card>
            <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
              {totalTraces.toLocaleString()}
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              Total Traces
            </Text>
          </Card>
          <Card>
            <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={totalFailures > 0 ? colors.alert : colors.olive}>
              {totalFailures}
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              Failures
            </Text>
          </Card>
        </Grid>
      )}

      {/* Connectors grid */}
      <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={spacing.md}>
        {connectors.map((connector) => (
          <ConnectorCard
            key={connector.name}
            name={connector.name}
            status={connector.status}
            tracesLogged={connector.trace_count}
            failureCount={connector.failure_count}
            lastActivity={connector.last_activity}
            description={connector.description}
          />
        ))}
      </Grid>

      {/* Installation instructions (demo mode only) */}
      {mode === 'demo' && (
        <Card mt={spacing.xl}>
          <Text
            fontSize={typography.fontSize.xl}
            fontWeight={typography.fontWeight.semibold}
            color={colors.navy}
            mb={spacing.md}
          >
            Getting Started
          </Text>

          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList>
              <Tab>Quick Start</Tab>
              <Tab>Manual Activation</Tab>
              <Tab>Self-Hosted Dashboard</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Box as="pre" bg={colors.background} p={spacing.md} borderRadius="md" overflow="auto">
                  <Code>
                    {`# Install with integrations support
pip install cert-framework[integrations]

# Automatic activation (zero-config)
import cert.integrations.auto

# Your LLM calls are now automatically traced!
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)

# Traces are automatically logged to cert_traces.jsonl`}
                  </Code>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box as="pre" bg={colors.background} p={spacing.md} borderRadius="md" overflow="auto">
                  <Code>
                    {`# Manual connector activation
from cert.integrations.registry import activate_all
from cert.core.tracer import CertTracer

tracer = CertTracer()
activate_all(tracer)

# Or activate specific connectors
from cert.integrations.openai_connector import OpenAIConnector
connector = OpenAIConnector(tracer)
connector.activate()`}
                  </Code>
                </Box>
              </TabPanel>

              <TabPanel>
                <Box as="pre" bg={colors.background} p={spacing.md} borderRadius="md" overflow="auto">
                  <Code>
                    {`# Start the CERT API server
cert serve

# In another terminal, set the API URL and start dashboard
export NEXT_PUBLIC_CERT_API=http://localhost:8000
cd dashboard && npm run dev

# Dashboard will now show live connector status`}
                  </Code>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card>
      )}
    </Box>
  );
}
