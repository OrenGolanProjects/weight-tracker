'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AppBar,
  Toolbar,
  Badge,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import VideocamIcon from '@mui/icons-material/Videocam';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '@/contexts/AuthContext';
import {
  getProgressMedia,
  deleteProgressMedia,
  getDocuments,
  deleteDocument,
  toggleDocumentPin,
} from '@/lib/firestore';
import { deletePhoto, deleteMedia, deleteDocumentFile } from '@/lib/storage';
import type { ProgressMedia, Document } from '@/types';

type MediaFilter = 'all' | 'photo' | 'video' | 'file';

interface MediaByMonth {
  key: string;
  label: string;
  media: ProgressMedia[];
  photoCount: number;
  videoCount: number;
}

interface DocumentsByMonth {
  key: string;
  label: string;
  documents: Document[];
}

const getDocumentIcon = (mimeType: string, docType: string) => {
  if (mimeType === 'application/pdf') {
    return <PictureAsPdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
  }
  if (docType === 'training_plan') {
    return <FitnessCenterIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
  }
  if (docType === 'diet_plan') {
    return <RestaurantIcon sx={{ fontSize: 48, color: 'success.main' }} />;
  }
  return <DescriptionIcon sx={{ fontSize: 48, color: 'grey.500' }} />;
};

const getDocumentTypeLabel = (type: string) => {
  switch (type) {
    case 'training_plan':
      return 'Training Plan';
    case 'diet_plan':
      return 'Diet Plan';
    default:
      return 'Custom';
  }
};

const getDocumentTypeColor = (type: string): 'primary' | 'success' | 'default' => {
  switch (type) {
    case 'training_plan':
      return 'primary';
    case 'diet_plan':
      return 'success';
    default:
      return 'default';
  }
};

export default function MediaGalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [allMedia, setAllMedia] = useState<ProgressMedia[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [viewDialog, setViewDialog] = useState<{ open: boolean; media: ProgressMedia | null }>({
    open: false,
    media: null,
  });
  const [viewDocDialog, setViewDocDialog] = useState<{ open: boolean; doc: Document | null }>({
    open: false,
    doc: null,
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
  const [deleteDocDialog, setDeleteDocDialog] = useState<{
    open: boolean;
    docId: string | null;
    doc: Document | null;
  }>({
    open: false,
    docId: null,
    doc: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [pinningDocId, setPinningDocId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Group media by month
  const mediaByMonth = useMemo(() => {
    const filtered =
      mediaFilter === 'all' || mediaFilter === 'file'
        ? allMedia
        : allMedia.filter((m) => m.type === mediaFilter);

    if (mediaFilter === 'file') return [];

    const grouped: Record<string, MediaByMonth> = {};

    filtered.forEach((media) => {
      const date =
        media.date && 'toDate' in media.date
          ? media.date.toDate()
          : new Date(media.date as unknown as Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          key: monthKey,
          label: monthLabel,
          media: [],
          photoCount: 0,
          videoCount: 0,
        };
      }

      grouped[monthKey].media.push(media);
      if (media.type === 'photo') {
        grouped[monthKey].photoCount++;
      } else {
        grouped[monthKey].videoCount++;
      }
    });

    return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key));
  }, [allMedia, mediaFilter]);

  // Group documents by month
  const documentsByMonth = useMemo(() => {
    if (mediaFilter !== 'all' && mediaFilter !== 'file') return [];

    const grouped: Record<string, DocumentsByMonth> = {};

    allDocuments.forEach((doc) => {
      const date =
        doc.date && 'toDate' in doc.date
          ? doc.date.toDate()
          : new Date(doc.date as unknown as Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          key: monthKey,
          label: monthLabel,
          documents: [],
        };
      }

      grouped[monthKey].documents.push(doc);
    });

    return Object.values(grouped).sort((a, b) => b.key.localeCompare(a.key));
  }, [allDocuments, mediaFilter]);

  // Auto-expand all months on initial load only
  useEffect(() => {
    const allKeys = [...mediaByMonth.map((m) => m.key), ...documentsByMonth.map((d) => d.key)];
    if (allKeys.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setExpandedMonths(new Set(allKeys));
    }
  }, [mediaByMonth, documentsByMonth]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [mediaData, docsData] = await Promise.all([
        getProgressMedia(user.uid),
        getDocuments(user.uid),
      ]);
      setAllMedia(mediaData);
      setAllDocuments(docsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load media and documents');
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

  const handleViewDocClick = (doc: Document) => {
    setViewDocDialog({ open: true, doc });
  };

  const handleViewDocClose = () => {
    setViewDocDialog({ open: false, doc: null });
  };

  const handleDeleteClick = (mediaId: string, media: ProgressMedia) => {
    setDeleteDialog({ open: true, mediaId, media });
  };

  const handleDeleteDocClick = (docId: string, doc: Document) => {
    setDeleteDocDialog({ open: true, docId, doc });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteDialog.mediaId || !deleteDialog.media) return;

    try {
      setDeleting(true);

      if (deleteDialog.media.type === 'photo' && deleteDialog.media.thumbnailPath) {
        await deletePhoto(deleteDialog.media.storagePath, deleteDialog.media.thumbnailPath);
      } else {
        await deleteMedia(deleteDialog.media.storagePath);
      }

      await deleteProgressMedia(user.uid, deleteDialog.mediaId);
      setAllMedia((prev) => prev.filter((m) => m.id !== deleteDialog.mediaId));
      setDeleteDialog({ open: false, mediaId: null, media: null });
    } catch (err) {
      console.error('Error deleting media:', err);
      setError('Failed to delete media. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteDocConfirm = async () => {
    if (!user || !deleteDocDialog.docId || !deleteDocDialog.doc) return;

    try {
      setDeleting(true);

      await deleteDocumentFile(deleteDocDialog.doc.storagePath);
      await deleteDocument(user.uid, deleteDocDialog.docId);
      setAllDocuments((prev) => prev.filter((d) => d.id !== deleteDocDialog.docId));
      setDeleteDocDialog({ open: false, docId: null, doc: null });
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, mediaId: null, media: null });
  };

  const handleDeleteDocCancel = () => {
    setDeleteDocDialog({ open: false, docId: null, doc: null });
  };

  const handleTogglePin = async (doc: Document) => {
    if (!user || pinningDocId) return;

    try {
      setPinningDocId(doc.id);
      await toggleDocumentPin(user.uid, doc.id, !doc.pinToHome);
      setAllDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, pinToHome: !d.pinToHome } : d))
      );
    } catch (err) {
      console.error('Error toggling pin:', err);
      setError('Failed to update pin status.');
    } finally {
      setPinningDocId(null);
    }
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

  const expandAll = () => {
    const allKeys = [...mediaByMonth.map((m) => m.key), ...documentsByMonth.map((d) => d.key)];
    setExpandedMonths(new Set(allKeys));
  };

  const collapseAll = () => {
    setExpandedMonths(new Set());
  };

  const photoCount = allMedia.filter((m) => m.type === 'photo').length;
  const videoCount = allMedia.filter((m) => m.type === 'video').length;
  const fileCount = allDocuments.length;

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

  const showMedia = mediaFilter === 'all' || mediaFilter === 'photo' || mediaFilter === 'video';
  const showFiles = mediaFilter === 'all' || mediaFilter === 'file';

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <PhotoLibraryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Media & Files
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              color="inherit"
              startIcon={<CompareArrowsIcon />}
              onClick={() => router.push('/media/compare')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Compare
            </Button>
            <IconButton
              color="inherit"
              onClick={() => router.push('/media/compare')}
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              <CompareArrowsIcon />
            </IconButton>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => router.push('/media/add')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              Add
            </Button>
            <IconButton
              color="inherit"
              onClick={() => router.push('/media/add')}
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              <AddIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Filter Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={mediaFilter}
            onChange={(_, newValue) => setMediaFilter(newValue)}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab
              icon={
                <Badge badgeContent={allMedia.length + fileCount} color="primary">
                  <FolderIcon />
                </Badge>
              }
              label="All"
              value="all"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={photoCount} color="secondary">
                  <PhotoLibraryIcon />
                </Badge>
              }
              label="Photos"
              value="photo"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={videoCount} color="error">
                  <VideocamIcon />
                </Badge>
              }
              label="Videos"
              value="video"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={fileCount} color="info">
                  <InsertDriveFileIcon />
                </Badge>
              }
              label="Files"
              value="file"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {mediaByMonth.length === 0 && documentsByMonth.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <PhotoLibraryIcon sx={{ fontSize: 80, color: 'grey.300', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No{' '}
              {mediaFilter === 'file'
                ? 'files'
                : mediaFilter !== 'all'
                  ? mediaFilter + 's'
                  : 'content'}{' '}
              yet
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
            >
              Start documenting your fitness journey by uploading photos, videos, and files
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => router.push('/media/add')}
            >
              Add Your First{' '}
              {mediaFilter === 'file' ? 'File' : mediaFilter !== 'all' ? mediaFilter : 'Media'}
            </Button>
          </Paper>
        ) : (
          <>
            {/* Expand/Collapse Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
              <Button size="small" onClick={expandAll}>
                Expand All
              </Button>
              <Button size="small" onClick={collapseAll}>
                Collapse All
              </Button>
            </Box>

            {/* Media Month Folders */}
            {showMedia &&
              mediaByMonth.map((monthData) => (
                <Accordion
                  key={`media-${monthData.key}`}
                  expanded={expandedMonths.has(monthData.key)}
                  onChange={(_, isExpanded) => {
                    setExpandedMonths((prev) => {
                      const newSet = new Set(prev);
                      if (isExpanded) {
                        newSet.add(monthData.key);
                      } else {
                        newSet.delete(monthData.key);
                      }
                      return newSet;
                    });
                  }}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiAccordionSummary-expandIconWrapper': { color: 'white' },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ width: '100%', pointerEvents: 'none' }}
                    >
                      <FolderIcon />
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {monthData.label}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {monthData.photoCount > 0 && (
                          <Chip
                            icon={<PhotoLibraryIcon sx={{ color: 'white !important' }} />}
                            label={monthData.photoCount}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                        )}
                        {monthData.videoCount > 0 && (
                          <Chip
                            icon={<VideocamIcon sx={{ color: 'white !important' }} />}
                            label={monthData.videoCount}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: 'grey.50', p: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(1, 1fr)',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(3, 1fr)',
                          lg: 'repeat(4, 1fr)',
                        },
                        gap: 2,
                      }}
                    >
                      {monthData.media.map((media) => (
                        <Card
                          key={media.id}
                          sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => handleViewClick(media)}
                        >
                          <Box
                            sx={{ position: 'relative', paddingTop: '100%', bgcolor: 'grey.800' }}
                          >
                            {media.type === 'photo' ? (
                              <CardMedia
                                component="img"
                                image={media.thumbnailUrl}
                                alt={formatDate(media.date)}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'grey.800',
                                }}
                              >
                                <video
                                  src={media.mediaUrl}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              </Box>
                            )}
                            {media.type === 'video' && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                                  borderRadius: '50%',
                                  width: 56,
                                  height: 56,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <PlayArrowIcon sx={{ color: 'white', fontSize: 36 }} />
                              </Box>
                            )}
                            <Chip
                              label={media.type === 'photo' ? 'Photo' : 'Video'}
                              size="small"
                              color={media.type === 'photo' ? 'primary' : 'error'}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                              }}
                            />
                          </Box>
                          <CardContent sx={{ pb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {formatDate(media.date)}
                            </Typography>
                            {media.weight && (
                              <Typography variant="body2" color="text.secondary">
                                {media.weight} kg
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled">
                              {formatFileSize(media.fileSize)}
                            </Typography>
                          </CardContent>
                          <CardActions sx={{ pt: 0 }}>
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClick(media);
                              }}
                            >
                              View
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(media.id, media);
                              }}
                              sx={{ ml: 'auto' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </CardActions>
                        </Card>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}

            {/* Documents Month Folders */}
            {showFiles &&
              documentsByMonth.map((monthData) => (
                <Accordion
                  key={`docs-${monthData.key}`}
                  expanded={expandedMonths.has(monthData.key)}
                  onChange={(_, isExpanded) => {
                    setExpandedMonths((prev) => {
                      const newSet = new Set(prev);
                      if (isExpanded) {
                        newSet.add(monthData.key);
                      } else {
                        newSet.delete(monthData.key);
                      }
                      return newSet;
                    });
                  }}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      bgcolor: 'info.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'info.dark' },
                      '& .MuiAccordionSummary-expandIconWrapper': { color: 'white' },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ width: '100%', pointerEvents: 'none' }}
                    >
                      <InsertDriveFileIcon />
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {monthData.label} - Files
                      </Typography>
                      <Chip
                        icon={<InsertDriveFileIcon sx={{ color: 'white !important' }} />}
                        label={monthData.documents.length}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: 'grey.50', p: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(1, 1fr)',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(3, 1fr)',
                          lg: 'repeat(4, 1fr)',
                        },
                        gap: 2,
                      }}
                    >
                      {monthData.documents.map((doc) => (
                        <Card
                          key={doc.id}
                          sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          }}
                          onClick={() => handleViewDocClick(doc)}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              paddingTop: '100%',
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              {getDocumentIcon(doc.mimeType, doc.type)}
                            </Box>
                            <Chip
                              label={getDocumentTypeLabel(doc.type)}
                              size="small"
                              color={getDocumentTypeColor(doc.type)}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                              }}
                            />
                            {doc.pinToHome && (
                              <PushPinIcon
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  color: 'warning.main',
                                }}
                              />
                            )}
                          </Box>
                          <CardContent sx={{ pb: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              noWrap
                              title={doc.name}
                            >
                              {doc.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(doc.date)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatFileSize(doc.fileSize)}
                            </Typography>
                          </CardContent>
                          <CardActions sx={{ pt: 0 }}>
                            <Tooltip title={doc.pinToHome ? 'Unpin from Home' : 'Pin to Home'}>
                              <IconButton
                                size="small"
                                color={doc.pinToHome ? 'warning' : 'default'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePin(doc);
                                }}
                                disabled={pinningDocId === doc.id}
                              >
                                {pinningDocId === doc.id ? (
                                  <CircularProgress size={18} />
                                ) : doc.pinToHome ? (
                                  <PushPinIcon fontSize="small" />
                                ) : (
                                  <PushPinOutlinedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(doc.fileUrl, '_blank');
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocClick(doc.id, doc);
                              }}
                              sx={{ ml: 'auto' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </CardActions>
                        </Card>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
          </>
        )}
      </Container>

      {/* View Media Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={handleViewClose}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { bgcolor: 'grey.900' } } }}
      >
        {viewDialog.media && (
          <>
            <DialogTitle sx={{ bgcolor: 'grey.900', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {viewDialog.media.type === 'photo' ? <PhotoLibraryIcon /> : <VideocamIcon />}
                  <Typography variant="h6">{formatDate(viewDialog.media.date)}</Typography>
                </Stack>
                <IconButton onClick={handleViewClose} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ bgcolor: 'grey.900', p: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'black' }}>
                {viewDialog.media.type === 'photo' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewDialog.media.mediaUrl}
                    alt={formatDate(viewDialog.media.date)}
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                  />
                ) : (
                  <video
                    src={viewDialog.media.mediaUrl}
                    controls
                    autoPlay
                    style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  />
                )}
              </Box>
              <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                  {viewDialog.media.weight && (
                    <Chip
                      label={`Weight: ${viewDialog.media.weight} kg`}
                      color="primary"
                      size="small"
                    />
                  )}
                  <Chip
                    label={formatFileSize(viewDialog.media.fileSize)}
                    variant="outlined"
                    size="small"
                    sx={{ color: 'grey.400', borderColor: 'grey.600' }}
                  />
                  {viewDialog.media.duration && (
                    <Chip
                      label={`${viewDialog.media.duration}s`}
                      variant="outlined"
                      size="small"
                      sx={{ color: 'grey.400', borderColor: 'grey.600' }}
                    />
                  )}
                </Stack>
                {viewDialog.media.notes && (
                  <Typography variant="body2" sx={{ color: 'grey.300', mt: 1 }}>
                    {viewDialog.media.notes}
                  </Typography>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={viewDocDialog.open} onClose={handleViewDocClose} maxWidth="sm" fullWidth>
        {viewDocDialog.doc && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <InsertDriveFileIcon />
                  <Typography variant="h6" noWrap sx={{ maxWidth: 300 }}>
                    {viewDocDialog.doc.name}
                  </Typography>
                </Stack>
                <IconButton onClick={handleViewDocClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                {getDocumentIcon(viewDocDialog.doc.mimeType, viewDocDialog.doc.type)}
              </Box>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography>{getDocumentTypeLabel(viewDocDialog.doc.type)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography>{formatDate(viewDocDialog.doc.date)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Size
                  </Typography>
                  <Typography>{formatFileSize(viewDocDialog.doc.fileSize)}</Typography>
                </Box>
                {viewDocDialog.doc.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography>{viewDocDialog.doc.notes}</Typography>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={
                  pinningDocId === viewDocDialog.doc.id ? (
                    <CircularProgress size={18} />
                  ) : viewDocDialog.doc.pinToHome ? (
                    <PushPinIcon />
                  ) : (
                    <PushPinOutlinedIcon />
                  )
                }
                onClick={() => {
                  handleTogglePin(viewDocDialog.doc!);
                }}
                color={viewDocDialog.doc.pinToHome ? 'warning' : 'inherit'}
                disabled={pinningDocId === viewDocDialog.doc.id}
              >
                {viewDocDialog.doc.pinToHome ? 'Unpin' : 'Pin to Home'}
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => window.open(viewDocDialog.doc!.fileUrl, '_blank')}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Media Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete {deleteDialog.media?.type}?</DialogTitle>
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
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <Dialog open={deleteDocDialog.open} onClose={handleDeleteDocCancel}>
        <DialogTitle>Delete file?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteDocDialog.doc?.name}&quot;? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDocCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteDocConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
