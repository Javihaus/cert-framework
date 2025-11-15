'use client';

import { useState } from 'react';
import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import FileUpload from '@/components/FileUpload';
import MetricCard from '@/components/MetricCard';
import CostTrendChart from '@/components/CostTrendChart';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Package } from 'lucide-react';
import { Trace, CostSummary } from '@/types/trace';
import { TraceAnalyzer, parseTraceFile } from '@/lib/trace-analyzer';

export default function CostsPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [costData, setCostData] = useState<CostSummary | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  const handleFileLoad = (content: string) => {
    const parsed = parseTraceFile(content);
    setTraces(parsed);
    analyzeCosts(parsed);
  };

  const analyzeCosts = (allTraces: Trace[]) => {
    // Filter by time range
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);

    const filteredTraces =
      timeRange === 'all'
        ? allTraces
        : allTraces.filter((t) => {
            const traceDate = new Date(t.timestamp);
            return traceDate >= cutoff;
          });

    const analyzer = new TraceAnalyzer(filteredTraces);
    const costs = analyzer.calculateCosts();
    setCostData(costs);
  };

  // Convert daily costs to chart format
  const chartData = costData
    ? Object.entries(costData.dailyCosts)
        .map(([date, cost]) => ({
          date,
          cost,
          count: traces.filter((t) => t.timestamp.split('T')[0] === date).length,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  // Calculate trend
  const costTrend = costData && chartData.length >= 2
    ? chartData[chartData.length - 1].cost > chartData[0].cost
      ? 'up'
      : 'down'
    : undefined;

  return (
    <Box p={spacing.xl}>
      {/* Header */}
      <Flex justify="space-between" align="start" mb={spacing.xl}>
        <Box>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
            Cost Analysis
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            Track and analyze AI API costs across platforms
          </Text>
        </Box>

        {costData && (
          <Box w="150px">
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as any);
                analyzeCosts(traces);
              }}
              style={{
                width: '100%',
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: '6px',
                border: `1px solid ${colors.patience}`,
                backgroundColor: 'white',
                fontSize: typography.fontSize.sm,
                cursor: 'pointer',
                color: colors.navy,
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </Box>
        )}
      </Flex>

      {/* File upload */}
      {!costData && (
        <Card>
          <Flex direction="column" align="center" gap={spacing.md} py={spacing.xl}>
            <DollarSign size={48} color={colors.cobalt} />
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Upload trace file to analyze costs
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} textAlign="center" maxW="500px">
              Upload your cert_traces.jsonl file to see detailed cost breakdowns, trends, and projections
            </Text>
            <Box w="100%" maxW="500px">
              <FileUpload onFileLoad={handleFileLoad} accept=".jsonl,.json" label="Upload Trace File" />
            </Box>
          </Flex>
        </Card>
      )}

      {/* Metrics */}
      {costData && (
        <>
          <Grid templateColumns="repeat(4, 1fr)" gap={spacing.md} mb={spacing.lg}>
            <MetricCard
              label="Total Cost"
              value={`$${costData.totalCost.toFixed(2)}`}
              icon={DollarSign}
              variant="default"
            />
            <MetricCard
              label="Projected Monthly"
              value={`$${costData.projectedMonthlyCost.toFixed(2)}`}
              icon={TrendingUp}
              variant={costTrend === 'up' ? 'warning' : 'success'}
            />
            <MetricCard
              label="Avg per Task"
              value={`$${costData.avgPerTask.toFixed(4)}`}
              icon={Calendar}
              variant="default"
            />
            <MetricCard
              label="Platforms Used"
              value={Object.keys(costData.byPlatform).length.toString()}
              icon={Package}
              variant="default"
            />
          </Grid>

          {/* Cost trend chart */}
          <Card mb={spacing.lg}>
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
              Cost Trend
            </Text>
            <Box h="300px">
              <CostTrendChart data={chartData} height={300} showCount={true} />
            </Box>
          </Card>

          {/* Cost by Model */}
          <Grid templateColumns="repeat(2, 1fr)" gap={spacing.lg}>
            <Card>
              <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
                Cost by Model
              </Text>
              <Box overflowX="auto">
                <Flex bg={colors.background} p={spacing.sm} borderBottom="1px solid" borderColor={colors.patience} fontWeight={typography.fontWeight.medium}>
                  <Box flex={2}>Model</Box>
                  <Box flex={1} textAlign="right">
                    Cost
                  </Box>
                  <Box flex={1} textAlign="right">
                    %
                  </Box>
                </Flex>
                {Object.entries(costData.byModel)
                  .sort((a, b) => b[1] - a[1])
                  .map(([model, cost], idx) => (
                    <Flex
                      key={model}
                      p={spacing.sm}
                      bg={idx % 2 === 0 ? 'white' : colors.background}
                      borderBottom="1px solid"
                      borderColor={colors.patience}
                    >
                      <Box flex={2} fontSize={typography.fontSize.sm}>
                        {model}
                      </Box>
                      <Box flex={1} textAlign="right" fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium}>
                        ${cost.toFixed(2)}
                      </Box>
                      <Box flex={1} textAlign="right" fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                        {((cost / costData.totalCost) * 100).toFixed(1)}%
                      </Box>
                    </Flex>
                  ))}
              </Box>
            </Card>

            {/* Cost by Platform */}
            <Card>
              <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
                Cost by Platform
              </Text>
              <Box overflowX="auto">
                <Flex bg={colors.background} p={spacing.sm} borderBottom="1px solid" borderColor={colors.patience} fontWeight={typography.fontWeight.medium}>
                  <Box flex={2}>Platform</Box>
                  <Box flex={1} textAlign="right">
                    Cost
                  </Box>
                  <Box flex={1} textAlign="right">
                    %
                  </Box>
                </Flex>
                {Object.entries(costData.byPlatform)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, cost], idx) => (
                    <Flex
                      key={platform}
                      p={spacing.sm}
                      bg={idx % 2 === 0 ? 'white' : colors.background}
                      borderBottom="1px solid"
                      borderColor={colors.patience}
                    >
                      <Box flex={2} fontSize={typography.fontSize.sm}>
                        {platform}
                      </Box>
                      <Box flex={1} textAlign="right" fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium}>
                        ${cost.toFixed(2)}
                      </Box>
                      <Box flex={1} textAlign="right" fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                        {((cost / costData.totalCost) * 100).toFixed(1)}%
                      </Box>
                    </Flex>
                  ))}
              </Box>
            </Card>
          </Grid>
        </>
      )}
    </Box>
  );
}
