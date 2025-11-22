'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EvaluationResult } from '@/types/cert';

// Chart colors - using direct hex values
const chartColors = {
  error: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  success: '#22C55E', // green-500
  navy: '#18181B', // zinc-900
  border: '#E4E4E7', // zinc-200
  text: '#71717A', // zinc-500
  muted: '#A1A1AA', // zinc-400
};

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
    if (status === 'fail') return chartColors.error;
    if (status === 'warn') return chartColors.warning;
    return chartColors.success;
  };

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-6 mb-8 items-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors.error }} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Failed (&lt; 0.5)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors.warning }} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Near threshold (0.5-{threshold.toFixed(1)})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors.success }} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Passed (&gt; {threshold.toFixed(1)})
          </span>
        </div>
      </div>

      <div className="relative h-[380px]">
        {/* Grid lines */}
        <div className="absolute left-0 right-0 top-0 bottom-[60px]">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute left-0 right-0 border-t"
              style={{
                bottom: `${(percent / 100) * 300}px`,
                borderColor: percent === 0 ? chartColors.navy : chartColors.border,
                opacity: percent === 0 ? 1 : 0.4,
              }}
            >
              <span
                className="absolute left-[-40px] top-[-8px] text-xs font-medium"
                style={{ color: chartColors.muted }}
              >
                {Math.round((percent / 100) * maxCount)}
              </span>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="flex items-end h-[300px] gap-1 relative ml-10">
          {buckets.map((bucket, idx) => (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center relative h-full justify-end group"
            >
              {/* Bar */}
              <div
                className="w-full rounded-t transition-all cursor-pointer opacity-90 group-hover:opacity-100 relative"
                style={{
                  backgroundColor: getBarColor(bucket.status),
                  height: bucket.count > 0 ? `${bucket.percentage}%` : '0%',
                  minHeight: bucket.count > 0 ? '8px' : '0px',
                }}
              >
                {/* Tooltip */}
                {bucket.count > 0 && (
                  <div
                    className="absolute top-[-32px] left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-white"
                    style={{ backgroundColor: chartColors.navy }}
                  >
                    {bucket.count} traces
                  </div>
                )}
              </div>

              {/* Threshold marker */}
              {idx === 6 && (
                <div
                  className="absolute right-[-4px] bottom-0 w-0.5 h-[300px] opacity-30 pointer-events-none"
                  style={{ backgroundColor: chartColors.navy }}
                >
                  <div
                    className="absolute top-[-28px] right-[-2px] px-2 py-1 rounded text-xs font-semibold whitespace-nowrap text-white"
                    style={{ backgroundColor: chartColors.navy }}
                  >
                    Threshold
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex mt-4 gap-1 ml-10">
          {buckets.map((bucket, idx) => (
            <div key={idx} className="flex-1 text-center">
              <span className="text-xs font-medium" style={{ color: chartColors.muted }}>
                {bucket.label}
              </span>
            </div>
          ))}
        </div>

        {/* Axis label */}
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-semibold"
          style={{ color: chartColors.text }}
        >
          Confidence Score
        </span>
      </div>
    </div>
  );
}
