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
      <Card>
        <Text fontSize="lg" fontWeight="700" color="secondaryGray.900" mb="16px">
          Failure Pattern Classification
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
                    w="32px"
                    h="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={`${pattern.color}.100`}
                    color={`${pattern.color}.700`}
                    borderRadius="6px"
                  >
                    <Icon size={16} />
                  </Box>
                  <Text fontSize="14px" fontWeight="600" color="secondaryGray.900">
                    {pattern.label}
                  </Text>
                </HStack>
                <Text fontSize="28px" fontWeight="700" color={`${pattern.color}.500`}>
                  {count}
                </Text>
                <Text fontSize="12px" color="secondaryGray.600">
                  {percentage}% of failures
                </Text>
              </Box>
            );
          })}
        </Flex>
      </Card>

      {/* Export Buttons & Table */}
      <Card>
        <Flex justify="space-between" align="center" mb="20px">
          <Text fontSize="lg" fontWeight="700" color="secondaryGray.900">
            {filterPattern
              ? `${PATTERNS[filterPattern].label} Traces (${filteredResults.length})`
              : `Failed Traces (${failedResults.length})`
            }
          </Text>
          <HStack gap="8px">
            <Button
              size="sm"
              onClick={handleExportCSV}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              _hover={{ bg: 'gray.50' }}
            >
              <MdFileDownload style={{ marginRight: '8px' }} />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={handleExportJSON}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              _hover={{ bg: 'gray.50' }}
            >
              <MdFileDownload style={{ marginRight: '8px' }} />
              Export JSON
            </Button>
          </HStack>
        </Flex>

        {filteredResults.length === 0 ? (
          <Text color="secondaryGray.600" textAlign="center" py="40px">
            No traces match the selected filter
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Score</Th>
                  <Th>Pattern</Th>
                  <Th>Query</Th>
                  <Th>Response</Th>
                  <Th>Time</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredResults.map((result, idx) => {
                  const Icon = ICON_MAP[result.pattern.icon as keyof typeof ICON_MAP];
                  return (
                    <Tr key={idx}>
                      <Td>
                        <Text fontSize="sm" fontWeight="700" color="red.500">
                          {result.measurement.confidence.toFixed(3)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack>
                          <Icon size={16} color={`var(--chakra-colors-${result.pattern.color}-500)`} />
                          <Badge colorScheme={result.pattern.color} fontSize="xs">
                            {result.pattern.label}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td maxW="250px">
                        <Text
                          fontSize="sm"
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
                          fontSize="sm"
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
                        <Text fontSize="xs" color="gray.500">
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
