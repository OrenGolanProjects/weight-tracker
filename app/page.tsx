'use client';

import { useEffect, useState, useRef } from 'react';
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
  Fab,
  Zoom,
  useScrollTrigger,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CasinoIcon from '@mui/icons-material/Casino';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import ImageIcon from '@mui/icons-material/Image';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserProfile,
  getLatestWeight,
  getTodayAndYesterdayWeight,
  getWeightEntries,
  getBodyMeasurements,
  getProgressMedia,
  getPinnedDocuments,
} from '@/lib/firestore';
import {
  calculateBMI,
  calculateWeightChange,
  calculateBodyFat,
  getBodyFatCategory,
} from '@/lib/utils';
import { exportSummaryReport } from '@/lib/export';
import type {
  User as UserProfile,
  WeightEntry,
  BodyMeasurement,
  Document,
  DocumentType,
} from '@/types';
import WeightChart from '@/components/WeightChart';
import BodyMeasurementsChart from '@/components/BodyMeasurementsChart';
import GoalProgress from '@/components/GoalProgress';
import WeightStatistics from '@/components/WeightStatistics';
import BMITrendChart from '@/components/BMITrendChart';
import UpdateAppButton from '@/components/UpdateAppButton';
import ColorModeToggle from '@/components/ColorModeToggle';
import QuickAddWeight from '@/components/QuickAddWeight';
import DashboardSkeleton from '@/components/DashboardSkeleton';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
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
  const [pinnedDocuments, setPinnedDocuments] = useState<Document[]>([]);

  // Ensure component is mounted on client before rendering dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Refs for scroll navigation
  const historyRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll trigger for showing/hiding FABs
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  // Update scroll state when trigger changes
  useEffect(() => {
    setIsScrolled(trigger);
  }, [trigger]);

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else if (!loading) {
      // If auth is done loading and there's no user, stop showing data loading spinner
      setDataLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const loadDashboardData = async () => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    try {
      setDataLoading(true);

      // Load all data in parallel
      const [userProfile, latest, comparison, entries, measurements, media, pinned] =
        await Promise.all([
          getUserProfile(user.uid),
          getLatestWeight(user.uid),
          getTodayAndYesterdayWeight(user.uid),
          getWeightEntries(user.uid),
          getBodyMeasurements(user.uid),
          getProgressMedia(user.uid),
          getPinnedDocuments(user.uid),
        ]);

      setProfile(userProfile);
      setLatestWeight(latest);
      setWeightEntries(entries);
      setBodyMeasurements(measurements);
      setTotalEntries(entries.length);
      setTotalMeasurements(measurements.length);
      setTotalMedia(media.length);
      setPinnedDocuments(pinned);

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

  const getDocumentIcon = (doc: Document) => {
    const mimeType = doc.mimeType;
    if (mimeType === 'application/pdf') {
      return <PictureAsPdfIcon sx={{ fontSize: 40, color: 'error.main' }} />;
    }
    if (mimeType.includes('word') || mimeType === 'application/msword') {
      return <ArticleIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
    }
    if (mimeType.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 40, color: 'success.main' }} />;
    }
    return <DescriptionIcon sx={{ fontSize: 40, color: 'text.secondary' }} />;
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'training_plan':
        return <FitnessCenterOutlinedIcon fontSize="small" color="primary" />;
      case 'diet_plan':
        return <RestaurantIcon fontSize="small" color="success" />;
      case 'custom':
        return <DescriptionIcon fontSize="small" color="action" />;
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'training_plan':
        return 'Training Plan';
      case 'diet_plan':
        return 'Diet Plan';
      case 'custom':
        return 'Custom';
    }
  };

  // Show a skeleton during SSR, auth check, or initial mount
  if (!mounted || loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const bmi = getBMI();
  const bodyFat = bmi ? calculateBodyFat(bmi, profile?.age, profile?.gender) : null;

  return (
    <Box sx={{ flexGrow: 1 }} ref={topRef} key={`home-${user.uid}-${dataLoading}`}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <FitnessCenterIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Weight Tracker
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 2 } }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
              {user.email}
            </Typography>
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
            <ColorModeToggle />
            <UpdateAppButton />
            <IconButton color="inherit" onClick={() => router.push('/settings')} title="Settings">
              <SettingsIcon />
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

        {/* One-tap daily weight logging */}
        <QuickAddWeight
          uid={user.uid}
          lastWeight={latestWeight?.weight}
          onAdded={loadDashboardData}
        />

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
                      Body Fat %
                    </Typography>
                    {bodyFat !== null && profile?.gender ? (
                      <>
                        <Typography variant="h4">{bodyFat.toFixed(1)}%</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getBodyFatCategory(bodyFat, profile.gender)} · est.
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h4">--</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {!bmi
                            ? 'Add weight & height'
                            : !profile?.gender
                              ? 'Add gender in profile'
                              : 'Add age in profile'}
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
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CasinoIcon />}
                  size="large"
                  color="secondary"
                  sx={{ py: 2 }}
                  onClick={() => router.push('/meals')}
                >
                  Generate Meal
                </Button>
              </Stack>
            </Box>

            {/* Pinned Documents Section */}
            {pinnedDocuments.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PushPinIcon color="primary" />
                  <Typography variant="h5">Pinned Documents</Typography>
                </Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ flexWrap: 'wrap' }}
                >
                  {pinnedDocuments.map((doc) => (
                    <Box
                      key={doc.id}
                      sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}
                    >
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                          },
                        }}
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box sx={{ flexShrink: 0 }}>{getDocumentIcon(doc)}</Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                noWrap
                                title={doc.name}
                              >
                                {doc.name}
                              </Typography>
                              <Box
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                              >
                                {getDocumentTypeIcon(doc.type)}
                                <Typography variant="body2" color="text.secondary">
                                  {getDocumentTypeLabel(doc.type)}
                                </Typography>
                              </Box>
                              {doc.notes && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={doc.notes}
                                >
                                  {doc.notes}
                                </Typography>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.fileUrl, '_blank');
                              }}
                              title="Open document"
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Stack>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => router.push('/media')}
                  sx={{ mt: 1 }}
                >
                  View all files
                </Button>
              </Box>
            )}

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
              <Box sx={{ mb: 4, textAlign: 'center' }} ref={historyRef}>
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

      {/* Floating Navigation Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Scroll to Top Button - shows when scrolled down */}
        <Zoom in={isScrolled}>
          <Fab
            color="primary"
            size="medium"
            onClick={scrollToTop}
            aria-label="scroll to top"
            sx={{
              boxShadow: 3,
              '&:hover': { boxShadow: 6 },
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Zoom>

        {/* Scroll to History Button - shows when at top and there's content */}
        {!dataLoading && (totalEntries > 0 || totalMeasurements > 0 || totalMedia > 0) && (
          <Zoom in={!isScrolled}>
            <Fab
              color="secondary"
              size="medium"
              onClick={scrollToHistory}
              aria-label="scroll to history"
              sx={{
                boxShadow: 3,
                '&:hover': { boxShadow: 6 },
              }}
            >
              <KeyboardArrowDownIcon />
            </Fab>
          </Zoom>
        )}
      </Box>
    </Box>
  );
}
