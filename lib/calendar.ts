/**
 * Google Calendar API Service
 *
 * Core Calendar API integration for creating, updating, and deleting calendar events.
 */

import { CalendarSettings } from '@/types';
import { CalendarError, CalendarErrorType } from './calendar-auth';
import { getCalendarSettings, updateCalendarSettings } from './firestore';

// Google API Configuration
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

const ACCESS_TOKEN_KEY = 'google_calendar_access_token';

// Load access token from localStorage on initialization
let accessToken: string | null = null;
if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Initialize Google Calendar API - now just validates configuration
 */
export async function initializeCalendarAPI(): Promise<void> {
  // Validate credentials are configured
  if (!API_KEY || API_KEY === 'your_google_api_key_here') {
    throw new Error(
      'Google Calendar API Key not configured. Please add NEXT_PUBLIC_GOOGLE_API_KEY to your .env.local file.'
    );
  }

  if (!CLIENT_ID || CLIENT_ID === 'your_oauth_client_id_here') {
    throw new Error(
      'Google OAuth Client ID not configured. Please add NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID to your .env.local file.'
    );
  }

  // No need to initialize gapi anymore - we use Google Identity Services
  return Promise.resolve();
}

/**
 * Wait for Google Identity Services to load
 */
async function waitForGoogleIdentityServices(maxAttempts = 20): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (google && google.accounts && google.accounts.oauth2) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Google Identity Services not loaded. Please refresh the page.');
}

/**
 * Sign in to Google Calendar using Google Identity Services
 */
export async function signInToCalendar(): Promise<void> {
  try {
    await initializeCalendarAPI();

    // Wait for Google Identity Services to load
    await waitForGoogleIdentityServices();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: { access_token?: string; error?: string }) => {
            if (response.error) {
              reject(new Error(`OAuth error: ${response.error}`));
              return;
            }
            if (response.access_token) {
              accessToken = response.access_token;
              // Persist token to localStorage
              localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
              resolve();
            } else {
              reject(new Error('No access token received'));
            }
          },
        });

        // Request access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  } catch (error) {
    console.error('Error signing in to calendar:', error);

    // Better error messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = error as any;
    let errorMessage = 'Failed to sign in to Google Calendar.';

    if (error instanceof Error && error.message.includes('Google Identity Services not loaded')) {
      errorMessage =
        'Google sign-in library not loaded. Please refresh the page and try again. If the issue persists, check your internet connection.';
    } else if (errorObj?.type === 'tokenFailed' && errorObj?.error === 'server_error') {
      errorMessage =
        'Google OAuth server error. This may be due to browser security settings. Please try again, and if the issue persists, try using a different browser or clearing your browser cache.';
    } else if (
      errorObj?.error === 'popup_closed_by_user' ||
      errorObj?.type === 'popup_closed_by_user'
    ) {
      errorMessage =
        'Sign-in cancelled. Please click "Connect" again and complete the authorization.';
    } else if (errorObj?.error === 'access_denied') {
      errorMessage =
        'Calendar access denied. Please grant calendar permissions to use this feature.';
    } else if (errorObj?.error === 'idpiframe_initialization_failed') {
      errorMessage =
        'OAuth initialization failed. Please check your OAuth Client ID configuration.';
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Sign out from Google Calendar
 */
export async function signOutFromCalendar(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (google && google.accounts && google.accounts.oauth2) {
      // Revoke the token
      if (accessToken) {
        google.accounts.oauth2.revoke(accessToken);
      }
    }
    accessToken = null;
    // Clear token from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error signing out from calendar:', error);
    accessToken = null; // Clear token anyway
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Get current access token from localStorage or memory
 */
function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && !accessToken) {
      // Sync memory with localStorage
      accessToken = token;
    }
    return token;
  }
  return accessToken;
}

/**
 * Check if user is signed in to Google Calendar
 */
export function isSignedInToCalendar(): boolean {
  return getAccessToken() !== null;
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Format time string to ISO datetime for today
 */
function formatTimeToDateTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const now = new Date();
  now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return now.toISOString();
}

/**
 * Create daily weight reminder event
 */
export async function createDailyWeightReminder(uid: string, time: string): Promise<string> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not signed in to Google Calendar');
    }

    const timezone = getUserTimezone();
    const startDateTime = formatTimeToDateTime(time);
    const endDate = new Date(startDateTime);
    endDate.setMinutes(endDate.getMinutes() + 15);

    const event = {
      summary: 'Log Daily Weight - Weight Tracker',
      description: 'Time to log your daily weight in the Weight Tracker app!',
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone,
      },
      recurrence: ['RRULE:FREQ=DAILY'],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 0 }],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id || '';
  } catch (error) {
    console.error('Error creating daily weight reminder:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Create monthly measurement reminder event
 */
export async function createMonthlyMeasurementReminder(
  uid: string,
  dayOfMonth: number,
  time: string
): Promise<string> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not signed in to Google Calendar');
    }

    const timezone = getUserTimezone();
    const startDateTime = formatTimeToDateTime(time);
    const endDate = new Date(startDateTime);
    endDate.setMinutes(endDate.getMinutes() + 15);

    const event = {
      summary: 'Take Monthly Measurements - Weight Tracker',
      description: 'Record your waist, bicep, and thigh measurements today!',
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone,
      },
      recurrence: [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 0 }],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id || '';
  } catch (error) {
    console.error('Error creating monthly measurement reminder:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Create weekly progress review event
 */
export async function createWeeklyProgressReview(
  uid: string,
  dayOfWeek: number,
  time: string
): Promise<string> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not signed in to Google Calendar');
    }

    const timezone = getUserTimezone();
    const startDateTime = formatTimeToDateTime(time);
    const endDate = new Date(startDateTime);
    endDate.setMinutes(endDate.getMinutes() + 15);

    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const dayAbbr = dayNames[dayOfWeek];

    const event = {
      summary: 'Weekly Progress Review - Weight Tracker',
      description: 'Review your weekly progress and update your goals!',
      start: {
        dateTime: startDateTime,
        timeZone: timezone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: timezone,
      },
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${dayAbbr}`],
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 0 }],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id || '';
  } catch (error) {
    console.error('Error creating weekly progress review:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Update calendar event
 */
export async function updateCalendarEvent(eventId: string): Promise<void> {
  try {
    // For simplicity, we delete and recreate events when updating
    // This is because updating recurrence rules can be complex
    await deleteCalendarEvent(eventId);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Delete calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not signed in to Google Calendar');
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 404 (Not Found) and 410 (Gone) are ok - event doesn't exist or was already deleted
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      throw new Error(`Calendar API error: ${response.statusText}`);
    }
    // Silently succeed if event was already deleted (404 or 410)
  } catch (error: unknown) {
    // If it's just a missing event, don't throw an error
    if (error instanceof Error && error.message.includes('Calendar API error')) {
      console.error('Error deleting calendar event:', error);
      throw new CalendarError(CalendarErrorType.EVENT_NOT_FOUND, error);
    }
    // For "not signed in" or other errors, rethrow
    throw error;
  }
}

/**
 * Get calendar connection status
 */
export async function getCalendarConnectionStatus(uid: string): Promise<boolean> {
  try {
    const settings = await getCalendarSettings(uid);
    if (!settings || !settings.enabled) {
      return false;
    }

    // Check if signed in with gapi
    return isSignedInToCalendar();
  } catch (error) {
    console.error('Error getting calendar connection status:', error);
    return false;
  }
}

/**
 * Sync calendar settings - create/update/delete events based on settings
 */
export async function syncCalendarSettings(uid: string, settings: CalendarSettings): Promise<void> {
  try {
    // Daily weight reminder
    if (settings.dailyWeightReminder.enabled) {
      if (settings.dailyWeightReminder.eventId) {
        // Update existing event (delete and recreate)
        try {
          await deleteCalendarEvent(settings.dailyWeightReminder.eventId);
        } catch {
          // Silently ignore - event was already deleted, we'll create a new one
        }
      }
      const eventId = await createDailyWeightReminder(uid, settings.dailyWeightReminder.time);
      await updateCalendarSettings(uid, {
        dailyWeightReminder: {
          ...settings.dailyWeightReminder,
          eventId,
        },
      });
    } else if (settings.dailyWeightReminder.eventId) {
      // Delete event if disabled
      try {
        await deleteCalendarEvent(settings.dailyWeightReminder.eventId);
      } catch {
        // Event might already be deleted, that's fine
      }
      await updateCalendarSettings(uid, {
        dailyWeightReminder: {
          ...settings.dailyWeightReminder,
          eventId: null,
        },
      });
    }

    // Monthly measurement reminder
    if (settings.monthlyMeasurementReminder.enabled) {
      if (settings.monthlyMeasurementReminder.eventId) {
        try {
          await deleteCalendarEvent(settings.monthlyMeasurementReminder.eventId);
        } catch {
          // Event might already be deleted, that's fine
        }
      }
      const eventId = await createMonthlyMeasurementReminder(
        uid,
        settings.monthlyMeasurementReminder.dayOfMonth,
        settings.monthlyMeasurementReminder.time
      );
      await updateCalendarSettings(uid, {
        monthlyMeasurementReminder: {
          ...settings.monthlyMeasurementReminder,
          eventId,
        },
      });
    } else if (settings.monthlyMeasurementReminder.eventId) {
      try {
        await deleteCalendarEvent(settings.monthlyMeasurementReminder.eventId);
      } catch {
        // Event might already be deleted, that's fine
      }
      await updateCalendarSettings(uid, {
        monthlyMeasurementReminder: {
          ...settings.monthlyMeasurementReminder,
          eventId: null,
        },
      });
    }

    // Weekly progress review
    if (settings.weeklyProgressReview.enabled) {
      if (settings.weeklyProgressReview.eventId) {
        try {
          await deleteCalendarEvent(settings.weeklyProgressReview.eventId);
        } catch {
          // Event might already be deleted, that's fine
        }
      }
      const eventId = await createWeeklyProgressReview(
        uid,
        settings.weeklyProgressReview.dayOfWeek,
        settings.weeklyProgressReview.time
      );
      await updateCalendarSettings(uid, {
        weeklyProgressReview: {
          ...settings.weeklyProgressReview,
          eventId,
        },
      });
    } else if (settings.weeklyProgressReview.eventId) {
      try {
        await deleteCalendarEvent(settings.weeklyProgressReview.eventId);
      } catch {
        // Event might already be deleted, that's fine
      }
      await updateCalendarSettings(uid, {
        weeklyProgressReview: {
          ...settings.weeklyProgressReview,
          eventId: null,
        },
      });
    }
  } catch (error) {
    console.error('Error syncing calendar settings:', error);
    throw error;
  }
}

/**
 * Delete all calendar events for user
 */
export async function deleteAllCalendarEvents(settings: CalendarSettings): Promise<void> {
  try {
    const eventIds = [
      settings.dailyWeightReminder.eventId,
      settings.monthlyMeasurementReminder.eventId,
      settings.weeklyProgressReview.eventId,
    ].filter((id): id is string => id !== null);

    // Delete each event, ignoring errors if they don't exist
    await Promise.allSettled(
      eventIds.map(async (id) => {
        try {
          await deleteCalendarEvent(id);
        } catch (error) {
          console.warn(`Could not delete calendar event ${id}:`, error);
        }
      })
    );
  } catch (error) {
    console.error('Error deleting all calendar events:', error);
    // Don't throw - we want to continue with disconnect even if some events couldn't be deleted
  }
}
