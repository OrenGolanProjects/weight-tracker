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
  ReferenceLine,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import type { WeightEntry } from '@/types';
import { calculateBMI } from '@/lib/utils';

interface BMITrendChartProps {
  entries: WeightEntry[];
  height: number; // user height in cm
  chartHeight?: number;
  showLegend?: boolean;
}

export default function BMITrendChart({
  entries,
  height,
  chartHeight = 300,
  showLegend = true,
}: BMITrendChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!height || height <= 0) return [];

    // Sort entries by date ascending
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
      const bmi = calculateBMI(entry.weight, height);

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bmi: Number(bmi.toFixed(1)),
        fullDate: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    });
  }, [entries, height]);

  if (entries.length === 0 || !height || height <= 0) {
    return (
      <Box
        sx={{
          height: chartHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography color="text.secondary">
          {!height || height <= 0
            ? 'Add your height in profile to see BMI trends'
            : 'No BMI data available'}
        </Typography>
      </Box>
    );
  }

  // Calculate min and max for better Y-axis scaling
  const bmiValues = chartData.map((d) => d.bmi);
  const minBMI = Math.min(...bmiValues);
  const maxBMI = Math.max(...bmiValues);
  const padding = (maxBMI - minBMI) * 0.1 || 2;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
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
          domain={[Math.max(15, minBMI - padding), maxBMI + padding]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
          labelStyle={{ color: theme.palette.text.primary }}
          formatter={(value: unknown) => {
            const numValue = value as number | undefined;
            if (numValue === undefined) return ['-', 'BMI'];
            return [numValue.toFixed(1), 'BMI'];
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              return payload[0].payload.fullDate;
            }
            return label;
          }}
        />
        {showLegend && <Legend />}

        {/* Reference lines for BMI categories */}
        <ReferenceLine
          y={18.5}
          stroke={theme.palette.warning.main}
          strokeDasharray="3 3"
          label={{ value: 'Underweight', position: 'insideTopRight', fontSize: 10 }}
        />
        <ReferenceLine
          y={25}
          stroke={theme.palette.success.main}
          strokeDasharray="3 3"
          label={{ value: 'Normal', position: 'insideTopRight', fontSize: 10 }}
        />
        <ReferenceLine
          y={30}
          stroke={theme.palette.warning.main}
          strokeDasharray="3 3"
          label={{ value: 'Overweight', position: 'insideTopRight', fontSize: 10 }}
        />

        <Line
          type="monotone"
          dataKey="bmi"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ fill: theme.palette.primary.main, r: 4 }}
          activeDot={{ r: 6 }}
          name="BMI"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
