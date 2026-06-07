import type { Metadata, Viewport } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Box from '@mui/material/Box';
import ColorModeProvider from '@/theme/ColorModeProvider';
import SnackbarProvider from '@/components/SnackbarProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import PWARegister from '@/components/PWARegister';
import BottomNav from '@/components/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'Weight Tracker - Track Your Fitness Journey',
  description: 'Track your weight, body measurements, and progress with photos and videos',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Weight Tracker',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00E5FF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <PWARegister />
        <AppRouterCacheProvider>
          <ColorModeProvider>
            <SnackbarProvider>
              <AuthProvider>
                {/* Bottom padding on mobile so content clears the fixed bottom nav */}
                <Box sx={{ pb: { xs: 7, md: 0 } }}>{children}</Box>
                <BottomNav />
                <InstallPrompt />
              </AuthProvider>
            </SnackbarProvider>
          </ColorModeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
