'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import StraightenIcon from '@mui/icons-material/Straighten';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { label: 'Home', value: 'home', path: '/', icon: <HomeIcon /> },
  { label: 'Weight', value: 'weight', path: '/weight/history', icon: <MonitorWeightIcon /> },
  {
    label: 'Measure',
    value: 'measurements',
    path: '/measurements/history',
    icon: <StraightenIcon />,
  },
  { label: 'Media', value: 'media', path: '/media', icon: <PhotoLibraryIcon /> },
  { label: 'Meals', value: 'meals', path: '/meals', icon: <RestaurantIcon /> },
];

function sectionFromPath(pathname: string): string {
  if (pathname.startsWith('/weight')) return 'weight';
  if (pathname.startsWith('/measurements')) return 'measurements';
  if (pathname.startsWith('/media')) return 'media';
  if (pathname.startsWith('/meals')) return 'meals';
  if (pathname === '/') return 'home';
  return '';
}

export default function BottomNav() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Hide for logged-out users and on the login screen.
  if (!user || pathname === '/login') return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        display: { xs: 'block', md: 'none' }, // mobile-only
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={sectionFromPath(pathname)}
        onChange={(_e, value) => {
          const target = NAV.find((n) => n.value === value);
          if (target) router.push(target.path);
        }}
      >
        {NAV.map((n) => (
          <BottomNavigationAction key={n.value} label={n.label} value={n.value} icon={n.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
