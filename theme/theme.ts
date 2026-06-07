'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Shared (mode-independent) theme options
const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '2.5rem', fontWeight: 600 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    // Larger default touch targets for mobile (>=44px recommended)
    MuiIconButton: {
      styleOverrides: {
        root: { padding: 10 },
      },
    },
  },
};

/**
 * Build a theme for the given color mode (light/dark).
 */
export const getTheme = (mode: PaletteMode) =>
  createTheme({
    ...baseOptions,
    palette: {
      mode,
      primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0', contrastText: '#ffffff' },
      secondary: { main: '#9c27b0', light: '#ba68c8', dark: '#7b1fa2', contrastText: '#ffffff' },
      success: { main: '#2e7d32', light: '#4caf50', dark: '#1b5e20' },
      error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
      ...(mode === 'light'
        ? { background: { default: '#fafafa', paper: '#ffffff' } }
        : { background: { default: '#121212', paper: '#1e1e1e' } }),
    },
    components: {
      ...baseOptions.components,
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.5)',
          },
        },
      },
    },
  });

export const theme = getTheme('light');
export default theme;
