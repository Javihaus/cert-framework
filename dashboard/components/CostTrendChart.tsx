'use client';

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

// Chart colors - using direct hex values for Recharts
const chartColors = {
  primary: '#2563EB', // blue-600
  secondary: '#16A34A', // green-600
  grid: '#E4E4E7', // zinc-200
  text: '#71717A', // zinc-500
  border: '#D4D4D8', // zinc-300
};

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
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="date"
            stroke={chartColors.text}
            style={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            stroke={chartColors.text}
            style={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          {showCount && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={chartColors.text}
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
              border: `1px solid ${chartColors.border}`,
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cost"
            stroke={chartColors.primary}
            strokeWidth={2}
            dot={{ fill: chartColors.primary, r: 4 }}
            activeDot={{ r: 6 }}
            name="Cost"
          />
          {showCount && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="count"
              stroke={chartColors.secondary}
              strokeWidth={2}
              dot={{ fill: chartColors.secondary, r: 4 }}
              name="Requests"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
