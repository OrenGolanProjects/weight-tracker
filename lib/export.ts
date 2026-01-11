import type { WeightEntry, BodyMeasurement, User } from '@/types';
import type { Timestamp } from 'firebase/firestore';

/**
 * Convert data to CSV format
 */
const convertToCSV = (headers: string[], rows: (string | number)[][]): string => {
  const csvRows = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ];
  return csvRows.join('\n');
};

/**
 * Trigger file download in browser
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Format date for CSV export
 */
const formatDateForExport = (date: Timestamp | Date): string => {
  const dateObj =
    typeof date === 'object' && date !== null && 'toDate' in date
      ? (date as Timestamp).toDate()
      : new Date(date as Date);
  return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
};

/**
 * Export weight entries to CSV
 */
export const exportWeightEntriesToCSV = (entries: WeightEntry[]) => {
  if (entries.length === 0) {
    alert('No weight entries to export');
    return;
  }

  // Sort entries by date ascending
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

  const headers = ['Date', 'Weight (kg)'];
  const rows = sortedEntries.map((entry) => [formatDateForExport(entry.date), entry.weight]);

  const csv = convertToCSV(headers, rows);
  const filename = `weight-entries-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export body measurements to CSV
 */
export const exportBodyMeasurementsToCSV = (measurements: BodyMeasurement[]) => {
  if (measurements.length === 0) {
    alert('No body measurements to export');
    return;
  }

  // Sort measurements by date ascending
  const sortedMeasurements = [...measurements].sort((a, b) => {
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

  const headers = ['Date', 'Waist (cm)', 'Bicep (cm)', 'Thigh (cm)'];
  const rows = sortedMeasurements.map((measurement) => [
    formatDateForExport(measurement.date),
    measurement.waist || '-',
    measurement.bicep || '-',
    measurement.thigh || '-',
  ]);

  const csv = convertToCSV(headers, rows);
  const filename = `body-measurements-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export comprehensive summary report to CSV
 */
export const exportSummaryReport = (
  profile: User | null,
  weightEntries: WeightEntry[],
  bodyMeasurements: BodyMeasurement[]
) => {
  const reportData: string[] = [];

  // Header
  reportData.push('Weight Tracker - Summary Report');
  reportData.push(`Generated: ${new Date().toLocaleString()}`);
  reportData.push('');

  // Profile Information
  reportData.push('=== PROFILE INFORMATION ===');
  if (profile) {
    reportData.push(`Name: ${profile.name || 'Not set'}`);
    reportData.push(`Email: ${profile.email}`);
    reportData.push(`Age: ${profile.age || 'Not set'}`);
    reportData.push(`Height: ${profile.height ? `${profile.height} cm` : 'Not set'}`);
    reportData.push(`Goal Weight: ${profile.goalWeight ? `${profile.goalWeight} kg` : 'Not set'}`);
  } else {
    reportData.push('No profile data available');
  }
  reportData.push('');

  // Weight Statistics
  reportData.push('=== WEIGHT STATISTICS ===');
  if (weightEntries.length > 0) {
    const sortedWeights = [...weightEntries].sort((a, b) => {
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

    const firstEntry = sortedWeights[0];
    const lastEntry = sortedWeights[sortedWeights.length - 1];
    const totalChange = lastEntry.weight - firstEntry.weight;

    reportData.push(`Total Entries: ${weightEntries.length}`);
    reportData.push(`Starting Weight: ${firstEntry.weight} kg`);
    reportData.push(`Current Weight: ${lastEntry.weight} kg`);
    reportData.push(
      `Total Change: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg (${totalChange > 0 ? 'Gained' : 'Lost'})`
    );

    // Calculate average
    const sum = weightEntries.reduce((acc, entry) => acc + entry.weight, 0);
    const avg = sum / weightEntries.length;
    reportData.push(`Average Weight: ${avg.toFixed(1)} kg`);

    // Calculate min/max
    const weights = weightEntries.map((e) => e.weight);
    reportData.push(`Minimum Weight: ${Math.min(...weights).toFixed(1)} kg`);
    reportData.push(`Maximum Weight: ${Math.max(...weights).toFixed(1)} kg`);
  } else {
    reportData.push('No weight entries available');
  }
  reportData.push('');

  // Body Measurements Statistics
  reportData.push('=== BODY MEASUREMENTS STATISTICS ===');
  if (bodyMeasurements.length > 0) {
    reportData.push(`Total Measurements: ${bodyMeasurements.length}`);

    const sortedMeasurements = [...bodyMeasurements].sort((a, b) => {
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

    const firstMeasurement = sortedMeasurements[0];
    const lastMeasurement = sortedMeasurements[sortedMeasurements.length - 1];

    if (firstMeasurement.waist !== null && lastMeasurement.waist !== null) {
      const waistChange = lastMeasurement.waist - firstMeasurement.waist;
      reportData.push(`Waist Change: ${waistChange > 0 ? '+' : ''}${waistChange.toFixed(1)} cm`);
    }
    if (firstMeasurement.bicep !== null && lastMeasurement.bicep !== null) {
      const bicepChange = lastMeasurement.bicep - firstMeasurement.bicep;
      reportData.push(`Bicep Change: ${bicepChange > 0 ? '+' : ''}${bicepChange.toFixed(1)} cm`);
    }
    if (firstMeasurement.thigh !== null && lastMeasurement.thigh !== null) {
      const thighChange = lastMeasurement.thigh - firstMeasurement.thigh;
      reportData.push(`Thigh Change: ${thighChange > 0 ? '+' : ''}${thighChange.toFixed(1)} cm`);
    }
  } else {
    reportData.push('No body measurements available');
  }
  reportData.push('');

  // Recent Weight Entries (last 10)
  reportData.push('=== RECENT WEIGHT ENTRIES (Last 10) ===');
  if (weightEntries.length > 0) {
    const sortedWeights = [...weightEntries].sort((a, b) => {
      const dateA =
        typeof a.date === 'object' && 'toDate' in a.date && a.date.toDate
          ? a.date.toDate().getTime()
          : new Date(a.date as unknown as Date).getTime();
      const dateB =
        typeof b.date === 'object' && 'toDate' in b.date && b.date.toDate
          ? b.date.toDate().getTime()
          : new Date(b.date as unknown as Date).getTime();
      return dateB - dateA; // Descending for recent first
    });

    const recent = sortedWeights.slice(0, 10);
    reportData.push('Date,Weight (kg)');
    recent.forEach((entry) => {
      reportData.push(`${formatDateForExport(entry.date)},${entry.weight}`);
    });
  } else {
    reportData.push('No weight entries available');
  }
  reportData.push('');

  // Footer
  reportData.push('=== END OF REPORT ===');

  const content = reportData.join('\n');
  const filename = `weight-tracker-summary-${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(content, filename, 'text/plain;charset=utf-8;');
};
