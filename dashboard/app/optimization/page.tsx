'use client';

import { useState } from 'react';
import { Box, Flex, Text, Grid, Button } from '@chakra-ui/react';
import FileUpload from '@/components/FileUpload';
import RecommendationCard from '@/components/RecommendationCard';
import MetricCard from '@/components/MetricCard';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { Zap, DollarSign, TrendingDown } from 'lucide-react';
import { Trace, OptimizationOpportunity } from '@/types/trace';
import { TraceAnalyzer, parseTraceFile } from '@/lib/trace-analyzer';

export default function OptimizationPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationOpportunity[]>([]);
  const [sortBy, setSortBy] = useState<'savings' | 'impact'>('savings');

  const handleFileLoad = (content: string) => {
    const parsed = parseTraceFile(content);
    setTraces(parsed);
    analyzeOptimizations(parsed);
  };

  const analyzeOptimizations = (allTraces: Trace[]) => {
    const analyzer = new TraceAnalyzer(allTraces);
    const opportunities = analyzer.findOptimizations();
    setRecommendations(opportunities);
  };

  // Sort recommendations
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (sortBy === 'savings') {
      return b.potentialSavings - a.potentialSavings;
    } else {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    }
  });

  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
  const highImpactCount = recommendations.filter((r) => r.impact === 'high').length;

  return (
    <Box p={spacing.xl}>
      {/* Header */}
      <Flex justify="space-between" align="start" mb={spacing.xl}>
        <Box>
          <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.xs}>
            Optimization Opportunities
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            Discover opportunities to reduce AI costs
          </Text>
        </Box>

        {recommendations.length > 0 && (
          <Box w="200px">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
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
              <option value="savings">Sort by Savings</option>
              <option value="impact">Sort by Impact</option>
            </select>
          </Box>
        )}
      </Flex>

      {/* File upload */}
      {recommendations.length === 0 && (
        <Card>
          <Flex direction="column" align="center" gap={spacing.md} py={spacing.xl}>
            <Zap size={48} color={colors.gold} />
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
              Upload trace file to find optimization opportunities
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} textAlign="center" maxW="500px">
              Upload your cert_traces.jsonl file to discover ways to reduce costs
            </Text>
            <Box w="100%" maxW="500px">
              <FileUpload onFileLoad={handleFileLoad} accept=".jsonl,.json" label="Upload Trace File" />
            </Box>
          </Flex>
        </Card>
      )}

      {/* Summary Metrics */}
      {recommendations.length > 0 && (
        <>
          <Grid templateColumns="repeat(3, 1fr)" gap={spacing.md} mb={spacing.lg}>
            <MetricCard
              label="Potential Savings"
              value={`$${totalSavings.toFixed(2)}`}
              subtitle="Per month"
              variant="success"
            />
            <MetricCard
              label="Opportunities Found"
              value={recommendations.length.toString()}
              subtitle={`${highImpactCount} high impact`}
              variant="default"
            />
            <MetricCard
              label="Traces Analyzed"
              value={traces.length.toString()}
              subtitle="Total API calls"
              variant="default"
            />
          </Grid>

          {/* Recommendations List */}
          <Box>
            <Flex align="center" justify="space-between" mb={spacing.md}>
              <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                Recommendations
              </Text>
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                {sortedRecommendations.length} optimization{sortedRecommendations.length !== 1 ? 's' : ''} available
              </Text>
            </Flex>

            <Flex direction="column" gap={spacing.md}>
              {sortedRecommendations.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  type={rec.type}
                  description={rec.description}
                  savings={rec.potentialSavings}
                  impact={rec.impact}
                  details={rec.details}
                  onApply={() => {
                    // TODO: Implement apply logic (e.g., generate code snippet)
                    alert(`Apply ${rec.type}: ${rec.description}`);
                  }}
                />
              ))}
            </Flex>
          </Box>

          {/* Implementation Guide */}
          <Card mt={spacing.xl}>
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.md}>
              How to Implement These Optimizations
            </Text>
            <Flex direction="column" gap={spacing.sm}>
              <Box>
                <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                  Model Downgrades:
                </Text>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  Change your model parameter in API calls. Test with a sample of production prompts to verify quality remains acceptable.
                </Text>
              </Box>
              <Box>
                <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                  Caching:
                </Text>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  Implement semantic caching with Redis or use prompt caching features from Anthropic (Claude) or OpenAI.
                </Text>
              </Box>
              <Box>
                <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                  Prompt Optimization:
                </Text>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  Remove redundant context, use system messages effectively, and compress verbose instructions.
                </Text>
              </Box>
              <Box>
                <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                  Batch Processing:
                </Text>
                <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
                  Group similar API calls together and process them in batches to reduce overhead.
                </Text>
              </Box>
            </Flex>
          </Card>
        </>
      )}
    </Box>
  );
}
