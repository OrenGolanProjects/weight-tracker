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
  Tabs,
  Tab,
  Card,
  CardMedia,
  LinearProgress,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPhoto, uploadVideo, getVideoDuration } from '@/lib/storage';
import { addProgressMedia } from '@/lib/firestore';

export default function AddMediaPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Cleanup preview URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'photo' | 'video') => {
    setMediaType(newValue);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (mediaType === 'photo' && !selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (mediaType === 'video' && !selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size
    if (mediaType === 'photo' && selectedFile.size > 10 * 1024 * 1024) {
      setError('Photo size must be less than 10MB');
      return;
    }
    if (mediaType === 'video' && selectedFile.size > 100 * 1024 * 1024) {
      setError('Video size must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    // Validation
    if (!date) {
      setError('Please select a date');
      return;
    }

    const weightNum = weight ? parseFloat(weight) : undefined;
    if (weight && (isNaN(weightNum!) || weightNum! <= 0 || weightNum! > 500)) {
      setError('Weight must be between 0.1-500 kg');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);
      setError(null);

      const mediaId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setUploadProgress(40);

      if (mediaType === 'photo') {
        // Upload photo
        const { originalUrl, thumbnailUrl, originalPath, thumbnailPath, fileSize } =
          await uploadPhoto(user.uid, file, mediaId);

        setUploadProgress(80);

        // Save metadata to Firestore
        await addProgressMedia(user.uid, {
          date: date.toDate(),
          type: 'photo',
          mediaUrl: originalUrl,
          thumbnailUrl,
          storagePath: originalPath,
          thumbnailPath,
          fileSize,
          weight: weightNum,
          notes: notes.trim() || undefined,
        });
      } else {
        // Get video duration
        const duration = await getVideoDuration(file);

        setUploadProgress(60);

        // Upload video
        const { videoUrl, videoPath, fileSize } = await uploadVideo(user.uid, file, mediaId);

        setUploadProgress(90);

        // Save metadata to Firestore
        await addProgressMedia(user.uid, {
          date: date.toDate(),
          type: 'video',
          mediaUrl: videoUrl,
          thumbnailUrl: videoUrl, // Use video URL as thumbnail for now
          storagePath: videoPath,
          duration,
          fileSize,
          weight: weightNum,
          notes: notes.trim() || undefined,
        });
      }

      setUploadProgress(100);
      setSuccess(true);

      // Redirect to media gallery after 1.5 seconds
      setTimeout(() => {
        router.push('/media');
      }, 1500);
    } catch (err) {
      console.error('Error uploading media:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload media. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
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
          Add Progress Media
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Upload photos or videos to track your progress
        </Typography>

        <Tabs value={mediaType} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab icon={<PhotoCameraIcon />} label="Photo" value="photo" />
          <Tab icon={<VideocamIcon />} label="Video" value="video" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Media uploaded successfully! Redirecting...
          </Alert>
        )}

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Button
            variant="contained"
            component="label"
            fullWidth
            startIcon={mediaType === 'photo' ? <PhotoCameraIcon /> : <VideocamIcon />}
            sx={{ mb: 2 }}
            disabled={uploading}
          >
            {file ? 'Change File' : `Select ${mediaType === 'photo' ? 'Photo' : 'Video'}`}
            <input
              type="file"
              hidden
              accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
              onChange={handleFileChange}
            />
          </Button>

          {previewUrl && (
            <Card sx={{ mb: 2 }}>
              {mediaType === 'photo' ? (
                <CardMedia
                  component="img"
                  image={previewUrl}
                  alt="Preview"
                  sx={{ maxHeight: 300, objectFit: 'contain' }}
                />
              ) : (
                <CardMedia
                  component="video"
                  src={previewUrl}
                  controls
                  sx={{ maxHeight: 300, width: '100%' }}
                />
              )}
            </Card>
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newValue) => {
                setDate(newValue);
                setError(null);
              }}
              disabled={uploading}
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
            label="Weight (Optional)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            margin="normal"
            disabled={uploading}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            inputProps={{ min: 0.1, max: 500, step: 0.1 }}
            helperText="Your weight at the time of this photo/video"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            disabled={uploading}
            helperText="Add any notes about your progress"
            inputProps={{ maxLength: 500 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={uploading || !file}
            sx={{ mt: 3, mb: 2 }}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload Media'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/')}
            disabled={uploading}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
