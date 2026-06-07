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
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import { useAuth } from '@/contexts/AuthContext';
import { getWeightEntries, deleteWeightEntry } from '@/lib/firestore';
import { exportWeightEntriesToCSV } from '@/lib/export';
import type { WeightEntry } from '@/types';
import WeightChart from '@/components/WeightChart';
import EmptyState from '@/components/EmptyState';

export default function WeightHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; entryId: string | null }>({
    open: false,
    entryId: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getWeightEntries(user.uid);
      setEntries(data);
    } catch (err) {
      console.error('Error loading weight entries:', err);
      setError('Failed to load weight entries');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (entryId: string) => {
    setDeleteDialog({ open: true, entryId });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteDialog.entryId) return;

    try {
      setDeleting(true);
      await deleteWeightEntry(user.uid, deleteDialog.entryId);

      // Remove from local state
      setEntries((prev) => prev.filter((e) => e.id !== deleteDialog.entryId));

      setDeleteDialog({ open: false, entryId: null });
    } catch (err) {
      console.error('Error deleting weight entry:', err);
      setError('Failed to delete entry. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, entryId: null });
  };

  const handleExport = () => {
    exportWeightEntriesToCSV(entries);
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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Weight History
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={entries.length === 0}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/weight/add')}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
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

        {entries.length === 0 ? (
          <EmptyState
            icon={<MonitorWeightIcon />}
            title="No weight entries yet"
            description="Start tracking your weight to see your progress"
            actionLabel="Add first entry"
            onAction={() => router.push('/weight/add')}
          />
        ) : (
          <>
            {/* Weight Progress Chart */}
            <Box sx={{ mb: 4 }}>
              <WeightChart entries={entries} height={300} />
            </Box>

            {/* Weight Entries Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Date</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Weight (kg)</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell align="right">{entry.weight.toFixed(1)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => router.push(`/weight/edit?id=${entry.id}`)}
                          title="Edit entry"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(entry.id)}
                          title="Delete entry"
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
        <DialogTitle>Delete Weight Entry?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this weight entry? This action cannot be undone.
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
