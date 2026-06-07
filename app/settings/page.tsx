'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Container,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarSettings, DEFAULT_CALENDAR_SETTINGS } from '@/types';
import { getCalendarSettings, updateCalendarSettings, clearCalendarData } from '@/lib/firestore';
import {
  signInToCalendar,
  signOutFromCalendar,
  isSignedInToCalendar,
  deleteAllCalendarEvents,
  createDailyWeightReminder,
  createMonthlyMeasurementReminder,
  createWeeklyProgressReview,
  deleteCalendarEvent,
} from '@/lib/calendar';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load calendar settings on mount
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login');
      return;
    }

    if (user) {
      loadCalendarSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const loadCalendarSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSettings = await getCalendarSettings(user.uid);
      console.log('Loaded calendar settings:', userSettings);

      if (userSettings) {
        // Ensure all nested objects exist
        const safeSettings = {
          ...DEFAULT_CALENDAR_SETTINGS,
          ...userSettings,
          dailyWeightReminder: {
            ...DEFAULT_CALENDAR_SETTINGS.dailyWeightReminder,
            ...userSettings.dailyWeightReminder,
          },
          monthlyMeasurementReminder: {
            ...DEFAULT_CALENDAR_SETTINGS.monthlyMeasurementReminder,
            ...userSettings.monthlyMeasurementReminder,
          },
          weeklyProgressReview: {
            ...DEFAULT_CALENDAR_SETTINGS.weeklyProgressReview,
            ...userSettings.weeklyProgressReview,
          },
        };
        console.log('Safe settings:', safeSettings);
        setSettings(safeSettings);
      } else {
        // No settings exist, use defaults
        console.log('Using default settings');
        setSettings(DEFAULT_CALENDAR_SETTINGS);
      }

      // Check if connected
      const connected = isSignedInToCalendar();
      setIsConnected(connected);
    } catch (err: unknown) {
      console.error('Error loading calendar settings:', err);
      setError('Failed to load calendar settings');
    } finally {
      setLoading(false);
    }
  };

  const syncSingleReminder = async (
    uid: string,
    reminderType: 'dailyWeightReminder' | 'monthlyMeasurementReminder' | 'weeklyProgressReview',
    reminderSettings:
      | CalendarSettings['dailyWeightReminder']
      | CalendarSettings['monthlyMeasurementReminder']
      | CalendarSettings['weeklyProgressReview']
  ) => {
    try {
      // Delete old event if it exists
      if (reminderSettings.eventId) {
        try {
          await deleteCalendarEvent(reminderSettings.eventId);
        } catch {
          // Event might already be deleted, continue
        }
      }

      // Create new event if enabled
      if (reminderSettings.enabled) {
        let eventId: string;

        if (reminderType === 'dailyWeightReminder') {
          eventId = await createDailyWeightReminder(uid, reminderSettings.time);
        } else if (reminderType === 'monthlyMeasurementReminder') {
          const monthlySettings =
            reminderSettings as CalendarSettings['monthlyMeasurementReminder'];
          eventId = await createMonthlyMeasurementReminder(
            uid,
            monthlySettings.dayOfMonth,
            monthlySettings.time
          );
        } else {
          const weeklySettings = reminderSettings as CalendarSettings['weeklyProgressReview'];
          eventId = await createWeeklyProgressReview(
            uid,
            weeklySettings.dayOfWeek,
            weeklySettings.time
          );
        }

        // Update Firestore with the new event ID
        await updateCalendarSettings(uid, {
          [reminderType]: {
            ...reminderSettings,
            eventId,
          },
        });

        // Update local state with the new event ID
        setSettings((prev) => ({
          ...prev,
          [reminderType]: {
            ...reminderSettings,
            eventId,
          },
        }));
      } else {
        // If disabled, clear the event ID
        await updateCalendarSettings(uid, {
          [reminderType]: {
            ...reminderSettings,
            eventId: null,
          },
        });

        setSettings((prev) => ({
          ...prev,
          [reminderType]: {
            ...reminderSettings,
            eventId: null,
          },
        }));
      }
    } catch (error) {
      console.error('Error syncing single reminder:', error);
      throw error;
    }
  };

  const handleConnectCalendar = async () => {
    try {
      setSaving(true);
      setError(null);

      await signInToCalendar();

      // Update connection status
      setIsConnected(true);

      // Initialize calendar settings with defaults if not exists
      const existingSettings = await getCalendarSettings(user!.uid);
      if (!existingSettings) {
        // First time connecting - initialize with defaults
        await updateCalendarSettings(user!.uid, {
          ...DEFAULT_CALENDAR_SETTINGS,
          enabled: true,
        });
      } else {
        // Just enable the calendar
        await updateCalendarSettings(user!.uid, { enabled: true });
      }

      setSuccess('Successfully connected to Google Calendar!');
      await loadCalendarSettings();
    } catch (err: unknown) {
      console.error('Error connecting calendar:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to connect to Google Calendar';

      // Show helpful message for configuration errors
      if (errorMessage.includes('not configured') || errorMessage.includes('.env.local')) {
        setError(errorMessage + ' See the setup instructions below.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      // Delete all calendar events
      await deleteAllCalendarEvents(settings);

      // Sign out from calendar
      await signOutFromCalendar();

      // Clear calendar data from Firestore
      await clearCalendarData(user.uid);

      setIsConnected(false);
      setSettings(DEFAULT_CALENDAR_SETTINGS);
      setDisconnectDialogOpen(false);
      setSuccess('Calendar disconnected successfully');
    } catch (err: unknown) {
      console.error('Error disconnecting calendar:', err);
      setError('Failed to disconnect calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminder = async (
    reminderType: 'dailyWeightReminder' | 'monthlyMeasurementReminder' | 'weeklyProgressReview',
    enabled: boolean
  ) => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      const updatedSettings = {
        ...settings,
        [reminderType]: {
          ...settings[reminderType],
          enabled,
        },
      };

      setSettings(updatedSettings);

      // Sync only this specific reminder with Google Calendar
      if (isConnected) {
        await syncSingleReminder(user.uid, reminderType, updatedSettings[reminderType]);
      }

      // Save to Firestore
      await updateCalendarSettings(user.uid, { [reminderType]: updatedSettings[reminderType] });

      setSuccess(`${reminderType} ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err: unknown) {
      console.error('Error toggling reminder:', err);
      setError('Failed to update reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (
    reminderType: 'dailyWeightReminder' | 'monthlyMeasurementReminder' | 'weeklyProgressReview',
    time: Dayjs | null
  ) => {
    if (!user || !time) return;

    try {
      const timeString = time.format('HH:mm');
      const updatedSettings = {
        ...settings,
        [reminderType]: {
          ...settings[reminderType],
          time: timeString,
        },
      };

      setSettings(updatedSettings);

      // Sync only this specific reminder with Google Calendar if enabled
      if (updatedSettings[reminderType].enabled && isConnected) {
        await syncSingleReminder(user.uid, reminderType, updatedSettings[reminderType]);
      } else {
        // Just save to Firestore if not enabled
        await updateCalendarSettings(user.uid, { [reminderType]: updatedSettings[reminderType] });
      }

      setSuccess('Time updated successfully');
    } catch (err: unknown) {
      console.error('Error updating time:', err);
      setError('Failed to update time');
    }
  };

  const handleDayOfMonthChange = async (dayOfMonth: number) => {
    if (!user) return;

    try {
      const updatedSettings = {
        ...settings,
        monthlyMeasurementReminder: {
          ...settings.monthlyMeasurementReminder,
          dayOfMonth,
        },
      };

      setSettings(updatedSettings);

      // Sync only this specific reminder with Google Calendar if enabled
      if (updatedSettings.monthlyMeasurementReminder.enabled && isConnected) {
        await syncSingleReminder(
          user.uid,
          'monthlyMeasurementReminder',
          updatedSettings.monthlyMeasurementReminder
        );
      } else {
        // Just save to Firestore if not enabled
        await updateCalendarSettings(user.uid, {
          monthlyMeasurementReminder: updatedSettings.monthlyMeasurementReminder,
        });
      }

      setSuccess('Day of month updated successfully');
    } catch (err: unknown) {
      console.error('Error updating day of month:', err);
      setError('Failed to update day of month');
    }
  };

  const handleDayOfWeekChange = async (dayOfWeek: number) => {
    if (!user) return;

    try {
      const updatedSettings = {
        ...settings,
        weeklyProgressReview: {
          ...settings.weeklyProgressReview,
          dayOfWeek,
        },
      };

      setSettings(updatedSettings);

      // Sync only this specific reminder with Google Calendar if enabled
      if (updatedSettings.weeklyProgressReview.enabled && isConnected) {
        await syncSingleReminder(
          user.uid,
          'weeklyProgressReview',
          updatedSettings.weeklyProgressReview
        );
      } else {
        // Just save to Firestore if not enabled
        await updateCalendarSettings(user.uid, {
          weeklyProgressReview: updatedSettings.weeklyProgressReview,
        });
      }

      setSuccess('Day of week updated successfully');
    } catch (err: unknown) {
      console.error('Error updating day of week:', err);
      setError('Failed to update day of week');
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => console.log('Google Identity Services loaded')}
        onError={() => console.error('Failed to load Google Identity Services')}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={() => router.push('/')} sx={{ mr: 2 }} aria-label="back to home">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Calendar Settings
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" paragraph>
            Connect your Google Calendar to receive automatic reminders for tracking your progress.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Setup Instructions Card - Show if API not configured */}
          {(!process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
            process.env.NEXT_PUBLIC_GOOGLE_API_KEY === 'your_google_api_key_here' ||
            !process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ||
            process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID === 'your_oauth_client_id_here') && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Google Calendar API Not Configured
              </Typography>
              <Typography variant="body2" paragraph>
                To use calendar reminders, you need to set up Google Calendar API credentials:
              </Typography>
              <Typography variant="body2" component="div">
                1. Go to{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                </a>
                <br />
                2. Enable Google Calendar API
                <br />
                3. Create OAuth 2.0 Client ID credentials
                <br />
                4. Create an API Key
                <br />
                5. Add credentials to .env.local file:
                <br />
                <code style={{ display: 'block', marginTop: 8, padding: 8, background: '#f5f5f5' }}>
                  NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
                  <br />
                  NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your_client_id
                </code>
                <br />
                6. Restart the development server
              </Typography>
            </Alert>
          )}

          {/* Connection Status Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="h6">Connection Status</Typography>
                <Chip
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'default'}
                />
              </Box>

              {!isConnected ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Connect your Google Calendar to enable automatic reminders.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConnectCalendar}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Connect Google Calendar'}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Your Google Calendar is connected. You can now enable reminders below.
                  </Typography>
                  {settings?.lastSyncedAt && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Last synced: {settings.lastSyncedAt.toDate().toLocaleString()}
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDisconnectDialogOpen(true)}
                    disabled={saving}
                  >
                    Disconnect Calendar
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Daily Weight Reminder */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="h6" sx={{ flex: '1 1 auto' }}>
                  Daily Weight Log Reminder
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.dailyWeightReminder?.enabled || false}
                      onChange={(e) =>
                        handleToggleReminder('dailyWeightReminder', e.target.checked)
                      }
                      disabled={!isConnected || saving}
                    />
                  }
                  label={settings?.dailyWeightReminder?.enabled ? 'Enabled' : 'Disabled'}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Receive a daily reminder to log your weight at a specific time.
              </Typography>

              <Box
                display="flex"
                alignItems="center"
                gap={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
                sx={{ '& > *': { width: { xs: '100%', sm: 'auto' } } }}
              >
                <TimePicker
                  label="Reminder Time"
                  value={dayjs(`2000-01-01 ${settings?.dailyWeightReminder?.time || '09:00'}`)}
                  onChange={(newValue) => handleTimeChange('dailyWeightReminder', newValue)}
                  disabled={!isConnected || saving}
                  ampm={false}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                />
                {settings?.dailyWeightReminder?.eventId && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Active in Calendar"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Monthly Measurement Reminder */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="h6" sx={{ flex: '1 1 auto' }}>
                  Monthly Measurement Reminder
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.monthlyMeasurementReminder?.enabled}
                      onChange={(e) =>
                        handleToggleReminder('monthlyMeasurementReminder', e.target.checked)
                      }
                      disabled={!isConnected || saving}
                    />
                  }
                  label={settings?.monthlyMeasurementReminder?.enabled ? 'Enabled' : 'Disabled'}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Receive a monthly reminder to take your body measurements.
              </Typography>

              <Box
                display="flex"
                gap={2}
                mb={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
                flexWrap="wrap"
              >
                <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                  <InputLabel>Day of Month</InputLabel>
                  <Select
                    value={settings?.monthlyMeasurementReminder?.dayOfMonth || 1}
                    label="Day of Month"
                    onChange={(e) => handleDayOfMonthChange(Number(e.target.value))}
                    disabled={!isConnected || saving}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TimePicker
                  label="Reminder Time"
                  value={dayjs(
                    `2000-01-01 ${settings?.monthlyMeasurementReminder?.time || '09:00'}`
                  )}
                  onChange={(newValue) => handleTimeChange('monthlyMeasurementReminder', newValue)}
                  disabled={!isConnected || saving}
                  ampm={false}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                />
                {settings?.monthlyMeasurementReminder?.eventId && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Active in Calendar"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: 'center' }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Weekly Progress Review */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <Typography variant="h6" sx={{ flex: '1 1 auto' }}>
                  Weekly Progress Review
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.weeklyProgressReview?.enabled}
                      onChange={(e) =>
                        handleToggleReminder('weeklyProgressReview', e.target.checked)
                      }
                      disabled={!isConnected || saving}
                    />
                  }
                  label={settings?.weeklyProgressReview?.enabled ? 'Enabled' : 'Disabled'}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                Receive a weekly reminder to review your progress and update goals.
              </Typography>

              <Box
                display="flex"
                gap={2}
                mb={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
                flexWrap="wrap"
              >
                <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={settings?.weeklyProgressReview?.dayOfWeek || 0}
                    label="Day of Week"
                    onChange={(e) => handleDayOfWeekChange(Number(e.target.value))}
                    disabled={!isConnected || saving}
                  >
                    <MenuItem value={0}>Sunday</MenuItem>
                    <MenuItem value={1}>Monday</MenuItem>
                    <MenuItem value={2}>Tuesday</MenuItem>
                    <MenuItem value={3}>Wednesday</MenuItem>
                    <MenuItem value={4}>Thursday</MenuItem>
                    <MenuItem value={5}>Friday</MenuItem>
                    <MenuItem value={6}>Saturday</MenuItem>
                  </Select>
                </FormControl>

                <TimePicker
                  label="Reminder Time"
                  value={dayjs(`2000-01-01 ${settings?.weeklyProgressReview?.time || '09:00'}`)}
                  onChange={(newValue) => handleTimeChange('weeklyProgressReview', newValue)}
                  disabled={!isConnected || saving}
                  ampm={false}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                />
                {settings?.weeklyProgressReview?.eventId && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Active in Calendar"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: 'center' }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Disconnect Confirmation Dialog */}
          <Dialog
            open={disconnectDialogOpen}
            onClose={() => setDisconnectDialogOpen(false)}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>Disconnect Google Calendar?</DialogTitle>
            <DialogContent>
              <Typography>
                This will remove all calendar events and disable all reminders. You can reconnect at
                any time.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDisconnectDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleDisconnectCalendar} color="error" disabled={saving}>
                {saving ? <CircularProgress size={20} /> : 'Disconnect'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </LocalizationProvider>
    </>
  );
}
