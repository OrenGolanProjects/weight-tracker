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
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { addBodyMeasurement } from '@/lib/firestore';

export default function AddMeasurementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [formData, setFormData] = useState({
    waist: '',
    bicep: '',
    thigh: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
    if (!date) {
      setError('Please select a date');
      return;
    }

    const waist = formData.waist ? parseFloat(formData.waist) : null;
    const bicep = formData.bicep ? parseFloat(formData.bicep) : null;
    const thigh = formData.thigh ? parseFloat(formData.thigh) : null;

    // At least one measurement is required
    if (!waist && !bicep && !thigh) {
      setError('Please enter at least one measurement');
      return;
    }

    // Validate ranges
    if (waist !== null && (isNaN(waist) || waist <= 0 || waist > 300)) {
      setError('Waist measurement must be between 0.1-300 cm');
      return;
    }
    if (bicep !== null && (isNaN(bicep) || bicep <= 0 || bicep > 100)) {
      setError('Bicep measurement must be between 0.1-100 cm');
      return;
    }
    if (thigh !== null && (isNaN(thigh) || thigh <= 0 || thigh > 150)) {
      setError('Thigh measurement must be between 0.1-150 cm');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await addBodyMeasurement(user.uid, {
        date: date.toDate(),
        waist,
        bicep,
        thigh,
      });

      setSuccess(true);

      // Redirect to home after 1 second
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('Error saving body measurements:', err);
      setError('Failed to save measurements. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
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
          Add Body Measurements
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Track your body measurements (monthly recommended)
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Measurements saved! Redirecting...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newValue) => {
                setDate(newValue);
                setError(null);
                setSuccess(false);
              }}
              disabled={saving}
              maxDate={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  required: true,
                },
              }}
            />
          </LocalizationProvider>

          <TextField
            fullWidth
            type="number"
            label="Waist"
            name="waist"
            value={formData.waist}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
            inputProps={{ min: 0.1, max: 300, step: 0.1 }}
            helperText="Optional: Waist measurement in centimeters"
            autoFocus
          />

          <TextField
            fullWidth
            type="number"
            label="Bicep"
            name="bicep"
            value={formData.bicep}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
            inputProps={{ min: 0.1, max: 100, step: 0.1 }}
            helperText="Optional: Bicep measurement in centimeters"
          />

          <TextField
            fullWidth
            type="number"
            label="Thigh"
            name="thigh"
            value={formData.thigh}
            onChange={handleChange}
            margin="normal"
            disabled={saving}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
            inputProps={{ min: 0.1, max: 150, step: 0.1 }}
            helperText="Optional: Thigh measurement in centimeters"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={saving}
            sx={{ mt: 3, mb: 2 }}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Measurements'}
          </Button>

          <Button fullWidth variant="outlined" onClick={() => router.push('/')} disabled={saving}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
