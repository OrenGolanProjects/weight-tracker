'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PaletteMode } from '@mui/material';
import { getTheme } from './theme';

interface ColorModeContextValue {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

const STORAGE_KEY = 'colorMode';

export default function ColorModeProvider({ children }: { children: React.ReactNode }) {
  // Default to 'light' on the server / first paint to avoid hydration mismatch,
  // then sync to the saved preference or the OS setting after mount.
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as PaletteMode | null;
    const initial: PaletteMode =
      saved === 'light' || saved === 'dark'
        ? saved
        : window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync of persisted/OS color preference on mount
    setMode(initial);
  }, []);

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          try {
            localStorage.setItem(STORAGE_KEY, next);
          } catch {
            // ignore storage errors (private mode, etc.)
          }
          return next;
        }),
    }),
    [mode]
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
