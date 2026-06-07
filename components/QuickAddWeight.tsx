'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  InputAdornment,
  Typography,
  CircularProgress,
} from '@mui/material';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import { addWeightEntry } from '@/lib/firestore';
import { useSnackbar } from '@/components/SnackbarProvider';

interface Props {
  uid: string;
  lastWeight?: number | null;
  onAdded: () => void;
}

/**
 * Inline "log today's weight" card so the most frequent action is one tap from
 * the dashboard instead of navigating to a separate page.
 */
export default function QuickAddWeight({ uid, lastWeight, onAdded }: Props) {
  const { showSnackbar } = useSnackbar();
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = parseFloat(weight);
    if (isNaN(value) || value <= 0 || value > 500) {
      showSnackbar('Enter a valid weight (0–500 kg)', 'error');
      return;
    }
    try {
      setSaving(true);
      await addWeightEntry(uid, { date: new Date(), weight: value });
      showSnackbar("Today's weight logged ✓", 'success');
      setWeight('');
      onAdded();
    } catch {
      showSnackbar('Failed to save weight. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <MonitorWeightIcon color="primary" />
          <Typography variant="subtitle1">Log today&rsquo;s weight</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={lastWeight ? `Last: ${lastWeight}` : 'e.g. 75.5'}
            size="small"
            fullWidth
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            inputProps={{ min: 0, max: 500, step: 0.1, inputMode: 'decimal' }}
          />
          <Button variant="contained" onClick={submit} disabled={saving || !weight} sx={{ px: 3 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
