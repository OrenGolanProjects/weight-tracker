'use client';

import { useMemo } from 'react';
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
import { Box, Typography, useTheme } from '@mui/material';
import type { WeightEntry } from '@/types';

interface WeightChartProps {
  entries: WeightEntry[];
  height?: number;
  showLegend?: boolean;
}

export default function WeightChart({
  entries,
  height = 300,
  showLegend = true,
}: WeightChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    // Sort entries by date ascending for proper chart display
    const sorted = [...entries].sort((a, b) => {
      const dateA =
        typeof a.date === 'object' && 'toDate' in a.date && a.date.toDate
          ? a.date.toDate().getTime()
          : new Date(a.date as unknown as Date).getTime();
      const dateB =
        typeof b.date === 'object' && 'toDate' in b.date && b.date.toDate
          ? b.date.toDate().getTime()
          : new Date(b.date as unknown as Date).getTime();
      return dateA - dateB;
    });

    return sorted.map((entry) => {
      const date =
        typeof entry.date === 'object' && 'toDate' in entry.date && entry.date.toDate
          ? entry.date.toDate()
          : new Date(entry.date as unknown as Date);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: Number(entry.weight.toFixed(1)),
        fullDate: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography color="text.secondary">No weight data available</Typography>
      </Box>
    );
  }

  // Calculate min and max for better Y-axis scaling
  const weights = chartData.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = (maxWeight - minWeight) * 0.1 || 5; // 10% padding or 5kg minimum

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="date"
          stroke={theme.palette.text.secondary}
          style={{ fontSize: '0.875rem' }}
        />
        <YAxis
          stroke={theme.palette.text.secondary}
          style={{ fontSize: '0.875rem' }}
          domain={[minWeight - padding, maxWeight + padding]}
          tickFormatter={(value) => `${value.toFixed(0)} kg`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
          labelStyle={{ color: theme.palette.text.primary }}
          formatter={(value: number | undefined) => {
            if (value === undefined) return ['-', 'Weight'];
            return [`${value.toFixed(1)} kg`, 'Weight'];
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              return payload[0].payload.fullDate;
            }
            return label;
          }}
        />
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey="weight"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ fill: theme.palette.primary.main, r: 4 }}
          activeDot={{ r: 6 }}
          name="Weight (kg)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
