'use client';

import { Box } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { colors } from '@/theme/colors';

interface CostTrendData {
  date: string;
  cost: number;
  count?: number;
}

interface CostTrendChartProps {
  data: CostTrendData[];
  height?: number;
  showCount?: boolean;
}

export default function CostTrendChart({
  data,
  height = 300,
  showCount = false,
}: CostTrendChartProps) {
  return (
    <Box width="100%" height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.patience} />
          <XAxis
            dataKey="date"
            stroke={colors.text.secondary}
            style={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke={colors.text.secondary}
            style={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          {showCount && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={colors.text.secondary}
              style={{ fontSize: 12 }}
            />
          )}
          <Tooltip
            formatter={(value: any, name: string) => {
              if (name === 'cost') return [`$${value.toFixed(4)}`, 'Cost'];
              if (name === 'count') return [value, 'Requests'];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: `1px solid ${colors.patience}`,
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cost"
            stroke={colors.cobalt}
            strokeWidth={2}
            dot={{ fill: colors.cobalt, r: 4 }}
            activeDot={{ r: 6 }}
            name="Cost"
          />
          {showCount && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="count"
              stroke={colors.olive}
              strokeWidth={2}
              dot={{ fill: colors.olive, r: 4 }}
              name="Requests"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
