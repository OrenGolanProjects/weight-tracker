'use client';

import { Box, Container, Skeleton, Card, CardContent } from '@mui/material';

/**
 * Skeleton placeholder shown while the dashboard loads — avoids a blank
 * full-screen spinner and reduces perceived load time on mobile.
 */
export default function DashboardSkeleton() {
  return (
    <Box>
      <Skeleton variant="rectangular" height={64} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="text" width="50%" height={48} />
        <Skeleton variant="text" width="30%" height={28} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={96} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' } }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="50%" />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
        <Skeleton variant="rounded" height={280} />
      </Container>
    </Box>
  );
}
