'use client';

import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Coins,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  Filter,
  ChevronDown,
  Zap,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from './Card';
import Button, { IconButton } from './Button';
import Badge, { StatusBadge } from './Badge';
import { colors, spacing, borderRadius, transitions } from '@/theme';

/**
 * Mock trace data for demonstration
 * In production, this would come from a WebSocket or polling API
 */
interface Trace {
  id: string;
  timestamp: Date;
  model: string;
  endpoint: string;
  status: 'success' | 'error' | 'warning';
  latency: number;
  tokens: number;
  cost: number;
}

const mockTraces: Trace[] = [
  {
    id: '1',
    timestamp: new Date(),
    model: 'gpt-4',
    endpoint: '/api/chat',
    status: 'success',
    latency: 342,
    tokens: 1250,
    cost: 0.042,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 30000),
    model: 'claude-3-sonnet',
    endpoint: '/api/analyze',
    status: 'success',
    latency: 1250,
    tokens: 3200,
    cost: 0.096,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 60000),
    model: 'gpt-4',
    endpoint: '/api/chat',
    status: 'error',
    latency: 5200,
    tokens: 0,
    cost: 0,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 90000),
    model: 'gpt-3.5-turbo',
    endpoint: '/api/summarize',
    status: 'success',
    latency: 156,
    tokens: 450,
    cost: 0.001,
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 120000),
    model: 'claude-3-haiku',
    endpoint: '/api/classify',
    status: 'warning',
    latency: 890,
    tokens: 890,
    cost: 0.008,
  },
];

interface LiveTraceMonitorProps {
  maxTraces?: number;
  onTraceClick?: (trace: Trace) => void;
}

/**
 * Live Trace Monitor Component
 * Shows real-time LLM API calls with status, latency, tokens, and cost
 */
export default function LiveTraceMonitor({
  maxTraces = 10,
  onTraceClick,
}: LiveTraceMonitorProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [traces, setTraces] = useState<Trace[]>(mockTraces);

  // Filter traces based on selected filter
  const filteredTraces = traces.filter((trace) => {
    if (filter === 'all') return true;
    if (filter === 'errors') return trace.status === 'error';
    if (filter === 'warnings') return trace.status === 'warning';
    return true;
  });

  return (
    <Card variant="elevated" padding={spacing.lg}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={spacing.lg}>
        <Flex align="center" gap={spacing.sm}>
          <CardTitle>Live Traces</CardTitle>
          <Badge variant="success" dot>
            {traces.length} active
          </Badge>
        </Flex>

        <Flex gap={spacing.sm}>
          {/* Filter Dropdown */}
          <FilterDropdown value={filter} onChange={setFilter} />

          {/* Pause/Play Button */}
          <IconButton
            icon={isPaused ? <Play size={16} /> : <Pause size={16} />}
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Resume' : 'Pause'}
            variant="secondary"
          />
        </Flex>
      </Flex>

      {/* Trace List */}
      <Flex direction="column" gap={spacing.xs}>
        {filteredTraces.slice(0, maxTraces).map((trace) => (
          <TraceRow
            key={trace.id}
            trace={trace}
            onClick={() => onTraceClick?.(trace)}
          />
        ))}

        {filteredTraces.length === 0 && (
          <Flex
            justify="center"
            align="center"
            py={spacing.xl}
            color={colors.text.muted}
          >
            <Text fontSize="14px">No traces match the current filter</Text>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

/**
 * Individual Trace Row
 */
interface TraceRowProps {
  trace: Trace;
  onClick?: () => void;
}

function TraceRow({ trace, onClick }: TraceRowProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: colors.semantic.success,
      bg: colors.semantic.successLight,
    },
    error: {
      icon: AlertCircle,
      color: colors.semantic.error,
      bg: colors.semantic.errorLight,
    },
    warning: {
      icon: AlertCircle,
      color: colors.semantic.warning,
      bg: colors.semantic.warningLight,
    },
  };

  const config = statusConfig[trace.status];
  const StatusIcon = config.icon;

  const timeAgo = getTimeAgo(trace.timestamp);

  return (
    <Flex
      align="center"
      gap={spacing.md}
      p={spacing.sm}
      borderRadius={borderRadius.md}
      bg={colors.neutral[50]}
      cursor={onClick ? 'pointer' : 'default'}
      transition={transitions.all}
      _hover={{
        bg: colors.neutral[100],
      }}
      onClick={onClick}
    >
      {/* Status Indicator */}
      <Flex
        align="center"
        justify="center"
        w="32px"
        h="32px"
        borderRadius={borderRadius.md}
        bg={config.bg}
      >
        <StatusIcon size={16} color={config.color} />
      </Flex>

      {/* Model & Endpoint */}
      <Flex direction="column" flex={1} minW="0">
        <Text
          fontSize="14px"
          fontWeight={500}
          color={colors.text.primary}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {trace.model}
        </Text>
        <Text fontSize="12px" color={colors.text.muted} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {trace.endpoint}
        </Text>
      </Flex>

      {/* Metrics */}
      <Flex align="center" gap={spacing.lg} display={{ base: 'none', md: 'flex' }}>
        {/* Latency */}
        <Flex align="center" gap={spacing.xs} minW="80px">
          <Clock size={14} color={colors.text.muted} />
          <Text fontSize="13px" color={colors.text.secondary}>
            {trace.latency}ms
          </Text>
        </Flex>

        {/* Tokens */}
        <Flex align="center" gap={spacing.xs} minW="80px">
          <Zap size={14} color={colors.text.muted} />
          <Text fontSize="13px" color={colors.text.secondary}>
            {trace.tokens.toLocaleString()}
          </Text>
        </Flex>

        {/* Cost */}
        <Text
          fontSize="13px"
          fontWeight={500}
          color={colors.text.primary}
          minW="60px"
          textAlign="right"
        >
          €{trace.cost.toFixed(3)}
        </Text>
      </Flex>

      {/* Timestamp */}
      <Text
        fontSize="12px"
        color={colors.text.disabled}
        minW="60px"
        textAlign="right"
      >
        {timeAgo}
      </Text>
    </Flex>
  );
}

/**
 * Filter Dropdown Component
 */
interface FilterDropdownProps {
  value: 'all' | 'errors' | 'warnings';
  onChange: (value: 'all' | 'errors' | 'warnings') => void;
}

function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'all' as const, label: 'All Traces' },
    { value: 'errors' as const, label: 'Errors Only' },
    { value: 'warnings' as const, label: 'Warnings Only' },
  ];

  const selectedLabel = options.find((o) => o.value === value)?.label || 'All';

  return (
    <Box position="relative">
      <Flex
        as="button"
        align="center"
        gap={spacing.xs}
        px={spacing.sm}
        py={spacing.xs}
        borderRadius={borderRadius.md}
        border={`1px solid ${colors.border.default}`}
        bg={colors.background}
        fontSize="13px"
        color={colors.text.secondary}
        cursor="pointer"
        transition={transitions.all}
        onClick={() => setIsOpen(!isOpen)}
        _hover={{
          borderColor: colors.primary[500],
        }}
      >
        <Filter size={14} />
        <Text>{selectedLabel}</Text>
        <ChevronDown size={14} />
      </Flex>

      {isOpen && (
        <>
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            onClick={() => setIsOpen(false)}
          />
          <Flex
            position="absolute"
            top="100%"
            right="0"
            mt={spacing.xs}
            direction="column"
            bg={colors.background}
            border={`1px solid ${colors.border.default}`}
            borderRadius={borderRadius.md}
            boxShadow="0 4px 12px rgba(0,0,0,0.1)"
            overflow="hidden"
            zIndex={100}
          >
            {options.map((option) => (
              <Box
                key={option.value}
                as="button"
                px={spacing.md}
                py={spacing.sm}
                fontSize="13px"
                color={
                  value === option.value
                    ? colors.primary[700]
                    : colors.text.secondary
                }
                bg={value === option.value ? colors.primary[100] : 'transparent'}
                textAlign="left"
                cursor="pointer"
                transition={transitions.colors}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                _hover={{
                  bg: colors.neutral[100],
                }}
              >
                {option.label}
              </Box>
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
}

/**
 * Helper function to format time ago
 */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export type { Trace };
