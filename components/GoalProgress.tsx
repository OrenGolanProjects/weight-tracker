'use client';

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';

interface GoalProgressProps {
  currentWeight: number;
  goalWeight: number;
  startWeight?: number;
}

export default function GoalProgress({
  currentWeight,
  goalWeight,
  startWeight,
}: GoalProgressProps) {
  const theme = useTheme();

  const goalData = useMemo(() => {
    const difference = currentWeight - goalWeight;
    const isWeightLoss = goalWeight < currentWeight;
    const achieved = Math.abs(difference) < 0.5; // Within 0.5kg is considered achieved

    // Calculate progress percentage
    let progress = 0;
    if (startWeight && startWeight !== goalWeight) {
      const totalDistance = Math.abs(startWeight - goalWeight);
      const currentDistance = Math.abs(startWeight - currentWeight);
      progress = Math.min((currentDistance / totalDistance) * 100, 100);
    } else if (achieved) {
      progress = 100;
    }

    return {
      difference: Math.abs(difference),
      isWeightLoss,
      achieved,
      progress: Math.round(progress),
      remaining: Math.abs(difference).toFixed(1),
    };
  }, [currentWeight, goalWeight, startWeight]);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <FlagIcon color="primary" />
          <Typography variant="h6">Goal Progress</Typography>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current: <strong>{currentWeight.toFixed(1)} kg</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Goal: <strong>{goalWeight.toFixed(1)} kg</strong>
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={goalData.progress}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: goalData.achieved
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
          >
            {goalData.progress}% Complete
          </Typography>
        </Box>

        {goalData.achieved ? (
          <Chip
            icon={<CheckCircleIcon />}
            label="Goal Achieved! 🎉"
            color="success"
            sx={{ width: '100%' }}
          />
        ) : (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            {goalData.isWeightLoss ? (
              <TrendingDownIcon color="success" fontSize="small" />
            ) : (
              <TrendingUpIcon color="primary" fontSize="small" />
            )}
            <Typography variant="body2" color="text.secondary">
              <strong>{goalData.remaining} kg</strong>{' '}
              {goalData.isWeightLoss ? 'to lose' : 'to gain'}
            </Typography>
          </Stack>
        )}

        {startWeight && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: 'block', textAlign: 'center' }}
          >
            Started at: {startWeight.toFixed(1)} kg
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
