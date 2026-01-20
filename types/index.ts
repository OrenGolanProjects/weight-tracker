import { Timestamp } from 'firebase/firestore';

// Calendar Settings
export interface CalendarSettings {
  enabled: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Timestamp | null;

  dailyWeightReminder: {
    enabled: boolean;
    time: string; // Format: "HH:mm" (e.g., "09:00")
    eventId: string | null;
  };

  monthlyMeasurementReminder: {
    enabled: boolean;
    dayOfMonth: number; // 1-31
    time: string; // Format: "HH:mm"
    eventId: string | null;
  };

  weeklyProgressReview: {
    enabled: boolean;
    dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
    time: string; // Format: "HH:mm"
    eventId: string | null;
  };

  calendarId: string; // Usually "primary"
  lastSyncedAt: Timestamp | null;
}

// Default Calendar Settings
export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  enabled: false,
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  dailyWeightReminder: {
    enabled: false,
    time: '09:00',
    eventId: null,
  },
  monthlyMeasurementReminder: {
    enabled: false,
    dayOfMonth: 1,
    time: '10:00',
    eventId: null,
  },
  weeklyProgressReview: {
    enabled: false,
    dayOfWeek: 0, // Sunday
    time: '18:00',
    eventId: null,
  },
  calendarId: 'primary',
  lastSyncedAt: null,
};

// User Profile
export interface User {
  uid: string;
  email: string;
  name: string | null;
  age: number | null;
  height: number | null; // in cm
  goalWeight: number | null; // in kg
  photoURL: string | null;
  calendarSettings?: CalendarSettings; // Optional calendar integration
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Weight Entry
export interface WeightEntry {
  id: string;
  date: Timestamp;
  weight: number; // in kg
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Body Measurement
export interface BodyMeasurement {
  id: string;
  date: Timestamp;
  waist: number | null; // in cm
  bicep: number | null; // in cm
  thigh: number | null; // in cm
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Progress Media (Photos & Videos)
export interface ProgressMedia {
  id: string;
  date: Timestamp;
  type: 'photo' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  thumbnailPath: string | null; // for photos, null for videos
  duration: number | null; // in seconds, null for photos
  fileSize: number; // in bytes
  weight: number | null; // optional: weight at time of capture
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form Data Types (for creating/updating)
export interface WeightEntryForm {
  date: Date;
  weight: number;
}

export interface BodyMeasurementForm {
  date: Date;
  waist: number;
  bicep: number;
  thigh: number;
}

export interface UserProfileForm {
  name: string;
  age: number;
  height: number;
}

export interface ProgressMediaForm {
  date: Date;
  type: 'photo' | 'video';
  file: File;
  weight?: number;
  notes?: string;
}

// BMI Categories
export type BMICategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

// Weight Comparison
export interface WeightComparison {
  today: number;
  yesterday: number;
  percentageChange: number;
  status: 'Gain' | 'Loss' | 'Same';
}
