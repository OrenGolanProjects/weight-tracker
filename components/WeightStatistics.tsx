'use client';

import { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SpeedIcon from '@mui/icons-material/Speed';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import type { WeightEntry } from '@/types';
import {
  calculateAverageWeight,
  calculateWeightChangeRate,
  getTotalWeightChange,
} from '@/lib/utils';

interface WeightStatisticsProps {
  entries: WeightEntry[];
}

export default function WeightStatistics({ entries }: WeightStatisticsProps) {
  const stats = useMemo(() => {
    const weeklyAvg = calculateAverageWeight(entries, 7);
    const monthlyAvg = calculateAverageWeight(entries, 30);
    const changeRate = calculateWeightChangeRate(entries);
    const totalChange = getTotalWeightChange(entries);

    return {
      weeklyAvg,
      monthlyAvg,
      changeRate,
      totalChange,
    };
  }, [entries]);

  if (entries.length === 0) {
    return null;
  }

  const renderStatCard = (
    title: string,
    value: string | null,
    subtitle: string,
    icon: React.ReactNode,
    trend?: 'up' | 'down' | null
  ) => (
    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            {icon}
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Stack>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {value || '--'}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {trend === 'down' && <TrendingDownIcon color="success" fontSize="small" />}
            {trend === 'up' && <TrendingUpIcon color="error" fontSize="small" />}
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Statistics & Analytics
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ flexWrap: 'wrap' }}>
        {renderStatCard(
          'Weekly Average',
          stats.weeklyAvg !== null ? `${stats.weeklyAvg} kg` : null,
          'Last 7 days',
          <CalendarMonthIcon color="primary" />
        )}

        {renderStatCard(
          'Monthly Average',
          stats.monthlyAvg !== null ? `${stats.monthlyAvg} kg` : null,
          'Last 30 days',
          <CalendarMonthIcon color="secondary" />
        )}

        {renderStatCard(
          'Change Rate',
          stats.changeRate !== null
            ? `${stats.changeRate > 0 ? '+' : ''}${stats.changeRate} kg/week`
            : null,
          'Average per week',
          <SpeedIcon color={stats.changeRate && stats.changeRate < 0 ? 'success' : 'action'} />,
          stats.changeRate
            ? stats.changeRate > 0
              ? 'up'
              : stats.changeRate < 0
                ? 'down'
                : null
            : null
        )}

        {renderStatCard(
          'Total Change',
          stats.totalChange !== null
            ? `${stats.totalChange > 0 ? '+' : ''}${stats.totalChange} kg`
            : null,
          'Since start',
          <ShowChartIcon
            color={stats.totalChange && stats.totalChange < 0 ? 'success' : 'action'}
          />,
          stats.totalChange
            ? stats.totalChange > 0
              ? 'up'
              : stats.totalChange < 0
                ? 'down'
                : null
            : null
        )}
      </Stack>
    </Box>
  );
}
