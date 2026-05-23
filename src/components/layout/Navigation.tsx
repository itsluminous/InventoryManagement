'use client';

import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  AccountCircle,
  ExitToApp,
  Assessment,
  List as ListIcon,
  Home,
} from '@mui/icons-material';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme as useCustomTheme } from '@/lib/theme/ThemeProvider';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { Logo } from '@/components/branding';
import { SyncStatus } from './SyncStatus';

export function Navigation() {
  const { mode, toggleColorMode } = useCustomTheme();
  const { user, signOut } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    handleClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    handleClose();
  };

  const handleLogoClick = () => {
    router.push('/');
  };

  // Determine which contextual navigation icon to show
  const getContextualNavigation = () => {
    if (pathname === '/masterlist') {
      return {
        icon: <Home />,
        label: 'Go to Inventory',
        path: '/',
      };
    } else {
      return {
        icon: <ListIcon />,
        label: 'Go to Masterlist',
        path: '/masterlist',
      };
    }
  };

  const contextualNav = getContextualNavigation();

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Logo
            variant="auto"
            size="medium"
            responsive={true}
            onClick={handleLogoClick}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SyncStatus />

          {/* Contextual Navigation Icon */}
          <IconButton
            onClick={() => router.push(contextualNav.path)}
            color="inherit"
            size="large"
            aria-label={contextualNav.label}
            title={contextualNav.label}
          >
            {contextualNav.icon}
          </IconButton>

          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
            aria-label="account menu"
          >
            <AccountCircle />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
              },
            }}
          >
            {/* User info */}
            <MenuItem
              disabled
              sx={{
                '&.Mui-disabled': {
                  opacity: 1, // Override default disabled opacity
                  '& .MuiListItemIcon-root': {
                    color: 'text.primary', // Use primary text color instead of disabled color
                  },
                  '& .MuiListItemText-root .MuiTypography-root': {
                    color: 'text.primary', // Use primary text color for better visibility
                  },
                },
              }}
            >
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2" noWrap>
                  {user?.user_metadata?.full_name || user?.email}
                </Typography>
              </ListItemText>
            </MenuItem>

            <Divider />

            {/* Theme Toggle */}
            <MenuItem onClick={toggleColorMode}>
              <ListItemIcon>
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </ListItemIcon>
              <ListItemText>
                {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </ListItemText>
            </MenuItem>

            {/* Reports - kept in profile menu */}
            <MenuItem onClick={() => handleNavigation('/reports')}>
              <ListItemIcon>
                <Assessment />
              </ListItemIcon>
              <ListItemText>Reports</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <ExitToApp />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
