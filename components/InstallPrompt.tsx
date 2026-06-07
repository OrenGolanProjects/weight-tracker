'use client';

import { useEffect, useState } from 'react';
import { Snackbar, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Shows a dismissible "Install app" prompt when the browser reports the PWA is
 * installable (Chrome/Android). No-op if already installed or unsupported (iOS
 * Safari requires the manual Share → Add to Home Screen flow).
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    setOpen(false);
    setDeferred(null);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 72, md: 24 } }}
      message="Install Weight Tracker for a fullscreen app experience"
      action={
        <>
          <Button color="secondary" size="small" onClick={install}>
            Install
          </Button>
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setOpen(false)}
            aria-label="Dismiss"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      }
    />
  );
}
