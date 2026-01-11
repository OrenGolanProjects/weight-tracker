import { BMICategory, WeightComparison } from '@/types';

/**
 * Calculate BMI from weight and height
 * @param weight Weight in kg
 * @param height Height in cm
 * @returns BMI value
 */
export const calculateBMI = (weight: number, height: number): number => {
  if (weight <= 0 || height <= 0) return 0;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters ** 2)).toFixed(1));
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
export const calculateWeightChange = (
  today: number,
  yesterday: number
): WeightComparison => {
  if (yesterday === 0) {
    return {
      today,
      yesterday,
      percentageChange: 0,
      status: 'Same',
    };
  }

  const percentageChange = parseFloat(
    (((today - yesterday) / yesterday) * 100).toFixed(2)
  );

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
export const validateFileType = (
  file: File,
  type: 'photo' | 'video'
): boolean => {
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
