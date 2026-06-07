'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { getWeightEntries, updateWeightEntry } from '@/lib/firestore';

function EditWeightContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!entryId) {
      setError('No entry ID provided');
      setLoading(false);
      return;
    }

    if (user && entryId) {
      loadEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, entryId, router]);

  const loadEntry = async () => {
    if (!user || !entryId) return;

    try {
      setLoading(true);
      const entries = await getWeightEntries(user.uid);
      const entry = entries.find((e) => e.id === entryId);

      if (entry) {
        setDate(dayjs(entry.date.toDate()));
        setWeight(entry.weight.toString());
      } else {
        setError('Weight entry not found');
      }
    } catch (err) {
      console.error('Error loading weight entry:', err);
      setError('Failed to load weight entry');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !entryId) return;

    // Validation
    if (!date) {
      setError('Please select a date');
      return;
    }

    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      setError('Please enter a valid weight (0.1-500 kg)');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateWeightEntry(user.uid, entryId, {
        date: date.toDate(),
        weight: weightNum,
      });

      setSuccess(true);

      // Redirect to history after 1 second
      setTimeout(() => {
        router.push('/weight/history');
      }, 1000);
    } catch (err) {
      console.error('Error updating weight entry:', err);
      setError('Failed to update weight entry. Please try again.');
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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Edit Weight Entry
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Update your weight entry
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Weight entry updated! Redirecting...
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
            required
            type="number"
            label="Weight"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            margin="normal"
            disabled={saving}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            inputProps={{ min: 0.1, max: 500, step: 0.1 }}
            helperText="Enter your weight in kilograms"
            autoFocus
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={saving}
            sx={{ mt: 3, mb: 2 }}
          >
            {saving ? <CircularProgress size={24} /> : 'Update Weight Entry'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/weight/history')}
            disabled={saving}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default function EditWeightPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      }
    >
      <EditWeightContent />
    </Suspense>
  );
}
