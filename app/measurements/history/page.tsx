'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import StraightenIcon from '@mui/icons-material/Straighten';
import { useAuth } from '@/contexts/AuthContext';
import { getBodyMeasurements, deleteBodyMeasurement } from '@/lib/firestore';
import { exportBodyMeasurementsToCSV } from '@/lib/export';
import type { BodyMeasurement } from '@/types';
import BodyMeasurementsChart from '@/components/BodyMeasurementsChart';
import EmptyState from '@/components/EmptyState';

export default function MeasurementsHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; measurementId: string | null }>(
    {
      open: false,
      measurementId: null,
    }
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadMeasurements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadMeasurements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getBodyMeasurements(user.uid);
      setMeasurements(data);
    } catch (err) {
      console.error('Error loading measurements:', err);
      setError('Failed to load measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (measurementId: string) => {
    setDeleteDialog({ open: true, measurementId });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteDialog.measurementId) return;

    try {
      setDeleting(true);
      await deleteBodyMeasurement(user.uid, deleteDialog.measurementId);

      // Remove from local state
      setMeasurements((prev) => prev.filter((m) => m.id !== deleteDialog.measurementId));

      setDeleteDialog({ open: false, measurementId: null });
    } catch (err) {
      console.error('Error deleting measurement:', err);
      setError('Failed to delete measurement. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, measurementId: null });
  };

  const handleExport = () => {
    exportBodyMeasurementsToCSV(measurements);
  };

  const formatDate = (timestamp: { toDate?: () => Date } | Date | null | undefined) => {
    if (!timestamp) return 'N/A';
    const date =
      typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp as Date);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMeasurement = (value: number | null) => {
    return value !== null ? `${value.toFixed(1)} cm` : '-';
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Measurements History
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={measurements.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/measurements/add')}
            >
              Add Entry
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {measurements.length === 0 ? (
          <EmptyState
            icon={<StraightenIcon />}
            title="No measurements yet"
            description="Start tracking your body measurements to monitor your progress"
            actionLabel="Add first measurement"
            onAction={() => router.push('/measurements/add')}
          />
        ) : (
          <>
            {/* Body Measurements Chart */}
            <Box sx={{ mb: 4 }}>
              <BodyMeasurementsChart measurements={measurements} height={300} />
            </Box>

            {/* Measurements Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Waist</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Bicep</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Thigh</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {measurements.map((measurement) => (
                    <TableRow key={measurement.id} hover>
                      <TableCell>{formatDate(measurement.date)}</TableCell>
                      <TableCell align="right">{formatMeasurement(measurement.waist)}</TableCell>
                      <TableCell align="right">{formatMeasurement(measurement.bicep)}</TableCell>
                      <TableCell align="right">{formatMeasurement(measurement.thigh)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => router.push(`/measurements/edit?id=${measurement.id}`)}
                          title="Edit measurement"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(measurement.id)}
                          title="Delete measurement"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Measurement?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this measurement? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
