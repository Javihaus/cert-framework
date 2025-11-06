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
      <Text fontSize="16px" color={colors.text.secondary} mb="24px" lineHeight="1.6">
        Shows how scores cluster across the threshold. Red = failed, orange = near threshold, green = passed.
      </Text>

      <Box position="relative" h="340px" pb="60px">
        {/* Bar Chart */}
        <Flex
          align="flex-end"
          h="260px"
          gap="6px"
          borderBottom="2px solid"
          borderColor={colors.navy}
          position="relative"
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
                h={bucket.count > 0 ? `${bucket.percentage}%` : '0%'}
                minH={bucket.count > 0 ? '4px' : '0px'}
                borderRadius="4px 4px 0 0"
                transition="all 0.3s"
                _hover={{ opacity: 0.85 }}
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
                    fontSize="14px"
                    fontWeight="700"
                    color={colors.navy}
                    whiteSpace="nowrap"
                  >
                    {bucket.count}
                  </Text>
                )}
              </Box>
            </Flex>
          ))}

          {/* Threshold line */}
          <Box
            position="absolute"
            left={`${(7 / 10) * 100}%`}
            bottom="0"
            w="2px"
            h="260px"
            borderLeft="2px dashed"
            borderColor={colors.navy}
            opacity="0.6"
            pointerEvents="none"
          >
            <Box
              position="absolute"
              top="50%"
              left="8px"
              transform="translateY(-50%)"
              bg={colors.background}
              px="8px"
              py="4px"
              borderRadius="4px"
              border="1px solid"
              borderColor={colors.navy}
            >
              <Text
                fontSize="11px"
                fontWeight="700"
                color={colors.navy}
                whiteSpace="nowrap"
              >
                Threshold: {threshold.toFixed(2)}
              </Text>
            </Box>
          </Box>
        </Flex>

        {/* X-axis labels */}
        <Flex mt="12px" gap="6px">
          {buckets.map((bucket, idx) => (
            <Box
              key={idx}
              flex="1"
              textAlign="center"
            >
              <Text
                fontSize="10px"
                color={colors.text.muted}
                fontWeight="500"
                transform="rotate(-45deg)"
                transformOrigin="center"
                whiteSpace="nowrap"
                mt="20px"
              >
                {bucket.label}
              </Text>
            </Box>
          ))}
        </Flex>
      </Box>
    </Box>
  );
}
