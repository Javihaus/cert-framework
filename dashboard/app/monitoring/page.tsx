'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import {
  Monitor,
  Activity,
  Shield,
  DollarSign,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

// Theme
import { colors, spacing, containers } from '@/theme';

// Components
import Navigation, { NavigationSection } from '@/components/Navigation';
import MetricCard, { MetricsBar, BigNumberCard } from '@/components/MetricCard';
import Card, { CardTitle } from '@/components/Card';
import Alert, { ActionableAlert } from '@/components/Alert';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import QuickActions from '@/components/QuickActions';
import LiveTraceMonitor from '@/components/LiveTraceMonitor';
import CanaryStatus from '@/components/CanaryStatus';
import { LoadingState, EmptyState } from '@/components/States';

/**
 * Professional Monitoring Dashboard
 * Real-time LLM monitoring with live metrics, traces, and alerts
 */
export default function MonitoringDashboard() {
  const [activeSection, setActiveSection] =
    useState<NavigationSection>('monitoring');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in production these would come from APIs/WebSockets
  const mockMetrics = {
    activeMonitors: 12,
    complianceScore: 94,
    hallucinationRate: 0.3,
    monthlyCost: 2847,
    // Sparkline data
    monitorHistory: [10, 11, 12, 11, 13, 12, 14, 12, 11, 12],
    complianceHistory: [91, 92, 93, 94, 93, 94, 95, 94, 93, 94],
    costHistory: [2500, 2600, 2700, 2800, 2750, 2900, 2850, 2800, 2900, 2847],
  };

  const alerts = [
    {
      id: '1',
      message:
        'Drift detected in customer-support-bot: 23% deviation from baseline',
      severity: 'high' as const,
      timestamp: '2 min ago',
    },
    {
      id: '2',
      message: 'Latency spike detected on /api/analyze endpoint (avg 2.3s)',
      severity: 'warning' as const,
      timestamp: '15 min ago',
    },
  ];

  return (
    <Box minH="100vh" bg={colors.surface}>
      {/* Navigation */}
      <Navigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        notificationCount={alerts.length}
        userName="John Doe"
      />

      {/* Main Content */}
      <Box maxW={containers.contentWide} mx="auto" p={spacing.lg}>
        {/* Page Header */}
        <Flex
          justify="space-between"
          align="center"
          mb={spacing.xl}
          flexWrap="wrap"
          gap={spacing.md}
        >
          <Box>
            <Text
              fontSize="32px"
              fontWeight={600}
              color={colors.text.primary}
              letterSpacing="-0.01em"
            >
              Monitoring Dashboard
            </Text>
            <Text fontSize="14px" color={colors.text.muted} mt={spacing.xs}>
              Real-time LLM performance and compliance monitoring
            </Text>
          </Box>

          <Flex gap={spacing.sm}>
            <Button variant="secondary" icon={<TrendingUp size={16} />}>
              View Reports
            </Button>
            <Button variant="primary" icon={<Activity size={16} />}>
              Run Health Check
            </Button>
          </Flex>
        </Flex>

        {/* Key Metrics Row */}
        <Box mb={spacing.xl}>
          <MetricsBar>
            <MetricCard
              label="Active Monitors"
              value={mockMetrics.activeMonitors}
              icon={Monitor}
              variant="primary"
              trend={12}
              trendSuffix="%"
              sparkline={mockMetrics.monitorHistory}
            />
            <MetricCard
              label="Compliance Score"
              value={`${mockMetrics.complianceScore}%`}
              icon={Shield}
              variant="success"
              trend={2}
              target=">95%"
              sparkline={mockMetrics.complianceHistory}
            />
            <MetricCard
              label="Hallucination Rate"
              value={`${mockMetrics.hallucinationRate}%`}
              icon={AlertCircle}
              variant="success"
              trend={-0.1}
              target="<1%"
            />
            <MetricCard
              label="Monthly Cost"
              value={`€${mockMetrics.monthlyCost.toLocaleString()}`}
              icon={DollarSign}
              variant="default"
              trend={-15}
              subtitle="vs last month"
              sparkline={mockMetrics.costHistory}
            />
          </MetricsBar>
        </Box>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Box mb={spacing.xl}>
            <Flex align="center" gap={spacing.sm} mb={spacing.md}>
              <Text
                fontSize="14px"
                fontWeight={500}
                color={colors.text.muted}
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                Active Alerts
              </Text>
              <Badge variant="error" size="sm">
                {alerts.length}
              </Badge>
            </Flex>

            <Flex direction="column" gap={spacing.sm}>
              {alerts.map((alert) => (
                <ActionableAlert
                  key={alert.id}
                  message={alert.message}
                  severity={alert.severity}
                  timestamp={alert.timestamp}
                  onInvestigate={() => console.log('Investigating:', alert.id)}
                  onDismiss={() => console.log('Dismissed:', alert.id)}
                />
              ))}
            </Flex>
          </Box>
        )}

        {/* Main Content Grid */}
        <Grid
          templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
          gap={spacing.lg}
          mb={spacing.xl}
        >
          {/* Live Traces */}
          <LiveTraceMonitor
            maxTraces={8}
            onTraceClick={(trace) => console.log('Trace clicked:', trace)}
          />

          {/* Canary Status */}
          <CanaryStatus />
        </Grid>

        {/* Quick Actions */}
        <QuickActions
          onRunCheck={() => console.log('Running compliance check...')}
          onExportReport={() => console.log('Exporting report...')}
          onAddMonitor={() => console.log('Adding monitor...')}
          onConfigure={() => console.log('Opening configuration...')}
        />
      </Box>

      {/* Footer */}
      <Box
        mt={spacing['2xl']}
        py={spacing.lg}
        borderTop={`1px solid ${colors.border.light}`}
        bg={colors.background}
      >
        <Box maxW={containers.contentWide} mx="auto" px={spacing.lg}>
          <Flex justify="space-between" align="center">
            <Text fontSize="12px" color={colors.text.muted}>
              CERT Framework v2.0 - Professional AI Compliance Monitoring
            </Text>
            <Flex gap={spacing.lg}>
              <Link href="/privacy">
                <Text
                  fontSize="12px"
                  color={colors.text.muted}
                  cursor="pointer"
                  _hover={{ color: colors.primary[500] }}
                >
                  Privacy Policy
                </Text>
              </Link>
              <Box
                as="a"
                href="https://github.com/cert-framework"
                target="_blank"
                rel="noopener noreferrer"
                fontSize="12px"
                color={colors.text.muted}
                cursor="pointer"
                _hover={{ color: colors.primary[500] }}
              >
                Documentation
              </Box>
            </Flex>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
