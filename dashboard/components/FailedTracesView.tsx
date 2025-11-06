'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Badge,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/table';
import {
  MdWarning,
  MdInfo,
  MdRemoveCircle,
  MdHelp,
  MdFileDownload,
} from 'react-icons/md';
import Card from './Card';
import { EvaluationResult } from '@/types/cert';
import { classifyFailure, PATTERNS } from '@/utils/patternClassifier';
import { colors } from '@/theme/colors';

interface FailedTracesViewProps {
  results: EvaluationResult[];
  threshold: number;
}

// Map icon names to actual icon components
const ICON_MAP = {
  MdWarning,
  MdInfo,
  MdRemoveCircle,
  MdHelp,
};

export default function FailedTracesView({ results, threshold }: FailedTracesViewProps) {
  // State: which pattern is currently filtered (null = show all)
  const [filterPattern, setFilterPattern] = useState<string | null>(null);

  // Get failed results with pattern classification
  // useMemo = only recalculate when results change (performance optimization)
  const failedResults = useMemo(() => {
    return results
      .filter(r => !r.passed)
      .map(r => ({
        ...r,
        pattern: classifyFailure(
          r.query,
          r.response || '',
          r.measurement.confidence
        )
      }));
  }, [results]);

  // Apply filter if one is selected
  const filteredResults = useMemo(() => {
    if (!filterPattern) return failedResults;
    return failedResults.filter(r => r.pattern.type === filterPattern);
  }, [failedResults, filterPattern]);

  // Count how many of each pattern
  const patternCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(PATTERNS).forEach(key => {
      counts[key] = 0;
    });
    failedResults.forEach(r => {
      counts[r.pattern.type]++;
    });
    return counts;
  }, [failedResults]);

  // Export filtered results to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Score', 'Pattern', 'Query', 'Response'];
    const rows = filteredResults.map(r => [
      r.timestamp,
      r.measurement.confidence.toFixed(3),
      r.pattern.label,
      `"${r.query.replace(/"/g, '""')}"`,
      `"${(r.response || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_traces_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const exportData = filteredResults.map(r => ({
      timestamp: r.timestamp,
      score: r.measurement.confidence,
      pattern: r.pattern.label,
      pattern_type: r.pattern.type,
      query: r.query,
      response: r.response || '',
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_traces_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle filter when clicking a pattern box
  const handlePatternClick = (patternType: string) => {
    setFilterPattern(filterPattern === patternType ? null : patternType);
  };

  return (
    <VStack gap="20px" align="stretch">
      {/* Pattern Cards */}
      <Card style={{ borderColor: colors.patience }}>
        <Text fontSize="24px" fontWeight="700" color={colors.navy} mb="12px">
          Failure Pattern Classification
        </Text>
        <Text fontSize="16px" color={colors.text.secondary} mb="20px" lineHeight="1.6">
          {failedResults.length} failed traces grouped by failure type. Click a pattern to filter results.
        </Text>
        <Flex gap="12px" flexWrap="wrap">
          {Object.entries(PATTERNS).map(([key, pattern]) => {
            const Icon = ICON_MAP[pattern.icon as keyof typeof ICON_MAP];
            const count = patternCounts[key];
            const percentage = failedResults.length > 0
              ? ((count / failedResults.length) * 100).toFixed(1)
              : '0.0';
            const isActive = filterPattern === key;

            return (
              <Box
                key={key}
                p="20px"
                border="2px solid"
                borderColor={isActive ? `${pattern.color}.300` : 'gray.200'}
                bg={isActive ? `${pattern.color}.50` : 'white'}
                borderRadius="10px"
                flex="1"
                minW="200px"
                cursor="pointer"
                onClick={() => handlePatternClick(key)}
                transition="all 0.2s"
                _hover={{ borderColor: `${pattern.color}.400`, transform: 'translateY(-2px)' }}
              >
                <HStack mb="12px">
                  <Box
                    w="40px"
                    h="40px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={`${pattern.color}.100`}
                    color={`${pattern.color}.700`}
                    borderRadius="8px"
                  >
                    <Icon size={20} />
                  </Box>
                  <Text fontSize="16px" fontWeight="600" color={colors.navy}>
                    {pattern.label}
                  </Text>
                </HStack>
                <Text fontSize="32px" fontWeight="700" color={`${pattern.color}.500`} lineHeight="1">
                  {count}
                </Text>
                <Text fontSize="14px" color={colors.text.muted} mt="4px">
                  {percentage}% of failures
                </Text>
              </Box>
            );
          })}
        </Flex>
      </Card>

      {/* Export Buttons & Table */}
      <Card style={{ borderColor: colors.patience }}>
        <Flex justify="space-between" align="center" mb="20px">
          <Text fontSize="24px" fontWeight="700" color={colors.navy}>
            {filterPattern
              ? `${PATTERNS[filterPattern].label} Traces (${filteredResults.length})`
              : `Failed Traces (${failedResults.length})`
            }
          </Text>
          <HStack gap="12px">
            <Button
              onClick={handleExportCSV}
              bg="white"
              border="1px solid"
              borderColor={colors.patience}
              color={colors.navy}
              fontSize="15px"
              fontWeight="500"
              px="18px"
              py="10px"
              h="auto"
              _hover={{ bg: colors.background }}
            >
              <Flex align="center" gap="8px">
                <MdFileDownload size={18} />
                <span>Export CSV</span>
              </Flex>
            </Button>
            <Button
              onClick={handleExportJSON}
              bg="white"
              border="1px solid"
              borderColor={colors.patience}
              color={colors.navy}
              fontSize="15px"
              fontWeight="500"
              px="18px"
              py="10px"
              h="auto"
              _hover={{ bg: colors.background }}
            >
              <Flex align="center" gap="8px">
                <MdFileDownload size={18} />
                <span>Export JSON</span>
              </Flex>
            </Button>
          </HStack>
        </Flex>

        {filteredResults.length === 0 ? (
          <Text color={colors.text.muted} fontSize="16px" textAlign="center" py="60px">
            No traces match the selected filter
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th fontSize="14px">Score</Th>
                  <Th fontSize="14px">Pattern</Th>
                  <Th fontSize="14px">Query</Th>
                  <Th fontSize="14px">Response</Th>
                  <Th fontSize="14px">Time</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredResults.map((result, idx) => {
                  const Icon = ICON_MAP[result.pattern.icon as keyof typeof ICON_MAP];
                  return (
                    <Tr key={idx}>
                      <Td>
                        <Text fontSize="15px" fontWeight="700" color="red.500">
                          {result.measurement.confidence.toFixed(3)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack>
                          <Icon size={18} color={`var(--chakra-colors-${result.pattern.color}-500)`} />
                          <Badge colorScheme={result.pattern.color} fontSize="13px">
                            {result.pattern.label}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td maxW="250px">
                        <Text
                          fontSize="14px"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          title={result.query}
                        >
                          {result.query}
                        </Text>
                      </Td>
                      <Td maxW="350px">
                        <Text
                          fontSize="14px"
                          color="gray.600"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          title={result.response || ''}
                        >
                          {result.response || 'N/A'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="13px" color="gray.500">
                          {new Date(result.timestamp).toLocaleString()}
                        </Text>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </VStack>
  );
}
