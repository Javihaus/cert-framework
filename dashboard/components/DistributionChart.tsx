'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { colors, spacing, typography } from '@/theme';
import { EvaluationResult } from '@/types/cert';

interface DistributionChartProps {
  results: EvaluationResult[];
  threshold: number;
}

interface BucketData {
  label: string;
  count: number;
  percentage: number;
  status: 'fail' | 'warn' | 'pass';
}

export default function DistributionChart({ results, threshold }: DistributionChartProps) {
  const buckets = useMemo(() => {
    const bucketData: BucketData[] = [];
    const ranges = [
      { min: 0.0, max: 0.1, label: '0.0' },
      { min: 0.1, max: 0.2, label: '0.1' },
      { min: 0.2, max: 0.3, label: '0.2' },
      { min: 0.3, max: 0.4, label: '0.3' },
      { min: 0.4, max: 0.5, label: '0.4' },
      { min: 0.5, max: 0.6, label: '0.5' },
      { min: 0.6, max: threshold, label: '0.6' },
      { min: threshold, max: 0.8, label: threshold.toFixed(1) },
      { min: 0.8, max: 0.9, label: '0.8' },
      { min: 0.9, max: 1.0, label: '0.9' },
    ];

    const maxCount = Math.max(...ranges.map((range, idx) => {
      const isLastBucket = idx === ranges.length - 1;
      return results.filter(r =>
        r.measurement.confidence >= range.min &&
        (isLastBucket
          ? r.measurement.confidence <= range.max
          : r.measurement.confidence < range.max)
      ).length;
    }), 1);

    ranges.forEach((range, idx) => {
      const isLastBucket = idx === ranges.length - 1;
      const count = results.filter(r =>
        r.measurement.confidence >= range.min &&
        (isLastBucket
          ? r.measurement.confidence <= range.max
          : r.measurement.confidence < range.max)
      ).length;

      let status: 'fail' | 'warn' | 'pass' = 'pass';
      if (range.max <= 0.5) status = 'fail';
      else if (range.max <= threshold) status = 'warn';

      bucketData.push({
        label: range.label,
        count,
        percentage: (count / maxCount) * 100,
        status,
      });
    });

    return bucketData;
  }, [results, threshold]);

  const getBarColor = (status: string) => {
    // Use colors from the palette
    if (status === 'fail') return colors.error;     // Red from palette
    if (status === 'warn') return colors.warning;   // Coral from palette
    return colors.success;                          // Green from palette
  };

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <Box>
      {/* Professional Legend - not prose explanation */}
      <Flex gap={spacing.lg} mb={spacing.xl} align="center">
        <Flex align="center" gap={spacing.xs}>
          <Box w="12px" h="12px" bg={colors.error} borderRadius="2px" />
          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} fontWeight={typography.fontWeight.medium}>
            Failed (&lt; 0.5)
          </Text>
        </Flex>
        <Flex align="center" gap={spacing.xs}>
          <Box w="12px" h="12px" bg={colors.warning} borderRadius="2px" />
          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} fontWeight={typography.fontWeight.medium}>
            Near threshold (0.5–{threshold.toFixed(1)})
          </Text>
        </Flex>
        <Flex align="center" gap={spacing.xs}>
          <Box w="12px" h="12px" bg={colors.success} borderRadius="2px" />
          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary} fontWeight={typography.fontWeight.medium}>
            Passed (&gt; {threshold.toFixed(1)})
          </Text>
        </Flex>
      </Flex>

      <Box position="relative" h="380px">
        {/* Grid lines for reference */}
        <Box position="absolute" left="0" right="0" top="0" bottom="60px">
          {[0, 25, 50, 75, 100].map((percent) => (
            <Box
              key={percent}
              position="absolute"
              left="0"
              right="0"
              bottom={`${(percent / 100) * 300}px`}
              borderTop="1px solid"
              borderColor={percent === 0 ? colors.navy : colors.patience}
              opacity={percent === 0 ? 1 : 0.4}
            >
              <Text
                position="absolute"
                left="-40px"
                top="-8px"
                fontSize={typography.fontSize.xs}
                color={colors.text.muted}
                fontWeight={typography.fontWeight.medium}
              >
                {Math.round((percent / 100) * maxCount)}
              </Text>
            </Box>
          ))}
        </Box>

        {/* Bar Chart */}
        <Flex
          align="flex-end"
          h="300px"
          gap={spacing.xs}
          position="relative"
          ml="40px"
        >
          {buckets.map((bucket, idx) => (
            <Flex
              key={idx}
              flex="1"
              direction="column"
              align="center"
              position="relative"
              h="100%"
              justify="flex-end"
              role="group"
            >
              {/* Bar */}
              <Box
                bg={getBarColor(bucket.status)}
                w="100%"
                h={bucket.count > 0 ? `${bucket.percentage}%` : '0%'}
                minH={bucket.count > 0 ? '8px' : '0px'}
                borderRadius="3px 3px 0 0"
                transition="all 0.2s"
                opacity={0.9}
                _groupHover={{ opacity: 1 }}
                cursor="pointer"
                position="relative"
              >
                {/* Tooltip-style value on hover */}
                {bucket.count > 0 && (
                  <Box
                    position="absolute"
                    top="-32px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg={colors.navy}
                    color="white"
                    px={spacing.xs}
                    py="4px"
                    borderRadius="4px"
                    fontSize={typography.fontSize.xs}
                    fontWeight={typography.fontWeight.semibold}
                    whiteSpace="nowrap"
                    opacity="0"
                    transition="opacity 0.2s"
                    _groupHover={{ opacity: 1 }}
                    pointerEvents="none"
                    zIndex="10"
                  >
                    {bucket.count} traces
                  </Box>
                )}
              </Box>

              {/* Threshold marker - elegant vertical line */}
              {idx === 6 && (
                <Box
                  position="absolute"
                  right="-4px"
                  bottom="0"
                  w="2px"
                  h="300px"
                  bg={colors.navy}
                  opacity="0.3"
                  pointerEvents="none"
                >
                  <Box
                    position="absolute"
                    top="-28px"
                    right="-2px"
                    bg={colors.navy}
                    color="white"
                    px={spacing.xs}
                    py="4px"
                    borderRadius="4px"
                    fontSize={typography.fontSize.xs}
                    fontWeight={typography.fontWeight.semibold}
                    whiteSpace="nowrap"
                  >
                    Threshold
                  </Box>
                </Box>
              )}
            </Flex>
          ))}
        </Flex>

        {/* X-axis labels - clean, not rotated */}
        <Flex mt={spacing.md} gap={spacing.xs} ml="40px">
          {buckets.map((bucket, idx) => (
            <Box
              key={idx}
              flex="1"
              textAlign="center"
            >
              <Text
                fontSize={typography.fontSize.xs}
                color={colors.text.muted}
                fontWeight={typography.fontWeight.medium}
              >
                {bucket.label}
              </Text>
            </Box>
          ))}
        </Flex>

        {/* Axis label */}
        <Text
          position="absolute"
          bottom="0"
          left="50%"
          transform="translateX(-50%)"
          fontSize={typography.fontSize.xs}
          color={colors.text.secondary}
          fontWeight={typography.fontWeight.semibold}
          mt={spacing.xs}
        >
          Confidence Score
        </Text>
      </Box>
    </Box>
  );
}
