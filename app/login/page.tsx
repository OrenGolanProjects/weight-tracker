'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Paper, Typography, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if already logged in
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Failed to sign in:', error);
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

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* App Logo/Icon */}
          <FitnessCenterIcon
            sx={{
              fontSize: 60,
              color: 'primary.main',
              mb: 2,
            }}
          />

          {/* App Title */}
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Weight Tracker
          </Typography>

          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Track your weight, body measurements, and progress with photos and videos
          </Typography>

          {/* Google Sign In Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              width: '100%',
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            Sign in with Google
          </Button>

          {/* Features List */}
          <Box sx={{ mt: 4, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Features:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Daily weight tracking
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Body measurements (waist, bicep, thigh)
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Progress photos and videos
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                BMI calculation and trends
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          Secure authentication with Google
        </Typography>
      </Box>
    </Container>
  );
}
