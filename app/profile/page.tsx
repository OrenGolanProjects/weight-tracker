'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, createUserProfile } from '@/lib/firestore';
import type { User } from '@/types';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUserProfile();
    }
  }, [user, authLoading, router]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const profile = await getUserProfile(user.uid);

      if (profile) {
        setFormData({
          name: profile.name || '',
          age: profile.age ? profile.age.toString() : '',
          height: profile.height ? profile.height.toString() : '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age) || age < 1 || age > 150) {
      setError('Please enter a valid age (1-150)');
      return;
    }

    const height = parseFloat(formData.height);
    if (!formData.height || isNaN(height) || height < 50 || height > 300) {
      setError('Please enter a valid height in cm (50-300)');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const profileData = {
        email: user.email || '',
        name: formData.name.trim(),
        age,
        height,
        photoURL: user.photoURL || null,
      };

      // Check if profile exists
      const existingProfile = await getUserProfile(user.uid);

      if (existingProfile) {
        await updateUserProfile(user.uid, profileData);
      } else {
        await createUserProfile(user.uid, profileData);
      }

      setSuccess(true);

      // Redirect to home after 1.5 seconds
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Personal Details
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Please complete your profile to get started
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile saved successfully! Redirecting...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
            autoFocus
          />

          <TextField
            fullWidth
            required
            type="number"
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
            inputProps={{ min: 1, max: 150 }}
          />

          <TextField
            fullWidth
            required
            type="number"
            label="Height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
            inputProps={{ min: 50, max: 300, step: 0.1 }}
            helperText="Enter your height in centimeters"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={saving}
            sx={{ mt: 3, mb: 2 }}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Profile'}
          </Button>

          <Button fullWidth variant="outlined" onClick={() => router.push('/')} disabled={saving}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
