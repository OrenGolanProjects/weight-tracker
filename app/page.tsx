'use client';

import { useEffect } from 'react';
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
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
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
            Welcome back, {user.displayName || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your fitness journey
          </Typography>
        </Box>

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
                <Typography variant="h4">-- kg</Typography>
                <Typography variant="body2" color="text.secondary">
                  No data yet
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  BMI
                </Typography>
                <Typography variant="h4">--</Typography>
                <Typography variant="body2" color="text.secondary">
                  Calculate your BMI
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Weight Change
                </Typography>
                <Typography variant="h4">--%</Typography>
                <Typography variant="body2" color="text.secondary">
                  vs yesterday
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Entries
                </Typography>
                <Typography variant="h4">0</Typography>
                <Typography variant="body2" color="text.secondary">
                  Start tracking today
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
            >
              Add Weight
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              size="large"
              sx={{ py: 2 }}
            >
              Add Measurements
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              size="large"
              sx={{ py: 2 }}
            >
              Add Photo/Video
            </Button>
          </Stack>
        </Box>

        {/* Getting Started Guide */}
        <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body2">
              1. Complete your profile with age and height
              <br />
              2. Add your first weight entry
              <br />
              3. Track your body measurements monthly
              <br />
              4. Upload progress photos to visualize your journey
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2 }}
              onClick={() => router.push('/profile')}
            >
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
