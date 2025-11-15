'use client';

import { useState } from 'react';
import { Box, Flex, Text, Grid, Select } from '@chakra-ui/react';
import FileUpload from '@/components/FileUpload';
import MetricCard from '@/components/MetricCard';
import CostTrendChart from '@/components/CostTrendChart';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface Trace {
  timestamp?: string;
  model?: string;
  platform?: string;
  cost?: number;
  input_tokens?: number;
  output_tokens?: number;
  metadata?: any;
}

interface CostData {
  totalCost: number;
  avgCost: number;
  byModel: Record<string, number>;
  byPlatform: Record<string, number>;
  trend: Array<{ date: string; cost: number; count: number }>;
  projectedMonthlyCost: number;
}

export default function CostsPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

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
            const traceDate = new Date(t.timestamp || 0);
            return traceDate >= cutoff;
          });

    // Calculate total cost
    const totalCost = filteredTraces.reduce((sum, t) => sum + (t.cost || 0), 0);
    const avgCost = filteredTraces.length > 0 ? totalCost / filteredTraces.length : 0;

    // Cost by model
    const byModel: Record<string, number> = {};
    filteredTraces.forEach((t) => {
      const model = t.model || 'unknown';
      byModel[model] = (byModel[model] || 0) + (t.cost || 0);
    });

    // Cost by platform
    const byPlatform: Record<string, number> = {};
    filteredTraces.forEach((t) => {
      const platform = t.platform || 'unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + (t.cost || 0);
    });

    // Daily trend
    const dailyCosts: Record<string, { cost: number; count: number }> = {};
    filteredTraces.forEach((t) => {
      const date = t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : 'unknown';
      if (!dailyCosts[date]) {
        dailyCosts[date] = { cost: 0, count: 0 };
      }
      dailyCosts[date].cost += t.cost || 0;
      dailyCosts[date].count += 1;
    });

    const trend = Object.entries(dailyCosts)
      .map(([date, data]) => ({
        date,
        cost: data.cost,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Project monthly cost
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 30;
    const dailyAvg = totalCost / days;
    const projectedMonthlyCost = dailyAvg * 30;

    setCostData({
      totalCost,
      avgCost,
      byModel,
      byPlatform,
      trend,
      projectedMonthlyCost,
    });
  };

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
            Cost Analysis
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            Track and analyze AI API costs across platforms
          </Text>
        </Box>

        {costData && (
          <Select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value as any);
              analyzeCosts(traces);
            }}
            w="150px"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </Select>
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
              Upload your cert_traces.jsonl file to see cost breakdowns, trends, and projections
            </Text>
            <FileUpload
              onFileLoad={(data) => {
                setTraces(data);
                analyzeCosts(data);
              }}
              accept=".jsonl,.json"
              label="Upload Trace File"
            />
          </Flex>
        </Card>
      )}

      {/* Cost summary */}
      {costData && (
        <>
          {/* Metrics grid */}
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={spacing.md} mb={spacing.lg}>
            <MetricCard
              label="Total Cost"
              value={`$${costData.totalCost.toFixed(4)}`}
              icon={DollarSign}
            />
            <MetricCard
              label="Average per Request"
              value={`$${costData.avgCost.toFixed(6)}`}
              icon={TrendingDown}
              variant="success"
            />
            <MetricCard
              label="Total Requests"
              value={traces.length.toLocaleString()}
              icon={TrendingUp}
            />
            <MetricCard
              label="Projected Monthly"
              value={`$${costData.projectedMonthlyCost.toFixed(2)}`}
              icon={Calendar}
              variant="warning"
            />
          </Grid>

          {/* Cost trend chart */}
          <Card mb={spacing.lg}>
            <Text
              fontSize={typography.fontSize.xl}
              fontWeight={typography.fontWeight.semibold}
              color={colors.navy}
              mb={spacing.md}
            >
              Cost Trend
            </Text>
            <CostTrendChart data={costData.trend} height={300} showCount />
          </Card>

          {/* Cost breakdown tables */}
          <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={spacing.md}>
            {/* By model */}
            <Card>
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
                mb={spacing.md}
              >
                Cost by Model
              </Text>
              <Box overflowX="auto">
                {/* Header */}
                <Flex
                  bg={colors.background}
                  p={spacing.sm}
                  borderBottom="1px solid"
                  borderColor={colors.patience}
                  fontWeight={typography.fontWeight.semibold}
                  fontSize={typography.fontSize.sm}
                >
                  <Box flex={1}>Model</Box>
                  <Box flex={1} textAlign="right">Cost</Box>
                  <Box flex={1} textAlign="right">% of Total</Box>
                </Flex>
                {/* Rows */}
                {Object.entries(costData.byModel)
                  .sort(([, a], [, b]) => b - a)
                  .map(([model, cost], idx) => (
                    <Flex
                      key={model}
                      p={spacing.sm}
                      borderBottom="1px solid"
                      borderColor={colors.patience}
                      bg={idx % 2 === 0 ? 'white' : colors.background}
                      fontSize={typography.fontSize.sm}
                    >
                      <Box flex={1}>{model}</Box>
                      <Box flex={1} textAlign="right" fontWeight="medium">
                        ${cost.toFixed(4)}
                      </Box>
                      <Box flex={1} textAlign="right" color={colors.text.secondary}>
                        {((cost / costData.totalCost) * 100).toFixed(1)}%
                      </Box>
                    </Flex>
                  ))}
              </Box>
            </Card>

            {/* By platform */}
            <Card>
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.semibold}
                color={colors.navy}
                mb={spacing.md}
              >
                Cost by Platform
              </Text>
              <Box overflowX="auto">
                {/* Header */}
                <Flex
                  bg={colors.background}
                  p={spacing.sm}
                  borderBottom="1px solid"
                  borderColor={colors.patience}
                  fontWeight={typography.fontWeight.semibold}
                  fontSize={typography.fontSize.sm}
                >
                  <Box flex={1}>Platform</Box>
                  <Box flex={1} textAlign="right">Cost</Box>
                  <Box flex={1} textAlign="right">% of Total</Box>
                </Flex>
                {/* Rows */}
                {Object.entries(costData.byPlatform)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, cost], idx) => (
                    <Flex
                      key={platform}
                      p={spacing.sm}
                      borderBottom="1px solid"
                      borderColor={colors.patience}
                      bg={idx % 2 === 0 ? 'white' : colors.background}
                      fontSize={typography.fontSize.sm}
                    >
                      <Box flex={1}>{platform}</Box>
                      <Box flex={1} textAlign="right" fontWeight="medium">
                        ${cost.toFixed(4)}
                      </Box>
                      <Box flex={1} textAlign="right" color={colors.text.secondary}>
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
