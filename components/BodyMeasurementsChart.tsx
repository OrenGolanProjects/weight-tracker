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
import type { BodyMeasurement } from '@/types';

interface BodyMeasurementsChartProps {
  measurements: BodyMeasurement[];
  height?: number;
  showLegend?: boolean;
}

export default function BodyMeasurementsChart({
  measurements,
  height = 300,
  showLegend = true,
}: BodyMeasurementsChartProps) {
  const theme = useTheme();

  const chartData = useMemo(() => {
    // Sort measurements by date ascending for proper chart display
    const sorted = [...measurements].sort((a, b) => {
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

    return sorted.map((measurement) => {
      const date =
        typeof measurement.date === 'object' &&
        'toDate' in measurement.date &&
        measurement.date.toDate
          ? measurement.date.toDate()
          : new Date(measurement.date as unknown as Date);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        waist: measurement.waist !== null ? Number(measurement.waist.toFixed(1)) : null,
        bicep: measurement.bicep !== null ? Number(measurement.bicep.toFixed(1)) : null,
        thigh: measurement.thigh !== null ? Number(measurement.thigh.toFixed(1)) : null,
        fullDate: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    });
  }, [measurements]);

  // Check if there's any data to display
  const hasData = useMemo(() => {
    return measurements.some((m) => m.waist !== null || m.bicep !== null || m.thigh !== null);
  }, [measurements]);

  if (measurements.length === 0 || !hasData) {
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
        <Typography color="text.secondary">No measurement data available</Typography>
      </Box>
    );
  }

  // Calculate min and max for better Y-axis scaling
  const allValues = chartData.flatMap(
    (d) => [d.waist, d.bicep, d.thigh].filter((v) => v !== null) as number[]
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1 || 5; // 10% padding or 5cm minimum

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
          domain={[minValue - padding, maxValue + padding]}
          tickFormatter={(value) => `${value.toFixed(0)} cm`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}
          labelStyle={{ color: theme.palette.text.primary }}
          formatter={(value: unknown) => {
            const numValue = value as number | null | undefined;
            if (numValue === null || numValue === undefined) return ['-'];
            return [`${numValue.toFixed(1)} cm`];
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
          dataKey="waist"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ fill: theme.palette.primary.main, r: 4 }}
          activeDot={{ r: 6 }}
          name="Waist (cm)"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="bicep"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={{ fill: theme.palette.secondary.main, r: 4 }}
          activeDot={{ r: 6 }}
          name="Bicep (cm)"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="thigh"
          stroke={theme.palette.success.main}
          strokeWidth={2}
          dot={{ fill: theme.palette.success.main, r: 4 }}
          activeDot={{ r: 6 }}
          name="Thigh (cm)"
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
