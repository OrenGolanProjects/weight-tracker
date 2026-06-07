'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Paper,
  Stack,
  Chip,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useAuth } from '@/contexts/AuthContext';
import { getProgressMedia } from '@/lib/firestore';
import type { ProgressMedia } from '@/types';
import type { Timestamp } from 'firebase/firestore';

export default function PhotoComparePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  // Fewer columns on phones so thumbnails don't get squashed/distorted.
  const gridCols = useMediaQuery(theme.breakpoints.down('sm')) ? 2 : 4;

  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<ProgressMedia[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<ProgressMedia | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<ProgressMedia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadPhotos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getProgressMedia(user.uid);
      // Filter to only photos
      const photoData = data.filter((m) => m.type === 'photo');
      setPhotos(photoData);

      // Auto-select first and last photo if available
      if (photoData.length >= 2) {
        setSelectedBefore(photoData[photoData.length - 1]); // Oldest
        setSelectedAfter(photoData[0]); // Newest
      }
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = selectedBefore;
    setSelectedBefore(selectedAfter);
    setSelectedAfter(temp);
  };

  const handlePhotoSelect = (photo: ProgressMedia, position: 'before' | 'after') => {
    if (position === 'before') {
      setSelectedBefore(photo);
    } else {
      setSelectedAfter(photo);
    }
  };

  const formatDate = (date: Timestamp | Date) => {
    const dateObj =
      typeof date === 'object' && 'toDate' in date && date.toDate
        ? date.toDate()
        : new Date(date as Date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/media')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <CompareArrowsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Compare Progress Photos
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {photos.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Photos Available
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              You need at least 2 photos to compare progress.
            </Typography>
            <Button variant="contained" onClick={() => router.push('/media/add')}>
              Add Your First Photo
            </Button>
          </Paper>
        ) : photos.length === 1 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Need More Photos
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              You need at least 2 photos to compare progress. Add another photo to get started.
            </Typography>
            <Button variant="contained" onClick={() => router.push('/media/add')}>
              Add Another Photo
            </Button>
          </Paper>
        ) : (
          <>
            {/* Comparison View */}
            {selectedBefore && selectedAfter && (
              <Box sx={{ mb: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h5">Comparison</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<SwapHorizIcon />}
                    onClick={handleSwap}
                    size="small"
                  >
                    Swap Photos
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                  {/* Before Photo */}
                  <Box sx={{ flex: 1 }}>
                    <Card>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          backgroundColor: 'grey.100',
                        }}
                      >
                        <Box
                          component="img"
                          src={selectedBefore.mediaUrl}
                          alt="Before"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                        <Chip
                          label="BEFORE"
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {formatDate(selectedBefore.date)}
                        </Typography>
                        {selectedBefore.weight && (
                          <Typography variant="body1" color="text.secondary">
                            Weight: <strong>{selectedBefore.weight.toFixed(1)} kg</strong>
                          </Typography>
                        )}
                        {selectedBefore.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {selectedBefore.notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>

                  {/* After Photo */}
                  <Box sx={{ flex: 1 }}>
                    <Card>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          backgroundColor: 'grey.100',
                        }}
                      >
                        <Box
                          component="img"
                          src={selectedAfter.mediaUrl}
                          alt="After"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                        <Chip
                          label="AFTER"
                          color="secondary"
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {formatDate(selectedAfter.date)}
                        </Typography>
                        {selectedAfter.weight && (
                          <Typography variant="body1" color="text.secondary">
                            Weight: <strong>{selectedAfter.weight.toFixed(1)} kg</strong>
                          </Typography>
                        )}
                        {selectedAfter.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {selectedAfter.notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Stack>

                {/* Weight Difference */}
                {selectedBefore.weight && selectedAfter.weight && (
                  <Paper sx={{ p: 3, mt: 3, textAlign: 'center', bgcolor: 'primary.light' }}>
                    <Typography variant="h6" color="primary.contrastText">
                      Weight Change
                    </Typography>
                    <Typography
                      variant="h4"
                      color="primary.contrastText"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {(selectedAfter.weight - selectedBefore.weight).toFixed(1)} kg
                    </Typography>
                    <Typography variant="body2" color="primary.contrastText">
                      {selectedAfter.weight < selectedBefore.weight ? 'Lost' : 'Gained'}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Photo Selection Grid */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Select &ldquo;Before&rdquo; Photo
              </Typography>
              <ImageList cols={gridCols} gap={16} sx={{ mb: 4 }}>
                {photos.map((photo) => (
                  <ImageListItem
                    key={photo.id}
                    onClick={() => handlePhotoSelect(photo, 'before')}
                    sx={{
                      cursor: 'pointer',
                      border: selectedBefore?.id === photo.id ? 3 : 0,
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.mediaUrl}
                      alt={`Photo ${photo.id}`}
                      loading="lazy"
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                    {selectedBefore?.id === photo.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          p: 0.5,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                    )}
                    <ImageListItemBar
                      title={formatDate(photo.date)}
                      subtitle={photo.weight ? `${photo.weight.toFixed(1)} kg` : 'No weight'}
                    />
                  </ImageListItem>
                ))}
              </ImageList>

              <Typography variant="h6" gutterBottom>
                Select &ldquo;After&rdquo; Photo
              </Typography>
              <ImageList cols={gridCols} gap={16}>
                {photos.map((photo) => (
                  <ImageListItem
                    key={photo.id}
                    onClick={() => handlePhotoSelect(photo, 'after')}
                    sx={{
                      cursor: 'pointer',
                      border: selectedAfter?.id === photo.id ? 3 : 0,
                      borderColor: 'secondary.main',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.mediaUrl}
                      alt={`Photo ${photo.id}`}
                      loading="lazy"
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                    {selectedAfter?.id === photo.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'secondary.main',
                          borderRadius: '50%',
                          p: 0.5,
                        }}
                      >
                        <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                      </Box>
                    )}
                    <ImageListItemBar
                      title={formatDate(photo.date)}
                      subtitle={photo.weight ? `${photo.weight.toFixed(1)} kg` : 'No weight'}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
