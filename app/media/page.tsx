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
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/contexts/AuthContext';
import { getProgressMedia, deleteProgressMedia } from '@/lib/firestore';
import { deletePhoto, deleteMedia } from '@/lib/storage';
import type { ProgressMedia } from '@/types';

export default function MediaGalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [allMedia, setAllMedia] = useState<ProgressMedia[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<ProgressMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; media: ProgressMedia | null }>({
    open: false,
    media: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    mediaId: string | null;
    media: ProgressMedia | null;
  }>({
    open: false,
    mediaId: null,
    media: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadMedia();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Filter media based on selected tab
    if (mediaFilter === 'all') {
      setFilteredMedia(allMedia);
    } else {
      setFilteredMedia(allMedia.filter((m) => m.type === mediaFilter));
    }
  }, [mediaFilter, allMedia]);

  const loadMedia = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getProgressMedia(user.uid);
      setAllMedia(data);
      setFilteredMedia(data);
    } catch (err) {
      console.error('Error loading media:', err);
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (media: ProgressMedia) => {
    setViewDialog({ open: true, media });
  };

  const handleViewClose = () => {
    setViewDialog({ open: false, media: null });
  };

  const handleDeleteClick = (mediaId: string, media: ProgressMedia) => {
    setDeleteDialog({ open: true, mediaId, media });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteDialog.mediaId || !deleteDialog.media) return;

    try {
      setDeleting(true);

      // Delete from storage
      if (deleteDialog.media.type === 'photo' && deleteDialog.media.thumbnailPath) {
        await deletePhoto(deleteDialog.media.storagePath, deleteDialog.media.thumbnailPath);
      } else {
        await deleteMedia(deleteDialog.media.storagePath);
      }

      // Delete from Firestore
      await deleteProgressMedia(user.uid, deleteDialog.mediaId);

      // Remove from local state
      setAllMedia((prev) => prev.filter((m) => m.id !== deleteDialog.mediaId));

      setDeleteDialog({ open: false, mediaId: null, media: null });
    } catch (err) {
      console.error('Error deleting media:', err);
      setError('Failed to delete media. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, mediaId: null, media: null });
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Progress Media
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/media/add')}
          >
            Add Media
          </Button>
        </Box>

        <Tabs
          value={mediaFilter}
          onChange={(_, newValue) => setMediaFilter(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label={`All (${allMedia.length})`} value="all" />
          <Tab
            label={`Photos (${allMedia.filter((m) => m.type === 'photo').length})`}
            value="photo"
          />
          <Tab
            label={`Videos (${allMedia.filter((m) => m.type === 'video').length})`}
            value="video"
          />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {filteredMedia.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No {mediaFilter !== 'all' ? mediaFilter + 's' : 'media'} yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start documenting your progress with photos and videos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/media/add')}
            >
              Add First Media
            </Button>
          </Box>
        ) : (
          <ImageList cols={3} gap={16} sx={{ mb: 2 }}>
            {filteredMedia.map((media) => (
              <ImageListItem key={media.id} sx={{ cursor: 'pointer', position: 'relative' }}>
                <Box onClick={() => handleViewClick(media)} sx={{ position: 'relative' }}>
                  <img
                    src={media.thumbnailUrl}
                    alt={formatDate(media.date)}
                    loading="lazy"
                    style={{ width: '100%', height: 200, objectFit: 'cover' }}
                  />
                  {media.type === 'video' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PlayArrowIcon sx={{ color: 'white', fontSize: 40 }} />
                    </Box>
                  )}
                </Box>
                <ImageListItemBar
                  title={formatDate(media.date)}
                  subtitle={media.weight ? `${media.weight} kg` : undefined}
                  actionIcon={
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(media.id, media);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </Box>
      </Paper>

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onClose={handleViewClose} maxWidth="md" fullWidth>
        {viewDialog.media && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{formatDate(viewDialog.media.date)}</Typography>
                <IconButton onClick={handleViewClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {viewDialog.media.type === 'photo' ? (
                <img
                  src={viewDialog.media.mediaUrl}
                  alt={formatDate(viewDialog.media.date)}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <video
                  src={viewDialog.media.mediaUrl}
                  controls
                  style={{ width: '100%', height: 'auto' }}
                />
              )}
              <Box sx={{ mt: 2 }}>
                {viewDialog.media.weight && (
                  <Chip label={`Weight: ${viewDialog.media.weight} kg`} sx={{ mr: 1, mb: 1 }} />
                )}
                <Chip label={formatFileSize(viewDialog.media.fileSize)} sx={{ mr: 1, mb: 1 }} />
                {viewDialog.media.duration && (
                  <Chip label={`${viewDialog.media.duration}s`} sx={{ mb: 1 }} />
                )}
              </Box>
              {viewDialog.media.notes && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Notes:</strong> {viewDialog.media.notes}
                </Typography>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Media?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteDialog.media?.type}? This action cannot be
            undone.
          </Typography>
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
