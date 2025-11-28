'use client';

import { useState } from 'react';
import {
  LuClock,
  LuCircleAlert,
  LuCircleCheck,
  LuPause,
  LuPlay,
  LuFilter,
  LuChevronDown,
  LuRepeat2,
} from 'react-icons/lu';
import Card, { CardTitle } from './Card';
import { IconButton } from './Button';
import Badge from './Badge';
import { cn } from '@/lib/utils';

/**
 * Mock trace data for demonstration
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

export default function LiveTraceMonitor({
  maxTraces = 10,
  onTraceClick,
}: LiveTraceMonitorProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [traces, setTraces] = useState<Trace[]>(mockTraces);

  const filteredTraces = traces.filter((trace) => {
    if (filter === 'all') return true;
    if (filter === 'errors') return trace.status === 'error';
    if (filter === 'warnings') return trace.status === 'warning';
    return true;
  });

  return (
    <Card variant="elevated" className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <CardTitle>Live Traces</CardTitle>
          <Badge variant="success" dot>
            {traces.length} active
          </Badge>
        </div>

        <div className="flex gap-2">
          <FilterDropdown value={filter} onChange={setFilter} />
          <IconButton
            icon={isPaused ? <LuPlay size={16} /> : <LuPause size={16} />}
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Resume' : 'LuPause'}
            variant="secondary"
          />
        </div>
      </div>

      {/* Trace List */}
      <div className="flex flex-col gap-1">
        {filteredTraces.slice(0, maxTraces).map((trace) => (
          <TraceRow
            key={trace.id}
            trace={trace}
            onClick={() => onTraceClick?.(trace)}
          />
        ))}

        {filteredTraces.length === 0 && (
          <div className="flex justify-center items-center py-8 text-zinc-400">
            <span className="text-sm">No traces match the current filter</span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface TraceRowProps {
  trace: Trace;
  onClick?: () => void;
}

function TraceRow({ trace, onClick }: TraceRowProps) {
  const statusConfig = {
    success: {
      icon: LuCircleCheck,
      colorClass: 'text-green-600 dark:text-green-500',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
    },
    error: {
      icon: LuCircleAlert,
      colorClass: 'text-red-500',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
    },
    warning: {
      icon: LuCircleAlert,
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    },
  };

  const config = statusConfig[trace.status];
  const StatusIcon = config.icon;
  const timeAgo = getTimeAgo(trace.timestamp);

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 transition-all',
        onClick && 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800'
      )}
      onClick={onClick}
    >
      {/* Status Indicator */}
      <div className={cn('flex items-center justify-center w-8 h-8 rounded-md', config.bgClass)}>
        <StatusIcon size={16} className={config.colorClass} />
      </div>

      {/* Model & Endpoint */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
          {trace.model}
        </span>
        <span className="text-xs text-zinc-400 truncate">
          {trace.endpoint}
        </span>
      </div>

      {/* Metrics */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-1 min-w-[80px]">
          <LuClock size={14} className="text-zinc-400" />
          <span className="text-[13px] text-zinc-500">
            {trace.latency}ms
          </span>
        </div>

        <div className="flex items-center gap-1 min-w-[80px]">
          <LuRepeat2 size={14} className="text-zinc-400" />
          <span className="text-[13px] text-zinc-500">
            {trace.tokens.toLocaleString()}
          </span>
        </div>

        <span className="text-[13px] font-medium text-zinc-900 dark:text-white min-w-[60px] text-right">
          ${trace.cost.toFixed(3)}
        </span>
      </div>

      {/* Timestamp */}
      <span className="text-xs text-zinc-300 dark:text-zinc-600 min-w-[60px] text-right">
        {timeAgo}
      </span>
    </div>
  );
}

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
    <div className="relative">
      <button
        className="flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[13px] text-zinc-500 cursor-pointer transition-all hover:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <LuFilter size={14} />
        <span>{selectedLabel}</span>
        <LuChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 flex flex-col bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg overflow-hidden z-[100]">
            {options.map((option) => (
              <button
                key={option.value}
                className={cn(
                  'px-4 py-2 text-[13px] text-left cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700',
                  value === option.value
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-zinc-500'
                )}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export type { Trace };
