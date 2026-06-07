'use client';

import type { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Friendly empty-state with an optional call-to-action, used in place of bare
 * "No data" text so a new user always has an obvious next step.
 */
export default function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      {icon && (
        <Box sx={{ mb: 1.5, color: 'text.disabled', '& svg': { fontSize: 56 } }}>{icon}</Box>
      )}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
