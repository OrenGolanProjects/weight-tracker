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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideocamIcon from '@mui/icons-material/Videocam';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPhoto, uploadVideo, getVideoDuration, uploadDocument } from '@/lib/storage';
import { addProgressMedia, addDocument } from '@/lib/firestore';
import { DocumentType } from '@/types';

type MediaType = 'photo' | 'video' | 'file';

export default function AddMediaPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // File-specific states
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('training_plan');
  const [pinToHome, setPinToHome] = useState(false);

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: MediaType) => {
    setMediaType(newValue);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    // Reset file-specific fields
    setDocumentName('');
    setDocumentType('training_plan');
    setPinToHome(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type based on media type
    if (mediaType === 'photo' && !selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (mediaType === 'video' && !selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }
    if (mediaType === 'file') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP');
        return;
      }
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
    if (mediaType === 'file' && selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Set default document name from file name (without extension)
    if (mediaType === 'file' && !documentName) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setDocumentName(nameWithoutExt);
    }

    // Create preview for images and videos
    if (
      mediaType === 'photo' ||
      mediaType === 'video' ||
      (mediaType === 'file' && selectedFile.type.startsWith('image/'))
    ) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    // Validation
    if (!date) {
      setError('Please select a date');
      return;
    }

    if (mediaType === 'file' && !documentName.trim()) {
      setError('Please enter a document name');
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
      } else if (mediaType === 'video') {
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
      } else if (mediaType === 'file') {
        // Upload document
        const { fileUrl, storagePath, fileSize, mimeType } = await uploadDocument(
          user.uid,
          file,
          mediaId
        );

        setUploadProgress(80);

        // Save metadata to Firestore
        await addDocument(user.uid, {
          name: documentName.trim(),
          type: documentType,
          fileUrl,
          storagePath,
          fileSize,
          mimeType,
          date: date.toDate(),
          notes: notes.trim() || undefined,
          pinToHome,
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
      setError(err instanceof Error ? err.message : 'Failed to upload. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const getAcceptTypes = () => {
    switch (mediaType) {
      case 'photo':
        return 'image/*';
      case 'video':
        return 'video/*';
      case 'file':
        return '.pdf,.doc,.docx,.txt,image/*';
    }
  };

  const getSelectButtonIcon = () => {
    switch (mediaType) {
      case 'photo':
        return <PhotoCameraIcon />;
      case 'video':
        return <VideocamIcon />;
      case 'file':
        return <InsertDriveFileIcon />;
    }
  };

  const getSelectButtonText = () => {
    if (file) return 'Change File';
    switch (mediaType) {
      case 'photo':
        return 'Select Photo';
      case 'video':
        return 'Select Video';
      case 'file':
        return 'Select File';
    }
  };

  const getFileExtensionIcon = () => {
    if (!file) return null;
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <Box sx={{ fontSize: 48, color: 'error.main' }}>PDF</Box>;
      case 'doc':
      case 'docx':
        return <Box sx={{ fontSize: 48, color: 'primary.main' }}>DOC</Box>;
      case 'txt':
        return <Box sx={{ fontSize: 48, color: 'text.secondary' }}>TXT</Box>;
      default:
        return <InsertDriveFileIcon sx={{ fontSize: 48 }} />;
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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Add Media
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Upload photos, videos, or files to track your progress
        </Typography>

        <Tabs value={mediaType} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab icon={<PhotoCameraIcon />} label="Photo" value="photo" />
          <Tab icon={<VideocamIcon />} label="Video" value="video" />
          <Tab icon={<InsertDriveFileIcon />} label="File" value="file" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {mediaType === 'file' ? 'File' : 'Media'} uploaded successfully! Redirecting...
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
            startIcon={getSelectButtonIcon()}
            sx={{ mb: 2 }}
            disabled={uploading}
          >
            {getSelectButtonText()}
            <input type="file" hidden accept={getAcceptTypes()} onChange={handleFileChange} />
          </Button>

          {/* Preview for photos and videos */}
          {previewUrl && (mediaType === 'photo' || mediaType === 'video') && (
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

          {/* Preview for image files */}
          {previewUrl && mediaType === 'file' && file?.type.startsWith('image/') && (
            <Card sx={{ mb: 2 }}>
              <CardMedia
                component="img"
                image={previewUrl}
                alt="Preview"
                sx={{ maxHeight: 200, objectFit: 'contain' }}
              />
            </Card>
          )}

          {/* Preview for non-image files */}
          {file && mediaType === 'file' && !file.type.startsWith('image/') && (
            <Card
              sx={{ mb: 2, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {getFileExtensionIcon()}
              <Typography variant="body2" sx={{ mt: 1 }} noWrap>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Card>
          )}

          {/* File-specific fields */}
          {mediaType === 'file' && (
            <>
              <TextField
                fullWidth
                label="Document Name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                margin="normal"
                required
                disabled={uploading}
                inputProps={{ maxLength: 100 }}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  label="Document Type"
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  disabled={uploading}
                >
                  <MenuItem value="training_plan">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FitnessCenterIcon fontSize="small" />
                      Training Plan
                    </Box>
                  </MenuItem>
                  <MenuItem value="diet_plan">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RestaurantIcon fontSize="small" />
                      Diet Plan
                    </Box>
                  </MenuItem>
                  <MenuItem value="custom">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon fontSize="small" />
                      Custom
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={pinToHome}
                    onChange={(e) => setPinToHome(e.target.checked)}
                    disabled={uploading}
                  />
                }
                label="Pin to Home Page"
                sx={{ mt: 1 }}
              />
            </>
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

          {/* Weight field only for photo/video */}
          {(mediaType === 'photo' || mediaType === 'video') && (
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
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            disabled={uploading}
            helperText={
              mediaType === 'file'
                ? 'Add any notes about this document'
                : 'Add any notes about your progress'
            }
            inputProps={{ maxLength: 500 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={uploading || !file || (mediaType === 'file' && !documentName.trim())}
            sx={{ mt: 3, mb: 2 }}
          >
            {uploading ? (
              <CircularProgress size={24} />
            ) : (
              `Upload ${mediaType === 'file' ? 'File' : 'Media'}`
            )}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push('/media')}
            disabled={uploading}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
