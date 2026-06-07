'use client';

import { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Forces the PWA to update: unregisters the service worker, clears all caches,
 * then reloads so the latest deployed build is fetched fresh.
 */
export default function UpdateAppButton() {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (err) {
      console.error('App update failed:', err);
    } finally {
      // Reload to fetch the freshly-deployed assets.
      window.location.reload();
    }
  };

  return (
    <Tooltip title="Update app (clear cache & reload)">
      <span>
        <IconButton
          color="inherit"
          onClick={handleUpdate}
          disabled={updating}
          aria-label="Update app"
        >
          {updating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
