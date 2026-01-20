/**
 * Google Calendar OAuth Authentication Module
 *
 * Handles OAuth2 flow for Google Calendar API access, token management, and refresh logic.
 */

import { Timestamp } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

// OAuth Configuration
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || '';

// Get redirect URI dynamically (only in browser)
const getRedirectURI = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/settings`;
  }
  return '';
};

/**
 * Error types for calendar authentication
 */
export enum CalendarErrorType {
  AUTH_FAILED = 'Authentication failed',
  TOKEN_EXPIRED = 'Access token expired',
  QUOTA_EXCEEDED = 'API quota exceeded',
  NETWORK_ERROR = 'Network connection error',
  PERMISSION_DENIED = 'Calendar permission denied',
  EVENT_NOT_FOUND = 'Calendar event not found',
  INVALID_TIME = 'Invalid time format',
}

export class CalendarError extends Error {
  constructor(
    public type: CalendarErrorType,
    public originalError?: unknown
  ) {
    super(type);
    this.name = 'CalendarError';
  }
}

/**
 * User-facing error messages
 */
export const CALENDAR_ERROR_MESSAGES: Record<CalendarErrorType, string> = {
  [CalendarErrorType.AUTH_FAILED]: 'Failed to connect to Google Calendar. Please try again.',
  [CalendarErrorType.TOKEN_EXPIRED]:
    'Your calendar access has expired. Please reconnect your calendar.',
  [CalendarErrorType.QUOTA_EXCEEDED]: 'Too many requests. Please try again in a few minutes.',
  [CalendarErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [CalendarErrorType.PERMISSION_DENIED]:
    'Calendar access was denied. Please grant permission to use this feature.',
  [CalendarErrorType.EVENT_NOT_FOUND]: 'Calendar event not found. It may have been deleted.',
  [CalendarErrorType.INVALID_TIME]: 'Invalid time format. Please select a valid time.',
};

/**
 * Encrypt token using user's encryption key
 */
export function encryptToken(token: string, encryptionKey: string): string {
  try {
    return CryptoJS.AES.encrypt(token, encryptionKey).toString();
  } catch (error) {
    console.error('Error encrypting token:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Decrypt token using user's encryption key
 */
export function decryptToken(encryptedToken: string, encryptionKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    return decrypted;
  } catch (error) {
    console.error('Error decrypting token:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Initiate Google Calendar OAuth flow
 * Opens OAuth consent screen in a popup window
 */
export async function initiateCalendarOAuth(): Promise<void> {
  try {
    if (!OAUTH_CLIENT_ID) {
      throw new Error('OAuth Client ID not configured');
    }

    const redirectUri = getRedirectURI();
    if (!redirectUri) {
      throw new Error('Cannot initiate OAuth in server environment');
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', OAUTH_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', CALENDAR_SCOPES.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    // Open OAuth consent screen in current window (redirect-based flow)
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Handle OAuth callback and exchange code for tokens
 * Note: This requires a backend endpoint to exchange the code for tokens securely.
 * For client-side only implementation, we'll use the Google OAuth library.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handleOAuthCallback(_code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  try {
    // In a production app, this should call a backend endpoint
    // For now, this is a placeholder that would need to be implemented
    // with a Cloud Function or similar backend service
    throw new Error('OAuth callback handler not implemented - requires backend endpoint');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  try {
    // This would typically call a backend endpoint to refresh the token
    // For client-side implementation, we'll use gapi.client's built-in refresh
    throw new Error('Token refresh not implemented - requires backend endpoint');
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new CalendarError(CalendarErrorType.TOKEN_EXPIRED, error);
  }
}

/**
 * Validate access token
 */
export async function validateAccessToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Check if token has calendar scope
    const scopes = data.scope ? data.scope.split(' ') : [];
    return scopes.some((scope: string) =>
      CALENDAR_SCOPES.some((required) => scope.includes(required))
    );
  } catch (error) {
    console.error('Error validating access token:', error);
    return false;
  }
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(tokenExpiry: Timestamp | null): boolean {
  if (!tokenExpiry) return true;

  const expiryDate = tokenExpiry.toDate();
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  return expiryDate <= fiveMinutesFromNow;
}

/**
 * Revoke calendar access
 */
export async function revokeCalendarAccess(accessToken: string): Promise<void> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to revoke access');
    }
  } catch (error) {
    console.error('Error revoking calendar access:', error);
    throw new CalendarError(CalendarErrorType.AUTH_FAILED, error);
  }
}

/**
 * Get user's encryption key (derived from Firebase Auth UID)
 * In production, consider using a more secure method
 */
export function getUserEncryptionKey(uid: string): string {
  // Simple derivation - in production, use a more secure method
  return CryptoJS.SHA256(uid + 'calendar-secret').toString();
}
