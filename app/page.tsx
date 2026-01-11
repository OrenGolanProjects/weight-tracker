'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserProfile,
  getLatestWeight,
  getTodayAndYesterdayWeight,
  getWeightEntries,
  getBodyMeasurements,
  getProgressMedia,
} from '@/lib/firestore';
import { calculateBMI, calculateWeightChange } from '@/lib/utils';
import { exportSummaryReport } from '@/lib/export';
import type { User as UserProfile, WeightEntry, BodyMeasurement } from '@/types';
import WeightChart from '@/components/WeightChart';
import BodyMeasurementsChart from '@/components/BodyMeasurementsChart';
import GoalProgress from '@/components/GoalProgress';
import WeightStatistics from '@/components/WeightStatistics';
import BMITrendChart from '@/components/BMITrendChart';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [dataLoading, setDataLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightEntry | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightComparison, setWeightComparison] = useState<{
    today: number;
    yesterday: number;
    percentageChange: number;
    status: 'Gain' | 'Loss' | 'Same';
  } | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalMeasurements, setTotalMeasurements] = useState(0);
  const [totalMedia, setTotalMedia] = useState(0);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setDataLoading(true);

      // Load all data in parallel
      const [userProfile, latest, comparison, entries, measurements, media] = await Promise.all([
        getUserProfile(user.uid),
        getLatestWeight(user.uid),
        getTodayAndYesterdayWeight(user.uid),
        getWeightEntries(user.uid),
        getBodyMeasurements(user.uid),
        getProgressMedia(user.uid),
      ]);

      setProfile(userProfile);
      setLatestWeight(latest);
      setWeightEntries(entries);
      setBodyMeasurements(measurements);
      setTotalEntries(entries.length);
      setTotalMeasurements(measurements.length);
      setTotalMedia(media.length);

      if (comparison.today && comparison.yesterday) {
        setWeightComparison(
          calculateWeightChange(comparison.today.weight, comparison.yesterday.weight)
        );
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getBMI = () => {
    if (!latestWeight || !profile?.height) return null;
    return calculateBMI(latestWeight.weight, profile.height);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const handleExportSummary = () => {
    exportSummaryReport(profile, weightEntries, bodyMeasurements);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const bmi = getBMI();

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <FitnessCenterIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Weight Tracker
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user.email}</Typography>
            <IconButton
              onClick={() => router.push('/profile')}
              title="Edit Profile"
              sx={{ p: 0.5 }}
            >
              <Avatar
                src={user.photoURL || ''}
                alt={user.displayName || 'User'}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {profile?.name || user.displayName || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your fitness journey
          </Typography>
        </Box>

        {dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Metrics Cards */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              sx={{ mb: 4, flexWrap: 'wrap' }}
            >
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Current Weight
                    </Typography>
                    {latestWeight ? (
                      <>
                        <Typography variant="h4">{latestWeight.weight.toFixed(1)} kg</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(latestWeight.date.toDate()).toLocaleDateString()}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h4">-- kg</Typography>
                        <Typography variant="body2" color="text.secondary">
                          No data yet
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      BMI
                    </Typography>
                    {bmi ? (
                      <>
                        <Typography variant="h4">{bmi.toFixed(1)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getBMICategory(bmi)}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h4">--</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {!profile?.height ? 'Add height in profile' : 'Add weight entry'}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Weight Change
                    </Typography>
                    {weightComparison && weightComparison.status !== 'Same' ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h4">
                            {weightComparison.percentageChange.toFixed(1)}%
                          </Typography>
                          {weightComparison.status === 'Loss' ? (
                            <TrendingDownIcon color="success" />
                          ) : (
                            <TrendingUpIcon color="error" />
                          )}
                        </Box>
                        <Chip
                          label={weightComparison.status}
                          color={weightComparison.status === 'Loss' ? 'success' : 'error'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </>
                    ) : (
                      <>
                        <Typography variant="h4">--%</Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs yesterday
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Entries
                    </Typography>
                    <Typography variant="h4">{totalEntries}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {totalEntries === 0 ? 'Start tracking today' : 'weight entries'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Stack>

            {/* Goal Progress */}
            {latestWeight && profile?.goalWeight && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Weight Goal
                </Typography>
                <GoalProgress
                  currentWeight={latestWeight.weight}
                  goalWeight={profile.goalWeight}
                  startWeight={
                    weightEntries.length > 0
                      ? weightEntries[weightEntries.length - 1].weight
                      : undefined
                  }
                />
              </Box>
            )}

            {/* Statistics & Analytics */}
            {weightEntries.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <WeightStatistics entries={weightEntries} />
              </Box>
            )}

            {/* Charts Section - 3 in a row */}
            {(weightEntries.length > 0 || bodyMeasurements.length > 0) && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  Progress Charts
                </Typography>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{ flexWrap: 'wrap' }}
                >
                  {/* Weight Progress Chart */}
                  {weightEntries.length > 0 && (
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 32%' } }}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                            Weight Progress
                          </Typography>
                          <WeightChart entries={weightEntries} height={250} />
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* BMI Trend Chart */}
                  {weightEntries.length > 0 && profile?.height && (
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 32%' } }}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                            BMI Trend
                          </Typography>
                          <BMITrendChart
                            entries={weightEntries}
                            height={profile.height}
                            chartHeight={250}
                          />
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* Body Measurements Chart */}
                  {bodyMeasurements.length > 0 && (
                    <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 32%' } }}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem' }}>
                            Body Measurements
                          </Typography>
                          <BodyMeasurementsChart measurements={bodyMeasurements} height={250} />
                        </CardContent>
                      </Card>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}

            {/* Quick Actions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Quick Actions
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{ py: 2 }}
                  onClick={() => router.push('/weight/add')}
                >
                  Add Weight
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{ py: 2 }}
                  onClick={() => router.push('/measurements/add')}
                >
                  Add Measurements
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{ py: 2 }}
                  onClick={() => router.push('/media/add')}
                >
                  Add Photo/Video
                </Button>
              </Stack>
            </Box>

            {/* Export & Reports */}
            {(weightEntries.length > 0 || bodyMeasurements.length > 0) && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Export & Reports
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  size="large"
                  sx={{ py: 2 }}
                  onClick={handleExportSummary}
                  fullWidth
                >
                  Export Summary Report
                </Button>
              </Box>
            )}

            {/* View History Buttons */}
            {(totalEntries > 0 || totalMeasurements > 0 || totalMedia > 0) && (
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  {totalEntries > 0 && (
                    <Button variant="outlined" onClick={() => router.push('/weight/history')}>
                      View Weight History
                    </Button>
                  )}
                  {totalMeasurements > 0 && (
                    <Button variant="outlined" onClick={() => router.push('/measurements/history')}>
                      View Measurements History
                    </Button>
                  )}
                  {totalMedia > 0 && (
                    <Button variant="outlined" onClick={() => router.push('/media')}>
                      View Media Gallery
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {/* Getting Started Guide */}
            {(!profile || !latestWeight) && (
              <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Getting Started
                  </Typography>
                  <Typography variant="body2">
                    {!profile && '1. Complete your profile with age and height'}
                    {profile && !latestWeight && '1. Add your first weight entry'}
                    <br />
                    2. Add your first weight entry
                    <br />
                    3. Track your body measurements monthly
                    <br />
                    4. Upload progress photos to visualize your journey
                  </Typography>
                  {!profile ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ mt: 2 }}
                      onClick={() => router.push('/profile')}
                    >
                      Complete Profile
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ mt: 2 }}
                      onClick={() => router.push('/weight/add')}
                    >
                      Add First Weight
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
