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
import { useRouter } from 'next/navigation';
import { useTheme as useCustomTheme } from '@/lib/theme/ThemeProvider';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { Logo } from '@/components/branding';
import { SyncStatus } from './SyncStatus';

export function Navigation() {
  const { mode, toggleColorMode } = useCustomTheme();
  const { user, signOut } = useAuthContext();
  const router = useRouter();
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

          <IconButton
            onClick={toggleColorMode}
            color="inherit"
            size="large"
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
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

            {/* Navigation items */}
            <MenuItem onClick={() => handleNavigation('/')}>
              <ListItemIcon>
                <Home />
              </ListItemIcon>
              <ListItemText>Home</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => handleNavigation('/reports')}>
              <ListItemIcon>
                <Assessment />
              </ListItemIcon>
              <ListItemText>Reports</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => handleNavigation('/masterlist')}>
              <ListItemIcon>
                <ListIcon />
              </ListItemIcon>
              <ListItemText>Masterlist</ListItemText>
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
