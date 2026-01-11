import { BMICategory, WeightComparison, WeightEntry } from '@/types';

/**
 * Calculate BMI from weight and height
 * @param weight Weight in kg
 * @param height Height in cm
 * @returns BMI value
 */
export const calculateBMI = (weight: number, height: number): number => {
  if (weight <= 0 || height <= 0) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / heightInMeters ** 2).toFixed(1));
};

/**
 * Get BMI category from BMI value
 * @param bmi BMI value
 * @returns BMI category
 */
export const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Calculate weight change percentage
 * @param today Today's weight
 * @param yesterday Yesterday's weight
 * @returns Weight comparison object
 */
export const calculateWeightChange = (today: number, yesterday: number): WeightComparison => {
  if (yesterday === 0) {
    return {
      today,
      yesterday,
      percentageChange: 0,
      status: 'Same',
    };
  }

  const percentageChange = parseFloat((((today - yesterday) / yesterday) * 100).toFixed(2));

  let status: 'Gain' | 'Loss' | 'Same' = 'Same';
  if (percentageChange > 0) status = 'Gain';
  else if (percentageChange < 0) status = 'Loss';

  return {
    today,
    yesterday,
    percentageChange: Math.abs(percentageChange),
    status,
  };
};

/**
 * Format date to readable string
 * @param date Date object or timestamp
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format file size to human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file type (image or video)
 * @param file File object
 * @param type Expected type ('photo' or 'video')
 * @returns True if valid
 */
export const validateFileType = (file: File, type: 'photo' | 'video'): boolean => {
  if (type === 'photo') {
    return file.type.startsWith('image/');
  } else {
    return file.type.startsWith('video/');
  }
};

/**
 * Validate file size
 * @param file File object
 * @param maxSizeMB Maximum size in MB
 * @returns True if valid
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Calculate average weight for a given period
 * @param entries Weight entries
 * @param days Number of days to calculate average for (7 for weekly, 30 for monthly)
 * @returns Average weight or null if no entries
 */
export const calculateAverageWeight = (entries: WeightEntry[], days?: number): number | null => {
  if (entries.length === 0) return null;

  let filteredEntries = entries;
  if (days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    filteredEntries = entries.filter((entry) => {
      const entryDate =
        typeof entry.date === 'object' && 'toDate' in entry.date && entry.date.toDate
          ? entry.date.toDate()
          : new Date(entry.date as unknown as Date);
      return entryDate >= cutoffDate;
    });
  }

  if (filteredEntries.length === 0) return null;

  const sum = filteredEntries.reduce((acc, entry) => acc + entry.weight, 0);
  return parseFloat((sum / filteredEntries.length).toFixed(1));
};

/**
 * Calculate weight change rate (kg per week)
 * @param entries Weight entries (should be sorted by date)
 * @returns Weight change rate in kg/week or null
 */
export const calculateWeightChangeRate = (entries: WeightEntry[]): number | null => {
  if (entries.length < 2) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA =
      typeof a.date === 'object' && 'toDate' in a.date && a.date.toDate
        ? a.date.toDate().getTime()
        : new Date(a.date as unknown as Date).getTime();
    const dateB =
      typeof b.date === 'object' && 'toDate' in b.date && b.date.toDate
        ? b.date.toDate().getTime()
        : new Date(b.date as unknown as Date).getTime();
    return dateA - dateB;
  });

  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];

  const firstDate =
    typeof firstEntry.date === 'object' && 'toDate' in firstEntry.date && firstEntry.date.toDate
      ? firstEntry.date.toDate()
      : new Date(firstEntry.date as unknown as Date);

  const lastDate =
    typeof lastEntry.date === 'object' && 'toDate' in lastEntry.date && lastEntry.date.toDate
      ? lastEntry.date.toDate()
      : new Date(lastEntry.date as unknown as Date);

  const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff === 0) return null;

  const weightDiff = lastEntry.weight - firstEntry.weight;
  const weeksDiff = daysDiff / 7;

  return parseFloat((weightDiff / weeksDiff).toFixed(2));
};

/**
 * Get total weight change
 * @param entries Weight entries
 * @returns Total weight change or null
 */
export const getTotalWeightChange = (entries: WeightEntry[]): number | null => {
  if (entries.length < 2) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA =
      typeof a.date === 'object' && 'toDate' in a.date && a.date.toDate
        ? a.date.toDate().getTime()
        : new Date(a.date as unknown as Date).getTime();
    const dateB =
      typeof b.date === 'object' && 'toDate' in b.date && b.date.toDate
        ? b.date.toDate().getTime()
        : new Date(b.date as unknown as Date).getTime();
    return dateA - dateB;
  });

  return parseFloat(
    (sortedEntries[sortedEntries.length - 1].weight - sortedEntries[0].weight).toFixed(1)
  );
};
