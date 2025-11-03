'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { colors } from '@/theme/colors';
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
      { min: 0.0, max: 0.1, label: '0.0-0.1' },
      { min: 0.1, max: 0.2, label: '0.1-0.2' },
      { min: 0.2, max: 0.3, label: '0.2-0.3' },
      { min: 0.3, max: 0.4, label: '0.3-0.4' },
      { min: 0.4, max: 0.5, label: '0.4-0.5' },
      { min: 0.5, max: 0.6, label: '0.5-0.6' },
      { min: 0.6, max: threshold, label: `0.6-${threshold.toFixed(1)}` },
      { min: threshold, max: 0.8, label: `${threshold.toFixed(1)}-0.8` },
      { min: 0.8, max: 0.9, label: '0.8-0.9' },
      { min: 0.9, max: 1.0, label: '0.9-1.0' },
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
      // For the last bucket, include values equal to max (e.g., 1.0)
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
    if (status === 'fail') return colors.error;
    if (status === 'warn') return colors.warning;
    return colors.success;
  };

  return (
    <Box>
      <Text fontSize="14px" color={colors.text.muted} mb="20px">
        Shows how scores cluster across the threshold. Red = failed, orange = near threshold, green = passed.
      </Text>

      {/* Center container at 60% width */}
      <Box maxW="60%" mx="auto" position="relative" h="280px">
        {/* Bar Chart */}
        <Flex
          align="flex-end"
          h="240px"
          gap="8px"
          px="20px"
          borderBottom="2px solid"
          borderColor={colors.navy}
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
            >
              {/* Bar */}
              <Box
                bg={getBarColor(bucket.status)}
                w="100%"
                h={`${bucket.percentage}%`}
                borderRadius="4px 4px 0 0"
                transition="all 0.3s"
                _hover={{ opacity: 0.8 }}
                cursor="pointer"
                position="relative"
              >
                {/* Value on top */}
                {bucket.count > 0 && (
                  <Text
                    position="absolute"
                    top="-24px"
                    left="50%"
                    transform="translateX(-50%)"
                    fontSize="12px"
                    fontWeight="600"
                    color={colors.navy}
                    whiteSpace="nowrap"
                  >
                    {bucket.count}
                  </Text>
                )}
              </Box>

              {/* Label below */}
              <Text
                position="absolute"
                bottom="-28px"
                fontSize="11px"
                color={colors.text.muted}
                whiteSpace="nowrap"
                transform="rotate(-45deg)"
                transformOrigin="top left"
                ml="8px"
              >
                {bucket.label}
              </Text>
            </Flex>
          ))}
        </Flex>

        {/* Threshold line */}
        <Box
          position="absolute"
          left={`${(7 / 10) * 100}%`}
          bottom="40px"
          w="2px"
          h="240px"
          borderLeft="2px dashed"
          borderColor={colors.navy}
          opacity="0.5"
        >
          <Text
            position="absolute"
            bottom="210px"
            left="-60px"
            fontSize="12px"
            fontWeight="600"
            color={colors.navy}
            transform="rotate(-90deg)"
            transformOrigin="center"
            whiteSpace="nowrap"
          >
            Threshold: {threshold.toFixed(2)} →
          </Text>
        </Box>
      </Box>
      {/* End center container */}
    </Box>
  );
}
