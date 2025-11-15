'use client';

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Grid,
  Button,
} from '@chakra-ui/react';
import FileUpload from '@/components/FileUpload';
import RecommendationCard from '@/components/RecommendationCard';
import MetricCard from '@/components/MetricCard';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { Zap, DollarSign, TrendingDown } from 'lucide-react';

interface Trace {
  timestamp?: string;
  model?: string;
  platform?: string;
  cost?: number;
  input_data?: string;
  output_data?: string;
  confidence?: number;
  metadata?: any;
}

interface Recommendation {
  type: 'model_downgrade' | 'caching' | 'prompt_optimization' | 'batching';
  description: string;
  details: string;
  potentialSavings: number;
  impact: 'high' | 'medium' | 'low';
  taskType?: string;
  currentModel?: string;
  suggestedModel?: string;
  promptPattern?: string;
  repetitions?: number;
}

export default function OptimizationPage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [sortBy, setSortBy] = useState<'savings' | 'impact'>('savings');

  const getCheaperModel = (model: string): string => {
    const downgrades: Record<string, string> = {
      'gpt-4': 'gpt-3.5-turbo',
      'gpt-4-turbo': 'gpt-3.5-turbo',
      'claude-3-opus': 'claude-3-sonnet',
      'claude-3-sonnet': 'claude-3-haiku',
    };
    return downgrades[model] || model;
  };

  const calculateSavings = (traceGroup: Trace[], newModel: string): number => {
    // Simplified savings calculation
    const currentCost = traceGroup.reduce((sum, t) => sum + (t.cost || 0), 0);
    const estimatedSavings = currentCost * 0.7; // Assume 70% savings on downgrade
    return estimatedSavings;
  };

  const analyzeOptimizations = (allTraces: Trace[]) => {
    const recs: Recommendation[] = [];

    // 1. Model downgrade opportunities
    const tasksByModel = new Map<string, Trace[]>();
    allTraces.forEach((t) => {
      const key = `${t.metadata?.task_type || 'unknown'}_${t.model || 'unknown'}`;
      if (!tasksByModel.has(key)) {
        tasksByModel.set(key, []);
      }
      tasksByModel.get(key)!.push(t);
    });

    tasksByModel.forEach((taskTraces, key) => {
      if (taskTraces.length < 5) return; // Skip small samples

      const avgConfidence = taskTraces.reduce((sum, t) => sum + (t.confidence || 0), 0) / taskTraces.length;
      const model = taskTraces[0].model || 'unknown';
      const taskType = taskTraces[0].metadata?.task_type || 'unknown';

      if (avgConfidence > 0.85 && model !== 'unknown') {
        const cheaper = getCheaperModel(model);
        if (cheaper !== model) {
          recs.push({
            type: 'model_downgrade',
            description: `Switch from ${model} to ${cheaper} for ${taskType} tasks`,
            details: `Average confidence is ${(avgConfidence * 100).toFixed(1)}% - you can safely use a cheaper model`,
            potentialSavings: calculateSavings(taskTraces, cheaper),
            impact: 'high',
            taskType,
            currentModel: model,
            suggestedModel: cheaper,
          });
        }
      }
    });

    // 2. Caching opportunities
    const promptCounts = new Map<string, number>();
    const promptCosts = new Map<string, number>();
    allTraces.forEach((t) => {
      const prompt = (t.input_data || '').substring(0, 100); // First 100 chars as key
      promptCounts.set(prompt, (promptCounts.get(prompt) || 0) + 1);
      promptCosts.set(prompt, (promptCosts.get(prompt) || 0) + (t.cost || 0));
    });

    promptCounts.forEach((count, prompt) => {
      if (count >= 5) {
        const savings = (promptCosts.get(prompt) || 0) * 0.9; // 90% savings from caching
        recs.push({
          type: 'caching',
          description: `Cache responses for repeated prompt pattern`,
          details: `This prompt appears ${count} times. Implement response caching to save on redundant API calls.`,
          potentialSavings: savings,
          impact: count >= 20 ? 'high' : count >= 10 ? 'medium' : 'low',
          promptPattern: prompt + '...',
          repetitions: count,
        });
      }
    });

    // 3. Prompt optimization
    const longPrompts = allTraces.filter((t) => {
      const inputLength = (t.input_data || '').length;
      return inputLength > 2000; // Flag prompts over 2000 chars
    });

    if (longPrompts.length > 10) {
      const totalCost = longPrompts.reduce((sum, t) => sum + (t.cost || 0), 0);
      recs.push({
        type: 'prompt_optimization',
        description: 'Optimize long prompts to reduce token usage',
        details: `${longPrompts.length} requests use prompts over 2000 characters. Consider prompt compression techniques.`,
        potentialSavings: totalCost * 0.3, // Assume 30% savings from optimization
        impact: longPrompts.length >= 50 ? 'high' : 'medium',
      });
    }

    // 4. Batching opportunities
    const rapidCalls = allTraces.filter((t, i) => {
      if (i === 0) return false;
      const prevTime = new Date(allTraces[i - 1].timestamp || 0).getTime();
      const currTime = new Date(t.timestamp || 0).getTime();
      return currTime - prevTime < 1000; // Less than 1 second apart
    });

    if (rapidCalls.length > 20) {
      const batchableCost = rapidCalls.reduce((sum, t) => sum + (t.cost || 0), 0);
      recs.push({
        type: 'batching',
        description: 'Batch rapid sequential requests',
        details: `${rapidCalls.length} requests made within 1 second of each other. Use batching to reduce overhead.`,
        potentialSavings: batchableCost * 0.2, // 20% savings from batching
        impact: rapidCalls.length >= 50 ? 'high' : 'medium',
      });
    }

    // Sort recommendations
    const sorted = recs.sort((a, b) => b.potentialSavings - a.potentialSavings);
    setRecommendations(sorted);
  };

  const totalSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
  const highImpactCount = recommendations.filter((r) => r.impact === 'high').length;

  const sortedRecommendations =
    sortBy === 'savings'
      ? [...recommendations].sort((a, b) => b.potentialSavings - a.potentialSavings)
      : [...recommendations].sort((a, b) => {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        });

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
            Optimization Recommendations
          </Text>
          <Text fontSize={typography.fontSize.lg} color={colors.text.secondary}>
            Discover opportunities to reduce AI costs
          </Text>
        </Box>

        {recommendations.length > 0 && (
          <Box
            as="select"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}
            w="200px"
            px={spacing.sm}
            py={spacing.xs}
            borderRadius="md"
            border="1px solid"
            borderColor={colors.patience}
            bg="white"
            fontSize={typography.fontSize.sm}
            cursor="pointer"
            _hover={{ borderColor: colors.cobalt }}
          >
            <option value="savings">Sort by Savings</option>
            <option value="impact">Sort by Impact</option>
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
            <FileUpload
              onFileLoad={(data) => {
                setTraces(data);
                analyzeOptimizations(data);
              }}
              accept=".jsonl,.json"
              label="Upload Trace File"
            />
          </Flex>
        </Card>
      )}

      {/* Summary metrics */}
      {recommendations.length > 0 && (
        <>
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={spacing.md} mb={spacing.lg}>
            <MetricCard
              label="Total Potential Savings"
              value={`$${totalSavings.toFixed(2)}/month`}
              icon={DollarSign}
              variant="success"
            />
            <MetricCard
              label="Recommendations"
              value={recommendations.length.toString()}
              icon={Zap}
            />
            <MetricCard
              label="High Impact"
              value={highImpactCount.toString()}
              icon={TrendingDown}
              variant="warning"
            />
          </Grid>

          {/* Recommendations */}
          <Flex direction="column" gap={spacing.md}>
            {sortedRecommendations.map((rec, index) => (
              <RecommendationCard
                key={index}
                type={rec.type}
                description={rec.description}
                details={rec.details}
                savings={`$${rec.potentialSavings.toFixed(2)}/month`}
                impact={rec.impact}
              />
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
}
